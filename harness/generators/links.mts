// Semantic links: spec/tokens/brand-links.json declares which semantic tokens follow brand.config. Applied on every
// tokens:generate (and by init). A link the engine cannot apply (semantic token or foundation target missing) is
// reported, never skipped silently. Teams unlink a token by deleting its entry.
//   { "from": "color", "role": "primary", "part": "solid" | "foreground", "alsoOn": ["color.background"] }
//       per mode: the role's ramp step (anchor in light, anchor + darkOffset in dark), moved to the nearest step whose
//       readable foreground (white or neutral-950) meets the text contrast target; foreground = that readable color.
//       No step meets it: the preferred step is kept and reported as missing (T7 fails, G1 warns), never silently.
//   { "from": "color", "ramp": "neutral", "part": "text", "step": { "light": 500, "dark": 400 }, "alsoOn": [...] }
//       a text color on the listed backgrounds: per mode, the ramp step nearest the preferred one whose contrast on
//       every alsoOn background meets the brand's text target (so a stricter contrast preset darkens or lightens it).
//   { "from": "density" | "radius" | "motion" | "elevation" | "icons" | "z", "role": "<role>" }
//       the foundation token the resolved preset assigns to that role (see foundationTarget in standards/resolve.mjs).
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { wcagRatio } from '../lib/color.mjs';
import { parseJson } from '../lib/files.mjs';
import { flatten, ALIAS, type DtcgDoc } from '../lib/tokens.mjs';
import { foundationTarget, type ModeRole, type ResolvedBrand } from '../standards/resolve.mjs';

const LINKS_FILE = 'spec/tokens/brand-links.json';

export interface BrandLink {
  from: string;
  role?: string;
  ramp?: string;
  part?: 'solid' | 'foreground' | 'text';
  step?: Record<string, number>;
  alsoOn?: string[];
}
// Entries whose key starts with "$" are documentation and are skipped.
export type BrandLinks = Record<string, BrandLink>;
export type SemanticDocs = Record<string, DtcgDoc>;
export type FoundationMap = Map<string, unknown>;
export interface LinkContext { resolved: ResolvedBrand; anchors: Record<string, number>; fmap: FoundationMap }
export interface MissingLink { file: string; token: string; msg: string; fix: string }
export interface LinkResult { changed: string[]; missing: MissingLink[] }
type LinkValue = { error: string } | { value: string; miss?: string };

const readJson = async <T,>(p: string): Promise<T | null> => { try { return parseJson<T>(await readFile(p, 'utf8')); } catch { return null; } };
const serialize = (doc: unknown): string => JSON.stringify(doc, null, 2) + '\n';

const plain = (v: unknown): string => (typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v));

const isRecord =(v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

const nodeAt = (doc: unknown, path: string): { $value: unknown } | null => {
  let n: unknown = doc;
  for (const k of path.split('.')) n = isRecord(n) ? n[k] : undefined;
  return n && typeof n === 'object' && '$value' in n ? n : null;
};

export function foundationMap(docs: Record<string, unknown>): FoundationMap {
  const m: FoundationMap = new Map();
  for (const doc of Object.values(docs)) for (const t of flatten(doc)) m.set(t.path, t.value);
  return m;
}

// Preset data is JSON typed loosely; every consumer below needs numbers.
const stepsOf = (r: ResolvedBrand): number[] => {
  const s = r.color.ramp.steps;
  if (!Array.isArray(s) || !s.every((x): x is number => typeof x === 'number')) throw new TypeError('color.ramp.steps is not an array of numbers');
  return s;
};

const hexResolver = (fmap: FoundationMap) => (path: string): string | undefined => {
  const v = fmap.get(path);
  const target = typeof v === 'string' ? ALIAS.exec(v)?.[1] : undefined;
  const resolved = target !== undefined ? fmap.get(target) : v;
  return typeof resolved === 'string' ? resolved : undefined;
};
const needHex = (v: string | undefined): string => {
  if (v === undefined) throw new TypeError('Cannot read properties of undefined (reading \'replace\')');
  return v;
};

// The alsoOn backgrounds of a mode as hex: an alias into the foundation, or a literal color (an imported value).
const backgrounds = (link: BrandLink, modeDoc: unknown, hex: (path: string) => string | undefined): string[] => (link.alsoOn ?? []).map((p) => {
  const v = nodeAt(modeDoc, p)?.$value;
  if (typeof v !== 'string') return null;
  const target = ALIAS.exec(v)?.[1];
  return target !== undefined ? hex(target) : /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(v) ? v : null;
}).filter((x): x is string => typeof x === 'string');

// Nearest passing step; ties go darker in light mode and lighter in dark mode.
const nearest = (steps: number[], pref: number, modeRole: ModeRole, passes: (index: number) => unknown): number | undefined => steps.map((_, j) => j)
  .sort((a, b) => Math.abs(a - pref) - Math.abs(b - pref) || (modeRole === 'dark' ? a - b : b - a))
  .find(passes);

function textValue(link: BrandLink, modeRole: ModeRole, modeDoc: unknown, ctx: LinkContext): LinkValue {
  const { resolved: r, fmap } = ctx;
  const steps = stepsOf(r);
  const want = link.step?.[modeRole];
  const ramp = link.ramp;
  if (!ramp || want === undefined) return { error: `a text link needs "ramp" and "step": { "${modeRole}": <step> }` };
  if (!fmap.has(`color.${ramp}.${steps[0]}`)) return { error: `ramp color.${ramp} is not in the foundation` };
  const hex = hexResolver(fmap);
  const need = Number(r.contrast.targets.text);
  const against = backgrounds(link, modeDoc, hex);
  const pref = steps.reduce((a, s, i) => (Math.abs(s - want) < Math.abs((steps[a] ?? Number.NaN) - want) ? i : a), 0);
  const j = nearest(steps, pref, modeRole, (x) => against.every((bg) => wcagRatio(needHex(hex(`color.${ramp}.${steps[x]}`)), bg) >= need));
  // No step meets the target: keep the preferred step, but say so (a silent fallback would ship unreadable text).
  if (j === undefined) return { value: `{color.${ramp}.${steps[pref]}}`, miss: `no step of color.${ramp} reaches ${need}:1 on ${(link.alsoOn ?? []).join(', ')} in ${modeRole} mode; kept ${steps[pref]}` };
  return { value: `{color.${ramp}.${steps[j]}}` };
}

function colorValue(link: BrandLink, modeRole: ModeRole, modeDoc: unknown, ctx: LinkContext): LinkValue {
  if (link.part === 'text') return textValue(link, modeRole, modeDoc, ctx);
  const { resolved: r, anchors, fmap } = ctx;
  const role = r.color.roles[String(link.role)];
  if (!role) return { error: `unknown color role "${link.role}" (known: ${Object.keys(r.color.roles).join(', ')})` };
  if (link.role === 'primary' && r.color.primary === 'neutral') {
    const n = role.neutral && isRecord(role.neutral) ? role.neutral[modeRole] : undefined;
    if (!isRecord(n)) throw new TypeError(`Cannot read properties of undefined (reading '${link.part === 'foreground' ? 'foreground' : 'solid'}')`);
    return { value: `{color.neutral.${plain(link.part === 'foreground' ? n.foreground : n.solid)}}` };
  }
  const steps = stepsOf(r);
  const ramp = plain(role.ramp);
  const anchor = anchors[ramp];
  if (anchor === undefined || !fmap.has(`color.${ramp}.${anchor}`)) return { error: `ramp color.${ramp} for role ${link.role} is not in the foundation (add it to color.accents)` };
  const hex = hexResolver(fmap);
  const readable = (bg: string): string => (wcagRatio('#FFFFFF', needHex(hex(bg))) >= wcagRatio(needHex(hex('color.neutral.950')), needHex(hex(bg))) ? 'color.white' : 'color.neutral.950');
  const need = Number(r.contrast.targets.text);
  const against = backgrounds(link, modeDoc, hex);
  const passes = (bg: string): boolean => wcagRatio(needHex(hex(readable(bg))), needHex(hex(bg))) >= need && against.every((a) => wcagRatio(needHex(hex(bg)), a) >= need);
  const i = steps.indexOf(anchor);
  const pref = modeRole === 'dark' ? Math.max(0, i + Number(role.darkOffset)) : i;
  const found = nearest(steps, pref, modeRole, (x) => hex(`color.${ramp}.${steps[x]}`) && passes(`color.${ramp}.${steps[x]}`));
  const j = found ?? pref;
  const solid = `color.${ramp}.${steps[j]}`;
  const value = `{${link.part === 'foreground' ? readable(solid) : solid}}`;
  // No step meets the target: keep the preferred step, but say so (a silent fallback would ship unreadable text).
  if (found === undefined) return { value, miss: `no step of color.${ramp} reaches ${need}:1 (with its readable foreground${against.length ? ` and on ${(link.alsoOn ?? []).join(', ')}` : ''}) in ${modeRole} mode; kept ${steps[j]}` };
  return { value };
}

// Pure: applies the links to the semantic documents in place. Returns what changed and what could not be applied.
export function computeLinks({ links, semantic, resolved, anchors, fmap }: { links?: BrandLinks | null; semantic: SemanticDocs; resolved: ResolvedBrand; anchors: Record<string, number>; fmap: FoundationMap }): LinkResult {
  const ctx: LinkContext = { resolved, anchors, fmap };
  const changed: string[] = [];
  const missing: MissingLink[] = [];
  const report = (token: string, msg: string, fix: string): void => { missing.push({ file: LINKS_FILE, token, msg: `${token}: ${msg}`, fix }); };
  const modes = new Map(resolved.modes.map((m): [string, ModeRole] => [m.name, m.role]));
  for (const [path, link] of Object.entries(links ?? {})) {
    if (path.startsWith('$')) continue;
    const files = link.from === 'color' ? [...modes.keys()] : ['base', ...modes.keys()];
    const targets = files.flatMap((file) => {
      const doc = semantic[file];
      const node = doc && nodeAt(doc, path);
      return doc && node ? [{ file, doc, node }] : [];
    });
    if (!targets.length) { report(path, 'semantic token not found in spec/tokens/semantic', `Add ${path} to the semantic files, or remove its link from ${LINKS_FILE}.`); continue; }
    for (const { file, doc, node } of targets) {
      let value: string;
      if (link.from === 'color') {
        const modeRole = modes.get(file);
        if (!modeRole) throw new TypeError(`unknown mode "${file}"`);
        const r = colorValue(link, modeRole, doc, ctx);
        if ('error' in r) { report(path, r.error, 'Fix brand.config.json or the link.'); break; }
        if (r.miss) report(path, r.miss, `Pick a ${link.role ? `color.roles.${link.role} accent` : `ramp`} with more lightness range, change the backgrounds in alsoOn, or delete the link in ${LINKS_FILE} to own ${path} by hand.`);
        value = r.value;
      } else {
        if (link.role === undefined) throw new TypeError("Cannot read properties of undefined (reading 'split')");
        const target = foundationTarget(resolved, link.from, link.role);
        if (!target) { report(path, `no ${link.from} role "${link.role}" in the resolved brand.config`, `Use a role the ${link.from} preset defines, or remove the link.`); break; }
        if (!fmap.has(target)) { report(path, `foundation token ${target} does not exist`, `Choose ${link.from} values that exist in the foundation, or remove the link.`); break; }
        value = `{${target}}`;
      }
      if (node.$value !== value) { node.$value = value; changed.push(`${file}: ${path} -> ${value}`); }
    }
  }
  return { changed, missing };
}

export async function loadSemantic(root: string, resolved: Pick<ResolvedBrand, 'modes'>): Promise<SemanticDocs> {
  const semantic: SemanticDocs = {};
  for (const name of ['base', ...resolved.modes.map((m) => m.name)]) {
    const doc = await readJson<DtcgDoc>(join(root, `spec/tokens/semantic/${name}.tokens.json`));
    if (doc) semantic[name] = doc;
  }
  return semantic;
}

export async function applyLinks(root: string, { resolved, anchors, docs }: { resolved: ResolvedBrand; anchors: Record<string, number>; docs: Record<string, unknown> }): Promise<LinkResult> {
  const links = (await readJson<{ links?: BrandLinks }>(join(root, LINKS_FILE)))?.links;
  if (!links) return { changed: [], missing: [] };
  const semantic = await loadSemantic(root, resolved);
  const before = Object.fromEntries(Object.entries(semantic).map(([k, v]) => [k, serialize(v)]));
  const result = computeLinks({ links, semantic, resolved, anchors, fmap: foundationMap(docs) });
  for (const [name, doc] of Object.entries(semantic)) {
    if (serialize(doc) !== before[name]) await writeFile(join(root, `spec/tokens/semantic/${name}.tokens.json`), serialize(doc));
  }
  return result;
}
