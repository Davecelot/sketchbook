// sketchbook init in a folder that is not a Sketchbook project (SB-0097 to SB-0099): it builds the whole project in a stage
// (the project template, the non-engine harness files, the Claude layer staged in move-to-.claude/, a neutral config, the
// engine as a dependency, the starter, the checks) and moves it in only when the checks pass, then explains what it
// installed and the step left for Claude. Cases B1–B13, I1 and U1 in TEST.md.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { copyFile, mkdir, mkdtemp, readFile, rename, rm, symlink, writeFile, appendFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { ROOT, CHECKOUT, failing, checkoutOnly, must } from './helpers.mjs';
import { runChecks } from '../checks/run.mjs';
import { installed, installedMarkdown } from '../lib/installed.mjs';
import { parseJson } from '../lib/files.mjs';
import type { Envelope } from '../cli/types.mjs';
import type { BrandConfig } from '../../generated/types/brand-config.js';
import type { ComponentContract } from '../../generated/types/contract.js';
import type { HarnessConfigJson } from '../../generated/types/harness-config.js';

// The parts of each command's --json `data` these tests read.
interface InitData { checks: { exitCode: number }; installed?: unknown; repair: { hooks: unknown[]; added: string[]; edited: string[] } }
interface DoctorData { gitHook: string; claude: string }
interface UpgradeData { hooks: unknown[]; added: string[]; updated: string[] }
type PackageJson = Record<string, unknown> & { name: string; scripts: Record<string, string>; dependencies: Record<string, string>; devDependencies: Record<string, string>; imports: Record<string, string> };
interface ClaudeSettings { hooks: Record<string, { hooks: { type: string; command: string }[] }[]>; permissions?: unknown }

const CLI = join(ROOT, 'harness/cli.mjs');
const run = <D = unknown,>(cwd: string, ...args: string[]) => {
  const r = spawnSync('node', [CLI, ...args], { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  let json: (Envelope & { data: D }) | null = null;
  try { json = parseJson<Envelope & { data: D }>(r.stdout); } catch { /* human output */ }
  return { code: r.status, out: r.stdout, err: r.stderr, json };
};
const readJson = async <T,>(dir: string, f: string): Promise<T> => parseJson<T>(await readFile(join(dir, f), 'utf8'));
const git = (dir: string, ...a: string[]) => spawnSync('git', ['-C', dir, ...a], { encoding: 'utf8' });
const empty = () => mkdtemp(join(tmpdir(), 'sketchbook-boot-'));
const ls = (dir: string): string[] => readdirSync(dir).filter((f) => f !== '.DS_Store').sort();
// These cases create projects from the engine package; a harness self-test copy (S35) has no package.json.
const PACKAGE = existsSync(join(ROOT, 'package.json'));
const ENGINE_NAME = PACKAGE ? parseJson<PackageJson>(await readFile(join(ROOT, 'package.json'), 'utf8')).name : null;
const realTest = test;
const pkgTest = (name: string, fn: () => Promise<void>): void => { void realTest(name, { skip: PACKAGE ? false : 'needs the engine package (package.json): not in a harness self-test copy' }, fn); };
const created = async (start = 'library', ...extra: string[]) => {
  const dir = await empty();
  const r = run<InitData>(dir, 'init', '--start', start, '--no-install', '--json', ...extra);
  assert.equal(r.code, 0, r.out + r.err);
  return { dir, r };
};

test('I1 the installed summary lists every skill, command, rule, hook, check and CLI command, by area', checkoutOnly, () => {
  const data = installed(ROOT);
  const area = (id: string): string[] => data.areas.find((a) => a.id === id)?.items.map((i) => i.name) ?? [];
  const dirs = (p: string) => readdirSync(join(ROOT, p), { withFileTypes: true });
  assert.deepEqual(area('skills').filter((n) => !n.includes('/')).sort(), dirs('.claude/skills').filter((e) => e.isDirectory()).map((e) => e.name).sort());
  assert.deepEqual(area('commands').sort(), dirs('.claude/commands').map((e) => `/${e.name.replace(/\.md$/, '')}`).sort());
  assert.deepEqual(area('rules').sort(), dirs('.claude/rules').map((e) => e.name.replace(/\.md$/, '')).sort());
  for (const id of ['T1', 'X1', 'H1']) assert.ok(area('checks').includes(id), id);
  for (const c of ['init', 'check', 'add', 'generate', 'selftest']) assert.ok(area('cli').includes(c), c);
  assert.ok(area('hooks').some((h) => h.startsWith('PreToolUse')));
  for (const i of data.areas.flatMap((a) => a.items)) assert.ok(i.what, `${i.name} has no explanation`);
  const md = installedMarkdown(data);
  for (const a of data.areas) assert.match(md, new RegExp(`^## ${a.title.replace(/[()/.]/g, '\\$&')}`, 'm'));
});

pkgTest('B1 init in an empty folder: the engine is a dependency, the Claude layer is staged, the project is a library, checks pass', async () => {
  const { dir, r } = await created();
  assert.equal(r.json?.ok, true);
  for (const f of ['move-to-.claude/INSTALL.md', 'move-to-.claude/settings.json', 'move-to-.claude/skills/contract-author/SKILL.md', 'move-to-.claude/commands/add.md',
    'move-to-.claude/rules/contract-first.md', 'move-to-.claude/hooks/guard-generated.mjs', '.githooks/pre-commit', '.githooks/pre-push', 'docs/cli.md', 'docs/harness.md', 'CLAUDE.md',
    '.gitignore', 'package.json', 'package-lock.json', 'brand.config.json', 'spec/registry.json', 'spec/decisions/DECISIONS.md', 'spec/schemas/contract.schema.json',
    'src/styles/_a11y.scss', 'src/index.ts', 'spec/components/button/contract.json', 'generated/css/tokens.css', 'playwright/helpers/a11y.ts', 'tsconfig.json',
    'THIRD_PARTY_NOTICES.md']) assert.ok(existsSync(join(dir, f)), f);
  for (const f of ['harness', 'scripts', '.claude', 'gitignore']) assert.ok(!existsSync(join(dir, f)), `${f} is not in the project`);
  const config = parseJson<HarnessConfigJson>(await readFile(join(dir, 'harness.config.json'), 'utf8'));
  assert.equal(config.catalog?.source, false);
  assert.equal(config.adapters.design.tool, null, 'never this repo\'s design file');
  assert.equal(config.starter, 'library');
  assert.match(must(config.harnessVersion, 'harnessVersion'), /^\d+\.\d+\.\d+$/);
  const pkg = parseJson<PackageJson>(await readFile(join(dir, 'package.json'), 'utf8'));
  assert.ok(pkg.devDependencies[String(ENGINE_NAME)], 'the engine is a devDependency, named from its package.json');
  assert.equal(pkg.imports['#harness/*'], `${ENGINE_NAME}/harness/*`, 'a bare specifier: Node refuses import targets inside node_modules');
  assert.equal(pkg.scripts.check, 'sketchbook check');
  assert.equal(pkg.scripts['test:harness'], 'sketchbook selftest');
  assert.deepEqual(Object.entries(pkg.scripts).filter(([, s]) => /harness\/|scripts\//.test(s)).map(([k]) => k), [], 'no script reaches engine paths');
  assert.ok(pkg.dependencies.lit && !pkg.dependencies.postcss, 'the engine brings its own tools');
  assert.ok(!pkg.bin);
  for (const k of ['main', 'module', 'types', 'exports', 'sideEffects']) assert.ok(pkg[k], `${k}: the project is a publishable library`);
  const lock = parseJson<{ packages: Record<string, { name?: string; devDependencies?: Record<string, string> } | undefined> }>(await readFile(join(dir, 'package-lock.json'), 'utf8'));
  assert.equal(must(lock.packages[''], 'the lock\'s root package').name, pkg.name);
  assert.equal(must(lock.packages[''], 'the lock\'s root package').devDependencies?.[String(ENGINE_NAME)], pkg.devDependencies[String(ENGINE_NAME)]);
  assert.ok(lock.packages['node_modules/lit'], 'resolved versions are kept');
  const log = await readFile(join(dir, 'spec/decisions/DECISIONS.md'), 'utf8');
  const ids = [...log.matchAll(/^### (SB-\d{4})/gm)].map((m) => m[1]).sort();
  assert.deepEqual(ids, ['SB-0005', 'SB-0006', 'SB-0007', 'SB-0009', 'SB-0011', 'SB-0101', 'SB-0102', 'SB-0103', 'SB-0109', 'SB-0110', 'SB-0115', 'SB-0121'], 'only the decisions the installed contracts cite');
  assert.match(log, /^- Inherited from Sketchbook: SB-0005, SB-0006, SB-0007, SB-0009, SB-0011, SB-0101, SB-0102, SB-0103, SB-0109, SB-0110, SB-0115, SB-0121$/m);
  assert.match(await readFile(join(dir, 'docs/harness.md'), 'utf8'), /## Skills \(staged in move-to-\.claude\/, not active yet\) \(\d+\)/);
  assert.equal(git(dir, 'config', 'core.hooksPath').stdout.trim(), '.githooks');
  const { statSync } = await import('node:fs');
  assert.ok(statSync(join(dir, '.githooks/pre-commit')).mode & 0o111, 'the hook is executable, or git ignores it');
  assert.ok(statSync(join(dir, '.githooks/pre-push')).mode & 0o111, 'the push gate is executable, or git ignores it');
  assert.equal(run<DoctorData>(dir, 'doctor', '--json').json?.data.gitHook, 'active');
  assert.deepEqual(failing(await runChecks(dir)), []);
  await rm(dir, { recursive: true, force: true });
});

pkgTest('B2 init refuses a folder that already has files and is not a Sketchbook project, before writing anything, and offers --adopt', async () => {
  const dir = await empty();
  await writeFile(join(dir, 'package.json'), '{ "name": "app" }\n');
  await mkdir(join(dir, 'src'));
  const r = run(dir, 'init', '--start', 'library', '--no-install', '--json');
  assert.equal(r.code, 1);
  assert.match(must(r.json?.errors[0], 'an init error').msg, /already has files/);
  assert.match(must(r.json?.errors[0], 'an init error').fix ?? '', /--adopt/);
  assert.deepEqual(ls(dir), ['package.json', 'src']);
  await rm(dir, { recursive: true, force: true });
});

pkgTest('B3 init --dir creates the project in a new folder inside an existing repository and leaves that repository\'s hooks alone', async () => {
  const app = await empty();
  git(app, 'init', '-q');
  await writeFile(join(app, 'package.json'), '{ "name": "app" }\n');
  const r = run(app, 'init', '--dir', 'design-system', '--start', 'blank', '--no-install', '--json');
  assert.equal(r.code, 0, r.out + r.err);
  assert.deepEqual(ls(app), ['.git', 'design-system', 'package.json']);
  assert.equal(await readFile(join(app, 'package.json'), 'utf8'), '{ "name": "app" }\n', '--dir alone never touches the app');
  assert.equal(git(app, 'config', 'core.hooksPath').stdout.trim(), '', 'the app repository keeps its hooks');
  assert.ok(r.json?.warnings.some((w) => typeof w !== 'string' && /pre-commit/.test(w.msg) && /npm --prefix design-system run check/.test(w.fix ?? '')), 'says how to call the gate from the app\'s hook');
  assert.deepEqual(failing(await runChecks(join(app, 'design-system'))), []);
  await rm(app, { recursive: true, force: true });
});

pkgTest('B4 a failing init leaves the folder exactly as it was', async () => {
  const dir = await empty();
  const r = run(dir, 'init', '--start', 'pick', '--components', 'not-a-thing', '--no-install', '--json');
  assert.equal(r.code, 1);
  assert.deepEqual(ls(dir), []);
  assert.deepEqual(ls(join(dir, '..')).filter((f) => f.startsWith('.sketchbook-init-')), [], 'no stage left behind');
  await rm(dir, { recursive: true, force: true });
});

pkgTest('B5 init --dry-run in an empty folder runs the same build and checks, reports them, and writes nothing', async () => {
  const dir = await empty();
  const r = run<InitData>(dir, 'init', '--start', 'library', '--dry-run', '--json');
  assert.equal(r.code, 0, r.out + r.err);
  assert.ok(must(r.json, 'init --json output').changed.length > 100);
  assert.equal(r.json?.data.checks.exitCode, 0);
  assert.deepEqual(ls(dir), []);
  await rm(dir, { recursive: true, force: true });
});

pkgTest('B6 --from is read from the folder init was started in (from-codebase in a subfolder)', async () => {
  const app = await empty();
  await mkdir(join(app, 'styles'));
  await writeFile(join(app, 'styles/app.css'), ':root { --brand: #1d4ed8; } .btn { padding: 8px 16px; border-radius: 6px; color: #1d4ed8; }\n');
  const r = run(app, 'init', '--dir', 'ds', '--start', 'from-codebase', '--from', 'styles/app.css', '--no-install', '--json');
  assert.equal(r.code, 0, r.out + r.err);
  assert.ok(existsSync(join(app, 'ds/generated/import/codebase.proposal.json')));
  await rm(app, { recursive: true, force: true });
});

pkgTest('B7 init with options in an existing project keeps today\'s behavior (no bootstrap)', async () => {
  const { dir } = await created('blank');
  const r = run<InitData>(dir, 'init', '--primary', '#2563EB', '--json');
  assert.equal(r.code, 0, r.out + r.err);
  assert.equal(parseJson<BrandConfig>(await readFile(join(dir, 'brand.config.json'), 'utf8')).color?.primary, '#2563EB');
  assert.equal(must(r.json, 'init --json output').data.installed, undefined);
  await rm(dir, { recursive: true, force: true });
});

pkgTest('B8 after init the CLI names the step left for Claude: install the Claude layer from move-to-.claude/', async () => {
  const dir = await empty();
  const r = run(dir, 'init', '--start', 'blank', '--no-install');
  assert.equal(r.code, 0, r.out + r.err);
  assert.match(r.out, /One step left, with Claude/);
  assert.match(r.out, /Install the Claude layer from move-to-\.claude\/ \(follow move-to-\.claude\/INSTALL\.md\)/);
  assert.match(await readFile(join(dir, 'move-to-.claude/INSTALL.md'), 'utf8'), /Merge the settings/);
  await rm(dir, { recursive: true, force: true });
});

pkgTest('B9 while the Claude layer is staged, H1 checks it there and warns; doctor says so; once installed the warning goes away', async () => {
  const { dir } = await created('blank');
  const h1 = must((await runChecks(dir, { only: ['H1'] })).results[0], 'the H1 result');
  assert.deepEqual(h1.errors, []);
  assert.match(JSON.stringify(h1.warnings), /staged, not installed/);
  const doc = run<DoctorData>(dir, 'doctor', '--json');
  assert.equal(doc.json?.data.claude, 'staged');
  assert.match(doc.json?.next ?? '', /move-to-\.claude/);
  await writeFile(join(dir, 'move-to-.claude/commands/ship.md'), '---\ndescription: Ship\n---\nRun `sketchbook teleport`.\n');
  assert.match(JSON.stringify(must((await runChecks(dir, { only: ['H1'] })).results[0], 'the H1 result').errors), /teleport/, 'the staged layer is checked');
  await rm(join(dir, 'move-to-.claude/commands/ship.md'));
  spawnSync('mv', [join(dir, 'move-to-.claude'), join(dir, '.claude')]);
  const after = must((await runChecks(dir, { only: ['H1'] })).results[0], 'the H1 result');
  assert.deepEqual([after.errors, after.warnings], [[], []]);
  assert.equal(run<DoctorData>(dir, 'doctor', '--json').json?.data.claude, 'installed');
  await rm(dir, { recursive: true, force: true });
});

pkgTest('B15 a team .claude/ next to the staged layer does not count as installed: doctor, H1 and the summary follow move-to-.claude/; the engine package has no lifecycle script', async () => {
  const { dir } = await created('blank');
  await mkdir(join(dir, '.claude/commands'), { recursive: true });
  await writeFile(join(dir, '.claude/commands/deploy.md'), '---\ndescription: Deploy\n---\nDeploy.\n');
  assert.equal(run<DoctorData>(dir, 'doctor', '--json').json?.data.claude, 'staged');
  assert.match(JSON.stringify(must((await runChecks(dir, { only: ['H1'] })).results[0], 'the H1 result').warnings), /staged, not installed/);
  assert.ok(must(installed(dir).areas.find((a) => a.id === 'skills'), 'the skills area').items.some((i) => i.name === 'contract-author'), 'the summary lists the staged layer');
  const pkg = parseJson<PackageJson>(await readFile(join(ROOT, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts.prepare, undefined, 'a consumer install must not run git config in the app repository');
  await rm(dir, { recursive: true, force: true });
});

pkgTest('B9b hammock, figma and review ship by default; --with forge stages forge-me-a-skill in a new project and adds it to one that lacks it', async () => {
  const { dir } = await created('blank', '--with', 'forge');
  for (const f of ['skills/hammock/SKILL.md', 'skills/design-figma/SKILL.md', 'commands/sync.md', 'rules/figma-fidelity.md', 'skills/review-rangers/SKILL.md', 'skills/forge-me-a-skill/SKILL.md']) assert.ok(existsSync(join(dir, 'move-to-.claude', f)), f);
  assert.match(await readFile(join(dir, 'move-to-.claude/settings.json'), 'utf8'), /hammock-activate/);
  assert.match(await readFile(join(dir, 'move-to-.claude/settings.json'), 'utf8'), /\.claude\/hooks\/run\.mjs\\" hooks\/page-outline"/);
  for (const f of ['hooks/run.mjs', 'hooks/page-outline.mjs', 'skills/hammock/hooks/hammock-activate.mjs']) assert.ok(existsSync(join(dir, 'move-to-.claude', f)), f);
  assert.ok(!existsSync(join(dir, 'move-to-.claude/hooks/page-outline.mts')), 'the hook sources stay in the engine');
  assert.deepEqual((await readJson<HarnessConfigJson>(dir, 'harness.config.json')).claudeExtras, ['forge']);
  await rm(dir, { recursive: true, force: true });
  const plain = (await created('blank')).dir;
  assert.ok(existsSync(join(plain, 'move-to-.claude/skills/hammock/SKILL.md')));
  assert.ok(!existsSync(join(plain, 'move-to-.claude/skills/forge-me-a-skill')));
  const added = run(plain, 'init', '--with', 'forge', '--json');
  assert.equal(added.code, 0, added.out + added.err);
  assert.ok(existsSync(join(plain, 'move-to-.claude/skills/forge-me-a-skill/SKILL.md')));
  assert.deepEqual((await readJson<HarnessConfigJson>(plain, 'harness.config.json')).claudeExtras, ['forge']);
  assert.equal(run(plain, 'init', '--with', 'hammock', '--json').code, 1);
  await rm(plain, { recursive: true, force: true });
});

pkgTest('B10b init again and upgrade add missing Sketchbook hooks to settings.json and keep the team\'s own', async () => {
  const { dir } = await created('blank');
  const path = join(dir, 'move-to-.claude/settings.json');
  const settings = parseJson<ClaudeSettings>(await readFile(path, 'utf8'));
  for (const ev of Object.keys(settings.hooks)) settings.hooks[ev] = must(settings.hooks[ev], ev).filter((e) => !e.hooks.some((h) => h.command.includes('skills/hammock/')));
  must(settings.hooks.SessionStart, 'SessionStart hooks').push({ hooks: [{ type: 'command', command: 'echo team-hook' }] });
  settings.permissions = { allow: ['Bash(npm run lint)'] };
  await writeFile(path, JSON.stringify(settings, null, 2));
  const r = run<InitData>(dir, 'init', '--json');
  assert.equal(r.code, 0, r.out + r.err);
  assert.equal(must(r.json, 'init --json output').data.repair.hooks.length, 6, JSON.stringify(r.json?.data.repair.hooks));
  const after = parseJson<ClaudeSettings>(await readFile(path, 'utf8'));
  const commands = Object.values(after.hooks).flat().flatMap((e) => e.hooks.map((h) => h.command));
  assert.ok(commands.includes('echo team-hook'));
  assert.ok(commands.some((c) => c.includes('hammock-activate')));
  assert.equal(new Set(commands).size, commands.length, 'no hook is added twice');
  assert.deepEqual(after.permissions, { allow: ['Bash(npm run lint)'] });
  assert.equal(run<InitData>(dir, 'init', '--json').json?.data.repair.hooks.length, 0);
  after.hooks.Stop = [];
  await writeFile(path, JSON.stringify(after, null, 2));
  assert.equal(run<UpgradeData>(dir, 'upgrade', '--json').json?.data.hooks.length, 1);
  await rm(dir, { recursive: true, force: true });
});

pkgTest('B10d settings from before the hook launcher (each hook called directly) are moved onto it by init again, so no hook runs twice', async () => {
  const { dir } = await created('blank');
  const path = join(dir, 'move-to-.claude/settings.json');
  const text = await readFile(path, 'utf8');
  const legacy = text.replace(/\/\.claude\/hooks\/run\.mjs\\" ((?:hooks|skills)\/[\w/-]+)/g, (_, rel: string) => `/.claude/${rel}${rel.startsWith('hooks/') ? '.mjs' : '.js'}\\"`);
  assert.notEqual(legacy, text);
  const team = parseJson<ClaudeSettings>(legacy);
  must(team.hooks.SessionStart, 'SessionStart hooks').push({ hooks: [{ type: 'command', command: 'echo team-hook' }] });
  await writeFile(path, JSON.stringify(team, null, 2));
  const r = run<InitData>(dir, 'init', '--json');
  assert.equal(r.code, 0, r.out + r.err);
  const replaced = must(r.json, 'init --json output').data.repair.hooks;
  assert.equal(replaced.length, 9, JSON.stringify(replaced));
  assert.ok(replaced.every((h) => /\(replaces node /.test(String(h))));
  const after = parseJson<ClaudeSettings>(await readFile(path, 'utf8'));
  const commands = Object.values(after.hooks).flat().flatMap((e) => e.hooks.map((h) => h.command));
  assert.deepEqual(commands.filter((c) => c !== 'echo team-hook').sort(), Object.values(parseJson<ClaudeSettings>(text).hooks).flat().flatMap((e) => e.hooks.map((h) => h.command)).sort());
  assert.ok(commands.includes('echo team-hook'));
  await rm(dir, { recursive: true, force: true });
});

pkgTest('B10 init again in a project restores what is missing, reports what was edited, and never overwrites', async () => {
  const { dir } = await created('blank');
  await rm(join(dir, '.githooks/pre-commit'));
  await rm(join(dir, 'move-to-.claude/rules/test-first.md'));
  await rm(join(dir, 'playwright/helpers/a11y.ts'));
  await appendFile(join(dir, 'move-to-.claude/commands/add.md'), '\nTeam note.\n');
  const dry = run(dir, 'init', '--dry-run', '--json');
  assert.equal(dry.code, 0, dry.out + dry.err);
  assert.ok(!existsSync(join(dir, '.githooks/pre-commit')), 'a dry run writes nothing');
  const r = run<InitData>(dir, 'init', '--json');
  assert.equal(r.code, 0, r.out + r.err);
  for (const f of ['.githooks/pre-commit', 'move-to-.claude/rules/test-first.md', 'playwright/helpers/a11y.ts']) {
    assert.ok(existsSync(join(dir, f)), f);
    assert.ok(r.json?.data.repair.added.includes(f), f);
  }
  assert.deepEqual(r.json?.data.repair.edited, ['move-to-.claude/commands/add.md']);
  assert.match(await readFile(join(dir, 'move-to-.claude/commands/add.md'), 'utf8'), /Team note\./);
  await rm(dir, { recursive: true, force: true });
});

pkgTest('B10c init again in a project that still has .js configs does not add their .ts template copies', async () => {
  const { dir } = await created('blank');
  const old = ['prettier.config', '.storybook/main', '.storybook/preview'];
  for (const f of old) await rename(join(dir, `${f}.ts`), join(dir, `${f}.js`));
  const r = run<InitData>(dir, 'init', '--json');
  assert.equal(r.code, 0, r.out + r.err);
  for (const f of old) {
    assert.ok(existsSync(join(dir, `${f}.js`)), `${f}.js kept`);
    assert.ok(!existsSync(join(dir, `${f}.ts`)), `${f}.ts not added next to it`);
    assert.ok(!r.json?.data.repair.added.includes(`${f}.ts`), `${f}.ts not reported`);
  }
  await rm(dir, { recursive: true, force: true });
});

pkgTest('B11 init --adopt adds the design system to an existing app in design-system/, wiring one npm script and nothing else', async () => {
  const app = await empty();
  git(app, 'init', '-q');
  await writeFile(join(app, 'package.json'), '{\n\t"name": "app",\n\t"scripts": { "dev": "vite" }\n}\n');
  await mkdir(join(app, 'src'));
  await writeFile(join(app, 'src/index.ts'), 'export {};\n');
  const r = run(app, 'init', '--adopt', '--start', 'blank', '--no-install', '--json');
  assert.equal(r.code, 0, r.out + r.err);
  assert.deepEqual(ls(app), ['.git', 'design-system', 'package.json', 'src']);
  assert.equal(await readFile(join(app, 'src/index.ts'), 'utf8'), 'export {};\n');
  const pkg = parseJson<PackageJson>(await readFile(join(app, 'package.json'), 'utf8'));
  assert.deepEqual(pkg.scripts, { dev: 'vite', 'design-system:check': 'npm --prefix design-system run check' });
  assert.match(await readFile(join(app, 'package.json'), 'utf8'), /\n\t"scripts"/, 'keeps the file\'s indentation');
  assert.equal(git(app, 'config', 'core.hooksPath').stdout.trim(), '');
  assert.deepEqual(failing(await runChecks(join(app, 'design-system'))), []);
  await rm(app, { recursive: true, force: true });
});

pkgTest('B14 init --adopt inserts its script into the app package.json as text: every other byte stays as the team wrote it', async () => {
  const app = await empty();
  const text = '{ "name": "acme-app", "version": "1.4.0", "private": true,\n  "scripts": { "dev": "vite", "test": "vitest" },\n  "dependencies": { "react": "^18.3.1" } }\n';
  await writeFile(join(app, 'package.json'), text);
  const r = run(app, 'init', '--adopt', '--start', 'blank', '--no-install', '--json');
  assert.equal(r.code, 0, r.out + r.err);
  const after = await readFile(join(app, 'package.json'), 'utf8');
  assert.equal(after, text.replace('"scripts": { ', '"scripts": { "design-system:check": "npm --prefix design-system run check", '));
  await rm(app, { recursive: true, force: true });
});

pkgTest('B12 a blank project starts with an empty decision log; installing a component copies in the decisions it cites', async () => {
  const { dir } = await created('blank');
  const start = await readFile(join(dir, 'spec/decisions/DECISIONS.md'), 'utf8');
  assert.deepEqual([...start.matchAll(/^### SB-/gm)], []);
  const pinned = await readFile(join(ROOT, 'harness/templates/project/spec/decisions/DECISIONS.md'), 'utf8');
  const next = `SB-${String(Math.max(...[...pinned.matchAll(/^### SB-(\d{4})/gm)].map((m) => Number(m[1]))) + 1).padStart(4, '0')}`;
  assert.match(start, new RegExp(`Number your own entries from ${next} on`), 'the header says where team numbering starts, for anyone writing an entry by hand');
  const r = run(dir, 'add', 'button', '--json');
  assert.equal(r.code, 0, r.out + r.err);
  const cited = must(parseJson<ComponentContract>(await readFile(join(dir, 'spec/components/button/contract.json'), 'utf8')).decisions, 'button decisions').filter((d) => d.startsWith('SB-'));
  const log = await readFile(join(dir, 'spec/decisions/DECISIONS.md'), 'utf8');
  for (const id of cited) assert.match(log, new RegExp(`^### ${id} `, 'm'), id);
  assert.deepEqual(failing(await runChecks(dir, { only: ['X1'] })), []);
  await rm(dir, { recursive: true, force: true });
});

pkgTest('B13 a new decision in a project is numbered after every default decision, so an inherited one never collides', async () => {
  const { dir } = await created('blank');
  const { proposeDecision } = await import('../lib/decisions.mjs');
  const id = await proposeDecision(dir, { title: 't', context: 'c', decision: 'd', why: 'w', watchOut: 'o', section: 'Process' });
  const pinned = await readFile(join(ROOT, 'harness/templates/project/spec/decisions/DECISIONS.md'), 'utf8');
  const top = Math.max(...[...pinned.matchAll(/^### SB-(\d{4})/gm)].map((m) => Number(m[1])));
  assert.ok(Number(id.slice(3)) > top, `${id} after SB-${top}`);
  await rm(dir, { recursive: true, force: true });
});

pkgTest('U1 upgrade in a project without harness/ refreshes the harness-owned files from the installed engine, no --from', async () => {
  const { dir } = await created('blank');
  await rm(join(dir, 'move-to-.claude/rules/test-first.md'));
  await appendFile(join(dir, '.githooks/pre-commit'), '# local edit\n');
  const r = run<UpgradeData>(dir, 'upgrade', '--json');
  assert.equal(r.code, 0, r.out + r.err);
  assert.deepEqual(r.json?.data.added, ['move-to-.claude/rules/test-first.md']);
  assert.deepEqual(r.json?.data.updated, ['.githooks/pre-commit']);
  assert.doesNotMatch(await readFile(join(dir, '.githooks/pre-commit'), 'utf8'), /local edit/);
  assert.ok(!existsSync(join(dir, 'harness')), 'the engine stays in node_modules');
  await rm(dir, { recursive: true, force: true });
});

// The engine as npm would install it (its packed file list), every other dependency linked from this checkout:
// npm install is too slow here, and the lint and type errors this catches come from the files the package ships.
void realTest('B16 a fresh library+kits project lints and typechecks with no error or warning against the engine as packed', { skip: PACKAGE && CHECKOUT ? false : 'needs the engine package and a source checkout\'s node_modules' }, async () => {
  const { dir } = await created('library+kits');
  try {
    const [{ files }] = parseJson<[{ files: { path: string }[] }]>(execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
    const engine = join(dir, 'node_modules', String(ENGINE_NAME));
    for (const { path } of files) {
      await mkdir(dirname(join(engine, path)), { recursive: true });
      await copyFile(join(ROOT, path), join(engine, path));
    }
    for (const entry of ls(join(ROOT, 'node_modules')).filter((e) => e !== ENGINE_NAME && e !== '.cache')) await symlink(join(ROOT, 'node_modules', entry), join(dir, 'node_modules', entry));
    // init already generated; pretypecheck would only run sketchbook generate again.
    for (const [script, extra] of [['lint', ['--max-warnings', '0']], ['typecheck', []]] as const) {
      const r = spawnSync('npm', ['run', script, '--ignore-scripts', '--', ...extra], { cwd: dir, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
      assert.equal(r.status, 0, `npm run ${script} in a fresh project:\n${r.stdout}${r.stderr}`);
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
