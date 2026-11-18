// Token data for the Foundations pages, read at build/dev time straight from the DTCG files
// (spec/tokens/**, generated component tokens, contrast pairs, the prefix). Globs instead of fixed
// imports: a new token file shows up by itself and a missing one is simply absent. Vite reloads
// the pages when any of these files changes, so an edit shows immediately.

type Doc = Record<string, unknown>;
export type Layer = 'foundation' | 'semantic' | 'component';
export type Token = { path: string; value: unknown; type?: string; description?: string; layer: Layer; mode: string | null; file: string };
export type ContrastPair = { fg: string; bg: string; kind: string };
export type Resolved = { value?: unknown; type?: string; chain: string[]; error?: string };

const foundationFiles = import.meta.glob<Doc>('../../../spec/tokens/foundation/*.tokens.json', { eager: true, import: 'default' });
const semanticFiles = import.meta.glob<Doc>('../../../spec/tokens/semantic/*.tokens.json', { eager: true, import: 'default' });
const componentFiles = import.meta.glob<Doc>('../../../generated/tokens/component.tokens.json', { eager: true, import: 'default' });
const contrastFiles = import.meta.glob<{ pairs?: ContrastPair[] }>('../../../spec/tokens/contrast.json', { eager: true, import: 'default' });
const configFiles = import.meta.glob<{ prefix?: string }>('../../../harness.config.json', { eager: true, import: 'default' });

const repoPath = (key: string) => key.replace(/^(\.\.\/)+/, '');
const first = <T>(files: Record<string, T>): T | undefined => Object.values(files)[0];

export const prefix = first(configFiles)?.prefix ?? 'sb';
export const cssVar = (path: string) => `--${prefix}-${path.replace(/\./g, '-')}`;
export const contrastPairs: ContrastPair[] = first(contrastFiles)?.pairs ?? [];

// Same walk as harness/lib/tokens.mjs: a node with $value is a token; $type is inherited.
export function flatten(doc: unknown, prefixPath: string[] = [], inherited?: string): Omit<Token, 'layer' | 'mode' | 'file'>[] {
  if (!doc || typeof doc !== 'object') return [];
  const node = doc as Doc;
  const type = (node.$type as string | undefined) ?? inherited;
  if ('$value' in node) return [{ path: prefixPath.join('.'), value: node.$value, type, description: node.$description as string | undefined }];
  return Object.entries(node).flatMap(([k, v]) => (k.startsWith('$') ? [] : flatten(v, [...prefixPath, k], type)));
}

const load = (files: Record<string, Doc>, layer: Layer, modeOf: (name: string) => string | null): Token[] =>
  Object.entries(files)
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([key, doc]) => {
      const file = repoPath(key);
      const mode = modeOf(file.split('/').pop()!.replace('.tokens.json', ''));
      return flatten(doc).map((t) => ({ ...t, layer, mode, file }));
    });

export const foundation = load(foundationFiles, 'foundation', () => null);
export const semantic = load(semanticFiles, 'semantic', (name) => (name === 'base' ? null : name));
export const component = load(componentFiles, 'component', () => null);

// Color modes are the semantic files other than base; light first when there is one.
export const modes = [...new Set(semantic.map((t) => t.mode).filter((m): m is string => !!m))].sort((a, b) =>
  a === 'light' ? -1 : b === 'light' ? 1 : a.localeCompare(b),
);

// Tokens visible in one mode: everything mode-less plus that mode's semantic set.
const maps = new Map<string | null, Map<string, Token>>();
export function mapFor(mode: string | null): Map<string, Token> {
  const key = mode ?? modes[0] ?? null;
  let map = maps.get(key);
  if (!map) {
    map = new Map();
    for (const t of [...foundation, ...semantic, ...component]) if (!t.mode || t.mode === key) map.set(t.path, t);
    maps.set(key, map);
  }
  return map;
}

const ALIAS = /^\{([^{}]+)\}$/;
export const aliasOf = (value: unknown) => (typeof value === 'string' ? ALIAS.exec(value)?.[1] : undefined);

export function resolve(path: string, mode: string | null, seen: string[] = []): Resolved {
  const t = mapFor(mode).get(path);
  if (!t) return { error: 'missing', chain: [...seen, path] };
  if (seen.includes(path)) return { error: 'cycle', chain: [...seen, path] };
  const target = aliasOf(t.value);
  if (!target) return { value: t.value, type: t.type, chain: [...seen, path] };
  const r = resolve(target, mode, [...seen, path]);
  return r.error ? r : { ...r, type: t.type ?? r.type };
}

// Tokens whose value is an alias to this path (one step), across all layers: "used by".
export function usersOf(path: string): Token[] {
  return [...foundation, ...semantic, ...component].filter((t) => aliasOf(t.value) === path);
}

type Shadow = { color?: string; offsetX?: string; offsetY?: string; blur?: string; spread?: string; inset?: boolean };

// A resolved token value as CSS text (what the generated stylesheet would contain).
export function cssValue(value: unknown, type?: string): string {
  if (value === undefined || value === null) return '';
  if (type === 'cubicBezier' && Array.isArray(value)) return `cubic-bezier(${value.join(', ')})`;
  if (type === 'shadow' || (typeof value === 'object' && value && 'offsetY' in value)) {
    const list = (Array.isArray(value) ? value : [value]) as Shadow[];
    return list.map((s) => [s.inset ? 'inset' : '', s.offsetX, s.offsetY, s.blur, s.spread, s.color].filter(Boolean).join(' ')).join(', ');
  }
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : '';
}

// px and rem for a dimension (rem against the 16px browser default).
export function pxRem(value: string): string {
  const m = /^(-?\d*\.?\d+)px$/.exec(value);
  if (!m) return value;
  const rem = Number(m[1]) / 16;
  return `${value} · ${Number(rem.toFixed(4))}rem`;
}

export const toMs = (value: string): number | undefined => {
  const m = /^(\d*\.?\d+)(ms|s)$/.exec(value);
  return m ? Number(m[1]) * (m[2] === 's' ? 1000 : 1) : undefined;
};

// WCAG 2.x contrast ratio, browser-safe port of harness/lib/color.mjs (6-digit hex only).
const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
function luminance(hex: string): number | undefined {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return undefined;
  const n = parseInt(m[1] ?? '', 16);
  const [r = 0, g = 0, b = 0] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => toLinear(c / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function wcagRatio(fg: string, bg: string): number | undefined {
  const a = luminance(fg);
  const b = luminance(bg);
  if (a === undefined || b === undefined) return undefined;
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}
