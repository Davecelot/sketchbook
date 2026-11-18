// sketchbook init in a folder that is not a Sketchbook project yet (SB-0097 to SB-0099). The whole project is built in a
// stage beside the target and moved in only when the checks pass, so a failure leaves the folder as it was. The engine
// is a dependency (node_modules), not copied; the Claude layer is staged in move-to-.claude/ for Claude to install.
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, writeFileSync, copyFileSync, cpSync, chmodSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import type { ComponentRegistry } from '../../generated/types/registry.js';
import { walk, HARNESS, ENGINE, globToRegExp, parseJson, readJson, readJsonSync } from '../lib/files.mjs';
import { loadOwnership, classify } from './upgrade.mjs';
import type { HarnessManifest } from './upgrade.mjs';
import { applyStarter, DETACHED_NOTE } from './start.mjs';
import { init, INIT_OPTIONS } from './init.mjs';
import type { InitOptions } from './init.mjs';
import type { FixError } from './catalog.mjs';
import type { AdapterConfig } from './swap.mjs';
import type { CheckReport } from './tokens.mjs';
import { runGenerator } from '../generators/foundation.mjs';
import { runChecks } from '../checks/run.mjs';
import { installed, installedMarkdown } from '../lib/installed.mjs';
import { hookScript } from '../lib/claude-layer.mjs';
import { emptyLog, inheritDecisions } from '../lib/decisions.mjs';

export interface Warning { file: string | null; msg: string; fix: string | null }
export interface SyncResult { added: string[]; updated: string[]; edited: string[]; hooks?: string[] }
export interface GitSetup { inside?: string; warning?: Warning; line?: string | null }
export interface HookCommand { command: string; [k: string]: unknown }
export interface HookEntry { matcher?: string; hooks?: HookCommand[]; [k: string]: unknown }
export interface ClaudeSettings { hooks?: Record<string, HookEntry[]>; [k: string]: unknown }
export interface EnginePackage {
  name: string;
  version: string;
  scripts: Record<string, string>;
  files?: string[];
  engines?: unknown;
  main?: unknown;
  module?: unknown;
  types?: unknown;
  exports?: unknown;
  sideEffects?: unknown;
  dependencies: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  overrides?: unknown;
}
export interface BootstrapOptions {
  dir?: string;
  adopt?: boolean;
  start?: string;
  components?: string;
  from?: string;
  opts?: Record<string, string | undefined>;
  engine?: string;
  extras?: string[];
  dryRun?: boolean;
  install?: boolean;
  json?: boolean;
  out?: (line: string) => void;
}
type ManifestWithGroups = HarnessManifest & { optional?: Record<string, string[]> };
interface PackageLock { name?: string; version?: string; packages: Record<string, unknown>; [k: string]: unknown }
type ProjectConfig = AdapterConfig & { catalog?: { source?: boolean; note?: string }; harnessVersion?: string; starter?: string; claudeExtras?: string[] };

const TEMPLATE = join(HARNESS, 'templates/project');
const IGNORED = new Set(['.git', '.DS_Store']);
export const STAGED = 'move-to-.claude';
const fail = (msg: string, fix: string): FixError => Object.assign(new Error(msg), { fix });
const serialize = (j: unknown): string => JSON.stringify(j, null, 2) + '\n';
const enginePkg = (): EnginePackage => readJson<EnginePackage>(join(ENGINE, 'package.json'));
// The engine (harness/, scripts/) runs from node_modules; everything else the manifest calls harness-owned is copied.
// The Claude hooks' .mts sources stay with it too: a project gets their compiled .mjs, as the package ships them.
const isEngine = (f: string): boolean => /^(harness|scripts)\//.test(f) || (f.startsWith('.claude/') && f.endsWith('.mts'));

export const EXTRAS = ['forge'];
const groupOf = (f: string, m: ManifestWithGroups): string | null => Object.entries(m.optional ?? {}).find(([, globs]) => globs.some((g) => globToRegExp(g).test(f)))?.[0] ?? null;
const extrasOf = (root: string): string[] => readJsonSync<{ claudeExtras?: string[] }>(join(root, 'harness.config.json'), {})?.claudeExtras ?? [];

export const isProject = (dir: string): boolean => existsSync(join(dir, 'harness.config.json'));

// Harness-owned files of this install (harness/manifest.json "harness"), walked from each glob's fixed prefix only.
export function harnessFiles(source: string = ENGINE): { manifest: ManifestWithGroups; files: string[] } {
  const m = loadOwnership(source);
  const files = new Set<string>();
  for (const glob of m.harness) {
    const base = (glob.split(/[*?]/)[0] ?? '').replace(/\/$/, '');
    for (const f of walk(source, base)) if (classify(f, m) === 'harness') files.add(f);
  }
  return { manifest: m, files: [...files].sort() };
}

// Where a harness file lives in a project: the Claude layer stays staged in move-to-.claude/ until Claude installs it.
export function destOf(root: string, f: string): string {
  if (!f.startsWith('.claude/')) return f;
  return existsSync(join(root, STAGED)) || !existsSync(join(root, '.claude')) ? `${STAGED}/${f.slice('.claude/'.length)}` : f;
}

// The project's copies of the harness-owned files that are not the engine: add the missing ones, and with all: true
// replace the ones that differ (upgrade); otherwise report them as edited (repair never overwrites).
export function syncHarness(root: string, { all = false, dryRun = false, extras = extrasOf(root) }: { all?: boolean; dryRun?: boolean; extras?: string[] } = {}): SyncResult {
  const out: SyncResult = { added: [], updated: [], edited: [] };
  const { files, manifest } = harnessFiles();
  for (const f of files.filter((x) => !isEngine(x) && ((g: string | null) => !g || extras.includes(g))(groupOf(x, manifest)))) {
    const dest = destOf(root, f);
    const src = readFileSync(join(ENGINE, f));
    const abs = join(root, dest);
    if (!existsSync(abs)) out.added.push(dest);
    else if (!readFileSync(abs).equals(src)) (all ? out.updated : out.edited).push(dest);
    else continue;
    if (dryRun || (existsSync(abs) && !all)) continue;
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, src);
    // Keep the engine file's mode: git ignores a pre-commit hook that is not executable.
    chmodSync(abs, f.startsWith('.githooks/') ? 0o755 : statSync(join(ENGINE, f)).mode & 0o777);
  }
  out.hooks = mergeHooks(join(root, destOf(root, '.claude/settings.json')), dryRun);
  return out;
}

// settings.json is the team's, so it is merged, not copied: every template hook whose command is missing is added;
// nothing the team has is removed, and only a Sketchbook hook from before the launcher (SB-0119), which calls its script
// directly, is changed: into the template's launcher command for the same script, so it runs once, from its current
// file. Returns the added and the replaced commands.
function mergeHooks(settingsPath: string, dryRun: boolean): string[] {
  const have = readJsonSync<ClaudeSettings>(settingsPath, {}) ?? {};
  const added: string[] = [];
  const template = readJsonSync<{ hooks?: Record<string, (HookEntry & { hooks: HookCommand[] })[]> }>(join(TEMPLATE, '.claude/settings.json'));
  const script = (command: string): string | undefined => hookScript(command)?.replace(/\.m?js$/, '');
  const launched = new Map(Object.values(template?.hooks ?? {}).flat().flatMap((e) => e.hooks).filter((h) => / "\$\{CLAUDE_PROJECT_DIR\}\/\.claude\/hooks\/run\.mjs" /.test(h.command)).map((h) => [script(h.command), h.command]));
  for (const [event, entries] of Object.entries(have.hooks ?? {})) {
    for (const h of entries.flatMap((e) => e.hooks ?? [])) {
      const next = launched.get(script(h.command));
      if (!next || next === h.command) continue;
      added.push(`${event}: ${next} (replaces ${h.command})`);
      h.command = next;
    }
  }
  for (const [event, entries] of Object.entries(template?.hooks ?? {})) {
    const present = new Set((have.hooks?.[event] ?? []).flatMap((e) => (e.hooks ?? []).map((h) => h.command)));
    for (const e of entries) {
      const missing = e.hooks.filter((h) => !present.has(h.command));
      if (!missing.length) continue;
      ((have.hooks ??= {})[event] ??= []).push({ ...e, hooks: missing });
      added.push(...missing.map((h) => `${event}: ${h.command}`));
    }
  }
  if (added.length && !dryRun) { mkdirSync(dirname(settingsPath), { recursive: true }); writeFileSync(settingsPath, serialize(have)); }
  return added;
}

// sketchbook init --with <group>: record the optional Claude-layer groups and copy their files.
export function addExtras(root: string, groups: string[], { dryRun = false }: { dryRun?: boolean } = {}): SyncResult {
  const bad = groups.filter((g) => !EXTRAS.includes(g));
  if (bad.length) throw fail(`Unknown --with group: ${bad.join(', ')}.`, `Choose from ${EXTRAS.join(', ')}.`);
  const configPath = join(root, 'harness.config.json');
  const config = readJsonSync<{ claudeExtras?: string[]; [k: string]: unknown }>(configPath);
  if (!config) throw new TypeError("Cannot read properties of null (reading 'claudeExtras')");
  const extras = [...new Set([...(config.claudeExtras ?? []), ...groups])];
  if (!dryRun) writeFileSync(configPath, serialize({ ...config, claudeExtras: extras }));
  return syncHarness(root, { dryRun, extras });
}

const PROJECT_SCRIPTS = (engine: EnginePackage): Record<string, string | undefined> => ({
  sketchbook: 'sketchbook',
  check: 'sketchbook check',
  'check:json': 'sketchbook check --json',
  generate: 'sketchbook generate',
  tokens: 'sketchbook generate',
  build: 'sketchbook generate && tsup',
  lint: engine.scripts.lint,
  format: engine.scripts.format,
  typecheck: engine.scripts.typecheck,
  pretypecheck: 'sketchbook generate',
  storybook: 'sketchbook generate && storybook dev -p ${SKETCHBOOK_PORT:-6006}',
  'build-storybook': 'storybook build',
  'prebuild-storybook': 'sketchbook generate',
  'test:component': engine.scripts['test:component'],
  'test:install': engine.scripts['test:install'],
  'test:harness': 'sketchbook selftest',
});
// Imported by the engine itself, so the project gets them through the engine dependency.
const ENGINE_RUNTIME = ['postcss', 'postcss-scss', 'sass', 'style-dictionary', 'lucide-static', 'typescript'];

// The engine package: the name is read from its package.json (renaming it is one edit there). A source checkout
// links itself; an installed engine is pinned by version unless --engine says otherwise (a tarball, a git URL).
export const engineSpec = (given?: string): string => given ?? (existsSync(join(ENGINE, '.git')) ? `file:${ENGINE.replace(/\/$/, '')}` : `^${enginePkg().version}`);

// The project's package.json: a publishable library (its own dist and token CSS) whose tools come from the engine.
function projectPackage(name: string, spec: string) {
  const engine = enginePkg();
  const omit = (o: Record<string, string> | undefined, keys: string[]): Record<string, string> => Object.fromEntries(Object.entries(o ?? {}).filter(([k]) => !keys.includes(k)));
  const files = (engine.files ?? []).filter((p) => !/^(harness|scripts|\.claude|\.githooks|docs|spec)(\/|$)/.test(p));
  // The engine's peers (lit) are what the project's components import: the project depends on them, at the engine's pins.
  const peers = Object.keys(engine.peerDependencies ?? {});
  const pinnedPeers = Object.fromEntries(peers.map((k) => [k, engine.devDependencies?.[k] ?? engine.peerDependencies?.[k]]));
  return {
    name, version: '0.1.0', private: true, type: 'module', engines: engine.engines,
    main: engine.main, module: engine.module, types: engine.types, exports: engine.exports, files, sideEffects: engine.sideEffects,
    imports: { '#harness/*': `${engine.name}/harness/*` },
    scripts: PROJECT_SCRIPTS(engine),
    dependencies: { ...omit(engine.dependencies, ENGINE_RUNTIME), ...pinnedPeers },
    devDependencies: { ...omit(engine.devDependencies, peers), typescript: engine.dependencies.typescript, [engine.name]: spec },
    // npm applies overrides only in the root project, so the engine's security pins (glob) would not reach it otherwise.
    ...(engine.overrides ? { overrides: engine.overrides } : {}),
  };
}

const slug = (s: string): string => s.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'design-system';

async function build(stage: string, target: string, { start, components, from, brand, spec, extras = [] }: { start: string; components?: string; from?: string; brand: InitOptions; spec: string; extras?: string[] }) {
  const harness = harnessFiles();
  cpSync(TEMPLATE, stage, { recursive: true });
  renameSync(join(stage, 'gitignore'), join(stage, '.gitignore'));
  renameSync(join(stage, '.claude'), join(stage, STAGED));
  syncHarness(stage, { extras });
  copyFileSync(join(HARNESS, 'templates/move-to-claude-INSTALL.md'), join(stage, STAGED, 'INSTALL.md'));
  for (const d of ['spec/components', 'src/components']) mkdirSync(join(stage, d), { recursive: true });
  copyFileSync(join(HARNESS, 'test/golden/brand.default.json'), join(stage, 'brand.config.json'));
  copyFileSync(join(HARNESS, 'templates/CLAUDE.md'), join(stage, 'CLAUDE.md'));
  const pkg = projectPackage(slug(basename(target)), spec);
  writeFileSync(join(stage, 'package.json'), serialize(pkg));
  // The template's lockfile is this repo's: npm install then gets the versions a clone gets, not whatever the registry
  // resolves today. Only its root entry describes the package, so it becomes the project's.
  const lockPath = join(stage, 'package-lock.json');
  const lock = readJson<PackageLock>(lockPath);
  lock.name = pkg.name;
  lock.version = pkg.version;
  lock.packages[''] = { name: pkg.name, version: pkg.version, dependencies: pkg.dependencies, devDependencies: pkg.devDependencies, engines: pkg.engines };
  writeFileSync(lockPath, serialize(lock));
  const configPath = join(stage, 'harness.config.json');
  const config = readJson<ProjectConfig>(configPath);
  config.adapters.design = { tool: null, file: null, available: false };
  config.catalog = { source: false, note: DETACHED_NOTE };
  config.harnessVersion = harness.manifest.version;
  delete config.starter;
  if (extras.length) config.claudeExtras = extras;
  writeFileSync(configPath, serialize(config));
  // Nothing is installed yet: every registry entry starts planned, and each install sets its own status.
  const registryPath = join(stage, 'spec/registry.json');
  const registry = readJson<ComponentRegistry>(registryPath);
  for (const c of registry.components) c.status = 'planned';
  writeFileSync(registryPath, serialize(registry));
  // The project's own decision log; installs copy in the default decisions their contracts cite.
  writeFileSync(join(stage, 'spec/decisions/DECISIONS.md'), emptyLog());
  if (Object.keys(brand).length) await init(stage, brand);
  else await runGenerator(stage, { quiet: true });
  const starter = await applyStarter(stage, start, { components, from });
  inheritDecisions(stage);
  const data = installed(stage);
  mkdirSync(join(stage, 'docs'), { recursive: true });
  writeFileSync(join(stage, 'docs/harness.md'), installedMarkdown(data));
  const report: CheckReport = await runChecks(stage);
  return { starter, installed: data, harness, report };
}

export function setupGit(target: string): GitSetup {
  const top = spawnSync('git', ['-C', target, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' });
  if (top.status !== 0) {
    const r = spawnSync('git', ['init', '-q', target], { encoding: 'utf8' });
    if (r.status !== 0) return { warning: { file: null, msg: `git init failed: ${r.stderr.trim()}; the pre-commit gate is not active.`, fix: 'git init, then git config core.hooksPath .githooks' } };
  } else if (realpathSync(top.stdout.trim()) !== realpathSync(target)) {
    return { inside: top.stdout.trim(), warning: { file: '.githooks/pre-commit', msg: `The pre-commit gate is not active: this folder is inside another repository (${top.stdout.trim()}), whose hooks were left alone.`, fix: `Add "npm --prefix ${relative(top.stdout.trim(), target) || '.'} run check" to that repository's pre-commit hook, or run npm run check here before committing.` } };
  }
  const current = spawnSync('git', ['-C', target, 'config', 'core.hooksPath'], { encoding: 'utf8' }).stdout.trim();
  if (/(^|\/)\.githooks\/?$/.test(current)) return { line: null };
  const r = spawnSync('git', ['-C', target, 'config', 'core.hooksPath', '.githooks'], { encoding: 'utf8' });
  return r.status === 0 ? { line: 'git: core.hooksPath = .githooks (npm run check runs before every commit).' } : { warning: { file: null, msg: 'Could not set core.hooksPath.', fix: 'git config core.hooksPath .githooks' } };
}

function installDeps(target: string, json: boolean): Warning[] {
  const warnings: Warning[] = [];
  const steps: [string, string[]][] = [['npm', ['install', '--no-audit', '--no-fund']], ['npx', ['playwright', 'install', 'chromium']]];
  for (const [cmd, args] of steps) {
    const r = spawnSync(cmd, args, { cwd: target, stdio: json ? 'pipe' : 'inherit', encoding: 'utf8' });
    if (r.status !== 0) { warnings.push({ file: null, msg: `${cmd} ${args.join(' ')} failed (exit ${r.status}).`, fix: `cd ${target} && ${cmd} ${args.join(' ')}` }); break; }
  }
  return warnings;
}

// Adopt (SB-0099): the app keeps every file; it gets one npm script that runs the design system's checks, added only
// when its package.json has no script by that name.
function wireApp(app: string, target: string): string[] {
  const rel = relative(app, target);
  const lines: string[] = [];
  const pkgPath = join(app, 'package.json');
  if (existsSync(pkgPath)) {
    const text = readFileSync(pkgPath, 'utf8');
    const pkg = parseJson<{ scripts?: Record<string, string>; [k: string]: unknown }>(text);
    const key = `${slug(basename(target))}:check`;
    if (!pkg.scripts?.[key]) {
      const value = `npm --prefix ${rel} run check`;
      // Inserted as text at the top of "scripts", in the spacing that follows its brace, so every other byte stays.
      const at = /"scripts"\s*:\s*\{(\s*)/.exec(text);
      let next: string | null = null;
      if (at) {
        const end = at.index + at[0].length;
        const empty = text[end] === '}';
        next = text.slice(0, end) + `${JSON.stringify(key)}: ${JSON.stringify(value)}${empty ? at[1] : `,${at[1] || ' '}`}` + text.slice(end);
        try { JSON.parse(next); } catch { next = null; }
      }
      if (!next) {
        pkg.scripts = { ...(pkg.scripts ?? {}), [key]: value };
        next = JSON.stringify(pkg, null, /\n([ \t]+)"/.exec(text)?.[1] ?? '  ') + '\n';
      }
      writeFileSync(pkgPath, next);
      lines.push(`App package.json: added the script "${key}" (npm run ${key} runs the design system's checks).`);
    }
  }
  return lines;
}

export async function bootstrap(cwd: string, { dir, adopt = false, start = 'library', components, from, opts = {}, engine, extras = [], dryRun = false, install = true, json = false, out = () => {} }: BootstrapOptions = {}) {
  dir ??= adopt ? 'design-system' : undefined;
  const target = resolve(cwd, dir ?? '.');
  const unknown = extras.filter((g) => !EXTRAS.includes(g));
  if (unknown.length) throw fail(`Unknown --with group: ${unknown.join(', ')}.`, `Choose from ${EXTRAS.join(', ')}.`);
  if (existsSync(target)) {
    const present = readdirSync(target).filter((f) => !IGNORED.has(f));
    if (present.length) {
      throw dir
        ? fail(`${dir} already has files and is not a Sketchbook project, so init writes nothing there.`, 'Pick a new or empty folder with --dir.')
        : fail(`This folder already has files (${present.slice(0, 4).join(', ')}${present.length > 4 ? ', …' : ''}) and is not a Sketchbook project, so init writes nothing here.`, `sketchbook init --adopt adds the design system to this project in its own folder (design-system/, or --dir <folder>), without changing your files.`);
    }
  }
  const brand: InitOptions = Object.fromEntries(Object.entries(opts).filter(([k, v]) => k in INIT_OPTIONS && v !== undefined));
  const spec = engineSpec(engine);
  mkdirSync(dirname(target), { recursive: true });
  const stage = mkdtempSync(join(dirname(target), '.sketchbook-init-'));
  try {
    const r = await build(stage, target, { start, components, from: from ? resolve(cwd, from) : undefined, brand, spec, extras });
    const files = walk(stage, '.');
    const checks = { exitCode: r.report.exitCode, failing: r.report.results.filter((x) => x.errors.length).map((x) => x.id) };
    const errors = r.report.results.flatMap((x) => x.errors.map((e) => ({ ...e, id: x.id })));
    if (r.report.exitCode === 1) return { exitCode: 1, errors, changed: [], data: { checks }, next: 'Nothing was written. Fix the cause above (each error has a fix), then run init again.' };
    const data = { target, engine: { package: enginePkg().name, spec }, starter: { id: start, components: r.starter.plan.components.target, kits: r.starter.plan.kits.target }, staged: STAGED, checks, installed: r.installed };
    if (dryRun) return { changed: files, data, lines: [`Would create ${files.length} file(s) in ${target}: the engine as a dependency (${data.engine.package}@${spec}), the Claude layer staged in ${STAGED}/, starter ${start} (${data.starter.components.length} component(s), ${data.starter.kits.length} kit(s)); checks ${checks.failing.length ? `fail: ${checks.failing.join(', ')}` : 'pass'}.`] };
    mkdirSync(target, { recursive: true });
    for (const e of readdirSync(stage)) renameSync(join(stage, e), join(target, e));
    const warnings: Warning[] = [];
    const lines = [...r.starter.lines];
    const g = setupGit(target);
    if (g.warning) warnings.push(g.warning); else if (g.line) lines.push(g.line);
    if (adopt) lines.push(...wireApp(cwd, target));
    if (install) { out('Installing dependencies (npm install, then Chromium for the behavior tests)…'); warnings.push(...installDeps(target, json)); }
    else warnings.push({ file: 'package.json', msg: 'Dependencies not installed (--no-install).', fix: `cd ${target} && npm install && npx playwright install chromium` });
    if (r.starter.warning) warnings.push({ file: 'harness.config.json', msg: r.starter.warning, fix: null });
    const claude = `open Claude Code in ${dir ? dir : 'this folder'} and ask: "Install the Claude layer from ${STAGED}/ (follow ${STAGED}/INSTALL.md)"`;
    return { changed: files, warnings, data, lines, claudeStep: claude, next: [...(dir ? [`cd ${dir}`] : []), claude, ...r.starter.next].join('; ') };
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
}

// sketchbook init again in a project: put back what is missing, never overwrite. Harness-owned files the team edited
// are reported (sketchbook upgrade replaces them); missing setup files (shared, from the template) come back too.
export function repair(root: string, { dryRun = false }: { dryRun?: boolean } = {}): { added: string[]; edited: string[]; hooks: string[] | undefined; git: GitSetup } {
  const harness = syncHarness(root, { dryRun });
  const m = loadOwnership(ENGINE);
  const restored: string[] = [];
  for (const rel of walk(TEMPLATE, '.')) {
    const live = rel === 'gitignore' ? '.gitignore' : rel.startsWith('.claude/') ? destOf(root, rel) : rel;
    if (classify(live, m) !== 'shared' || existsSync(join(root, live))) continue;
    // A project from before the configs became .ts keeps its .js one; both beside each other would be ambiguous.
    if (live.endsWith('.ts') && existsSync(join(root, live.replace(/\.ts$/, '.js')))) continue;
    restored.push(live);
    if (!dryRun) { mkdirSync(dirname(join(root, live)), { recursive: true }); copyFileSync(join(TEMPLATE, rel), join(root, live)); }
  }
  const git = dryRun ? {} : setupGit(root);
  return { added: [...harness.added, ...restored], edited: harness.edited, hooks: harness.hooks, git };
}
