// Pattern docs for the design file, tool-neutral: src/patterns/<kit>/pattern.json (summary, landmarks, a11y, states and the
// layout of each state) -> the doc blueprint a design adapter draws. The layout names components by their spec name,
// props by the API vocabulary and tokens by their semantic path; this resolves them to library sets and variants.
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseJson, show } from '../files.mjs';
import { loadIcons } from '../icons.mjs';
import { libraryModel } from './library.mjs';
import type { LibraryModel } from './library.mjs';
import type { DocBlueprint, DocSection, ScreenBox, ScreenCard, ScreenNode, ScreenWidth } from './doc-text.mjs';

export interface LayoutNode {
  use?: string; stack?: LayoutNode[]; row?: LayoutNode[]; rule?: boolean;
  text?: string | Record<string, string>; style?: string; color?: string;
  component?: string; axes?: Record<string, string>; props?: Record<string, unknown>; show?: Record<string, string | boolean>; hide?: string[]; clear?: string[]; slots?: Record<string, LayoutNode[]>;
  icons?: Record<string, string>;
  width?: ScreenWidth; align?: string; gap?: string; pad?: string; fill?: string; radius?: string; wrap?: boolean; surface?: boolean; height?: string; ratio?: string | number | null;
}
export interface PatternJson {
  name: string; summary: string; components?: string[]; landmarks: string[]; a11y: string[]; states: string[];
  layout?: { screen: ScreenBox; parts?: Record<string, LayoutNode>; states?: Record<string, LayoutNode[]> };
}

export const PATTERNS_DIR = 'src/patterns';
export const PATTERNS_PAGE = 'Patterns';

const norm = (s: unknown): string => String(s).toLowerCase().replace(/[\s_-]+/g, '');
const label = (s: string): string => s.split('-').map((w, i) => (i ? w : (w[0] ?? '').toUpperCase() + w.slice(1))).join(' ');

export async function patternIds(root: string): Promise<string[]> {
  const entries = await readdir(join(root, PATTERNS_DIR), { withFileTypes: true }).catch(() => []);
  return entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
}

export const patternOf = async (root: string, id: string): Promise<PatternJson> => parseJson<PatternJson>(await readFile(join(root, PATTERNS_DIR, id, 'pattern.json'), 'utf8'));

// The Figma variant name of a component for the layout's props, every other axis at its first value.
export function variantOf(L: Pick<LibraryModel, 'title' | 'axes'>, props: Record<string, unknown> = {}): string {
  const unknown = Object.keys(props).filter((k) => !L.axes.some((a) => norm(a.name) === norm(k)));
  if (unknown.length) throw new Error(`${L.title}: no axis for ${unknown.join(', ')} (axes: ${L.axes.map((a) => a.name).join(', ') || 'none'})`);
  const picks = L.axes.map((a) => {
    const want = Object.entries(props).find(([k]) => norm(k) === norm(a.name))?.[1];
    if (want === undefined) return `${a.name}=${a.values[0]}`;
    const value = a.values.find((v) => norm(v) === norm(want));
    if (!value) throw new Error(`${L.title}: ${a.name} has no value ${show(want)} (${a.values.join(', ')})`);
    return `${a.name}=${value}`;
  });
  return picks.join(', ') || L.title;
}

const ratioOf = (r: LayoutNode['ratio']): number | null => { if (r == null) return null; const [w, h] = String(r).split('/').map(Number); return (w ?? NaN) / (h || 1); };

async function resolve(root: string, node: LayoutNode, parts: Record<string, LayoutNode>, cache: Map<string, LibraryModel>): Promise<ScreenNode> {
  if (node.use) {
    const part = parts[node.use];
    if (!part) throw new Error(`layout: no part "${node.use}"`);
    return resolve(root, part, parts, cache);
  }
  const kids = async (list: LayoutNode[] | undefined) => Promise.all((list ?? []).map((n) => resolve(root, n, parts, cache)));
  const box = { width: node.width ?? 'hug', align: node.align ?? 'start', gap: node.gap ?? null, pad: node.pad ?? null, fill: node.fill ?? null, radius: node.radius ?? null, wrap: node.wrap ?? false, surface: node.surface ?? false, height: node.height ?? null };
  if (node.stack || node.row) return { kind: node.stack ? 'stack' : 'row', ...box, ...(node.rule ? { rule: true } : {}), children: await kids(node.stack ?? node.row) };
  if (node.text !== undefined && !node.component) return { kind: 'text', text: node.text, style: node.style, color: node.color, width: box.width };
  if (node.component) {
    let L = cache.get(node.component);
    if (!L) { L = await libraryModel(root, node.component); cache.set(node.component, L); }
    const model = L;
    const [known, extra] = [Object.entries(node.axes ?? {}).filter(([k]) => model.axes.some((a) => norm(a.name) === norm(k))), Object.entries(node.axes ?? {}).filter(([k]) => !model.axes.some((a) => norm(a.name) === norm(k)))];
    const slots: Record<string, ScreenNode[]> = {};
    for (const [name, list] of Object.entries(node.slots ?? {})) slots[name] = await kids(list);
    const registered = loadIcons(root).icons;
    const unknownIcons = Object.values(node.icons ?? {}).filter((i) => !registered[i]);
    if (unknownIcons.length) throw new Error(`${L.title}: icon ${unknownIcons.join(', ')} is not in spec/icons.json (sketchbook icons add)`);
    // Icon sets are drawn as "<category> / <icon>" (sketchbook sync icons).
    const icons = node.icons ? Object.fromEntries(Object.entries(node.icons).map(([layer, i]) => [layer, `${registered[i]?.category} / ${i}`])) : null;
    return { kind: 'component', component: node.component, set: L.title, variant: variantOf(L, { ...node.props, ...Object.fromEntries(known) }) + extra.map(([k, v]) => `, ${k}=${v}`).join(''), text: node.text ?? {}, show: node.show ?? {}, hide: node.hide ?? [], clear: node.clear ?? [], ...(icons ? { icons } : {}), slots, width: box.width, height: box.height, ratio: ratioOf(node.ratio) };
  }
  throw new Error(`layout: unknown node ${JSON.stringify(node).slice(0, 80)}`);
}

export async function patternDoc(root: string, id: string): Promise<DocBlueprint> {
  const p = await patternOf(root, id);
  const cache = new Map<string, LibraryModel>();
  const L = p.layout;
  if (!L) throw new Error(`${id}: pattern.json has no layout`);
  const screens: (ScreenCard & { state: string })[] = [];
  for (const state of p.states) {
    const layout = L.states?.[state];
    if (!layout) throw new Error(`${id}: layout has no state "${state}"`);
    screens.push({ type: 'screen', span: [1, 1], state: label(state), screen: { fill: L.screen.fill, pad: L.screen.pad, align: L.screen.align ?? 'start' }, children: await Promise.all(layout.map((n) => resolve(root, n, L.parts ?? {}, cache))) });
  }
  const used = [...new Set(screens.flatMap((s) => collect(s.children)))];
  const sections: DocSection[] = screens.map((s) => ({ title: s.state, cards: [s] }));
  sections.push({ title: 'Components', cards: [{ type: 'tags', span: [1, 1], items: used.map((set) => ({ kind: 'tag', label: set })) }] });
  sections.push({ title: 'Landmarks', cards: [{ type: 'instruction', span: [1, 1], lines: p.landmarks }] });
  sections.push({ title: 'Accessibility', cards: [{ type: 'instruction', span: [1, 1], lines: p.a11y }] });
  return { name: p.name, link: `${PATTERNS_DIR}/${id}/README.md`, definition: p.summary, sections };
}

const collect = (nodes: ScreenNode[]): string[] => nodes.flatMap((n) => (n.kind === 'component' ? [n.set, ...Object.values(n.slots).flatMap(collect)] : n.kind !== 'text' ? collect(n.children) : []));
