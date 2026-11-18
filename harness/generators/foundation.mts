// brand.config.json -> spec/tokens/foundation/*.tokens.json, then the semantic links (spec/tokens/brand-links.json).
// Values come from the standards catalog (harness/standards) through resolveBrand; the default brand.config
// reproduces the shipped system. Hand edits to generated foundation tokens, and tokens added by hand, are kept and
// recorded in spec/tokens/overrides.json: foundation = generator(brand.config) + overrides (check G1 proves it).
import { readFile, writeFile, mkdir, access, copyFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { BrandConfig } from '../../generated/types/brand-config.js';
import { hexToRgb, rgbToOklch, oklchToHex } from '../lib/color.mjs';
import { errorMessage, parseJson, isMain } from '../lib/files.mjs';
import { flatten, type DtcgDoc } from '../lib/tokens.mjs';
import { resolveBrand, getPreset, type Mode, type ResolvedBrand } from '../standards/resolve.mjs';
import { applyLinks, type LinkResult } from './links.mjs';

const TEMPLATES = fileURLToPath(new URL('../templates/', import.meta.url));

export interface FoundationPaths { FOUNDATION: string; SEMANTIC: string; SNAPSHOT: string; OVERRIDES: string; LINKS: string }
export interface OverrideEntry { file: string; value: unknown; generated?: unknown; added?: boolean; type?: string }
export interface OverridesDoc { $description?: string; overrides?: Record<string, OverrideEntry> }
export type Overrides = Record<string, OverrideEntry>;
export type Snapshot = Record<string, Record<string, string>>;
export interface GeneratedFoundation { files: Record<string, DtcgDoc>; anchors: Record<string, number>; resolved: ResolvedBrand }
export interface GeneratorReport { kept: string[]; added: string[]; dropped: string[] }
export interface GeneratorResult { anchors: Record<string, number>; brand: BrandConfig; resolved: ResolvedBrand; overrides: GeneratorReport; links: LinkResult; written: string[] }

export const paths = (root: string): FoundationPaths => ({
  FOUNDATION: join(root, 'spec/tokens/foundation'),
  SEMANTIC: join(root, 'spec/tokens/semantic'),
  SNAPSHOT: join(root, 'generated/foundation.snapshot.json'),
  OVERRIDES: join(root, 'spec/tokens/overrides.json'),
  LINKS: join(root, 'spec/tokens/brand-links.json'),
});

const readJson = async <T,>(p: string, fallback: T): Promise<T> => { try { return parseJson<T>(await readFile(p, 'utf8')); } catch { return fallback; } };
const exists = async (p: string): Promise<boolean> => { try { await access(p); return true; } catch { return false; } };
const px = (n: unknown): string => `${Math.round(Number(n) * 100) / 100}px`;
const key = (n: unknown): string => String(n).replace('.', '-'); // 1.5 -> "1-5" (dots are path separators)

type Rec = Record<string, unknown>;
const text = (v: unknown): string => (typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v));
const isRecord = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v);
const rec = (v: unknown): Rec => { if (!isRecord(v)) throw new TypeError(`Expected an object, got ${JSON.stringify(v)}`); return v; };
const arr = (v: unknown): unknown[] => { if (!Array.isArray(v)) throw new TypeError(`Expected an array, got ${JSON.stringify(v)}`); return v; };
const numTable = (v: unknown): Record<string, number> => Object.fromEntries(Object.entries(rec(v)).map(([k, n]): [string, number] => [k, Number(n)]));

// OKLCH lightness per ramp step (the catalog's oklch method) and a chroma curve for hues.
export const LADDER = numTable(getPreset('rampMethods', 'oklch').values.lightness);
const CHROMA: Record<number, number> = { 50: 0.08, 100: 0.18, 200: 0.38, 300: 0.62, 400: 0.88, 500: 1, 600: 1, 700: 0.9, 800: 0.75, 900: 0.6, 950: 0.45 };

const ladder = (step: number): number => LADDER[String(step)] ?? NaN;
const chromaOf = (step: number): number => CHROMA[step] ?? NaN;

function ramp(hex: string, steps: number[]): { tokens: Record<number, { $value: string }>; anchor: number } {
  const base = rgbToOklch(hexToRgb(hex));
  // The step whose ladder L is closest to the brand color keeps the exact brand hex.
  const anchor = steps.reduce((a, s) => (Math.abs(ladder(s) - base.L) < Math.abs(ladder(a) - base.L) ? s : a), steps[0] ?? NaN);
  const out: Record<number, { $value: string }> = {};
  for (const s of steps) out[s] = { $value: s === anchor ? hex.toUpperCase() : oklchToHex({ L: ladder(s), C: base.C * chromaOf(s), H: base.H }) };
  return { tokens: out, anchor };
}

function neutralRamp({ hue, chroma }: { hue: number; chroma: number }, steps: number[]): Record<number, { $value: string }> {
  const out: Record<number, { $value: string }> = {};
  for (const s of steps) out[s] = { $value: oklchToHex({ L: ladder(s), C: chroma, H: hue }) };
  return out;
}

const map = (obj: unknown, fn: (v: unknown) => unknown): Record<string, { $value: unknown }> => Object.fromEntries(Object.entries(rec(obj)).map(([k, v]): [string, { $value: unknown }] => [k, { $value: fn(v) }]));

// Pure: brand.config -> foundation token documents (no overrides) and the ramp anchors.
export function generate(brand?: Partial<BrandConfig> | null): GeneratedFoundation {
  const r = resolveBrand(brand ?? undefined);
  const steps = arr(r.color.ramp.steps).map(Number);
  const header = (what: string) => ({ $description: `Generated from brand.config.json (${what}). Edit brand.config.json, or edit here to record an override.` });
  const anchors: Record<string, number> = {};
  const color: Rec = { $type: 'color', white: { $value: '#FFFFFF' }, black: { $value: '#000000' } };
  const neutral = rec(r.color.neutral);
  color.neutral = neutralRamp({ hue: Number(neutral.hue), chroma: Number(neutral.chroma) }, steps);
  // The brand ramp is color.brand.*: color.primary is a semantic (shadcn) token and a path can't be both a token and a group.
  if (r.color.primary !== 'neutral') { const x = ramp(r.color.primary, steps); color.brand = x.tokens; anchors.brand = x.anchor; }
  for (const [name, hex] of Object.entries(r.color.accents)) { const x = ramp(hex, steps); color[name] = x.tokens; anchors[name] = x.anchor; }
  // A role with no accent of its name (danger, green, amber, blue by default) gets a ramp from the catalog seed.
  for (const role of Object.values(r.color.roles)) {
    const name = text(role.ramp);
    if (!role.seeded || color[name]) continue;
    const x = ramp(text(role.hex), steps); color[name] = x.tokens; anchors[name] = x.anchor;
  }
  if (anchors.brand !== undefined) anchors.primary = anchors.brand;

  const t = r.typography;
  const typography = {
    ...header('typography'),
    font: {
      family: { $type: 'fontFamily', sans: { $value: t.sans }, mono: { $value: t.mono } },
      size: { $type: 'dimension', ...map(t.sizes, px) },
      weight: { $type: 'fontWeight', ...map(t.weights, (v) => v) },
      'letter-spacing': { $type: 'dimension', ...map(t.letterSpacing, (v) => v) },
      'line-height': { $type: 'number', ...map(t.lineHeights, (v) => v), ...map(t.leading, (v) => v) },
    },
  };

  const space: { $description: string; space: Rec } = { ...header('spacing'), space: { $type: 'dimension' } };
  for (const s of arr(r.spacing.steps)) space.space[key(s)] = { $value: px(Number(s) * Number(r.spacing.base)) };

  const radius = { ...header('radius'), radius: { $type: 'dimension', ...map(r.radius.scale, px) } };
  const border = { ...header('border width'), border: { width: { $type: 'dimension', ...map(r.border, px) } } };
  const opacity = { ...header('opacity'), opacity: { $type: 'number', ...map(r.opacity, (v) => v) } };

  const size: { $description: string; size: Rec } = { ...header('size'), size: { $type: 'dimension' } };
  for (const n of r.sizes) size.size[String(n)] = { $value: px(n) };

  const sh = (v: unknown) => { const [y, blur, spread, alpha] = arr(v); return { color: `#000000${Math.round(Number(alpha) * 255).toString(16).padStart(2, '0').toUpperCase()}`, offsetX: '0px', offsetY: px(y), blur: px(blur), spread: px(spread) }; };
  const shadow = { ...header('shadow'), shadow: { $type: 'shadow', ...map(r.elevation.shadows, sh) } };

  const grid: Rec = { ...header('grid'), grid: { columns: { $type: 'number', $value: r.grid.columns }, gutter: { $type: 'dimension', $value: px(r.grid.gutter) }, margin: { $type: 'dimension', $value: px(r.grid.margin) } } };
  if (r.breakpoints) grid.breakpoint = { $type: 'dimension', ...map(r.breakpoints, px) };

  const motion = {
    ...header('motion; repo only, design tools skip it'),
    duration: { $type: 'duration', ...map(r.motion.durations, (ms) => `${text(ms)}ms`) },
    easing: { $type: 'cubicBezier', ...map(r.motion.easings, (v) => v) },
  };
  const z = { ...header('z-index; repo only'), z: { $type: 'number', ...map(r.z.values, (v) => v) } };

  return { files: { color: { ...header('color'), color }, typography, space, radius, border, opacity, size, shadow, grid, motion, z }, anchors, resolved: r };
}

const FILE = (name: string): string => `foundation/${name}.tokens.json`;
const nameOf = (file: string): string => file.replace(/^foundation\//, '').replace(/\.tokens\.json$/, '');

// Sets an existing token's value, or inserts a hand-added token (with its $type when the group's differs).
function place(doc: DtcgDoc, path: string, value: unknown, type: string | undefined): void {
  let node: Rec = doc;
  let inherited = doc.$type;
  const parts = path.split('.');
  for (const p of parts.slice(0, -1)) { node = rec(node[p] ??= {}); inherited = node.$type ?? inherited; }
  const last = parts.at(-1) ?? '';
  const existing = node[last];
  if (isRecord(existing) && '$value' in existing) { existing.$value = value; return; }
  node[last] = { $value: value, ...(type && type !== inherited ? { $type: type } : {}) };
}

// Pure: generator output plus the recorded overrides (what G1 compares the foundation files with).
export function buildFoundation(brand?: Partial<BrandConfig> | null, overrides: Overrides = {}): GeneratedFoundation {
  const out = generate(brand);
  for (const [path, o] of Object.entries(overrides)) {
    const doc = out.files[nameOf(o.file)];
    if (doc) place(doc, path, o.value, o.type);
  }
  return out;
}

export const serialize = (doc: unknown): string => JSON.stringify(doc, null, 2) + '\n';

// What the generator made, per file and token (JSON-encoded values): generated/foundation.snapshot.json.
export const snapshotOf = (files: Record<string, unknown>): Snapshot => Object.fromEntries(Object.entries(files).map(([name, doc]): [string, Record<string, string>] => [name, Object.fromEntries(flatten(doc).map((t): [string, string] => [t.path, JSON.stringify(t.value)]))]));
export const snapshotText = (files: Record<string, unknown>): string => JSON.stringify(snapshotOf(files), null, 2) + '\n';

// Writes the foundation layer, missing semantic files and links, then applies the links. Returns what it kept and changed.
export async function runGenerator(root: string = process.cwd(), { quiet = false }: { quiet?: boolean } = {}): Promise<GeneratorResult> {
  const { FOUNDATION, SEMANTIC, SNAPSHOT, OVERRIDES, LINKS } = paths(root);
  const brand = await readJson<BrandConfig | null>(join(root, 'brand.config.json'), null);
  if (!brand) throw new Error('brand.config.json not found or invalid');
  const { files } = generate(brand);
  // No snapshot (deleted, or never generated here): every value that differs from the generator counts as a hand
  // edit and every unknown token as hand-added, so nothing on disk is lost silently (G1 requires the snapshot).
  const snapshot = await readJson<Snapshot | null>(SNAPSHOT, null);
  const overrides = await readJson<OverridesDoc>(OVERRIDES, { $description: 'Hand edits to generated tokens. The generator keeps these values.', overrides: {} });
  overrides.overrides ??= {};
  const o = overrides.overrides;
  const report: GeneratorReport = { kept: [], added: [], dropped: [] };
  const nextSnapshot = snapshotOf(files);
  await mkdir(FOUNDATION, { recursive: true });
  await mkdir(join(root, 'generated'), { recursive: true });

  // 1. Record hand edits found on disk: changed generated values, tokens added by hand, reverts and deletions.
  for (const [name, generated] of Object.entries(nextSnapshot)) {
    const current = await readJson<unknown>(join(FOUNDATION, `${name}.tokens.json`), null);
    if (!current) continue;
    const prev = snapshot ? snapshot[name] : undefined;
    const onDisk = new Set();
    for (const tok of flatten(current)) {
      onDisk.add(tok.path);
      const now = JSON.stringify(tok.value);
      const was = prev?.[tok.path];
      const gen = generated[tok.path];
      const recorded = o[tok.path];
      if (gen !== undefined) {
        if (was !== undefined ? now !== was : now !== gen) o[tok.path] = { file: FILE(name), value: tok.value, generated: parseJson(gen) };
        // Edited back to the generated value by hand: the override is settled.
        else if (now === gen && recorded && !recorded.added) { delete o[tok.path]; report.dropped.push(tok.path); }
      } else if (recorded?.added) {
        recorded.value = tok.value;
      } else if (!snapshot || (prev && was === undefined)) {
        o[tok.path] = { file: FILE(name), value: tok.value, generated: null, added: true, ...(tok.type ? { type: tok.type } : {}) };
        report.added.push(tok.path);
      }
    }
    // A recorded override whose token was deleted from the file by hand: the hand edit is undone.
    for (const [path, entry] of Object.entries(o)) {
      if (entry.file === FILE(name) && !onDisk.has(path)) { delete o[path]; report.dropped.push(path); }
    }
  }
  // 2. Overrides of tokens the generator no longer makes are dropped; ones equal to the generated value are settled.
  for (const [path, entry] of Object.entries(o)) {
    const gen = nextSnapshot[nameOf(entry.file)]?.[path];
    if (entry.added) {
      if (gen === undefined) { report.kept.push(path); continue; }
      delete entry.added; delete entry.type; // the generator makes this token now: it becomes a plain override
    }
    if (gen === undefined || gen === JSON.stringify(entry.value)) { delete o[path]; if (gen === undefined) report.dropped.push(path); continue; }
    entry.generated = parseJson(gen);
    report.kept.push(path);
  }

  const { files: docs, anchors, resolved } = buildFoundation(brand, o);
  for (const [name, doc] of Object.entries(docs)) await writeFile(join(FOUNDATION, `${name}.tokens.json`), serialize(doc));
  await writeFile(SNAPSHOT, snapshotText(files));
  await writeFile(OVERRIDES, JSON.stringify(overrides, null, 2) + '\n');

  // 3. Missing semantic files (and the links file) come from the templates: a mode without its own template
  // starts from its role's (light or dark). The team owns them from then on; the links keep them on brand.
  await mkdir(SEMANTIC, { recursive: true });
  const written: string[] = [];
  const semanticModes: { name: string; role: Mode['role'] | 'base' }[] = [{ name: 'base', role: 'base' }, ...resolved.modes];
  for (const { name, role } of semanticModes) {
    const path = join(SEMANTIC, `${name}.tokens.json`);
    if (await exists(path)) continue;
    const template = (await exists(join(TEMPLATES, `semantic/${name}.tokens.json`))) ? name : role;
    await copyFile(join(TEMPLATES, `semantic/${template}.tokens.json`), path);
    written.push(name);
  }
  if (!(await exists(LINKS))) { await copyFile(join(TEMPLATES, 'brand-links.json'), LINKS); written.push('brand-links'); }
  const links = await applyLinks(root, { resolved, anchors, docs });

  if (!quiet) {
    console.log(`foundation: ${Object.keys(docs).length} files; primary: ${resolved.color.primary === 'neutral' ? 'neutral (shadcn default)' : `anchored at ${anchors.primary}`}; overrides kept: ${Object.keys(o).length}; semantic defaults written: ${written.join(', ') || 'none (already owned)'}`);
    for (const p of report.added) console.log(`  kept hand-added token ${p} (recorded in spec/tokens/overrides.json)`);
    for (const p of report.kept) console.log(`  override kept: ${p} = ${JSON.stringify(o[p]?.value)}`);
    for (const p of report.dropped) console.log(`  override dropped: ${p} (the generator no longer makes it, it matches again, or it was reverted or deleted by hand)`);
    for (const c of links.changed) console.log(`  linked: ${c}`);
    for (const m of links.missing) console.log(`  link not applied: ${m.msg}`);
  }
  return { anchors, brand, resolved, overrides: report, links, written };
}

if (isMain(import.meta.url)) runGenerator().catch((e: unknown) => { console.error(errorMessage(e)); process.exit(1); });
