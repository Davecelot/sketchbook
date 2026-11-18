// Tokens for the design file: spec -> token sets + theme axes (Mode, Shape, Density), tool-neutral.
// A design adapter maps sets and themes onto its own model (Figma: collections and modes).
import { FAMILY_KEYS, modeNames, presetsOf } from '../../standards/resolve.mjs';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ALIAS, loadAll, tokensForMode, resolve, type FlatToken, type ResolveFailure, type Resolved, type Token, type TokenSet } from '../tokens.mjs';
import { brandTokenSets, type BrandTokenSet } from '../../commands/brand.mjs';
import { loadDesignDocs, type DesignDocsSpec } from '../design-docs.mjs';
import { parseJson, readJsonSync } from '../files.mjs';
import type { BrandConfig } from '../../../generated/types/brand-config.js';
import type { BrandLinks } from '../../generators/links.mjs';

export type DesignType = 'color' | 'fontFamilies' | 'fontWeights' | 'shadow' | 'typography' | 'opacity' | 'number' | 'duration' | 'cubicBezier' | 'letterSpacing' | 'fontSizes' | 'borderRadius' | 'borderWidth' | 'spacing' | 'sizing' | 'dimension';
export interface ShadowLayer { offsetX: string; offsetY: string; blur: string; spread: string; color: unknown; inset: false }
export type DesignValue = string | ShadowLayer[] | Record<string, unknown>;
export interface DesignToken { type: DesignType; name: string; value: DesignValue }
export interface DesignSet { name: string; tokens: DesignToken[] }
export interface DesignTheme { group: string; name: string; active: boolean; sets: string[] }
export interface SkippedToken { token: string; type: string | undefined; reason: string }
export interface TokenPayload { sets: DesignSet[]; themes: DesignTheme[]; order: string[]; skipped: SkippedToken[]; hash: string }

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
export const resolvedValue = (r: Resolved | ResolveFailure): unknown => (r.error ? undefined : r.value);
// A brand's flat tokens carry their set's file, layer and mode, as loadAll's tokens do, so one resolver serves both.
const asTokenSets = (sets: BrandTokenSet[]): TokenSet[] => sets.map((s) => ({ ...s, tokens: s.tokens.map((t): Token => ({ ...t, file: s.file, layer: s.layer, mode: s.mode })) }));

// DTCG $type -> design token kind (Tokens Studio names where one exists). Every kind reaches the design file; duration,
// easing and em letter spacing have nothing to bind there but stay visible (values and code syntax).
export function designType(token: Pick<FlatToken, 'type' | 'path'>, resolvedType: string | undefined): DesignType | null {
  const t = token.type ?? resolvedType;
  const p = token.path;
  if (t === 'color') return 'color';
  if (t === 'fontFamily') return 'fontFamilies';
  if (t === 'fontWeight') return 'fontWeights';
  if (t === 'shadow') return 'shadow';
  if (t === 'typography') return 'typography';
  if (t === 'number') return /(^|\.)opacity(\.|$)|-opacity$/.test(p) ? 'opacity' : 'number';
  if (t === 'duration') return 'duration';
  if (t === 'cubicBezier') return 'cubicBezier';
  if (t === 'dimension' && /letter-spacing/.test(p)) return 'letterSpacing'; // em; the text styles take it in px
  if (t === 'dimension') {
    if (/(^|\.)font\.size|font-size/.test(p)) return 'fontSizes';
    if (/radius/.test(p)) return 'borderRadius';
    if (/border\.width|border-width|ring\.width|focus-ring\.width/.test(p)) return 'borderWidth';
    if (/(^|\.)(space|padding|gap|inset)|padding|gap|offset/.test(p)) return 'spacing';
    if (/(^|\.)size|height|width|icon-size/.test(p)) return 'sizing';
    return 'dimension';
  }
  return null;
}

// Design values: px dimensions as bare numbers, aliases unchanged, shadows as a list of layers.
export function designValue(value: unknown, type: DesignType): DesignValue {
  if (typeof value === 'string' && ALIAS.test(value)) return value;
  if (type === 'shadow') {
    const list: unknown[] = Array.isArray(value) ? value : [value];
    const num = (x: unknown) => String(parseFloat(String(x)));
    return list.map((s): ShadowLayer => { const o = isObject(s) ? s : {}; return { offsetX: num(o.offsetX), offsetY: num(o.offsetY), blur: num(o.blur), spread: num(o.spread), color: o.color, inset: false }; });
  }
  if (type === 'typography' && isObject(value)) {
    // DTCG typography composite -> one object (lineHeight is a ratio; letterSpacing in px).
    const v = (x: unknown) => (x === undefined ? undefined : designValue(x, 'dimension'));
    return Object.fromEntries(Object.entries({
      fontFamilies: Array.isArray(value.fontFamily) ? value.fontFamily.join(', ') : value.fontFamily,
      fontSizes: v(value.fontSize), fontWeight: v(value.fontWeight), lineHeight: v(value.lineHeight), letterSpacing: v(value.letterSpacing),
      textCase: value.textCase ?? 'none', textDecoration: value.textDecoration ?? 'none',
    }).filter(([, x]) => x !== undefined));
  }
  if (type === 'cubicBezier' && Array.isArray(value)) return `cubic-bezier(${value.join(', ')})`;
  if (typeof value === 'string' && /^-?\d*\.?\d+(px|ms|em)$/.test(value)) return String(parseFloat(value));
  return String(value);
}

// Typography composites (SB-0051): one typography composite per semantic text role (every
// font.size.<role> in the semantic layer), named text-style.<role>, so a text can take a whole style,
// and its underlined twin text-style.<role>-underline (SB-0084).
// Size, weight and line height reference the role's tokens; letter spacing is em in the spec, so it
// is converted to px for the role's size (design tools take letter spacing in px).
export const TYPE_STYLE_SET = 'semantic/typography';
export function typographyComposites(all: { sets: TokenSet[] }, map: Map<string, Token>): DesignToken[] {
  const has = (p: string | null): p is string => p !== null && map.has(p);
  const px = (p: string) => { const v = resolvedValue(resolve(map, p)); return typeof v === 'string' && /px$/.test(v) ? parseFloat(v) : typeof v === 'number' ? v : null; };
  const pick = (...paths: (string | null)[]) => paths.find(has);
  const round = (n: number, d: number) => String(Math.round(n * 10 ** d) / 10 ** d);
  const roles = all.sets.filter((s) => s.layer === 'semantic').flatMap((s) => s.tokens).map((t) => /^font\.size\.(.+)$/.exec(t.path)?.[1]).filter((r): r is string => Boolean(r));
  const out: DesignToken[] = [];
  for (const role of [...new Set(roles)]) {
    const kind = role.startsWith('heading') ? 'heading' : 'body';
    const size = px(`font.size.${role}`);
    if (size === null) continue;
    const family = pick(role === 'code' ? 'font.family.code' : null, 'font.family.body', 'font.family.sans');
    const weight = pick(`font.weight.${role}`, `font.weight.${kind}`, 'font.weight.body');
    const lhPath = pick(`font.line-height.${role}`, `font.line-height.${kind}`, 'font.line-height.body');
    let lineHeight = '1.5';
    if (lhPath) {
      const r = resolve(map, lhPath);
      const abs = px(lhPath);
      if (!r.error && r.type === 'number' && typeof r.value === 'number') lineHeight = `{${lhPath}}`;
      else if (abs !== null) lineHeight = round(abs / size, 4); // an absolute line height becomes a ratio
    }
    const lsPath = pick(`font.letter-spacing.${role}`, `font.letter-spacing.${kind}`);
    const em = lsPath ? parseFloat(String(resolvedValue(resolve(map, lsPath)))) : 0;
    const value = { fontFamilies: family ? `{${family}}` : 'sans-serif', fontSizes: `{font.size.${role}}`, ...(weight ? { fontWeight: `{${weight}}` } : {}), lineHeight, letterSpacing: round(Number.isFinite(em) ? em * size : 0, 2), textCase: 'none', textDecoration: 'none' };
    out.push({ type: 'typography', name: `text-style.${role}`, value });
    out.push({ type: 'typography', name: `text-style.${role}-underline`, value: { ...value, textDecoration: 'underline' } });
  }
  return out;
}

// The semantic tokens a catalog family owns (brand-links.json: links whose source is that family), valued for a brand
// by the same engine the code build uses, as concrete design values.
export function ownedTokens(root: string, brand: BrandConfig, family: string, mode: string | null): DesignToken[] {
  const links = readJsonSync<{ links?: BrandLinks }>(join(root, 'spec/tokens/brand-links.json'), {})?.links ?? {};
  const map = tokensForMode({ sets: asTokenSets(brandTokenSets(root, brand).sets) }, mode);
  const out: DesignToken[] = [];
  for (const [path, link] of Object.entries(links)) {
    if (path.startsWith('$') || link.from !== family) continue;
    const t = map.get(path);
    const r = resolve(map, path);
    const type = t && !r.error ? designType(t, r.type) : null;
    if (type && !r.error) out.push({ type, name: path, value: designValue(r.value, type) });
  }
  return out;
}

// The foundation tokens of a brand as design values (path -> { type, value }), in one mode.
function foundationValues(root: string, brand: BrandConfig, mode: string | null): Map<string, Omit<DesignToken, 'name'>> {
  const sets = asTokenSets(brandTokenSets(root, brand).sets);
  const map = tokensForMode({ sets }, mode);
  const out = new Map<string, Omit<DesignToken, 'name'>>();
  for (const s of sets.filter((x) => x.layer === 'foundation')) {
    for (const t of s.tokens) {
      const r = resolve(map, t.path);
      const type = r.error ? null : designType(t, r.type);
      if (type && !r.error) out.set(t.path, { type, value: designValue(r.value, type) });
    }
  }
  return out;
}

// Theme axes besides Mode: spec/design-docs.json themeAxes ("from": "standards.<family>"). One theme per catalog preset,
// holding what its family owns: the linked semantic tokens (brand-links.json) and the foundation tokens its presets
// change (found by comparing the presets, never listed). The preset equal to the brand's own values is the active one.
export function axisThemes(root: string, brand: BrandConfig): { sets: DesignSet[]; themes: DesignTheme[] } {
  const mode = modeNames(brand)[0] ?? null;
  const sets: DesignSet[] = [];
  const themes: DesignTheme[] = [];
  for (const axis of loadDesignDocs<DesignDocsSpec>(root)?.themeAxes ?? []) {
    const family = /^standards\.(.+)$/.exec(axis.from ?? '')?.[1];
    if (!family) continue;
    const presets = presetsOf(family);
    const withPreset = (id: string): BrandConfig => ({ ...brand, [String(FAMILY_KEYS[family])]: id });
    const found = presets.map((p) => foundationValues(root, withPreset(p.id), mode));
    const first = found[0] ?? new Map<string, Omit<DesignToken, 'name'>>();
    const varying = [...first.keys()].filter((path) => found.some((m) => JSON.stringify(m.get(path)) !== JSON.stringify(first.get(path))));
    const build = (b: BrandConfig, f: Map<string, Omit<DesignToken, 'name'>>): DesignToken[] => [...ownedTokens(root, b, family, mode), ...varying.flatMap((path) => { const v = f.get(path); return v ? [{ ...v, name: path }] : []; })];
    const own = JSON.stringify(build(brand, foundationValues(root, brand, mode)));
    presets.forEach((preset, i) => {
      const tokens = build(withPreset(preset.id), found[i] ?? new Map<string, Omit<DesignToken, 'name'>>());
      const name = `theme/${axis.name.toLowerCase()}/${preset.id}`;
      sets.push({ name, tokens });
      themes.push({ group: axis.name, name: preset.label ?? preset.id, sets: [name], active: JSON.stringify(tokens) === own });
    });
  }
  return { sets, themes };
}

// The spec's token map for one theme combination: the brand with each axis theme's preset applied (Mode picks the mode).
export function comboMap(root: string, all: { sets: TokenSet[] }, brand: BrandConfig, themes: Pick<DesignTheme, 'group' | 'name'>[], mode: string): Map<string, Token> {
  const axes = loadDesignDocs<DesignDocsSpec>(root)?.themeAxes ?? [];
  let b = brand;
  for (const t of themes) {
    const family = /^standards\.(.+)$/.exec(axes.find((a) => a.name === t.group)?.from ?? '')?.[1];
    if (family) {
      const preset = presetsOf(family).find((p) => (p.label ?? p.id) === t.name);
      if (!preset) throw new Error(`No ${family} preset is labelled "${t.name}".`);
      b = { ...b, [String(FAMILY_KEYS[family])]: preset.id };
    }
  }
  if (b === brand) return tokensForMode(all, mode);
  return tokensForMode({ sets: [...asTokenSets(brandTokenSets(root, b).sets), ...all.sets.filter((s) => s.layer === 'component')] }, mode);
}

const setName = (set: TokenSet): string | null => {
  if (set.layer === 'component') return null; // split per component below
  return set.file.replace('spec/tokens/', '').replace('.tokens.json', '');
};

export async function tokenPayload(root: string): Promise<TokenPayload> {
  const all = await loadAll(root);
  const modes = modeNames(parseJson<BrandConfig>(await readFile(join(root, 'brand.config.json'), 'utf8'))); // brand order: first mode is the default
  const lightMap = tokensForMode(all, modes[0] ?? null);
  const sets: DesignSet[] = [];
  const skipped: SkippedToken[] = [];
  const push = (name: string | null, tokens: DesignToken[]) => { if (tokens.length) sets.push({ name: String(name), tokens }); };
  for (const set of all.sets) {
    if (set.layer === 'component') {
      const byComponent = new Map<string, Token[]>();
      for (const t of set.tokens) {
        const c = t.path.split('.')[0] ?? '';
        let list = byComponent.get(c);
        if (!list) byComponent.set(c, (list = []));
        list.push(t);
      }
      for (const [c, toks] of [...byComponent].sort()) push(`component/${c}`, convert(toks));
    } else push(setName(set), convert(set.tokens));
  }
  function convert(tokens: Token[]): DesignToken[] {
    const out: DesignToken[] = [];
    for (const t of tokens) {
      const r = resolve(lightMap, t.path);
      const rType = r.error ? undefined : r.type;
      const type = designType(t, rType);
      if (!type) { skipped.push({ token: t.path, type: t.type ?? rType, reason: 'no design token kind (kept in the repo)' }); continue; }
      out.push({ type, name: t.path, value: designValue(t.value, type) });
    }
    return out;
  }
  push(TYPE_STYLE_SET, typographyComposites(all, lightMap));
  const base = sets.filter((s) => !s.name.startsWith('semantic/') || s.name === 'semantic/base' || s.name === TYPE_STYLE_SET).map((s) => s.name);
  const themes: DesignTheme[] = modes.map((m, i) => ({ group: 'Mode', name: (m[0] ?? '').toUpperCase() + m.slice(1), active: i === 0, sets: [...base.filter((n) => !n.startsWith('component/')), `semantic/${m}`, ...base.filter((n) => n.startsWith('component/'))] }));
  const axes = axisThemes(root, parseJson<BrandConfig>(await readFile(join(root, 'brand.config.json'), 'utf8')));
  sets.push(...axes.sets); // last: a theme set overrides the semantic and component sets before it
  themes.push(...axes.themes);
  const order = [...sets.map((s) => s.name)];
  const hash = createHash('sha256').update(JSON.stringify({ sets, themes })).digest('hex').slice(0, 16);
  return { sets, themes, order, skipped, hash };
}
