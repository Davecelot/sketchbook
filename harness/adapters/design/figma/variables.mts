// Figma design adapter, variables: the token payload (harness/lib/design/tokens.mjs) -> collections, modes, variables,
// text styles and effect styles, plus the use_figma scripts that upsert them and read them back. Rules: docs/design-docs/tool-mapping.md (Figma).
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ALIAS } from '../../../lib/tokens.mjs';
import { cssVarName } from '../../../lib/css.mjs';
import { tokenPayload } from '../../../lib/design/tokens.mjs';
import { comboList } from '../../../lib/design/verify.mjs';
import type { CompareResult, Mismatch } from '../../../lib/design/verify.mjs';
import type { DesignToken, DesignType, DesignValue, ShadowLayer, SkippedToken, TokenPayload } from '../../../lib/design/tokens.mjs';
import { parseJson, show } from '../../../lib/files.mjs';
import type { HarnessConfigJson } from '../../../../generated/types/harness-config.js';
import { digest, norm } from './verify-runtime.mjs';

export type VariableType = 'COLOR' | 'STRING' | 'FLOAT';
export interface Rgba { r: number; g: number; b: number; a: number }
export interface Place { collection: string; name: string }
export interface AliasValue { alias: Place | undefined }
export type VariableValue = Rgba | string | number | AliasValue;
export interface ModelVariable { token: string; name: string; type: VariableType; scopes: string[]; code: string; values: Record<string, VariableValue>; percent?: boolean }
export interface ModelCollection { name: string; axis: boolean; modes: string[]; hidden: boolean; variables: ModelVariable[] }
export interface ShadowEffect { type: 'DROP_SHADOW'; color: Rgba; offset: { x: number; y: number }; radius: number; spread: number; visible: true; blendMode: 'NORMAL' }
export interface TextStyle { token: string; name: string; family: string; weight: number; decoration: 'UNDERLINE' | 'NONE'; bind: Record<string, string> }
export interface EffectStyle { token: string; name: string; layers: { effect: ShadowEffect; bind: Record<string, string> }[] }
export interface ModelCombo { key: string; modes: Record<string, string> }
export interface FigmaModel { hash: string; prefix: string; collections: ModelCollection[]; styles: { text: TextStyle[]; effect: EffectStyle[] }; combos: ModelCombo[]; skipped: SkippedToken[] }
export type Snapshot = Record<string, { modes: string[]; vars: Record<string, string> }>;
export type PartValue = VariableValue | [number, string];
export type PartVariable = [name: string, type: VariableType, scope: number, values: Record<string, PartValue>, ...code: string[]];
export interface VariablePart { file: string; collection: string; modes: string[]; hidden: boolean; prefix: string; scopes: string[][]; cols: string[]; variables: PartVariable[] }
// What verify.js returns; the CLI checks only that combos is there.
export type VerifyReadback = {
  file?: string; hash?: string; readAt?: string; counts?: Record<string, number>; names?: Record<string, string>; combos?: Record<string, string>;
  missingModes?: string[]; extraModes?: string[]; detail?: { combo: string; values: string[] };
};

const aliasOf = (x: VariableValue | null | undefined): Place | undefined => (typeof x === 'object' && x !== null && 'alias' in x ? x.alias : undefined);
const fieldsOf = (v: DesignValue): Record<string, unknown> => (typeof v === 'object' && !Array.isArray(v) ? v : {});
const layersOf = (v: unknown, token: string): ShadowLayer[] => {
  if (!Array.isArray(v) || !v.every((l): l is ShadowLayer => typeof l === 'object' && l !== null)) throw new TypeError(`${token}: a shadow resolves to a list of layers.`);
  return v;
};

const TYPE: Partial<Record<DesignType, VariableType>> = { color: 'COLOR', fontFamilies: 'STRING', cubicBezier: 'STRING' };
const STYLE_KINDS = new Set<DesignType>(['shadow', 'typography']);
// Line heights are ratios and font families CSS stacks: Figma binds neither, so they get no scope (kept for code syntax and verify).
const SCOPES: Partial<Record<DesignType, string[]>> = {
  spacing: ['GAP'], sizing: ['WIDTH_HEIGHT'], borderRadius: ['CORNER_RADIUS'], borderWidth: ['STROKE_FLOAT'],
  fontSizes: ['FONT_SIZE'], fontWeights: ['FONT_WEIGHT'], opacity: ['OPACITY'],
};
// Colors by role, read from the last name segment that says one (then the one before): a foreground is text (and
// icons), a border or ring is a stroke, the rest
// (separators and thumbs too: they are drawn as filled shapes) fill
// surfaces. Shadows are effect styles, so no color is offered for effects.
const STROKE = /(^|[.-])(border|ring|input|outline|stroke)([.-]|$)/;
const FOREGROUND = /(^|[.-])(fg|foreground|text|placeholder|label|dot|indicator|chevron)([.-]|$)|-fg(-|$)/;
export function colorScopes(token: string): string[] {
  for (const seg of token.split('.').slice(-2).reverse()) {
    if (/(^|-)(bg|background)(-|$)/.test(seg) && !/foreground/.test(seg)) return ['FRAME_FILL', 'SHAPE_FILL'];
    if (STROKE.test(seg) && !/input-background/.test(seg)) return ['STROKE_COLOR'];
    if (FOREGROUND.test(seg)) return ['TEXT_FILL', 'SHAPE_FILL', 'STROKE_COLOR'];
  }
  return ['FRAME_FILL', 'SHAPE_FILL'];
}

// Component chunks per use_figma call, so a script stays small enough to pass inline.
const CHUNK = 250;

const cap = (s: string): string => (s[0] ?? '').toUpperCase() + s.slice(1);
export const varName = (path: string): string => path.replace(/\./g, '/');
export const tokenOf = (name: string): string => name.replace(/\//g, '.');

function color(hex: string): Rgba {
  const m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(hex);
  if (!m) throw new Error(`Not a hex color: ${hex}`);
  const n = (i: number) => Math.round((parseInt((m[1] ?? '').slice(i, i + 2), 16) / 255) * 1e4) / 1e4;
  return { r: n(0), g: n(2), b: n(4), a: m[2] ? Math.round((parseInt(m[2], 16) / 255) * 1e4) / 1e4 : 1 };
}
const raw = (type: VariableType, value: unknown): VariableValue => (type === 'COLOR' ? color(show(value)) : type === 'STRING' ? String(value) : parseFloat(show(value)));

export interface DesignFonts { sans: string; mono: string }
export const designFonts = (config: HarnessConfigJson): DesignFonts => {
  const fonts = config.adapters?.design?.fonts;
  return { ...DESIGN_FONTS, ...(fonts && typeof fonts === 'object' ? fonts : {}) };
};
interface RawCollection { name: string; axis: boolean; modes: string[]; hidden?: boolean; tokens: Map<string, { type: DesignType; values: Record<string, DesignValue> }> }

// The model: one collection per theme group (its theme-specific sets, one mode per theme, the active theme first) and
// one single-mode collection per remaining set family (foundation, semantic, component). A token lives in exactly one
// collection; a theme collection wins. Composites become styles.
export async function figmaModel(root: string): Promise<FigmaModel> {
  const payload = await tokenPayload(root);
  const config = parseJson<HarnessConfigJson>(await readFile(join(root, 'harness.config.json'), 'utf8'));
  const prefix = config.prefix;
  const fonts = designFonts(config);
  const groups = [...new Set(payload.themes.map((t) => t.group))];
  const foundationNames = new Set(payload.sets.filter((s) => s.name.startsWith('foundation/')).flatMap((s) => s.tokens.map((t) => t.name)));
  const setOf = (n: string) => {
    const set = payload.sets.find((s) => s.name === n);
    if (!set) throw new Error(`The token payload has no set ${n}.`);
    return set;
  };
  const home = new Map<string, string>(); // token -> collection name
  const collections: RawCollection[] = [];

  for (const group of groups) {
    const themes = payload.themes.filter((t) => t.group === group).sort((a, b) => Number(b.active) - Number(a.active));
    const own = (t: { sets: string[] }) => t.sets.filter((n) => !themes.every((o) => o.sets.includes(n)));
    const tokens: RawCollection['tokens'] = new Map(); // name -> { type, values: { mode: value } }
    for (const th of themes) for (const n of own(th)) for (const t of setOf(n).tokens) {
      if (STYLE_KINDS.has(t.type)) continue;
      let e = tokens.get(t.name);
      if (!e) { e = { type: t.type, values: {} }; tokens.set(t.name, e); }
      e.values[th.name] = t.value;
    }
    for (const n of tokens.keys()) home.set(n, group);
    collections.push({ name: group, axis: true, modes: themes.map((t) => t.name), tokens });
  }
  const families = ['foundation', 'semantic', 'component'];
  for (const fam of families) {
    const tokens: RawCollection['tokens'] = new Map();
    for (const s of payload.sets.filter((x) => x.name.split('/')[0] === fam && !payload.themes.some((t) => t.sets.includes(x.name) && !payload.themes.filter((o) => o.group === t.group).every((o) => o.sets.includes(x.name))))) {
      for (const t of s.tokens) if (!STYLE_KINDS.has(t.type) && !home.has(t.name)) tokens.set(t.name, { type: t.type, values: { Value: t.value } });
    }
    for (const n of tokens.keys()) home.set(n, cap(fam));
    collections.push({ name: cap(fam), axis: false, modes: ['Value'], hidden: fam === 'foundation', tokens });
  }

  const skipped: SkippedToken[] = [...payload.skipped];
  const out = collections.map((c): ModelCollection => ({
    name: c.name, axis: c.axis, modes: c.modes, hidden: Boolean(c.hidden),
    variables: [...c.tokens].map(([token, e]): ModelVariable => {
      const type = TYPE[e.type] ?? 'FLOAT';
      const values: Record<string, VariableValue> = {};
      for (const [m, v] of Object.entries(e.values)) {
        const target = typeof v === 'string' ? ALIAS.exec(v)?.[1] : undefined;
        const collection = target === undefined ? undefined : home.get(target);
        if (target !== undefined && collection === undefined) { skipped.push({ token, type: e.type, reason: `alias to ${target}, which is not a variable` }); continue; }
        values[m] = target !== undefined && collection !== undefined ? { alias: { collection, name: varName(target) } } : e.type === 'opacity' ? Math.round(parseFloat(show(v)) * 1e4) / 100 : raw(type, v); // Figma reads opacity variables as percent
      }
      const scopes = c.name === 'Foundation' || foundationNames.has(token) ? [] : e.type === 'color' ? colorScopes(token) : SCOPES[e.type] ?? [];
      return { token, name: varName(token), type, scopes, code: `var(${cssVarName(prefix, token)})`, values, ...(e.type === 'opacity' && { percent: true }) };
    }),
  }));
  const named = (name: string): ModelCollection => {
    const c = out.find((x) => x.name === name);
    if (!c) throw new Error(`No ${name} collection in the design file model.`);
    return c;
  };
  const shadows = shadowVariables(payload, home, prefix);
  named('Foundation').variables.push(...shadows.Foundation);
  named('Semantic').variables.push(...shadows.Semantic, ...typographyVariables(payload, home, fonts, prefix));
  return organize({ hash: payload.hash, prefix, collections: out, styles: styleModel(payload, fonts), combos: comboList(payload).map((c) => ({ key: c.key, modes: Object.fromEntries(c.themes.map((t) => [t.group, t.name])) })), skipped }, foundationNames);
}

// File organization (SB-0076): collections named Layer - Domain, groups capitalized and leaves as in the token path.
// Primitives (hidden: the raw scales), Semantic (one per theme axis, named by the domain it owns, then Global and
// Typography), Components. Semantic colors are grouped by role (Background, Text, Stroke) from their scopes, the
// foundation steps a theme axis changes sit under Scale, a text role's parts under the role. Aliases and style bindings
// follow the new names; code syntax keeps the CSS variable.
export const COLLECTION_ORDER = ['Primitives - Color', 'Primitives - Global', 'Semantic - Color', 'Semantic - Shape', 'Semantic - Density', 'Semantic - Global', 'Semantic - Typography', 'Components'];
const capSeg = (s: string): string => (s[0] ?? '').toUpperCase() + s.slice(1);
const titled = (segs: string[]): string => segs.map((s, i) => (i < segs.length - 1 ? capSeg(s) : s)).join('/');
const axisDomain = (group: string): string => (group === 'Mode' ? 'Color' : group);
function placeOf(collection: string, v: ModelVariable, foundationNames: Set<string>): Place {
  const segs = v.token.split('.');
  if (collection === 'Foundation') return { collection: segs[0] === 'color' ? 'Primitives - Color' : 'Primitives - Global', name: titled(segs) };
  if (collection === 'Component') return { collection: 'Components', name: titled(segs) };
  if (collection === 'Semantic') {
    if (segs[0] === 'text-style') return { collection: 'Semantic - Typography', name: titled(segs.slice(1)) };
    return { collection: segs[0] === 'font' ? 'Semantic - Typography' : 'Semantic - Global', name: titled(segs) };
  }
  const domain = axisDomain(collection);
  if (v.type === 'COLOR' && segs[0] === 'color') {
    const role = v.scopes.includes('TEXT_FILL') ? 'Text' : v.scopes.includes('FRAME_FILL') ? 'Background' : 'Stroke';
    return { collection: `Semantic - ${domain}`, name: `Color/${role}/${segs.slice(1).join('-')}` };
  }
  return { collection: `Semantic - ${domain}`, name: foundationNames.has(v.token) ? titled([segs[0] ?? '', 'scale', ...segs.slice(1)]) : titled(segs) };
}
function organize(model: FigmaModel, foundationNames: Set<string>): FigmaModel {
  const moved = new Map<string, Place>(); // "Old::name" -> { collection, name }
  const meta = new Map<string, Omit<ModelCollection, 'name'>>();
  for (const c of model.collections) for (const v of c.variables) {
    const p = placeOf(c.name, v, foundationNames);
    moved.set(`${c.name}::${v.name}`, p);
    let m = meta.get(p.collection);
    if (!m) { m = { modes: c.modes, axis: c.axis, hidden: p.collection.startsWith('Primitives'), variables: [] }; meta.set(p.collection, m); }
    m.variables.push({ ...v, name: p.name });
  }
  const to = (collection: string, name: string) => moved.get(`${collection}::${name}`);
  for (const c of meta.values()) for (const v of c.variables) {
    v.values = Object.fromEntries(Object.entries(v.values).map(([m, x]) => { const a = aliasOf(x); return [m, a ? { alias: to(a.collection, a.name) } : x]; }));
  }
  const key = (collection: string, name: string) => {
    const p = to(collection, name);
    if (!p) throw new TypeError(`A style binds ${collection}::${name}, which is not a variable.`);
    return `${p.collection}::${p.name}`;
  };
  const styles = {
    text: model.styles.text.map((t) => ({ ...t, name: `Text/${capSeg(t.token.replace(/^text-style\./, ''))}`, bind: Object.fromEntries(Object.entries(t.bind).map(([f, n]) => [f, key('Semantic', n)])) })),
    effect: model.styles.effect.map((e) => ({ ...e, name: `Elevation/${capSeg(e.token.split('.').slice(1).join('-'))}`, layers: e.layers.map((l) => ({ ...l, bind: Object.fromEntries(Object.entries(l.bind).map(([f, n]) => [f, key('Semantic', n)])) })) })),
  };
  const collections = COLLECTION_ORDER.flatMap((name) => { const c = meta.get(name); return c ? [{ name, ...c }] : []; });
  const axisCollection = (group: string) => `Semantic - ${axisDomain(group)}`;
  const combos = model.combos.map((c) => ({ ...c, modes: Object.fromEntries(Object.entries(c.modes).map(([g, m]) => [axisCollection(g), m])) }));
  return { ...model, collections, styles, combos };
}

// A CSS font stack is not a Figma font: the design family is the first family that is not a generic or system alias,
// else the design font for its kind (harness.config.json adapters.design.fonts, default Inter / Roboto Mono).
export const DESIGN_FONTS: DesignFonts = { sans: 'Inter', mono: 'Roboto Mono' };
const GENERIC_FONT = /^(ui-.*|system-ui|-apple-system|BlinkMacSystemFont|sans-serif|serif|monospace|cursive|fantasy|emoji|math|fangsong|.*Emoji|Segoe UI.*|SFMono-Regular|Menlo|Monaco|Consolas)$/i;
export function designFamily(stack: unknown, fonts: DesignFonts = DESIGN_FONTS): string {
  const list = (Array.isArray(stack) ? stack.map(show) : String(stack).split(',')).map((x) => x.trim().replace(/^['"]|['"]$/g, ''));
  return list.find((f) => !GENERIC_FONT.test(f)) ?? (list.some((f) => /mono/i.test(f)) ? fonts.mono : fonts.sans);
}

const derefIn = (map: Map<string, DesignToken>) => (v: unknown): unknown => { let x = v; for (let i = 0; i < 10 && typeof x === 'string' && ALIAS.test(x); i++) x = map.get(ALIAS.exec(x)?.[1] ?? '')?.value; return x; };

// One group per text role (text-style/<role>/family|size|weight|line-height|letter-spacing) so a text style binds every
// field, as Figma needs pixels and a real font: size and weight alias the role's tokens, line height and letter spacing are
// the role's ratio and em resolved to pixels (their code syntax is the CSS that computes them), family is the design family.
function typographyVariables(payload: TokenPayload, home: Map<string, string>, fonts: DesignFonts, prefix: string): ModelVariable[] {
  const map = new Map(payload.sets.flatMap((s) => s.tokens.map((t) => [t.name, t])));
  const deref = derefIn(map);
  const path = (v: unknown) => (typeof v === 'string' ? ALIAS.exec(v)?.[1] : null);
  const css = (p: string | null | undefined) => {
    if (typeof p !== 'string') throw new TypeError('A text style part is not an alias of a token.');
    return `var(${cssVarName(prefix, p)})`;
  };
  const alias = (v: unknown): AliasValue | null => {
    const p = path(v);
    const collection = p == null ? undefined : home.get(p);
    return p != null && collection !== undefined ? { alias: { collection, name: varName(p) } } : null;
  };
  const out: ModelVariable[] = [];
  for (const t of payload.sets.flatMap((s) => s.tokens).filter((x) => x.type === 'typography')) {
    const v = fieldsOf(t.value);
    const size = parseFloat(show(deref(v.fontSizes)));
    const role = t.name.replace(/^text-style\./, '');
    const lineHeight = Math.round(parseFloat(show(deref(v.lineHeight))) * size * 100) / 100;
    const add = (prop: string, type: VariableType, scopes: string[], code: string, value: VariableValue | null | undefined) => value !== null && value !== undefined && out.push({ token: `${t.name}.${prop}`, name: varName(`${t.name}.${prop}`), type, scopes, code, values: { Value: value } });
    add('family', 'STRING', ['FONT_FAMILY'], css(path(v.fontFamilies)), designFamily(deref(v.fontFamilies), fonts));
    add('size', 'FLOAT', ['FONT_SIZE'], css(path(v.fontSizes)), alias(v.fontSizes));
    if (v.fontWeight) add('weight', 'FLOAT', ['FONT_WEIGHT'], css(path(v.fontWeight)), alias(v.fontWeight));
    add('line-height', 'FLOAT', ['LINE_HEIGHT'], path(v.lineHeight) ? `calc(${css(path(v.fontSizes))} * ${css(path(v.lineHeight))})` : map.has(`font.line-height.${role}`) ? css(`font.line-height.${role}`) : `${lineHeight}px`, lineHeight);
    add('letter-spacing', 'FLOAT', ['LETTER_SPACING'], `${parseFloat(show(v.letterSpacing)) || 0}px`, parseFloat(show(v.letterSpacing)) || 0);
  }
  return out;
}

// Shadows as parts, so an effect style binds every field: <token>[/<layer>]/color|offset-x|offset-y|blur|spread, the
// foundation steps (hidden, raw) in Foundation and the elevation roles (aliasing them) in Semantic. Code syntax: the token.
const SHADOW_FIELDS: [string, VariableType, (l: ShadowLayer) => VariableValue][] = [['color', 'COLOR', (l) => color(show(l.color))], ['offset-x', 'FLOAT', (l) => parseFloat(l.offsetX)], ['offset-y', 'FLOAT', (l) => parseFloat(l.offsetY)], ['blur', 'FLOAT', (l) => parseFloat(l.blur)], ['spread', 'FLOAT', (l) => parseFloat(l.spread)]];
const shadowPart = (token: string, layers: number, i: number, field: string) => `${token}${layers > 1 ? `.${i + 1}` : ''}.${field}`;
type ShadowHome = 'Foundation' | 'Semantic' | 'Component';
function shadowVariables(payload: TokenPayload, home: Map<string, string>, prefix: string): Record<ShadowHome, ModelVariable[]> {
  const map = new Map(payload.sets.flatMap((s) => s.tokens.map((t) => [t.name, t])));
  const deref = derefIn(map);
  const out: Record<ShadowHome, ModelVariable[]> = { Foundation: [], Semantic: [], Component: [] };
  for (const t of payload.sets.flatMap((s) => s.tokens).filter((x) => x.type === 'shadow' && ['Foundation', 'Semantic'].includes(homeOfShadow(x.name, payload)))) {
    const collection = homeOfShadow(t.name, payload);
    const target = typeof t.value === 'string' ? ALIAS.exec(t.value)?.[1] : null;
    const layers = layersOf(deref(t.value), t.name);
    layers.forEach((l, i) => {
      for (const [field, type, read] of SHADOW_FIELDS) {
        const token = shadowPart(t.name, layers.length, i, field);
        const value = target ? { alias: { collection: homeOfShadow(target, payload), name: varName(shadowPart(target, layers.length, i, field)) } } : read(l);
        out[collection].push({ token, name: varName(token), type, scopes: collection === 'Foundation' ? [] : [type === 'COLOR' ? 'EFFECT_COLOR' : 'EFFECT_FLOAT'], code: `var(${cssVarName(prefix, t.name)})`, values: { Value: value } });
      }
    });
  }
  return out;
}
const homeOfShadow = (name: string, payload: TokenPayload): ShadowHome => { const set = payload.sets.find((s) => s.tokens.some((t) => t.name === name))?.name ?? ''; return set.startsWith('foundation/') ? 'Foundation' : set.startsWith('semantic/') ? 'Semantic' : 'Component'; };

// Text styles (semantic/typography composites, every field bound to its text-style variable) and effect styles (every
// shadow token that is not a pure alias of another).
function styleModel(payload: TokenPayload, fonts: DesignFonts): FigmaModel['styles'] {
  const map = new Map(payload.sets.flatMap((s) => s.tokens.map((t) => [t.name, t])));
  const deref = (v: unknown): unknown => { let x = v; for (let i = 0; i < 10 && typeof x === 'string' && ALIAS.test(x); i++) x = map.get(ALIAS.exec(x)?.[1] ?? '')?.value; return x; };
  const text = payload.sets.flatMap((s) => s.tokens).filter((t) => t.type === 'typography').map((t): TextStyle => ({
    token: t.name,
    name: varName(t.name),
    family: designFamily(deref(fieldsOf(t.value).fontFamilies), fonts),
    weight: parseFloat(show(deref(fieldsOf(t.value).fontWeight))) || 400,
    decoration: fieldsOf(t.value).textDecoration === 'underline' ? 'UNDERLINE' : 'NONE',
    bind: Object.fromEntries(([['fontFamily', 'family'], ['fontSize', 'size'], ['fontWeight', 'weight'], ['lineHeight', 'line-height'], ['letterSpacing', 'letter-spacing']] satisfies [string, string][]).filter(([, p]) => p !== 'weight' || fieldsOf(t.value).fontWeight).map(([field, p]) => [field, `${varName(t.name)}/${p}`])),
  }));
  const effect = payload.sets.flatMap((s) => s.tokens).filter((t) => t.type === 'shadow' && /^elevation\./.test(t.name)).map((t): EffectStyle => ({
    token: t.name,
    name: varName(t.name),
    layers: layersOf(deref(t.value), t.name).map((l, i, all) => ({
      effect: { type: 'DROP_SHADOW', color: color(show(l.color)), offset: { x: parseFloat(l.offsetX), y: parseFloat(l.offsetY) }, radius: parseFloat(l.blur), spread: parseFloat(l.spread), visible: true, blendMode: 'NORMAL' },
      bind: Object.fromEntries(([['color', 'color'], ['offsetX', 'offset-x'], ['offsetY', 'offset-y'], ['radius', 'blur'], ['spread', 'spread']] satisfies [string, string][]).map(([k, field]) => [k, varName(shadowPart(t.name, all.length, i, field))])),
    })),
  }));
  return { text, effect };
}

// One use_figma call per part, in dependency order (aliases point at collections pushed earlier or in the same part).
// What reached the file at the last `sync stamp tokens` (generated/design/figma/pushed.json): per collection its modes and
// one fingerprint per variable, so the next sync writes only what changed.
const fingerprint = (v: ModelVariable) => JSON.stringify([v.type, v.scopes, v.code, v.values]);
export function snapshotOf(model: Pick<FigmaModel, 'collections'>): Snapshot {
  return Object.fromEntries(model.collections.map((c) => [c.name, { modes: c.modes, vars: Object.fromEntries(c.variables.map((v) => [v.name, fingerprint(v)])) }]));
}

// previous: a snapshot; with one, a part holds only the variables that are new or changed (all of a collection whose modes
// changed). Code syntax travels only when it is not the plain CSS variable of the name.
export function variableParts(model: FigmaModel, previous: Snapshot | null = null): VariablePart[] {
  const order = model.collections.map((c) => c.name);
  const parts: VariablePart[] = [];
  for (const name of order) {
    const c = model.collections.find((x) => x.name === name);
    if (!c) continue;
    const before = previous?.[name];
    const same = before && JSON.stringify(before.modes) === JSON.stringify(c.modes);
    const list = c.variables.filter((v) => !same || before?.vars[v.name] !== fingerprint(v));
    if (!list.length) continue;
    for (let i = 0; i < list.length; i += CHUNK) {
      const chunk = list.slice(i, i + CHUNK);
      // Compact: scopes and alias collections are indexes into small tables, and code syntax travels only when it is not
      // the CSS variable the name spells (the script rebuilds that one), so a part stays well under 50,000 characters.
      const scopes = [...new Set(chunk.map((v) => JSON.stringify(v.scopes)))];
      const cols = [...new Set(chunk.flatMap((v) => Object.values(v.values).flatMap((x) => { const a = aliasOf(x); return a ? [a.collection] : []; })))];
      const spelled = (v: ModelVariable) => `var(--${model.prefix}-${v.name.toLowerCase().replace(/\//g, '-')})`;
      parts.push({
        file: `${String(parts.length + 1).padStart(2, '0')}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}${list.length > CHUNK ? `-${i / CHUNK + 1}` : ''}.js`,
        collection: name, modes: c.modes, hidden: c.hidden, prefix: model.prefix, scopes: scopes.map((x) => parseJson<string[]>(x)), cols,
        variables: chunk.map((v): PartVariable => [v.name, v.type, scopes.indexOf(JSON.stringify(v.scopes)), Object.fromEntries(Object.entries(v.values).map(([m, x]): [string, PartValue] => { const a = aliasOf(x); return [m, a ? [cols.indexOf(a.collection), a.name] : x]; })), ...(v.code === spelled(v) ? [] : [v.code])]),
      });
    }
  }
  return parts;
}

// Upsert by name, never delete: a deleted variable unbinds every node that used it. Modes are matched by name; the
// first mode of a new collection is renamed, missing ones are added, extra ones are reported.
export function variablesScript(part: VariablePart, hash: string): string {
  return `// GENERATED by sketchbook sync tokens (${part.file}). Run with the Figma MCP use_figma tool.
const part = ${JSON.stringify({ ...part, hash })};
const report = { part: part.file, collection: part.collection, created: 0, updated: 0, errors: [], extraModes: [] };
const V = figma.variables;
let col = (await V.getLocalVariableCollectionsAsync()).find((c) => c.name === part.collection);
if (!col) { col = V.createVariableCollection(part.collection); col.renameMode(col.modes[0].modeId, part.modes[0]); }
for (const m of part.modes) if (!col.modes.some((x) => x.name === m)) col.addMode(m);
if (col.modes[0].name !== part.modes[0]) report.errors.push('default mode is ' + col.modes[0].name + ', expected ' + part.modes[0]);
report.extraModes = col.modes.filter((m) => !part.modes.includes(m.name)).map((m) => m.name);
col.hiddenFromPublishing = part.hidden;
const modeId = Object.fromEntries(col.modes.map((m) => [m.name, m.modeId]));
const colName = Object.fromEntries((await V.getLocalVariableCollectionsAsync()).map((c) => [c.id, c.name]));
const byKey = new Map((await V.getLocalVariablesAsync()).map((v) => [colName[v.variableCollectionId] + '::' + v.name, v]));
const ok = new Set();
const defs = part.variables.map(([name, type, scope, values, code]) => ({ name, type, scopes: part.scopes[scope], values, code: code || 'var(--' + part.prefix + '-' + name.toLowerCase().replace(/\\//g, '-') + ')' }));
for (const d of defs) {
  let v = byKey.get(part.collection + '::' + d.name);
  if (v && v.resolvedType !== d.type) { report.errors.push(d.name + ': is ' + v.resolvedType + ', spec says ' + d.type + ' (not changed; fix by hand or rename)'); continue; }
  if (!v) { v = V.createVariable(d.name, col, d.type); byKey.set(part.collection + '::' + d.name, v); report.created++; } else report.updated++;
  v.scopes = d.scopes;
  v.setVariableCodeSyntax('WEB', d.code);
  ok.add(d.name);
}
for (const d of defs) {
  if (!ok.has(d.name)) continue;
  const v = byKey.get(part.collection + '::' + d.name);
  for (const [m, val] of Object.entries(d.values)) {
    try {
      if (Array.isArray(val)) {
        const t = byKey.get(part.cols[val[0]] + '::' + val[1]);
        if (!t) { report.errors.push(d.name + ': alias target ' + part.cols[val[0]] + '/' + val[1] + ' missing'); continue; }
        v.setValueForMode(modeId[m], V.createVariableAlias(t));
      } else v.setValueForMode(modeId[m], val);
    } catch (e) { report.errors.push(d.name + ' [' + m + ']: ' + (e && e.message ? e.message : e)); }
  }
}
return report;
`;
}

// Text styles bind size and weight to variables; the family is the first one of the CSS stack Figma has, else Inter.
// Effect styles hold the resolved shadow layers (variables cannot hold shadows).
export function stylesScript(model: Pick<FigmaModel, 'styles' | 'hash'>): string {
  return `// GENERATED by sketchbook sync tokens (styles.js). Run with the Figma MCP use_figma tool after the variables.
const S = ${JSON.stringify({ ...model.styles, hash: model.hash })};
const report = { text: 0, effect: 0, errors: [], fonts: {} };
const vars = await figma.variables.getLocalVariablesAsync();
const cols = Object.fromEntries((await figma.variables.getLocalVariableCollectionsAsync()).map((c) => [c.id, c.name]));
const byName = (key) => vars.find((v) => cols[v.variableCollectionId] + '::' + v.name === key);
const fonts = await figma.listAvailableFontsAsync();
const families = new Set(fonts.map((f) => f.fontName.family));
const styleFor = (family, weight) => {
  const styles = fonts.filter((f) => f.fontName.family === family).map((f) => f.fontName.style);
  const names = { 100: ['Thin'], 200: ['Extra Light', 'ExtraLight'], 300: ['Light'], 400: ['Regular'], 500: ['Medium'], 600: ['Semi Bold', 'SemiBold'], 700: ['Bold'], 800: ['Extra Bold', 'ExtraBold'], 900: ['Black'] }[weight] || ['Regular'];
  return names.find((n) => styles.includes(n)) || styles[0] || 'Regular';
};
const textStyles = await figma.getLocalTextStylesAsync();
for (const t of S.text) {
  try {
    if (!families.has(t.family)) { report.errors.push(t.name + ': font "' + t.family + '" is not available in Figma; set adapters.design.fonts'); continue; }
    const fontName = { family: t.family, style: styleFor(t.family, t.weight) };
    await figma.loadFontAsync(fontName);
    report.fonts[t.name] = fontName.family + ' ' + fontName.style;
    const s = textStyles.find((x) => x.name === t.name) || figma.createTextStyle();
    s.name = t.name;
    s.fontName = fontName;
    s.textDecoration = t.decoration || 'NONE';
    for (const [field, n] of Object.entries(t.bind)) {
      const v = byName(n);
      if (v) s.setBoundVariable(field, v); else report.errors.push(t.name + ': no variable ' + n);
    }
    report.text++;
  } catch (e) { report.errors.push(t.name + ': ' + (e && e.message ? e.message : e)); }
}
const effectStyles = await figma.getLocalEffectStylesAsync();
for (const e of S.effect) {
  const s = effectStyles.find((x) => x.name === e.name) || figma.createEffectStyle();
  s.name = e.name;
  s.effects = e.layers.map((l) => Object.entries(l.bind).reduce((fx, [field, n]) => {
    const v = byName(n);
    if (!v) { report.errors.push(e.name + ': no variable ' + n); return fx; }
    return figma.variables.setBoundVariableForEffect(fx, field, v);
  }, l.effect));
  report.effect++;
}
return report;
`;
}

// Read-only: resolves every managed variable for every theme combination by following aliases with that combination's
// modes. Part 0 returns the names (in the file's variable order); a combination part returns its first combination in
// full and each next one as [index, value] pairs that differ from the previous (one axis changes at a time).
// ---- verify: Figma resolves every managed variable for every mode combination and returns one digest per combination
// (and one per collection's names). Node computes the same digests from the model; test F2 proves the model equals the
// spec for every combination, so equal digests mean the file equals the spec. A mismatch is located with a detail call
// that returns one combination's values. use_figma returns at most 48,000 bytes, so nothing returns values in bulk.

// The model resolved for one combination: variable key "Collection::name" -> normalized value.
export function resolveModel(model: Pick<FigmaModel, 'collections'>, modes: Record<string, string | undefined>): Map<string, string> {
  const vars = new Map(model.collections.flatMap((c) => c.variables.map((v) => [`${c.name}::${v.name}`, { c, v }])));
  const at = (key: string, depth = 0): VariableValue | null | undefined => {
    const e = vars.get(key);
    if (!e || depth > 20) return null;
    const pinned = modes[e.c.name];
    const mode = pinned && e.c.modes.includes(pinned) ? pinned : e.c.modes[0];
    const val = e.v.values[String(mode)];
    const a = aliasOf(val);
    return a ? at(`${a.collection}::${a.name}`, depth + 1) : val;
  };
  return new Map([...vars.keys()].map((k) => [k, norm(at(k))]));
}
const lines = (map: Map<string, string>) => [...map].map(([k, v]) => `${k}=${v}`).sort();

export function expectedDigests(model: Pick<FigmaModel, 'collections' | 'combos'>): { names: Record<string, string>; combos: Record<string, string> } {
  return {
    names: Object.fromEntries(model.collections.map((c) => [c.name, digest(c.variables.map((v) => v.name).sort())])),
    combos: Object.fromEntries(model.combos.map((c) => [c.key, digest(lines(resolveModel(model, c.modes)))])),
  };
}

// Read-only. detail: a combination key to also return that combination's values (to locate a mismatch).
export function verifyScript(model: FigmaModel, { detail }: { detail?: string | null } = {}): string {
  const cfg = { hash: model.hash, collections: model.collections.map((c) => ({ name: c.name, modes: c.modes })), combos: model.combos, detail: detail ?? null };
  return `// GENERATED by sketchbook sync verify. Read-only. Run with the Figma MCP use_figma tool; save what it returns.
const cfg = ${JSON.stringify(cfg)};
${norm.toString()}
${digest.toString()}
const V = figma.variables;
const cols = await V.getLocalVariableCollectionsAsync();
const managed = cols.filter((c) => cfg.collections.some((x) => x.name === c.name));
const vars = (await V.getLocalVariablesAsync()).filter((v) => managed.some((c) => c.id === v.variableCollectionId));
const all = await V.getLocalVariablesAsync();
const byId = new Map(all.map((v) => [v.id, v]));
const colById = new Map(cols.map((c) => [c.id, c]));
const key = (v) => colById.get(v.variableCollectionId).name + '::' + v.name;
const resolveIn = (v, modes, depth = 0) => {
  const col = colById.get(v.variableCollectionId);
  const mode = (modes[col.name] && col.modes.find((m) => m.name === modes[col.name])) || col.modes[0];
  const val = v.valuesByMode[mode.modeId];
  if (val && val.type === 'VARIABLE_ALIAS') { const t = byId.get(val.id); return t && depth < 20 ? resolveIn(t, modes, depth + 1) : null; }
  return val;
};
const out = { file: figma.fileKey || null, hash: cfg.hash, readAt: new Date().toISOString(), counts: {}, names: {}, combos: {}, missingModes: [], extraModes: [] };
for (const c of cfg.collections) {
  const col = managed.find((x) => x.name === c.name);
  if (!col) { out.missingModes.push(c.name + ' (collection)'); continue; }
  for (const m of c.modes) if (!col.modes.some((x) => x.name === m)) out.missingModes.push(c.name + '/' + m);
  for (const m of col.modes) if (!c.modes.includes(m.name)) out.extraModes.push(c.name + '/' + m.name);
  const names = vars.filter((v) => v.variableCollectionId === col.id).map((v) => v.name).sort();
  out.counts[c.name] = names.length;
  out.names[c.name] = digest(names);
}
for (const combo of cfg.combos) {
  const lines = vars.map((v) => key(v) + '=' + norm(resolveIn(v, combo.modes))).sort();
  out.combos[combo.key] = digest(lines);
  if (cfg.detail === combo.key) out.detail = { combo: combo.key, values: vars.map((v) => [key(v), norm(resolveIn(v, combo.modes))]).sort((a, b) => (a[0] < b[0] ? -1 : 1)).map((x) => x[1]) };
}
return out;
`;
}

// A verify result -> mismatches against the model (and therefore the spec). Without a detail, a differing combination
// is reported as a whole; with one, per variable.
export function compareDigests(model: FigmaModel, read: VerifyReadback): CompareResult {
  const want = expectedDigests(model);
  const mismatches: Mismatch[] = [];
  for (const c of model.collections) {
    if (read.counts?.[c.name] !== c.variables.length || read.names?.[c.name] !== want.names[c.name]) mismatches.push({ token: `(${c.name} names)`, mode: 'all', design: `${read.counts?.[c.name] ?? 0} variables`, spec: `${c.variables.length} variables` });
  }
  for (const m of read.missingModes ?? []) mismatches.push({ token: '(mode)', mode: m, design: null, spec: 'present' });
  for (const combo of model.combos) {
    if (read.combos?.[combo.key] === want.combos[combo.key]) continue;
    const detail = read.detail;
    if (detail?.combo === combo.key) {
      // detail values come in the file's sorted key order: the same order as the model's keys when the names digests match
      const want = [...resolveModel(model, combo.modes)].sort((a, b) => (a[0] < b[0] ? -1 : 1));
      want.forEach(([k, v], i) => { if (detail.values[i] !== v) mismatches.push({ token: k.replace('::', '/'), mode: combo.key, design: detail.values[i] ?? null, spec: v }); });
    } else mismatches.push({ token: '(combination)', mode: combo.key, design: read.combos?.[combo.key] ?? null, spec: want.combos[combo.key] });
  }
  const compared = model.combos.length * model.collections.reduce((n, c) => n + c.variables.length, 0);
  return { hash: model.hash, stale: Boolean(read.hash && read.hash !== model.hash), compared, skipped: 0, mismatches };
}

// Every spec token must reach the file: as a variable, as a text style (typography composites) or as an effect style and
// its part variables (shadows; a component shadow is the elevation style it aliases). Returns what does not.
export async function coverage(root: string, model: Pick<FigmaModel, 'collections' | 'styles'>): Promise<{ total: number; missing: string[] }> {
  const payload = await tokenPayload(root);
  const vars = new Set(model.collections.flatMap((c) => c.variables.map((v) => v.token)));
  const styles = new Set([...model.styles.text, ...model.styles.effect].map((s) => s.token));
  const covered = (t: DesignToken) => {
    if (vars.has(t.name) || styles.has(t.name)) return true;
    if (t.type === 'shadow') {
      if (vars.has(`${t.name}.color`) || vars.has(`${t.name}.1.color`)) return true;
      const target = typeof t.value === 'string' ? ALIAS.exec(t.value)?.[1] : null;
      return Boolean(target && styles.has(target));
    }
    return false;
  };
  const tokens = [...new Map(payload.sets.flatMap((s) => s.tokens.map((t) => [t.name, t]))).values()];
  return { total: tokens.length, missing: tokens.filter((t) => !covered(t)).map((t) => t.name).concat(payload.skipped.map((s) => s.token)) };
}
