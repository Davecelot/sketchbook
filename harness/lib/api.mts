// spec/api.json: the API vocabulary, and the audit of every contract against it. One reader for check A1, the
// `sketchbook api` command and the design adapters.
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { APIVocabulary, Figma } from '../../generated/types/api.js';
import type { ComponentContract, Prop } from '../../generated/types/contract.js';
import type { DesignFilePractices } from '../../generated/types/figma-practices.js';
import { readJsonSync } from './files.mjs';

export type { APIVocabulary, DesignFilePractices };

export type Extension = APIVocabulary['extensions'][string];
export type ApiAlias = APIVocabulary['aliases'][string];

export interface PropValueRow {
  from: string;
  to: string | null;
  status: 'mapped' | 'identity' | 'extension' | 'unmapped';
}

interface PropRowBase {
  component: string;
  prop: string;
  type: Prop['type'];
  in: 'props' | 'content';
  values: PropValueRow[];
  proposal: boolean;
}
export interface RegisteredPropRow extends PropRowBase {
  status: 'canonical' | 'alias' | 'extension';
  to: string;
}
export interface UnregisteredPropRow extends PropRowBase {
  status: 'unregistered';
  to: null;
}
export type PropRow = RegisteredPropRow | UnregisteredPropRow;

interface DesignOptionBase {
  name: string;
  set?: string;
  shows?: string[];
  default?: string | boolean;
  reason?: string;
}
export interface BooleanDesignOption extends DesignOptionBase { kind: 'boolean' }
export interface EnumDesignOption extends DesignOptionBase { kind: 'enum'; values: string[] }
export type DesignOption = BooleanDesignOption | EnumDesignOption;

export interface CodeValue { code: string; figma: string }
export interface LookValue { figma: string; on: boolean }
export interface PropAxis { name: string; kind: 'prop'; prop: string; values: CodeValue[] }
export interface StateAxis { name: 'State'; kind: 'state'; values: CodeValue[] }
export interface LookAxis { name: string; kind: 'look'; code: string; atRestOnly: boolean | undefined; excludes: Record<string, string> | undefined; values: LookValue[] }
export interface OptionAxis { name: string; kind: 'option'; option: string; values: CodeValue[] }
export type Axis = PropAxis | StateAxis | LookAxis | OptionAxis;
export interface CodePick { axis: PropAxis | StateAxis | OptionAxis; value: CodeValue }
export interface LookPick { axis: LookAxis; value: LookValue }
export type Pick = CodePick | LookPick;

export interface ComboContext {
  variant: string | null;
  size: string | null;
  state: string;
  disabled: boolean;
  invalid: boolean;
  on: Set<string>;
  codes: Record<string, string>;
  options: Record<string, string>;
  figma: Record<string, string>;
}
export interface Combo {
  props: Record<string, string>;
  picks: Pick[];
  ctx: ComboContext;
  excluded: boolean;
}
export interface FigmaCombos { axes: Axis[]; combos: Combo[] }
export type FigmaProperty = { canonical: string; kind: string } & Figma;

export interface EventRow { component: string; event: string; status: 'canonical' | 'alias' | 'unregistered'; to: string | null }
export interface StateRow { component: string; state: string; to: string | null; status: 'canonical' | 'alias' | 'unregistered' }
export interface ApiTotals {
  props: number; canonical: number; alias: number; extension: number; unregistered: number; unmappedValues: number;
  events: number; eventAliases: number; states: number; stateAliases: number;
}
export interface ApiAudit {
  api: APIVocabulary;
  rows: PropRow[];
  events: EventRow[];
  states: StateRow[];
  bad: Array<PropRow | EventRow | StateRow>;
  totals: ApiTotals;
}

export const API_FILE = 'spec/api.json';
export const loadApi = (root: string): APIVocabulary | null => readJsonSync<APIVocabulary>(join(root, API_FILE), null);

export const PRACTICES_FILE = 'spec/figma-practices.json';
export const loadPractices = (root: string): DesignFilePractices | null => readJsonSync<DesignFilePractices>(join(root, PRACTICES_FILE), null);

// Each component followed by the elements it draws as sets of their own ("field" -> "field", "field/field-set", ...).
export const withSets = (api: APIVocabulary | null, names: string[]): string[] => names.flatMap((n) => [n, ...Object.keys(api?.sets ?? {}).filter((k) => k.split('.')[0] === n).map((k) => k.replace('.', '/'))]);

const extensionOf = (api: APIVocabulary, component: string, name: string): Extension | null => api.extensions[`${component}.${name}`] ?? api.extensions[name] ?? null;
const aliasOf = (api: APIVocabulary, component: string, name: string): ApiAlias | null => api.aliases[`${component}.${name}`] ?? api.aliases[name] ?? null;

// The allowed canonical values of a prop: a named vocabulary or a literal list.
export const valuesOf = (api: APIVocabulary, name: string): string[] | null | undefined => {
  const v = api.props[name]?.values;
  return typeof v === 'string' ? api.vocabularies[v] : v ?? null;
};

// One contract prop against the registry: status canonical | alias | extension | unregistered, the canonical name it
// resolves to, and for variants each value's fate (identity, mapped, extension or unmapped).
export function resolveProp(api: APIVocabulary, component: string, name: string, prop: Prop): PropRow {
  const alias = aliasOf(api, component, name);
  const proposal = Boolean(alias?.proposal);
  const ext = (alias ? extensionOf(api, component, alias.to) : null) ?? extensionOf(api, component, name);
  let status: PropRow['status'] = 'unregistered';
  let to = name;
  let where: 'props' | 'content' = 'props';
  if (alias && alias.to === name && !alias.values && !alias.in) status = 'canonical';
  else if (alias) { status = 'alias'; to = alias.to; where = alias.in ?? 'props'; }
  // A slot or icon swap is content: its name is looked up there first (label, leadingIcon, content).
  else if (api.content[name] && (prop.type === 'slot' || prop.type === 'instanceSwap')) { status = 'canonical'; where = 'content'; }
  else if (api.props[name]) status = 'canonical';
  else if (ext) status = 'extension';
  if (status === 'unregistered') return { component, prop: name, type: prop.type, status, to: null, in: 'props', values: [], proposal };

  const values: PropValueRow[] = [];
  if (prop.type === 'variant' && where === 'props') {
    const canonical = valuesOf(api, to);
    for (const v of prop.values ?? []) {
      const mapped = alias?.values?.[v];
      if (mapped !== undefined) values.push({ from: v, to: mapped, status: !canonical || canonical.includes(mapped) || ext?.values?.includes(mapped) ? 'mapped' : 'unmapped' });
      else if (canonical?.includes(v)) values.push({ from: v, to: v, status: 'identity' });
      else if (ext?.values?.includes(v)) values.push({ from: v, to: v, status: 'extension' });
      else values.push({ from: v, to: null, status: 'unmapped' });
    }
  }
  return { component, prop: name, type: prop.type, status, to, in: where, values, proposal };
}

// Design-file-only options a contract declares under $extensions["design.figma"] (checked by C1): a boolean shows layers,
// an enum is an axis. `set` names an element set ("tabs-list"); without it the option belongs to the component's own set.
export const designOptions = (contract: { $extensions?: ComponentContract['$extensions'] }, set: string | null = null): DesignOption[] => {
  const body = contract.$extensions?.['design.figma'] as { options?: DesignOption[] } | undefined;
  return (body?.options ?? []).filter((o) => (o.set ?? null) === set);
};
const layerPattern = (g: string) => new RegExp(`^${g.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*')}$`);
export const optionShows = (option: { shows?: string[] }, layer: string): boolean => (option.shows ?? []).some((g) => layerPattern(g).test(layer));

export const title = (s: string): string => { const t = String(s).replace(/-/g, ' '); return t.charAt(0).toUpperCase() + t.slice(1); };

const isLook = (p: Pick): p is LookPick => p.axis.kind === 'look';

const picksOf = (a: Axis): Pick[] => {
  switch (a.kind) {
    case 'look': return a.values.map((value) => ({ axis: a, value }));
    case 'prop':
    case 'state':
    case 'option': return a.values.map((value) => ({ axis: a, value }));
  }
};

// What a design file draws for one component, from the registry plus the contract: variant-type props that the
// registry draws, the State axis (Rest plus the interaction states the contract gives tokens to) and one False|True
// axis per look-changing state (Disabled, Error as Validation, ...). Combinations a state rule or the contract's
// variantMatrix excludes are flagged, so a renderer keeps the grid and skips the cell.
export function figmaCombos(api: APIVocabulary, component: string, contract: { props: ComponentContract['props']; states?: ComponentContract['states']; variantMatrix?: ComponentContract['variantMatrix'] }, options: DesignOption[] = []): FigmaCombos {
  const axes: Axis[] = [];
  // A variant whose axis a look state already draws (validation as the Error state's Validation axis) is drawn once, by the state.
  const stateAxes = new Set(Object.entries(contract.states ?? {}).filter(([, def]) => def?.tokens?.length).map(([key]) => api.states.draw?.[api.states.keys[key] ?? '']?.axis));
  for (const [prop, p] of Object.entries(contract.props ?? {})) {
    if (p.type !== 'variant') continue;
    const r = resolveProp(api, component, prop, p);
    if (r.status === 'unregistered' || r.in !== 'props') continue;
    const reg = api.props[r.to];
    const ext = extensionOf(api, component, r.to);
    if (!(reg ? reg.figma?.as === 'axis' : ext?.draw === true)) continue;
    if (reg?.figma?.name && stateAxes.has(reg.figma.name)) continue;
    axes.push({ name: reg?.figma?.name ?? title(r.to), prop, kind: 'prop', values: r.values.map((v) => ({ code: v.from, figma: title(v.to ?? v.from) })) });
  }
  const interaction: { title: string; code: string }[] = [];
  const looks: LookAxis[] = [];
  for (const [key, def] of Object.entries(contract.states ?? {})) {
    const t = api.states.keys[key];
    const draw = t && api.states.draw?.[t];
    if (!draw || !def?.tokens?.length) continue;
    if (draw.axis === 'State') interaction.push({ title: t, code: key });
    else if (!looks.some((l) => l.name === draw.axis)) {
      if (!draw.values) throw new TypeError("Cannot read properties of undefined (reading '0')");
      looks.push({ name: draw.axis, kind: 'look', code: key, atRestOnly: draw.atRestOnly, excludes: draw.excludes, values: [{ figma: draw.values[0], on: false }, { figma: draw.values[1], on: true }] });
    }
  }
  interaction.sort((a, b) => api.states.axis.indexOf(a.title) - api.states.axis.indexOf(b.title));
  if (interaction.length) axes.push({ name: 'State', kind: 'state', values: [{ code: 'rest', figma: 'Rest' }, ...interaction.map((i) => ({ code: i.code, figma: i.title }))] });
  axes.push(...looks);
  for (const o of options) if (o.kind === 'enum') axes.push({ name: o.name, kind: 'option', option: o.name, values: o.values.map((v) => ({ code: v, figma: String(v) })) });

  let grid: { props: Record<string, string>; picks: Pick[] }[] = [{ props: {}, picks: [] }];
  for (const a of axes) {
    const picks = picksOf(a);
    grid = grid.flatMap((c) => picks.map((p) => ({ props: { ...c.props, [a.name]: p.value.figma }, picks: [...c.picks, p] })));
  }
  const matrix = contract.variantMatrix?.excludedCombinations ?? [];
  const combos = grid.map((c): Combo => {
    const ctx: ComboContext = { variant: null, size: null, state: 'rest', disabled: false, invalid: false, on: new Set(), codes: {}, options: {}, figma: c.props };
    for (const pick of c.picks) {
      if (isLook(pick)) {
        const { axis, value } = pick;
        if (value.on) { ctx.on.add(axis.code); if (axis.code === 'disabled') ctx.disabled = true; if (axis.code === 'error') ctx.invalid = true; }
        continue;
      }
      const { axis, value } = pick;
      if (axis.kind === 'prop') {
        ctx.codes[axis.prop] = value.code;
        if (axis.prop === 'variant') ctx.variant = value.code;
        if (axis.prop === 'size') ctx.size = value.code;
      }
      if (axis.kind === 'state') ctx.state = value.code;
      if (axis.kind === 'option') ctx.options[axis.option] = value.code;
    }
    const code = (prop: string) => {
      const hit = c.picks.find((p) => p.axis.kind === 'prop' && p.axis.prop === prop);
      return hit && !isLook(hit) ? hit.value.code : undefined;
    };
    const excluded = matrix.some((x) => { const keys = Object.keys(x).filter((k) => k !== 'reason'); return keys.length && keys.every((k) => ([] as unknown[]).concat(x[k]).includes(code(k))); })
      || c.picks.some((pick) => isLook(pick) && pick.value.on && ((pick.axis.atRestOnly && ctx.state !== 'rest') || Object.entries(pick.axis.excludes ?? {}).some(([other, v]) => c.props[other] === v)));
    return { ...c, ctx, excluded };
  });
  return { axes, combos };
}

// The design-file properties of a component's content and text props: for a code prop name, what the registry draws.
export function figmaOf(api: APIVocabulary, component: string, contract: { props: ComponentContract['props'] }, codeProp: string): FigmaProperty | null {
  const prop = contract.props?.[codeProp];
  if (!prop) return null;
  const r = resolveProp(api, component, codeProp, prop);
  if (r.status === 'unregistered') return null;
  const reg = r.in === 'content' ? api.content[r.to] : api.props[r.to];
  return reg?.figma ? { canonical: r.to, kind: 'kind' in reg ? reg.kind : reg.type, ...reg.figma } : null;
}

const eventName = (api: APIVocabulary, prefix: string, name: string): { status: EventRow['status']; to: string | null } => {
  if (api.events.standard.includes(name)) return { status: 'canonical', to: name };
  const alias = api.events.aliases?.[name];
  if (alias) return { status: 'alias', to: alias.replace('{prefix}', prefix) };
  if (name.startsWith(`${prefix}-`)) return { status: 'canonical', to: name };
  return { status: 'unregistered', to: null };
};

export function auditApi(root: string, prefix: string): ApiAudit {
  const api = loadApi(root);
  if (!api) throw new TypeError("Cannot read properties of null (reading 'aliases')");
  const rows: PropRow[] = [];
  const events: EventRow[] = [];
  const states: StateRow[] = [];
  const components = readdirSync(join(root, 'spec/components'), { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort();
  for (const name of components) {
    const contract = readJsonSync<ComponentContract>(join(root, 'spec/components', name, 'contract.json'), null);
    if (!contract) continue;
    for (const [prop, p] of Object.entries(contract.props ?? {})) rows.push(resolveProp(api, name, prop, p));
    for (const [e, def] of Object.entries(contract.events ?? {})) events.push({ component: name, event: e, ...(def.native ? { status: 'canonical', to: e } : eventName(api, prefix, e)) });
    for (const key of Object.keys(contract.states ?? {})) {
      const to = api.states.keys[key];
      // A title's key is its kebab-case spelling unless states.canonicalKeys names others (Focus: focus-visible, focus-within).
      const canonical = to ? [api.states.canonicalKeys?.[to] ?? to.toLowerCase().replace(/\s+/g, '-')].flat() : [];
      states.push({ component: name, state: key, to: to ?? null, status: to ? (canonical.includes(key) ? 'canonical' : 'alias') : 'unregistered' });
    }
  }
  const bad = [
    ...rows.filter((r) => r.status === 'unregistered' || r.values.some((v) => v.status === 'unmapped')),
    ...events.filter((e) => e.status === 'unregistered'),
    ...states.filter((s) => s.status === 'unregistered'),
  ];
  const count = (list: { status: string }[], status: string) => list.filter((r) => r.status === status).length;
  return {
    api, rows, events, states, bad,
    totals: { props: rows.length, canonical: count(rows, 'canonical'), alias: count(rows, 'alias'), extension: count(rows, 'extension'), unregistered: count(rows, 'unregistered'), unmappedValues: rows.reduce((n, r) => n + r.values.filter((v) => v.status === 'unmapped').length, 0), events: events.length, eventAliases: count(events, 'alias'), states: states.length, stateAliases: count(states, 'alias') },
  };
}
