// Opt-in: exercise the installed Gemini CLI's real tool and hook flow with a local mock API.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ROOT } from './helpers.mjs';

test('Gemini CLI runs the project edit guards in a trusted temporary workspace', { skip: process.env.SKETCHBOOK_TEST_GEMINI_LIVE !== '1', timeout: 90000 }, async () => {
  const temp = await mkdtemp(join(tmpdir(), 'sketchbook gemini live '));
  const project = join(temp, 'project with spaces');
  const home = join(temp, 'gemini-home');
  let tool = 'write_file';
  let target = '';
  let requests = 0;
  let toolFeedback = '';
  const server = createServer((req, res) => {
    let text = '';
    req.setEncoding('utf8');
    req.on('data', (chunk: string) => { text += chunk; });
    req.on('end', () => {
      try {
        if (req.url?.includes('countTokens')) { res.writeHead(200, { 'content-type': 'application/json' }); res.end('{"totalTokens":100}'); return; }
        const body = JSON.parse(text) as { contents?: { parts?: Record<string, unknown>[] }[] };
        requests++;
        const hasResult = body.contents?.some((entry) => entry.parts?.some((part) => 'functionResponse' in part));
        if (hasResult) toolFeedback = JSON.stringify(body.contents?.flatMap((entry) => entry.parts ?? []).find((part) => 'functionResponse' in part));
        const args = tool === 'run_shell_command' ? { command: 'node node_modules/sketchbook/harness/cli.mjs help --json', description: 'Inspect Sketchbook CLI help' } : tool === 'replace' ? { file_path: target, old_string: 'Keep it.', new_string: 'Changed.', instruction: 'Change the text.' } : { file_path: target, content: 'test content' };
        const part = hasResult || requests > 3 ? { text: 'Test completed.' } : { functionCall: { name: tool, args } };
        const response = { candidates: [{ content: { role: 'model', parts: [part] }, finishReason: 'STOP' }], usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 10, totalTokenCount: 20 } };
        const streaming = req.url?.includes('alt=sse');
        res.writeHead(200, { 'content-type': streaming ? 'text/event-stream' : 'application/json' });
        res.end(streaming ? `data: ${JSON.stringify(response)}\n\n` : JSON.stringify(response));
      } catch { res.writeHead(400); res.end(); }
    });
  });
  try {
    await mkdir(join(project, '.gemini'), { recursive: true });
    for (const folder of ['node_modules', 'generated', 'src']) await mkdir(join(project, folder));
    await mkdir(join(project, 'spec/decisions'), { recursive: true });
    await mkdir(join(home, '.gemini'), { recursive: true });
    await writeFile(join(home, '.gemini/settings.json'), JSON.stringify({ security: { auth: { selectedType: 'gemini-api-key' } } }));
    await symlink(ROOT, join(project, 'node_modules/sketchbook'), 'dir');
    for (const file of ['settings.json', 'sketchbook-guard.mjs']) await cp(join(ROOT, 'harness/templates/project/.gemini', file), join(project, '.gemini', file));
    const decisions = '# Decisions\n\n### SB-0001 · 2026-01-01 · Example\n**Status:** accepted\n**Decision:** Keep it.\n';
    const decisionFile = join(project, 'spec/decisions/DECISIONS.md');
    await writeFile(decisionFile, decisions);
    await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const env: NodeJS.ProcessEnv = { ...process.env };
    for (const key of Object.keys(env)) if (/^(GEMINI_|GOOGLE_|OPENAI_|ANTHROPIC_|GH_|GITHUB_)|_PROXY$/i.test(key)) delete env[key];
    Object.assign(env, { GEMINI_CLI_HOME: home, GEMINI_API_KEY: 'local-test', GOOGLE_GEMINI_BASE_URL: `http://127.0.0.1:${address.port}`, GEMINI_CLI_TRUST_WORKSPACE: 'true', GEMINI_TELEMETRY_ENABLED: 'false', NO_COLOR: '1' });
    const binary = process.env.SKETCHBOOK_TEST_GEMINI_BIN || 'gemini';
    const run = async (file: string, operation = 'write_file') => {
      target = join(project, file); tool = operation; requests = 0; toolFeedback = '';
      const result = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
        const child = execFile(binary, ['--skip-trust', '--approval-mode', operation === 'run_shell_command' ? 'yolo' : 'auto_edit', '--model', 'gemini-2.5-flash', '-p', 'Run the requested test.'], { cwd: project, env, timeout: 25000 }, (error, stdout, stderr) => error ? reject(error instanceof Error ? error : new Error('CLI process failed')) : resolve({ stdout, stderr }));
        child.stdin?.end();
      });
      assert.equal(requests, 2, 'the mock API receives the tool result');
      return result;
    };
    const blocked = await run('generated/test.css');
    assert.doesNotMatch(blocked.stderr, /Hook execution for BeforeTool: 0 succeeded, 1 failed/);
    assert.match(toolFeedback, /Blocked.*generated/);
    await assert.rejects(readFile(join(project, 'generated/test.css')));
    await run('src/test.ts');
    assert.equal(await readFile(join(project, 'src/test.ts'), 'utf8'), 'test content');
    await run('', 'run_shell_command');
    assert.match(toolFeedback, /command.{0,20}help/);
    const decision = await run('spec/decisions/DECISIONS.md', 'replace');
    assert.doesNotMatch(decision.stderr, /Hook execution for BeforeTool: 0 succeeded, 1 failed/);
    assert.match(toolFeedback, /Blocked.*SB-0001/);
    assert.equal(await readFile(decisionFile, 'utf8'), decisions);
    // An unavailable underlying guard is an operational failure, not an ordinary policy denial.
    const brokenEngine = join(temp, 'broken-engine');
    await mkdir(join(brokenEngine, 'harness/agent'), { recursive: true });
    await mkdir(join(brokenEngine, 'harness/lib'), { recursive: true });
    await cp(join(ROOT, 'harness/agent/gemini-guard.mjs'), join(brokenEngine, 'harness/agent/gemini-guard.mjs'));
    await cp(join(ROOT, 'harness/lib/files.mjs'), join(brokenEngine, 'harness/lib/files.mjs'));
    await writeFile(join(brokenEngine, 'package.json'), JSON.stringify({ name: 'sketchbook', type: 'module', exports: { './harness/*': './harness/*' } }));
    await rm(join(project, 'node_modules/sketchbook'));
    await symlink(brokenEngine, join(project, 'node_modules/sketchbook'), 'dir');
    const failure = await run('src/broken.ts');
    assert.match(failure.stderr, /Tool execution blocked/);
    await assert.rejects(readFile(join(project, 'src/broken.ts')));
    await rm(join(project, 'node_modules/sketchbook'));
    await symlink(ROOT, join(project, 'node_modules/sketchbook'), 'dir');
    await writeFile(join(project, '.gemini/settings.json'), '{}');
    await run('generated/no-hook.css');
    assert.equal(await readFile(join(project, 'generated/no-hook.css'), 'utf8'), 'test content');
  } finally {
    if (server.listening) await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await rm(temp, { recursive: true, force: true });
  }
});
