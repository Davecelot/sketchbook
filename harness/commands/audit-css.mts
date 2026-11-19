// sketchbook audit-css <path|glob>... (starter from-codebase, SB-0046): reads an existing product's CSS/SCSS and proposes
// foundations from the values it repeats. Deterministic: same files, same bytes. A proposal only, written to
// generated/import/codebase.proposal.json; nothing in brand.config.json or spec/ changes until a person applies it
// using the foundations workflow.
//   colors   clustered by OKLCH distance (greedy, most used first; ΔE_ok < 0.03 joins a cluster)
//   type     font-size values in px (rem/em x 16), counted; base = most used between 12 and 20 px
//   spacing  margin/padding/gap/inset values in px; base grid = the largest of 2/4/8 that fits most of them
//   radius, shadows: distinct values, counted
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, isAbsolute } from 'node:path';
import postcss from 'postcss';
import type { Node as CssNode, Rule } from 'postcss';
import postcssScss from 'postcss-scss';
import { hexToRgb, rgbToOklch, rgbToHex } from '../lib/color.mjs';
import type { Oklch } from '../lib/color.mjs';
import { walk, globToRegExp } from '../lib/files.mjs';
import type { FixError } from './catalog.mjs';

export interface Use { count: number; files: Set<string> }
export interface Counted<K> { value: K; count: number; files: string[] }
export interface ColorCluster {
  value: string;
  count: number;
  oklch: { l: number; c: number; h: number };
  role: 'neutral' | 'hue';
  members: { value: string; count: number }[];
}

export const OUT = 'generated/import/codebase.proposal.json';
const JOIN_DISTANCE = 0.03;
const NAMED: Record<string, string> = { white: '#FFFFFF', black: '#000000' };
const SPACING_PROPS = /^(margin|padding|gap|row-gap|column-gap|inset|top|right|bottom|left)(-|$)/;

// Files for each argument: a file, a folder (every .css/.scss below it) or a glob relative to root.
export function cssFiles(root: string, args: string[]): string[] {
  const out = new Set<string>();
  for (const a of args) {
    const rel = isAbsolute(a) ? relative(root, a) : a.replace(/^\.\//, '');
    if (/[*?]/.test(rel)) {
      const re = globToRegExp(rel);
      const base = rel.slice(0, rel.search(/[*?]/)).replace(/[^/]*$/, '') || '.';
      for (const f of walk(root, base)) if (re.test(f) && /\.s?css$/.test(f)) out.add(f);
    } else if (existsSync(join(root, rel)) && statSync(join(root, rel)).isDirectory()) {
      for (const f of walk(root, rel)) if (/\.s?css$/.test(f)) out.add(f);
    } else if (existsSync(join(root, rel))) out.add(rel);
    else throw Object.assign(new Error(`${a}: no such file, folder or match`), { fix: 'Pass CSS files, a folder or a glob such as "src/**/*.css".' }) satisfies FixError;
  }
  return [...out].sort();
}

const toHex = (raw: string): string | null => {
  const v = raw.toLowerCase();
  const named = NAMED[v];
  if (named) return named;
  let m = /^#([0-9a-f]{3})$/.exec(v);
  if (m) return `#${(m[1] ?? '').split('').map((c) => c + c).join('')}`.toUpperCase();
  m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/.exec(v);
  if (m) return `#${m[1]}`.toUpperCase();
  m = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/.exec(v);
  if (m) return rgbToHex({ r: Number(m[1]) / 255, g: Number(m[2]) / 255, b: Number(m[3]) / 255 });
  return null;
};
const COLOR_RE = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|\b(?:white|black)\b/g;
const toPx = (n: number, unit: string | undefined): number | null => (unit === 'px' || unit === '' ? n : unit === 'rem' || unit === 'em' ? n * 16 : null);
const LENGTH_RE = /(-?\d*\.?\d+)(px|rem|em)\b/g;
const round = (n: number, d = 2): number => Math.round(n * 10 ** d) / 10 ** d;
const count = <K,>(map: Map<K, Use>, key: K, file: string): void => { const e = map.get(key) ?? { count: 0, files: new Set<string>() }; e.count++; e.files.add(file); map.set(key, e); };
const byUse = <K,>(a: [K, Use], b: [K, Use]): number => b[1].count - a[1].count || String(a[0]).localeCompare(String(b[0]), 'en', { numeric: true });

function oklabDistance(a: Oklch, b: Oklch): number {
  const ab = (o: Oklch): [number, number, number] => [o.L, o.C * Math.cos((o.H * Math.PI) / 180), o.C * Math.sin((o.H * Math.PI) / 180)];
  const [x, y] = [ab(a), ab(b)];
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

const isRule = (node: CssNode | undefined): node is Rule => node?.type === 'rule';
const ROOT_RULE = (node: CssNode | undefined): boolean => isRule(node) && node.selector.split(',').some((sel) => /^(html|body|:root)$/i.test(sel.trim()));

export function clusterColors(colors: Map<string, Use>): ColorCluster[] {
  const clusters: { value: string; oklch: Oklch; count: number; members: { value: string; count: number }[] }[] = [];
  for (const [hex, use] of [...colors].sort(byUse)) {
    const o = rgbToOklch(hexToRgb(hex));
    const near = clusters.find((c) => oklabDistance(c.oklch, o) < JOIN_DISTANCE);
    if (near) { near.members.push({ value: hex, count: use.count }); near.count += use.count; continue; }
    clusters.push({ value: hex, oklch: o, count: use.count, members: [{ value: hex, count: use.count }] });
  }
  return clusters.map((c) => ({
    value: c.value, count: c.count,
    oklch: { l: round(c.oklch.L, 3), c: round(c.oklch.C, 3), h: round(c.oklch.H || 0, 1) },
    role: c.oklch.C < 0.03 ? 'neutral' : 'hue',
    members: c.members,
  }));
}

function spacingBase(values: [number, Use][]): { base: number; fit: number } {
  const nonzero = values.filter(([v]) => v > 0);
  const total = nonzero.reduce((n, [, u]) => n + u.count, 0) || 1;
  for (const base of [8, 4, 2]) {
    const fit = nonzero.filter(([v]) => v % base === 0).reduce((n, [, u]) => n + u.count, 0) / total;
    if (fit >= 0.8) return { base, fit: round(fit) };
  }
  return { base: 1, fit: 1 };
}

export function auditCss(root: string, args: string[]) {
  const files = cssFiles(root, args);
  if (!files.length) throw Object.assign(new Error('No .css or .scss files found.'), { fix: 'Point audit-css at your product\'s stylesheets.' }) satisfies FixError;
  const colors = new Map<string, Use>(), sizes = new Map<number, Use>(), spaces = new Map<number, Use>(), radii = new Map<number, Use>(), shadows = new Map<string, Use>(), props = new Map<string, Use>(), rootSizes = new Map<number, Use>();
  for (const file of files) {
    const text = readFileSync(join(root, file), 'utf8');
    const ast = file.endsWith('.scss') ? postcssScss.parse(text, { from: file }) : postcss.parse(text, { from: file });
    ast.walkDecls((d) => {
      const prop = d.prop.toLowerCase();
      const value = d.value.trim();
      if (prop.startsWith('--')) count(props, prop, file);
      if (prop === 'box-shadow' || (prop === 'filter' && value.startsWith('drop-shadow'))) { if (value !== 'none') count(shadows, value.replace(/\s+/g, ' '), file); }
      else for (const m of value.matchAll(COLOR_RE)) { const hex = toHex(m[0]); if (hex) count(colors, hex, file); }
      const lengths = [...value.matchAll(LENGTH_RE)].map((m) => toPx(Number(m[1]), m[2])).filter((n): n is number => n !== null).map((n) => round(n));
      if (prop === 'font-size') for (const n of lengths) { count(sizes, n, file); if (ROOT_RULE(d.parent)) count(rootSizes, n, file); }
      if (prop === 'border-radius' || /^border-.*-radius$/.test(prop)) for (const n of lengths) count(radii, n, file);
      if (SPACING_PROPS.test(prop)) for (const n of lengths) count(spaces, Math.abs(n), file);
    });
  }
  const list = <K,>(map: Map<K, Use>): Counted<K>[] => [...map].sort(byUse).map(([value, u]) => ({ value, count: u.count, files: [...u.files].sort() }));
  const colorClusters = clusterColors(colors);
  const hues = colorClusters.filter((c) => c.role === 'hue');
  const typeList = list(sizes);
  // The body size is what html, body or :root set; else the most used readable size, a tie going to the one closest to 16px.
  const readable = typeList.filter((s) => s.value >= 12 && s.value <= 20).sort((a, b) => b.count - a.count || Math.abs(a.value - 16) - Math.abs(b.value - 16) || a.value - b.value);
  const body = list(rootSizes)[0] ?? readable[0];
  const spacingList = [...spaces].sort((a, b) => a[0] - b[0]);
  const grid = spacingBase(spacingList);
  const proposal = {
    $description: 'Proposal from sketchbook audit-css: values your CSS repeats, clustered into candidate foundations. Nothing is applied; review it with the foundations skill (import mode).',
    sources: files,
    colors: { joinDistance: JOIN_DISTANCE, clusters: colorClusters },
    fontSizes: typeList,
    spacing: { base: grid.base, fit: grid.fit, values: list(spaces).sort((a, b) => a.value - b.value) },
    radii: list(radii).sort((a, b) => a.value - b.value),
    shadows: list(shadows),
    customProperties: list(props),
    proposedFoundations: {
      color: hues.length ? { primary: hues[0]?.value, accents: Object.fromEntries(hues.slice(1, 4).map((c, i) => [`accent${i + 1}`, c.value])) } : { primary: 'neutral' },
      typography: { baseSize: body?.value ?? 16, sizes: typeList.map((s) => s.value).sort((a, b) => a - b) },
      spacing: { base: grid.base, steps: [...new Set(spacingList.map(([v]) => round(v / grid.base)))].sort((a, b) => a - b) },
      radius: { values: [...radii.keys()].sort((a, b) => a - b) },
      elevation: { shadows: list(shadows).map((s) => s.value) },
    },
  };
  return proposal;
}

export type CssProposal = ReturnType<typeof auditCss>;

export function writeProposal(root: string, proposal: CssProposal): string {
  mkdirSync(join(root, 'generated/import'), { recursive: true });
  writeFileSync(join(root, OUT), JSON.stringify(proposal, null, 2) + '\n');
  return OUT;
}
