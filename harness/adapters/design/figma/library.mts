// Figma design adapter, library: one contract -> use_figma scripts that draw its component on the Library page.
// <name>.build-N.js builds a chunk of variants (matrix dimensions x State) into a temporary frame; <name>.finish.js
// combines them into one component set, adds the component properties and wires the parts to them, then removes the
// frame. Every look is bound to the Components variables (the contract's own tokens); text takes the text styles and
// shadows the effect styles. Icons are instances of the Icons page, never redrawn.
import { loadIcons } from '../../../lib/icons.mjs';
import { describeComponent } from '../../../lib/design/description.mjs';
import { libraryModel } from '../../../lib/design/library.mjs';
import { contractOf, mdOf } from '../../../lib/design/components.mjs';
import type { DescribedProps } from '../../../lib/design/description.mjs';
import type { LayerNode, LibraryModel } from '../../../lib/design/library.mjs';
import type { Part } from '../../../../generated/types/contract.js';
import { show } from '../../../lib/files.mjs';

// A set name may hold a slash (an element set, field/field-set); its files use a flat stem.
export const stemOf = (name: string): string => name.replace('/', '--');
import { figmaModel } from './variables.mjs';
import { ZERO_RUNTIME, zeroVars } from './zero.mjs';

// A binding resolved to its variable or style ("Collection::Name", undefined when the file model lacks it) and field.
type Ref = [string | undefined, string | null | undefined];
export interface PreppedNode extends Omit<LayerNode, 'b' | 'kids' | 'sp' | 's'> { b: Ref[]; s?: string | null; kids?: PreppedNode[] }
interface PackedNode { p: string; k?: string; d?: string; v?: number; b?: (number | string | null | undefined)[]; kids?: number[]; [key: string]: unknown }
type RefTriple = [part: string, field: string, prop: string];
export interface ScriptFile { file: string; script: string }
export interface ExpectedSet {
  title: string; variants: number; description: string; zero: string[]; axes: LibraryModel['axes']; skip: number[];
  nested: Record<string, string[]>; hashes: number[]; detail: string | null; detailLines: string[] | null | undefined;
  props: [string, string][]; sum: number;
}
export interface LibraryScripts {
  scripts: ScriptFile[]; missing: (string | null | undefined)[]; variants: number; dependsOn: string[]; title: string; description: string;
  lineSets: Map<string, string[]>; expected: ExpectedSet;
}

export const LIBRARY_PAGE = 'Library';
const CHUNK = 40;
const DEFAULT_ICON = 'circle';
// A stacked field has no intrinsic width; this is the width the library sample is drawn at, instances resize it.
const FIELD_WIDTH = 320;
const SAMPLE_HEIGHT = 64;
const HOME_NAME = 'Component library';
const LAYOUT: Record<string, string> = { fill: 'color.muted', radius: 'radius.small', pad: 'space.inset.spacious', gap: 'space.stack.lg' };
const unref = (v: unknown): string | null => /^\{(.+)\}$/.exec(show(v ?? ''))?.[1] ?? null;

// What the verify script reads back from a drawn variant, one line per node, and what the model says it should be.
// Keep FIELDS and the line layout in step with VERIFY below.
export const LINE_FIELDS = ['node', 'type', 'visible', 'fill', 'stroke', 'strokeWeight', 'radius', 'paddingX', 'paddingY', 'gap', 'width', 'height', 'minWidth', 'opacity', 'effect', 'textStyle', 'decoration', 'properties'];
const NODE_TYPE: Record<string, string> = { b: 'FRAME', t: 'TEXT', i: 'INSTANCE', c: 'INSTANCE', e: 'ELLIPSE' };
const SLOT: Record<string, string> = { fill: 'fill', fills: 'fill', stroke: 'stroke', strokeIn: 'stroke', swL: 'strokeWeight', swR: 'strokeWeight', swB: 'strokeWeight', padt: 'paddingY', sw: 'strokeWeight', radius: 'radius', padx: 'paddingX', padl: 'paddingX', pady: 'paddingY', gap: 'gap', h: 'height', len: 'height', w: 'width', minw: 'minWidth', opacity: 'opacity', effect: 'effect' };

export function expectedLines(tree: PreppedNode): { lines: string[]; nested: Record<string, string[]> } {
  const out: string[] = [];
  const nested: Record<string, string[]> = {};
  const walk = (n: PreppedNode, path: string) => {
    const f: Record<string, string> = Object.fromEntries(LINE_FIELDS.slice(3, -1).map((k) => [k, '-']));
    if (n.k !== 'c') {
      for (const [r, field] of n.b) {
        if (!r) continue;
        const slot = SLOT[String(String(field).split(':')[0])];
        if (field === 'wh') { f.width = r; f.height = r; } else if (slot) f[slot] = r;
      }
      if (n.op !== undefined) f.opacity = String(n.op);
    if (n.k === 't') { f.textStyle = n.s ?? '-'; if (n.ul) f.decoration = 'underline'; }
    } else nested[path] = Object.keys(n.pr ?? {});
    const wiring = [n.tp && `characters=${n.tp}`, n.sw && `mainComponent=${n.sw}`, n.sh && `visible=${n.sh}`, n.slot && `slotContentId=${n.slot}`].filter(Boolean).sort().join(',');
    const set = n.k === 'c' ? `pr:${Object.entries(n.pr ?? {}).map(([k, v]) => `${k}=${v}`).join(',')}` : '';
    out.push([path, path === '@' ? 'COMPONENT' : n.slot ? 'SLOT' : NODE_TYPE[String(n.k)], n.v === 0 ? 0 : 1, ...LINE_FIELDS.slice(3, -1).map((k) => f[k]), [wiring, set, n.ex && 'exposed'].filter(Boolean).join(';') || '-'].join('|'));
    for (const k of n.kids ?? []) walk(k, path === '@' ? k.p : `${path}/${k.p}`);
  };
  walk(tree, '@');
  return { lines: out, nested };
}

const orderNames = (axes: LibraryModel['axes'], skip: number[], title: string) => axes.reduce<string[][]>((acc, a) => acc.flatMap((c) => a.values.map((v) => c.concat([`${a.name}=${v}`]))), [[]]).filter((_, i) => !skip.includes(i)).map((c) => c.join(', ') || title);

export async function libraryScripts(root: string, name: string, { detail = null }: { detail?: string | null } = {}): Promise<LibraryScripts> {
  const model = await figmaModel(root);
  const contract = await contractOf(root, name);
  const icons = loadIcons(root).icons;
  const setName = (icon: string) => { const entry = icons[icon]; return entry ? `${entry.category} / ${icon}` : null; };
  const iconFor = (a: Part) => setName(/Lucide's ([a-z-]+) icon/.exec(a.notes ?? '')?.[1] ?? DEFAULT_ICON);
  const L = await libraryModel(root, name, { iconFor, iconSet: setName });

  const varOf = new Map(model.collections.flatMap((c) => c.variables.map((v) => [v.token, `${c.name}::${v.name}`])));
  const textStyle = new Map(model.styles.text.map((t) => [t.token, t.name]));
  const effectStyle = new Map(model.styles.effect.map((e) => [e.token, e.name]));
  const missing = new Set<string | null | undefined>();
  const ref = (token: string | null | undefined, field: string | null | undefined): Ref => {
    if (field === 'effect') { const style = unref(contract.tokens?.[String(token)]); const n = style === null ? undefined : effectStyle.get(style); if (!n) missing.add(token); return [n, field]; }
    const n = token == null ? undefined : varOf.get(token);
    if (!n) missing.add(token);
    return [n, field];
  };
  const iconOf = (icon: string) => setName(icon) ?? (() => { throw Object.assign(new Error(`${name}: no icon "${icon}" in spec/icons.json.`), { fix: 'Name an icon of the registry (sketchbook icons).' }); })();
  // A nested instance's icon swaps (sp, by registry name) join its properties as the icon set's name; build resolves it.
  const prep = ({ sp, ...n }: LayerNode): PreppedNode => ({
    ...n,
    ...(sp ? { pr: { ...n.pr, ...Object.fromEntries(Object.entries(sp).map(([k, icon]) => [k, iconOf(icon)])) } } : {}),
    b: n.b.map(([t, f]) => ref(t, f)),
    s: n.s ? textStyle.get(`text-style.${n.s.replace(/^font\.size\./, '')}${n.ul ? '-underline' : ''}`) ?? (missing.add(n.s), null) : undefined,
    kids: n.kids?.map(prep),
  });
  const variants = L.variants.map((v) => ({ n: Object.entries(v.props).map(([k, x]) => `${k}=${x}`).join(', ') || L.title, tree: prep(v.tree), refs: refsOf(v.tree) }));

  const props: DescribedProps = { text: new Map(), bool: new Map(), swap: new Map() };
  const walk = (n: LayerNode, state: string | undefined) => {
    if (n.tp && !props.text.has(n.tp)) props.text.set(n.tp, n.x);
    if (n.sh && !props.bool.has(n.sh)) props.bool.set(n.sh, Boolean(n.v));
    if (n.sw && !props.swap.has(n.sw)) props.swap.set(n.sw, n.i);
    (n.kids ?? []).forEach((k) => walk(k, state));
  };
  L.variants.forEach((v) => walk(v.tree, v.props.State));

  const description = describeComponent({ contract, md: await mdOf(root, name), name, title: L.title, axes: L.axes, props, designSlots: L.slots });

  const groups = new Map<string, { refs: RefTriple[]; idx: number[] }>();
  variants.forEach((v, i) => {
    const key = JSON.stringify(v.refs);
    let g = groups.get(key);
    if (!g) { g = { refs: v.refs, idx: [] }; groups.set(key, g); }
    g.idx.push(i);
  });

  const layoutVars = Object.fromEntries(Object.entries(LAYOUT).map(([k, t]) => [k, varOf.get(t)]));
  const Z = zeroVars(model);
  const header = (what: string) => `// GENERATED by sketchbook sync library ${name} (${what}). Run with the Figma MCP use_figma tool.\n`;
  const scripts: ScriptFile[] = [];
  for (let i = 0; i < variants.length; i += CHUNK) {
    const R: string[] = [];
    const K: PackedNode[] = [];
    const idx = (r: string) => { let k = R.indexOf(r); if (k < 0) k = R.push(r) - 1; return k; };
    const kidx = (o: PackedNode) => { const s = JSON.stringify(o); let k = K.findIndex((x) => JSON.stringify(x) === s); if (k < 0) k = K.push(o) - 1; return k; };
    const slice = variants.slice(i, i + CHUNK).map(({ n, tree }) => ({ n, tree: pack(tree, idx, kidx) }));
    const cfg = { page: LIBRARY_PAGE, title: L.title, temp: `__build ${L.title}`, fieldWidth: FIELD_WIDTH, sampleHeight: SAMPLE_HEIGHT, R, K, Z, variants: slice, sum: sumOf(JSON.stringify([slice, K, Z])) };
    scripts.push({ file: `${stemOf(name)}.build-${scripts.length + 1}.js`, script: header(`build ${scripts.length + 1}`) + `const cfg = ${lines(cfg)};\n${BUILD}` });
  }
  const finishing = {
    page: LIBRARY_PAGE, title: L.title, temp: `__build ${L.title}`, description, expected: variants.length,
    axes: L.axes, skip: L.skip,
    props: { text: [...props.text], bool: [...props.bool], swap: [...props.swap], slot: L.slots.map((s) => [s.name, s.meaning, s.preferred]) },
    groups: [...groups.values()], layout: layoutVars, Z,
  };
  const finish = { ...finishing, sum: sumOf(JSON.stringify([finishing.axes, finishing.skip, finishing.groups, finishing.props, finishing.description, finishing.Z])) };
  scripts.push({ file: `${stemOf(name)}.finish.js`, script: header('finish') + `const cfg = ${lines(finish)};\n${FINISH}` });
  const nested: Record<string, string[]> = {};
  const lineSets = new Map(variants.map((v) => { const r = expectedLines(v.tree); Object.assign(nested, r.nested); return [v.n, r.lines]; }));
  const order = orderNames(L.axes, L.skip, L.title);
  if (detail && !lineSets.has(detail)) throw Object.assign(new Error(`${name} has no variant "${detail}".`), { fix: `Variants: ${order.slice(0, 3).join(' | ')} ...` });
  const hashes = order.map((n) => sumOf((lineSets.get(n) ?? []).join('\n')));
  const expecting: Omit<ExpectedSet, 'sum'> = {
    title: L.title, variants: variants.length, description, zero: Object.values(Z).filter((z): z is string => Boolean(z)),
    axes: L.axes, skip: L.skip, nested, hashes, detail, detailLines: detail ? lineSets.get(detail) : null,
    props: [...[...props.text.keys()].map((n): [string, string] => [String(n), 'TEXT']), ...[...props.bool.keys()].map((n): [string, string] => [String(n), 'BOOLEAN']), ...[...props.swap.keys()].map((n): [string, string] => [String(n), 'INSTANCE_SWAP']), ...L.slots.map((s): [string, string] => [s.name, 'SLOT'])],
  };
  const expected: ExpectedSet = { ...expecting, sum: sumOf(JSON.stringify([expecting.axes, expecting.skip, expecting.nested, expecting.hashes, expecting.description, expecting.detailLines, expecting.zero])) };
  scripts.push({ file: `${stemOf(name)}.verify.js`, script: header('verify, read-only') + `const cfg = ${JSON.stringify(expected)};\n${VERIFY}` });
  return { scripts, missing: [...missing], variants: variants.length, dependsOn: L.dependsOn, title: L.title, description, lineSets, expected };
}

// One read-only script for many sets: the structure, property and binding checks of each verify script, without the
// descriptions' text: it compares their checksum (sync describe sets the text). Returns one result per set.
export async function verifyAllScript(root: string, names: string[]): Promise<string> {
  const cfgs: unknown[] = [];
  for (const name of names) {
    const { expected } = await libraryScripts(root, name);
    const { description, detail, detailLines, sum, ...cfg } = expected;
    cfgs.push({ ...cfg, descSum: sumOf(description.replace(/\s+/g, ' ').trim()) });
  }
  const body = VERIFY.split('\n').filter((l) => !l.startsWith('const sumOf') && !l.startsWith('if (sumOf(JSON.stringify([cfg.axes'));
  const head = `const CFGS = [\n${cfgs.map((c) => JSON.stringify(c)).join(',\n')}];\nconst SUM = ${sumOf(JSON.stringify(cfgs))};\n${SUM}if (sumOf(JSON.stringify(CFGS)) !== SUM) throw new Error('This script was altered when pasted (checksum mismatch); paste the file exactly.');\nconst runOne = async (cfg) => {\n`;
  const tail = '};\nconst results = [];\nfor (const cfg of CFGS) results.push(await runOne(cfg));\nreturn results.map((r) => ({ title: r.title, ok: r.ok, checked: r.checked, problems: r.problems }));\n';
  return `// GENERATED by sketchbook sync verify-library (${names.length} sets, read-only). Run with the Figma MCP use_figma tool.\n${head}${body.join('\n')}\n${tail}`;
}

const DESCRIBE_CHUNK = 13000;

// Descriptions of sets already on the page, written in place: no rebuild, nothing else touched. One script per ~13 KB.
export async function describeScripts(root: string, names: string[]): Promise<(ScriptFile & { names: string[] })[]> {
  const items: [string, string][] = [];
  for (const name of names) { const r = await libraryScripts(root, name); items.push([r.title, r.description]); }
  const chunks: [string, string][][] = [];
  for (const item of items) {
    const last = chunks[chunks.length - 1];
    if (last && JSON.stringify([...last, item]).length < DESCRIBE_CHUNK) last.push(item); else chunks.push([item]);
  }
  return chunks.map((descriptions, i) => {
    const cfg = { descriptions, sum: sumOf(JSON.stringify(descriptions)) };
    const body = `const cfg = {"descriptions":[\n${descriptions.map((d) => JSON.stringify(d)).join(',\n')}],"sum":${cfg.sum}};\n${DESCRIBE}`;
    return { file: `descriptions-${i + 1}.js`, script: `// GENERATED by sketchbook sync describe (${i + 1} of ${chunks.length}). Run with the Figma MCP use_figma tool.\n${body}`, names: descriptions.map((d) => d[0]) };
  });
}


// One variant (or name) per line: an agent copies short lines exactly, a 20 KB single line it does not.
const lines = (cfg: unknown) => JSON.stringify(cfg).replace(/\},\{"n":/g, '},\n{"n":').replace(/","((?:Variant|State|Size)=)/g, '",\n"$1');

// Smaller to send: bindings as a flat [refIndex, field, ...] list into R, and the common defaults left out (d 'r', v 1).
function pack(n: PreppedNode, idx: (r: string) => number, kidx: (o: PackedNode) => number): PackedNode {
  const out: PackedNode = { p: n.p, k: n.k };
  if (n.d !== 'r') out.d = n.d;
  if (n.v !== 1) out.v = n.v;
  for (const key of (['x', 's', 'i', 'c', 'ring', 'al', 'cal', 'pr', 'grow', 'sq', 'fw', 'fh', 'pw', 'rt', 'abs', 'op', 'hug', 'st', 'ex', 'slot'] satisfies (keyof PreppedNode)[])) if (n[key] !== undefined && n[key] !== null) out[key] = n[key];
  const b = n.b.flatMap(([r, f]) => (r ? [idx(r), f] : []));
  if (b.length) out.b = b;
  if (n.kids?.length) out.kids = n.kids.map((k) => kidx(pack(k, idx, kidx)));
  return out;
}

function refsOf(tree: LayerNode): RefTriple[] {
  const out: RefTriple[] = [];
  const walk = (n: LayerNode) => {
    if (n.tp) out.push([n.p, 'characters', n.tp]);
    if (n.sw) out.push([n.p, 'mainComponent', n.sw]);
    if (n.sh) out.push([n.p, 'visible', n.sh]);
    if (n.slot) out.push([n.p, 'slotContentId', n.slot]);
    (n.kids ?? []).forEach(walk);
  };
  walk(tree);
  return out;
}

// Scripts are pasted into use_figma by an agent; a checksum over the data makes a damaged paste fail before it writes.
const sumOf = (s: string): number => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return h; };
const SUM = `const sumOf = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return h; };
`;

const COMMON = `const report = { built: [], kept: [], errors: [], missing: [] };
const page = figma.root.children.find((p) => p.name === cfg.page);
if (!page) throw new Error('No page "' + cfg.page + '": run sketchbook sync pages first.');
await figma.setCurrentPageAsync(page);
const V = figma.variables;
const cols = Object.fromEntries((await V.getLocalVariableCollectionsAsync()).map((c) => [c.id, c.name]));
const byKey = new Map((await V.getLocalVariablesAsync()).map((v) => [cols[v.variableCollectionId] + '::' + v.name, v]));
const variable = (k) => { const v = byKey.get(k); if (!v) report.missing.push(k); return v; };
const paint = (k) => { const v = variable(k); return v ? [V.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', v)] : []; };
const bindVar = (node, k, fields) => { const v = variable(k); if (v) for (const f of fields) node.setBoundVariable(f, v); };
`;

const BUILD = `${SUM}if (sumOf(JSON.stringify([cfg.variants, cfg.K, cfg.Z])) !== cfg.sum) throw new Error('This script was altered when pasted (checksum mismatch); paste the file exactly.');
${ZERO_RUNTIME}${COMMON}
const textStyles = await figma.getLocalTextStylesAsync();
const effectStyles = await figma.getLocalEffectStylesAsync();
for (const s of textStyles) await figma.loadFontAsync(s.fontName);
const iconsPage = figma.root.children.find((p) => p.name === 'Icons');
await iconsPage.loadAsync();
const iconSet = (name) => iconsPage.findOne((n) => n.type === 'COMPONENT_SET' && n.name === name);
const home = page.children.find((n) => n.type === 'FRAME' && n.name === 'Component library') || page;
const local = (name) => home.children.find((n) => (n.type === 'COMPONENT' || n.type === 'COMPONENT_SET') && n.name.toLowerCase() === name);
let tmp = page.children.find((n) => n.type === 'FRAME' && n.name === cfg.temp);
if (!tmp) { tmp = figma.createFrame(); tmp.name = cfg.temp; tmp.fills = []; tmp.x = 0; tmp.y = 3000; page.appendChild(tmp); }
const PAD = ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'];
const RADII = ['topLeftRadius', 'topRightRadius', 'bottomRightRadius', 'bottomLeftRadius'];
const vectorOf = (n) => n.findOne((x) => x.type === 'VECTOR');
const ZERO_OF = (f) => (/Radius$/.test(f) ? 'radius' : /Weight$/.test(f) ? 'border' : 'space');
const zero = (node, f) => { node[f] = 0; const v = cfg.Z[ZERO_OF(f)]; if (v) bindVar(node, v, [f]); };

const apply = async (node, ring, ref, field) => {
  if (!ref) return;
  if (field === 'effect') { const s = effectStyles.find((e) => e.name === ref); if (s) await node.setEffectStyleIdAsync(s.id); return; }
  if (field === 'fill' || field === 'fills') node.fills = paint(ref);
  else if (field === 'stroke') { node.strokes = paint(ref); node.strokeAlign = ring ? 'OUTSIDE' : 'INSIDE'; node.strokesIncludedInLayout = false; }
  else if (field === 'strokeIn') { node.strokes = paint(ref); node.strokeAlign = 'INSIDE'; node.strokesIncludedInLayout = true; }
  // A stroke bound to a color variable resets its opacity to 1; a hidden paint keeps the binding and stays hidden in instances.
  else if (field === 'strokeTr') node.strokes = node.strokes.map((s) => ({ ...s, visible: false }));
  else if (field.startsWith('fill:')) node.fills = paint(ref).map((p) => ({ ...p, opacity: Number(field.slice(5)) }));
  else if (field === 'swL' || field === 'swR' || field === 'swB') { const keep = { swL: 'strokeLeftWeight', swR: 'strokeRightWeight', swB: 'strokeBottomWeight' }[field]; for (const f of ['strokeTopWeight', 'strokeRightWeight', 'strokeBottomWeight', 'strokeLeftWeight']) if (f !== keep) zero(node, f); bindVar(node, ref, [keep]); }
  else if (field === 'padt') bindVar(node, ref, ['paddingTop']);
  else if (field === 'padb') bindVar(node, ref, ['paddingBottom']);
  else if (field === 'sw') bindVar(node, ref, ['strokeWeight']);
  else if (field === 'radius') bindVar(node, ref, RADII);
  else if (field === 'padx') bindVar(node, ref, ['paddingLeft', 'paddingRight']);
  else if (field === 'pady') bindVar(node, ref, ['paddingTop', 'paddingBottom']);
  else if (field === 'padl') bindVar(node, ref, ['paddingLeft']);
  else if (field === 'gap') bindVar(node, ref, ['itemSpacing']);
  else if (field === 'h') { node.counterAxisSizingMode = 'FIXED'; bindVar(node, ref, ['height']); }
  else if (field === 'wh') { if (node.type !== 'INSTANCE') { node.primaryAxisSizingMode = 'FIXED'; node.counterAxisSizingMode = 'FIXED'; } if (node.parent && node.parent.layoutMode === 'VERTICAL') node.layoutSizingHorizontal = 'FIXED'; bindVar(node, ref, ['width', 'height']); }
  else if (field === 'w') { node.primaryAxisSizingMode = 'FIXED'; if (node.parent && node.parent.layoutMode === 'VERTICAL') node.layoutSizingHorizontal = 'FIXED'; bindVar(node, ref, ['width']); }
  else if (field === 'len') { if (node.layoutMode === 'VERTICAL') node.primaryAxisSizingMode = 'FIXED'; else node.counterAxisSizingMode = 'FIXED'; bindVar(node, ref, ['height']); }
  else if (field === 'half') { const v = variable(ref); if (v) { const px = v.resolveForConsumer(node).value; node.resize(px / 2, px / 2); } }
  else if (field === 'opacity') bindVar(node, ref, ['opacity']);
  else if (field === 'minw') bindVar(node, ref, ['minWidth']);
  else if (field === 'strokeOfVector') { const vec = vectorOf(node); if (vec) vec.strokes = paint(ref); }
};

const make = async (n, root) => {
  let node;
  if (n.k === 't') {
    node = figma.createText();
    const st = textStyles.find((s) => s.name === n.s);
    if (st) await node.setTextStyleIdAsync(st.id); else report.missing.push('text style ' + n.s);
    node.characters = n.x || ''; node.textAutoResize = 'WIDTH_AND_HEIGHT';
  } else if (n.k === 'i' || n.k === 'c') {
    const main = n.k === 'i' ? iconSet(n.i) : local(n.c);
    if (!main) throw new Error('missing ' + (n.i || n.c));
    const comp = main.type === 'COMPONENT_SET' ? main.children.find((c) => c.name === 'Size=default') || main.defaultVariant : main;
    node = comp.createInstance();
    if (n.pr) {
      const props = {};
      for (const [k, v] of Object.entries(n.pr)) {
        const key = Object.keys(node.componentProperties).find((x) => x === k || x.startsWith(k + '#'));
        if (!key) { report.missing.push('property ' + k); continue; }
        if (node.componentProperties[key].type !== 'INSTANCE_SWAP') { props[key] = v; continue; }
        const s = iconSet(v);
        if (s) props[key] = (s.children.find((c) => c.name === 'Size=default') || s.defaultVariant).id; else report.missing.push('icon ' + v);
      }
      node.setProperties(props);
    }
  } else if (n.k === 'e') {
    node = figma.createEllipse(); node.fills = [];
  } else {
    node = root || figma.createAutoLayout(n.d === 'c' ? 'VERTICAL' : 'HORIZONTAL');
    if (root) { node.layoutMode = n.d === 'c' ? 'VERTICAL' : 'HORIZONTAL'; node.primaryAxisSizingMode = 'AUTO'; node.counterAxisSizingMode = 'AUTO'; }
    node.fills = []; node.clipsContent = false;
    node.primaryAxisAlignItems = 'CENTER'; node.counterAxisAlignItems = 'CENTER';
  }
  if (!root) node.name = n.p;
  return node;
};
const post = [];
const build = async (n, ring, parent, root) => {
  const node = await make(n, root);
  if (parent) {
    parent.appendChild(node);
    if (n.ex) node.isExposedInstance = true;
    if (n.abs) { node.layoutPositioning = 'ABSOLUTE'; node.constraints = { horizontal: 'STRETCH', vertical: 'STRETCH' }; }
    if (parent.layoutMode === 'VERTICAL' && !n.abs) {
      node.layoutSizingHorizontal = 'FILL';
      if ('primaryAxisAlignItems' in node && node.layoutMode !== 'NONE') node.primaryAxisAlignItems = 'MIN';
    }
  }
  for (const kid of n.kids || []) await build(typeof kid === 'number' ? cfg.K[kid] : kid, ring, node);
  if (root && n.fw) { node.primaryAxisSizingMode = 'FIXED'; node.resize(cfg.fieldWidth, Math.max(node.height, 1)); }
  if (root && n.fh) { node.counterAxisSizingMode = 'FIXED'; node.resize(Math.max(node.width, 1), cfg.sampleHeight); }
  if (root && n.rt) { node.counterAxisSizingMode = 'FIXED'; node.resize(node.width, node.width / n.rt); }
  if (n.pw) post.push(() => node.resize(node.parent.width * n.pw / 100, node.height));
  const b = n.b || [];
  for (let i = 0; i < b.length; i += 2) await apply(node, n.ring, cfg.R[b[i]], b[i + 1]);
  if (n.al && 'primaryAxisAlignItems' in node) node.primaryAxisAlignItems = n.al === 'max' ? 'MAX' : n.al === 'ctr' ? 'CENTER' : n.al === 'between' ? 'SPACE_BETWEEN' : 'MIN';
  if (n.grow) node.layoutGrow = 1;
  if (n.st && node.parent) { if (node.parent.layoutMode === 'HORIZONTAL') node.layoutSizingVertical = 'FILL'; else node.layoutSizingHorizontal = 'FILL'; }
  for (const k of n.sq || []) zero(node, k);
  if (n.op !== undefined) node.opacity = n.op;
  if (node.type !== 'INSTANCE') for (const c of node.children || []) if (c.layoutPositioning === 'ABSOLUTE') { c.x = 0; c.y = 0; c.resize(node.width, node.height); }
  if (n.cal && 'counterAxisAlignItems' in node) node.counterAxisAlignItems = n.cal === 'min' ? 'MIN' : 'CENTER';
  if (root && n.d === 'c' && !n.hug) { node.resize(cfg.fieldWidth, node.height); node.primaryAxisSizingMode = 'AUTO'; node.counterAxisAlignItems = 'MIN'; }
  node.visible = n.v === undefined ? true : Boolean(n.v);
  return node;
};

for (const v of cfg.variants) {
  if (tmp.children.some((c) => c.name === v.n)) { report.kept.push(v.n); continue; }
  try {
    const comp = figma.createComponent();
    comp.name = v.n;
    tmp.appendChild(comp);
    await build(v.tree, false, null, comp);
    for (const f of post.splice(0)) f();
    await bindZeros(comp);
    report.built.push(v.n);
  } catch (e) { report.errors.push(v.n + ': ' + e.message); }
}
report.temp = tmp.id; report.inTemp = tmp.children.length;
return report;
`;

const VERIFY = `${SUM}if (sumOf(JSON.stringify([cfg.axes, cfg.skip, cfg.nested, cfg.hashes, cfg.description, cfg.detailLines, cfg.zero])) !== cfg.sum) throw new Error('This script was altered when pasted (checksum mismatch); paste the file exactly.');
const FIELDS = ${JSON.stringify(LINE_FIELDS)};
const page = figma.root.children.find((p) => p.name === 'Library');
await figma.setCurrentPageAsync(page);
const home = page.children.find((n) => n.type === 'FRAME' && n.name === 'Component library') || page;
const set = home.children.find((n) => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && n.name === cfg.title);
const problems = [];
if (!set) return { title: cfg.title, ok: false, problems: ['not on the Library page'] };
const same = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
const flat = (s) => String(s || '').replace(/\\s+/g, ' ').trim();
if (cfg.description !== undefined && flat(set.descriptionMarkdown) !== flat(cfg.description)) {
  const a = flat(set.descriptionMarkdown), b = flat(cfg.description);
  let i = 0; while (i < a.length && a[i] === b[i]) i++;
  problems.push('description differs from the generated one at character ' + i + ': "' + a.slice(Math.max(0, i - 20), i + 30) + '" vs "' + b.slice(Math.max(0, i - 20), i + 30) + '"');
}
if (cfg.descSum !== undefined && sumOf(flat(set.descriptionMarkdown)) !== cfg.descSum) problems.push('description differs from the generated one (sketchbook sync describe)');
const V = figma.variables;
const cols = Object.fromEntries((await V.getLocalVariableCollectionsAsync()).map((c) => [c.id, c.name]));
const vname = new Map((await V.getLocalVariablesAsync()).map((v) => [v.id, cols[v.variableCollectionId] + '::' + v.name]));
const tstyle = new Map((await figma.getLocalTextStylesAsync()).map((s) => [s.id, s.name]));
const estyle = new Map((await figma.getLocalEffectStylesAsync()).map((s) => [s.id, s.name]));
const iconsPage = figma.root.children.find((p) => p.name === 'Icons');
if (iconsPage) await iconsPage.loadAsync();
const iconOf = new Map((iconsPage ? iconsPage.findAllWithCriteria({ types: ['COMPONENT_SET'] }) : []).flatMap((s) => s.children.map((c) => [c.id, s.name])));
const prValue = (p) => (p.type === 'INSTANCE_SWAP' ? iconOf.get(p.value) || p.value : p.value);
const nm = (b) => (b ? vname.get(b.id) || '?' + b.id : '-');
const paintVar = (ps) => (Array.isArray(ps) && ps[0] && ps[0].boundVariables && ps[0].boundVariables.color) || null;
const ZV = new Set(cfg.zero || []);
const bv = (n, ...ks) => { for (const k of ks) { const b = n.boundVariables && n.boundVariables[k]; if (b && !ZV.has(vname.get(b.id))) return b; } return null; };
const ZERO_FIELDS = ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'itemSpacing', 'topLeftRadius', 'topRightRadius', 'bottomRightRadius', 'bottomLeftRadius'];
const SIDES = ['strokeTopWeight', 'strokeRightWeight', 'strokeBottomWeight', 'strokeLeftWeight'];
const zeroOk = (n, f) => n[f] !== 0 || !!(n.boundVariables && n.boundVariables[f]);
const zeroIssues = (root) => {
  const out = [];
  const walk = (n, path) => {
    const bound = (fs) => fs.some((f) => n.boundVariables && n.boundVariables[f]);
    if ((n.type === 'FRAME' || n.type === 'COMPONENT') && n.layoutMode && n.layoutMode !== 'NONE') for (const f of ZERO_FIELDS) if (f in n && !zeroOk(n, f)) out.push(path + ' ' + f);
    if (SIDES.every((f) => f in n) && n.strokes && n.strokes.length && bound(SIDES)) for (const f of SIDES) if (!zeroOk(n, f)) out.push(path + ' ' + f);
    if (n.type !== 'INSTANCE' && 'children' in n) for (const c of n.children) walk(c, path === '@' ? c.name : path + '/' + c.name);
  };
  walk(root, '@');
  return out;
};
const linesOf = (root) => {
  const out = [];
  const walk = (n, path) => {
    const refs = Object.entries(n.componentPropertyReferences || {}).map(([f, k]) => f + '=' + String(k).split('#')[0]).sort().join(',');
    const keys = cfg.nested[path];
    const pr = keys ? 'pr:' + keys.map((k) => { const e = Object.entries(n.componentProperties || {}).find(([x]) => x === k || x.startsWith(k + '#')); return k + '=' + (e ? prValue(e[1]) : '?'); }).join(',') : '';
    const look = keys ? Array(14).fill('-') : [nm(paintVar(n.fills)), nm(paintVar(n.strokes)), nm(bv(n, 'strokeWeight', 'strokeTopWeight', 'strokeLeftWeight', 'strokeRightWeight', 'strokeBottomWeight')), nm(bv(n, 'topLeftRadius', 'topRightRadius', 'bottomRightRadius', 'bottomLeftRadius')), nm(bv(n, 'paddingLeft')), nm(bv(n, 'paddingTop')), nm(bv(n, 'itemSpacing')), nm(bv(n, 'width')), nm(bv(n, 'height')), nm(bv(n, 'minWidth')), bv(n, 'opacity') ? nm(bv(n, 'opacity')) : n.opacity !== 1 ? String(Math.round(n.opacity * 100) / 100) : '-', n.effectStyleId ? estyle.get(n.effectStyleId) || '?' : '-', n.type === 'TEXT' ? tstyle.get(n.textStyleId) || '-' : '-', n.type === 'TEXT' && n.textDecoration === 'UNDERLINE' ? 'underline' : '-'];
    out.push([path, n.type, n.visible ? 1 : 0, ...look, [refs, pr, n.type === 'INSTANCE' && n.isExposedInstance ? 'exposed' : ''].filter(Boolean).join(';') || '-'].join('|'));
    if (n.type !== 'INSTANCE' && 'children' in n) for (const c of n.children) walk(c, path === '@' ? c.name : path + '/' + c.name);
  };
  walk(root, '@');
  return out;
};
const product = cfg.axes.reduce((acc, a) => acc.flatMap((c) => a.values.map((v) => c.concat([a.name + '=' + v]))), [[]]);
const order = product.filter((_, i) => !cfg.skip.includes(i)).map((c) => c.join(', ') || cfg.title);
const drawn = new Map((set.type === 'COMPONENT' ? [set] : set.children).map((c) => [set.type === 'COMPONENT' ? cfg.title : c.name, c]));
const differ = [];
order.forEach((n, i) => { const c = drawn.get(n); if (c && sumOf(linesOf(c).join('\\n')) !== cfg.hashes[i]) differ.push(n); });
if (differ.length) problems.push(differ.length + ' of ' + order.length + ' variant(s) differ from the contract tokens, e.g. ' + differ.slice(0, 3).join(' | '));
const unbound = order.flatMap((n) => { const c = drawn.get(n); return c ? zeroIssues(c).map((x) => n + ': ' + x) : []; });
if (unbound.length) problems.push(unbound.length + ' zero value(s) not bound to a zero token, e.g. ' + unbound.slice(0, 3).join(' | '));
const flipped = order.filter((n) => { const c = drawn.get(n); return c && c.children.some((k) => k.layoutPositioning === 'ABSOLUTE' && (k.relativeTransform[0][0] < 0 || k.relativeTransform[1][1] < 0)); });
if (flipped.length) problems.push(flipped.length + ' variant(s) with a flipped absolute layer (drawn outside the variant), e.g. ' + flipped.slice(0, 3).join(' | '));
// Content larger than its variant is cut wherever an instance sits in a clipping parent (a doc card).
const overflowing = order.filter((n) => { const c = drawn.get(n); return c && !c.clipsContent && c.children.some((k) => k.visible && k.layoutPositioning !== 'ABSOLUTE' && Math.max(-k.x, k.x + k.width - c.width, -k.y, k.y + k.height - c.height) > 0.5); });
if (overflowing.length) problems.push(overflowing.length + ' variant(s) whose content overflows the variant frame, e.g. ' + overflowing.slice(0, 3).join(' | '));
let detail = null;
if (cfg.detail && drawn.get(cfg.detail)) {
  const act = linesOf(drawn.get(cfg.detail));
  detail = [];
  cfg.detailLines.forEach((e, i) => { if (e !== act[i]) { const E = e.split('|'), A = (act[i] || '').split('|'); E.forEach((x, k) => { if (x !== A[k]) detail.push(E[0] + ' ' + FIELDS[k] + ': expected ' + x + ', actual ' + A[k]); }); } });
  if (act.length !== cfg.detailLines.length) detail.push('nodes: ' + act.length + ', expected ' + cfg.detailLines.length);
}
const single = set.type === 'COMPONENT';
if (single && (cfg.variants !== 1 || cfg.axes.length)) problems.push('is a single component; the registry expects ' + cfg.variants + ' variant(s)');
const defs = Object.entries(set.componentPropertyDefinitions).map(([k, v]) => ({ name: k.split('#')[0], type: v.type, options: v.variantOptions }));
if (!single && set.children.length !== cfg.variants) problems.push('variants: ' + set.children.length + ', expected ' + cfg.variants);
for (const a of cfg.axes) {
  const d = defs.find((x) => x.name === a.name && x.type === 'VARIANT');
  if (!d) problems.push('missing axis ' + a.name);
  else if (!same(d.options, a.values)) problems.push('axis ' + a.name + ': ' + d.options.join('|') + ', expected ' + a.values.join('|'));
}
for (const [name, type] of cfg.props) if (!defs.some((x) => x.name === name && x.type === type)) problems.push('missing ' + type + ' property ' + name);
for (const d of defs) {
  const known = d.type === 'VARIANT' ? cfg.axes.some((a) => a.name === d.name) : cfg.props.some(([n, t]) => n === d.name && t === d.type);
  if (!known) problems.push('unexpected ' + d.type + ' property ' + d.name);
}
const bad = single ? [] : set.children.filter((c) => Object.entries(Object.fromEntries(c.name.split(', ').map((x) => x.split('=')))).some(([k, v]) => !cfg.axes.find((a) => a.name === k && a.values.includes(v))));
if (bad.length) problems.push(bad.length + ' variant(s) named outside the axes, e.g. ' + bad[0].name);
return { title: cfg.title, id: set.id, variants: single ? 1 : set.children.length, checked: order.length, ok: !problems.length, problems, detail };
`;

const FINISH = `${SUM}if (sumOf(JSON.stringify([cfg.axes, cfg.skip, cfg.groups, cfg.props, cfg.description, cfg.Z])) !== cfg.sum) throw new Error('This script was altered when pasted (checksum mismatch); paste the file exactly.');
${ZERO_RUNTIME}${COMMON}
const tmp = page.children.find((n) => n.type === 'FRAME' && n.name === cfg.temp);
if (!tmp) throw new Error('No build frame "' + cfg.temp + '": run the build scripts first.');
const home = page.children.find((n) => n.type === 'FRAME' && n.name === 'Component library') || page;
if (home.children.some((n) => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && n.name === cfg.title)) throw new Error(cfg.title + ' is already on the page; delete it first to rebuild.');
if (tmp.children.length !== cfg.expected) throw new Error('Expected ' + cfg.expected + ' variants, found ' + tmp.children.length);
const rightmost = home === page ? page.children.filter((n) => n !== tmp).reduce((m, n) => Math.max(m, n.x + n.width), 0) : 0;
const product = cfg.axes.reduce((acc, a) => acc.flatMap((c) => a.values.map((v) => c.concat([a.name + '=' + v]))), [[]]);
const order = product.filter((_, i) => !cfg.skip.includes(i)).map((c) => c.join(', ') || cfg.title);
const byName = new Map(tmp.children.map((c) => [c.name, c]));
const ordered = order.map((n) => byName.get(n));
if (ordered.some((c) => !c)) throw new Error('A variant is missing from the build frame: ' + order.filter((n) => !byName.get(n)).slice(0, 5).join('; '));
let target;
if (ordered.length === 1) {
  target = ordered[0]; target.name = cfg.title; home.appendChild(target);
} else {
  target = figma.combineAsVariants(ordered, page); target.name = cfg.title;
  target.layoutMode = 'HORIZONTAL'; target.layoutWrap = 'WRAP'; target.primaryAxisSizingMode = 'FIXED'; target.counterAxisSizingMode = 'AUTO';
  target.resize(1600, target.height);
  target.fills = paint(cfg.layout.fill); target.strokes = [];
  bindVar(target, cfg.layout.pad, ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft']);
  bindVar(target, cfg.layout.gap, ['itemSpacing', 'counterAxisSpacing']);
  bindVar(target, cfg.layout.radius, ['topLeftRadius', 'topRightRadius', 'bottomRightRadius', 'bottomLeftRadius']);
}
if (home === page) { target.x = rightmost + 96; target.y = 0; } else home.appendChild(target);
target.descriptionMarkdown = cfg.description;

const keys = {};
{
  const iconsPage = figma.root.children.find((p) => p.name === 'Icons');
  await iconsPage.loadAsync();
  const iconDefault = (name) => { const s = iconsPage.findOne((n) => n.type === 'COMPONENT_SET' && n.name === name); return s && (s.children.find((c) => c.name === 'Size=default') || s.defaultVariant).id; };
  for (const [name, def] of cfg.props.text) keys[name] = target.addComponentProperty(name, 'TEXT', def);
  for (const [name, def] of cfg.props.bool) keys[name] = target.addComponentProperty(name, 'BOOLEAN', def);
  for (const [name, def] of cfg.props.swap) keys[name] = target.addComponentProperty(name, 'INSTANCE_SWAP', iconDefault(def));
  for (const [name, description, preferred] of cfg.props.slot || []) {
    const preferredValues = preferred.map((t) => home.children.find((n) => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && n.name === t)).filter(Boolean).map((n) => ({ type: n.type, key: n.key }));
    if (preferredValues.length < preferred.length) report.missing.push('preferred ' + preferred.join(', '));
    keys[name] = target.addComponentProperty(name, 'SLOT', '', { description, preferredValues });
  }
  for (const g of cfg.groups) {
    for (const i of g.idx) {
      const vn = order[i];
      const comp = target.type === 'COMPONENT' ? target : target.children.find((c) => c.name === vn);
      for (const [part, field, prop] of g.refs) {
        const node = comp.findOne((x) => x.name === part);
        if (!node) { report.errors.push(vn + ': no part ' + part); continue; }
        node.componentPropertyReferences = Object.assign({}, node.componentPropertyReferences, { [field]: keys[prop] });
      }
    }
  }
}
// Turning a sibling into a slot re-lays the variant out, which can leave a stretched absolute layer (a focus ring) flipped
// vertically, drawn above its variant; put each one back over its variant.
for (const v of target.type === 'COMPONENT' ? [target] : target.children) for (const c of v.children) if (c.layoutPositioning === 'ABSOLUTE' && (c.relativeTransform[0][0] < 0 || c.relativeTransform[1][1] < 0)) { c.relativeTransform = [[1, 0, 0], [0, 1, 0]]; c.resize(v.width, v.height); }
await bindZeros(target);
tmp.remove();
report.set = target.id; report.type = target.type; report.variants = target.type === 'COMPONENT_SET' ? target.children.length : 1;
report.properties = Object.keys(target.componentPropertyDefinitions);
report.size = [Math.round(target.width), Math.round(target.height)];
return report;
`;

const DESCRIBE = `${SUM}if (sumOf(JSON.stringify(cfg.descriptions)) !== cfg.sum) throw new Error('This script was altered when pasted (checksum mismatch); paste the file exactly.');
const page = figma.root.children.find((p) => p.name === 'Library');
await figma.setCurrentPageAsync(page);
const home = page.children.find((n) => n.type === 'FRAME' && n.name === 'Component library') || page;
const report = { set: [], same: [], missing: [] };
for (const [title, text] of cfg.descriptions) {
  const node = home.children.find((n) => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && n.name === title);
  if (!node) { report.missing.push(title); continue; }
  if (node.descriptionMarkdown === text) { report.same.push(title); continue; }
  node.descriptionMarkdown = text;
  report.set.push(node.id + ' ' + title);
}
return report;
`;

const SET_WIDTH = 1600;
const COLUMNS = 2;

// The sets grouped in one auto-layout wrap frame like the Icons grid: same padding and gap (a layout variable) between all sets.
export async function layoutScript(root: string, names: string[]): Promise<string> {
  const model = await figmaModel(root);
  const varOf = new Map(model.collections.flatMap((c) => c.variables.map((v) => [v.token, `${c.name}::${v.name}`])));
  const titles: string[] = [];
  for (const name of names) titles.push((await contractOf(root, name)).component);
  const laid = { page: LIBRARY_PAGE, home: HOME_NAME, titles, space: varOf.get(String(LAYOUT.pad)), columns: COLUMNS, setWidth: SET_WIDTH, Z: zeroVars(model) };
  const cfg = { ...laid, sum: sumOf(JSON.stringify([laid.titles, laid.space, laid.columns, laid.setWidth, laid.Z])) };
  return `// GENERATED by sketchbook sync layout (${titles.length} sets). Run with the Figma MCP use_figma tool.\nconst cfg = ${JSON.stringify(cfg)};\n${LAYOUT_BODY}`;
}

const LAYOUT_BODY = `${SUM}if (sumOf(JSON.stringify([cfg.titles, cfg.space, cfg.columns, cfg.setWidth, cfg.Z])) !== cfg.sum) throw new Error('This script was altered when pasted (checksum mismatch); paste the file exactly.');
${ZERO_RUNTIME}const page = figma.root.children.find((p) => p.name === cfg.page);
if (!page) throw new Error('No page "' + cfg.page + '"');
await figma.setCurrentPageAsync(page);
const V = figma.variables;
const cols = Object.fromEntries((await V.getLocalVariableCollectionsAsync()).map((c) => [c.id, c.name]));
const space = (await V.getLocalVariablesAsync()).find((v) => cols[v.variableCollectionId] + '::' + v.name === cfg.space);
if (!space) throw new Error('No variable ' + cfg.space);
const icons = figma.root.children.find((p) => p.name === 'Icons');
await icons.loadAsync();
const grid = icons.children.find((n) => n.type === 'FRAME' && n.layoutMode === 'HORIZONTAL' && n.layoutWrap === 'WRAP');
let home = page.children.find((n) => n.type === 'FRAME' && n.name === cfg.home);
const created = !home;
if (!home) { home = figma.createFrame(); home.name = cfg.home; page.appendChild(home); }
home.layoutMode = 'HORIZONTAL'; home.layoutWrap = 'WRAP';
home.primaryAxisAlignItems = 'MIN'; home.counterAxisAlignItems = 'MIN';
home.primaryAxisSizingMode = 'FIXED'; home.counterAxisSizingMode = 'AUTO';
for (const f of ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'itemSpacing', 'counterAxisSpacing']) home.setBoundVariable(f, space);
if (grid) { home.fills = grid.fills.map((x) => ({ ...x })); home.strokes = grid.strokes.map((x) => ({ ...x })); home.strokeWeight = grid.strokeWeight; home.cornerRadius = grid.cornerRadius; }
else home.fills = [];
const report = { moved: [], already: [], missing: [], loose: [] };
for (const title of cfg.titles) {
  const node = [...page.children, ...home.children].find((n) => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && n.name === title);
  if (!node) { report.missing.push(title); continue; }
  if (node.parent === home) { report.already.push(title); continue; }
  home.appendChild(node);
  report.moved.push(title);
}
const ordered = cfg.titles.map((t) => home.children.find((n) => n.name === t)).filter(Boolean).sort((x, y) => (x.type === 'COMPONENT') - (y.type === 'COMPONENT'));
ordered.forEach((n, i) => home.insertChild(i, n));
const px = space.resolveForConsumer(home).value;
home.resize(cfg.columns * cfg.setWidth + (cfg.columns - 1) * px + 2 * px, home.height);
home.counterAxisSizingMode = 'AUTO';
home.x = 0; home.y = 0;
report.zeros = await bindZeros(home);
report.loose = page.children.filter((n) => n !== home && !n.name.startsWith('__build')).map((n) => n.name);
report.home = home.id; report.created = created; report.size = [Math.round(home.width), Math.round(home.height)]; report.gap = px; report.fillBound = !!(home.fills[0] && home.fills[0].boundVariables && home.fills[0].boundVariables.color);
return report;
`;
