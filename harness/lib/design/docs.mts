// Doc blueprints for the design file: spec/design-docs.json + the spec -> data a design adapter renders.
// Every value comes from the harness (tokens, brand.config, contracts). Readable view: docs/design-docs/.
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { modeNames } from '../../standards/resolve.mjs';
import { loadAll, resolve, tokensForMode } from '../tokens.mjs';
import { DOCS_FILE, docTokenPaths, loadDesignDocs, textStyleOf, type DesignDocsSpec, type DocBatch, type DocPage, type DocShell } from '../design-docs.mjs';
import { foundationsData, type FoundationPages } from './verify.mjs';
import { resolvedValue, tokenPayload } from './tokens.mjs';
import { contractOf } from './components.mjs';
import { libraryModel, type LayerNode, type LibraryModel } from './library.mjs';
import { loadApi, withSets } from '../api.mjs';
import { parseJson, show as str } from '../files.mjs';
import type { DocBlueprint, DocCard, DocSection, DocTreeNode, TableCard, TagsCard } from './doc-text.mjs';
import type { Part } from '../../../generated/types/contract.js';
import type { BrandConfig } from '../../../generated/types/brand-config.js';
import type { HarnessConfigJson } from '../../../generated/types/harness-config.js';

const readJson = async <T,>(root: string, p: string): Promise<T> => parseJson<T>(await readFile(join(root, p), 'utf8'));
const designDocs = (root: string): DesignDocsSpec => {
  const spec = loadDesignDocs<DesignDocsSpec>(root);
  if (!spec) throw new Error(`${DOCS_FILE} is missing or not valid JSON.`);
  return spec;
};

type TableRow = TableCard['rows'][number];
type TagItem = TagsCard['items'][number];
interface DocContext { modes: { mode: string; theme: string }[]; brand: BrandConfig }
type FoundationDocs = { [K in keyof FoundationPages]: (d: FoundationPages[K], ctx: DocContext) => DocBlueprint };

// Doc content, as data a renderer draws. Card types: instruction (lines), specimen (items), table (columns and rows).
// Items: swatch, text, bar, radius, shadow, square, line, opacity. A cell or item with `mode` shows that mode of the
// theme axis that owns its token, so a table can show Light and Dark side by side.
const last = (path: string) => path.split('.').pop();
const show = (v: unknown) => (Array.isArray(v) ? `cubic-bezier(${v.join(', ')})` : String(v));
const FOUNDATION_DOCS: FoundationDocs = {
  color: (d, ctx) => ({
    name: 'Color',
    link: 'brand.config.json (color) and spec/tokens/semantic',
    definition: `Foundation ramps, then the semantic roles in every mode (${ctx.modes.map((m) => m.theme).join(', ')}) side by side, then the declared contrast pairs with their ratio per mode.`,
    sections: [
      { title: 'Ramps', cards: d.ramps.map((r) => ({ type: 'specimen', span: [1, 1], title: r.ramp, perRow: Math.max(...d.ramps.map((x) => x.tokens.length)), items: r.tokens.map((token) => ({ kind: 'swatch', token, label: last(token) })) })) },
      { title: 'Semantic roles', cards: [{ type: 'table', span: [1, 1], columns: ['Role', ...ctx.modes.map((m) => m.theme)], rows: d.semantic.map((s): TableRow => [{ text: s.name }, ...ctx.modes.map((m) => ({ kind: 'swatch', token: s.name, mode: m.mode, caption: `${str(s.values[m.mode] ?? '-')} . ${s.aliases[m.mode] ?? ''}` }))]) }] },
      { title: 'Contrast pairs', cards: [{ type: 'table', span: [1, 1], columns: ['Pair', ...ctx.modes.map((m) => m.theme)], rows: d.contrast.map((p): TableRow => [{ text: `${p.fg} on ${p.bg} (${str(p.kind)})` }, ...ctx.modes.map((m) => ({ kind: 'pair', fg: p.fg, bg: p.bg, mode: m.mode, caption: `${str(p.ratios[m.mode])}:1` }))]) }] },
    ],
  }),
  typography: (d, ctx) => {
    type Style = FoundationPages['typography']['styles'][number];
    const group = (name: string) => (name.includes('heading') ? 'Heading' : name.includes('control') ? 'Control' : 'Text');
    const size = (s: Style | undefined) => parseFloat(String(s?.size)) || 0;
    const groups: Record<string, Style[]> = {};
    for (const s of [...d.styles].sort((a, b) => size(b) - size(a))) (groups[group(s.name)] ??= []).push(s);
    return {
      name: 'Typography',
      link: 'brand.config.json (typography) and spec/tokens/semantic',
      definition: `One sample per text role, each on its text style. Family ${ctx.brand.typography?.family ?? ''}, base size ${str(ctx.brand.typography?.baseSize ?? '')}, scale ${str(ctx.brand.typography?.scale ?? '')}.`,
      sections: Object.entries(groups).sort(([, a], [, b]) => size(b[0]) - size(a[0])).map(([title, styles]) => ({ title, cards: [{ type: 'specimen', span: [1, 1], perRow: 1, items: styles.map((s) => ({ kind: 'text', style: s.name, text: 'The quick brown fox jumps over the lazy dog', caption: `${str(last(s.name))} . ${s.size} / ${s.lineHeight}${s.weight ? ` . ${str(s.weight)}` : ''}` })) }] })),
    };
  },
  spacing: (d) => ({
    name: 'Spacing',
    link: 'brand.config.json (spacing, density) and spec/tokens/semantic',
    definition: 'Each bar is as wide as its token. Inset tokens pad surfaces, stack tokens separate siblings; control tokens follow the Density mode.',
    sections: [
      { title: 'Inset and stack', cards: [{ type: 'specimen', span: [1, 1], perRow: 1, items: d.tokens.map((t) => ({ kind: 'bar', token: t.name, caption: `${t.name} . ${str(t.value)}` })) }] },
      { title: 'Controls (Density)', cards: [{ type: 'specimen', span: [1, 1], perRow: 1, items: d.control.map((t) => ({ kind: 'bar', token: t.name, caption: `${t.name} . ${str(t.value)}` })) }] },
    ],
  }),
  radius: (d) => ({
    name: 'Radius',
    link: 'brand.config.json (radius) and spec/tokens/semantic',
    definition: 'Each sample has its corners bound to the token. Flip the Shape mode and they change.',
    sections: [
      { title: 'Roles', cards: [{ type: 'specimen', span: [1, 1], perRow: 6, items: [...d.tokens].sort((a, b) => parseFloat(String(a.value)) - parseFloat(String(b.value))).map((t) => ({ kind: 'radius', token: t.name, label: last(t.name), caption: t.value })) }] },
      { title: 'Scale', cards: [{ type: 'specimen', span: [1, 1], perRow: 7, items: d.scale.map((t) => ({ kind: 'radius', token: t.name, label: last(t.name), caption: t.value })) }] },
    ],
  }),
  elevation: (d) => ({
    name: 'Elevation',
    link: 'brand.config.json (elevation) and spec/tokens/semantic',
    definition: 'Each card takes its elevation style; every shadow field (color, offsets, blur, spread) is bound to a variable.',
    sections: [{ cards: [{ type: 'specimen', span: [1, 1], perRow: 4, surface: true, items: d.tokens.map((t) => ({ kind: 'shadow', token: t.name, label: last(t.name) })) }] }],
  }),
  other: (d) => ({
    name: 'Other foundations',
    link: 'spec/tokens/semantic',
    definition: 'Border widths, opacity, icon sizes, motion and layers. Samples are bound to their token; motion and layers are listed with their values (nothing in a design file binds them).',
    sections: [
      { title: 'Border width', cards: [{ type: 'specimen', span: [1, 1], perRow: 6, items: d.border.map((t) => ({ kind: 'line', token: t.name, caption: `${t.name} . ${str(t.value)}` })) }] },
      { title: 'Opacity', cards: [{ type: 'specimen', span: [1, 2], perRow: 2, items: d.opacity.map((t) => ({ kind: 'opacity', token: t.name, caption: `${t.name} . ${str(t.value)}` })) }] },
      { title: 'Icon sizes', cards: [{ type: 'specimen', span: [1, 2], perRow: 4, items: d.icons.map((t) => ({ kind: 'square', token: t.name, caption: `${str(last(t.name))} . ${str(t.value)}` })) }] },
      { title: 'Motion and layers', cards: [
        { type: 'table', span: [1, 2], columns: ['Motion', 'Value'], rows: d.motion.map((t): TableRow => [{ text: t.name }, { text: show(t.value) }]) },
        { type: 'table', span: [1, 2], columns: ['Layer', 'z-index'], rows: d.layers.map((t): TableRow => [{ text: t.name }, { text: show(t.value) }]) },
      ] },
    ],
  }),
};

// A page entry with perBatch becomes one page per batch ("Components . <batch title>"), in batch order (pages.md).
export const batchPageName = (base: string, batch: Pick<DocBatch, 'title'>) => `${base} · ${batch.title}`;
export function expandPages(spec: Pick<DesignDocsSpec, 'pages' | 'batches'>): DocPage[] {
  return spec.pages.flatMap((p) => (p.perBatch ? (spec.batches ?? []).map((b) => ({ name: batchPageName(p.name, b), flow: p.flow })) : [p]));
}
// The page that holds a component's doc: the page of the batch that lists it.
export function componentPage(spec: Pick<DesignDocsSpec, 'pages' | 'batches'>, name: string): string {
  const base = spec.pages.find((p) => p.perBatch)?.name ?? 'Components';
  const batch = (spec.batches ?? []).find((b) => b.components.includes(name));
  return batch ? batchPageName(base, batch) : base;
}

// The cfg of one doc script: the shell (tokens), metrics resolved by the harness, the text styles, the doc blueprint.
export async function docsData<D>(root: string, page: string, blueprint: D) {
  const spec = designDocs(root);
  const config = await readJson<HarnessConfigJson>(root, 'harness.config.json');
  const all = await loadAll(root);
  const brand = await readJson<BrandConfig>(root, 'brand.config.json');
  const map = tokensForMode(all, modeNames(brand)[0] ?? null);
  const px = (p: string) => { const r = resolve(map, p); const n = parseFloat(String(resolvedValue(r))); if (r.error || !Number.isFinite(n)) throw new Error(`design-docs: cannot resolve ${p}`); return n; };
  const S: DocShell = spec.shell;
  const docs = config.adapters.design.docs;
  if (!docs) throw new Error('harness.config.json: adapters.design.docs.width is not set.');
  const width = docs.width;
  const columns = px(S.section.columns), gutter = px(S.section.gutter), pad = px(S.body.pad);
  const spanWidth = ([a, b]: [number, number]) => { const k = (columns * a) / b; return (((width - 2 * pad - (columns - 1) * gutter) / columns) * k) + (k - 1) * gutter; };
  return {
    shell: S,
    pages: expandPages(spec),
    page,
    doc: blueprint,
    codeFamilies: String(resolvedValue(resolve(map, S.code.family))).split(',').map((f) => f.trim().replace(/^['"]|['"]$/g, '')),
    textStyles: Object.fromEntries(docTokenPaths(spec).filter((p) => p.startsWith('font.size.')).map((p) => [p, textStyleOf(p)])),
    px: {
      width, columns, gutter,
      docPad: pad, codeGap: px(S.code.gap), codeNum: px(S.code.numWidth), line: px(S.matrix.line), matrixPad: px(S.matrix.head.pad), treePad: px(S.tree.node.pad), quarter: spanWidth([1, 4]), patternOpacity: px(S.header.pattern.opacity), cardPad: px(S.cards.specimen.pad), sampleGap: px(S.sample.gap), docGap: px(S.doc.gap),
    },
  };
}

const isFoundationPage = (name: string): name is keyof FoundationPages => Object.hasOwn(FOUNDATION_DOCS, name);

export async function foundationDoc(root: string, name: string): Promise<DocBlueprint> {
  const data = await foundationsData(root, [name]);
  const brand = await readJson<BrandConfig>(root, 'brand.config.json');
  const render = <K extends keyof FoundationPages>(page: K): DocBlueprint => {
    const d = data.pages[page];
    if (!d) throw new Error(`No ${page} foundations data.`);
    return FOUNDATION_DOCS[page](d, { modes: data.modes, brand });
  };
  if (!isFoundationPage(name)) throw new Error(`Unknown foundations page: ${name}.`);
  return render(name);
}

// The variant grids of a library set (SB-0089), with cells named like the set's variants (null where excluded).
// Variants: the look axes at rest, the first look axis as rows, the last as columns, the middle ones joined in the row.
// States: one row per value of the first look axis, one column per state value, only that axis changed from Rest.
// With fewer than two look axes the States grid's Rest column already is the Variants grid, so it is not repeated.
type LibraryAxes = Pick<LibraryModel, 'axes' | 'skip' | 'title'>;
type Picks = Record<string, string>;
export interface MatrixGrid { title: string; preview?: undefined; rowLabel: string; cols: string[]; rows: { label: string; cells: (string | null)[] }[] }
export interface PreviewGrid { title: string; preview: true; items: string[] }
const DOC_STATE_AXES = new Set(['State', 'Disabled', 'Validation', 'Selected', 'Indeterminate', 'Open']);
export function variantGrids(L: LibraryAxes): (MatrixGrid | PreviewGrid)[] {
  const order = L.axes.reduce<Picks[]>((acc, a) => acc.flatMap((c) => a.values.map((v) => ({ ...c, [a.name]: v }))), [{}]);
  const nameOf = (o: Picks) => L.axes.map((a) => `${a.name}=${o[a.name] ?? a.values[0]}`).join(', ') || L.title;
  const excluded = new Set(L.skip.map((i) => nameOf(order[i] ?? {})));
  const cell = (o: Picks) => { const n = nameOf(o); return excluded.has(n) ? null : n; };
  const look = L.axes.filter((a) => !DOC_STATE_AXES.has(a.name));
  const states = L.axes.filter((a) => DOC_STATE_AXES.has(a.name));
  const combos = (axes: LibraryAxes['axes']) => axes.reduce<Picks[]>((acc, a) => acc.flatMap((c) => a.values.map((v) => ({ ...c, [a.name]: v }))), [{}]);
  const label = (o: Picks) => Object.values(o).join(' . ') || L.title;
  const grids: (MatrixGrid | PreviewGrid)[] = [];
  if (look.length >= 2 || (look.length && !states.length)) {
    const cols = look.length >= 2 ? look.at(-1) : null;
    const rows = combos(cols ? look.slice(0, -1) : look);
    grids.push({ title: 'Variants', rowLabel: (cols ? look.slice(0, -1) : look).map((a) => a.name).join(' . '), cols: cols ? cols.values : [L.title], rows: rows.map((r) => ({ label: label(r), cells: (cols ? cols.values : [null]).map((v) => cell(cols ? { ...r, [cols.name]: String(v) } : r)) })) });
  }
  if (states.length) {
    const columns = [{ label: 'Rest', set: {} }, ...states.flatMap((a) => a.values.slice(1).map((v) => ({ label: a.values.join() === 'False,True' ? a.name : v, set: { [a.name]: v } })))];
    const head = look[0];
    const rows: Picks[] = head ? head.values.map((v) => ({ [head.name]: v })) : [{}];
    grids.push({ title: 'States', rowLabel: look[0]?.name ?? '', cols: columns.map((c) => c.label), rows: rows.map((r) => ({ label: label(r), cells: columns.map((c) => cell({ ...r, ...c.set })) })) });
  }
  if (!grids.length) grids.push({ title: 'Variants', preview: true, items: [nameOf({})] });
  return grids;
}
// The narrowest a drawn variant can be, from its fixed widths, paddings and gaps; text, fill-width layers and nested
// instances count as nothing, so a component that reflows (a field) stays free to take its cell's width.
export function drawnWidth(n: LayerNode, px: (token: string | null | undefined) => number): number {
  if (n.v === 0) return 0;
  const of = (f: string) => n.b.filter(([, x]) => x === f).map(([t]) => px(t));
  const fixed = [...of('w'), ...of('wh')];
  if (fixed.length) return Math.max(...fixed);
  const kids = (n.kids ?? []).filter((k) => !k.abs).map((k) => drawnWidth(k, px));
  const inner = n.d === 'c' ? Math.max(0, ...kids) : kids.reduce((a, b) => a + b, 0) + (of('gap')[0] ?? 0) * Math.max(0, kids.length - 1);
  return Math.max(...of('minw'), 2 * (of('padx')[0] ?? 0) + (of('padl')[0] ?? 0) + inner);
}
const allVariants = (L: LibraryAxes) => L.axes.reduce<string[][]>((acc, a) => acc.flatMap((c) => a.values.map((v) => c.concat(`${a.name}=${v}`))), [[]]).filter((_, i) => !L.skip.includes(i)).map((c) => c.join(', ') || L.title);

// The class members of a component's source files that set roles, aria-* or tabindex, verbatim with their leading
// comments, so the doc shows how its accessibility is really implemented (a composite sets most of it in its element files).
const A11Y_SOURCE = /\baria-|\baria[A-Z]|\brole\b|tabindex|tabIndex/;
export async function a11ySource(root: string, name: string): Promise<{ path: string; lines: string[] }[]> {
  const dir = `src/components/${name}`;
  const files = (await readdir(join(root, dir)).catch((): string[] => [])).filter((f) => f.endsWith('.ts') && !/\.(stories|styles|d)\.ts$/.test(f) && f !== 'index.ts').sort();
  const out: { path: string; lines: string[] }[] = [];
  for (const f of files) {
    const lines = (await readFile(join(root, dir, f), 'utf8')).split('\n');
    const picked: string[] = [];
    let comments: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';
      if (/^ {2}\/\//.test(line)) { comments.push(line); continue; }
      if (!/^ {2}\S/.test(line) || /^ {2}\}/.test(line)) { comments = []; continue; }
      let end = i;
      if (!/;\s*$/.test(line)) { end = lines.findIndex((l, j) => j > i && /^ {2}\};?$/.test(l)); if (end < 0) { comments = []; continue; } }
      const body = lines.slice(i, end + 1);
      if (body.some((l) => A11Y_SOURCE.test(l))) picked.push(...(picked.length ? [''] : []), ...[...comments, ...body].map((l) => l.slice(2)));
      comments = [];
      i = end;
    }
    if (picked.length) out.push({ path: `${dir}/${f}`, lines: picked });
  }
  return out;
}

// Where each accessibility attribute sits in the source lines: [line, start, end], highlighted by every renderer.
const A11Y_MARK = /\baria-[a-z]+|\baria[A-Z][A-Za-z]*|\brole\b|\btabindex\b|\btabIndex\b/g;
export const a11yMarks = (lines: string[]): number[][] => lines.flatMap((l, i) => [...l.matchAll(A11Y_MARK)].map((m) => [i, m.index, m.index + m[0].length]));

// The doc of a component, read from its library set (variants) and its contract: anatomy as a tree, accessibility, and
// the tokens as tags grouped by category (spec.shell.tokenGroups). Element sets of the component are drawn in its doc.
export async function componentDoc(root: string, name: string): Promise<DocBlueprint> {
  const c = await contractOf(root, name);
  const spec = loadDesignDocs<DesignDocsSpec>(root);
  const L = await libraryModel(root, name);
  const a11y = c.accessibility ?? {};
  const sections: DocSection[] = [];

  const map = tokensForMode(await loadAll(root), modeNames(await readJson<BrandConfig>(root, 'brand.config.json'))[0] ?? null);
  const px = (t: string | null | undefined) => { const own = c.tokens?.[String(t)]; const p = (/^\{(.+)\}$/.exec(str(own ?? '')) ?? [])[1]; const n = parseFloat(String(p ? resolvedValue(resolve(map, p)) : own)); return Number.isFinite(n) ? n : 0; };
  const widthOf = new Map(L.variants.map((v): [string, number] => [Object.entries(v.props).map(([k, x]) => `${k}=${x}`).join(', ') || L.title, drawnWidth(v.tree, px)]));
  for (const g of variantGrids(L)) {
    const minWidth = g.preview ? 0 : Math.max(0, ...g.rows.flatMap((r) => r.cells).filter((n): n is string => Boolean(n)).map((n) => widthOf.get(n) ?? 0));
    sections.push({ title: g.title, cards: [g.preview ? { type: 'preview', span: [1, 1], set: L.title, items: g.items } : { type: 'matrix', span: [1, 1], set: L.title, rowLabel: g.rowLabel, cols: g.cols, rows: g.rows, minWidth }] });
  }
  const elements = withSets(loadApi(root), [name]).slice(1);
  if (elements.length) {
    const cards: DocCard[] = [];
    for (const e of elements) { const E = await libraryModel(root, e); cards.push({ type: 'preview', span: [1, 1], title: E.title, set: E.title, items: allVariants(E) }); }
    sections.push({ title: 'Elements', cards });
  }

  const parts = c.anatomy || [];
  const node = (a: Part): DocTreeNode => ({ name: a.name, tags: [a.role, ...(a.optional ? ['optional'] : []), ...(a.controlledBy ? [`prop: ${a.controlledBy}`] : [])], note: a.notes || '', children: parts.filter((x) => x.parent === a.name).map(node) });
  const roots = parts.filter((a) => !a.parent);
  if (roots.length) sections.push({ title: 'Anatomy', cards: [{ type: 'tree', span: [1, 1], roots: roots.map(node) }] });

  const split = (x: unknown) => { const t = typeof x === 'string' ? x : JSON.stringify(x); const i = t.indexOf(': '); return i > 0 && i < 24 ? { key: t.slice(0, i), value: t.slice(i + 2) } : { key: '', value: t }; };
  const dotted = (group: string, k: string) => (k ? `${group}.${k}` : group);
  const rules: [string, string][] = [['role', String(a11y.role)], ['name-from', String(a11y.accessibleNameSource)]];
  for (const [k, v] of Object.entries(a11y.keyboard ?? {})) rules.push([dotted('keyboard', k), String(v)]);
  for (const r of (a11y.aria ?? []).map(split)) rules.push([dotted('aria', r.key), r.value]);
  const a11yCards: DocCard[] = [{ type: 'table', span: [1, 1], columns: ['Rule', 'Contract'], widths: [1, 4], rows: rules.map(([rule, text]): TableRow => [{ text: rule, accent: true }, { text }]) }];
  for (const s of await a11ySource(root, name)) a11yCards.push({ type: 'code', span: [1, 1], title: s.path, source: s.lines, marks: a11yMarks(s.lines) });
  sections.push({ title: 'Accessibility', cards: a11yCards });

  // Fresh projects may not have opted into design-file documentation. The
  // component's contract is still useful as text; show its tokens together.
  // A present but malformed file remains an error rather than being ignored.
  if (!spec && existsSync(join(root, DOCS_FILE))) throw new Error(`${DOCS_FILE} is missing or not valid JSON.`);
  const groups = spec?.shell.tokenGroups ?? [];
  const by = new Map(groups.map((g): [string, TagItem[]] => [g.label, []]));
  const other: TagItem[] = [];
  for (const [token, def] of Object.entries(c.tokens || {})) {
    const target = String(typeof def === 'string' ? def : def?.value ?? '').replace(/[{}]/g, '');
    const g = groups.find((x) => target.startsWith(x.prefix));
    const item = { kind: 'tag', label: token.replace(`${name}.`, ''), value: target, ...(g?.label === 'Color' ? { token } : {}) };
    ((g && by.get(g.label)) || other).push(item);
  }
  const cards = [...by].filter(([, items]) => items.length).map(([label, items]): DocCard => ({ type: 'tags', span: [1, 2], title: label, items }));
  if (other.length) cards.push({ type: 'tags', span: [1, 2], title: 'Other', items: other });
  if (cards.length) sections.push({ title: 'Tokens', cards });
  return { name: c.component, link: `spec/components/${name}/contract.md`, definition: c.summary, sections };
}

// ---- pages: Guide and Theme matrix

const titleCase = (s: string) => (s[0] ?? '').toUpperCase() + s.slice(1);


// collections: the design tool's own variable collections ({ name, modes, count }), when it has them; else the token sets.
export interface DesignCollection { name: string; modes: string[]; count: number }
export async function guideDoc(root: string, { collections }: { collections?: DesignCollection[] } = {}): Promise<DocBlueprint> {
  const spec = designDocs(root);
  const payload = await tokenPayload(root);
  const brand = await readJson<BrandConfig>(root, 'brand.config.json');
  const pkg = await readJson<{ name: string }>(root, 'package.json');
  const groups = [...new Set(payload.themes.map((t) => t.group))];
  const tokenCount = payload.sets.reduce((n, s) => n + s.tokens.length, 0);
  return {
    name: titleCase(pkg.name),
    link: 'docs/design-docs/README.md',
    definition: `Brand ${brand.name}. Change the source and sync; never edit the docs here.`,
    sections: [
      {
        title: 'How this file works',
        cards: [
          { type: 'instruction', span: [1, 2], title: 'Pages', linkTo: 'page', lines: expandPages(spec).filter((p) => p.name !== '---').map((p) => p.name) },
          { type: 'instruction', span: [1, 2], title: 'Variables', lines: collections
            ? [`${collections.length} collections, ${collections.reduce((n, c) => n + c.count, 0)} variables`, ...collections.map((c) => `${c.name}: ${c.count}${c.modes.length > 1 ? ` (${c.modes.join(', ')})` : ''}`)]
            : [`${payload.sets.length} sets, ${tokenCount} tokens`, ...[...new Set(payload.sets.map((s) => s.name.split('/')[0]))].map((g) => `${g}/*`)] },
        ],
      },
      {
        title: 'Switch the theme',
        cards: [
          { type: 'instruction', span: [1, 2], title: 'Theme axes', lines: collections ? collections.filter((c) => c.modes.length > 1).map((c) => `${c.name}: ${c.modes.join(', ')}`) : groups.map((g) => `${g}: ${payload.themes.filter((t) => t.group === g).map((t) => t.name).join(', ')}`) },
          { type: 'instruction', span: [1, 2], title: 'How', lines: ['Select a frame or a page; in the right panel pick one mode per collection.', 'Modes of different collections combine.', `Combinations: ${groups.map((g) => payload.themes.filter((t) => t.group === g).length).join(' x ')} = ${groups.reduce((n, g) => n * payload.themes.filter((t) => t.group === g).length, 1)}`] },
        ],
      },
    ],
  };
}

// The Theme matrix: a Live column (no mode pinned) and the corner combinations (every theme axis at its first and last
// value), one row per drawn set showing its representative variants: the first non-state axis varied (at most
// MATRIX_CELLS), every other axis at its first value (Rest, False, None).
export interface ThemeMatrixDoc { name: string; link: string; definition: string; columns: { name: string; modes: Record<string, string | undefined> }[]; rows: { title: string; cells: string[] }[] }
const STATE_AXES = new Set(['State', 'Disabled', 'Validation']);
const MATRIX_CELLS = 6;
export async function themeMatrixDoc(root: string, names: string[]): Promise<ThemeMatrixDoc> {
  const payload = await tokenPayload(root);
  const groups = [...new Set(payload.themes.map((t) => t.group))];
  const ends = groups.map((g) => { const v = payload.themes.filter((t) => t.group === g).map((t) => t.name); return [...new Set([v[0], v.at(-1)])]; });
  const corners = ends.reduce<Record<string, string | undefined>[]>((acc, vals, i) => acc.flatMap((c) => vals.map((v) => ({ ...c, [String(groups[i])]: v }))), [{}]);
  const columns = [{ name: 'Live', modes: {} }, ...corners.map((modes) => ({ name: Object.values(modes).join(' . '), modes }))];
  const rows: ThemeMatrixDoc['rows'] = [];
  for (const name of names) {
    const L = await libraryModel(root, name);
    const order = L.axes.reduce<[string, string][][]>((acc, a) => acc.flatMap((c) => a.values.map((v) => c.concat([[a.name, v]]))), [[]]).filter((_, i) => !L.skip.includes(i));
    const varied = L.axes.find((a) => !STATE_AXES.has(a.name))?.name;
    const cells = order.filter((c) => c.every(([k, v]) => k === varied || v === L.axes.find((a) => a.name === k)?.values[0])).slice(0, MATRIX_CELLS).map((c) => c.map(([k, v]) => `${k}=${v}`).join(', ') || L.title);
    rows.push({ title: L.title, cells });
  }
  const total = groups.reduce((n, g) => n * payload.themes.filter((t) => t.group === g).length, 1);
  return {
    name: 'Theme matrix', link: 'docs/design-docs/themes.md',
    definition: `Every library set under the ${corners.length} corner combinations of ${groups.join(', ')} (of ${total}), each cell pinned to its modes. The Live column follows the page: flip its modes to see any other combination.`,
    columns, rows,
  };
}
