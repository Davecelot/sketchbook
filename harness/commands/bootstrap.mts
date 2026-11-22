// sketchbook init in a folder that is not a Sketchbook project yet (SB-0097 to SB-0099). The whole project is built in a
// stage beside the target and moved in only when the checks pass, so a failure leaves the folder as it was. The engine
// is a dependency (node_modules), not copied; the Claude layer is staged in move-to-.claude/ for Claude to install.
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, writeFileSync, copyFileSync, cpSync, chmodSync, statSync, lstatSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import type { ComponentRegistry } from '../../generated/types/registry.js';
import { walk, HARNESS, ENGINE, globToRegExp, parseJson, readJson, readJsonSync, writeFileAtomic } from '../lib/files.mjs';
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
import { hookScript, readClaudeSettings } from '../lib/claude-layer.mjs';
import type { HookEntry, HookCommand } from '../lib/claude-layer.mjs';
import { emptyLog, inheritDecisions } from '../lib/decisions.mjs';
import { AGENT_ENGINE_FILES, agentFileState, claudeDestination, hasClaudeLayer, isAgentFile, profileFiles, renderAgentSetup, selectedAgentProfiles, STAGED, WORKFLOW_SKILLS } from '../lib/agent-config.mjs';
import type { AgentProfile } from '../lib/agent-config.mjs';
import { matchesLegacyCatalogFile, recommendedCatalogFiles } from '../lib/agent-catalog.mjs';
import { catalogProjections } from '../lib/agent-render.mjs';

export { STAGED };

export interface Warning { file: string | null; msg: string; fix: string | null }
export interface SyncResult { added: string[]; updated: string[]; edited: string[]; hooks: string[]; skipped: string[]; preserved: string[]; hookSettings?: string }
export interface GitSetup { inside?: string; warning?: Warning; line?: string | null }
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
  profiles?: AgentProfile[];
  dryRun?: boolean;
  install?: boolean;
  json?: boolean;
  out?: (line: string) => void;
}
interface PackageLock { name?: string; version?: string; packages: Record<string, unknown>; [k: string]: unknown }
type ProjectConfig = AdapterConfig & { catalog?: { source?: boolean; note?: string }; harnessVersion?: string; starter?: string; claudeExtras?: string[]; agentProfiles?: AgentProfile[] };

const TEMPLATE = join(HARNESS, 'templates/project');
const IGNORED = new Set(['.git', '.DS_Store']);
const fail = (msg: string, fix: string): FixError => Object.assign(new Error(msg), { fix });
const serialize = (j: unknown): string => JSON.stringify(j, null, 2) + '\n';
const enginePkg = (): EnginePackage => readJson<EnginePackage>(join(ENGINE, 'package.json'));
// The engine (harness/, scripts/) runs from node_modules; everything else the manifest calls harness-owned is copied.
// The Claude hooks' .mts sources stay with it too: a project gets their compiled .mjs, as the package ships them.
const isEngine = (f: string): boolean => /^(harness|scripts)\//.test(f) || (f.startsWith('.claude/') && f.endsWith('.mts'));

export const EXTRAS = ['forge'];
const groupOf = (f: string, m: HarnessManifest): string | null => Object.entries(m.optional ?? {}).find(([, globs]) => globs.some((g) => globToRegExp(g).test(f)))?.[0] ?? null;
const extrasOf = (root: string): string[] => readJsonSync<{ claudeExtras?: string[] }>(join(root, 'harness.config.json'), {})?.claudeExtras ?? [];

export const isProject = (dir: string): boolean => existsSync(join(dir, 'harness.config.json'));

// Harness-owned files of this install (harness/manifest.json "harness"), walked from each glob's fixed prefix only.
export function harnessFiles(source: string = ENGINE): { manifest: HarnessManifest; files: string[] } {
  const m = loadOwnership(source);
  const files = new Set<string>();
  for (const glob of m.harness) {
    const base = (glob.split(/[*?]/)[0] ?? '').replace(/\/$/, '');
    for (const f of walk(source, base)) if (classify(f, m) === 'harness') files.add(f);
  }
  return { manifest: m, files: [...files].sort() };
}

function claudeFiles(files: string[], manifest: HarnessManifest, extras: string[]): string[] {
  return files.filter((file) => {
    if (!file.startsWith('.claude/') || isEngine(file)) return false;
    const group = groupOf(file, manifest);
    return !group || extras.includes(group);
  });
}

export function expectedAgentFiles(root: string, profiles: AgentProfile[]): Set<string> {
  const expected = profileFiles(profiles);
  for (const { path } of recommendedCatalogFiles(profiles)) expected.add(path);
  if (profiles.includes('claude')) {
    const { files, manifest } = harnessFiles();
    const base = claudeDestination(root);
    for (const file of claudeFiles(files, manifest, extrasOf(root))) expected.add(file.replace(/^\.claude/, base));
    expected.add(`${base}/settings.json`);
    if (base === STAGED) expected.add(`${base}/INSTALL.md`);
  }
  return expected;
}

// Upgrade can refresh harness-owned files. Shared entry points and native adapter files are write-once.
export function syncHarness(root: string, {
  all = false, dryRun = false, agentsOnly = false, profiles = selectedAgentProfiles(root), extras = extrasOf(root),
}: { all?: boolean; dryRun?: boolean; agentsOnly?: boolean; profiles?: AgentProfile[]; extras?: string[] } = {}): SyncResult {
  const out: SyncResult = { added: [], updated: [], edited: [], hooks: [], skipped: [], preserved: [] };
  const { files, manifest } = harnessFiles();
  function copy(source: string, dest: string, { owned = false, agent = false, catalog = false } = {}) {
    const abs = join(root, dest);
    const state = agent ? agentFileState(root, dest) : existsSync(abs) ? 'file' : 'missing';
    if (state === 'blocked') { out.skipped.push(dest); return; }
    const template = readFileSync(source);
    const src = AGENT_ENGINE_FILES.some((file) => file === dest) ? Buffer.from(renderAgentSetup(dest, template.toString('utf8'), enginePkg().name)) : template;
    if (state === 'missing') out.added.push(dest);
    else {
      const current = readFileSync(abs);
      if (current.equals(src)) return;
      if (catalog ? !matchesLegacyCatalogFile(dest, current) : !owned) { out.preserved.push(dest); return; }
      (all ? out.updated : out.edited).push(dest);
    }
    if (dryRun || (state === 'file' && !all)) return;
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, src, { flag: agent && state === 'missing' ? 'wx' : 'w', mode: dest.startsWith('.githooks/') ? 0o755 : statSync(source).mode & 0o777 });
    if (dest.startsWith('.githooks/')) chmodSync(abs, 0o755);
  }
  if (!agentsOnly) {
    for (const file of files.filter((file) => !isEngine(file) && !isAgentFile(file))) copy(join(ENGINE, file), file, { owned: true });
  }
  for (const file of profileFiles(profiles)) {
    const source = file === 'CLAUDE.md' ? join(HARNESS, 'templates', file)
      : join(WORKFLOW_SKILLS.includes(file) ? ENGINE : TEMPLATE, file);
    copy(source, file, { agent: true });
  }
  for (const { source, path } of recommendedCatalogFiles(profiles)) copy(join(ENGINE, source), path, { agent: true, catalog: true });
  if (profiles.includes('claude')) {
    const base = claudeDestination(root);
    const knownLayer = hasClaudeLayer(root, base);
    const projected = new Set(catalogProjections().map(({ path }) => path));
    for (const file of claudeFiles(files, manifest, extras)) {
      copy(join(ENGINE, file), file.replace(/^\.claude/, base), { agent: true, owned: true, catalog: projected.has(file) || WORKFLOW_SKILLS.includes(file.replace(/^\.claude/, '.agents')) || file.includes('/hooks/') });
    }
    if (base === STAGED) copy(join(HARNESS, 'templates/move-to-claude-INSTALL.md'), `${base}/INSTALL.md`, { agent: true });
    const settings = `${base}/settings.json`;
    const state = agentFileState(root, settings);
    if (state === 'missing') copy(join(TEMPLATE, '.claude/settings.json'), settings, { agent: true });
    else if (state === 'blocked' || !knownLayer) out.skipped.push(settings);
    else {
      const hooks = mergeHooks(join(root, settings), dryRun);
      if (hooks === null) out.skipped.push(settings);
      else { out.hooks = hooks; out.hookSettings = settings; }
    }
  }
  return out;
}

// settings.json is the team's, so it is merged, not copied: every template hook whose command is missing is added;
// nothing the team has is removed, and only a Sketchbook hook from before the launcher (SB-0119), which calls its script
// directly, is changed: into the template's launcher command for the same script, so it runs once, from its current
// file. Returns the added and the replaced commands.
function mergeHooks(settingsPath: string, dryRun: boolean): string[] | null {
  const have = readClaudeSettings(settingsPath);
  if (!have) return null;
  const added: string[] = [];
  const template = readJsonSync<{ hooks?: Record<string, (HookEntry & { hooks: (HookCommand & { command: string })[] })[]> }>(join(TEMPLATE, '.claude/settings.json'));
  const script = (command: unknown): string | undefined => hookScript(command)?.replace(/\.m?js$/, '');
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
  if (added.length && !dryRun) writeFileSync(settingsPath, serialize(have));
  return added;
}

export function installAgents(root: string, requested: AgentProfile[], groups: string[], { dryRun = false }: { dryRun?: boolean } = {}) {
  validateExtras(groups);
  const configPath = join(root, 'harness.config.json');
  if (agentFileState(root, 'harness.config.json') !== 'file') throw fail('Cannot record agent profiles in harness.config.json.', 'Use a regular project config file.');
  const config = readJson<ProjectConfig>(configPath);
  const profiles = [...new Set([...selectedAgentProfiles(root), ...requested, ...(groups.length ? ['claude' as const] : [])])];
  const extras = [...new Set([...(config.claudeExtras ?? []), ...groups])];
  const configChanged = !Array.isArray(config.agentProfiles)
    || profiles.some((profile) => !config.agentProfiles?.includes(profile))
    || groups.some((group) => !config.claudeExtras?.includes(group));
  if (configChanged && !dryRun) writeFileAtomic(configPath, serialize({ ...config, agentProfiles: profiles, ...(extras.length ? { claudeExtras: extras } : {}) }));
  const result = syncHarness(root, { agentsOnly: true, dryRun, profiles, extras });
  return { ...result, profiles, configChanged };
}

function validateExtras(groups: string[]): void {
  const unknown = groups.filter((group) => !EXTRAS.includes(group));
  if (unknown.length) throw fail(`Unknown --with group: ${unknown.join(', ')}.`, `Choose from ${EXTRAS.join(', ')}.`);
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
export const engineSpec = (given?: string, cwd = process.cwd()): string => {
  if (!given) return existsSync(join(ENGINE, '.git')) ? `file:${ENGINE.replace(/\/$/, '')}` : `^${enginePkg().version}`;
  // npm resolves file specs from the generated package.json, which may be in a
  // different folder from the command. Anchor local paths to the caller.
  if (given.startsWith('file:') && !given.startsWith('file://')) {
    const path = given.slice('file:'.length);
    return path && !path.startsWith('~') ? `file:${resolve(cwd, path)}` : given;
  }
  if (/^(?:\.{1,2}[\\/]|\/|[A-Za-z]:[\\/])/.test(given) || (!given.includes(':') && /\.t(?:ar\.)?gz$/i.test(given))) return `file:${resolve(cwd, given)}`;
  return given;
};

// The project's package.json: a publishable library (its own dist and token CSS) whose tools come from the engine.
function projectPackage(name: string, spec: string) {
  const engine = enginePkg();
  const omit = (o: Record<string, string> | undefined, keys: string[]): Record<string, string> => Object.fromEntries(Object.entries(o ?? {}).filter(([k]) => !keys.includes(k)));
  const files = (engine.files ?? []).filter((p) => !/^(harness|scripts|\.agents|\.claude|\.githooks|docs|spec)(\/|$)/.test(p));
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

async function build(stage: string, target: string, { start, components, from, brand, spec, extras, profiles }: { start: string; components?: string; from?: string; brand: InitOptions; spec: string; extras: string[]; profiles: AgentProfile[] }) {
  const harness = harnessFiles();
  for (const file of walk(TEMPLATE, '.')) {
    if (!isAgentFile(file)) cpSync(join(TEMPLATE, file), join(stage, file));
  }
  renameSync(join(stage, 'gitignore'), join(stage, '.gitignore'));
  syncHarness(stage, { extras, profiles });
  for (const d of ['spec/components', 'src/components']) mkdirSync(join(stage, d), { recursive: true });
  copyFileSync(join(HARNESS, 'test/golden/brand.default.json'), join(stage, 'brand.config.json'));
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
  config.agentProfiles = profiles;
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
    const rel = (relative(top.stdout.trim(), target) || '.').split(sep).join('/');
    const fix = /^[\w./-]+$/.test(rel) && !rel.startsWith('-')
      ? `Add "npm --prefix ${rel} run check" to that repository's pre-commit hook, or run npm run check here before committing.`
      : 'Run npm run check from the design-system folder before committing, or add an equivalent command to the repository pre-commit hook.';
    return { inside: top.stdout.trim(), warning: { file: '.githooks/pre-commit', msg: `The pre-commit gate is not active: this folder is inside another repository (${top.stdout.trim()}), whose hooks were left alone.`, fix } };
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
function rootScriptsLocation(text: string): { count: number; afterBrace: number | null } {
  let depth = 0;
  let count = 0;
  let afterBrace: number | null = null;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      const start = i++;
      while (i < text.length && text[i] !== '"') { if (text[i] === '\\') i++; i++; }
      if (depth !== 1) continue;
      let cursor = i + 1;
      while (/\s/.test(text[cursor] ?? '') && cursor < text.length) cursor++;
      if (text[cursor] !== ':' || JSON.parse(text.slice(start, i + 1)) !== 'scripts') continue;
      count++;
      cursor++;
      while (/\s/.test(text[cursor] ?? '') && cursor < text.length) cursor++;
      afterBrace = text[cursor] === '{' ? cursor + 1 : null;
    } else if (char === '{' || char === '[') depth++;
    else if (char === '}' || char === ']') depth--;
  }
  return { count, afterBrace };
}

function wireApp(app: string, target: string): { lines: string[]; warnings: Warning[] } {
  const path = relative(app, target).split(sep).join('/');
  const rel = path.startsWith('-') ? `./${path}` : path;
  const lines: string[] = [];
  const warnings: Warning[] = [];
  const pkgPath = join(app, 'package.json');
  // Inspect the path itself: do not follow a team's symlink and modify its target.
  let packageStat;
  try { packageStat = lstatSync(pkgPath); } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { lines, warnings };
    warnings.push({ file: 'package.json', msg: 'The app package.json could not be inspected and was kept.', fix: 'Review it and add the design-system check script manually.' });
    return { lines, warnings };
  }
  if (packageStat.isFile()) {
    let text: string;
    let pkg: { scripts?: unknown; [k: string]: unknown };
    try {
      text = readFileSync(pkgPath, 'utf8');
      const parsed = parseJson<unknown>(text);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('package.json must contain an object');
      pkg = parsed as { scripts?: unknown; [k: string]: unknown };
    } catch {
      warnings.push({ file: 'package.json', msg: 'The app package.json could not be read as a JSON object and was kept.', fix: 'Review it and add the design-system check script manually.' });
      return { lines, warnings };
    }
    const key = `${slug(basename(target))}:check`;
    const location = rootScriptsLocation(text);
    if (location.count > 1 || (location.count === 1 && (!pkg.scripts || typeof pkg.scripts !== 'object' || Array.isArray(pkg.scripts) || location.afterBrace === null))) {
      warnings.push({ file: 'package.json', msg: 'The existing scripts field could not be safely updated and was kept.', fix: `Add a "${key}" script manually after reviewing package.json.` });
      return { lines, warnings };
    }
    if (!Object.hasOwn(pkg.scripts ?? {}, key)) {
      // Keep ordinary paths readable. For shell metacharacters, pass a base64
      // argument to npm's own CLI so neither POSIX shells nor cmd interpret it.
      const value = /^[\w./-]+$/.test(rel) ? `npm --prefix ${rel} run check`
        : /^[\w./ -]+$/.test(rel) ? `npm --prefix "${rel}" run check`
          : `node -e "process.exit(require('node:child_process').spawnSync(process.execPath,[process.env.npm_execpath,'--prefix',Buffer.from('${Buffer.from(rel).toString('base64')}','base64').toString(),'run','check'],{stdio:'inherit'}).status??1)"`;
      // Inserted as text at the top of "scripts", in the spacing that follows its brace, so every other byte stays.
      const start = location.afterBrace ?? text.indexOf('{') + 1;
      let end = start;
      while (/\s/.test(text[end] ?? '') && end < text.length) end++;
      const space = text.slice(start, end);
      const empty = text[end] === '}';
      const entry = `${JSON.stringify(key)}: ${JSON.stringify(value)}`;
      let next: string | null = location.count === 1
        ? text.slice(0, end) + `${entry}${empty ? space : `,${space || ' '}`}` + text.slice(end)
        : text.slice(0, end) + `"scripts": { ${entry} }${empty ? '' : `,${space || ' '}`}` + text.slice(end);
      try { JSON.parse(next); } catch { next = null; }
      if (!next) {
        warnings.push({ file: 'package.json', msg: 'The app check script could not be added safely; package.json was kept.', fix: `Add a "${key}" script manually after reviewing package.json.` });
        return { lines, warnings };
      }
      writeFileSync(pkgPath, next);
      lines.push(`App package.json: added the script "${key}" (npm run ${key} runs the design system's checks).`);
    } else warnings.push({ file: 'package.json', msg: `The existing "${key}" script was kept.`, fix: 'Review it before using it to run design-system checks.' });
  } else warnings.push({ file: 'package.json', msg: 'The app package.json is not a regular file and was kept.', fix: 'Review it and add the design-system check script manually.' });
  return { lines, warnings };
}

export async function bootstrap(cwd: string, { dir, adopt = false, start = 'library', components, from, opts = {}, engine, extras = [], profiles = [], dryRun = false, install = true, json = false, out = () => {} }: BootstrapOptions = {}) {
  dir ??= adopt ? 'design-system' : undefined;
  const target = resolve(cwd, dir ?? '.');
  validateExtras(extras);
  if (extras.length && !profiles.includes('claude')) profiles = [...profiles, 'claude'];
  if (existsSync(target)) {
    const present = readdirSync(target).filter((f) => !IGNORED.has(f));
    if (present.length) {
      throw dir
        ? fail(`${dir} already has files and is not a Sketchbook project, so init writes nothing there.`, 'Pick a new or empty folder with --dir.')
        : fail(`This folder already has files (${present.slice(0, 4).join(', ')}${present.length > 4 ? ', …' : ''}) and is not a Sketchbook project, so init writes nothing here.`, `sketchbook init --adopt adds the design system to this project in its own folder (design-system/, or --dir <folder>), without changing your files.`);
    }
  }
  const brand: InitOptions = Object.fromEntries(Object.entries(opts).filter(([k, v]) => k in INIT_OPTIONS && v !== undefined));
  const spec = engineSpec(engine, cwd);
  if (!dryRun) mkdirSync(dirname(target), { recursive: true });
  const stage = mkdtempSync(join(dryRun ? tmpdir() : dirname(target), '.sketchbook-init-'));
  try {
    const r = await build(stage, target, { start, components, from: from ? resolve(cwd, from) : undefined, brand, spec, extras, profiles });
    const files = walk(stage, '.');
    const checks = { exitCode: r.report.exitCode, failing: r.report.results.filter((x) => x.errors.length).map((x) => x.id) };
    const errors = r.report.results.flatMap((x) => x.errors.map((e) => ({ ...e, id: x.id })));
    if (r.report.exitCode === 1) return { exitCode: 1, errors, changed: [], data: { checks }, next: 'Nothing was written. Fix the cause above (each error has a fix), then run init again.' };
    const data = { target, engine: { package: enginePkg().name, spec }, starter: { id: start, components: r.starter.plan.components.target, kits: r.starter.plan.kits.target }, agentProfiles: profiles, staged: profiles.includes('claude') ? STAGED : null, checks, installed: r.installed };
    if (dryRun) return { changed: files, data, lines: [`Would create ${files.length} file(s) in ${target}: the engine as a dependency (${data.engine.package}@${spec}), agent profiles ${profiles.join(', ') || 'none'}, starter ${start} (${data.starter.components.length} component(s), ${data.starter.kits.length} kit(s)); checks ${checks.failing.length ? `fail: ${checks.failing.join(', ')}` : 'pass'}.`, ...files.filter(isAgentFile).map((file) => `  ${file}`)] };
    mkdirSync(target, { recursive: true });
    for (const e of readdirSync(stage)) renameSync(join(stage, e), join(target, e));
    const warnings: Warning[] = [];
    const lines = [...r.starter.lines];
    const g = setupGit(target);
    if (g.warning) warnings.push(g.warning); else if (g.line) lines.push(g.line);
    if (adopt) { const app = wireApp(cwd, target); lines.push(...app.lines); warnings.push(...app.warnings); }
    if (install) { out('Installing dependencies (npm install, then Chromium for the behavior tests)…'); warnings.push(...installDeps(target, json)); }
    else warnings.push({ file: 'package.json', msg: 'Dependencies not installed (--no-install).', fix: `cd ${target} && npm install && npx playwright install chromium` });
    if (r.starter.warning) warnings.push({ file: 'harness.config.json', msg: r.starter.warning, fix: null });
    const claude = profiles.includes('claude') ? `open Claude Code in ${dir ? dir : 'this folder'} and ask: "Install the Claude layer from ${STAGED}/ (follow ${STAGED}/INSTALL.md)"` : null;
    const workspace = g.inside && profiles.length
      ? `open ${dir ?? 'the design-system folder'} as the agent workspace${profiles.includes('copilot') ? '; verify Copilot hook discovery for the workspace; cloud and repository-root sessions need a root hook configuration' : ''}`
      : null;
    return { changed: files, warnings, data, lines, claudeStep: claude, next: [...(dir ? [`cd ${dir}`] : []), ...(workspace ? [workspace] : []), ...(claude ? [`for Claude Code: ${claude}`] : []), ...r.starter.next].join('; ') };
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
}

// sketchbook init again in a project: put back what is missing, never overwrite. Harness-owned files the team edited
// are reported (sketchbook upgrade replaces them); missing setup files (shared, from the template) come back too.
export function repair(root: string, { dryRun = false }: { dryRun?: boolean } = {}): SyncResult & { git: GitSetup } {
  const harness = syncHarness(root, { dryRun });
  const m = loadOwnership(ENGINE);
  const restored: string[] = [];
  for (const rel of walk(TEMPLATE, '.')) {
    if (isAgentFile(rel)) continue;
    const live = rel === 'gitignore' ? '.gitignore' : rel;
    if (classify(live, m) !== 'shared' || existsSync(join(root, live))) continue;
    // A project from before the configs became .ts keeps its .js one; both beside each other would be ambiguous.
    if (live.endsWith('.ts') && existsSync(join(root, live.replace(/\.ts$/, '.js')))) continue;
    restored.push(live);
    if (!dryRun) {
      mkdirSync(dirname(join(root, live)), { recursive: true });
      copyFileSync(join(TEMPLATE, rel), join(root, live));
    }
  }
  const git = dryRun ? {} : setupGit(root);
  return { ...harness, added: [...harness.added, ...restored], git };
}
