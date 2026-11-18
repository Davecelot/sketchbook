// sketchbook tokens import: parse a team's existing tokens (DTCG incl. Tokens Studio, as one file or a folder of sets, or CSS
// custom properties) into one normalized list, and propose a mapping onto this system's semantic interface and
// foundations with deterministic heuristics. Writes generated/import/<name>.proposal.json; nothing else changes.
// `import apply` writes the reviewed proposal into brand.config.json and the semantic files (never deletes a token).
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, basename, extname, relative } from 'node:path';
import type { BrandConfig } from '../../generated/types/brand-config.js';
import { hexToRgb, rgbToHex, rgbToOklch, oklchToHex } from '../lib/color.mjs';
import type { Oklch } from '../lib/color.mjs';
import { errorMessage, parseJson } from '../lib/files.mjs';
import { flatten, ALIAS } from '../lib/tokens.mjs';
import type { DtcgDoc } from '../lib/tokens.mjs';
import type { BrandLink } from '../generators/links.mjs';
import type { InterfaceToken } from '../lib/interface.mjs';
import { modesOf } from '../standards/resolve.mjs';
import { serialize, fail, validateBrand } from './tokens.mjs';
import type { TokenPlan } from './tokens.mjs';

// One imported token, normalized. `type` is the DTCG type when the source named a known one, else what it said.
export interface ImportToken { path: string; type: unknown; value: unknown; set?: string; mode?: string }
export interface ResolvedImportToken extends ImportToken { resolved: unknown }
export interface ParsedImport { tokens: ImportToken[]; skipped: ImportToken[]; modes: string[] }
export interface TokensStudioTheme { name: unknown; selectedTokenSets?: Record<string, string> }
// A token-set document: plain DTCG, or Tokens Studio (sets as top-level keys, with $themes and $metadata).
export interface TokenSetsDoc { $themes?: TokensStudioTheme[]; $metadata?: { tokenSetOrder?: string[] }; [set: string]: unknown }
export interface MappingEntry { from: string; to: string; confidence: number; reason: string; values?: Record<string, unknown>; value?: unknown; linked?: true; apply: boolean }
export interface UnmappedEntry { path: string; type: unknown; reason: string }
export interface SemanticTarget { path: string; type: string | undefined }
export interface SemanticTargets { semantic: SemanticTarget[]; links?: Record<string, BrandLink>; interfaceTokens?: Record<string, InterfaceToken> }
export interface ImportProposal {
  $description: string;
  source: { file: string; format: string; modes: string[] };
  tokens: { path: string; type: unknown; value: unknown; mode?: string; resolved?: unknown }[];
  mapping: MappingEntry[];
  unmapped: UnmappedEntry[];
  skipped?: { count: number; reason: string };
}
interface Group { path: string; type: unknown; values: Record<string, unknown> }
interface RampStep { path: string; step: number; hex: string }
type Indexable = Record<string, unknown>;

export const FORMATS = ['dtcg', 'css'];
const isObj = (v: unknown): v is Indexable => v !== null && typeof v === 'object' && !Array.isArray(v);
// String() taken while the value is still unknown: the same coercion the untyped code did.
const show = (v: unknown): string => String(v);
const isIndexable = (v: unknown): v is Indexable => typeof v === 'object' && v !== null;
const readJsonFile = async <T = unknown,>(p: string): Promise<T> => parseJson<T>(await readFile(p, 'utf8'));

// ---------- colors and sizes ----------

const clamp = (x: number, a: number, b: number): number => Math.min(b, Math.max(a, x));
function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const k = (n: number): number => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number): number => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return rgbToHex({ r: f(0), g: f(8), b: f(4) });
}
const alphaHex = (hex: string, a: number | undefined): string => (a === undefined || a >= 1 ? hex : hex + Math.round(clamp(a, 0, 1) * 255).toString(16).padStart(2, '0').toUpperCase());
// String(): parseFloat coerces its argument the same way; a non-optional capture group is always a string.
const num = (s: string | undefined): number => parseFloat(String(s));
const alphaOf = (s: string | undefined): number | undefined => (s === undefined ? undefined : s.trim().endsWith('%') ? num(s) / 100 : num(s));

// Any common CSS color (hex, rgb[a], hsl[a], bare "h s% l%" triplets, oklch) -> #RRGGBB or #RRGGBBAA; null otherwise.
export function toHex(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const v = value.trim().toLowerCase();
  let m = /^#([0-9a-f]{3,8})$/.exec(v);
  if (m) {
    let h = m[1] ?? '';
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('');
    if (h.length !== 6 && h.length !== 8) return null;
    return '#' + (h.length === 8 && h.endsWith('ff') ? h.slice(0, 6) : h).toUpperCase();
  }
  m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(v);
  if (m) return alphaHex(rgbToHex({ r: num(m[1]) / 255, g: num(m[2]) / 255, b: num(m[3]) / 255 }), alphaOf(m[4]));
  m = /^(?:hsla?\()?\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%(?:\s*[,/]\s*([\d.]+%?))?\s*\)?$/.exec(v);
  if (m) return alphaHex(hslToHex(num(m[1]), num(m[2]), num(m[3])), alphaOf(m[4]));
  m = /^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?(?:\s*\/\s*([\d.]+%?))?\s*\)$/.exec(v);
  if (m) return alphaHex(oklchToHex({ L: (m[1] ?? '').endsWith('%') ? num(m[1]) / 100 : num(m[1]), C: num(m[2]), H: num(m[3]) }), alphaOf(m[4]));
  if (v === 'white') return '#FFFFFF';
  if (v === 'black') return '#000000';
  return null;
}

const oklch = (hex: string): Oklch => rgbToOklch(hexToRgb(hex.slice(0, 7)));
// Distance in OKLab (perceptual): 0 identical, ~0.02 hard to tell apart.
export function colorDistance(a: string, b: string): number {
  const x = oklch(a), y = oklch(b);
  const ax = x.C * Math.cos((x.H * Math.PI) / 180), bx = x.C * Math.sin((x.H * Math.PI) / 180);
  const ay = y.C * Math.cos((y.H * Math.PI) / 180), by = y.C * Math.sin((y.H * Math.PI) / 180);
  return Math.hypot(x.L - y.L, ax - ay, bx - by);
}

// "16px" | "1rem" | "16" (unitless) | 16 -> 16; null when not a length.
export function toPx(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return null;
  const m = /^\s*(-?\d*\.?\d+)(px|rem|em)?\s*$/.exec(value);
  if (!m) return null;
  return m[2] === 'rem' || m[2] === 'em' ? num(m[1]) * 16 : num(m[1]);
}

// ---------- parsing: everything becomes [{ path, type, value, mode? }] ----------

const TYPE: Record<string, string> = {
  color: 'color', dimension: 'dimension', spacing: 'dimension', sizing: 'dimension', borderRadius: 'dimension', borderWidth: 'dimension',
  fontSizes: 'dimension', fontSize: 'dimension', letterSpacing: 'dimension', paragraphSpacing: 'dimension',
  fontFamilies: 'fontFamily', fontFamily: 'fontFamily', fontWeights: 'fontWeight', fontWeight: 'fontWeight',
  lineHeights: 'number', lineHeight: 'number', number: 'number', opacity: 'number', duration: 'duration', cubicBezier: 'cubicBezier',
  boxShadow: 'shadow', shadow: 'shadow', typography: 'typography', other: 'other',
};
const isTokenNode = (n: unknown): n is Indexable => isObj(n) && ('$value' in n || ('value' in n && (!isObj(n.value) || 'type' in n)));

function flattenSet(doc: unknown, prefix: string[] = [], inherited?: string): { path: string; rawType: unknown; value: unknown }[] {
  const out: { path: string; rawType: unknown; value: unknown }[] = [];
  if (!isObj(doc)) return out;
  const t = doc.$type ?? doc.type ?? inherited;
  if (isTokenNode(doc)) return [{ path: prefix.join('.'), rawType: t, value: '$value' in doc ? doc.$value : doc.value }];
  for (const [k, v] of Object.entries(doc)) if (!k.startsWith('$') && isObj(v)) out.push(...flattenSet(v, [...prefix, k], typeof t === 'string' ? t : inherited));
  return out;
}

const modeName = (s: unknown): string => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const ENABLED: (string | undefined)[] = ['enabled', 'source'];

// A token-set document (Tokens Studio or plain DTCG) -> normalized tokens. Themes decide modes: a set enabled
// in only some themes belongs to those themes' modes; a set every theme enables (or no theme names) is mode-less.
export function parseSets(obj: TokenSetsDoc): ParsedImport {
  const themes = Array.isArray(obj.$themes) ? obj.$themes : [];
  const multi = Boolean(obj.$metadata?.tokenSetOrder || themes.length);
  const sets: [string, unknown][] = multi ? (obj.$metadata?.tokenSetOrder ?? Object.keys(obj).filter((k) => !k.startsWith('$'))).filter((s) => isObj(obj[s])).map((s): [string, unknown] => [s, obj[s]]) : [['', obj]];
  const enabled = (th: TokensStudioTheme, set: string): boolean => ENABLED.includes(th.selectedTokenSets?.[set]);
  const tokens: ImportToken[] = [];
  const skipped: ImportToken[] = [];
  for (const [set, doc] of sets) {
    const on = themes.filter((th) => enabled(th, set)).map((th) => modeName(th.name));
    let modes = on.length && on.length < themes.length ? on : [];
    if (!themes.length) { const m = /(^|[/._-])(light|dark)($|[/._-])/i.exec(set); if (m) modes = [(m[2] ?? '').toLowerCase()]; }
    for (const t of flattenSet(doc)) {
      const rec: ImportToken = { path: t.path, type: TYPE[String(t.rawType)] ?? t.rawType ?? null, value: t.value, ...(set ? { set } : {}) };
      if (/^components?(\/|$)/i.test(set)) { skipped.push(rec); continue; }
      if (modes.length) for (const m of modes) tokens.push({ ...rec, mode: m });
      else tokens.push(rec);
    }
  }
  return { tokens, skipped, modes: themes.map((th) => modeName(th.name)) };
}

// CSS custom properties: :root (and [data-theme=light], .light) vs .dark / [data-theme=dark]. A variable only :root
// defines is mode-less. Pure aliases (var(--x)) are kept as aliases.
export function parseCss(text: string): ParsedImport {
  const clean = text.replace(/\/\*[\s\S]*?\*\//g, '');
  const blocks: Partial<Record<'light' | 'dark', Map<string, string>>> = {};
  for (const m of clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const sel = (m[1] ?? '').trim();
    const mode = /\.dark\b|data-theme\s*=\s*["']?dark/i.test(sel) ? 'dark' : /:root|\.light\b|data-theme\s*=\s*["']?light|:host|@theme/i.test(sel) ? 'light' : null;
    if (!mode) continue;
    for (const d of (m[2] ?? '').matchAll(/(--[A-Za-z0-9_-]+)\s*:\s*([^;]+);?/g)) (blocks[mode] ??= new Map()).set((d[1] ?? '').slice(2), (d[2] ?? '').trim());
  }
  const light = blocks.light ?? new Map<string, string>();
  const dark = blocks.dark ?? new Map<string, string>();
  const tokens: ImportToken[] = [];
  const typeOf = (name: string, v: string): string | null => {
    if (/^var\(/.test(v)) return null;
    if (toHex(v)) return 'color';
    if (/font|family/.test(name) && /[a-z]/i.test(v)) return 'fontFamily';
    if (toPx(v) !== null && /\d(px|rem|em)$/.test(v.trim())) return 'dimension';
    if (/^\d+(\.\d+)?m?s$/.test(v)) return 'duration';
    if (/^-?\d*\.?\d+$/.test(v)) return 'number';
    return 'other';
  };
  const conv = (v: string): string => { const a = /^var\(\s*--([A-Za-z0-9_-]+)\s*\)$/.exec(v); return a ? `{${a[1]}}` : v; };
  for (const [name, v] of light) {
    const dv = dark.get(name);
    if (dv !== undefined) tokens.push({ path: name, type: typeOf(name, v), value: conv(v), mode: 'light' }, { path: name, type: typeOf(name, dv), value: conv(dv), mode: 'dark' });
    else tokens.push({ path: name, type: typeOf(name, v), value: conv(v) });
  }
  for (const [name, v] of dark) if (!light.has(name)) tokens.push({ path: name, type: typeOf(name, v), value: conv(v), mode: 'dark' });
  return { tokens, skipped: [], modes: dark.size ? ['light', 'dark'] : [] };
}

async function readSets(file: string): Promise<TokenSetsDoc> {
  if (!(await stat(file)).isDirectory()) return readJsonFile<TokenSetsDoc>(file);
  // A folder of sets (Tokens Studio multi-file): $themes.json, $metadata.json and one JSON file per set (folders are set paths).
  const obj: TokenSetsDoc = {};
  const walk = async (dir: string): Promise<void> => {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) await walk(p);
      else if (e.name.endsWith('.json')) {
        const key = relative(file, p).replace(/\.json$/, '');
        obj[key.startsWith('$') ? key : key] = await readJsonFile(p);
      }
    }
  };
  await walk(file);
  return obj;
}

export async function parseFile(file: string, from: string): Promise<ParsedImport> {
  if (!FORMATS.includes(from)) throw fail(`Unknown format "${from}".`, `Use --from ${FORMATS.join('|')}.`);
  if (from === 'css') return parseCss(await readFile(file, 'utf8'));
  return parseSets(await readSets(file));
}

// Resolves aliases inside the import (per mode, falling back to mode-less tokens).
export function resolveImport(tokens: ImportToken[]): ResolvedImportToken[] {
  const byPath = new Map<string, ImportToken[]>();
  for (const t of tokens) { let l = byPath.get(t.path); if (!l) byPath.set(t.path, (l = [])); l.push(t); }
  const find = (path: string, mode: string | undefined): ImportToken | undefined => { const l = byPath.get(path) ?? []; return l.find((x) => x.mode === mode) ?? l.find((x) => !x.mode) ?? l[0]; };
  const resolve = (t: ImportToken, seen: string[] = []): unknown => {
    const m = typeof t.value === 'string' ? ALIAS.exec(t.value.trim()) : null;
    if (!m) return t.value;
    const ref = m[1] ?? '';
    const target = find(ref, t.mode) ?? find(ref.replace(/\./g, '-'), t.mode);
    if (!target || seen.includes(target.path)) return null;
    return resolve({ ...target, mode: t.mode ?? target.mode }, [...seen, target.path]);
  };
  return tokens.map((t) => {
    const r = resolve(t);
    const out: ResolvedImportToken = { ...t, resolved: r };
    if (!out.type || out.type === 'other') { if (toHex(r)) out.type = 'color'; }
    return out;
  });
}

// ---------- mapping heuristics ----------

// Words with the same meaning in common systems, folded onto this system's role words.
export const SYNONYMS: Record<string, string> = {
  bg: 'background', background: 'background', backgrounds: 'background', canvas: 'background', page: 'background',
  fg: 'foreground', foreground: 'foreground', text: 'foreground', content: 'foreground', ink: 'foreground', on: 'foreground',
  border: 'border', borders: 'border', stroke: 'border', divider: 'border', line: 'border', outline: 'border',
  ring: 'ring', focus: 'ring',
  brand: 'primary', primary: 'primary', main: 'primary',
  danger: 'destructive', destructive: 'destructive', error: 'destructive', critical: 'destructive', negative: 'destructive',
  muted: 'muted', subtle: 'muted', subdued: 'muted', weak: 'muted',
  secondary: 'secondary', accent: 'accent', highlight: 'accent',
  card: 'card', surface: 'card', panel: 'card', popover: 'popover', overlay: 'popover', menu: 'popover', dropdown: 'popover',
  input: 'input', field: 'input', control: 'input',
  success: 'success', positive: 'success', warning: 'warning', caution: 'warning', info: 'info', informative: 'info',
};
const NOISE = new Set(['color', 'colors', 'colour', 'semantic', 'sys', 'theme', 'global', 'token', 'tokens', 'ref', 'alias', 'default', 'base', 'light', 'dark', 'mode', 'value', 'palette']);
const RAMP_STEP = /^(\d{2,3})$/;
const PRIMARY_RAMP = /^(brand|primary|main)$/;
const NEUTRAL_RAMP = /^(gray|grey|neutral|neutrals|slate|zinc|stone|mono|sand|base)$/;
const DANGER_RAMP = /^(red|danger|error|destructive|critical)$/;
const SIZE_TYPES: unknown[] = ['dimension', 'number', null, 'other'];

const words = (path: string): string[] => path.toLowerCase().split(/[.\-_/\s]+/).filter(Boolean);

// A color token's role words, folded through the synonyms (on-x and x-foreground mean the text on x).
export function roleSet(path: string): Set<string> {
  const w = words(path).filter((x) => !NOISE.has(x) && !RAMP_STEP.test(x));
  const roles = new Set(w.map((x) => SYNONYMS[x] ?? x));
  if (roles.has('background') && roles.size > 1) roles.delete('background'); // bg-muted is the muted surface
  return roles;
}

const jaccard = (a: Set<string>, b: Set<string>): number => { const i = [...a].filter((x) => b.has(x)).length; return i / (a.size + b.size - i || 1); };

function groupByPath(tokens: ResolvedImportToken[]): Group[] {
  const g = new Map<string, Group>();
  for (const t of tokens) {
    let group = g.get(t.path);
    if (!group) g.set(t.path, (group = { path: t.path, type: t.type, values: {} }));
    group.values[t.mode ?? 'base'] = t.resolved;
  }
  return [...g.values()];
}

const dimOk = (v: unknown): boolean => toPx(v) !== null;

// Pure: normalized import + this system's semantic tokens -> { mapping, unmapped }.
export function proposeMapping(imported: ResolvedImportToken[], { semantic, links = {}, interfaceTokens = {} }: SemanticTargets): { mapping: MappingEntry[]; unmapped: UnmappedEntry[] } {
  const groups = groupByPath(imported);
  const used = new Set<string>();
  const mapping: MappingEntry[] = [];
  const taken = new Set<string>();
  const targets = semantic.map((t) => ({ ...t, roles: t.type === 'color' ? roleSet(t.path.replace(/^color\./, '')) : null }));
  const add = (entry: Omit<MappingEntry, 'apply'>, paths: string[]): void => { mapping.push({ ...entry, apply: entry.confidence >= 0.6 }); for (const p of paths) used.add(p); };

  // 1. Exact path matches (a round trip of our own export, or a system already named like ours).
  for (const g of groups) {
    const t = targets.find((x) => x.path === g.path);
    if (!t || taken.has(t.path)) continue;
    taken.add(t.path);
    add({ from: g.path, to: t.path, confidence: 1, reason: 'same path', values: g.values, ...(links[t.path] ? { linked: true } : {}) }, [g.path]);
  }

  // 2. Color ramps (name.<step>): brand, neutral, danger and other accents in the foundation.
  const ramps = new Map<string, RampStep[]>();
  for (const g of groups.filter((x) => x.type === 'color' && !used.has(x.path))) {
    const w = g.path.split(/[.\-_/]/);
    const stepWord = w.at(-1) ?? '';
    if (!RAMP_STEP.test(stepWord) || w.length < 2) continue;
    const name = w.slice(0, -1).filter((x) => !NOISE.has(x.toLowerCase())).join('-').toLowerCase() || (w.at(-2) ?? '').toLowerCase();
    const hex = toHex(show(Object.values(g.values)[0] ?? ''));
    if (!hex) continue;
    let steps = ramps.get(name);
    if (!steps) ramps.set(name, (steps = []));
    steps.push({ path: g.path, step: Number(stepWord), hex: hex.slice(0, 7) });
  }
  // The imported "primary" color (semantic or plain), to find which ramp is the brand by color distance.
  const primaryGroup = groups.find((g) => g.type === 'color' && !RAMP_STEP.test(words(g.path).at(-1) ?? '') && [...roleSet(g.path)].join() === 'primary');
  const primaryHex = primaryGroup ? toHex(show(primaryGroup.values.light ?? primaryGroup.values.base ?? Object.values(primaryGroup.values)[0] ?? '')) : null;
  for (const [name, steps] of ramps) {
    steps.sort((a, b) => a.step - b.step);
    const mid = steps.reduce((a, s) => (Math.abs(s.step - 500) < Math.abs(a.step - 500) ? s : a));
    const chroma = Math.max(...steps.map((s) => oklch(s.hex).C));
    const near = primaryHex ? steps.map((s) => ({ ...s, d: colorDistance(s.hex, primaryHex.slice(0, 7)) })).sort((a, b) => a.d - b.d)[0] : null;
    const paths = steps.map((s) => s.path);
    if (PRIMARY_RAMP.test(name) || (near && near.d < 0.02 && chroma >= 0.03)) {
      const anchor = near && near.d < 0.02 ? near : mid;
      add({ from: `${name}.*`, to: 'foundation:color.primary', confidence: PRIMARY_RAMP.test(name) ? 0.9 : 0.8, reason: PRIMARY_RAMP.test(name) ? `ramp named ${name}; anchored at step ${anchor.step}` : `the imported primary is step ${anchor.step} of this ramp (color distance ${near?.d.toFixed(3)})`, value: anchor.hex }, paths);
    } else if (NEUTRAL_RAMP.test(name) || chroma < 0.03) {
      const o = oklch(mid.hex);
      add({ from: `${name}.*`, to: 'foundation:color.neutral', confidence: NEUTRAL_RAMP.test(name) ? 0.8 : 0.6, reason: `${NEUTRAL_RAMP.test(name) ? `ramp named ${name}` : 'low-chroma ramp'}; hue and chroma of step ${mid.step}`, value: { hue: Math.round(o.H), chroma: Math.round(o.C * 1000) / 1000 } }, paths);
    } else if (DANGER_RAMP.test(name)) {
      add({ from: `${name}.*`, to: 'foundation:color.accents.danger', confidence: 0.8, reason: `ramp named ${name}; step ${mid.step}`, value: mid.hex }, paths);
    } else if (/^[a-z][a-z0-9]*$/.test(name) && !SYNONYMS[name]) {
      add({ from: `${name}.*`, to: `foundation:color.accents.${name}`, confidence: 0.5, reason: `a ${name} ramp becomes an accent (map it to a role with color.roles if it means one); step ${mid.step}`, value: mid.hex }, paths);
    }
  }

  // 3. Semantic colors by name: role words folded through the synonyms, best score first, one source per target.
  const cands: { g: Group; t: SemanticTarget; score: number; why: string }[] = [];
  for (const g of groups.filter((x) => x.type === 'color' && !used.has(x.path))) {
    const r = roleSet(g.path);
    if (!r.size) continue;
    for (const t of targets.filter((x) => x.type === 'color' && !taken.has(x.path))) {
      if (!t.roles) continue;
      const j = jaccard(r, t.roles);
      if (j < 0.5) continue;
      const score = j === 1 ? 0.9 : 0.6 * j + 0.2;
      cands.push({ g, t, score: Math.round((score + (interfaceTokens[t.path] ? 0.02 : 0)) * 100) / 100, why: j === 1 ? `role words match (${[...r].join(' + ')})` : `role words overlap (${[...r].join(' + ')} vs ${[...t.roles].join(' + ')})` });
    }
  }
  cands.sort((a, b) => b.score - a.score || a.t.path.localeCompare(b.t.path));
  for (const c of cands) {
    if (used.has(c.g.path) || taken.has(c.t.path)) continue;
    taken.add(c.t.path);
    add({ from: c.g.path, to: c.t.path, confidence: Math.min(0.95, c.score), reason: c.why, values: c.g.values, ...(links[c.t.path] ? { linked: true } : {}) }, [c.g.path]);
  }
  // A primary that is not a ramp step still sets the brand (unless it is near-gray: keep the neutral primary).
  const primaryEntry = mapping.find((m) => m.to === 'color.primary');
  if (!mapping.some((m) => m.to === 'foundation:color.primary') && primaryEntry) {
    const hex = toHex(show(primaryEntry.values?.light ?? primaryEntry.values?.base ?? ''));
    if (hex && oklch(hex.slice(0, 7)).C >= 0.03) add({ from: primaryEntry.from, to: 'foundation:color.primary', confidence: 0.8, reason: 'the imported primary color (light) becomes the brand color; the ramp is generated around it', value: hex.slice(0, 7) }, []);
  }
  const destructiveEntry = mapping.find((m) => m.to === 'color.destructive');
  if (!mapping.some((m) => m.to === 'foundation:color.accents.danger') && destructiveEntry) {
    const hex = toHex(show(destructiveEntry.values?.light ?? destructiveEntry.values?.base ?? ''));
    if (hex) add({ from: destructiveEntry.from, to: 'foundation:color.accents.danger', confidence: 0.7, reason: 'the imported destructive color seeds the danger ramp', value: hex.slice(0, 7) }, []);
  }
  if (!mapping.some((m) => m.to === 'foundation:color.neutral')) {
    const grays = mapping.filter((m) => /^color\.(border|muted|secondary|input|accent)$/.test(m.to)).map((m) => toHex(show(m.values?.light ?? m.values?.base ?? ''))).filter((h): h is string => Boolean(h)).map((h) => oklch(h.slice(0, 7))).filter((o) => o.C < 0.06 && o.L > 0.2 && o.L < 0.98);
    if (grays.length >= 2) {
      const tinted = grays.filter((o) => o.C > 0.004);
      const hue = tinted.length ? (Math.atan2(tinted.reduce((s, o) => s + Math.sin((o.H * Math.PI) / 180), 0), tinted.reduce((s, o) => s + Math.cos((o.H * Math.PI) / 180), 0)) * 180) / Math.PI : 0;
      const chroma = tinted.length ? [...tinted.map((o) => o.C)].sort((a, b) => a - b)[Math.floor(tinted.length / 2)] ?? 0 : 0;
      add({ from: 'color.(border|muted|secondary|input|accent)', to: 'foundation:color.neutral', confidence: 0.55, reason: `neutral tint from ${grays.length} gray semantic colors`, value: { hue: Math.round((hue + 360) % 360), chroma: Math.round(chroma * 1000) / 1000 } }, []);
    }
  }

  // 4. Font families.
  for (const g of groups.filter((x) => !used.has(x.path) && (x.type === 'fontFamily' || /font.*(family|sans|mono|body)|^font(-sans|-mono)?$/i.test(x.path)))) {
    const raw = Object.values(g.values)[0];
    const head: unknown = Array.isArray(raw) ? raw[0] : show(raw ?? '').split(',')[0];
    // The untyped .trim() threw on a non-string first family (an empty array, say); kept as a TypeError.
    if (typeof head !== 'string') throw new TypeError(head === null || head === undefined ? `Cannot read properties of ${String(head)} (reading 'trim')` : 'head.trim is not a function');
    const fam = head.trim().replace(/^["']|["']$/g, '');
    if (!fam || /^var\(/.test(fam)) continue;
    const mono = /mono|code/i.test(g.path);
    if (mapping.some((m) => m.to === (mono ? 'foundation:typography.mono' : 'foundation:typography.family'))) continue;
    add({ from: g.path, to: mono ? 'foundation:typography.mono' : 'foundation:typography.family', confidence: 0.85, reason: `font family token (first family: ${fam})`, value: mono ? (Array.isArray(raw) ? raw.join(', ') : String(raw)) : fam }, [g.path]);
  }

  // 5. Sizes: radius (base from lg/md/default or the median), spacing (grid base by divisibility), font sizes (a custom scale).
  const dims = groups.filter((x) => !used.has(x.path) && SIZE_TYPES.includes(x.type) && dimOk(Object.values(x.values)[0]));
  // ?? 0: every group here passed dimOk, and a null length reads as 0 in the arithmetic below anyway.
  const px = (g: Group): number => toPx(Object.values(g.values)[0]) ?? 0;
  const radius = dims.filter((g) => /radius|rounded|corner/i.test(g.path) && px(g) > 0 && px(g) < 999);
  if (radius.length) {
    const named = ['lg', 'md', 'default', 'base', 'radius'].map((n) => radius.find((g) => words(g.path).at(-1) === n)).find(Boolean);
    const vals = radius.map(px).sort((a, b) => a - b);
    const base = named ? px(named) : vals[Math.floor(vals.length / 2)];
    add({ from: radius.length === 1 ? (radius[0]?.path ?? '') : radius.map((g) => g.path).join(', '), to: 'foundation:radius', confidence: radius.length === 1 || named ? 0.8 : 0.6, reason: `radius base ${base}px (${named ? `from ${named.path}` : radius.length === 1 ? 'the only radius' : 'median of the radius tokens'}); the scale is derived from it`, value: { custom: { base } } }, radius.map((g) => g.path));
  }
  const spacing = dims.filter((g) => /space|spacing|gap|padding|margin|inset|gutter/i.test(g.path) && !used.has(g.path));
  const svals = spacing.map(px).filter((v) => v > 0);
  if (svals.length >= 3) {
    const fit = (b: number): number => { const big = svals.filter((v) => v >= b); return big.length ? big.filter((v) => Math.abs(v / b - Math.round(v / b)) < 1e-6).length / big.length : 0; };
    const best = [10, 8, 5, 4, 2].map((b) => ({ b, f: fit(b), n: svals.filter((v) => v >= b).length })).find((x) => x.f >= 0.8 && x.n >= 3);
    if (best) add({ from: `${spacing.length} spacing tokens`, to: 'foundation:spacing', confidence: Math.round(best.f * 0.9 * 100) / 100, reason: `${Math.round(best.f * 100)}% of the spacing values (>= ${best.b}px) are multiples of ${best.b}px`, value: { preset: `grid-${best.b}` } }, spacing.map((g) => g.path));
  }
  const fontSizes = dims.filter((g) => /font.?size|text-(xs|sm|base|md|lg|\d?xl)$|fontsize/i.test(g.path) && !used.has(g.path));
  const fvals = [...new Set(fontSizes.map(px).filter((v) => v > 0))].sort((a, b) => a - b);
  if (fvals.length >= 8) {
    const start = Math.max(0, fvals.findIndex((v) => v >= 12) - 1);
    add({ from: `${fontSizes.length} font size tokens`, to: 'foundation:typography.scale', confidence: 0.5, reason: `a custom type scale from the imported sizes (${fvals.slice(start, start + 8).join(', ')} px)`, value: { custom: fvals.slice(start, start + 8) } }, fontSizes.map((g) => g.path));
  }

  // 6. Other exact-type semantic matches by name (dimensions, numbers) with the same role words.
  for (const g of groups.filter((x) => !used.has(x.path) && x.type !== 'color')) {
    const r = new Set(words(g.path).filter((x) => !NOISE.has(x)));
    const t = targets.filter((x) => x.type !== 'color' && !taken.has(x.path)).map((x) => ({ x, j: jaccard(r, new Set(words(x.path))) })).sort((a, b) => b.j - a.j)[0];
    if (t && t.j >= 0.75) { taken.add(t.x.path); add({ from: g.path, to: t.x.path, confidence: Math.round(0.7 * t.j * 100) / 100, reason: 'path words match', values: g.values, ...(links[t.x.path] ? { linked: true } : {}) }, [g.path]); }
  }

  const FOUNDATION_WORDS = /^(border|opacity|shadow|elevation|size|sizing|z|zindex|font|line|letter|weight|grid|breakpoint|duration|easing|motion)$/i;
  const reasonOf = (g: Group): string => (FOUNDATION_WORDS.test(words(g.path)[0] ?? '')
    ? `looks like a foundation value with no mapping rule; compare it with sketchbook tokens presets and set the closest preset or a custom value`
    : g.type === 'color' ? 'no semantic role or ramp matched; add it with sketchbook tokens add, or drop it' : 'no foundation or semantic home; add it with sketchbook tokens add, or drop it');
  const unmapped = groups.filter((g) => !used.has(g.path)).map((g) => ({ path: g.path, type: g.type, reason: reasonOf(g) }));
  return { mapping, unmapped };
}

export async function semanticTargets(root: string): Promise<Required<SemanticTargets>> {
  const brand = parseJson<BrandConfig>(await readFile(join(root, 'brand.config.json'), 'utf8'));
  const seen = new Map<string, SemanticTarget>();
  for (const name of ['base', ...modesOf(brand).map((m) => m.name)]) {
    let doc: DtcgDoc;
    try { doc = parseJson<DtcgDoc>(await readFile(join(root, `spec/tokens/semantic/${name}.tokens.json`), 'utf8')); } catch { continue; }
    for (const t of flatten(doc)) if (!seen.has(t.path)) seen.set(t.path, { path: t.path, type: t.type });
  }
  const read = async <T,>(p: string): Promise<T | null> => { try { return parseJson<T>(await readFile(join(root, p), 'utf8')); } catch { return null; } };
  return {
    semantic: [...seen.values()],
    links: (await read<{ links?: Record<string, BrandLink> }>('spec/tokens/brand-links.json'))?.links ?? {},
    interfaceTokens: (await read<{ tokens?: Record<string, InterfaceToken> }>('spec/tokens/interface.json'))?.tokens ?? {},
  };
}

export async function buildProposal(root: string, file: string, { from, name }: { from: string; name?: string }): Promise<{ name: string; path: string; proposal: ImportProposal }> {
  const parsed = await parseFile(file, from);
  const tokens = resolveImport(parsed.tokens);
  const { mapping, unmapped } = proposeMapping(tokens, await semanticTargets(root));
  const n = name ?? (basename(file, extname(file)) || 'import');
  if (/[\\/]/.test(n) || n.startsWith('.')) throw fail(`--name "${n}" must be a plain file name: the proposal is written to generated/import/<name>.proposal.json.`, 'Use a name like brand-2026 (no slashes, no leading dot).');
  return {
    name: n,
    path: `generated/import/${n}.proposal.json`,
    proposal: {
      $description: 'GENERATED by sketchbook tokens import. A proposal: review each mapping (set "apply": false to skip one, edit "to" or the values), then sketchbook tokens import apply <this file> --dry-run. Unmapped tokens are not applied; add the ones you need with sketchbook tokens add.',
      source: { file: relative(root, file) || file, format: from, modes: parsed.modes },
      tokens: tokens.map((t) => ({ path: t.path, type: t.type, value: t.value, ...(t.mode ? { mode: t.mode } : {}), ...(t.resolved !== t.value && t.resolved !== null ? { resolved: t.resolved } : {}) })),
      mapping,
      unmapped,
      ...(parsed.skipped.length ? { skipped: { count: parsed.skipped.length, reason: 'component token sets: component tokens come from each contract' } } : {}),
    },
  };
}

// ---------- apply ----------

function normalize(type: string | undefined, v: unknown): unknown {
  if (v === null || v === undefined) return null;
  if (type === 'color') return toHex(show(v));
  if (type === 'dimension') { const p = toPx(v); return p === null ? null : `${Math.round(p * 100) / 100}px`; }
  if (type === 'number' || type === 'fontWeight') return typeof v === 'number' ? v : Number.isFinite(Number(v)) ? Number(v) : null;
  if (type === 'duration') return typeof v === 'string' && /^\d+(\.\d+)?m?s$/.test(v) ? v : typeof v === 'number' ? `${v}ms` : null;
  return typeof v === 'string' ? v : null;
}

const nodeAt = (doc: unknown, path: string): unknown => path.split('.').reduce<unknown>((n, k) => (isObj(n) ? n[k] : undefined), doc);

// Where the untyped walk set a property on a non-object (brand.config.json holding a bare value), the same TypeError.
function indexable(v: unknown, k: string, op: 'read' | 'set'): Indexable {
  if (isIndexable(v)) return v;
  if (v === null || v === undefined) throw new TypeError(`Cannot ${op} properties of ${String(v)} (${op === 'read' ? 'reading' : 'setting'} '${k}')`);
  throw new TypeError(`Cannot create property '${k}' on ${typeof v} '${show(v)}'`);
}

export async function planImportApply(root: string, proposalFile: string, { only, minConfidence = 0.6 }: { only?: string; minConfidence?: number } = {}): Promise<TokenPlan<{ proposal: string; applied: number; skipped: number }>> {
  const p = await readJsonFile<Partial<ImportProposal>>(proposalFile);
  const mapping = p.mapping;
  if (!Array.isArray(mapping)) throw fail(`${proposalFile} is not an import proposal.`, 'Run sketchbook tokens import <file> --from <format> first.');
  const kind = only === 'mapped' ? 'semantic' : only;
  if (kind && !['semantic', 'foundation'].includes(kind)) throw fail(`--only ${only}`, 'Use --only semantic (alias: mapped) or --only foundation.');
  const entries = mapping.filter((e) => e.apply !== false && e.confidence >= minConfidence && (!kind || (kind === 'foundation') === e.to.startsWith('foundation:')));
  const brandText = await readFile(join(root, 'brand.config.json'), 'utf8');
  const brand = parseJson<BrandConfig>(brandText);
  const modes = modesOf(brand);
  const docs: Record<string, DtcgDoc> = {};
  for (const n of ['base', ...modes.map((m) => m.name)]) { try { docs[n] = parseJson<DtcgDoc>(await readFile(join(root, `spec/tokens/semantic/${n}.tokens.json`), 'utf8')); } catch { /* missing mode file: T3 reports */ } }
  const before = Object.fromEntries(Object.entries(docs).map(([k, v]) => [k, serialize(v)]));
  const summary: string[] = [];
  const warnings: string[] = [];
  for (const e of entries) {
    if (e.to.startsWith('foundation:')) {
      const key = e.to.slice(11);
      const set = (path: string, v: unknown): void => {
        const ks = path.split('.');
        let n: unknown = brand;
        for (const k of ks.slice(0, -1)) { const o = indexable(n, k, 'read'); const child = o[k]; n = o[k] = isObj(child) ? child : {}; }
        const last = ks.at(-1) ?? '';
        indexable(n, last, 'set')[last] = v;
      };
      if (key === 'color.primary' || key.startsWith('color.accents.') || key === 'typography.family' || key === 'typography.mono') set(key, e.value);
      else if (key === 'color.neutral') set('color.neutral', e.value);
      else if (key === 'radius' || key === 'spacing' || key === 'typography.scale') set(key, e.value);
      else { warnings.push(`${e.to}: no rule to apply this foundation entry; skipped.`); continue; }
      summary.push(`brand.config ${key} = ${JSON.stringify(e.value)} (${e.from})`);
      continue;
    }
    if (e.linked) { warnings.push(`${e.to} follows brand.config (brand-links.json); its imported value comes in through the foundation entries, not written directly.`); continue; }
    const vals = e.values ?? {};
    const names = Object.keys(vals);
    for (const [file, doc] of Object.entries(docs)) {
      const node = nodeAt(doc, e.to);
      if (!isObj(node) || !('$value' in node)) continue;
      const role = file === 'base' ? null : modes.find((m) => m.name === file)?.role;
      const raw = vals[file] ?? (role && vals[role]) ?? vals.base ?? (names.length === 1 ? Object.values(vals)[0] : vals.light);
      const type = flatten(doc).find((t) => t.path === e.to)?.type;
      const v = normalize(type, raw);
      if (v === null) { warnings.push(`${e.to} [${file}]: imported value ${JSON.stringify(raw)} is not a valid ${type}; kept the current value.`); continue; }
      if (JSON.stringify(node.$value) !== JSON.stringify(v)) { node.$value = v; summary.push(`${e.to} [${file}] = ${JSON.stringify(v)} (${e.from})`); }
    }
  }
  try { await validateBrand(root, brand); } catch (e) { throw fail(`The proposal would break brand.config.json: ${errorMessage(e)}`, 'Edit the foundation entries in the proposal (or set "apply": false), then apply again.'); }
  const files: Record<string, string> = {};
  if (serialize(brand) !== serialize(parseJson(brandText))) files['brand.config.json'] = serialize(brand);
  for (const [n, d] of Object.entries(docs)) if (serialize(d) !== before[n]) files[`spec/tokens/semantic/${n}.tokens.json`] = serialize(d);
  return {
    files, warnings,
    summary: summary.length ? summary : ['Nothing to apply (every entry is below the confidence threshold, marked "apply": false, or already equal).'],
    data: { proposal: relative(root, proposalFile), applied: entries.length, skipped: mapping.length - entries.length },
    decision: { title: `Import tokens from ${p.source?.file ?? 'a file'}`, decision: `Applied ${entries.length} mapping(s) from ${relative(root, proposalFile)} (${p.source?.format ?? 'unknown'} import) to brand.config.json and the semantic files with sketchbook tokens import apply; no interface token was removed.` },
  };
}
