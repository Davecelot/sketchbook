// Opt-in integration test: a local mock model drives Codex's real tool and hook runtime.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile, spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ROOT } from './helpers.mjs';


test('Codex runs the patch guard and CLI for a trusted nested project', { skip: process.env.SKETCHBOOK_TEST_CODEX_LIVE !== '1', timeout: 60000 }, async () => {
  const temp = await mkdtemp(join(tmpdir(), 'sketchbook-codex-live-'));
  const project = join(temp, 'project');
  const config = join(temp, 'codex-config');
  let target = '';
  let requests = 0;
  let runCli = false;
  let toolResult = '';
  const server = createServer((req, res) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk: string) => { body += chunk; });
    req.on('end', () => {
      requests++;
      if (requests > 1) toolResult = body;
      const item = requests === 1
        ? runCli
          ? { type: 'function_call', id: 'fc_123', call_id: 'call_123', name: 'exec_command', arguments: JSON.stringify({ cmd: `node '${join(ROOT, 'harness/cli.mjs').replace(/'/g, "'\\''")}' help --json` }) }
          : { type: 'custom_tool_call', id: 'ct_123', call_id: 'call_123', name: 'apply_patch', input: `*** Begin Patch\n*** Add File: ${target}\n+test content\n*** End Patch` }
        : { id: 'msg_123', type: 'message', status: 'completed', role: 'assistant', content: [{ type: 'output_text', text: 'Test completed.', annotations: [] }] };
      const events = [
        { type: 'response.created', response: { id: 'resp_123', object: 'response', created_at: 1, status: 'in_progress', output: [] } },
        { type: 'response.output_item.done', output_index: 0, item },
        { type: 'response.completed', response: { id: 'resp_123', object: 'response', created_at: 1, status: 'completed', output: [item], usage: { input_tokens: 10, output_tokens: 10, total_tokens: 20 } } },
      ];
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      res.end(events.map((event) => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join(''));
    });
  });
  try {
    await mkdir(join(project, '.codex'), { recursive: true });
    for (const folder of ['generated', 'src']) await mkdir(join(project, folder));
    await mkdir(config);
    await cp(join(ROOT, 'harness/templates/project/.codex/hooks.json'), join(project, '.codex/hooks.json'));
    await cp(join(ROOT, 'harness/templates/project/.codex/sketchbook-guard.mjs'), join(project, '.codex/sketchbook-guard.mjs'));
    assert.equal(spawnSync('git', ['init', '-q', temp]).status, 0);
    await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    await writeFile(join(config, 'config.toml'), `model_provider = "mock"\nmodel = "gpt-6.1-sol"\n[model_providers.mock]\nname = "mock"\nbase_url = "http://127.0.0.1:${address.port}/v1"\nwire_api = "responses"\n`);
    const env: NodeJS.ProcessEnv = { ...process.env };
    for (const key of Object.keys(env)) if (/^(OPENAI_|ANTHROPIC_|GH_|GITHUB_|CODEX_)|_PROXY$/i.test(key)) delete env[key];
    env.CODEX_HOME = config;
    const run = async (file: string, cwd = project, cli = false) => {
      target = file; requests = 0; runCli = cli; toolResult = '';
      const result = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
        const child = execFile('codex', ['exec', '--ephemeral', '--trust', '--skip-git-repo-check', '--dangerously-bypass-hook-trust', '--sandbox', 'workspace-write', '--json', 'Create the requested test file.'], { cwd, env, timeout: 25000 }, (error, stdout, stderr) => error ? reject(error instanceof Error ? error : new Error('CLI process failed')) : resolve({ stdout, stderr }));
        child.stdin?.end();
      });
      assert.equal(requests, 2, 'the mock model receives the patch result');
      return result;
    };
    const blocked = await run('generated/test.css');
    assert.match(blocked.stderr, /blocked by PreToolUse hook/i);
    await assert.rejects(readFile(join(project, 'generated/test.css')));
    const subdirectory = await run('../generated/subdir.css', join(project, 'src'));
    assert.match(subdirectory.stderr, /blocked by PreToolUse hook/i);
    await assert.rejects(readFile(join(project, 'generated/subdir.css')));
    await run('src/test.ts');
    assert.equal(await readFile(join(project, 'src/test.ts'), 'utf8'), 'test content\n');
    await run('', project, true);
    const parsed = JSON.parse(toolResult) as { input: { type?: string; output?: string }[] };
    const result = parsed.input.find((entry) => entry.type === 'function_call_output')?.output ?? '';
    assert.match(result, /"command"\s*:\s*"help"/);
    await rm(join(project, '.codex/hooks.json'));
    await run('generated/no-hook.css');
    assert.equal(await readFile(join(project, 'generated/no-hook.css'), 'utf8'), 'test content\n');
  } finally {
    if (server.listening) await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await rm(temp, { recursive: true, force: true });
  }
});
