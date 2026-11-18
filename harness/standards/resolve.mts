// Standards catalog + brand.config resolver. brand.config (v1 or v2) -> one plain object with every foundation
// value the generator and the semantic links need. Each foundation key accepts a preset id, { preset }, { custom },
// and fine overrides (any other key, merged over the preset's values). Missing keys fall back to the family default,
// so an empty config reproduces the shipped system.
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { BrandConfig } from '../../generated/types/brand-config.js';
import { readJson } from '../lib/files.mjs';

export type Json = string | number | boolean | null | Json[] | { [k: string]: Json | undefined };
export type JsonObject = { [k: string]: Json | undefined };

export interface Preset {
  id: string;
  label?: string;
  description?: string;
  aliases?: string[];
  implemented?: boolean;
  recommended?: boolean;
  source?: Json;
  verified?: Json;
  values: JsonObject;
}

export interface Family {
  family: string;
  $description?: string;
  default: string | null;
  presets: Preset[];
}

export type Catalog = Record<string, Family>;
export type ModeRole = 'light' | 'dark';
export interface Mode { name: string; role: ModeRole }

const DIR = new URL('./', import.meta.url);
let CATALOG: Catalog | null = null;

export function loadCatalog(): Catalog {
  if (CATALOG) return CATALOG;
  const catalog: Catalog = (CATALOG = {});
  for (const f of readdirSync(DIR).filter((n) => n.endsWith('.json')).sort()) {
    const j = readJson<Family>(fileURLToPath(new URL(f, DIR)));
    catalog[j.family] = j;
  }
  return catalog;
}

export const families = (): string[] => Object.keys(loadCatalog());

export function family(name: string): Family {
  const c = loadCatalog()[name];
  if (!c) throw new Error(`Unknown foundation family "${name}". Known: ${families().join(', ')}.`);
  return c;
}

export const presetsOf = (name: string): Preset[] => family(name).presets;

export function getPreset(name: string, id: unknown): Preset {
  const p = presetsOf(name).find((x) => x.id === id || (typeof id === 'string' && x.aliases?.includes(id)));
  if (!p) throw new Error(`Unknown ${name} preset "${String(id)}". Known: ${presetsOf(name).map((x) => x.id).join(', ')}.`);
  return p;
}

// Where each family is chosen in brand.config.json.
export const FAMILY_KEYS: Record<string, string> = {
  spacing: 'spacing', typeScale: 'typography.scale', lineHeight: 'typography.lineHeights', letterSpacing: 'typography.letterSpacing',
  weights: 'typography.weights', rampMethods: 'color.ramp', neutrals: 'color.neutral', contrast: 'contrast', radius: 'radius',
  elevation: 'elevation', motion: 'motion', density: 'density', layoutGrid: 'grid', breakpoints: 'breakpoints', iconSizes: 'icons',
  zIndex: 'z', opacity: 'opacity', borderWidth: 'border',
};

export const TYPE_STEPS: string[] = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl'];
const RADIUS_STEPS = ['xs', 'sm', 'md', 'lg', 'xl'];
const RADIUS_ROLES: JsonObject = { xsmall: 'xs', small: 'sm', control: 'md', surface: 'lg', large: 'xl', pill: 'full' };
const DEFAULT_FAMILY = 'ui-sans-serif';
const DEFAULT_FALLBACK = "system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'";
const DEFAULT_MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

const isObj = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
const isJsonObject = (v: Json | undefined): v is JsonObject => v !== null && typeof v === 'object' && !Array.isArray(v);
const asObj = (v: Json | undefined): JsonObject | undefined => (isJsonObject(v) ? v : undefined);
const at = (v: Json | undefined, key: string): Json | undefined => (isJsonObject(v) ? v[key] : undefined);
const str = (v: Json | undefined): string => (v !== null && typeof v === 'object' ? JSON.stringify(v) : String(v));
const clone = <T,>(v: T): T => (v === undefined ? v : structuredClone(v));

// The merged value keeps the shape of the preset it starts from; brand.config.json is validated against its schema before it gets here.
function merge<T = unknown>(a: unknown, b: unknown): T;
function merge(a: unknown, b: unknown): unknown {
  if (!isObj(a) || !isObj(b)) return clone(b);
  const out: Record<string, unknown> = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = isObj(v) && isObj(a[k]) ? merge(a[k], v) : clone(v);
  return out;
}

function required(name: string, value: JsonObject | null): JsonObject {
  if (value === null) throw new Error(`Foundation "${name}" resolved to no value.`);
  return value;
}

// One foundation option: preset (or the family default) or custom, then fine overrides on top.
function option(name: string, input: unknown, fromCustom: (c: unknown) => unknown = (c) => c): JsonObject | null {
  const given = input === undefined || input === null ? {} : typeof input === 'string' ? { preset: input } : input;
  const { preset, custom, $description: _note, ...fine }: Record<string, unknown> = isObj(given) ? given : {};
  let base: unknown;
  if (custom !== undefined) base = clone(fromCustom(custom));
  else {
    const id = preset ?? family(name).default;
    if (id == null) return Object.keys(fine).length ? merge<JsonObject>({}, fine) : null;
    const p = getPreset(name, id);
    if (p.implemented === false) throw new Error(`${name} preset "${p.id}" is catalogued but not implemented yet. Implemented: ${presetsOf(name).filter((x) => x.implemented !== false).map((x) => x.id).join(', ')}.`);
    base = clone(p.values);
  }
  return merge<JsonObject>(base, fine);
}

type ModesInput = { modes?: BrandConfig['modes'] } | null | undefined;

// Modes by name; role (light | dark) drives which ramp steps the links pick and the prefers-color-scheme block.
export function modesOf(brand?: ModesInput): Mode[] {
  const roleOf = (name: string): ModeRole => (name === 'dark' ? 'dark' : 'light');
  const modes: (string | { name: string; role?: ModeRole })[] = brand?.modes ?? ['light', 'dark'];
  return modes.map((m) => (typeof m === 'string' ? { name: m, role: roleOf(m) } : { name: m.name, role: m.role ?? roleOf(m.name) }));
}
export const modeNames = (brand?: ModesInput): string[] => modesOf(brand).map((m) => m.name);

export function contrastOf(brand?: { contrast?: BrandConfig['contrast'] } | null): { id: string; targets: JsonObject; apca: boolean } {
  const c = brand?.contrast ?? {};
  const p = getPreset('contrast', c.preset ?? c.standard ?? family('contrast').default);
  return { id: p.id, targets: merge<JsonObject>(p.values, c.targets ?? {}), apca: c.apca ?? false };
}

function typography(t: NonNullable<BrandConfig['typography']> = {}) {
  const asSizes = (c: unknown): unknown => (Array.isArray(c) ? { sizes: Object.fromEntries(c.map((v: unknown, i) => [String(TYPE_STEPS[i]), v])) } : isObj(c) && (c.ratio || c.sizes) ? c : { sizes: c });
  const scaleInput = typeof t.scale === 'number' ? { custom: { ratio: t.scale } } : t.scale;
  const scale = required('typeScale', option('typeScale', scaleInput, asSizes));
  const baseSize = t.baseSize ?? 16;
  const sizes = asObj(scale.sizes) ?? Object.fromEntries(TYPE_STEPS.map((n, i) => [n, 2 * Math.round((baseSize * Number(scale.ratio) ** (i - 2)) / 2)]));
  const lh = required('lineHeight', option('lineHeight', t.lineHeights));
  const leading = scale.leading && !t.lineHeights ? scale.leading : Object.fromEntries(Object.keys(sizes).map((n, i) => [n, i < 3 ? lh.text : lh.display]));
  const family = t.family ?? DEFAULT_FAMILY;
  const fallback = t.fallback ?? DEFAULT_FALLBACK;
  return {
    sans: fallback ? `${family}, ${fallback}` : family,
    mono: t.mono ?? DEFAULT_MONO,
    baseSize, sizes, leading, lineHeights: lh.named,
    letterSpacing: required('letterSpacing', option('letterSpacing', t.letterSpacing)),
    weights: required('weights', option('weights', t.weights)),
    source: t.source ?? { kind: 'none' as const },
  };
}

function radius(input: unknown) {
  let r = input;
  if (isObj(r) && 'style' in r) { const { style, ...rest } = r; r = { preset: style, ...rest }; }
  const fromCustom = (c: unknown): unknown => (Array.isArray(c) ? { scale: Object.fromEntries(c.map((v: unknown, i) => [String(RADIUS_STEPS[i]), v])) } : isObj(c) && !c.scale && !('base' in c) ? { scale: c } : c);
  const v = required('radius', option('radius', r, fromCustom));
  const b = v.base;
  const computed = b === undefined ? {} : { xs: Math.max(0, Number(b) - 6), sm: Math.max(0, Number(b) - 4), md: Math.max(0, Number(b) - 2), lg: Number(b), xl: Number(b) + 4 };
  const scale = asObj(v.scale);
  const roles: JsonObject = { ...RADIUS_ROLES, ...(asObj(v.roles) ?? {}) };
  return { scale: { none: 0, ...computed, ...(scale ?? {}), full: scale?.full ?? 9999 }, roles };
}

// Semantic color names (and their -foreground pairs) a foundation ramp must not take: a path is a token or a group.
const SEMANTIC_COLORS = ['background', 'foreground', 'card', 'popover', 'primary', 'secondary', 'muted', 'accent', 'destructive', 'border', 'input', 'ring', 'success', 'warning', 'info'];

export interface ColorRole {
  ramp: Json | undefined;
  hex?: Json | undefined;
  seeded?: boolean;
  darkOffset: Json | undefined;
  neutral?: Json | undefined;
}

function colorRoles(color: NonNullable<BrandConfig['color']>): Record<string, ColorRole> {
  const accents = color.accents ?? {};
  for (const name of Object.keys(accents)) {
    if (SEMANTIC_COLORS.includes(name) || name.endsWith('-foreground') || ['white', 'black', 'neutral', 'brand'].includes(name)) {
      throw new Error(`color.accents.${name} collides with a semantic or reserved color name; name the accent by its hue (e.g. green) and map it with color.roles.`);
    }
  }
  const named: Record<string, string | undefined> = color.roles ?? {};
  const roles: Record<string, ColorRole> = {};
  for (const p of presetsOf('semanticRoles')) {
    if (p.id === 'primary') continue;
    const ramp = named[p.id] ?? p.values.accent;
    if (named[p.id] && !accents[str(ramp)]) throw new Error(`color.roles.${p.id} names accent "${str(ramp)}", which is not in color.accents.`);
    roles[p.id] = { ramp, hex: accents[str(ramp)] ?? p.values.seed, seeded: !accents[str(ramp)], darkOffset: p.values.darkOffset };
  }
  const primary = getPreset('semanticRoles', 'primary').values;
  roles.primary = { ramp: 'brand', darkOffset: primary.darkOffset, neutral: primary.neutral };
  return roles;
}

export function resolveBrand(brand: Partial<BrandConfig> = {}) {
  const color = brand.color ?? {};
  const rampInput = color.ramp ?? {};
  const method = getPreset('rampMethods', rampInput.method ?? rampInput.preset ?? family('rampMethods').default);
  if (method.implemented === false) throw new Error(`Ramp method "${method.id}" is catalogued but not implemented yet. Implemented: oklch.`);
  const density = required('density', option('density', brand.density));
  const icons = required('iconSizes', option('iconSizes', brand.icons));
  const sizes = new Set<number>();
  for (let n = 12; n <= 56; n += 4) sizes.add(n);
  for (const v of [...Object.values(asObj(density.height) ?? {}), ...Object.values(icons), 24]) sizes.add(Number(v));
  const elevation = required('elevation', option('elevation', brand.elevation));
  const elevationRoles: JsonObject = { ...Object.fromEntries(['xs', 'sm', 'md', 'lg'].map((k) => [k, k])), ...(asObj(elevation.roles) ?? {}) };
  return {
    name: brand.name,
    modes: modesOf(brand),
    color: {
      primary: color.primary ?? 'neutral',
      neutral: required('neutrals', option('neutrals', color.neutral)),
      accents: color.accents ?? {},
      roles: colorRoles(color),
      ramp: { method: method.id, steps: rampInput.steps ?? method.values.steps, lightness: method.values.lightness },
    },
    typography: typography(brand.typography),
    spacing: required('spacing', option('spacing', brand.spacing)),
    radius: radius(brand.radius),
    border: required('borderWidth', option('borderWidth', brand.border)),
    opacity: required('opacity', option('opacity', brand.opacity)),
    sizes: [...sizes].sort((a, b) => a - b),
    elevation: { shadows: elevation.shadows, roles: elevationRoles },
    grid: required('layoutGrid', option('layoutGrid', brand.grid)),
    breakpoints: required('breakpoints', option('breakpoints', brand.breakpoints)),
    motion: required('motion', option('motion', brand.motion)),
    z: required('zIndex', option('zIndex', brand.z)),
    density, icons,
    contrast: contrastOf(brand),
  };
}

export type ResolvedBrand = ReturnType<typeof resolveBrand>;

// Foundation token a semantic link points at, for the non-color families ({ from, role } in brand-links.json).
export function foundationTarget(r: ResolvedBrand, from: string, role: string): string | null {
  const [group = '', key = ''] = role.split('.');
  switch (from) {
    case 'density': {
      const v = at(r.density[group], key);
      if (v === undefined) return null;
      return group === 'height' ? `size.${str(v)}` : `space.${str(v)}`;
    }
    case 'radius': return r.radius.roles[role] ? `radius.${str(r.radius.roles[role])}` : null;
    case 'motion': return at(r.motion.roles, role) ? `${group}.${str(at(r.motion.roles, role))}` : null;
    case 'elevation': return r.elevation.roles[role] ? `shadow.${str(r.elevation.roles[role])}` : null;
    case 'icons': return r.icons[role] !== undefined ? `size.${str(r.icons[role])}` : null;
    case 'z': return at(r.z.roles, role) !== undefined ? `z.${str(at(r.z.roles, role))}` : null;
    default: return null;
  }
}
