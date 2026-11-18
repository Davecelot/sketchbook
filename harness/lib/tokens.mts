// Loading, flattening and resolving DTCG token files across the three layers.
import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import type { ComponentContract } from '../../generated/types/contract.js';
import { errorCode, errorMessage, parseJson } from './files.mjs';

export const ALIAS = /^\{([^{}]+)\}$/;
export const LAYERS = ['foundation', 'semantic', 'component'] as const;

export type Layer = (typeof LAYERS)[number];
export type DtcgDoc = Record<string, unknown>;

export interface FlatToken {
  path: string;
  value: unknown;
  type: string | undefined;
  description: string | undefined;
}

export interface Token extends FlatToken {
  file: string;
  layer: Layer;
  mode: string | null;
}

export interface TokenSet {
  file: string;
  layer: Layer;
  mode: string | null;
  doc?: DtcgDoc;
  error?: string;
  tokens: Token[];
}

export interface LoadedContract {
  name: string;
  file: string;
  contract?: ComponentContract;
  error?: string;
}

export interface TokenData {
  sets: TokenSet[];
  modes: string[];
  contracts: LoadedContract[];
}

export interface Resolved {
  error?: undefined;
  value: unknown;
  type: string | undefined;
  chain: string[];
  token: Token;
}

export interface ResolveFailure {
  error: 'missing' | 'cycle';
  path: string;
  chain: string[];
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const optString = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);

export function flatten(doc: unknown, prefix: string[] = [], inheritedType?: string): FlatToken[] {
  const out: FlatToken[] = [];
  if (!doc || typeof doc !== 'object') return out;
  const type = ('$type' in doc ? optString(doc.$type) : undefined) ?? inheritedType;
  if ('$value' in doc) {
    out.push({ path: prefix.join('.'), value: doc.$value, type, description: '$description' in doc ? optString(doc.$description) : undefined });
    return out;
  }
  const entries: [string, unknown][] = Object.entries(doc);
  for (const [k, v] of entries) {
    if (k.startsWith('$')) continue;
    out.push(...flatten(v, [...prefix, k], type));
  }
  return out;
}

async function readJsonAsync<T>(p: string): Promise<T> { return parseJson<T>(await readFile(p, 'utf8')); }

async function listJson(dir: string): Promise<string[]> {
  try { return (await readdir(dir)).filter((f) => f.endsWith('.json')).sort(); } catch { return []; }
}

export async function loadContracts(root: string): Promise<LoadedContract[]> {
  const dir = join(root, 'spec/components');
  const out: LoadedContract[] = [];
  let names: string[] = [];
  try { names = (await readdir(dir, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name).sort(); } catch { /* absent: treated as empty */ }
  for (const name of names) {
    const file = join(dir, name, 'contract.json');
    try { out.push({ name, file: relative(root, file), contract: await readJsonAsync<ComponentContract>(file) }); } catch (e) {
      if (errorCode(e) !== 'ENOENT') out.push({ name, file: relative(root, file), error: errorMessage(e) });
    }
  }
  return out;
}

// Component tokens are built from each contract's `tokens` field; they live nowhere else.
export function componentTokensFromContracts(contracts: LoadedContract[]): Token[] {
  const tokens: Token[] = [];
  for (const { contract, file } of contracts) {
    if (!contract?.tokens) continue;
    for (const [path, def] of Object.entries(contract.tokens)) {
      const d = typeof def === 'string' ? { value: def, type: undefined, description: undefined } : def;
      tokens.push({ path, value: d.value, type: d.type, description: d.description, file, layer: 'component', mode: null });
    }
  }
  return tokens;
}

export function componentTokensDoc(tokens: Token[]): DtcgDoc {
  const doc: DtcgDoc = { $description: 'GENERATED from spec/components/*/contract.json. Do not edit; change the contract.' };
  for (const t of tokens) {
    let node = doc;
    const parts = t.path.split('.');
    for (const p of parts.slice(0, -1)) {
      const next = node[p];
      if (isRecord(next)) node = next;
      else { const group: DtcgDoc = {}; node[p] = group; node = group; }
    }
    node[parts.at(-1) ?? t.path] = { $value: t.value, ...(t.type ? { $type: t.type } : {}), ...(t.description ? { $description: t.description } : {}) };
  }
  return doc;
}

export async function loadAll(root: string): Promise<TokenData> {
  const sets: TokenSet[] = [];
  const add = async (dir: string, layer: Layer, modeOf: (file: string) => string | null) => {
    for (const f of await listJson(join(root, dir))) {
      const file = join(dir, f);
      let doc: DtcgDoc;
      try { doc = await readJsonAsync<DtcgDoc>(join(root, file)); } catch (e) { sets.push({ file, layer, mode: null, error: errorMessage(e), tokens: [] }); continue; }
      const mode = modeOf(f);
      sets.push({ file, layer, mode, doc, tokens: flatten(doc).map((t) => ({ ...t, file, layer, mode })) });
    }
  };
  await add('spec/tokens/foundation', 'foundation', () => null);
  await add('spec/tokens/semantic', 'semantic', (f) => { const m = f.replace('.tokens.json', ''); return m === 'base' ? null : m; });
  const contracts = await loadContracts(root);
  const comp = componentTokensFromContracts(contracts);
  sets.push({ file: 'spec/components/*/contract.json', layer: 'component', mode: null, tokens: comp });
  const modes = [...new Set(sets.flatMap((s) => (s.mode ? [s.mode] : [])))].sort();
  return { sets, modes, contracts };
}

// Tokens visible in one mode: every mode-less token plus that mode's semantic set.
export function tokensForMode(all: { sets: TokenSet[] }, mode: string | null): Map<string, Token> {
  const map = new Map<string, Token>();
  for (const s of all.sets) {
    if (s.mode && s.mode !== mode) continue;
    for (const t of s.tokens) map.set(t.path, t);
  }
  return map;
}

export function resolve(map: Map<string, Token>, path: string, seen: string[] = []): Resolved | ResolveFailure {
  const t = map.get(path);
  if (!t) return { error: 'missing', path, chain: seen };
  if (seen.includes(path)) return { error: 'cycle', path, chain: [...seen, path] };
  const m = typeof t.value === 'string' ? ALIAS.exec(t.value) : null;
  if (!m) return { value: t.value, type: t.type, chain: [...seen, path], token: t };
  const r = resolve(map, m[1] ?? '', [...seen, path]);
  if (r.error) return r;
  return { ...r, type: t.type ?? r.type };
}
