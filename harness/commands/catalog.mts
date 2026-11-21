// Component catalog (SB-0045): the reference components and template kits as installable units.
//   harness/catalog/index.json                       { prefix, components[], kits[] }
//   harness/catalog/<name>/manifest.json             { name, component, displayName, tier, status, tag, prefix, dependsOn, uses, files[{path, hash}] }
//   harness/catalog/<name>/files/<hash>              each file's bytes, named by the hash of its content
//   harness/catalog/kits/<id>/{manifest.json,files/} the same for a kit (src/patterns/<id> + its behavior spec)
// Built from the repo by `npm run catalog:build`; G1 keeps it fresh in the catalog's source repo (harness.config.json
// catalog.source). `sketchbook add` installs from it, `remove` takes a unit out, `init --start` installs a starter's set.
// Installs are staged (every blob hash-checked, prefix and token renames applied) before anything is written, and
// rolled back if writing or the rebuild fails (SB-0060). Removing a unit the catalog cannot restore as it is (team-made
// or customized) needs --yes (SB-0060).
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname, resolve, sep } from 'node:path';
import type { ComponentContract } from '../../generated/types/contract.js';
import type { HarnessConfigJson } from '../../generated/types/harness-config.js';
import type { ComponentRegistry } from '../../generated/types/registry.js';
import { walk, hashOf, readJsonSync, parseJson, harnessPath, isText, errorMessage } from '../lib/files.mjs';
import { readRenames, semanticPaths, applyRenames } from '../lib/renames.mjs';
import type { Rename } from '../lib/renames.mjs';
import { rewrite, regenerate } from './prefix.mjs';
import { inheritDecisions } from '../lib/decisions.mjs';
import { auditsOf, PARITY_AUDITS, A11Y_AUDITS } from '../lib/audits.mjs';

export interface FixError extends Error { fix: string }
export type RegistryEntry = ComponentRegistry['components'][number];
export interface NamedContract { name: string; contract: ComponentContract }
export interface Kit { id: string; title: string; summary: string; path: string; components: string[] }
export interface ManifestFile { path: string; hash: string }
export interface ComponentManifest { name: string; component: string; displayName: string; tier: RegistryEntry['tier']; status: RegistryEntry['status']; tag: string; prefix: string; dependsOn: string[]; uses: string[]; files: ManifestFile[] }
export interface KitManifest { id: string; title: string; summary: string; path: string; components: string[]; prefix: string; files: ManifestFile[] }
export interface CatalogIndex { $description?: string; prefix: string | null; components: string[]; kits: string[] }
export interface Unit<M> { manifest: M; blobs: Map<string, Buffer> }
export interface StagedFile { path: string; buf: Buffer }
export interface InstallContext { prefix: string; renames: Rename[]; paths: string[] }
export interface Dependent { kind: 'component' | 'kit'; name: string }
export interface AtRisk { name: string; reason: 'team-made' | 'customized' }
export interface CatalogDrift { file: string; msg: string; fix: string }
export interface SnapshotOptions { cs?: NamedContract[]; registry?: ComponentRegistry; config?: HarnessConfigJson }
export interface InstallOptions { dryRun?: boolean; rebuild?: boolean }

export const kebab = (s: string): string => s.trim().replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// Statuses that make a component an installable unit: built, tested and reviewed.
export const ELIGIBLE = new Set(['beta', 'stable']);
const serialize = (j: unknown): string => JSON.stringify(j, null, 2) + '\n';
const fail = (msg: string, fix: string): FixError => Object.assign(new Error(msg), { fix });
const fixOf = (e: unknown): string | undefined => (typeof e === 'object' && e !== null && 'fix' in e && typeof e.fix === 'string' ? e.fix : undefined);

// ---- what manifest data may name ----------------------------------------------------------------------------------
// Manifests and the kit index are data from the harness (or an upstream it was upgraded from): every path they name is
// checked before it is read, written or deleted.
export const HASH_RE = /^[0-9a-f]{20}$/; // hashOf: sha256 hex, first 20 characters
export const KIT_ID_RE = /^[a-z0-9-]+$/;
export const KIT_PATH_RE = /^src\/patterns\/[a-z0-9-]+$/;
const DAMAGED = 'The catalog or kit index is damaged or was tampered with: restore harness/ from git or a trusted Sketchbook (sketchbook upgrade).';

// Absolute path of `rel` inside root; refuses anything that resolves outside it.
export function within(root: string, rel: string): string {
  const base = resolve(root);
  const target = typeof rel === 'string' && rel ? resolve(base, rel) : null;
  if (!target || !target.startsWith(base + sep)) throw fail(`Refusing a path outside the project: ${JSON.stringify(rel)}.`, DAMAGED);
  return target;
}

const isSafeKit = (kit: Partial<Kit> | null | undefined): kit is Kit => KIT_ID_RE.test(kit?.id ?? '') && KIT_PATH_RE.test(kit?.path ?? '');

function safeKit(kit: Partial<Kit> | null | undefined): Kit {
  if (!isSafeKit(kit)) throw fail(`harness/kits/index.json: kit ${JSON.stringify(kit?.id)} has an unsafe id or path (${JSON.stringify(kit?.path)}); ids are lowercase letters, digits and dashes, paths src/patterns/<id>.`, DAMAGED);
  return kit;
}

// ---- reading the project -------------------------------------------------------------------------------------------

// harness.config.json always has a prefix: a missing file reads as an empty config, as before.
const emptyConfig = (): HarnessConfigJson => parseJson<HarnessConfigJson>('{}');
export const readConfig = (root: string): HarnessConfigJson => readJsonSync<HarnessConfigJson>(join(root, 'harness.config.json'), emptyConfig()) ?? emptyConfig();
export const readRegistry = (root: string): ComponentRegistry => readJsonSync<ComponentRegistry>(join(root, 'spec/registry.json'), { components: [] }) ?? { components: [] };
export const registryEntry = (registry: ComponentRegistry, name: string): RegistryEntry | undefined => registry.components.find((c) => kebab(c.name) === name);

export function contracts(root: string): NamedContract[] {
  let names: string[] = [];
  try { names = readdirSync(join(root, 'spec/components'), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort(); } catch { /* none */ }
  const found: NamedContract[] = [];
  for (const name of names) {
    const contract = readJsonSync<ComponentContract>(join(root, 'spec/components', name, 'contract.json'));
    if (contract) found.push({ name, contract });
  }
  return found;
}

export const installedComponents = (root: string): string[] => contracts(root).map((c) => c.name);

export function kitIndex(root: string): Kit[] {
  const kits = readJsonSync<{ kits?: Partial<Kit>[] }>(harnessPath(root, 'kits/index.json'), { kits: [] })?.kits ?? [];
  return (Array.isArray(kits) ? kits : []).map(safeKit);
}
export const kitInstalled = (root: string, kit: Kit): boolean => existsSync(join(root, kit.path));
export const installedKits = (root: string): string[] => kitIndex(root).filter((k) => kitInstalled(root, k)).map((k) => k.id);

export function componentFiles(root: string, name: string): string[] {
  const files = [
    ...walk(root, `spec/components/${name}`).filter((f) => !f.endsWith('/plan.md')),
    ...walk(root, `src/components/${name}`).filter((f) => !f.endsWith('.styles.ts')),
    ...walk(root, `playwright/tests/${name}`),
  ];
  // Stable carries the evidence R1 asks for (the latest audit of each kind); beta stays lean.
  if (readJsonSync<Partial<ComponentContract>>(join(root, `spec/components/${name}/contract.json`), {})?.status === 'stable') {
    for (const d of [PARITY_AUDITS, A11Y_AUDITS]) { const latest = auditsOf(root, d, name).at(-1); if (latest) files.push(`${d}/${latest}`); }
  }
  return files.sort();
}

export const kitFiles = (root: string, kit: Kit): string[] => [...walk(root, kit.path), ...walk(root, `playwright/tests/patterns/${kit.id}.behavior.spec.ts`), ...walk(root, `playwright/tests/patterns/__screen-reader__/${kit.id}`)].sort();

function tagOwners(cs: NamedContract[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const { name, contract } of cs) for (const t of [contract.tag, ...(contract.elements || []).map((e) => e.tag)]) if (t) m.set(t, name);
  return m;
}

function blobsOf(root: string, files: string[]): { list: ManifestFile[]; blobs: Map<string, Buffer> } {
  const blobs = new Map<string, Buffer>();
  const list = files.map((path) => { const buf = readFileSync(join(root, path)); const hash = hashOf(buf); blobs.set(hash, buf); return { path, hash }; });
  return { list, blobs };
}

// One component as a catalog unit, computed from the repo (pure read).
export function snapshotComponent(root: string, name: string, { cs = contracts(root), registry = readRegistry(root), config = readConfig(root) }: SnapshotOptions = {}): Unit<ComponentManifest> {
  const contract = cs.find((c) => c.name === name)?.contract;
  if (!contract) throw fail(`spec/components/${name}/contract.json not found`, 'Only components with a contract can be catalogued.');
  const files = componentFiles(root, name);
  const owners = tagOwners(cs);
  const uses = new Set<string>();
  const tagRe = new RegExp(`<(${config.prefix}-[a-z0-9-]+)`, 'g');
  for (const f of files.filter((x) => x.endsWith('.ts'))) for (const m of readFileSync(join(root, f), 'utf8').matchAll(tagRe)) { const o = owners.get(m[1] ?? ''); if (o && o !== name) uses.add(o); }
  const entry = registryEntry(registry, name);
  const { list, blobs } = blobsOf(root, files);
  const manifest = {
    name, component: contract.component, displayName: entry?.name ?? contract.component, tier: entry?.tier ?? 1, status: contract.status,
    tag: contract.tag, prefix: config.prefix, dependsOn: (contract.dependsOn || []).map(kebab).sort(), uses: [...uses].sort(), files: list,
  };
  return { manifest, blobs };
}

export function snapshotKit(root: string, kit: Kit): Unit<KitManifest> {
  const { list, blobs } = blobsOf(root, kitFiles(root, kit));
  return { manifest: { id: kit.id, title: kit.title, summary: kit.summary, path: kit.path, components: [...kit.components].sort(), prefix: readConfig(root).prefix, files: list }, blobs };
}

// Components the catalog takes from this repo: a contract, code and a status of beta or above.
export function eligibleComponents(root: string, cs: NamedContract[] = contracts(root), registry: ComponentRegistry = readRegistry(root)): string[] {
  return cs.filter(({ name, contract }) => ELIGIBLE.has(contract.status) && ELIGIBLE.has(registryEntry(registry, name)?.status ?? '') && existsSync(join(root, 'src/components', name))).map((c) => c.name);
}

// ---- the catalog ---------------------------------------------------------------------------------------------------

export const catalogDir = (root: string): string => harnessPath(root, 'catalog');
export const catalogIndex = (root: string): CatalogIndex => readJsonSync<CatalogIndex>(join(catalogDir(root), 'index.json'), { prefix: null, components: [], kits: [] }) ?? { prefix: null, components: [], kits: [] };
export const manifestOf = (root: string, name: string): ComponentManifest | null => readJsonSync<ComponentManifest>(join(catalogDir(root), name, 'manifest.json'));
export const kitManifestOf = (root: string, id: string): KitManifest | null => readJsonSync<KitManifest>(join(catalogDir(root), 'kits', id, 'manifest.json'));
export const requiresOf = (m: Pick<ComponentManifest, 'dependsOn' | 'uses'>): string[] => [...new Set([...(m.dependsOn || []), ...(m.uses || [])])].sort();

function writeUnit(dir: string, { manifest, blobs }: Unit<ComponentManifest | KitManifest>): void {
  mkdirSync(join(dir, 'files'), { recursive: true });
  for (const [hash, buf] of blobs) writeFileSync(join(dir, 'files', hash), buf);
  writeFileSync(join(dir, 'manifest.json'), serialize(manifest));
}

// npm run catalog:build: rewrites harness/catalog from the repo (deterministic: same repo, same bytes).
// Only in the catalog's source repo (harness.config.json catalog.source true): in a team repo the catalog is what the
// harness shipped, and rebuilding it from the team's remaining components would drop the units `add` restores from.
export function buildCatalog(root: string, out: string = join(root, 'harness/catalog')): { skipped?: true; components: string[]; kits: string[] } {
  const config = readConfig(root);
  if (config.catalog?.source !== true) return { skipped: true, components: [], kits: [] };
  const cs = contracts(root);
  const registry = readRegistry(root);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  const components = eligibleComponents(root, cs, registry);
  for (const name of components) writeUnit(join(out, name), snapshotComponent(root, name, { cs, registry, config }));
  const kits = kitIndex(root).filter((k) => kitInstalled(root, k));
  for (const kit of kits) writeUnit(join(out, 'kits', kit.id), snapshotKit(root, kit));
  writeFileSync(join(out, 'index.json'), indexText(config.prefix, components, kits.map((k) => k.id)));
  return { components, kits: kits.map((k) => k.id) };
}

const indexText = (prefix: string, components: string[], kits: string[]): string => serialize({
  $description: 'GENERATED by npm run catalog:build from the repo. Installable units for sketchbook add / remove / kits / init --start. Do not edit.',
  prefix, components, kits,
});

const subdirs = (dir: string): string[] => { try { return readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort(); } catch { return []; } };

// Check G1 (catalog part): in the catalog's source repo the catalog equals a fresh catalog:build — same prefix, same
// index, a unit for every eligible component and installed kit and none for anything else, every blob matching its hash.
export function catalogDrift(root: string, retainedKits: string[] = []): { errors: CatalogDrift[]; info?: { note: string }[] } {
  const config = readConfig(root);
  if (config.catalog?.source !== true) return { errors: [], info: [{ note: 'catalog not tracked here (harness.config.json catalog.source is not true): components are the team\'s' }] };
  // A project without component sources (a partial copy, or before any install) has nothing to compare.
  if (!existsSync(join(root, 'src/components'))) return { errors: [], info: [{ note: 'no src/components here: catalog freshness not compared' }] };
  const fix = 'Run npm run catalog:build (the catalog follows the repo it is built from).';
  try { return { errors: driftErrors(root, config, fix, retainedKits) }; } catch (e) { return { errors: [{ file: 'harness/catalog', msg: errorMessage(e), fix: fixOf(e) ?? fix }] }; }
}

function driftErrors(root: string, config: HarnessConfigJson, fix: string, retainedKits: string[]): CatalogDrift[] {
  const dir = catalogDir(root);
  const indexFile = 'harness/catalog/index.json';
  const index = readJsonSync<CatalogIndex>(join(dir, 'index.json'));
  if (!index) return [{ file: indexFile, msg: 'catalog missing', fix }];
  if (index.prefix !== config.prefix) return [{ file: indexFile, msg: `catalog prefix ${index.prefix} differs from harness.config.json prefix ${config.prefix} (sketchbook prefix rebuilds it; a hand edit does not)`, fix }];
  const errors: CatalogDrift[] = [];
  const cs = contracts(root);
  const registry = readRegistry(root);
  const components = eligibleComponents(root, cs, registry);
  const knownKits = kitIndex(root);
  const kits = knownKits.filter((k) => kitInstalled(root, k));
  // A kit removed by the current command may retain its catalog copy for undo. Plain G1 passes no retained kits.
  const expectedKits = knownKits.filter((k) => kits.includes(k) || retainedKits.includes(k.id));
  if (readFileSync(join(dir, 'index.json'), 'utf8') !== indexText(config.prefix, components, expectedKits.map((k) => k.id))) errors.push({ file: indexFile, msg: 'index differs from the eligible components and installed kits of the repo', fix });
  for (const d of subdirs(dir).filter((d) => d !== 'kits' && !components.includes(d))) errors.push({ file: `harness/catalog/${d}`, msg: 'catalogued, but the repo has no eligible component of that name (removed, or status below beta)', fix });
  for (const d of subdirs(join(dir, 'kits')).filter((d) => !expectedKits.some((k) => k.id === d))) errors.push({ file: `harness/catalog/kits/${d}`, msg: 'catalogued, but the kit is not installed in the repo', fix });
  const compare = (file: string, unitDir: string, snap: Unit<ComponentManifest | KitManifest>): void => {
    const stored = ((): string | null => { try { return readFileSync(join(unitDir, 'manifest.json'), 'utf8'); } catch { return null; } })();
    if (stored === null) { errors.push({ file, msg: 'not in the catalog', fix }); return; }
    if (stored !== serialize(snap.manifest)) { errors.push({ file, msg: 'catalog manifest differs from the repo (files, dependencies or status changed)', fix }); return; }
    for (const { hash, path } of snap.manifest.files) {
      let buf: Buffer | null = null;
      try { buf = readFileSync(join(unitDir, 'files', hash)); } catch { /* missing */ }
      if (!buf) errors.push({ file: `harness/catalog/${path}`, msg: `blob ${hash} missing`, fix });
      else if (hashOf(buf) !== hash) errors.push({ file: `harness/catalog/${path}`, msg: `blob ${hash} does not match its hash (edited inside the catalog)`, fix });
    }
  };
  for (const name of components) compare(`harness/catalog/${name}/manifest.json`, join(dir, name), snapshotComponent(root, name, { cs, registry, config }));
  for (const kit of kits) compare(`harness/catalog/kits/${kit.id}/manifest.json`, join(dir, 'kits', kit.id), snapshotKit(root, kit));
  return errors;
}

// ---- resolving ------------------------------------------------------------------------------------------------------

// Names (any case or spacing) -> catalog names in install order, dependencies first.
export function resolveOrder(root: string, names: string[]): string[] {
  const index = catalogIndex(root);
  const order: string[] = [];
  const visiting = new Set<string>();
  const visit = (n: string, from?: string): void => {
    const name = kebab(n);
    if (order.includes(name)) return;
    if (visiting.has(name)) throw fail(`dependency cycle at ${name}`, 'Fix dependsOn in the contracts, then npm run catalog:build.');
    const m = index.components.includes(name) ? manifestOf(root, name) : null;
    if (!m) throw fail(`"${n}"${from ? ` (needed by ${from})` : ''} is not in the catalog. Catalogued: ${index.components.join(', ')}.`, 'Pick a catalogued name, or design a new one with sketchbook add <Name> --blank.');
    visiting.add(name);
    for (const d of requiresOf(m)) visit(d, name);
    visiting.delete(name);
    order.push(name);
  };
  for (const n of names) visit(n);
  return order;
}

// Who needs <name>: installed components (catalog manifest, else the contract's dependsOn) and installed kits.
export function dependentsOf(root: string, name: string, except: Set<string> = new Set()): Dependent[] {
  const out: Dependent[] = [];
  for (const { name: other, contract } of contracts(root)) {
    if (other === name || except.has(other)) continue;
    const m = manifestOf(root, other);
    const needs = m ? requiresOf(m) : (contract.dependsOn || []).map(kebab);
    if (needs.includes(name)) out.push({ kind: 'component', name: other });
  }
  for (const kit of kitIndex(root)) if (kitInstalled(root, kit) && !except.has(`kit:${kit.id}`) && kit.components.includes(name)) out.push({ kind: 'kit', name: kit.id });
  return out;
}

// ---- installing and removing ----------------------------------------------------------------------------------------

// Where a unit's files may live: a component's own folders and, when stable, its audits; or a kit's folder and its behavior spec.
const componentRoots = (name: string): string[] => [`spec/components/${name}/`, `src/components/${name}/`, `playwright/tests/${name}/`, `${PARITY_AUDITS}/${name}-`, `${A11Y_AUDITS}/${name}-`];
const kitRoots = (kit: Kit): string[] => [`${kit.path}/`, 'playwright/tests/patterns/'];

// The local source catalog is rebuilt when tokens are renamed; replay only on a downstream or fallback catalog.
function installContext(root: string): InstallContext {
  const config = readConfig(root);
  const localSource = config.catalog?.source === true && catalogDir(root) === join(root, 'harness/catalog');
  const renames = localSource ? [] : readRenames(root);
  return { prefix: config.prefix, renames, paths: renames.length ? semanticPaths(root) : [] };
}

// A unit's files as they would be written here: every path checked, every blob checked against its hash, then the
// prefix and the recorded token renames applied. Pure read; throws before anything is written.
function stageUnit(root: string, unitDir: string, manifest: ComponentManifest | KitManifest, roots: string[], ctx: InstallContext): StagedFile[] {
  if (!Array.isArray(manifest.files)) throw fail(`${unitDir}/manifest.json has no files list.`, DAMAGED);
  return manifest.files.map(({ path, hash }) => {
    if (typeof path !== 'string' || path.split('/').includes('..') || !roots.some((r) => path.startsWith(r))) throw fail(`Catalog file ${JSON.stringify(path)} is outside its unit (${roots.join(', ')}).`, DAMAGED);
    within(root, path);
    if (!HASH_RE.test(hash ?? '')) throw fail(`Catalog file ${path} has an invalid hash ${JSON.stringify(hash)}.`, DAMAGED);
    let buf: Buffer;
    try { buf = readFileSync(join(unitDir, 'files', hash)); } catch { throw fail(`Catalog blob ${hash} (${path}) is missing.`, DAMAGED); }
    if (hashOf(buf) !== hash) throw fail(`Catalog blob ${hash} (${path}) does not match its hash.`, DAMAGED);
    if (isText(path) && (manifest.prefix !== ctx.prefix || ctx.renames.length)) {
      let text = buf.toString('utf8');
      if (manifest.prefix !== ctx.prefix) text = rewrite(text, manifest.prefix, ctx.prefix).text;
      text = applyRenames(text, ctx.renames, ctx.prefix, { file: path, paths: ctx.paths });
      buf = Buffer.from(text);
    }
    return { path, buf };
  });
}

// Writes the staged files, then rebuilds; on any failure restores every file it touched (and the generated outputs)
// so the project is left as it was.
async function commit(root: string, writes: StagedFile[], { rebuild }: { rebuild: boolean }): Promise<void> {
  const backups: { abs: string; before: Buffer | null }[] = [];
  const createdDirs: string[] = [];
  try {
    for (const { path, buf } of writes) {
      const abs = within(root, path);
      let d = dirname(abs);
      let top: string | null = null;
      while (!existsSync(d)) { top = d; d = dirname(d); }
      if (top) createdDirs.push(top);
      backups.push({ abs, before: existsSync(abs) ? readFileSync(abs) : null });
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(abs, buf);
    }
    if (rebuild) await regenerate(root);
  } catch (e) {
    for (const { abs, before } of backups.reverse()) { if (before) writeFileSync(abs, before); else rmSync(abs, { force: true }); }
    for (const d of createdDirs.reverse()) rmSync(d, { recursive: true, force: true });
    if (rebuild) await regenerate(root).catch(() => {});
    throw fail(`Install rolled back, nothing changed: ${errorMessage(e)}`, fixOf(e) ?? 'Fix the cause above, then run the command again.');
  }
}

// Plans installing catalog components (and what they need) that are not present yet: files and registry, staged.
function planComponents(root: string, names: string[], ctx: InstallContext): { order: string[]; todo: string[]; already: string[]; writes: StagedFile[] } {
  const order = resolveOrder(root, names);
  const present = new Set(installedComponents(root));
  const todo = order.filter((n) => !present.has(n));
  const registry = readRegistry(root);
  const writes: StagedFile[] = [];
  for (const name of todo) {
    const m = manifestOf(root, name);
    if (!m) throw new TypeError("Cannot read properties of null (reading 'name')");
    if (m.name !== name) throw fail(`harness/catalog/${name}/manifest.json names "${m.name}".`, DAMAGED);
    writes.push(...stageUnit(root, join(catalogDir(root), name), m, componentRoots(name), ctx));
    let entry = registryEntry(registry, name);
    if (!entry) { entry = { name: m.displayName, tier: m.tier, status: m.status }; registry.components.push(entry); }
    Object.assign(entry, { status: m.status, tag: `${ctx.prefix}-${name}`, path: `spec/components/${name}` });
  }
  if (todo.length) writes.push({ path: 'spec/registry.json', buf: Buffer.from(serialize(registry)) });
  return { order, todo, already: order.filter((n) => present.has(n)), writes };
}

// Installs catalog components (and what they need) that are not present yet. Idempotent; all or nothing.
export async function installComponents(root: string, names: string[], { dryRun = false, rebuild = true }: InstallOptions = {}): Promise<{ installed: string[]; already: string[]; changed: string[] }> {
  const p = planComponents(root, names, installContext(root));
  if (!dryRun && p.todo.length) { await commit(root, p.writes, { rebuild }); inheritDecisions(root); }
  return { installed: p.todo, already: p.already, changed: p.writes.map((w) => w.path) };
}


// Whether the installed files of a unit differ from what installing it from the catalog would write now.
function unitDiffers(root: string, unitDir: string, manifest: ComponentManifest | KitManifest, roots: string[], now: string[], ctx: InstallContext): boolean {
  let staged: StagedFile[];
  try { staged = stageUnit(root, unitDir, manifest, roots, ctx); } catch { return true; }
  if (now.length !== staged.length) return true;
  return staged.some(({ path, buf }) => !existsSync(join(root, path)) || !buf.equals(readFileSync(join(root, path))));
}

const componentDiffers = (root: string, name: string, ctx: InstallContext): boolean => {
  const manifest = manifestOf(root, name);
  return !manifest || unitDiffers(root, join(catalogDir(root), name), manifest, componentRoots(name), componentFiles(root, name), ctx);
};

// Installed components the catalog could not put back as they are: made by the team (not catalogued), or customized.
export function atRisk(root: string, names: string[], ctx: InstallContext = installContext(root)): AtRisk[] {
  const index = catalogIndex(root);
  return names.flatMap((name): AtRisk[] => {
    const reason = !index.components.includes(name) || !manifestOf(root, name) ? 'team-made' : componentDiffers(root, name, ctx) ? 'customized' : null;
    return reason ? [{ name, reason }] : [];
  });
}

export async function removeComponents(root: string, names: string[], { dryRun = false, rebuild = true, yes = false }: InstallOptions & { yes?: boolean } = {}): Promise<{ removed: string[]; changed: string[]; atRisk: AtRisk[] }> {
  const set = new Set(names.map(kebab));
  const present = new Set(installedComponents(root));
  for (const n of set) if (!present.has(n)) throw fail(`${n} is not installed (no spec/components/${n}/contract.json).`, 'sketchbook list --installed');
  const blocked = [...set].map((n) => ({ name: n, by: dependentsOf(root, n, set) })).filter((x) => x.by.length);
  if (blocked.length) {
    throw fail(blocked.map((b) => `${b.name} is needed by ${b.by.map((d) => `${d.kind} ${d.name}`).join(', ')}`).join('; '), `Remove those first (sketchbook remove <name>, sketchbook kits remove <kit>), or keep ${blocked.map((b) => b.name).join(', ')}.`);
  }
  const risky = atRisk(root, [...set]);
  if (risky.length && !yes && !dryRun) {
    throw Object.assign(fail(`Removing would lose work the catalog cannot bring back: ${risky.map((r) => `${r.name} (${r.reason === 'team-made' ? 'made by the team, not in the catalog' : 'customized: differs from the catalog'})`).join(', ')}.`, 'Commit first (git is the undo), check with --dry-run, then rerun with --yes.'), { data: { atRisk: risky } });
  }
  const registry = readRegistry(root);
  const changed: string[] = [];
  for (const name of set) {
    const files = [...componentFiles(root, name), ...walk(root, `src/components/${name}`).filter((f) => f.endsWith('.styles.ts')), ];
    changed.push(...files);
    if (dryRun) continue;
    for (const f of files) rmSync(join(root, f), { force: true });
    for (const d of [`spec/components/${name}`, `src/components/${name}`, `playwright/tests/${name}`]) rmSync(join(root, d), { recursive: true, force: true });
    const entry = registryEntry(registry, name);
    if (entry) { entry.status = 'planned'; delete entry.path; }
  }
  changed.push('spec/registry.json');
  if (!dryRun) {
    writeFileSync(join(root, 'spec/registry.json'), serialize(registry));
    if (rebuild) await regenerate(root);
  }
  return { removed: [...set], changed, atRisk: risky };
}

function kitManifestChecked(root: string, kit: Kit): KitManifest | null {
  const m = kitManifestOf(root, kit.id);
  if (m && (m.id !== kit.id || m.path !== kit.path)) throw fail(`harness/catalog/kits/${kit.id}/manifest.json names ${JSON.stringify(m.id)} at ${JSON.stringify(m.path)}, not ${kit.id} at ${kit.path}.`, DAMAGED);
  return m;
}

export async function installKits(root: string, ids: string[], { dryRun = false, rebuild = true }: InstallOptions = {}): Promise<{ installed: string[]; components: string[]; changed: string[] }> {
  const index = kitIndex(root);
  const kits = ids.map((id) => index.find((k) => k.id === id) ?? (() => { throw fail(`Kit "${id}" is not in harness/kits/index.json. Kits: ${index.map((k) => k.id).join(', ') || 'none'}.`, 'sketchbook kits list'); })());
  const ctx = installContext(root);
  const comps = planComponents(root, [...new Set(kits.flatMap((k) => k.components))], ctx);
  const writes = [...comps.writes];
  const installed: string[] = [];
  for (const kit of kits) {
    if (kitInstalled(root, kit) || installed.includes(kit.id)) continue;
    const m = kitManifestChecked(root, kit);
    if (!m) throw fail(`Kit ${kit.id} is neither in ${kit.path} nor in harness/catalog/kits/${kit.id}.`, 'Rebuild the catalog where the kit exists (npm run catalog:build), or upgrade the harness.');
    writes.push(...stageUnit(root, join(catalogDir(root), 'kits', kit.id), m, kitRoots(kit), ctx));
    installed.push(kit.id);
  }
  if (!dryRun && writes.length) await commit(root, writes, { rebuild });
  return { installed, components: comps.todo, changed: writes.map((w) => w.path) };
}

// Installed kits whose files differ from their catalog unit (edited by the team).
export function customizedKits(root: string, kits: Kit[], ctx: InstallContext = installContext(root)): string[] {
  return kits.filter((kit) => { const m = kitManifestChecked(root, kit); return m && unitDiffers(root, join(catalogDir(root), 'kits', kit.id), m, kitRoots(kit), kitFiles(root, kit), ctx); }).map((k) => k.id);
}

export async function removeKits(root: string, ids: string[], { dryRun = false, yes = false, rebuild = true }: InstallOptions & { yes?: boolean } = {}): Promise<{ removed: string[]; changed: string[]; customized: string[] }> {
  const index = kitIndex(root);
  const kits: Kit[] = [];
  for (const id of ids) {
    const kit = index.find((k) => k.id === id);
    if (!kit) throw fail(`Kit "${id}" is not in harness/kits/index.json.`, 'sketchbook kits list');
    if (!kitInstalled(root, kit)) throw fail(`Kit ${id} is not installed (${kit.path} missing).`, 'sketchbook kits list');
    if (!kitManifestChecked(root, kit)) throw fail(`Kit ${id} is not in the catalog, so it could not be added back.`, 'Run npm run catalog:build first (catalog source repo), or keep the kit.');
    kits.push(kit);
  }
  const edited = customizedKits(root, kits);
  if (edited.length && !yes && !dryRun) {
    throw Object.assign(fail(`Removing would lose edits the catalog cannot bring back: kit ${edited.join(', ')} differs from the catalog.`, 'Commit first (git is the undo), check with --dry-run, then rerun with --yes.'), { data: { customized: edited } });
  }
  const changed: string[] = [];
  for (const kit of kits) {
    const files = kitFiles(root, kit);
    changed.push(...files);
    if (dryRun) continue;
    rmSync(within(root, kit.path), { recursive: true, force: true });
    for (const f of files) rmSync(within(root, f), { force: true });
  }
  if (!dryRun && rebuild) await regenerate(root);
  return { removed: ids, changed, customized: edited };
}

// Installed components whose files differ from their catalog unit (customized by the team).
export function customized(root: string): string[] {
  const ctx = installContext(root);
  return installedComponents(root).filter((name) => manifestOf(root, name) && componentDiffers(root, name, ctx));
}
