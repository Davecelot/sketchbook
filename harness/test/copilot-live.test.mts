// Opt-in integration test: a local mock model drives the installed Copilot CLI's real hook loader.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile, spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { ROOT } from './helpers.mjs';

const exec = promisify(execFile);

test('installed Copilot CLI loads instructions and hooks from the tested workspace', { skip: process.env.SKETCHBOOK_TEST_COPILOT_LIVE !== '1', timeout: 60000 }, async () => {
  const repo = await mkdtemp(join(tmpdir(), 'sketchbook-copilot-live-'));
  const project = join(repo, 'design-system');
  let tool = 'create';
  let toolArgs: Record<string, string> = {};
  let requests = 0;
  let firstRequest = '';
  let toolResponse = '';
  const server = createServer((req, res) => {
    let text = '';
    req.setEncoding('utf8');
    req.on('data', (chunk: string) => { text += chunk; });
    req.on('end', () => {
      try {
        const body = JSON.parse(text) as { messages: { role: string; content?: string }[] };
        requests++;
        if (requests === 1) firstRequest = text;
        const hasToolResult = body.messages.some((message) => message.role === 'tool');
        if (hasToolResult) toolResponse = body.messages.filter((message) => message.role === 'tool').at(-1)?.content ?? '';
        const message = hasToolResult || requests > 3
          ? { role: 'assistant', content: 'Test completed.' }
          : { role: 'assistant', content: null, tool_calls: [{ id: 'call_test', type: 'function', function: { name: tool, arguments: JSON.stringify(toolArgs) } }] };
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ id: 'local-test', object: 'chat.completion', created: 1, model: 'gpt-4.1', choices: [{ index: 0, message, finish_reason: hasToolResult || requests > 3 ? 'stop' : 'tool_calls' }], usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 } }));
      } catch { res.writeHead(400); res.end(); }
    });
  });
  try {
    await mkdir(join(project, '.github/hooks'), { recursive: true });
    for (const folder of ['node_modules', 'generated', 'src']) await mkdir(join(project, folder));
    await mkdir(join(project, 'spec/decisions'), { recursive: true });
    const decisions = '# Decisions\n\n### SB-0001 · 2026-01-01 · Example\n**Status:** accepted\n**Decision:** Keep it.\n';
    const decisionFile = join(project, 'spec/decisions/DECISIONS.md');
    await writeFile(decisionFile, decisions);
    await mkdir(join(repo, '.github/hooks'), { recursive: true });
    await symlink(ROOT, join(project, 'node_modules/sketchbook'), 'dir');
    await cp(join(ROOT, 'harness/templates/project/.github/hooks/sketchbook-guard.mjs'), join(project, '.github/hooks/sketchbook-guard.mjs'));
    await cp(join(ROOT, 'harness/templates/project/.github/hooks/sketchbook.json'), join(project, '.github/hooks/sketchbook.json'));
    await cp(join(ROOT, 'harness/templates/project/.github/copilot-instructions.md'), join(project, '.github/copilot-instructions.md'));
    await cp(join(ROOT, 'harness/templates/project/AGENTS.md'), join(project, 'AGENTS.md'));
    const docs = await readFile(join(ROOT, 'docs/agent-compatibility.md'), 'utf8');
    const section = docs.split('## Copilot repository hooks for an adopted app')[1]?.split('## Model-family test targets')[0] ?? '';
    const config = /```json\n([\s\S]*?)\n```/.exec(section)?.[1];
    assert.ok(config);
    await writeFile(join(repo, '.github/hooks/sketchbook.json'), config);
    assert.equal(spawnSync('git', ['init', '-q', repo]).status, 0);
    await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const env = { ...process.env };
    for (const key of Object.keys(env)) if (/^(GITHUB_|GH_|COPILOT_|OPENAI_|ANTHROPIC_)|_PROXY$/i.test(key)) delete env[key];
    Object.assign(env, { COPILOT_HOME: join(repo, 'copilot-home'), GH_CONFIG_DIR: join(repo, 'gh-config'), COPILOT_PROVIDER_BASE_URL: `http://127.0.0.1:${address.port}/v1`, COPILOT_MODEL: 'gpt-4.1', COPILOT_PROVIDER_TYPE: 'openai', NO_COLOR: '1' });
    const run = async (file: string, operation = 'create', cwd = repo) => {
      const target = join(project, file);
      tool = operation;
      toolArgs = operation === 'bash' ? { command: 'node node_modules/sketchbook/harness/cli.mjs help --json' } : operation === 'edit' ? { path: target, old_str: 'Keep it.', new_str: 'Changed.' } : { path: target, file_text: 'test content' };
      requests = 0; firstRequest = ''; toolResponse = '';
      const result = await exec('copilot', ['--trust-folder', '--disable-builtin-mcps', '--disable-client-telemetry', '--allow-all-tools', '--allow-all-paths', '--log-dir', join(repo, 'logs'), '--stream', 'off', '-p', 'Create the requested test file.'], { cwd, env, timeout: 25000 });
      assert.ok(requests >= 2, 'the local mock model received the tool result');
      return result.stdout;
    };
    const blocked = await run('generated/new.css');
    assert.match(blocked, /Denied by preToolUse hook/);
    await assert.rejects(readFile(join(project, 'generated/new.css')));
    await run('src/new.ts');
    assert.equal(await readFile(join(project, 'src/new.ts'), 'utf8'), 'test content');
    const blockedFromProject = await run('generated/nested.css', 'create', project);
    assert.match(blockedFromProject, /Denied by preToolUse hook/);
    assert.match(firstRequest, /This project uses the Sketchbook CLI and a contract-first design system/);
    assert.match(firstRequest, /Read and follow the repository's/);
    await assert.rejects(readFile(join(project, 'generated/nested.css')));
    await run('', 'bash', project);
    assert.match(toolResponse, /"command"\s*:\s*"help"/);
    await rm(join(project, '.github/hooks/sketchbook.json'));
    const withoutNestedHook = await run('generated/nested-no-hook.css', 'create', project);
    assert.doesNotMatch(withoutNestedHook, /Denied by preToolUse hook/);
    assert.equal(await readFile(join(project, 'generated/nested-no-hook.css'), 'utf8'), 'test content');
    const blockedDecision = await run('spec/decisions/DECISIONS.md', 'edit');
    assert.match(blockedDecision, /Denied by preToolUse hook/);
    assert.equal(await readFile(decisionFile, 'utf8'), decisions);
    await rm(join(repo, '.github/hooks/sketchbook.json'));
    const unguarded = await run('generated/no-hook.css');
    assert.doesNotMatch(unguarded, /Denied by preToolUse hook/);
    assert.equal(await readFile(join(project, 'generated/no-hook.css'), 'utf8'), 'test content');
  } finally {
    if (server.listening) await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await rm(repo, { recursive: true, force: true });
  }
});
