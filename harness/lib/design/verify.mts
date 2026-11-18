// Foundations content and read-back comparison for the design file (SB-0051):
//   foundationsData -> what each foundation doc shows, from the token payload (rendered by the adapter).
//   compareReadback -> mismatches between a design file read-back and the spec per theme combination (read by D1).
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { modeNames } from '../../standards/resolve.mjs';
import { ALIAS, loadAll, resolve, tokensForMode, type Token } from '../tokens.mjs';
import { wcagRatio } from '../color.mjs';
import { parseJson, readJsonSync, show } from '../files.mjs';
import { comboMap, tokenPayload, type DesignTheme, type DesignToken, type DesignType, type DesignValue, type TokenPayload } from './tokens.mjs';
import type { BrandConfig } from '../../../generated/types/brand-config.js';
import type { ContrastPair } from '../interface.mjs';

export const FOUNDATION_PAGES = ['color', 'typography', 'spacing', 'radius', 'elevation', 'other'];
const themeName = (mode: string) => (mode[0] ?? '').toUpperCase() + mode.slice(1);

export interface NamedValue { name: string; value: unknown }
export interface FoundationPages {
  color: {
    ramps: { ramp: string; tokens: string[] }[];
    semantic: { name: string; values: Record<string, unknown>; aliases: Record<string, string | null> }[];
    contrast: (ContrastPair & { ratios: Record<string, number> })[];
  };
  typography: { styles: { name: string; size: string; lineHeight: string; weight: unknown }[] };
  spacing: { tokens: NamedValue[]; control: NamedValue[] };
  radius: { tokens: NamedValue[]; scale: NamedValue[] };
  elevation: { tokens: { name: string }[] };
  other: { border: NamedValue[]; opacity: NamedValue[]; icons: NamedValue[]; motion: NamedValue[]; layers: NamedValue[] };
}
export interface FoundationsData { hash: string; modes: { mode: string; theme: string }[]; pages: Partial<FoundationPages> }

const fieldsOf = (v: DesignValue): Record<string, unknown> => (typeof v === 'object' && !Array.isArray(v) ? v : {});

// Everything the foundation docs show, from the payload and the spec (values per mode).
export async function foundationsData(root: string, pages: string[] = FOUNDATION_PAGES): Promise<FoundationsData> {
  const unknown = pages.filter((p) => !FOUNDATION_PAGES.includes(p));
  if (unknown.length) throw Object.assign(new Error(`Unknown foundations page(s): ${unknown.join(', ')}.`), { fix: `Use ${FOUNDATION_PAGES.join(', ')}.` });
  const payload = await tokenPayload(root);
  const modes = modeNames(parseJson<BrandConfig>(await readFile(join(root, 'brand.config.json'), 'utf8')));
  const all = await loadAll(root);
  const maps: Record<string, Map<string, Token>> = Object.fromEntries(modes.map((m) => [m, tokensForMode(all, m)]));
  const first = modes[0] ?? '';
  const set = (name: string): DesignToken[] => payload.sets.find((s) => s.name === name)?.tokens ?? [];
  const nonComponent = payload.sets.filter((s) => !/^(component|theme)\//.test(s.name));
  const ofType = (type: DesignType) => nonComponent.filter((s) => !/^semantic\/(?!base$|typography$)/.test(s.name)).flatMap((s) => s.tokens.filter((t) => t.type === type).map((t) => ({ set: s.name, name: t.name })));
  const valueIn = (mode: string, name: string): unknown => { const r = resolve(maps[mode] ?? new Map<string, Token>(), name); return r.error ? null : r.value; };
  const aliasIn = (mode: string, name: string) => { const v = maps[mode]?.get(name)?.value; return typeof v === 'string' ? ALIAS.exec(v)?.[1] ?? null : null; };
  const named = (re: RegExp) => [...new Set(payload.sets.filter((x) => !x.name.startsWith('component/')).flatMap((x) => x.tokens.map((t) => t.name)))].filter((n) => re.test(n));
  const valued = (names: string[]): NamedValue[] => names.map((name) => ({ name, value: valueIn(first, name) }));
  const data: FoundationsData = { hash: payload.hash, modes: modes.map((m) => ({ mode: m, theme: themeName(m) })), pages: {} };
  for (const page of pages) {
    if (page === 'color') {
      const ramps = new Map<string, string[]>();
      for (const t of set('foundation/color')) {
        const parts = t.name.split('.');
        const ramp = parts.length > 2 ? parts.slice(1, -1).join('.') : 'base';
        let list = ramps.get(ramp);
        if (!list) ramps.set(ramp, (list = []));
        list.push(t.name);
      }
      const semanticNames = [...new Set(modes.flatMap((m) => set(`semantic/${m}`).filter((t) => t.type === 'color').map((t) => t.name)))];
      data.pages.color = {
        ramps: [...ramps].map(([ramp, tokens]) => ({ ramp, tokens })),
        semantic: semanticNames.map((name) => ({ name, values: Object.fromEntries(modes.map((m) => [m, valueIn(m, name)])), aliases: Object.fromEntries(modes.map((m) => [m, aliasIn(m, name)])) })),
        contrast: (readJsonSync<{ pairs?: ContrastPair[] }>(join(root, 'spec/tokens/contrast.json'), {})?.pairs ?? []).map((p) => ({ ...p, ratios: Object.fromEntries(modes.map((m) => [m, Math.round(wcagRatio(String(valueIn(m, p.fg)), String(valueIn(m, p.bg))) * 100) / 100])) })),
      };
    }
    if (page === 'typography') data.pages.typography = { styles: set('semantic/typography').map((t) => {
      const v = fieldsOf(t.value);
      const ref = (x: unknown) => (typeof x === 'string' ? x.replace(/[{}]/g, '') : String(x));
      const size = parseFloat(String(valueIn(first, ref(v.fontSizes))));
      const lh = typeof v.lineHeight === 'string' && v.lineHeight.startsWith('{') ? parseFloat(String(valueIn(first, ref(v.lineHeight)))) : parseFloat(String(v.lineHeight));
      return { name: t.name, size: `${size}px`, lineHeight: `${Math.round(lh * size * 100) / 100}px`, weight: v.fontWeight ? valueIn(first, ref(v.fontWeight)) : null };
    }) };
    if (page === 'spacing') data.pages.spacing = { tokens: ofType('spacing').filter((t) => /^space\.(inset|stack)\./.test(t.name)).map((t) => ({ name: t.name, value: valueIn(first, t.name) })), control: valued(named(/^(space|size)\.control\./)) };
    if (page === 'radius') data.pages.radius = { tokens: ofType('borderRadius').filter((t) => t.set !== 'foundation/radius').map((t) => ({ name: t.name, value: valueIn(first, t.name) })), scale: valued(named(/^radius\.(none|xs|sm|md|lg|xl|full)$/)) };
    if (page === 'elevation') data.pages.elevation = { tokens: ofType('shadow').filter((t) => /^elevation\./.test(t.name)).map((t) => ({ name: t.name })) };
    if (page === 'other') data.pages.other = { border: valued(named(/^(border-width|focus\.ring)\./)), opacity: valued(named(/^opacity\.[a-z]/)), icons: valued(named(/^size\.icon\./)), motion: valued(named(/^motion\./)), layers: valued(named(/^layer\./)) };
  }
  return data;
}

// One theme of every group is a combination (Mode x Shape x Density for the full catalog, just Mode for a project
// without theme axes). The key joins the theme names with " | ".
export function comboList(payload: Pick<TokenPayload, 'themes'>): { key: string; themes: DesignTheme[] }[] {
  const groups = [...new Set(payload.themes.map((t) => t.group))];
  let list: DesignTheme[][] = [[]];
  for (const g of groups) list = list.flatMap((l) => payload.themes.filter((t) => t.group === g).map((t) => [...l, t]));
  return list.map((themes) => ({ key: themes.map((t) => t.name).join(' | '), themes }));
}

// --- compare a design file read-back with the spec ---
const hex = (v: unknown) => {
  const s = String(v).trim().toLowerCase();
  let m = /^#([0-9a-f]{3,8})$/.exec(s);
  if (m) {
    let h = m[1] ?? '';
    if (h.length <= 4) h = [...h].map((c) => c + c).join('');
    return h.length === 8 && h.endsWith('ff') ? h.slice(0, 6) : h;
  }
  m = /^rgba?\(([^)]+)\)$/.exec(s);
  if (m) {
    const [r, g, b, a = 1] = (m[1] ?? '').split(/[\s,/]+/).filter(Boolean).map(Number);
    const to = (n: number | undefined) => Math.round(Number(n)).toString(16).padStart(2, '0');
    return to(r) + to(g) + to(b) + (Number(a) < 1 ? to(Number(a) * 255) : '');
  }
  return null;
};
const num = (v: unknown) => (typeof v === 'number' ? v : typeof v === 'string' && /^-?\d*\.?\d+(px|ms|em)?$/.test(v.trim()) ? parseFloat(v) : null);
const bezier = (v: unknown) => (Array.isArray(v) ? v : String(v).replace(/^cubic-bezier\(|\)$|[[\]\s]/g, '').split(',')).map(Number).join(',');
const fam = (v: unknown) => (Array.isArray(v) ? v.join(',') : String(v)).replace(/["'\s]/g, '').toLowerCase();
const COMPOSITE = new Set(['shadow', 'typography']);

// Design value and spec value agree? null = not comparable (reported as skipped, never a mismatch).
export function sameValue(type: string, read: unknown, spec: unknown): boolean | null {
  if (COMPOSITE.has(type)) return null;
  if (read === null || read === undefined) return false;
  if (type === 'color') { const a = hex(read), b = hex(spec); return a && b ? a === b : show(read) === show(spec); }
  if (type === 'fontFamilies') return fam(read) === fam(spec);
  if (type === 'cubicBezier') return bezier(read) === bezier(spec);
  const a = num(read), b = num(spec);
  if (a !== null && b !== null) return Math.abs(a - b) < 0.01;
  return show(read).trim() === show(spec).trim();
}

export interface Readback { hash?: string; file?: string; themes?: Record<string, Record<string, unknown> | undefined> }
export interface Mismatch { token: string; mode: string; design: unknown; spec: unknown }
export interface CompareResult { hash: string; stale: unknown; compared: number; skipped: number; mismatches: Mismatch[] }

export async function compareReadback(root: string, readback: Readback | null | undefined): Promise<CompareResult> {
  const payload = await tokenPayload(root);
  const all = await loadAll(root);
  const brand = parseJson<BrandConfig>(await readFile(join(root, 'brand.config.json'), 'utf8'));
  const mismatches: Mismatch[] = [];
  let compared = 0, skipped = 0;
  const missing: string[] = [];
  for (const combo of comboList(payload)) {
    const read = readback?.themes?.[combo.key];
    if (!read) { missing.push(combo.key); continue; }
    const mode = (combo.themes.find((t) => t.group === 'Mode')?.name ?? '').toLowerCase();
    const label = combo.themes.length === 1 ? mode : combo.key;
    const map = comboMap(root, all, brand, combo.themes, mode);
    const sets = [...new Set(combo.themes.flatMap((t) => t.sets))];
    for (const s of payload.sets.filter((x) => sets.includes(x.name))) {
      for (const t of s.tokens) {
        if (read[t.name] === undefined && s.name.startsWith('foundation/')) { skipped++; continue; }
        const r = resolve(map, t.name);
        const spec = t.type === 'typography' ? null : r.error ? null : r.value;
        const ok = sameValue(t.type, read[t.name], spec);
        if (ok === null || spec === null) { skipped++; continue; }
        compared++;
        if (!ok) mismatches.push({ token: t.name, mode: label, design: read[t.name] ?? null, spec });
      }
    }
  }
  for (const key of missing) mismatches.push({ token: '(theme)', mode: key.includes(' | ') ? key : key.toLowerCase(), design: null, spec: `theme combination "${key}"` });
  return { hash: payload.hash, stale: readback?.hash && readback.hash !== payload.hash, compared, skipped, mismatches };
}
