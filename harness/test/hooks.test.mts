// The Claude Code guard hooks (.claude/hooks), run as Claude Code runs them: the tool call as JSON on stdin, exit 2 blocks.
// Cases H-G1, H-D1, H-O1 and H-L1 to H-L4 in TEST.md.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { copyFile, mkdtemp, mkdir, realpath, writeFile, rm, symlink, utimes } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { ROOT, sourceRepoOnly } from './helpers.mjs';
import { dispatch } from '../cli/run.mjs';

const hook = (name: string, dir: string, call: unknown) => spawnSync('node', [join(ROOT, '.claude/hooks', name)], { input: JSON.stringify(call), env: { ...process.env, CLAUDE_PROJECT_DIR: dir }, encoding: 'utf8' });

test('the source pre-commit hook gives one advisory reminder for staged copy', sourceRepoOnly, async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'sketchbook-content-hook-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const run = (bin: string, ...args: string[]) => spawnSync(bin, args, { cwd: dir, encoding: 'utf8' });
  for (const folder of ['apps/docs/content', 'scripts', 'harness/checks', 'docs']) await mkdir(join(dir, folder), { recursive: true });
  for (const file of ['harness/checks/run.mjs', 'scripts/build-harness.mjs', 'docs/content-guidelines.md', 'docs/cli.md', 'apps/docs/content/guide.md', 'app.ts']) {
    await writeFile(join(dir, file), '');
  }
  assert.equal(run('git', 'init', '-q').status, 0);
  const preCommit = () => run('sh', join(ROOT, '.githooks/pre-commit'));
  assert.equal(run('git', 'add', 'app.ts', 'docs/cli.md').status, 0);
  assert.equal(preCommit().stdout, '', 'unstaged and unrelated changes do not prompt');
  assert.equal(run('git', 'add', 'apps/docs/content/guide.md', 'docs/content-guidelines.md').status, 0);
  const result = preCommit();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.match(/Content review:/g)?.length, 1);
  assert.match(result.stdout, /docs\/content-guidelines\.md/);
});

const ACCEPTED = '### SB-0009 · 2026-01-01 · Buttons are buttons\n**Status:** accepted\n**Context:** c\n**Decision:** Use a native button.\n**Why:** w\n**Watch out:** o';
const PROPOSED = '### SB-0100 · 2026-11-11 · A team idea\n**Status:** proposed\n**Context:** c\n**Decision:** d\n**Why:** w\n**Watch out:** o';
const LOG = `# Decisions\n\n## Index\n- Inherited from Sketchbook: SB-0009\n- Process: SB-0100\n\n---\n\n${PROPOSED}\n\n---\n\n${ACCEPTED}\n`;
const NEW = '### SB-0101 · 2026-11-11 · Another idea\n**Status:** proposed\n**Context:** c\n**Decision:** d\n**Why:** w\n**Watch out:** o';

test('H-G1 guard-generated blocks edits to outputs and lets sources through', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sketchbook-hook-'));
  const edit = (path: string) => hook('guard-generated.mjs', dir, { tool_name: 'Edit', tool_input: { file_path: join(dir, path), old_string: 'a', new_string: 'b' } });
  for (const p of ['generated/css/tokens.css', 'spec/tokens/foundation/color.tokens.json', 'src/components/button/Button.styles.ts', 'src/index.ts']) {
    const r = edit(p);
    assert.equal(r.status, 2, p);
    assert.match(r.stderr, /Blocked/, p);
  }
  for (const p of ['brand.config.json', 'spec/tokens/semantic/light.tokens.json', 'src/components/button/Button.ts']) assert.equal(edit(p).status, 0, p);
  await rm(dir, { recursive: true, force: true });
});

test('guards recognize Windows path separators', async () => {
  const windowsRoot = 'C:\\work\\design system';
  for (const path of ['generated\\css\\tokens.css', 'spec\\tokens\\foundation\\color.tokens.json', 'src\\index.ts']) {
    const r = hook('guard-generated.mjs', windowsRoot, { tool_input: { file_path: `${windowsRoot}\\${path}` } });
    assert.equal(r.status, 2, path);
  }
  assert.equal(hook('guard-generated.mjs', windowsRoot, { tool_input: { file_path: 'c:\\WORK\\Design System\\GENERATED\\tokens.css' } }).status, 2);
  assert.equal(hook('guard-generated.mjs', '/', { tool_input: { file_path: '/generated/tokens.css' } }).status, 2);
  const aliasRoot = await mkdtemp(join(tmpdir(), 'sketchbook-hook-alias-'));
  try {
    const project = join(aliasRoot, 'project');
    await mkdir(join(project, 'generated'), { recursive: true });
    await symlink(project, join(aliasRoot, 'alias'), 'dir');
    const aliasPath = join(aliasRoot, 'alias', 'generated', 'new.css');
    assert.equal(hook('guard-generated.mjs', await realpath(project), { tool_input: { file_path: aliasPath } }).status, 2);
    await rm(join(project, 'generated'), { recursive: true });
    await mkdir(join(aliasRoot, 'outside'));
    await symlink(join(aliasRoot, 'outside'), join(project, 'generated'), 'dir');
    assert.equal(hook('guard-generated.mjs', await realpath(project), { tool_input: { file_path: aliasPath } }).status, 2);
  } finally { await rm(aliasRoot, { recursive: true, force: true }); }
  assert.equal(hook('guard-generated.mjs', windowsRoot, { tool_input: { file_path: `${windowsRoot}\\src\\button.ts` } }).status, 0);
  // On POSIX, backslashes can be used in a filename; on Windows they are path separators.
  const dir = await mkdtemp(join(tmpdir(), 'sketchbook-hook-separators-'));
  try {
    const file = join(dir, 'spec', 'decisions', 'DECISIONS.md');
    await mkdir(join(dir, 'spec', 'decisions'), { recursive: true });
    await writeFile(file, LOG);
    const winFile = process.platform === 'win32' ? file : join(dir, 'spec\\decisions\\DECISIONS.md');
    if (process.platform !== 'win32') await writeFile(winFile, LOG);
    const result = hook('guard-decisions.mjs', dir, { tool_name: 'Edit', tool_input: { file_path: winFile, old_string: '**Decision:** Use a native button.', new_string: '**Decision:** Use a div.' } });
    assert.equal(result.status, 2, result.stderr);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('H-D1 guard-decisions: settled entries cannot be reworded, appended to or removed; new entries and proposed ones can change', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sketchbook-hook-'));
  await mkdir(join(dir, 'spec/decisions'), { recursive: true });
  const file = join(dir, 'spec/decisions/DECISIONS.md');
  await writeFile(file, LOG);
  const edit = (o: string, n: string) => hook('guard-decisions.mjs', dir, { tool_name: 'Edit', tool_input: { file_path: file, old_string: o, new_string: n } });
  // Blocked: changing an accepted entry in any way.
  assert.equal(edit('**Decision:** Use a native button.', '**Decision:** Use a div.').status, 2, 'reword');
  assert.equal(edit('**Decision:** Use a native button.', '**Decision:** Use a native button. Unless it is a link.').status, 2, 'text appended inside the entry');
  assert.equal(edit(ACCEPTED, '').status, 2, 'removed');
  assert.equal(hook('guard-decisions.mjs', dir, { tool_name: 'Write', tool_input: { file_path: file, content: LOG.replace(ACCEPTED, '') } }).status, 2, 'a write that drops it');
  const alias = join(dir, 'decisions-alias.md');
  await symlink(file, alias);
  assert.equal(hook('guard-decisions.mjs', dir, { tool_name: 'Write', tool_input: { file_path: alias, content: LOG.replace(ACCEPTED, '') } }).status, 2, 'an alias to the decision log is protected');
  const elsewhere = join(dir, 'outside-log.md');
  await writeFile(elsewhere, LOG);
  await rm(file);
  await symlink(elsewhere, file);
  assert.equal(hook('guard-decisions.mjs', dir, { tool_name: 'Write', tool_input: { file_path: elsewhere, content: LOG.replace(ACCEPTED, '') } }).status, 2, 'the target of a linked decision log is protected');
  // Allowed: new entries next to settled ones, the index, proposed entries.
  assert.equal(edit(ACCEPTED, `${ACCEPTED}\n\n---\n\n${NEW}`).status, 0, 'a new entry after it');
  assert.equal(edit(ACCEPTED, `${NEW}\n\n---\n\n${ACCEPTED}`).status, 0, 'a new entry before it');
  assert.equal(edit('- Process: SB-0100', '- Process: SB-0101, SB-0100').status, 0, 'the index');
  assert.equal(edit('### SB-0100 · 2026-11-11 · A team idea\n**Status:** proposed', '### SB-0100 · 2026-11-11 · A team idea\n**Status:** accepted').status, 0, 'accepting a proposed entry');
  await rm(dir, { recursive: true, force: true });
});

test('H-O1 page-outline: a written sb-* page needs a level-1 heading and a main landmark; fragments and other files pass', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sketchbook-hook-'));
  const write = async (name: string, html: string) => {
    const file = join(dir, name);
    await writeFile(file, html);
    return hook('page-outline.mjs', dir, { tool_name: 'Write', tool_input: { file_path: file, content: html } });
  };
  const page = (body: string): string => `<!doctype html><html><body>${body}</body></html>`;
  const card = (title: string): string => `<sb-card><sb-card-header><sb-card-title>${title}</sb-card-title></sb-card-header></sb-card>`;
  let r = await write('no-h1.html', page(`<main>${card('Settings')}</main>`));
  assert.equal(r.status, 2, 'no h1');
  assert.match(r.stderr, /page-has-heading-one/);
  assert.match(r.stderr, /sb-card-title/);
  r = await write('no-main.html', page(card('<h1>Settings</h1>')));
  assert.equal(r.status, 2, 'no main');
  assert.match(r.stderr, /landmark-one-main/);
  assert.equal((await write('comment.html', page(`<!-- <h1>Settings</h1> --><main>${card('Settings')}</main>`))).status, 2, 'h1 only in a comment');
  for (const [name, html] of [
    ['ok.html', page(`<main>${card('<h1>Settings</h1>')}</main>`)],
    ['role.htm', page(`<div role="main">${card('<div role="heading" aria-level="1">Settings</div>')}</div>`)],
    ['fragment.html', card('Settings')],
    ['plain.html', page('<p>No components here.</p>')],
    ['notes.md', page(card('Settings'))],
  ] satisfies [string, string][]) {
    r = await write(name, html);
    assert.equal(r.status, 0, name);
    assert.equal(r.stderr, '', name);
  }
  await rm(dir, { recursive: true, force: true });
});

// settings.json runs every hook through .claude/hooks/run.mjs (SB-0119): the hooks are compiled from .mts, so a fresh
// clone has none until the launcher builds them, and an install without them must fail loudly, not pass silently.
const launch = (dir: string, name: string, input: string, project = dir) => spawnSync('node', [join(dir, '.claude/hooks/run.mjs'), name], { input, cwd: project, env: { ...process.env, CLAUDE_PROJECT_DIR: project }, encoding: 'utf8' });

test('native Hammock startup uses the shared project default before legacy configuration', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'sketchbook-hammock-config-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await mkdir(join(dir, '.sketchbook'));
  await writeFile(join(dir, '.sketchbook/hammock.json'), '{"defaultMode":"ultra"}');
  const result = spawnSync(process.execPath, [join(ROOT, '.claude/skills/hammock/hooks/hammock-activate.mjs')], {
    cwd: dir, env: { ...process.env, CLAUDE_PROJECT_DIR: dir, HAMMOCK_DEFAULT_MODE: 'lite' }, encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /level: ultra/);
});

test('installing Hammock does not override legacy environment or user defaults', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'sketchbook-hammock-inherit-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const xdg = join(dir, 'xdg');
  const user = join(xdg, 'hammock');
  await mkdir(user, { recursive: true });
  await writeFile(join(user, 'config.json'), '{"defaultMode":"lite"}');
  const module = pathToFileURL(join(ROOT, '.claude/skills/hammock/hooks/hammock-config.mjs')).href;
  const mode = (envMode: string) => {
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', `import { getDefaultMode } from ${JSON.stringify(module)}; console.log(getDefaultMode());`], {
      cwd: dir, env: { ...process.env, CLAUDE_PROJECT_DIR: dir, XDG_CONFIG_HOME: xdg, HAMMOCK_DEFAULT_MODE: envMode }, encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  assert.deepEqual([mode('off'), mode('')], ['off', 'lite']);
  assert.equal(await dispatch(['harness', 'add', 'hammock'], { root: dir, stdout: () => {} }), 0);
  assert.deepEqual([mode('off'), mode('')], ['off', 'lite']);
  await rm(join(user, 'config.json'));
  assert.equal(mode(''), 'full');
});

test('H-L1 the launcher runs a compiled hook with its stdin intact', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sketchbook-hook-'));
  const r = launch(ROOT, 'hooks/guard-generated', JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: join(dir, 'generated/css/tokens.css') } }), dir);
  assert.equal(r.status, 2, r.stderr);
  assert.match(r.stderr, /^Blocked: generated\/css\/tokens\.css is an output/);
  const gate = launch(ROOT, 'skills/hammock/hooks/hammock-gate', '{}', dir);
  assert.deepEqual([gate.status, gate.stdout, gate.stderr], [0, '{}', '']);
  await rm(dir, { recursive: true, force: true });
});

test('H-L2 in a source checkout with nothing compiled, the first hook builds once and its stdout stays the hook\'s own', sourceRepoOnly, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sketchbook-launch-'));
  await mkdir(join(dir, '.claude/hooks'), { recursive: true });
  await mkdir(join(dir, 'scripts'));
  for (const f of ['.claude/hooks/run.mjs', 'scripts/build-harness.mjs', 'tsconfig.json', 'tsconfig.harness.json']) await copyFile(join(ROOT, f), join(dir, f));
  await mkdir(join(dir, 'node_modules'));
  for (const m of ['typescript', '@types']) await symlink(join(ROOT, 'node_modules', m), join(dir, 'node_modules', m));
  await writeFile(join(dir, '.claude/hooks/echo.mts'), "const input: string = await new Promise((r) => { let d = ''; process.stdin.on('data', (c: Buffer) => (d += String(c))); process.stdin.on('end', () => r(d)); });\nprocess.stdout.write(`echo:${input}`);\n");
  const first = launch(dir, 'hooks/echo', 'payload');
  assert.equal(first.status, 0, first.stderr);
  assert.equal(first.stdout, 'echo:payload');
  assert.match(first.stderr, /\[build:harness\]/, 'the build reports on stderr');
  assert.ok(existsSync(join(dir, '.claude/hooks/echo.mjs')));
  const second = launch(dir, 'hooks/echo', 'again');
  assert.deepEqual([second.status, second.stdout, second.stderr], [0, 'echo:again', ''], 'no second build');
  await rm(dir, { recursive: true, force: true });
});

test('H-L4 a hook whose source changed after it was compiled (a pull) is rebuilt before it runs', sourceRepoOnly, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sketchbook-launch-'));
  await mkdir(join(dir, '.claude/hooks'), { recursive: true });
  await mkdir(join(dir, 'scripts'));
  for (const f of ['.claude/hooks/run.mjs', 'scripts/build-harness.mjs', 'tsconfig.json', 'tsconfig.harness.json']) await copyFile(join(ROOT, f), join(dir, f));
  await mkdir(join(dir, 'node_modules'));
  for (const m of ['typescript', '@types']) await symlink(join(ROOT, 'node_modules', m), join(dir, 'node_modules', m));
  const source = join(dir, '.claude/hooks/say.mts');
  await writeFile(source, "process.stdout.write('v1');\n");
  assert.equal(launch(dir, 'hooks/say', '').stdout, 'v1');
  await writeFile(source, "process.stdout.write('v2');\n");
  const later = new Date(Date.now() + 10_000);
  await utimes(source, later, later);
  const r = launch(dir, 'hooks/say', '');
  assert.equal(r.stdout, 'v2', r.stderr);
  const second = launch(dir, 'hooks/say', '');
  assert.deepEqual([second.status, second.stdout, second.stderr], [0, 'v2', ''], 'a future-dated source does not cause repeated builds');
  const laterAgain = new Date(Date.now() + 20_000);
  await utimes(source, laterAgain, laterAgain);
  assert.match(launch(dir, 'hooks/say', '').stderr, /\[build:harness\]/, 'a touched source is checked once');
  assert.equal(launch(dir, 'hooks/say', '').stderr, '', 'unchanged compiled output is not repeatedly rebuilt');
  await rm(dir, { recursive: true, force: true });
});

test('H-L3 without the compiled hook and without sources, a guard blocks (exit 2) and any other hook fails like a crash (exit 1)', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sketchbook-launch-'));
  await mkdir(join(dir, '.claude/hooks'), { recursive: true });
  await copyFile(join(ROOT, '.claude/hooks/run.mjs'), join(dir, '.claude/hooks/run.mjs'));
  const guard = launch(dir, 'hooks/guard-decisions', '{}');
  assert.deepEqual([guard.status, guard.stdout], [2, '']);
  assert.match(guard.stderr, /hooks\/guard-decisions is missing/);
  const other = launch(dir, 'skills/hammock/hooks/hammock-gate', '{}');
  assert.equal(other.status, 1);
  assert.match(other.stderr, /hammock-gate is missing/);
  assert.equal(launch(dir, '../../etc/passwd', '{}').status, 1, 'a name outside the hook folders is refused');
  await rm(dir, { recursive: true, force: true });
});
