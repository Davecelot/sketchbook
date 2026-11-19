// sketchbook init in a folder that is not a Sketchbook project (SB-0097 to SB-0099): it builds the whole project in a stage
// (the project template, the non-engine harness files, the Claude layer staged in move-to-.claude/, a neutral config, the
// engine as a dependency, the starter, the checks) and moves it in only when the checks pass, then explains what it
// installed and the step left for Claude. Cases B1–B13, I1 and U1 in TEST.md.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { copyFile, cp, mkdir, mkdtemp, readFile, realpath, rename, rm, symlink, writeFile, appendFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { ROOT, CHECKOUT, failing, checkoutOnly, must } from './helpers.mjs';
import { runChecks } from '../checks/run.mjs';
import { installed, installedMarkdown } from '../lib/installed.mjs';
import { engineSpec } from '../commands/bootstrap.mjs';
import { parseJson } from '../lib/files.mjs';
import type { Envelope } from '../cli/types.mjs';
import type { BrandConfig } from '../../generated/types/brand-config.js';
import type { ComponentContract } from '../../generated/types/contract.js';
import type { HarnessConfigJson } from '../../generated/types/harness-config.js';

// The parts of each command's --json `data` these tests read.
interface InitData { checks: { exitCode: number }; installed?: unknown; repair: { hooks: unknown[]; added: string[]; edited: string[]; skipped: string[] } }
interface DoctorData { codexSubdirectoryAdapterMatches: boolean | null; codexSubdirectoryLauncher: boolean | null; copilotRepositoryHookLocation: string; gitHook: string; claude: string; agentInstructions: Record<string, boolean>; agentInstructionReferences: Record<string, string>; nativeHooks: { codex: { registration: string; scriptPresent: boolean }; gemini: { registration: string; enginePresent: boolean }; copilot: { registration: string; scriptPresent: boolean; enginePresent: boolean } } }
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
    'move-to-.claude/rules/contract-first.md', 'move-to-.claude/hooks/guard-generated.mjs', '.githooks/pre-commit', '.githooks/pre-push', 'docs/cli.md', 'docs/harness.md', 'CLAUDE.md', 'AGENTS.md', '.trae/rules/sketchbook.md', '.aiassistant/rules/sketchbook.md', '.agents/skills/sketchbook/SKILL.md', 'AGENT-WORKFLOWS.md', 'GEMINI.md', '.codex/hooks.json', '.codex/sketchbook-guard.mjs', '.gemini/settings.json', '.gemini/sketchbook-guard.mjs', '.github/copilot-instructions.md', '.github/hooks/sketchbook.json', '.github/hooks/sketchbook-guard.mjs',
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
  for (const guide of ['CLAUDE.md', 'AGENTS.md', 'AGENT-WORKFLOWS.md']) {
    const text = await readFile(join(dir, guide), 'utf8');
    for (const match of text.matchAll(/\bnpm run ([\w:-]+)/g)) assert.ok(pkg.scripts[match[1] ?? ''], `${guide} names missing npm script ${match[1]}`);
  }
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
  const doctor = run<DoctorData>(dir, 'doctor', '--json').json?.data;
  assert.equal(doctor?.gitHook, 'active');
  assert.equal(doctor?.copilotRepositoryHookLocation, 'repository-root');
  assert.equal(doctor?.codexSubdirectoryLauncher, true);
  assert.equal(doctor?.codexSubdirectoryAdapterMatches, true);
  assert.deepEqual(doctor?.nativeHooks, { codex: { registration: 'registered', scriptPresent: true, scriptMatchesTemplate: true }, gemini: { registration: 'registered', scriptPresent: true, scriptMatchesTemplate: true, enginePresent: false }, copilot: { registration: 'registered', scriptPresent: true, scriptMatchesTemplate: true, enginePresent: false } });
  const codexHooks = join(dir, '.codex/hooks.json');
  const originalCodexHooks = await readFile(codexHooks, 'utf8');
  const legacySettings = JSON.parse(originalCodexHooks) as { hooks: { PreToolUse: { hooks: unknown[] }[] } };
  legacySettings.hooks.PreToolUse[0]?.hooks.pop();
  const legacyText = JSON.stringify(legacySettings);
  await writeFile(codexHooks, legacyText);
  assert.equal(run<DoctorData>(dir, 'doctor', '--json').json?.data.codexSubdirectoryLauncher, false);
  assert.match(run(dir, 'doctor').out, /Codex subdirectory launcher: not recognized/);
  assert.equal(await readFile(codexHooks, 'utf8'), legacyText);
  await writeFile(codexHooks, originalCodexHooks);
  const codexAdapter = join(dir, '.codex/sketchbook-guard.mjs');
  const originalCodexAdapter = await readFile(codexAdapter, 'utf8');
  await writeFile(codexAdapter, originalCodexAdapter.replace(/\n/g, '\r\n'));
  const windowsDoctor = run<DoctorData>(dir, 'doctor', '--json').json?.data;
  assert.equal(windowsDoctor?.codexSubdirectoryAdapterMatches, true);
  assert.equal((windowsDoctor?.nativeHooks.codex as { scriptMatchesTemplate?: boolean }).scriptMatchesTemplate, true);
  await writeFile(codexAdapter, originalCodexAdapter + '\n// Team customization\n');
  assert.equal(run<DoctorData>(dir, 'doctor', '--json').json?.data.codexSubdirectoryAdapterMatches, false);
  assert.match(run(dir, 'doctor').out, /this launcher will skip it/);
  assert.equal(await readFile(codexAdapter, 'utf8'), originalCodexAdapter + '\n// Team customization\n');
  await writeFile(codexAdapter, originalCodexAdapter);
  const adapterPath = join(dir, '.github/hooks/sketchbook-guard.mjs');
  const originalAdapter = await readFile(adapterPath, 'utf8');
  await writeFile(adapterPath, originalAdapter + '\n// Team customization\n');
  const customized = run<DoctorData>(dir, 'doctor', '--json');
  assert.equal((customized.json?.data.nativeHooks.copilot as { scriptMatchesTemplate?: boolean }).scriptMatchesTemplate, false);
  assert.match(run(dir, 'doctor').out, /differs from current template/);
  assert.equal(await readFile(adapterPath, 'utf8'), originalAdapter + '\n// Team customization\n');
  await writeFile(adapterPath, originalAdapter);
  assert.deepEqual(doctor?.agentInstructions, { 'AGENTS.md': true, '.trae/rules/sketchbook.md': true, '.aiassistant/rules/sketchbook.md': true, '.agents/skills/sketchbook/SKILL.md': true, 'AGENT-WORKFLOWS.md': true, 'GEMINI.md': true, '.gemini/settings.json': true, '.github/copilot-instructions.md': true });
  const summary = await readFile(join(dir, 'docs/harness.md'), 'utf8');
  for (const file of Object.keys(doctor?.agentInstructions ?? {})) assert.ok(summary.includes(file), file);
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
  const nestedDoctor = run<DoctorData>(join(app, 'design-system'), 'doctor', '--json');
  assert.equal(nestedDoctor.json?.data.copilotRepositoryHookLocation, 'nested');
  assert.equal(nestedDoctor.json?.data.nativeHooks.copilot.registration, 'registered');
  assert.match(run(join(app, 'design-system'), 'doctor').out, /not at the Git repository root/);
  assert.ok(!existsSync(join(app, '.github')), 'doctor does not write to the parent repository');
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
  const r = run(app, 'init', '--dir', 'ds', '--start', 'from-codebase', '--from', 'styles/app.css', '--engine', './engine.tgz', '--no-install', '--json');
  assert.equal(r.code, 0, r.out + r.err);
  assert.ok(existsSync(join(app, 'ds/generated/import/codebase.proposal.json')));
  assert.equal((await readJson<PackageJson>(join(app, 'ds'), 'package.json')).devDependencies[ENGINE_NAME ?? 'sketchbook'], `file:${join(await realpath(app), 'engine.tgz')}`);
  await rm(app, { recursive: true, force: true });
});

test('local engine specs resolve from the command directory without changing registry or Git specs', () => {
  const cwd = join(tmpdir(), 'engine path with spaces');
  for (const spec of ['./engine.tgz', 'engine.tgz', 'file:./engine.tgz']) assert.equal(engineSpec(spec, cwd), `file:${join(cwd, 'engine.tgz')}`);
  for (const spec of ['^1.2.3', 'latest', 'git+https://example.com/repo.git', 'https://example.com/engine.tgz', 'file:///tmp/engine.tgz']) assert.equal(engineSpec(spec, cwd), spec);
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
  assert.match(r.out, /Optional setup for Claude Code/);
  assert.match(r.out, /Other agents can use AGENTS.md/);
  assert.match(r.out, /Install the Claude layer from move-to-\.claude\/ \(follow move-to-\.claude\/INSTALL\.md\)/);
  const instructions = await readFile(join(dir, 'move-to-.claude/INSTALL.md'), 'utf8');
  assert.match(instructions, /Merge the settings/);
  assert.match(instructions, /prefer the staged folder/);
  assert.match(instructions, /rename the backup back to `move-to-\.claude\/`/);
  assert.match(instructions, /Cursor compatibility/);
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
  assert.match(r.json?.next ?? '', /open design-system as the agent workspace/);
  assert.match(r.json?.next ?? '', /verify Copilot hook discovery for the workspace/);
  assert.match(r.json?.next ?? '', /AGENT-WORKFLOWS\.md.*Claude Code: \/foundations guided/);
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

pkgTest('adopted app check scripts handle spaces, shell metacharacters and leading dashes', async () => {
  for (const [name, script] of [['design system', 'design-system:check'], ['design $sample', 'design-sample:check'], ['--design', 'design:check']] as const) {
    const app = await empty();
    try {
      await writeFile(join(app, 'package.json'), JSON.stringify({ name: 'app', private: true, scripts: {} }));
      const init = run(app, 'init', '--adopt', `--dir=${name}`, '--start', 'blank', '--no-install', '--json');
      assert.equal(init.code, 0, init.out + init.err);
      const target = join(app, name);
      const project = await readJson<PackageJson>(target, 'package.json');
      project.scripts.check = `node -e "process.stdout.write('checked')"`;
      await writeFile(join(target, 'package.json'), JSON.stringify(project));
      const check = spawnSync('npm', ['run', script], { cwd: app, encoding: 'utf8', env: { ...process.env, sample: 'unexpected' } });
      assert.equal(check.status, 0, check.stdout + check.stderr);
      assert.match(check.stdout, /checked/);
    } finally { await rm(app, { recursive: true, force: true }); }
  }
});

pkgTest('adoption preserves existing app check scripts even when empty', async () => {
  for (const [command, json] of [['', false], ['echo team-check', true]] as const) {
    const app = await empty();
    try {
      const original = JSON.stringify({ name: 'app', scripts: { 'design-system:check': command } }, null, 2) + '\n';
      await writeFile(join(app, 'package.json'), original);
      const init = run(app, 'init', '--adopt', '--start', 'blank', '--no-install', ...(json ? ['--json'] : []));
      assert.equal(init.code, 0, init.out + init.err);
      assert.equal(await readFile(join(app, 'package.json'), 'utf8'), original);
      if (json) assert.match(JSON.stringify(init.json?.warnings), /existing.*design-system:check.*script was kept/);
      else assert.match(init.out, /existing "design-system:check" script was kept/);
    } finally { await rm(app, { recursive: true, force: true }); }
  }
});

pkgTest('adoption updates only the root scripts object and preserves ambiguous app configuration', async () => {
  const cases = [
    { text: '{ "name":"app", "metadata":{"scripts":{"demo":"keep"}}, "scripts":{"dev":"vite"} }\n', expected: '{ "name":"app", "metadata":{"scripts":{"demo":"keep"}}, "scripts":{"design-system:check": "npm --prefix design-system run check", "dev":"vite"} }\n' },
    { text: '{ "name":"app", "metadata":{"scripts":{"demo":"keep"}} }\n', expected: '{ "scripts": { "design-system:check": "npm --prefix design-system run check" }, "name":"app", "metadata":{"scripts":{"demo":"keep"}} }\n' },
    { text: '{ "name":"app", "scripts":null }\n', expected: null },
    { text: '{ "name":"app", "scripts":{}, "scripts":{} }\n', expected: null },
  ];
  for (const { text, expected } of cases) {
    const app = await empty();
    try {
      await writeFile(join(app, 'package.json'), text);
      const init = run(app, 'init', '--adopt', '--start', 'blank', '--no-install', '--json');
      assert.equal(init.code, 0, init.out + init.err);
      assert.equal(await readFile(join(app, 'package.json'), 'utf8'), expected ?? text);
      if (expected === null) assert.match(JSON.stringify(init.json?.warnings), /could not be safely updated/);
    } finally { await rm(app, { recursive: true, force: true }); }
  }
});

pkgTest('adoption preserves malformed, non-object and symlinked app package files', async () => {
  for (const text of ['{broken', 'null\n', '[]\n']) {
    const app = await empty();
    try {
      await writeFile(join(app, 'package.json'), text);
      const init = run(app, 'init', '--adopt', '--start', 'blank', '--no-install', '--json');
      assert.equal(init.code, 0, init.out + init.err);
      assert.equal(await readFile(join(app, 'package.json'), 'utf8'), text);
      assert.match(JSON.stringify(init.json?.warnings), /could not be read as a JSON object/);
      assert.ok(existsSync(join(app, 'design-system/harness.config.json')));
    } finally { await rm(app, { recursive: true, force: true }); }
  }
  const workspace = await empty();
  try {
    const app = join(workspace, 'app');
    const shared = join(workspace, 'shared-package.json');
    const text = '{"name":"shared","scripts":{}}\n';
    await mkdir(app);
    await writeFile(shared, text);
    await symlink(shared, join(app, 'package.json'));
    const init = run(app, 'init', '--adopt', '--start', 'blank', '--no-install', '--json');
    assert.equal(init.code, 0, init.out + init.err);
    assert.equal(await readFile(shared, 'utf8'), text);
    assert.match(JSON.stringify(init.json?.warnings), /not a regular file/);
  } finally { await rm(workspace, { recursive: true, force: true }); }
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
  const docs = run(dir, 'docs', 'button');
  assert.equal(docs.code, 0, docs.out + docs.err);
  assert.match(docs.out, /Button/);
  assert.match(docs.out, /Accessibility/);
  await writeFile(join(dir, 'spec/design-docs.json'), '{broken');
  const invalidDocs = run(dir, 'docs', 'button');
  assert.notEqual(invalidDocs.code, 0);
  assert.match(invalidDocs.err + invalidDocs.out, /not valid JSON/);
  await rm(join(dir, 'spec/design-docs.json'));
  const cited = must(parseJson<ComponentContract>(await readFile(join(dir, 'spec/components/button/contract.json'), 'utf8')).decisions, 'button decisions').filter((d) => d.startsWith('SB-'));
  const log = await readFile(join(dir, 'spec/decisions/DECISIONS.md'), 'utf8');
  for (const id of cited) assert.match(log, new RegExp(`^### ${id} `, 'm'), id);
  assert.deepEqual(failing(await runChecks(dir, { only: ['X1'] })), []);
  await rm(dir, { recursive: true, force: true });
});

pkgTest('an installed project repairs outdated CLI documentation with upgrade', async () => {
  const { dir } = await created('blank');
  try {
    await writeFile(join(dir, 'docs/cli.md'), 'Outdated CLI documentation\n');
    const check = run(dir, 'check', '--only', 'G1', '--json');
    assert.equal(check.code, 1);
    assert.match(check.out, /npx sketchbook upgrade/);
    const upgrade = run(dir, 'upgrade', '--json');
    assert.equal(upgrade.code, 0, upgrade.out + upgrade.err);
    const fixed = run(dir, 'check', '--only', 'G1', '--json');
    assert.equal(fixed.code, 0, fixed.out + fixed.err);
  } finally { await rm(dir, { recursive: true, force: true }); }
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


pkgTest('portable instructions are restored only when missing and preserve team edits', async () => {
  const { dir } = await created('blank');
  const file = join(dir, 'AGENTS.md');
  assert.match(await readFile(join(dir, '.aiassistant/rules/sketchbook.md'), 'utf8'), /^---\napply: always\n---\n/);
  for (const path of ['.trae/rules/sketchbook.md', '.aiassistant/rules/sketchbook.md', '.agents/skills/sketchbook/SKILL.md', 'AGENT-WORKFLOWS.md', 'GEMINI.md', '.codex/hooks.json', '.codex/sketchbook-guard.mjs', '.gemini/settings.json', '.gemini/sketchbook-guard.mjs', '.github/copilot-instructions.md', '.github/hooks/sketchbook.json', '.github/hooks/sketchbook-guard.mjs']) {
    const target = join(dir, path);
    await writeFile(target, 'Team instructions\n');
  }
  assert.match(await readFile(file, 'utf8'), /npx sketchbook help/);
  await writeFile(file, 'Team instructions\n');
  assert.equal(run(dir, 'init', '--json').code, 0);
  assert.equal(await readFile(file, 'utf8'), 'Team instructions\n');
  const custom = run<DoctorData>(dir, 'doctor', '--json').json?.data.agentInstructionReferences;
  assert.equal(custom?.['AGENTS.md'], 'not-detected');
  assert.equal(custom?.['.github/copilot-instructions.md'], 'not-detected');
  assert.match(run(dir, 'doctor').out, /Review preserved team instructions/);
  for (const path of ['.trae/rules/sketchbook.md', '.aiassistant/rules/sketchbook.md', '.agents/skills/sketchbook/SKILL.md', 'AGENT-WORKFLOWS.md', 'GEMINI.md', '.codex/hooks.json', '.codex/sketchbook-guard.mjs', '.gemini/settings.json', '.gemini/sketchbook-guard.mjs', '.github/copilot-instructions.md', '.github/hooks/sketchbook.json', '.github/hooks/sketchbook-guard.mjs']) {
    const target = join(dir, path);
    assert.equal(await readFile(target, 'utf8'), 'Team instructions\n');
    await rm(target);
  }
  await rm(file);
  const report = run<DoctorData>(dir, 'doctor', '--json').json;
  const missing = report?.data.agentInstructions;
  assert.ok(missing && Object.values(missing).every((present) => !present));
  assert.match(report?.next ?? '', /sketchbook init/);
  assert.doesNotMatch(report?.next ?? '', /Claude Code/);
  assert.equal(run(dir, 'init', '--json').code, 0);
  assert.match(await readFile(file, 'utf8'), /contract-first/);
  assert.equal(run<DoctorData>(dir, 'doctor', '--json').json?.data.agentInstructionReferences['AGENTS.md'], 'referenced');
  assert.match(await readFile(join(dir, '.aiassistant/rules/sketchbook.md'), 'utf8'), /^---\napply: always\n---\n/);
  for (const path of ['.trae/rules/sketchbook.md', '.aiassistant/rules/sketchbook.md', '.agents/skills/sketchbook/SKILL.md', 'AGENT-WORKFLOWS.md', 'GEMINI.md', '.codex/hooks.json', '.codex/sketchbook-guard.mjs', '.gemini/settings.json', '.gemini/sketchbook-guard.mjs', '.github/copilot-instructions.md', '.github/hooks/sketchbook.json', '.github/hooks/sketchbook-guard.mjs']) assert.ok(existsSync(join(dir, path)), path);
  await rm(dir, { recursive: true, force: true });
});

pkgTest('repair preserves conflicting and symlinked agent setup paths', async () => {
  const { dir } = await created('blank');
  const outside = await empty();
  await rm(join(dir, '.github'), { recursive: true });
  await symlink(outside, join(dir, '.github'));
  await rm(join(dir, '.codex'), { recursive: true });
  await writeFile(join(outside, 'hooks.json'), 'team hook settings');
  await symlink(outside, join(dir, '.codex'));
  await rm(join(dir, '.trae'), { recursive: true });
  await symlink(outside, join(dir, '.trae'));
  await rm(join(dir, '.aiassistant'), { recursive: true });
  await symlink(outside, join(dir, '.aiassistant'));
  await rm(join(dir, 'AGENTS.md'));
  await symlink(join(outside, 'missing.md'), join(dir, 'AGENTS.md'));
  for (const args of [['--dry-run', '--json'], ['--json']]) {
    const result = run<InitData & { repair: { skipped: string[] } }>(dir, 'init', ...args);
    assert.equal(result.code, 0, result.out + result.err);
    assert.deepEqual(result.json?.data.repair.skipped.sort(), ['.aiassistant/rules/sketchbook.md', '.codex/hooks.json', '.codex/sketchbook-guard.mjs', '.github/copilot-instructions.md', '.github/hooks/sketchbook-guard.mjs', '.github/hooks/sketchbook.json', '.trae/rules/sketchbook.md', 'AGENTS.md']);
    assert.equal(existsSync(join(outside, 'rules/sketchbook.md')), false);
    assert.equal(existsSync(join(outside, 'copilot-instructions.md')), false);
    assert.equal(await readFile(join(outside, 'hooks.json'), 'utf8'), 'team hook settings');
    assert.equal(existsSync(join(outside, 'sketchbook-guard.mjs')), false);
    assert.equal(existsSync(join(outside, 'missing.md')), false);
  }
  await rm(join(dir, '.github'));
  await writeFile(join(dir, '.github'), 'team file');
  const result = run<InitData & { repair: { skipped: string[] } }>(dir, 'init', '--json');
  assert.equal(result.code, 0, result.out + result.err);
  assert.ok(result.json?.data.repair.skipped.includes('.github/copilot-instructions.md'));
  assert.equal(await readFile(join(dir, '.github'), 'utf8'), 'team file');
  await rm(dir, { recursive: true, force: true });
  await rm(outside, { recursive: true, force: true });
});

pkgTest('repair reports a directory occupying an instruction file path', async () => {
  const { dir } = await created('blank');
  const target = join(dir, '.aiassistant/rules/sketchbook.md');
  try {
    await rm(target);
    await mkdir(target);
    await writeFile(join(target, 'team-file'), 'keep');
    for (const args of [['--dry-run', '--json'], ['--json']]) {
      const result = run<InitData>(dir, 'init', ...args);
      assert.equal(result.code, 0, result.out + result.err);
      assert.ok(result.json?.data.repair.skipped.includes('.aiassistant/rules/sketchbook.md'));
      assert.equal(await readFile(join(target, 'team-file'), 'utf8'), 'keep');
    }
  } finally { await rm(dir, { recursive: true, force: true }); }
});


pkgTest('the staged layer can be backed up to verify the installed copy and restored on failure', async () => {
  const { dir } = await created('blank');
  try {
    const staged = join(dir, 'move-to-.claude');
    const backup = join(dir, 'move-to-.claude.install-backup');
    await cp(staged, join(dir, '.claude'), { recursive: true });
    await writeFile(join(staged, 'commands/bad.md'), '---\ndescription: Bad\n---\nRun `sketchbook teleport`.\n');
    assert.ok(must((await runChecks(dir, { only: ['H1'] })).results[0], 'H1').errors.length);
    await rename(staged, backup);
    assert.deepEqual(must((await runChecks(dir, { only: ['H1'] })).results[0], 'H1').errors, []);
    assert.equal(run<DoctorData>(dir, 'doctor', '--json').json?.data.claude, 'installed');
    await rename(backup, staged);
    assert.ok(must((await runChecks(dir, { only: ['H1'] })).results[0], 'H1').errors.length);
    assert.equal(run<DoctorData>(dir, 'doctor', '--json').json?.data.claude, 'staged');
  } finally { await rm(dir, { recursive: true, force: true }); }
});
