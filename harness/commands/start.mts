// sketchbook init --start <starter> (SB-0046): a starter is data, harness/starters/<id>.json
//   { id, title, for, foundations: brand.config patch | null, components: 'all' | 'none' | [names], kits: 'all' | 'none' | [ids], next: [] }
// Applying one makes the project match it: kits and catalog components not wanted are removed, wanted ones are
// installed from the catalog (dependencies first), the foundations patch is merged into brand.config.json, and the
// starter is recorded in harness.config.json. Components the team made (not in the catalog) are never touched.
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import type { HarnessConfigJson } from '../../generated/types/harness-config.js';
import { harnessPath, readJsonSync, readJsonStrict, writeFileAtomic, HARNESS } from '../lib/files.mjs';
import {
  kebab, catalogIndex, installedComponents, resolveOrder, kitIndex, installedKits,
  installComponents, removeComponents, installKits, removeKits, readConfig,
} from './catalog.mjs';
import type { FixError } from './catalog.mjs';
import { regenerate } from './prefix.mjs';
import { runGenerator } from '../generators/foundation.mjs';
import { auditCss, writeProposal, OUT as PROPOSAL } from './audit-css.mjs';
import { staleLinks } from './tokens.mjs';

export type StarterPick = 'all' | 'none' | string[];
export interface Starter { id: string; title: string; for?: string; foundations: Record<string, unknown> | null; components: StarterPick; kits: StarterPick; next: string[] }
export interface StarterPlan {
  starter: Starter;
  components: { target: string[]; install: string[]; remove: string[]; kept: string[] };
  kits: { target: string[]; install: string[]; remove: string[] };
}
export interface CatalogSource { source: boolean; line?: string | null; warning?: string }
export interface StarterOptions { components?: string; from?: string; yes?: boolean; detachCatalog?: boolean; dryRun?: boolean }
export interface StarterDryRun { plan: StarterPlan; catalog: CatalogSource; destructive: number; dryRun: true }
export interface StarterResult { plan: StarterPlan; catalog: CatalogSource; changed: string[]; lines: string[]; warning: string | null; next: string[]; actionExit: number | null | undefined }
interface StarterAction { lines: string[]; next: string[]; changed?: string[]; exitCode?: number | null }

const fail = (msg: string, fix: string): FixError => Object.assign(new Error(msg), { fix });
const serialize = (j: unknown): string => JSON.stringify(j, null, 2) + '\n';
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

export function listStarters(root: string): (Starter | null)[] {
  const dir = harnessPath(root, 'starters');
  return readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((f) => readJsonSync<Starter>(join(dir, f)));
}

export function loadStarter(root: string, id: string): Starter {
  const s = readJsonSync<Starter>(join(harnessPath(root, 'starters'), `${id}.json`));
  if (!s) {
    const ids = listStarters(root).map((x) => { if (!x) throw new TypeError("Cannot read properties of null (reading 'id')"); return x.id; });
    throw fail(`Unknown starter "${id}". Starters: ${ids.join(', ')}.`, 'sketchbook init --start library (the default).');
  }
  return s;
}

// Objects merge key by key; arrays and values replace; null deletes.
export function mergePatch(target: unknown, patch: unknown): unknown {
  if (patch === null || typeof patch !== 'object' || Array.isArray(patch)) return patch;
  const out: Record<string, unknown> = isRecord(target) ? { ...target } : {};
  const entries: [string, unknown][] = Object.entries(patch);
  for (const [k, v] of entries) {
    if (v === null) delete out[k];
    else out[k] = mergePatch(out[k], v);
  }
  return out;
}

const pickList = (value: StarterPick | undefined, all: string[]): string[] => (value === 'all' ? all : value === 'none' ? [] : value ?? []);

// Pure plan: what applying the starter would remove and install.
export function planStarter(root: string, id: string, { components }: { components?: string } = {}): StarterPlan {
  const starter = loadStarter(root, id);
  const index = catalogIndex(root);
  const kits = kitIndex(root);
  const wantedComponents = components ? (components === 'all' || components === 'none' ? pickList(components, index.components) : components.split(',').map(kebab).filter(Boolean)) : pickList(starter.components, index.components);
  if (id === 'pick' && !wantedComponents.length) throw fail('The pick starter needs the components to install.', 'sketchbook init --start pick --components card,button (dependencies come along).');
  const wantedKits = pickList(starter.kits, kits.map((k) => k.id));
  const kitComponents = kits.filter((k) => wantedKits.includes(k.id)).flatMap((k) => k.components);
  const target = resolveOrder(root, [...new Set([...wantedComponents, ...kitComponents])]);
  const present = installedComponents(root);
  const catalogued = new Set(index.components);
  const kitsPresent = installedKits(root);
  return {
    starter,
    components: { target, install: target.filter((n) => !present.includes(n)), remove: present.filter((n) => catalogued.has(n) && !target.includes(n)), kept: present.filter((n) => !catalogued.has(n)) },
    kits: { target: wantedKits, install: wantedKits.filter((k) => !kitsPresent.includes(k)), remove: kitsPresent.filter((k) => !wantedKits.includes(k)) },
  };
}

// Starter-specific step after the library is in place. Returns lines to print, files changed and next commands.
function starterAction(root: string, id: string, from: string | undefined): StarterAction {
  if (id === 'import') {
    const hasTokens = existsSync(join(HARNESS, 'cli/commands/tokens.mjs'));
    if (!from) return { lines: ['Next: import your tokens into a proposal (nothing is applied until you approve it).'], next: ['sketchbook tokens import <file>'] };
    if (!hasTokens) return { lines: [`sketchbook tokens is not available in this harness yet; run it once it is: sketchbook tokens import ${from}`], next: [`sketchbook tokens import ${from}`] };
    const r = spawnSync('node', [join(HARNESS, 'cli.mjs'), 'tokens', 'import', from], { cwd: root, encoding: 'utf8' });
    return { lines: [r.stdout.trim(), r.stderr.trim()].filter(Boolean), next: ['/import-tokens (review the proposal)'], exitCode: r.status };
  }
  if (id === 'from-codebase') {
    if (!from) return { lines: ['Next: audit your product\'s CSS into a foundations proposal.'], next: ['sketchbook audit-css <path|glob>'] };
    const proposal = auditCss(root, [from]);
    writeProposal(root, proposal);
    return { lines: [`CSS audit of ${proposal.sources.length} file(s) -> ${PROPOSAL}: ${proposal.colors.clusters.length} color cluster(s), ${proposal.fontSizes.length} font size(s), spacing base ${proposal.spacing.base}px.`], changed: [PROPOSAL], next: ['/foundations import (on the proposal)'] };
  }
  return { lines: [], next: [] };
}

// What a starter does to harness.config.json catalog.source (SB-0061, SB-0071). In the catalog's source repo (source:
// true) G1 keeps harness/catalog equal to the components; detaching turns that off for good, so it is never a side
// effect: only --detach-catalog does it (--yes confirms removals and nothing else), with a loud warning. Elsewhere it
// is set to false as before.
export const DETACHED_NOTE = 'harness/catalog is the catalog this project installs from (sketchbook add, kits add); it is not rebuilt here (catalog.source false, catalog:build is a no-op) and an upgrade replaces it. The components in src/ are the team\'s own (SB-0061, SB-0071).';
export function catalogSourceAfter(root: string, { detachCatalog = false }: { detachCatalog?: boolean } = {}): CatalogSource {
  const source = readConfig(root).catalog?.source === true;
  if (!source) return { source: false, line: null };
  if (detachCatalog) return { source: false, warning: 'WARNING: this repo was the catalog\'s source (harness.config.json catalog.source: true) and --detach-catalog detached it: G1 no longer checks that harness/catalog matches the components; they are the team\'s own now. If this is the Sketchbook repo itself, set catalog.source back to true (and run npm run catalog:build).' };
  return { source: true, line: 'catalog.source stays true: this repo is the catalog\'s source, so G1 keeps harness/catalog equal to its components. Pass --detach-catalog to make the components the team\'s own (--yes does not).' };
}

// Refusals that must run before anything is written: removals need --yes; a foundations patch (or init's brand
// options) regenerates the linked semantic tokens, so hand edits to them need --yes too (as token commands, SB-0071).
export async function preflightStarter(root: string, plan: StarterPlan, { yes = false, brandChange = false }: { yes?: boolean; brandChange?: boolean } = {}): Promise<void> {
  const id = plan.starter.id;
  if (plan.components.remove.length + plan.kits.remove.length && !yes) {
    throw fail(`Starter ${id} would remove ${plan.components.remove.length} component(s)${plan.components.remove.length ? ` (${plan.components.remove.join(', ')})` : ''} and ${plan.kits.remove.length} kit(s)${plan.kits.remove.length ? ` (${plan.kits.remove.join(', ')})` : ''}.`, `Commit first (git is the undo), check with --dry-run, then rerun with --yes.`);
  }
  if (brandChange || plan.starter.foundations) await refuseStaleLinks(root, { yes });
}

export async function refuseStaleLinks(root: string, { yes = false }: { yes?: boolean } = {}): Promise<never[]> {
  if (yes) return [];
  const stale = await staleLinks(root);
  if (stale.length) throw fail(`${stale.length} brand-linked token value(s) differ from their link (edited by hand?) and regenerating would overwrite them: ${stale.slice(0, 4).join('; ')}${stale.length > 4 ? '; …' : ''}. Nothing was written.`, 'To keep the hand value, delete that token\'s entry in spec/tokens/brand-links.json (you own it then); to let the link win, re-run with --yes.');
  return [];
}

export async function applyStarter(root: string, id: string, options: StarterOptions & { dryRun: true }): Promise<StarterDryRun>;
export async function applyStarter(root: string, id: string, options?: StarterOptions & { dryRun?: false }): Promise<StarterResult>;
export async function applyStarter(root: string, id: string, options?: StarterOptions): Promise<StarterDryRun | StarterResult>;
export async function applyStarter(root: string, id: string, { components, from, yes = false, detachCatalog = false, dryRun = false }: StarterOptions = {}): Promise<StarterDryRun | StarterResult> {
  const plan = planStarter(root, id, { components });
  const destructive = plan.components.remove.length + plan.kits.remove.length;
  const catalog = catalogSourceAfter(root, { detachCatalog });
  if (dryRun) return { plan, catalog, destructive, dryRun: true };
  // Read before anything changes, so a broken file stops the starter instead of leaving it half applied.
  const brand = plan.starter.foundations ? readJsonStrict(join(root, 'brand.config.json')) : null;
  const config = readJsonStrict<HarnessConfigJson>(join(root, 'harness.config.json'));
  if (!config) throw fail('This folder has no harness.config.json: it is not a Sketchbook project.', 'sketchbook init creates a project in an empty folder.');
  await preflightStarter(root, plan, { yes });
  const changed: string[] = [];
  // --yes above confirmed these removals, edited kits and customized components included.
  if (plan.kits.remove.length) changed.push(...(await removeKits(root, plan.kits.remove, { yes: true, rebuild: false })).changed);
  if (plan.components.remove.length) changed.push(...(await removeComponents(root, plan.components.remove, { rebuild: false, yes: true })).changed);
  if (plan.components.install.length) changed.push(...(await installComponents(root, plan.components.target, { rebuild: false })).changed);
  if (plan.kits.install.length) changed.push(...(await installKits(root, plan.kits.install, { rebuild: false })).changed);
  if (plan.starter.foundations) {
    writeFileAtomic(join(root, 'brand.config.json'), serialize(mergePatch(brand, plan.starter.foundations)));
    await runGenerator(root, { quiet: true });
    changed.push('brand.config.json', 'spec/tokens/foundation/*');
  }
  config.starter = id;
  const wasSource = config.catalog?.source === true;
  config.catalog = { ...(config.catalog ?? {}), source: catalog.source };
  if (wasSource && !catalog.source) config.catalog.note = DETACHED_NOTE;
  writeFileAtomic(join(root, 'harness.config.json'), serialize(config));
  changed.push('harness.config.json');
  await regenerate(root);
  const action = starterAction(root, id, from);
  return { plan, catalog, changed: [...new Set([...changed, ...(action.changed ?? [])])], lines: [...(catalog.line ? [catalog.line] : []), ...action.lines], warning: catalog.warning ?? null, next: [...action.next, ...plan.starter.next], actionExit: action.exitCode };
}
