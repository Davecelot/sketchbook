// sketchbook tokens …: change foundations and semantic tokens through the harness. Every mutating operation is a plan
// (the files it writes, or an apply(dir) step) run by runPlan on a temporary stage: write → regenerate (foundation +
// links) → build → brands → interface → token checks; a real run copies the changed files back only when they pass.
import { readFile, writeFile, mkdtemp, rm, mkdir, access, stat, readdir } from 'node:fs/promises';
import type { Stats } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import type { BrandConfig } from '../../generated/types/brand-config.js';
import type { HarnessConfigJson } from '../../generated/types/harness-config.js';
import { runGenerator, generate, buildFoundation } from '../generators/foundation.mjs';
import type { GeneratorResult, OverridesDoc } from '../generators/foundation.mjs';
import { computeLinks, foundationMap } from '../generators/links.mjs';
import type { BrandLink, BrandLinks, SemanticDocs } from '../generators/links.mjs';
import { buildTokens } from '../build/index.mjs';
import { validate } from '../lib/schema.mjs';
import { engineSchema, errorMessage, parseJson } from '../lib/files.mjs';
import { flatten, loadAll, ALIAS } from '../lib/tokens.mjs';
import type { DtcgDoc, Layer, TokenData } from '../lib/tokens.mjs';
import { cssVarName } from '../lib/css.mjs';
import { KNOWN as TYPES, VALUE } from '../checks/t1-tokens-valid.mjs';
import { buildCatalog, readConfig } from './catalog.mjs';
import type { FixError } from './catalog.mjs';
import { buildBrands } from './brand.mjs';
import { buildInterface, loadInterfaceInputs, collectReferences, varIndex, referenceFiles, INTERFACE_FILE } from '../lib/interface.mjs';
import type { ContrastPair, InterfaceDoc, InterfaceToken, Reference } from '../lib/interface.mjs';
import { renameJsonText, renameCodeText } from '../lib/renames.mjs';
import type { Rename } from '../lib/renames.mjs';
import { patternFiles } from '../lib/design-docs.mjs';
import { resolveBrand, families, family, presetsOf, getPreset, FAMILY_KEYS, modesOf } from '../standards/resolve.mjs';
import type { Mode } from '../standards/resolve.mjs';

// A DTCG token node (a group is any other object in the document).
export interface DtcgTokenNode { $value: unknown; $type?: unknown; $description?: unknown; [k: string]: unknown }
export interface PlanDecision { title: string; decision: string }
// What every token command plans: the files it writes (or an apply step on the stage), and what it reports.
export interface TokenPlan<D = unknown> { files?: Record<string, string>; apply?: (dir: string) => Promise<void>; summary: string[]; warnings: string[]; data: D; decision?: PlanDecision }
export interface CheckIssue { file?: string | null; msg: string; fix?: string | null; token?: string; [k: string]: unknown }
export interface CheckReport { exitCode: number; results: { id: string; errors: CheckIssue[]; warnings: CheckIssue[] }[] }
export type PlanIssue = CheckIssue & { id: string };
export interface RunPlanOptions<R extends CheckReport = CheckReport> {
  dryRun?: boolean;
  check?: (dir: string) => Promise<R>;
  finalize?: (dir: string, diff: CssDiff) => Promise<PlanIssue | void>;
}
export interface RunPlanResult<R extends CheckReport = CheckReport> {
  diff: CssDiff;
  changed: string[];
  applied: boolean;
  failed: boolean;
  errors: PlanIssue[];
  conflict: string[];
  notRestored?: string[];
  warnings: PlanIssue[];
  report: R | null;
  linkWarnings: GeneratorResult['links']['missing'];
  linked: string[];
  overrides: GeneratorResult['overrides'];
}
export type CssVars = Record<string, Map<string, string>>;
export interface CssModeDiff {
  added: { name: string; after: string }[];
  removed: { name: string; before: string }[];
  changed: { name: string; before: string | undefined; after: string }[];
}
export type CssDiff = Record<string, CssModeDiff>;
export interface Impact {
  token: string;
  layer: Layer;
  cssVar: string;
  values: Record<string, unknown>;
  aliasedBy: { path: string; modes: string[] }[];
  links: string[];
  contracts: { name: string; uses: string[] }[];
  contrast: string[];
  files: { file: string; category: string; ref: string; via: string }[];
  interface: InterfaceToken | null;
}
export interface ScratchQuestion { key: string; q: string; default?: string; family?: string; hint?: string }
export interface RenamesDoc { $description?: string; renames?: Rename[] }
interface LinksDoc { links?: BrandLinks; [k: string]: unknown }
type Indexable = Record<string, unknown>;

const CSS = 'generated/css/tokens.css';
const BRAND = 'brand.config.json';
const CONTRAST = 'spec/tokens/contrast.json';
const LINKS = 'spec/tokens/brand-links.json';
export const RENAMES = 'spec/tokens/renames.json';
const RENAMES_DESCRIPTION = 'Semantic token renames, oldest first. Catalog installs apply them to incoming components and kits (SB-0059..62).';
const semanticFile = (name: string): string => `spec/tokens/semantic/${name}.tokens.json`;

const readText = async (root: string, rel: string): Promise<string | null> => { try { return await readFile(join(root, rel), 'utf8'); } catch { return null; } };
const readJson = async <T = unknown,>(root: string, rel: string): Promise<T | null> => {
  const t = await readText(root, rel);
  if (t === null) return null;
  try { return parseJson<T>(t); } catch (e) { throw fail(`${rel} is not valid JSON (${errorMessage(e)}). Nothing was written.`, 'Fix the file (git diff shows what changed), then run the command again.'); }
};
const exists = async (p: string): Promise<boolean> => { try { await access(p); return true; } catch { return false; } };
export const serialize = (doc: unknown): string => JSON.stringify(doc, null, 2) + '\n';
export const fail = (msg: string, fix: string): FixError => Object.assign(new Error(msg), { fix });
const isObj = (v: unknown): v is Indexable => v !== null && typeof v === 'object' && !Array.isArray(v);
// String() taken while the value is still unknown: the same coercion a template literal did in the untyped code.
const show = (v: unknown): string => String(v);
const isIndexable = (v: unknown): v is Indexable => typeof v === 'object' && v !== null;
// Dot-path walks over parsed JSON: where the untyped property access threw a TypeError (a missing or non-object
// brand.config.json), this throws the same error.
function indexable(v: unknown, k: string, op: 'read' | 'set'): Indexable {
  if (isIndexable(v)) return v;
  if (v === null || v === undefined) throw new TypeError(`Cannot ${op} properties of ${String(v)} (${op === 'read' ? 'reading' : 'setting'} '${k}')`);
  throw new TypeError(`Cannot create property '${k}' on ${typeof v} '${show(v)}'`);
}
const lastOf = (parts: string[]): string => parts.at(-1) ?? '';

// ---------- CSS diff ----------

// tokens.css -> { mode: Map(var -> value) }. ":root" holds mode-less values; the prefers-color-scheme copy is skipped.
export function parseCssVars(text: string | null | undefined): CssVars {
  const modes: CssVars = {};
  const stack: string[] = [];
  for (const line of (text ?? '').split('\n')) {
    const open = /^\s*(.+?)\s*\{\s*$/.exec(line);
    if (open) { stack.push(open[1] ?? ''); continue; }
    if (/^\s*\}\s*$/.test(line)) { stack.pop(); continue; }
    const decl = /^\s*(--[A-Za-z0-9_-]+)\s*:\s*(.*?);?\s*$/.exec(line);
    if (!decl || !stack.length || stack.some((s) => s.startsWith('@media'))) continue;
    const theme = /\[data-theme="([^"]+)"\]/.exec(stack.at(-1) ?? '');
    const mode = theme ? (theme[1] ?? '') : ':root';
    (modes[mode] ??= new Map()).set(decl[1] ?? '', decl[2] ?? '');
  }
  return modes;
}

export function cssDiff(before: string | null | undefined, after: string | null | undefined): CssDiff {
  const a = parseCssVars(before);
  const b = parseCssVars(after);
  const out: CssDiff = {};
  for (const mode of [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()) {
    const x = a[mode] ?? new Map<string, string>();
    const y = b[mode] ?? new Map<string, string>();
    const d: CssModeDiff = { added: [], removed: [], changed: [] };
    for (const [k, v] of y) if (!x.has(k)) d.added.push({ name: k, after: v }); else if (x.get(k) !== v) d.changed.push({ name: k, before: x.get(k), after: v });
    for (const [k, v] of x) if (!y.has(k)) d.removed.push({ name: k, before: v });
    if (d.added.length || d.removed.length || d.changed.length) out[mode] = d;
  }
  return out;
}

export function formatDiff(diff: CssDiff, limit = 12, more = 'sketchbook tokens diff'): string[] {
  const lines: string[] = [];
  const modes = Object.entries(diff);
  if (!modes.length) return ['CSS: no custom property changed.'];
  for (const [m, d] of modes) {
    lines.push(`CSS ${m}: ${d.changed.length} changed, ${d.added.length} added, ${d.removed.length} removed`);
    const rows = [...d.changed.map((c) => `  ~ ${c.name}: ${c.before} -> ${c.after}`), ...d.added.map((c) => `  + ${c.name}: ${c.after}`), ...d.removed.map((c) => `  - ${c.name}`)];
    lines.push(...rows.slice(0, limit), ...(rows.length > limit ? [`  … ${rows.length - limit} more (${more})`] : []));
  }
  return lines;
}

export function gitCss(root: string, ref = 'HEAD'): string {
  const r = spawnSync('git', ['-C', root, 'show', `${ref}:./${CSS}`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw fail(`Cannot read ${CSS} at ${ref}: ${(r.stderr || '').trim().split('\n')[0] || 'not a git repository'}`, 'Run inside a git repository with the file committed, or pass --against <ref>.');
  return r.stdout;
}

export async function diffAgainst(root: string, ref = 'HEAD'): Promise<CssDiff> {
  const now = await readText(root, CSS);
  if (now === null) throw fail(`${CSS} not found.`, 'Run npm run tokens.');
  return cssDiff(gitCss(root, ref), now);
}

// ---------- impact ----------

const aliasOf = (v: unknown): string | null => (typeof v === 'string' ? ALIAS.exec(v)?.[1] ?? null : null);

export async function impact(root: string, target: string): Promise<Impact> {
  const inputs = await loadInterfaceInputs(root);
  const { all, prefix } = inputs;
  const index = varIndex(all, prefix);
  const path = target.startsWith('--') ? index.get(target)?.path : target;
  const where = all.sets.flatMap((s) => s.tokens.filter((t) => t.path === path).map((t) => ({ layer: s.layer, mode: s.mode, value: t.value, type: t.type, file: t.file })));
  const first = where[0];
  if (!path || !first) {
    const known = [...index.values()].map((v) => v.path);
    const near = known.filter((p) => p.includes(String(target).replace(/^--[a-z0-9]+-/, '').split(/[.-]/).filter(Boolean).at(-1) ?? '')).slice(0, 8);
    throw fail(`No token ${target}.`, near.length ? `Did you mean: ${near.join(', ')}?` : 'Pass a token path (color.primary) or a CSS variable (--sb-color-primary).');
  }
  const layer = first.layer;
  // Semantic tokens that alias it (for a foundation token), per mode.
  const aliasedBy: { path: string; mode: string }[] = [];
  for (const s of all.sets.filter((x) => x.layer === 'semantic')) for (const t of s.tokens) if (aliasOf(t.value) === path) aliasedBy.push({ path: t.path, mode: s.mode ?? 'base' });
  const paths = new Set([path, ...aliasedBy.map((a) => a.path)]);
  const refs = collectReferences(inputs).filter((r) => paths.has(r.path));
  const contracts: Record<string, string[]> = {};
  for (const r of refs.filter((x) => x.source.startsWith('contract:'))) (contracts[r.source.slice(9)] ??= []).push(`${r.detail}${r.path !== path ? ` (via ${r.path})` : ''}`);
  for (const { name, contract } of all.contracts) {
    for (const [tp, def] of Object.entries(contract?.tokens ?? {})) {
      const use = `component token ${tp}`;
      if (tp === path || aliasOf(typeof def === 'string' ? def : def?.value) === path) {
        const uses = (contracts[name] ??= []);
        if (!uses.includes(use)) uses.push(use);
      }
    }
  }
  const iface = (await readJson<InterfaceDoc>(root, INTERFACE_FILE))?.tokens?.[path] ?? null;
  return {
    token: path, layer, cssVar: cssVarName(prefix, path),
    values: Object.fromEntries(where.map((w) => [w.mode ?? (w.layer === 'semantic' ? 'base' : w.layer), w.value])),
    aliasedBy: [...new Map(aliasedBy.map((a) => [a.path, { path: a.path, modes: aliasedBy.filter((b) => b.path === a.path).map((b) => b.mode) }])).values()],
    links: refs.filter((r) => r.source === 'brand-links').map((r) => `${r.path}: ${r.detail}`),
    contracts: Object.entries(contracts).sort(([a], [b]) => a.localeCompare(b)).map(([name, uses]) => ({ name, uses: [...new Set(uses)] })),
    contrast: refs.filter((r) => r.source === 'contrast').map((r) => r.detail),
    files: refs.filter((r): r is Reference & { file: string } => Boolean(r.file)).map((r) => ({ file: r.file, category: r.source, ref: r.detail.split(' ')[0] ?? '', via: r.path })),
    interface: iface,
  };
}

export function formatImpact(i: Impact): string[] {
  const out = [`${i.token} (${i.layer}, ${i.cssVar})`];
  out.push(`  values: ${Object.entries(i.values).map(([m, v]) => `${m} ${JSON.stringify(v)}`).join(', ')}`);
  if (i.interface) out.push(`  interface token (used by ${i.interface.usedBy.join(', ')}): rename only with sketchbook tokens rename`);
  if (i.aliasedBy.length) out.push(`  aliased by ${i.aliasedBy.length} semantic token(s): ${i.aliasedBy.map((a) => `${a.path} [${a.modes.join(', ')}]`).join(', ')}`);
  if (i.links.length) out.push(`  brand links: ${i.links.join('; ')}`);
  out.push(`  contracts: ${i.contracts.length ? i.contracts.map((c) => c.name).join(', ') : 'none'}`);
  if (i.contrast.length) out.push(`  contrast pairs: ${i.contrast.length}`);
  if (i.files.length) out.push(`  files: ${[...new Set(i.files.map((f) => f.ref))].join(', ')}`);
  return out;
}

export const dependents = (i: Impact): string[] => [
  ...i.aliasedBy.filter((a) => a.path !== i.token).map((a) => `semantic ${a.path}`),
  ...i.links.map((l) => `brand link ${l}`),
  ...i.contracts.map((c) => `contract ${c.name} (${c.uses.join('; ')})`),
  ...i.contrast.map((c) => `contrast ${c}`),
  ...i.files.map((f) => `${f.category} ${f.ref}`),
];

// ---------- running a plan ----------

// Every plan runs on a temporary stage: the token sources and outputs (COPY) plus what the token checks read (stories,
// specs, patterns, CLI docs, catalog, brands). The stage is regenerated, rebuilt and checked; a real run copies back
// only the files whose content changed, and only when the checks pass, so a refused change leaves the tree untouched.
// The stage records the hash of every file it copies in (the snapshot). What changed is the stage against that
// snapshot, never against the live tree, so files saved or created in the project while a command runs (an editor's
// autosave, another agent) are not the command's to revert or delete. Before copying back, every target must still
// hold its snapshot content; otherwise the command refuses and writes nothing (SB-0070).
const COPY = ['spec', BRAND, 'harness.config.json', 'generated/css', 'generated/tokens', 'generated/foundation.snapshot.json'];
const STAGE = [...COPY, 'brands', 'src', 'playwright', '.storybook', 'docs', 'harness/cli/known-commands.json', 'harness/kits', 'harness/catalog'];
const SKIP = new Set(['node_modules', 'dist', 'storybook-static', '.git', 'test-results', 'playwright-report', '.tmp']);
const hash = (buf: Buffer): string => createHash('sha256').update(buf).digest('hex');

// Test seams at the snapshot and copy-back boundaries.
export const stageHooks: {
  beforeStage: ((root: string) => Promise<void>) | null;
  beforeCopyBack: ((root: string, stage: string) => Promise<void>) | null;
} = { beforeStage: null, beforeCopyBack: null };

async function writeFiles(dir: string, files: Record<string, string> | undefined): Promise<void> {
  for (const [rel, content] of Object.entries(files ?? {})) { await mkdir(dirname(join(dir, rel)), { recursive: true }); await writeFile(join(dir, rel), content); }
}

// Relative path -> absolute path of every file under the staged paths (same skip list on both sides).
async function filesUnder(root: string): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const walk = async (rel: string): Promise<void> => {
    let st: Stats;
    try { st = await stat(join(root, rel)); } catch { return; }
    if (st.isFile()) { out.set(rel, join(root, rel)); return; }
    if (!st.isDirectory()) return;
    for (const e of await readdir(join(root, rel), { withFileTypes: true })) if (!SKIP.has(e.name)) await walk(`${rel}/${e.name}`);
  };
  for (const p of STAGE) await walk(p);
  return out;
}

// Copies the staged paths into the stage, file by file, and returns rel -> content hash of what was copied.
async function stageIn(root: string, stage: string): Promise<Map<string, string>> {
  const snapshot = new Map<string, string>();
  for (const [rel, abs] of await filesUnder(root)) {
    const buf = await readFile(abs);
    await mkdir(dirname(join(stage, rel)), { recursive: true });
    await writeFile(join(stage, rel), buf);
    snapshot.set(rel, hash(buf));
  }
  return snapshot;
}

// Files the plan changed: stage content against the snapshot (added, changed, or a snapshot file the stage removed).
async function changedFiles(snapshot: Map<string, string>, stage: string): Promise<string[]> {
  const now = await filesUnder(stage);
  const out: string[] = [];
  for (const [rel, abs] of now) if (snapshot.get(rel) !== hash(await readFile(abs))) out.push(rel);
  for (const rel of snapshot.keys()) if (!now.has(rel)) out.push(rel);
  return out.sort();
}

const liveHash = async (root: string, rel: string): Promise<string | null> => { try { return hash(await readFile(join(root, rel))); } catch { return null; } };

// Targets whose live content no longer matches the snapshot (edited, created or deleted since staging).
async function conflicts(root: string, snapshot: Map<string, string>, files: string[]): Promise<string[]> {
  const out: string[] = [];
  for (const rel of files) if ((await liveHash(root, rel)) !== (snapshot.get(rel) ?? null)) out.push(rel);
  return out;
}

// On failure, restore the targets we touched and report any we could not restore.
async function copyBack(root: string, stage: string, files: string[]): Promise<{ issue: PlanIssue; notRestored: string[] } | null> {
  const backup: [string, Buffer | null][] = [];
  let target: string | null = null;
  try {
    for (const rel of files) {
      target = rel;
      const to = join(root, rel);
      let prev: Buffer | null = null;
      try { prev = await readFile(to); } catch (e) {
        if (!isObj(e) || e.code !== 'ENOENT') throw e;
      }
      backup.push([rel, prev]);
      const from = join(stage, rel);
      if (await exists(from)) { await mkdir(dirname(to), { recursive: true }); await writeFile(to, await readFile(from)); } else await rm(to, { force: true });
    }
  } catch (e) {
    const notRestored: string[] = [];
    for (const [rel, prev] of backup.reverse()) {
      const originalHash = prev === null ? null : hash(prev);
      if (await liveHash(root, rel) === originalHash) continue;
      const to = join(root, rel);
      try {
        if (prev === null) await rm(to, { force: true });
        else { await mkdir(dirname(to), { recursive: true }); await writeFile(to, prev); }
      } catch { notRestored.push(rel); }
    }
    return {
      notRestored,
      issue: {
        file: target, id: 'write',
        msg: `Could not update ${target}: ${firstLine(e)}.${notRestored.length ? ` Could not restore: ${notRestored.join(', ')}.` : ' Project files were restored.'}`,
        fix: notRestored.length ? 'Review git diff and restore the listed files before retrying.' : 'Check the path and its write permissions, then run the command again.',
      },
    };
  }
  return null;
}

const firstLine = (e: unknown): string => String((typeof e === 'object' && e !== null && 'message' in e ? e.message : undefined) ?? e).split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 3).join(' ');

// check: async (dir) => runChecks report (the CLI passes the token checks); a failing report applies nothing.
type PlanWrites = Pick<TokenPlan, 'files' | 'apply'>;
export async function runPlan<R extends CheckReport = CheckReport>(root: string, prepare: PlanWrites | ((dir: string) => Promise<PlanWrites>), { dryRun = false, check, finalize }: RunPlanOptions<R> = {}): Promise<RunPlanResult<R>> {
  const tmp = await mkdtemp(join(tmpdir(), 'sketchbook-stage-'));
  try {
    if (stageHooks.beforeStage) await stageHooks.beforeStage(root);
    const snapshot = await stageIn(root, tmp);
    const before = await readText(tmp, CSS);
    const plan = typeof prepare === 'function' ? await prepare(tmp) : prepare;
    if (plan.apply) await plan.apply(tmp);
    else await writeFiles(tmp, plan.files);
    let gen: Pick<GeneratorResult, 'links' | 'overrides'> = { links: { changed: [], missing: [] }, overrides: { kept: [], added: [], dropped: [] } };
    let buildError: unknown = null;
    try {
      gen = await rebuild(tmp);
      await buildBrands(tmp);
      await buildInterface(tmp);
      // In the catalog's source repo, edits to stories and specs (rename) must reach the catalog too (G1).
      if (readConfig(tmp).catalog?.source === true && (await exists(join(tmp, 'src/components')))) buildCatalog(tmp);
    } catch (e) { buildError = e; }
    const after = await readText(tmp, CSS);
    const report = check ? await check(tmp) : null;
    const errors: PlanIssue[] = report ? report.results.flatMap((r) => r.errors.map((e) => ({ ...e, id: r.id }))) : [];
    if (buildError) {
      const cause = errors.filter((e) => ['T1', 'T2', 'T3'].includes(e.id)).slice(0, 3).map((e) => `${e.id} ${e.file}${e.token ? ` ${e.token}` : ''}: ${e.msg}`);
      errors.unshift({ file: CSS, id: 'build', msg: `the rebuild failed: ${firstLine(buildError)}`, fix: cause.length ? `Underlying: ${cause.join('; ')}.` : 'Run sketchbook check --only=T1,T2,T3 on the change; each error names its fix.' });
    }
    let failed = Boolean(buildError) || report?.exitCode === 1;
    const diff = buildError ? {} : cssDiff(before, after);
    let changed = await changedFiles(snapshot, tmp);
    if (!failed && changed.length && finalize) {
      const issue = await finalize(tmp, diff);
      if (issue) { errors.push(issue); failed = true; }
      else changed = await changedFiles(snapshot, tmp);
    }
    let conflict: string[] = [];
    let notRestored: string[] | undefined;
    if (!dryRun && !failed) {
      if (stageHooks.beforeCopyBack) await stageHooks.beforeCopyBack(root, tmp);
      conflict = await conflicts(root, snapshot, changed);
      if (conflict.length) {
        failed = true;
        errors.unshift({ file: conflict[0], id: 'conflict', msg: `${conflict.length} file(s) changed in the project while the command ran, and the command would overwrite them: ${conflict.slice(0, 6).join(', ')}${conflict.length > 6 ? ', …' : ''}. Nothing was written.`, fix: 'Save or commit those edits, then run the command again (it starts from the files as they are then).' });
      } else {
        const failure = await copyBack(root, tmp, changed);
        if (failure) {
          errors.push(failure.issue);
          notRestored = failure.notRestored;
          failed = true;
        }
      }
    }
    return {
      diff, changed, applied: !dryRun && !failed, failed, errors, conflict, ...(notRestored?.length ? { notRestored } : {}),
      warnings: report ? report.results.flatMap((r) => r.warnings.map((w) => ({ ...w, id: r.id }))) : [],
      report, linkWarnings: gen.links.missing, linked: gen.links.changed, overrides: gen.overrides,
    };
  } finally { await rm(tmp, { recursive: true, force: true }); }
}

async function rebuild(dir: string): Promise<GeneratorResult> {
  const gen = await runGenerator(dir, { quiet: true });
  await buildTokens({ root: dir });
  return gen;
}

// Linked semantic tokens whose value differs from what their brand link computes: a hand edit the next
// regenerate would silently revert (G1 calls them stale). Token commands refuse to run over them without --yes.
export async function staleLinks(root: string): Promise<string[]> {
  const brand = await readJson<BrandConfig>(root, BRAND);
  const links = (await readJson<LinksDoc>(root, LINKS))?.links;
  if (!brand || !links) return [];
  let built;
  try { built = buildFoundation(brand, (await readJson<OverridesDoc>(root, 'spec/tokens/overrides.json'))?.overrides ?? {}); } catch { return []; }
  const semantic: SemanticDocs = {};
  for (const name of ['base', ...built.resolved.modes.map((m) => m.name)]) { const d = await readJson<DtcgDoc>(root, semanticFile(name)); if (d) semantic[name] = d; }
  return computeLinks({ links, semantic, resolved: built.resolved, anchors: built.anchors, fmap: foundationMap(built.files) }).changed;
}

// Semantic tokens whose CSS variable changed, with the contracts that use them.
export async function impactOfDiff(root: string, diff: CssDiff): Promise<{ semantic: string[]; components: string[] }> {
  const { all, prefix } = await loadInterfaceInputs(root);
  const index = varIndex(all, prefix);
  const names = new Set(Object.values(diff).flatMap((d) => [...d.changed, ...d.added, ...d.removed].map((x) => x.name)));
  const semantic = [...names].map((n) => index.get(n)).filter((x): x is { path: string; layer: Layer } => x?.layer === 'semantic').map((x) => x.path);
  const uses = new Map<string, string[]>();
  for (const { name, contract } of all.contracts) {
    for (const def of Object.values(contract?.tokens ?? {})) {
      const t = aliasOf(typeof def === 'string' ? def : def?.value);
      if (t && semantic.includes(t)) uses.set(name, [...new Set([...(uses.get(name) ?? []), t])]);
    }
  }
  return { semantic: [...new Set(semantic)].sort(), components: [...uses.keys()].sort() };
}

// ---------- brand.config: set and preset ----------

const TOKEN_ALIAS = /^\{[A-Za-z0-9_-]+(\.[A-Za-z0-9_-]+)*\}$/;

export function parseValue(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw;
  const s = raw.trim();
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  if (['true', 'false', 'null'].includes(s)) return parseJson(s);
  // JSON first: a flat object ({"hue":250}) has no nested braces either; only a bare {dot.path} is a token alias.
  if (/^[[{]/.test(s)) {
    try { return parseJson(s); } catch {
      if (TOKEN_ALIAS.test(s)) return s;
      throw fail(`Value ${raw} is not valid JSON.`, 'Quote JSON values, e.g. \'[4, 8, 12]\' or \'{"hue":250}\'; a token alias is {group.token}.');
    }
  }
  return s;
}

// Path segments that would reach Object.prototype through a plain object walk.
const UNSAFE = new Set(['__proto__', 'prototype', 'constructor']);
export function safeParts(path: string): string[] {
  const parts = String(path).split('.');
  const bad = parts.find((p) => UNSAFE.has(p));
  if (bad) throw fail(`"${path}" has the segment "${bad}", which is not allowed in a key or token path.`, 'Use a plain name (letters, digits, dashes).');
  return parts;
}

// Object(n): a primitive along the path is read like the untyped n[k] read it (a string's length, say).
const getIn = (obj: unknown, parts: string[]): unknown => parts.reduce<unknown>((n, k) => (n === undefined || n === null ? undefined : Reflect.get(Object(n), k)), obj);

export async function validateBrand(root: string, brand: BrandConfig): Promise<void> {
  const schema = engineSchema('brand-config', root);
  const errs = schema ? validate(schema, brand) : [];
  if (errs.length) throw fail(`brand.config.json would be invalid: ${errs.slice(0, 3).join('; ')}`, 'Match spec/schemas/brand-config.schema.json (sketchbook presets <family> for ids).');
  try { resolveBrand(brand); } catch (e) { throw fail(errorMessage(e), 'See sketchbook tokens presets <foundation> for the ids that exist.'); }
  // The new foundation must still hold every token the semantic layer aliases (a partial custom scale drops steps),
  // judged after the brand links re-point their tokens to the new preset's roles (as tokens:generate will): a motion
  // or z preset with other step names moves motion.* and layer.* with it instead of losing {duration.200} or {z.10}.
  const overrides = (await readJson<OverridesDoc>(root, 'spec/tokens/overrides.json'))?.overrides ?? {};
  const { docs } = await semanticDocs(root, brand);
  const links = (await readJson<LinksDoc>(root, LINKS))?.links ?? {};
  const relink = (b: BrandConfig | null) => {
    const { files, anchors, resolved } = generate(b);
    const fmap = foundationMap(files);
    for (const [p, o] of Object.entries(overrides)) if (!fmap.has(p)) fmap.set(p, o.value);
    const semantic = structuredClone(docs);
    const { missing } = computeLinks({ links, semantic, resolved, anchors, fmap });
    return { made: fmap, semantic, missing };
  };
  const next = relink(brand);
  let before = new Set<string>();
  try { before = new Set(relink(await readJson<BrandConfig>(root, BRAND)).missing.map((m) => m.token)); } catch { /* no valid brand on disk */ }
  const broken = next.missing.filter((m) => !before.has(m.token));
  const own = new Set(Object.values(next.semantic).flatMap((d) => flatten(d).map((t) => t.path)));
  const lost = [...new Set(Object.values(next.semantic).flatMap((d) => flatten(d).map((t) => aliasOf(t.value)).filter((a): a is string => a !== null && a !== '' && !own.has(a) && !next.made.has(a))))];
  const fix = 'Give the whole scale (a preset, or custom with every step or a base), or a fine override of one step (e.g. radius.scale.lg instead of radius.custom.lg).';
  if (lost.length) throw fail(`The foundation would lose ${lost.length} token(s) the semantic layer aliases: ${lost.slice(0, 6).join(', ')}${lost.length > 6 ? ', …' : ''}.`, fix);
  if (broken.length) throw fail(`${broken.length} brand link(s) could not follow the new values: ${broken.slice(0, 3).map((m) => m.msg).join('; ')}${broken.length > 3 ? '; …' : ''}.`, `Every role ${LINKS} uses must point at a step that exists: keep the role on an existing step, add the step next to it (e.g. z.values.600), or remove the link to own the token by hand.`);
}

// Family ids, their config keys, and plain area names (the foundations skill's words) -> families.
const AREAS: Record<string, string[]> = {
  color: ['rampMethods', 'neutrals'], typography: ['typeScale', 'lineHeight', 'letterSpacing', 'weights'], type: ['typeScale'],
  'type-scale': ['typeScale'], 'line-height': ['lineHeight'], 'letter-spacing': ['letterSpacing'], neutral: ['neutrals'], ramp: ['rampMethods'],
  'layout-grid': ['layoutGrid'], grid: ['layoutGrid'], icons: ['iconSizes'], 'z-index': ['zIndex'], z: ['zIndex'], border: ['borderWidth'],
};

export function familiesFor(name: string): string[] {
  if (families().includes(name)) return [name];
  const area = AREAS[name];
  if (area) return area;
  const byKey = Object.entries(FAMILY_KEYS).filter(([, k]) => k === name).map(([f]) => f);
  if (byKey.length) return byKey;
  throw fail(`Unknown foundation "${name}".`, `Use a family (${families().join(', ')}) or an area (${Object.keys(AREAS).join(', ')}).`);
}

// Keys kept when a foundation switches preset (they configure, they do not override values).
const KEEP_ON_PRESET: Record<string, string[]> = { contrast: ['apca'], 'color.ramp': ['steps'] };

function setPreset(brand: unknown, keyPath: string, id: unknown): { old: unknown; dropped: string[] } {
  const parts = safeParts(keyPath);
  const old = getIn(brand, parts);
  const keep = KEEP_ON_PRESET[keyPath] ?? [];
  const next: Indexable = { preset: id };
  const dropped: string[] = [];
  if (isObj(old)) {
    for (const [k, v] of Object.entries(old)) {
      if (k === '$description' || keep.includes(k)) next[k] = v;
      else if (k !== 'preset') dropped.push(k);
    }
  }
  let node: unknown = brand;
  for (const k of parts.slice(0, -1)) { const n = indexable(node, k, 'read'); const child = n[k]; node = n[k] = isObj(child) ? child : {}; }
  indexable(node, lastOf(parts), 'set')[lastOf(parts)] = next;
  return { old, dropped };
}

export async function planSet(root: string, key: string, raw: unknown): Promise<TokenPlan<{ key: string; before: unknown; after: unknown }>> {
  const brand = await readJson<BrandConfig>(root, BRAND);
  if (!brand) throw fail('brand.config.json not found.', 'Run sketchbook init or sketchbook tokens scratch.');
  let parts = safeParts(key);
  const head = parts[0] ?? '';
  const mapped = Object.hasOwn(FAMILY_KEYS, head) ? FAMILY_KEYS[head] : undefined;
  if (mapped !== undefined && mapped !== head) parts = [...mapped.split('.'), ...parts.slice(1)];
  if (parts.some((p) => !p) || parts[0]?.startsWith('$')) throw fail(`Bad key "${key}".`, 'Use a dot path into brand.config.json, e.g. typography.family.');
  const value = parseValue(raw);
  const next = structuredClone(brand);
  const warnings: string[] = [];
  const old = getIn(brand, parts);
  if (lastOf(parts) === 'preset' && parts.length > 1) {
    const { dropped } = setPreset(next, parts.slice(0, -1).join('.'), value);
    if (dropped.length) warnings.push(`${parts.slice(0, -1).join('.')}: the preset replaces ${dropped.join(', ')} (fine overrides of the old values).`);
  } else {
    let node: unknown = next;
    for (const k of parts.slice(0, -1)) {
      const n = indexable(node, k, 'read');
      const child = n[k];
      if (typeof child === 'string') n[k] = { preset: child };
      else if (!isObj(child)) n[k] = {};
      node = n[k];
    }
    indexable(node, lastOf(parts), 'set')[lastOf(parts)] = value;
  }
  await validateBrand(root, next);
  const path = parts.join('.');
  return {
    files: { [BRAND]: serialize(next) }, warnings,
    summary: [`${path}: ${JSON.stringify(old)} -> ${JSON.stringify(value)}`],
    data: { key: path, before: old ?? null, after: value },
    decision: { title: `${path} set to ${typeof value === 'string' ? value : JSON.stringify(value)}`, decision: `brand.config.json ${path} = ${JSON.stringify(value)} (sketchbook tokens set ${path} ${typeof value === 'string' ? value : JSON.stringify(value)}).` },
  };
}

export async function planPreset(root: string, foundation: string, id: string): Promise<TokenPlan<{ family: string; key: string; preset: string; source: unknown }>> {
  const fams = familiesFor(foundation);
  const hits = fams.filter((f) => presetsOf(f).some((p) => p.id === id || p.aliases?.includes(id)));
  const [familyId] = hits;
  if (familyId === undefined) throw fail(`No preset "${id}" for ${foundation}.`, `Known: ${fams.map((f) => `${f}: ${presetsOf(f).map((p) => p.id).join(', ')}`).join('; ')}.`);
  const key = FAMILY_KEYS[familyId];
  if (!key) throw fail(`${familyId} is not chosen in brand.config.json.`, 'Pick a family that has a config key (sketchbook tokens presets).');
  const p = getPreset(familyId, id);
  const brand = await readJson<BrandConfig>(root, BRAND);
  const next = structuredClone(brand);
  const { old, dropped } = setPreset(next, key, p.id);
  if (!next) throw new TypeError(`Cannot set properties of null (setting '${key}')`);
  await validateBrand(root, next);
  return {
    files: { [BRAND]: serialize(next) },
    warnings: dropped.length ? [`${key}: the preset replaces ${dropped.join(', ')}.`] : [],
    summary: [`${key}: ${JSON.stringify(old)} -> { "preset": "${p.id}" } (${p.label}${p.source ? `, ${show(p.source)}` : ''})`],
    data: { family: familyId, key, preset: p.id, source: p.source ?? null },
    decision: { title: `${key} uses the ${p.id} preset`, decision: `brand.config.json ${key} = { "preset": "${p.id}" } (${p.label}) via sketchbook tokens preset ${foundation} ${p.id}. Source: ${show(p.source ?? 'none (our own)')}.` },
  };
}

// ---------- semantic tokens: add, remove, rename ----------

async function semanticDocs(root: string, brand?: BrandConfig | null): Promise<{ docs: SemanticDocs; modes: Mode[] }> {
  brand ??= await readJson<BrandConfig>(root, BRAND);
  const modes = modesOf(brand);
  const docs: SemanticDocs = {};
  for (const name of ['base', ...modes.map((m) => m.name)]) { const d = await readJson<DtcgDoc>(root, semanticFile(name)); if (d) docs[name] = d; }
  return { docs, modes };
}

const nodeAt = (doc: unknown, path: string): unknown => safeParts(path).reduce<unknown>((n, k) => (isObj(n) && Object.hasOwn(n, k) ? n[k] : undefined), doc);
const isToken = (n: unknown): n is DtcgTokenNode => isObj(n) && '$value' in n;

// The $type a token at `path` would inherit from its groups.
function inheritedType(doc: DtcgDoc, parts: string[]): unknown {
  let n: unknown = doc;
  let t = doc.$type;
  for (const k of parts) { n = isObj(n) ? n[k] : undefined; if (!isObj(n)) break; if (n.$type) t = n.$type; }
  return t;
}

function insert(doc: DtcgDoc, path: string, node: Indexable, type: unknown): void {
  const parts = safeParts(path);
  let n: unknown = doc;
  for (const k of parts.slice(0, -1)) {
    const g = indexable(n, k, 'read');
    if (isToken(g[k])) throw fail(`${parts.slice(0, parts.indexOf(k) + 1).join('.')} is a token, so ${path} can't be added under it.`, 'Pick a path whose parents are groups.');
    n = g[k] ??= {};
  }
  const inh = inheritedType(doc, parts.slice(0, -1));
  const { $type: _t, ...rest } = node;
  indexable(n, lastOf(parts), 'set')[lastOf(parts)] = type && type !== inh ? { ...rest, $type: type } : rest;
}

function detach(doc: DtcgDoc, path: string): { node: Indexable; type: unknown } | null {
  const parts = safeParts(path);
  const chain: Indexable[] = [doc];
  let cur: Indexable = doc;
  for (const k of parts.slice(0, -1)) { const n = cur[k]; if (!isObj(n)) return null; chain.push(n); cur = n; }
  const last = lastOf(parts);
  const node = cur[last];
  if (!isObj(node)) return null;
  const type = node.$type ?? inheritedType(doc, parts.slice(0, -1));
  delete cur[last];
  for (let i = chain.length - 1; i > 0; i--) {
    const group = chain[i];
    const parent = chain[i - 1];
    const key = parts[i - 1];
    if (group && parent && key !== undefined && !Object.keys(group).some((k) => !k.startsWith('$'))) delete parent[key];
  }
  return { node, type };
}

// Every path the generator can make, whatever brand.config says today: a semantic token there collides as soon as
// the brand changes (color.brand.* appears with a hex primary). Color ramps are reserved as whole groups.
const ROLE_RAMPS = (): unknown[] => presetsOf('semanticRoles').map((p) => p.values.accent).filter(Boolean);
function reservedPaths(brand: BrandConfig | null): { ramps: Set<unknown>; paths: Set<string> } {
  const ramps = new Set<unknown>(['brand', 'neutral', 'white', 'black', ...ROLE_RAMPS(), ...Object.keys(brand?.color?.accents ?? {})]);
  const paths = new Set<string>();
  const add = (b: Partial<BrandConfig>): void => { try { for (const doc of Object.values(generate(b).files)) for (const t of flatten(doc)) if (!t.path.startsWith('color.')) paths.add(t.path); } catch { /* a preset that does not resolve on this brand */ } };
  add(brand ?? {});
  for (const fam of families()) {
    const key = FAMILY_KEYS[fam];
    if (!key || fam === 'rampMethods' || fam === 'neutrals') continue;
    for (const p of presetsOf(fam)) {
      if (p.implemented === false) continue;
      const b = structuredClone(brand ?? {});
      setPreset(b, key, p.id);
      add(b);
    }
  }
  return { ramps, paths };
}

// Why `path` can't be a semantic token: the generator can make it (or a group around it), or another token in any
// layer already builds its CSS variable. `ignore` holds paths that are moving away (a rename's own tokens).
async function refuseNames(root: string, names: Iterable<string>, { ignore = new Set<string>() }: { ignore?: Set<string> } = {}): Promise<void> {
  const brand = await readJson<BrandConfig>(root, BRAND);
  const { ramps, paths } = reservedPaths(brand);
  // String(): a missing prefix built "--undefined-…" here before it was typed; kept so the comparison does not change.
  const prefix = String((await readJson<Partial<HarnessConfigJson>>(root, 'harness.config.json'))?.prefix);
  const tokens = (await loadAll(root)).sets.flatMap((s) => s.tokens);
  for (const path of names) {
    const parts = path.split('.');
    const ramp = parts[1] ?? '';
    if (parts[0] === 'color' && ramps.has(parts[1])) throw fail(`${path} is reserved: the generator makes color.${ramp}${['white', 'black'].includes(ramp) ? '' : '.*'} (a foundation ramp${ramps.has(parts[1]) && !['brand', 'neutral', 'white', 'black'].includes(ramp) ? ' for an accent or color role' : ''}), now or when brand.config changes.`, 'Pick a semantic name outside the foundation ramps, e.g. color.highlight.');
    const hit = [...paths].find((p) => p === path || p.startsWith(path + '.') || path.startsWith(p + '.'));
    if (hit) throw fail(`${path} is reserved: the generator can make ${hit} (a foundation token of some preset).`, 'Pick a semantic name outside the foundation families, e.g. a role name like space.section.');
    const v = cssVarName(prefix, path);
    const clash = tokens.find((t) => !ignore.has(t.path) && t.path !== path && cssVarName(prefix, t.path) === v);
    if (clash) throw fail(`${path} would build ${v}, the CSS variable of ${clash.path} (${clash.file}).`, 'Pick a name whose CSS variable is free: dots and dashes both become "-".');
  }
}


const PAIR = /^([^:/\s]+)[:/]([^:/\s]+)$/;

function inferType(value: unknown, all: TokenData): string | null {
  const a = aliasOf(value);
  if (a) { const t = all.sets.flatMap((s) => s.tokens).find((x) => x.path === a); return t?.type ?? null; }
  if (typeof value === 'number') return 'number';
  const s = String(value);
  if (/^#([0-9a-f]{6}|[0-9a-f]{8})$/i.test(s)) return 'color';
  if (/^-?\d*\.?\d+(px|rem|em)$/.test(s)) return 'dimension';
  if (/^\d+(\.\d+)?m?s$/.test(s)) return 'duration';
  return null;
}

const VALIDATORS: Record<string, ((v: unknown) => boolean) | undefined> = VALUE;

export interface AddOptions { value?: string; light?: string; dark?: string; type?: string; pair?: string; kind?: string }

export async function planAdd(root: string, path: string, { value, light, dark, type, pair, kind }: AddOptions = {}): Promise<TokenPlan<{ token: string; type: string; values: Record<string, unknown>; pair: string | null }>> {
  const { docs, modes } = await semanticDocs(root);
  const all = await loadAll(root);
  if (!/^[a-z][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)+$/.test(path)) throw fail(`"${path}" is not a semantic token path.`, 'Use category.role[-modifier], e.g. color.highlight.');
  for (const [name, doc] of Object.entries(docs)) {
    const n = nodeAt(doc, path);
    if (n !== undefined) throw fail(`${path} already exists in ${semanticFile(name)}${isToken(n) ? '' : ' (as a group)'}.`, `Change its value in the semantic file, or pick a new name (sketchbook tokens impact ${path}).`);
  }
  if (all.sets.some((s) => s.layer !== 'semantic' && s.tokens.some((t) => t.path === path || t.path.startsWith(path + '.')))) throw fail(`${path} is already a foundation or component path.`, 'Pick a name in the semantic layer\'s own pattern.');
  if (value === undefined && light === undefined && dark === undefined) throw fail('Give --value v (mode-less) or --light v --dark v.', 'e.g. sketchbook tokens add color.highlight --light "{color.neutral.100}" --dark "{color.neutral.800}"');
  if (value !== undefined && (light !== undefined || dark !== undefined)) throw fail('Use either --value or --light/--dark, not both.', 'Mode-less tokens take --value; color tokens usually take --light and --dark.');
  const values: Record<string, unknown> = {};
  if (value !== undefined) values.base = parseValue(value);
  else for (const m of modes) {
    const v = m.role === 'dark' ? dark : light;
    if (v === undefined) throw fail(`No value for mode ${m.name} (role ${m.role}).`, `Pass --${m.role} v.`);
    values[m.name] = parseValue(v);
  }
  await refuseNames(root, [path]);
  if (type !== undefined && !TYPES.includes(type)) throw fail(`--type ${type} is not a token type.`, `Use one of: ${TYPES.join(', ')}.`);
  const known = new Set([...all.sets.flatMap((s) => s.tokens.map((x) => x.path)), path]);
  for (const [m, v] of Object.entries(values)) {
    const a = aliasOf(v);
    if (a && !known.has(a)) throw fail(`${m}: ${JSON.stringify(v)} names no token (unresolved reference).`, `Point it at an existing token (sketchbook tokens impact ${a.split('.').slice(0, -1).join('.') || a}).`);
    if (a === path) throw fail(`${path} cannot alias itself.`, 'Point it at another token.');
  }
  const t = type ?? inferType(Object.values(values)[0], all);
  if (!t) throw fail(`Cannot infer the type of ${JSON.stringify(Object.values(values)[0])}.`, `Pass --type ${TYPES.join('|')}.`);
  for (const [m, v] of Object.entries(values)) {
    if (aliasOf(v)) continue;
    const valid = VALIDATORS[t];
    if (!valid) throw new TypeError('VALUE[t] is not a function');
    if (!valid(v)) throw fail(`${m}: ${JSON.stringify(v)} is not a valid ${t}.`, t === 'color' ? 'Use #RRGGBB or #RRGGBBAA, or an alias {color.…}.' : `Use a valid ${t} value, or an alias to a ${t} token.`);
  }
  const files: Record<string, string> = {};
  for (const [name, v] of Object.entries(values)) {
    const source = docs[name];
    if (!source) throw fail(`${semanticFile(name)} does not exist.`, 'Run npm run tokens:generate.');
    const doc = structuredClone(source);
    insert(doc, path, { $value: v }, t);
    files[semanticFile(name)] = serialize(doc);
  }
  const summary = [`${path} (${t}): ${Object.entries(values).map(([m, v]) => `${m} ${JSON.stringify(v)}`).join(', ')}`];
  if (pair) {
    const m = PAIR.exec(pair);
    if (!m) throw fail(`--pair "${pair}" is not fg:bg.`, 'e.g. --pair color.highlight-foreground:color.highlight');
    const [, fg = '', bg = ''] = m;
    const known = new Set([path, ...Object.values(docs).flatMap((d) => flatten(d).map((x) => x.path))]);
    for (const p of [fg, bg]) if (!known.has(p)) throw fail(`Pair token ${p} is not a semantic token.`, 'Add it first, or fix the name.');
    if (![fg, bg].includes(path)) summary.push(`(the pair does not name ${path}; added anyway)`);
    const k = kind ?? 'text';
    if (!['text', 'large-text', 'ui'].includes(k)) throw fail(`--kind ${k}`, 'Use text, large-text or ui.');
    const contrast = await readJson<{ pairs: ContrastPair[] }>(root, CONTRAST);
    if (!contrast) throw new TypeError("Cannot read properties of null (reading 'pairs')");
    if (!contrast.pairs.some((p) => p.fg === fg && p.bg === bg)) { contrast.pairs.push({ fg, bg, kind: k }); files[CONTRAST] = serialize(contrast); summary.push(`contrast pair ${fg} on ${bg} (${k})`); }
  }
  return { files, summary, warnings: [], data: { token: path, type: t, values, pair: pair ?? null }, decision: { title: `New semantic token ${path}`, decision: `Add ${path} (${t}) with ${(summary[0] ?? '').split(': ').slice(1).join(': ')}${pair ? `, contrast pair ${pair}` : ''} (sketchbook tokens add).` } };
}

export async function planRemove(root: string, path: string): Promise<TokenPlan<{ token: string; from: string[] }>> {
  safeParts(path);
  const { docs } = await semanticDocs(root);
  const where = Object.entries(docs).filter(([, d]) => isToken(nodeAt(d, path))).map(([n]) => n);
  if (!where.length) throw fail(`${path} is not a semantic token.`, 'sketchbook tokens impact <path> shows where a token lives; only semantic tokens are removed here.');
  const i = await impact(root, path);
  const deps = dependents(i);
  if (deps.length) throw Object.assign(fail(`${path} is still used: ${deps.slice(0, 6).join('; ')}${deps.length > 6 ? `; … ${deps.length - 6} more` : ''}.`, `Point those at another token first (or rename with sketchbook tokens rename ${path} <new>), then remove it.`), { data: { impact: i } });
  const files: Record<string, string> = {};
  for (const name of where) { const doc = structuredClone(docs[name] ?? {}); detach(doc, path); files[semanticFile(name)] = serialize(doc); }
  return { files, summary: [`${path} removed from ${where.join(', ')}`], warnings: [], data: { token: path, from: where }, decision: { title: `Remove semantic token ${path}`, decision: `Remove ${path} from the semantic layer (${where.join(', ')}); nothing used it (sketchbook tokens remove).` } };
}

interface RenamePlanData { tokens: Record<string, string>; files: string[] }
type RenamePair = Pick<Rename, 'from' | 'to'>;
const under = (path: string, base: string): boolean => path === base || path.startsWith(base + '.');
const tokenPath = /^[a-z][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)+$/;

export async function planRename(root: string, from: string, to: string): Promise<TokenPlan<RenamePlanData & RenamePair>> {
  const plan = await planRenames(root, [{ from, to }], { single: true });
  return { ...plan, data: { from, to, tokens: plan.data.tokens, files: plan.data.files } };
}

export async function planRenames(root: string, renames: RenamePair[], { single = false, details = false }: { single?: boolean; details?: boolean } = {}): Promise<TokenPlan<RenamePlanData & { renames: RenamePair[] }>> {
  const { docs } = await semanticDocs(root);
  const config = await readJson<HarnessConfigJson>(root, 'harness.config.json');
  if (!config) throw new TypeError("Cannot read properties of null (reading 'prefix')");
  const prefix = config.prefix;
  const existing = new Set(Object.values(docs).flatMap((d) => flatten(d).map((t) => t.path)));
  const map = new Map<string, string>();
  for (const { from, to } of renames) {
    if (from === to) throw fail(`${from}: the old and new names are the same.`, 'Choose a new name or remove this entry.');
    safeParts(from);
    if (!tokenPath.test(to) || (!single && !tokenPath.test(from))) throw fail(`${JSON.stringify(!tokenPath.test(to) ? to : from)} is not a token path.`, 'Use a lowercase dot path, such as color.on-primary.');
    if (to.startsWith(from + '.')) throw fail(`${to} is inside ${from}.`, 'Rename to a sibling path.');
    const sources = single ? [...existing].filter((p) => under(p, from)) : existing.has(from) ? [from] : [];
    if (!sources.length) throw fail(`${from} is not a semantic token${single ? ' or group' : ''}.`, single ? 'Run sketchbook tokens impact <path> to look up a token.' : 'Check the source name in the rename list. To move a group, use tokens rename <old> <new> separately.');
    for (const [name, doc] of Object.entries(docs)) if (nodeAt(doc, to) !== undefined) throw fail(`${to} already exists in ${semanticFile(name)}.`, 'Choose an unused destination. A rename list does not support chains or swaps.');
    for (const path of sources) {
      if (map.has(path)) throw fail(`${path} is listed more than once.`, 'Keep one destination for each source token.');
      map.set(path, to + path.slice(from.length));
    }
  }
  const all = await loadAll(root);
  const destinations = new Map<string, string>();
  for (const { to } of renames) if (all.sets.some((s) => s.layer !== 'semantic' && s.tokens.some((t) => under(t.path, to)))) throw fail(`${to} is a foundation or component path.`, 'Pick a free semantic name.');
  for (const [from, to] of map) {
    const css = cssVarName(prefix, to);
    const collision = destinations.get(css);
    if (collision === to) throw fail(`${to} is the destination for more than one token.`, 'Give each destination a distinct name.');
    if (collision) throw fail(`${collision} and ${to} would both use ${css}.`, 'Give each destination a distinct CSS variable. Dots and dashes both become "-".');
    if (!single && [...map.keys()].some((source) => (from !== source && cssVarName(prefix, source) === css) || under(to, source))) {
      throw fail(`${to} overlaps a source in the same rename list.`, 'Choose an unused destination. A rename list does not support chains or swaps.');
    }
    if ([...destinations.values()].some((other) => under(other, to) || under(to, other))) throw fail(`${to} overlaps another destination in the rename list.`, 'Use separate token paths, not a token and a path inside it.');
    destinations.set(css, to);
  }
  const paths = [...map.keys()];
  await refuseNames(root, map.values(), { ignore: new Set(paths) });
  const rn = (p: string): string => map.get(p) ?? p;
  const files: Record<string, string> = {};

  // Semantic files: move the nodes, then re-point aliases.
  for (const [name, original] of Object.entries(docs)) {
    const doc = structuredClone(original);
    const moved: [string, { node: Indexable; type: unknown }][] = [];
    for (const p of paths) { const d = detach(doc, p); if (d) moved.push([p, d]); }
    for (const [p, d] of moved) insert(doc, rn(p), d.node, d.type);
    const walk = (n: unknown): void => { if (!isObj(n)) return; if (isToken(n)) { const a = aliasOf(n.$value); if (a && map.has(a)) n.$value = `{${rn(a)}}`; return; } for (const [k, v] of Object.entries(n)) if (!k.startsWith('$')) walk(v); };
    walk(doc);
    if (serialize(doc) !== serialize(original)) files[semanticFile(name)] = serialize(doc);
  }
  // Brand links: keys and alsoOn.
  const links = await readJson<LinksDoc>(root, LINKS);
  if (links?.links) {
    const next = { ...links, links: Object.fromEntries(Object.entries(links.links).map(([k, v]): [string, BrandLink] => [rn(k), v.alsoOn ? { ...v, alsoOn: v.alsoOn.map(rn) } : v])) };
    if (serialize(next) !== serialize(links)) files[LINKS] = serialize(next);
  }
  // JSON files that name semantic paths as whole strings: contracts (tokens, contrast pairs) and contrast.json.
  const jsonText = (text: string): string => renameJsonText(text, map);
  for (const c of all.contracts) {
    const text = await readText(root, c.file);
    const out = text && jsonText(text);
    if (out && out !== text) files[c.file] = out;
  }
  const ct = await readText(root, CONTRAST);
  if (ct && jsonText(ct) !== ct) files[CONTRAST] = jsonText(ct);
  for (const file of patternFiles(root)) {
    const text = await readText(root, file);
    if (text && jsonText(text) !== text) files[file] = jsonText(text);
  }
  // CSS variables (and exact quoted token paths) in stories, specs, .storybook and patterns.
  for (const { file } of referenceFiles(root)) {
    const text = await readText(root, file);
    if (!text) continue;
    const out = renameCodeText(text, map, prefix);
    if (out !== text) files[file] = out;
  }
  // The rename log: catalog installs translate incoming components and kits through it (SB-0066).
  const log = (await readJson<RenamesDoc>(root, RENAMES)) ?? { $description: RENAMES_DESCRIPTION, renames: [] };
  const date = new Date().toISOString().slice(0, 10);
  log.renames = [...(log.renames ?? []), ...renames.map((pair) => ({ ...pair, date }))];
  files[RENAMES] = serialize(log);
  const filenames = Object.keys(files);
  const [pair] = renames;
  const summary = single && pair
    ? [`${pair.from} -> ${pair.to}: ${paths.length} token(s); ${filenames.length} file(s) rewritten`, ...filenames.map((f) => `  ${f}`)]
    : [
      `${map.size} ${map.size === 1 ? 'rename' : 'renames'}:`,
      ...renames.slice(0, details ? undefined : 12).map(({ from, to }) => `  ${from} -> ${to}`),
      ...(details || map.size <= 12 ? [] : [`  ${map.size - 12} more. Use --details to see all renames.`]),
      `Files with updated references (${filenames.length}, before regeneration):`,
      ...filenames.slice(0, details ? undefined : 8).map((file) => `  ${file}`),
      ...(details || filenames.length <= 8 ? [] : [`  ${filenames.length - 8} more. Use --details to see all files.`]),
    ];
  return {
    files, warnings: [], summary,
    data: { renames, tokens: Object.fromEntries(map), files: filenames },
    decision: single && pair
      ? { title: `Rename ${pair.from} to ${pair.to}`, decision: `Rename the semantic token${paths.length > 1 ? 's under' : ''} ${pair.from} to ${pair.to} in semantic files, brand links, contracts, contrast pairs, stories, specs, patterns and .storybook (sketchbook tokens rename).` }
      : { title: `Rename ${map.size} semantic ${map.size === 1 ? 'token' : 'tokens'}`, decision: `Rename ${renames.map(({ from, to }) => `${from} to ${to}`).join('; ')} (sketchbook tokens rename --map).` },
  };
}

// ---------- scratch ----------

export const SCRATCH_QUESTIONS: ScratchQuestion[] = [
  { key: 'name', q: 'System name', default: 'my-system' },
  { key: 'primary', q: 'Primary color (#RRGGBB, or "neutral" for a monochrome start)', default: 'neutral' },
  { key: 'neutral', q: 'Neutral gray', family: 'neutrals' },
  { key: 'font', q: 'Font family (a name, or ui-sans-serif for the system font)', default: 'ui-sans-serif' },
  { key: 'scale', q: 'Type scale', family: 'typeScale' },
  { key: 'spacing', q: 'Spacing grid', family: 'spacing' },
  { key: 'radius', q: 'Corner radius', family: 'radius' },
  { key: 'density', q: 'Density', family: 'density' },
  { key: 'motion', q: 'Motion', family: 'motion' },
  { key: 'elevation', q: 'Elevation', family: 'elevation' },
  { key: 'contrast', q: 'Contrast standard', family: 'contrast' },
];

// String(q.family): a question without a family looks up "undefined", as the untyped lookup did.
export const questionDefault = (q: ScratchQuestion): string | undefined => q.default ?? family(String(q.family)).default ?? presetsOf(String(q.family))[0]?.id;

const SCRATCH_PRESETS = ['spacing', 'radius', 'density', 'motion', 'elevation', 'contrast'] as const;

// Pure: a minimal brand.config from answers. Unanswered foundations stay out (the catalog default applies).
export function scratchBrand(answers: Record<string, string | undefined>, modes?: BrandConfig['modes']): BrandConfig {
  const known = new Set(SCRATCH_QUESTIONS.map((q) => q.key));
  for (const k of Object.keys(answers)) if (!known.has(k)) throw fail(`Unknown answer "${k}".`, `Answers: ${[...known].join(', ')}.`);
  const b: BrandConfig = { $schema: './spec/schemas/brand-config.schema.json', name: answers.name ?? 'my-system', $description: 'Started from scratch (sketchbook tokens scratch): only the answered foundations are set; the rest use the catalog defaults. The semantic interface was kept.' };
  if (answers.primary || answers.neutral) b.color = { ...(answers.primary ? { primary: answers.primary } : {}), ...(answers.neutral ? { neutral: { preset: answers.neutral } } : {}) };
  if (modes) b.modes = modes;
  if (answers.font || answers.scale) b.typography = { ...(answers.font ? { family: answers.font } : {}), ...(answers.scale ? { scale: { preset: answers.scale } } : {}) };
  for (const k of SCRATCH_PRESETS) { const id = answers[k]; if (id) Object.assign(b, { [k]: { preset: id } }); }
  return b;
}

export async function planScratch(root: string, answers: Record<string, string | undefined>): Promise<TokenPlan<{ brand: BrandConfig }>> {
  const old = await readJson<BrandConfig>(root, BRAND);
  const brand = scratchBrand(answers, old?.modes);
  await validateBrand(root, brand);
  return {
    files: { [BRAND]: serialize(brand) }, warnings: [],
    summary: [`brand.config.json reset to ${Object.keys(answers).length} answer(s): ${Object.entries(answers).map(([k, v]) => `${k}=${v}`).join(', ') || 'catalog defaults'}`, 'Semantic tokens and the interface are kept; links re-point them.'],
    data: { brand },
    decision: { title: 'Foundations restarted from scratch', decision: `brand.config.json rewritten from a questionnaire (${Object.entries(answers).map(([k, v]) => `${k} ${v}`).join(', ') || 'catalog defaults'}) with sketchbook tokens scratch; the semantic interface was kept.` },
  };
}
