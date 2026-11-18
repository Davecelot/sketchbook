// Library component model for the design file, tool-neutral: one contract -> the component's axes and, per variant, a
// tree of parts whose look is bound to the contract's component tokens. Axis, property and value names come from the
// API registry (spec/api.json, harness/lib/api.mjs), parts from anatomy, looks from tokens, states from states.
import type { APIVocabulary } from '../../../generated/types/api.js';
import type { Part, Prop, Token } from '../../../generated/types/contract.js';
import { show } from '../files.mjs';
import { contractOf, folderOf } from './components.mjs';
import { designOptions, figmaCombos, figmaOf, loadApi, optionShows } from '../api.mjs';
import type { ComboContext, FigmaProperty } from '../api.mjs';
import { RECIPES as BASE, focusRing, tokenStep } from './recipes.mjs';
import { MORE } from './recipes-more.mjs';

export type Binding = (string | null | undefined)[];
interface LayerFields {
  p: string; k?: string; d?: string; v: number;
  x?: string; s?: string | null; tp?: string | null; sh?: string | null; sw?: string | null; i?: string | null; c?: string;
  ul?: number; ring?: number; abs?: number; op?: number; al?: string; cal?: string;
  grow?: number; fw?: number; fh?: number; hug?: number; st?: number; noex?: number; pw?: number; rt?: Prop['default'];
  sq?: string[]; pr?: Record<string, string | boolean | undefined>; sp?: Record<string, string>;
  ex?: number; opt?: number; slot?: string; part?: string;
}
export interface RecipeNode extends LayerFields { b?: Binding[]; kids?: RecipeNode[] }
export interface LayerNode extends LayerFields { b: Binding[]; kids?: LayerNode[]; twin?: LayerNode }

export type ApiSlot = NonNullable<APIVocabulary['slots']>[string];
export type ApiPart = NonNullable<APIVocabulary['parts']>[string];
export interface RecipeHelpers {
  has: (rel: string | undefined) => string | null;
  first: (...rels: (string | undefined)[]) => string | null;
  figma: (codeProp: string) => FigmaProperty | null;
  iconSet: (name: string) => string | null;
  hasPart: (n: string) => boolean;
  typeRole: (prefix: string) => string | null;
  focusBorder: boolean;
  slot: (n: string) => ApiSlot | null;
  part: (n: string) => ApiPart | null;
  props: Record<string, Prop>;
  style: (rel: string | undefined) => string | null;
  contentName: (key: string) => string | null;
}
export type Recipe = (ctx: ComboContext, h: RecipeHelpers) => RecipeNode;

export interface LibraryVariant { props: Record<string, string>; tree: LayerNode }
export interface LibrarySlot { name: string; meaning: string; preferred: string[] }
export interface LibraryModel {
  name: string;
  title: string;
  dependsOn: string[];
  variants: LibraryVariant[];
  slots: LibrarySlot[];
  axes: { name: string; values: string[] }[];
  skip: number[];
}
export interface LibraryOptions { iconFor?: (a: Part) => string | null; iconSet?: (name: string) => string | null }

const RECIPES: Record<string, Recipe> = { ...BASE, ...MORE };

const cap = (s: string): string => (s[0] ?? '').toUpperCase() + s.slice(1);
const unref = (v: Token | undefined): string | null => /^\{(.+)\}$/.exec(show(v ?? ''))?.[1] ?? null;
const ICON_SIZE = /^icon(-|$)/;
const all = (n: LayerNode): LayerNode[] => [n, ...(n.kids ?? []).flatMap(all)];

export async function libraryModel(root: string, name: string, { iconFor = () => null, iconSet = () => null }: LibraryOptions = {}): Promise<LibraryModel> {
  const api = loadApi(root);
  if (!api) throw Object.assign(new Error('No spec/api.json: the design file takes its names from the API vocabulary.'), { fix: 'Add spec/api.json (docs/api-standard.md).' });
  const contract = await contractOf(root, name);
  // Tokens are named after the component folder; registry keys after the set (an element set has its own).
  const comp = folderOf(name);
  const apiName = name.split('/').at(-1) ?? name;
  const tokens = contract.tokens ?? {};
  const at = (rel: string | null): Token | undefined => tokens[String(rel)];
  const has = (rel: string | undefined): string | null => (`${comp}.${rel}` in tokens ? `${comp}.${rel}` : null);
  const first = (...rels: (string | undefined)[]): string | null => rels.map(has).find(Boolean) ?? null;
  const options = designOptions(contract, name.includes('/') ? apiName : null);
  const { axes, combos } = figmaCombos(api, apiName, contract, options);
  const figma = (codeProp: string) => figmaOf(api, apiName, contract, codeProp);

  const anatomy = contract.anatomy ?? [];
  const topParts = anatomy.filter((a) => !a.parent);
  const control = anatomy.find((a) => a.role === 'control') ?? null;
  const dependencies: Record<string, string> = Object.fromEntries((contract.dependsOn ?? []).map((d) => [`sb-${d.toLowerCase()}`, d.toLowerCase()]));
  const hidden = (a: Part) => /visually hidden/i.test(a.notes ?? '');

  // What the registry draws for a part: its text property, its visibility switch, its icon swap.
  const metaOf = (a: Part): { text: string | null | undefined; swap: string | null; show: string | null | undefined } => {
    const f = a.controlledBy ? figma(a.controlledBy) : null;
    if (!f) return { text: null, swap: null, show: null };
    if (f.as === 'text') return { text: f.name, swap: null, show: f.visible ?? null };
    if (f.kind === 'icon') return { text: null, swap: f.swap ?? null, show: f.visible ?? null };
    if (f.as === 'property') return { text: null, swap: null, show: f.name };
    return { text: null, swap: null, show: null };
  };

  function build(ctx: ComboContext): LayerNode {
    const { state } = ctx;
    const variant = tokenStep(ctx.variant);
    const size = tokenStep(ctx.size);
    const iconOnly = size ? ICON_SIZE.test(size) : false;
    const base = size ? size.replace(/^icon-?/, '') || 'default' : 'default';
    const sz = (p: string) => first(...(iconOnly ? [`${p}-icon.${base}`] : []), `${p}.${base}`, `${p}-${base}`, p, `${p}.default`, `${p}-default`);
    const look = (p: string) => first(...(variant ? [`${variant}.${p}`] : []), p);
    const partTok = (part: string, p: string) => first(`${part}.${p}`);
    const bind = (list: Binding[], token: string | null, field: string) => { if (token) list.push([token, field]); };

    const ringed = state === 'focus-visible';
    const hoverTok = (p: string) => (state === 'hover' && variant ? first(`${variant}.${p}-hover`) : null);
    const dim = ctx.disabled || state === 'loading' ? has('disabled-opacity') : null;
    const loading = state === 'loading';

    const withTwin = (a: Part): LayerNode[] => { const x = node(a); const t = x.twin; delete x.twin; return t ? [x, t] : [x]; };
    const node = (a: Part): LayerNode => {
      const kids = anatomy.filter((x) => x.parent === a.name);
      const { text, swap, show } = metaOf(a);
      const b: Binding[] = [];
      const isCtl = control ? a.name === control.name : !a.parent;
      const n: LayerNode = { p: a.name, d: 'r', v: 1, b };
      if (a.role === 'icon' || a.component) {
        const tok = partTok(a.name, 'size') ?? first('icon-size' + (base === 'xs' ? '-xs' : ''), 'size', 'icon-size');
        const fgTok = hoverTok('fg') ?? look('fg');
        Object.assign(n, { k: a.component ? 'c' : 'i' });
        if (a.component) n.c = dependencies[a.component] ?? a.component.replace(/^sb-/, '');
        else n.i = iconFor(a);
        bind(b, tok, 'wh');
        bind(b, fgTok, 'strokeOfVector');
        n.sw = swap;
        n.sh = show;
        if (a.name === 'spinner') n.v = loading ? 1 : 0;
        else if (a.controlledBy === 'leadingIcon' && loading) { n.v = 0; n.sh = null; }
        else if (iconOnly && a.name === 'icon-start') { n.v = 1; n.sh = null; }
        else if (iconOnly) { n.v = 0; n.sh = null; }
        else if (show) n.v = 0;
        return n;
      }
      if (a.role === 'text' && !kids.length) {
        n.k = 't';
        n.x = a.name === 'required-indicator' ? '*' : cap(a.name.replace(/-/g, ' '));
        const fontTok = partTok(a.name, 'font-size') ?? (a.name === 'error' ? first('description.font-size') : null) ?? first('font-size' + (base === 'xs' ? '-xs' : ''), 'font-size');
        n.s = unref(at(fontTok)) ?? null;
        bind(b, partTok(a.name, 'fg') ?? hoverTok('fg') ?? look('fg'), 'fills');
        n.tp = text;
        n.sh = show;
        if (a.name === 'error') n.v = ctx.invalid ? 1 : 0;
        else if (a.name === 'required-indicator' || show) n.v = 0;
        if (iconOnly && a.name === 'label') { n.v = 0; n.sh = null; }
        // A variant with its own underline offset underlines its label on hover (the styles' link): a second layer on the
        // underline text style, with its own text property, because formatting on a property-bound layer is shared by all variants.
        const under = text && variant && has(`${variant}.underline-offset`) && a.controlledBy ? figma(a.controlledBy)?.underline : null;
        if (under) {
          n.twin = { ...n, p: `${a.name}-underline`, ul: 1, tp: under, v: n.v !== 0 && state === 'hover' ? 1 : 0 };
          if (state === 'hover') n.v = 0;
        }
        return n;
      }
      n.k = 'b';
      n.d = /^(container|group|list|stack)$/.test(a.role) ? 'c' : 'r';
      if (a.role === 'text') {
        n.d = 'r';
        n.kids = [{ p: `${a.name}-text`, k: 't', d: 'r', v: 1, x: cap(a.name.replace(/-/g, ' ')), s: unref(at(partTok(a.name, 'font-size') ?? first('font-size'))) ?? null, b: [[partTok(a.name, 'fg') ?? look('fg'), 'fills']].filter(([t]) => t), tp: text }];
      }
      if (!a.parent) bind(b, sz('gap'), 'gap');
      if (isCtl) {
        bind(b, sz('height'), iconOnly ? 'wh' : 'h');
        if (!iconOnly) bind(b, sz('padding-x'), 'padx');
        bind(b, sz('padding-y'), 'pady');
        bind(b, sz('radius'), 'radius');
        const strokeTok = (ctx.invalid ? first('border-invalid') : null) ?? look('border');
        const ringBorder = ringed && !ctx.invalid && Object.values(contract.states ?? {}).some((st) => st.borderColor) ? first('focus-ring.color') : null;
        const stroke = ringBorder ?? strokeTok;
        if (stroke) { bind(b, stroke, 'stroke'); bind(b, sz('border-width'), 'sw'); }
        bind(b, hoverTok('bg') ?? look('bg'), 'fill');
        if (!ringed) bind(b, look('shadow'), 'effect');
        if (dim) bind(b, dim, 'opacity');
      }
      const drawnKids = [...(n.kids ?? []), ...kids.filter((k) => !hidden(k)).flatMap(withTwin)];
      n.kids = drawnKids;
      if (isCtl && a.name === 'input') {
        n.al = 'min';
        const value = figma('value');
        const placeholder = figma('placeholder');
        const style = unref(at(first('font-size'))) ?? null;
        if (value) drawnKids.push({ p: 'value', k: 't', d: 'r', v: 0, x: 'Value', s: style, b: [[first('fg'), 'fills']].filter(([t]) => t), tp: value.name, sh: value.visible });
        if (placeholder) drawnKids.push({ p: 'placeholder', k: 't', d: 'r', v: 1, x: 'Placeholder', s: style, b: [[first('placeholder'), 'fills']].filter(([t]) => t), tp: placeholder.name, sh: placeholder.visible });
      }
      if (isCtl && ringed) drawnKids.push(focusRing(first, { invalid: ctx.invalid, radius: sz('radius') }));
      return n;
    };

    if (topParts.length === 1 && topParts[0]) return node(topParts[0]);
    const root: LayerNode = { p: cap(name), k: 'b', d: 'r', v: 1, b: [], kids: topParts.filter((a) => !hidden(a)).flatMap(withTwin) };
    bind(root.b, first('size'), 'wh');
    return root;
  }

  const leaf = (n: RecipeNode): n is RecipeNode & { kids?: undefined } => !n.kids;
  const norm = (n: RecipeNode): LayerNode => (leaf(n) ? { b: [], ...n } : { b: [], ...n, kids: (n.kids ?? []).map(norm) });
  const recipe = RECIPES[name];
  const helpers: RecipeHelpers = {
    has, first, figma, iconSet, hasPart: (n) => anatomy.some((a) => a.name === n),
    typeRole: (prefix) => { const size = unref(at(first(`${prefix}.font-size`))); const role = size?.replace(/^font\.size\./, ''); return role && unref(at(first(`${prefix}.line-height`))) === `font.line-height.${role}` ? role : null; }, focusBorder: Object.values(contract.states ?? {}).some((st) => st.borderColor), slot: (n) => api.slots?.[`${apiName}.${n}`] ?? null, part: (n) => api.parts?.[`${apiName}.${n}`] ?? null,
    props: contract.props ?? {},
    style: (rel) => unref(at(first(rel))) ?? null,
    contentName: (key) => api.content[key]?.figma?.name ?? null,
  };
  // A boolean option's layers carry its show property (default as declared); what lies under them is the option's too.
  const switches = options.filter((o) => o.kind === 'boolean');
  const optional = (n: LayerNode, under = false): LayerNode => {
    const o = switches.find((x) => optionShows(x, n.p));
    const inside = under || Boolean(o);
    return { ...n, ...(o ? { sh: o.name, v: o.default ? 1 : 0 } : {}), ...(inside ? { opt: 1 } : {}), ...(n.kids ? { kids: n.kids.map((k) => optional(k, inside)) } : {}) };
  };
  const drawn = combos.filter((c) => !c.excluded).map((c) => ({ props: c.props, tree: recipe ? norm(recipe(c.ctx, helpers)) : build(c.ctx) })).map((v) => ({ ...v, tree: switches.length ? optional(v.tree) : v.tree }));
  for (const o of switches) {
    const hit = drawn.some((v) => all(v.tree).some((n) => optionShows(o, n.p)));
    if (!hit) throw Object.assign(new Error(`${contract.component}: option "${o.name}" shows no layer the library draws (${(o.shows ?? []).join(', ')}).`), { fix: 'Name layers the recipe draws, or draw them.' });
  }
  // A nested library instance whose component has properties is exposed, so its properties show in the parent's panel,
  // under a readable layer name: the component's title and its index among its siblings of the same component.
  const nestedInfo = new Map<string, { title: string; props: boolean }>();
  const infoOf = async (c: string) => {
    let info = nestedInfo.get(c);
    if (!info) {
      const m = await libraryModel(root, c, { iconFor, iconSet });
      const nodes = m.variants.flatMap((v) => all(v.tree));
      info = { title: m.title, props: m.axes.length > 0 || nodes.some((n) => n.tp || n.sh || n.sw) };
      nestedInfo.set(c, info);
    }
    return info;
  };
  const expose = async (n: LayerNode): Promise<LayerNode> => {
    if (!n.kids) return n;
    const count: Record<string, number> = {};
    const kids: LayerNode[] = [];
    for (const k of n.kids) {
      const c = k.k === 'c' && !k.noex ? k.c : undefined;
      const info = c === undefined ? null : await infoOf(c);
      if (c !== undefined && info?.props) { count[c] = (count[c] ?? 0) + 1; kids.push({ ...k, p: `${info.title} ${count[c]}`, ex: 1 }); } else kids.push(await expose(k));
    }
    return { ...n, kids };
  };
  // A registered content region becomes a slot: the layer takes the slot's name (Figma ties the two), and nothing inside
  // it is bound to a property or exposed, which Figma refuses inside a slot. The top layer is never a slot.
  const regionOf = (p: string) => api.regions?.[`${apiName}.${p}`] ?? null;
  const unbind = ({ tp, sh, sw, ex, ...n }: LayerNode): LayerNode => (n.kids ? { ...n, kids: n.kids.map(unbind) } : n);
  const slotify = (n: LayerNode, top: boolean): LayerNode => {
    const r = top ? null : regionOf(n.p);
    if (r) return { ...unbind(n), p: r.name, part: n.p, slot: r.name };
    return n.kids ? { ...n, kids: n.kids.map((k) => slotify(k, false)) } : n;
  };
  const variants: LibraryVariant[] = [];
  for (const v of drawn) variants.push({ ...v, tree: slotify(await expose(v.tree), true) });
  const slots: LibrarySlot[] = [];
  for (const [key, r] of Object.entries(api.regions ?? {})) {
    if (key.split('.')[0] !== apiName || slots.some((s) => s.name === r.name) || !variants.some((v) => all(v.tree).some((n) => n.slot === r.name))) continue;
    slots.push({ name: r.name, meaning: r.meaning, preferred: await Promise.all((r.preferred ?? []).map(async (c) => (await contractOf(root, c)).component)) });
  }
  return {
    name, title: contract.component, dependsOn: Object.values(dependencies), variants, slots,
    axes: axes.map((a) => ({ name: a.name, values: a.values.map((v) => v.figma) })),
    skip: combos.flatMap((c, i) => (c.excluded ? [i] : [])),
  };
}
