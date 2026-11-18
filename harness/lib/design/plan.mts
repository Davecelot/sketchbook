// Generic component plan for the design file: a build plan from any contract, so every component gets a library
// component (variants as properties) without a hand-written recipe. Parts come from `anatomy`, variants from the
// variant matrix, and each token is bound by its name: <component>[.<part>].<property>[.<variant value>].
import type { Part } from '../../../generated/types/contract.js';
import { libraryMatrix } from './components.mjs';
import type { DesignContract } from './components.mjs';

type Kind = 'box' | 'text' | 'icon';
interface ParsedToken { prop: string; part: string | null; implicit: string | null; state: boolean; tags: string[] }
interface Scored { token: string; score: number }
export interface PlanBinding { token: string; props: string[] }
export interface PlanNode { part: string; kind: Kind; text: string; dir: 'row' | 'column'; bindings: PlanBinding[]; children: PlanNode[] }
export interface PlanVariant { props: Record<string, string>; tree: PlanNode }

const PAD = ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'];
const RADII = ['topLeftRadius', 'topRightRadius', 'bottomRightRadius', 'bottomLeftRadius'];
const GAPS = ['itemSpacing', 'counterAxisSpacing'];

// Token property name -> the node fields it binds (Figma Plugin API names; fills/strokes are paints, effects an effect style). `metric` properties follow the size dimension, the rest the look.
const PROPS: Record<string, { key: string; metric?: boolean }> = {
  bg: { key: 'fill' }, background: { key: 'fill' }, fill: { key: 'fill' },
  fg: { key: 'text' }, color: { key: 'text' }, foreground: { key: 'text' }, text: { key: 'text' },
  border: { key: 'stroke' }, 'border-color': { key: 'stroke' }, stroke: { key: 'stroke' },
  'border-width': { key: 'strokeWidth', metric: true },
  radius: { key: 'radius', metric: true },
  padding: { key: 'padding', metric: true }, 'padding-x': { key: 'paddingX', metric: true }, 'padding-y': { key: 'paddingY', metric: true }, inset: { key: 'padding', metric: true },
  gap: { key: 'gap', metric: true },
  height: { key: 'height', metric: true }, width: { key: 'width', metric: true }, size: { key: 'size', metric: true }, 'icon-size': { key: 'iconSize', metric: true },
  'font-size': { key: 'fontSize', metric: true }, 'font-weight': { key: 'fontWeight', metric: true },
  shadow: { key: 'shadow' }, opacity: { key: 'opacity' },
};
const BIND: Record<Kind, Record<string, string[]>> = {
  box: { fill: ['fills'], stroke: ['strokes'], strokeWidth: ['strokeWeight'], radius: RADII, padding: PAD, paddingX: ['paddingLeft', 'paddingRight'], paddingY: ['paddingTop', 'paddingBottom'], gap: GAPS, height: ['height'], width: ['width'], size: ['width', 'height'], shadow: ['effects'], opacity: ['opacity'] },
  text: { text: ['fills'], fill: ['fills'], fontSize: ['fontSize'], fontWeight: ['fontWeight'] },
  icon: { text: ['fills'], fill: ['fills'], size: ['width', 'height'], iconSize: ['width', 'height'] },
};
const INHERIT = ['text', 'fontSize', 'fontWeight'];
// Words in a token name that mean a state the doc does not draw: such a token is skipped.
const STATES = /^(hover|focus|focus-visible|focus-ring|ring|checked|unchecked|on|off|disabled|invalid|active|pressed|open|selected|indeterminate|error|placeholder|loading|separator|group|set)$/;

const kindOf = (a: Part, hasChildren: boolean): Kind => (/(^|-)(thumb|knob)$/.test(a.name) ? 'icon' : /^(text|label|description|heading|title|caption)$/.test(a.role) ? 'text' : /^(icon|indicator|image|media|avatar)$/.test(a.role) && !hasChildren ? 'icon' : 'box');
const bindingsOf = (entries: Iterable<[string, Scored]>, table: Record<string, string[]>): PlanBinding[] => [...entries].flatMap(([k, v]) => { const props = table[k]; return props ? [{ token: v.token, props }] : []; });

// <prop>[-<tag>] segment -> { prop, tag? }
function propOf(seg: string): { prop: string; tag: string | null } | null {
  const keys = Object.keys(PROPS).sort((a, b) => b.length - a.length);
  const k = keys.find((x) => seg === x || seg.startsWith(`${x}-`));
  return k ? { prop: k, tag: seg === k ? null : seg.slice(k.length + 1) } : null;
}

// A token as { part, prop, tags, state } relative to the component, or null when it is not a visual property. Words that
// are neither a part nor a variant value nor a state (track, indicator ...) are only hints and are dropped.
function parseToken(path: string, parts: string[], values: string[]): ParsedToken | null {
  const segs = path.split('.').slice(1);
  const i = segs.findIndex((s) => propOf(s));
  const found = i < 0 ? null : propOf(segs[i] ?? '');
  if (!found) return null;
  const { prop, tag: embedded } = found;
  const rest = segs.filter((_, j) => j !== i);
  const part = rest.find((s) => parts.includes(s)) ?? null;
  const words = [...rest.filter((s) => s !== part), ...(embedded ? [embedded] : [])];
  const hints = words.filter((w) => !values.includes(w) && !STATES.test(w));
  const implicit = !part && ['text', 'fontSize', 'fontWeight'].includes(PROPS[prop]?.key ?? '') && hints.length === 1 ? (hints[0] ?? null) : null;
  return { prop, part, implicit, state: words.some((w) => STATES.test(w)), tags: words.filter((w) => values.includes(w)) };
}

export function genericPlan(contract: Pick<DesignContract, 'anatomy' | 'variantMatrix' | 'tokens' | 'component'>, name: string): PlanVariant[] {
  const parts = (contract.anatomy || []).map((a) => a.name);
  const { dims, cells } = libraryMatrix(contract, name);
  const sizeDim = dims.find((d) => /size/i.test(d.name));
  const values = dims.flatMap((d) => d.values);
  const parsed = Object.entries(contract.tokens || {}).flatMap(([path]) => { const t = parseToken(path, parts, values); return t && t.prop && !t.state ? [{ path, ...t }] : []; });

  const planFor = (props: Record<string, string>): PlanNode => {
    const combo = Object.values(props);
    const bindings = new Map<string | null, Map<string, Scored>>(); // part|null -> Map(propKey -> { token, score })
    for (const t of parsed) {
      if (!t.tags.every((g) => combo.includes(g))) continue;
      const meta = PROPS[t.prop];
      if (!meta) continue;
      const fits = t.tags.every((g) => (sizeDim ? (sizeDim.values.includes(g) === !!meta.metric) : true));
      const score = t.tags.length * 10 + (t.tags.length && fits ? 1 : 0);
      const owner = t.implicit ? `~${t.implicit}` : t.part;
      let m = bindings.get(owner);
      if (!m) { m = new Map(); bindings.set(owner, m); }
      const prev = m.get(meta.key);
      if (!prev || prev.score < score) m.set(meta.key, { token: t.path, score });
    }
    const rootBind = bindings.get(null) ?? new Map<string, Scored>();
    // A container root with a control inside (a field around a checkbox): the look (fill, stroke, radius, size, shadow)
    // belongs to the control; layout (gap, padding) stays on the root.
    const rootPart = (contract.anatomy || []).find((a) => !a.parent);
    const controlPart = rootPart && /^(container|group)$/.test(rootPart.role) ? (contract.anatomy || []).find((a) => a.role === 'control' && a.name !== rootPart.name) : null;
    const LOOK = ['fill', 'stroke', 'strokeWidth', 'radius', 'size', 'width', 'height', 'shadow', 'opacity'];
    const rootLayout = new Map([...rootBind].filter(([k]) => !controlPart || !LOOK.includes(k)));
    const rootLook = new Map([...rootBind].filter(([k]) => controlPart && LOOK.includes(k)));
    const node = (a: Part): PlanNode => {
      const children = (contract.anatomy || []).filter((x) => x.parent === a.name && !x.optional).map(node);
      const kind = kindOf(a, children.length > 0);
      const own = bindings.get(a.name) ?? new Map<string, Scored>();
      const table = BIND[kind];
      const merged = new Map([...(a.parent ? [] : rootLayout), ...(controlPart && a.name === controlPart.name ? rootLook : []), ...own]);
      if (kind !== 'box') for (const k of INHERIT) { const inherited = rootBind.get(k); if (!merged.has(k) && inherited) merged.set(k, inherited); }
      const list = bindingsOf(merged, table);
      // A box with no parts of its own that carries text tokens (a toggle, a badge) shows a sample label.
      const TEXT_KEYS = ['text', 'fontSize', 'fontWeight'];
      const hasImplicit = [...bindings.keys()].some((k) => typeof k === 'string' && k.startsWith('~'));
      if (kind === 'box' && children.length === 0 && !hasImplicit && TEXT_KEYS.some((k) => merged.has(k))) {
        children.push({ part: 'label', kind: 'text', text: contract.component, dir: 'row', bindings: bindingsOf(TEXT_KEYS.flatMap((k): [string, Scored][] => { const v = merged.get(k); return v ? [[k, v]] : []; }), BIND.text), children: [] });
      }
      return { part: a.name, kind, text: a.name.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase()), dir: /^(container|group|list|stack)$/.test(a.role) && !(controlPart && !a.parent) ? 'column' : 'row', bindings: list, children };
    };
    const roots = (contract.anatomy || []).filter((a) => !a.parent).map(node);
    const implicit = [...bindings].flatMap(([k, m]): PlanNode[] => (typeof k === 'string' && k.startsWith('~') ? [{
      part: k.slice(1), kind: 'text', text: k.slice(1).replace(/^./, (c) => c.toUpperCase()), dir: 'row', children: [],
      bindings: bindingsOf(m, BIND.text),
    }] : []));
    const only = roots.length === 1 ? roots[0] : undefined;
    if (only && only.kind === 'box') only.children.push(...implicit);
    else if (only && only.kind !== 'box') return { part: name, kind: 'box', text: '', dir: 'row', bindings: [], children: [only, ...implicit] };
    return only ?? { part: name, kind: 'box', text: '', dir: 'row', bindings: bindingsOf(rootBind, BIND.box), children: roots };
  };

  const variants = dims.length ? cells.flatMap((c) => (c.props ? [c.props] : [])) : [{}];
  return variants.map((props) => ({ props, tree: planFor(props) }));
}
