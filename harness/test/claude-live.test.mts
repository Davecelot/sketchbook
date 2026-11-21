// Opt-in: inspect the real Claude Code request without using a model account.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, realpath, rename, rm, symlink, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { ROOT } from './helpers.mjs';

const exec = promisify(execFile);

test('Claude Code advertises native wrappers installed by Sketchbook alongside its project instructions', { skip: process.env.SKETCHBOOK_TEST_CLAUDE_LIVE !== '1', timeout: 30000 }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sketchbook-claude-live-'));
  let request = '';
  const server = createServer((req, res) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk: string) => { body += chunk; });
    req.on('end', () => {
      if (!req.url?.startsWith('/v1/messages')) { res.writeHead(404).end(); return; }
      request = body;
      const events: [string, object][] = [
        ['message_start', { type: 'message_start', message: { id: 'msg_test', type: 'message', role: 'assistant', model: 'claude-test', content: [], stop_reason: null, usage: { input_tokens: 1, output_tokens: 1 } } }],
        ['content_block_start', { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } }],
        ['content_block_delta', { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'OK' } }],
        ['content_block_stop', { type: 'content_block_stop', index: 0 }],
        ['message_delta', { type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 1 } }],
        ['message_stop', { type: 'message_stop' }],
      ];
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      for (const [event, data] of events) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      res.end();
    });
  });
  try {
    await exec(process.execPath, [join(ROOT, 'harness/cli.mjs'), 'init', '--start', 'blank', '--agent', 'claude', '--no-install'], { cwd: dir });
    await mkdir(join(dir, 'config'));
    // Activate only the skill directories here. The separate hook test activates the edit hooks.
    await mkdir(join(dir, '.claude'));
    await rename(join(dir, 'move-to-.claude/skills'), join(dir, '.claude/skills'));
    await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const env = { ...process.env };
    for (const key of Object.keys(env)) if (/^(ANTHROPIC_|CLAUDE_|AWS_|GOOGLE_CLOUD_|VERTEX_)|_PROXY$/i.test(key)) delete env[key];
    Object.assign(env, { CLAUDE_CONFIG_DIR: join(dir, 'config'), ANTHROPIC_BASE_URL: `http://127.0.0.1:${address.port}`, ANTHROPIC_API_KEY: 'dummy', DISABLE_TELEMETRY: '1', DISABLE_AUTOUPDATER: '1', CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1' });
    const result = await exec('claude', ['-p', 'Respond to the test.', '--model', 'claude-sonnet-4-5', '--no-session-persistence', '--setting-sources', 'project', '--strict-mcp-config'], { cwd: dir, env, timeout: 20000 });
    assert.match(result.stdout, /OK/);
    assert.match(request, /initial installation inventory/);
    assert.match(request, /docs\/harness\.md/);
    assert.match(request, /Draft, resync, or validate a component contract using the shared Sketchbook/);
    assert.match(request, /Build a component from its approved contract using the shared Sketchbook/);
  } finally {
    if (server.listening) await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await rm(dir, { recursive: true, force: true });
  }
});

test('Claude Code runs the shipped edit guards and CLI in real tool sessions', { skip: process.env.SKETCHBOOK_TEST_CLAUDE_LIVE !== '1', timeout: 90000 }, async () => {
  const dir = await realpath(await mkdtemp(join(tmpdir(), 'sketchbook-claude-hooks-')));
  let target = '';
  let content = '';
  let requests = 0;
  let toolResult = '';
  let readFirst = false;
  let runCli = false;
  const server = createServer((req, res) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk: string) => { body += chunk; });
    req.on('end', () => {
      if (!req.url?.startsWith('/v1/messages')) { res.writeHead(404).end(); return; }
      requests++;
      if (requests > 1) {
        const parsed = JSON.parse(body) as { messages: unknown[] };
        toolResult = JSON.stringify(parsed.messages.at(-1));
      }
      const tool = requests <= (readFirst ? 2 : 1);
      const read = readFirst && requests === 1;
      const toolInput = runCli ? { command: `node ${JSON.stringify(join(ROOT, 'harness/cli.mjs'))} help --json` } : read ? { file_path: target } : { file_path: target, content };
      const events: [string, object][] = [
        ['message_start', { type: 'message_start', message: { id: 'msg_test', type: 'message', role: 'assistant', model: 'claude-test', content: [], stop_reason: null, usage: { input_tokens: 1, output_tokens: 1 } } }],
        ['content_block_start', { type: 'content_block_start', index: 0, content_block: tool ? { type: 'tool_use', id: `toolu_test_${requests}`, name: runCli ? 'Bash' : read ? 'Read' : 'Write', input: {} } : { type: 'text', text: '' } }],
        ['content_block_delta', { type: 'content_block_delta', index: 0, delta: tool ? { type: 'input_json_delta', partial_json: JSON.stringify(toolInput) } : { type: 'text_delta', text: 'OK' } }],
        ['content_block_stop', { type: 'content_block_stop', index: 0 }],
        ['message_delta', { type: 'message_delta', delta: { stop_reason: tool ? 'tool_use' : 'end_turn', stop_sequence: null }, usage: { output_tokens: 1 } }],
        ['message_stop', { type: 'message_stop' }],
      ];
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      for (const [event, data] of events) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      res.end();
    });
  });
  try {
    for (const folder of ['config', '.claude/hooks', 'generated', 'src', 'spec/decisions']) await mkdir(join(dir, folder), { recursive: true });
    for (const file of ['run.mjs', 'guard-generated.mjs', 'guard-decisions.mjs']) await cp(join(ROOT, '.claude/hooks', file), join(dir, '.claude/hooks', file));
    const template = JSON.parse(await readFile(join(ROOT, 'harness/templates/project/.claude/settings.json'), 'utf8')) as { hooks: { PreToolUse: { hooks: { command: string }[] }[] } };
    const groups = template.hooks.PreToolUse.filter((group) => group.hooks.some((hook) => /hooks\/guard-(generated|decisions)/.test(hook.command)));
    assert.equal(groups.length, 2);
    const settings = join(dir, '.claude/settings.json');
    await writeFile(settings, JSON.stringify({ hooks: { PreToolUse: groups } }));
    const decisions = '# Decisions\n\n### SB-0001 · 2026-01-01 · Example\n**Status:** accepted\n**Decision:** Keep it.\n';
    const decisionFile = join(dir, 'spec/decisions/DECISIONS.md');
    await writeFile(decisionFile, decisions);
    await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const env = { ...process.env };
    for (const key of Object.keys(env)) if (/^(ANTHROPIC_|CLAUDE_|AWS_|GOOGLE_CLOUD_|VERTEX_)|_PROXY$/i.test(key)) delete env[key];
    Object.assign(env, { CLAUDE_CONFIG_DIR: join(dir, 'config'), ANTHROPIC_BASE_URL: `http://127.0.0.1:${address.port}`, ANTHROPIC_API_KEY: 'dummy', DISABLE_TELEMETRY: '1', DISABLE_AUTOUPDATER: '1', CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1' });
    const run = async (path: string, text: string, read = false, cli = false) => {
      target = join(dir, path); content = text; readFirst = read; runCli = cli; requests = 0; toolResult = '';
      await exec('claude', ['-p', 'Run the requested test.', '--model', 'claude-sonnet-4-5', '--no-session-persistence', '--setting-sources', 'project', '--strict-mcp-config', '--allowedTools', 'Read,Write,Bash'], { cwd: dir, env, timeout: 15000 });
      assert.ok(requests >= 2, 'Claude sent the tool result back to the mock API');
    };
    await run('generated/blocked.css', 'blocked');
    assert.match(toolResult, /Blocked/);
    await assert.rejects(readFile(join(dir, 'generated/blocked.css')));
    await symlink(dir, join(dir, 'alias'), 'dir');
    await run('alias/generated/blocked-alias.css', 'blocked');
    assert.match(toolResult, /Blocked/);
    await assert.rejects(readFile(join(dir, 'generated/blocked-alias.css')));
    await run('spec/decisions/DECISIONS.md', '# Removed\n', true);
    assert.match(toolResult, /Blocked/);
    assert.equal(await readFile(decisionFile, 'utf8'), decisions);
    await symlink(decisionFile, join(dir, 'decisions-alias.md'));
    await run('decisions-alias.md', '# Removed\n', true);
    assert.match(toolResult, /Blocked/);
    assert.equal(await readFile(decisionFile, 'utf8'), decisions);
    await run('src/allowed.ts', 'allowed');
    assert.equal(await readFile(join(dir, 'src/allowed.ts'), 'utf8'), 'allowed');
    await run('.', '', false, true);
    const returned = JSON.parse(toolResult) as { content: { content?: string; is_error?: boolean }[] };
    assert.notEqual(returned.content[0]?.is_error, true);
    assert.match(returned.content[0]?.content ?? '', /"command"\s*:\s*"help"/);
    await rm(settings);
    await run('generated/no-hook.css', 'control');
    assert.equal(await readFile(join(dir, 'generated/no-hook.css'), 'utf8'), 'control');
  } finally {
    if (server.listening) await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await rm(dir, { recursive: true, force: true });
  }
});
