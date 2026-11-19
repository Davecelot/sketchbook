// Opt-in: inspect a real OpenCode session with a local mock model and isolated configuration.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile, spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ROOT } from './helpers.mjs';

test('OpenCode discovers nested guidance and invokes the CLI', { skip: process.env.SKETCHBOOK_TEST_OPENCODE_LIVE !== '1', timeout: 90000 }, async () => {
  const temp = await mkdtemp(join(tmpdir(), 'sketchbook-opencode-live-'));
  const repo = join(temp, 'app');
  const project = join(repo, 'design-system');
  let requests: string[] = [];
  let runCli = false;
  let clientOutput = '';
  let sentTool = false;
  const server = createServer((req, res) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk: string) => { body += chunk; });
    req.on('end', () => {
      requests.push(body);
      const parsed = JSON.parse(body) as { tools?: unknown[] };
      // OpenCode may first request a session title without any tools.
      const tool = runCli && !sentTool && Boolean(parsed.tools?.length);
      if (tool) sentTool = true;
      const delta = tool ? { role: 'assistant', tool_calls: [{ index: 0, id: 'call_test', type: 'function', function: { name: 'bash', arguments: JSON.stringify({ command: 'node node_modules/sketchbook/harness/cli.mjs help --json', description: 'Inspect Sketchbook CLI help' }) } }] } : { role: 'assistant', content: 'Test completed.' };
      const chunks = [
        { id: 'chat-test', object: 'chat.completion.chunk', created: 1, model: 'local', choices: [{ index: 0, delta, finish_reason: null }] },
        { id: 'chat-test', object: 'chat.completion.chunk', created: 1, model: 'local', choices: [{ index: 0, delta: {}, finish_reason: tool ? 'tool_calls' : 'stop' }], usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 } },
      ];
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      res.end(chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join('') + 'data: [DONE]\n\n');
    });
  });
  try {
    await mkdir(join(project, '.agents/skills/sketchbook'), { recursive: true });
    await mkdir(join(project, 'node_modules'));
    await symlink(ROOT, join(project, 'node_modules/sketchbook'), 'dir');
    assert.equal(spawnSync('git', ['init', '-q', repo]).status, 0);
    await writeFile(join(repo, 'AGENTS.md'), 'HOST_PROJECT_GUIDANCE: preserve the app.\n');
    await cp(join(ROOT, 'harness/templates/project/AGENTS.md'), join(project, 'AGENTS.md'));
    await cp(join(ROOT, 'harness/templates/project/.agents/skills/sketchbook/SKILL.md'), join(project, '.agents/skills/sketchbook/SKILL.md'));
    await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    await writeFile(join(repo, 'opencode.json'), JSON.stringify({ model: 'mock/local', providers: { mock: { name: 'Local mock', package: '@opencode/ai/providers/openai-compatible', settings: { baseURL: `http://127.0.0.1:${address.port}/v1`, apiKey: 'local-test' }, models: { local: { name: 'Local test', capabilities: { tools: true, input: ['text'], output: ['text'] }, limit: { context: 32768, output: 4096 } } } } } }));
    const env: NodeJS.ProcessEnv = { ...process.env };
    for (const key of Object.keys(env)) if (/^(OPENAI_|ANTHROPIC_|GH_|GITHUB_|OPENCODE_|GOOGLE_)|_PROXY$/i.test(key)) delete env[key];
    for (const name of ['CONFIG', 'DATA', 'CACHE', 'STATE']) {
      const dir = join(temp, name.toLowerCase());
      await mkdir(dir);
      env[`XDG_${name}_HOME`] = dir;
    }
    Object.assign(env, { OPENCODE_DISABLE_CLAUDE_CODE: '1', OPENCODE_DISABLE_MODELS_FETCH: '1', OPENCODE_DISABLE_AUTOUPDATE: '1', HTTP_PROXY: 'http://127.0.0.1:9', HTTPS_PROXY: 'http://127.0.0.1:9', NO_PROXY: '127.0.0.1,localhost' });
    const binary = process.env.SKETCHBOOK_TEST_OPENCODE_BIN || 'opencode';
    const run = async (cwd: string) => {
      requests = []; sentTool = false;
      const localEnv = { ...env, PWD: cwd };
      await new Promise<void>((resolve, reject) => {
        const child = execFile(binary, ['run', '--standalone', '--model', 'mock/local', 'change a Sketchbook component'], { cwd, env: localEnv, timeout: 30000 }, (error, stdout, stderr) => { clientOutput = `${stdout}\n${stderr}`; if (error) reject(error instanceof Error ? error : new Error('CLI process failed')); else resolve(); });
        child.stdin?.end();
      });
      assert.ok(requests.length > 0, 'the local mock provider received a request');
      return requests.join('\n');
    };
    const rootInput = await run(repo);
    assert.match(rootInput, /HOST_PROJECT_GUIDANCE/);
    assert.doesNotMatch(rootInput, /This project uses the Sketchbook CLI and a contract-first design system/);
    assert.doesNotMatch(rootInput, /Work on a Sketchbook design-system project/);
    const nestedInput = await run(project);
    assert.match(nestedInput, /HOST_PROJECT_GUIDANCE/);
    assert.match(nestedInput, /This project uses the Sketchbook CLI and a contract-first design system/);
    assert.match(nestedInput, /Work on a Sketchbook design-system project/);
    runCli = true;
    await run(project);
    assert.ok(sentTool, 'the mock provider requested the shell tool');
    assert.match(clientOutput, /"command"\s*:\s*"help"/, `OpenCode output: ${clientOutput.slice(-1000)}`);
  } finally {
    if (server.listening) await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await rm(temp, { recursive: true, force: true });
  }
});
