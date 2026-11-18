// The semantic interface: every semantic token something outside the semantic layer relies on (component tokens in
// contracts, brand links, contrast pairs, and CSS variables used by stories, specs, .storybook and patterns), plus the
// semantic tokens those alias. Written to spec/tokens/interface.json by `npm run generate`; T7 and G1 guard it; the
// `sketchbook tokens` commands (impact, remove, rename) read the same references.
import { readFileSync, readdirSync, writeFileSync, existsSync, type Dirent } from 'node:fs';
import { join } from 'node:path';
import type { HarnessConfigJson } from '../../generated/types/harness-config.js';
import type { BrandLinks } from '../generators/links.mjs';
import { ALIAS, loadAll, type Layer, type Token, type TokenData } from './tokens.mjs';
import { cssVarName } from './css.mjs';
import { DOCS_FILE, docTokenPaths, loadDesignDocs, patternTokenPaths } from './design-docs.mjs';
import { readJsonSync, isMain } from './files.mjs';

export const INTERFACE_FILE = 'spec/tokens/interface.json';

export interface ContrastPair { fg: string; bg: string; kind?: string }
export interface VarRef { name: string; line: number }
export interface FileRef extends VarRef { file: string; category: string }
export interface Reference { path: string; source: string; detail: string; file?: string }
export interface InterfaceToken { type: string | null; in: 'missing' | 'base' | 'modes'; usedBy: string[] }
export interface InterfaceDoc { $description: string; tokens: Record<string, InterfaceToken> }
export interface InterfaceInputs {
  all: Pick<TokenData, 'sets' | 'contracts'>;
  prefix: string;
  links?: BrandLinks;
  contrastPairs?: ContrastPair[];
  refs?: FileRef[];
  designDocs?: string[];
}
type TokenIndex = Pick<TokenData, 'sets'>;

// Where CSS variables are used outside component styles, by category.
const SCAN: { dir: string; category: string; match: (f: string) => boolean }[] = [
  { dir: 'src', category: 'stories', match: (f) => /\.stories\.(ts|js|mdx)$/.test(f) && !f.startsWith('src/patterns/') },
  { dir: 'src/stories', category: 'stories', match: (f) => /\.(ts|js|mdx|css)$/.test(f) },
  { dir: 'src/patterns', category: 'patterns', match: (f) => /\.(ts|js|css)$/.test(f) },
  { dir: 'playwright', category: 'specs', match: (f) => /\.(ts|js)$/.test(f) },
  { dir: '.storybook', category: '.storybook', match: (f) => /\.(ts|js|mjs|css)$/.test(f) },
];
const SKIP = /(^|\/)(node_modules|playwright-report|test-results|storybook-static)(\/|$)/;

function walk(root: string, dir: string, out: string[] = []): string[] {
  let entries: Dirent[];
  try { entries = readdirSync(join(root, dir), { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const rel = `${dir}/${e.name}`;
    if (SKIP.test(rel)) continue;
    if (e.isDirectory()) walk(root, rel, out);
    else out.push(rel);
  }
  return out;
}

// Files that may reference token CSS variables directly: [{ file, category }], each file once.
export function referenceFiles(root: string): { file: string; category: string }[] {
  const seen = new Map<string, string>();
  for (const s of SCAN) for (const f of walk(root, s.dir)) if (s.match(f) && !seen.has(f)) seen.set(f, s.category);
  return [...seen].sort(([a], [b]) => a.localeCompare(b)).map(([file, category]) => ({ file, category }));
}

const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// CSS variable references with the prefix in one text: var(--p-x…) and exact quoted '--p-x' strings (getPropertyValue).
// Names ending in "-" are built at runtime (template strings) and skipped; names the file declares itself are local.
export function varRefs(text: string, prefix: string): VarRef[] {
  const p = esc(prefix);
  const refs: VarRef[] = [];
  const declared = new Set([...text.matchAll(new RegExp(`(--${p}-[A-Za-z0-9_-]+)\\s*:`, 'g'))].map((m) => m[1]));
  const add = (name: string | undefined, index: number | undefined): void => { if (name !== undefined && !name.endsWith('-') && !declared.has(name)) refs.push({ name, line: text.slice(0, index).split('\n').length }); };
  for (const m of text.matchAll(new RegExp(`var\\(\\s*(--${p}-[A-Za-z0-9_-]+)`, 'g'))) add(m[1], m.index);
  for (const m of text.matchAll(new RegExp(`(['"\`])(--${p}-[A-Za-z0-9_-]+)\\1`, 'g'))) add(m[2], m.index);
  return refs;
}

export function scanRefs(root: string, prefix: string): FileRef[] {
  const out: FileRef[] = [];
  for (const { file, category } of referenceFiles(root)) {
    let text: string;
    try { text = readFileSync(join(root, file), 'utf8'); } catch { continue; }
    for (const r of varRefs(text, prefix)) out.push({ ...r, file, category });
  }
  return out;
}

// CSS variable name -> { path, layer } for every token in every layer.
export function varIndex(all: TokenIndex, prefix: string): Map<string, { path: string; layer: Layer }> {
  const m = new Map<string, { path: string; layer: Layer }>();
  for (const s of all.sets) for (const t of s.tokens) if (!m.has(cssVarName(prefix, t.path))) m.set(cssVarName(prefix, t.path), { path: t.path, layer: s.layer });
  return m;
}

const aliasOf = (v: unknown): string | null => (typeof v === 'string' ? ALIAS.exec(v)?.[1] ?? null : null);

// Where each semantic token lives: path -> sorted list of files ("base" or a mode name).
export function semanticLocations(all: TokenIndex): Map<string, string[]> {
  const loc = new Map<string, string[]>();
  for (const s of all.sets.filter((x) => x.layer === 'semantic')) {
    const where = s.mode ?? 'base';
    for (const t of s.tokens) loc.set(t.path, [...(loc.get(t.path) ?? []), where].sort());
  }
  return loc;
}

// Every reference to a token from outside its own layer: [{ path, source, detail }]. Pure over loaded data.
export function collectReferences({ all, links, contrastPairs, refs, prefix, designDocs }: InterfaceInputs): Reference[] {
  const out: Reference[] = [];
  for (const path of designDocs ?? []) out.push({ path, source: 'design-docs', detail: `${DOCS_FILE}` });
  for (const { name, contract } of all.contracts) {
    for (const [tokenPath, def] of Object.entries(contract?.tokens ?? {})) {
      const target = aliasOf(typeof def === 'string' ? def : def?.value);
      if (target) out.push({ path: target, source: `contract:${name}`, detail: `component token ${tokenPath}` });
    }
    for (const p of contract?.accessibility?.contrast ?? []) for (const k of ['fg', 'bg'] as const) if (p[k]) out.push({ path: p[k], source: `contract:${name}`, detail: `contrast pair ${p.fg} on ${p.bg}` });
  }
  for (const [path, link] of Object.entries(links ?? {})) {
    if (path.startsWith('$')) continue;
    out.push({ path, source: 'brand-links', detail: `follows ${link.from}${link.role ?? link.ramp ? ` ${link.role ?? link.ramp}` : ''}` });
    for (const a of link.alsoOn ?? []) out.push({ path: a, source: 'brand-links', detail: `contrast reference of ${path}` });
  }
  for (const p of contrastPairs ?? []) for (const k of ['fg', 'bg'] as const) if (p[k]) out.push({ path: p[k], source: 'contrast', detail: `spec/tokens/contrast.json ${p.fg} on ${p.bg}` });
  const index = varIndex(all, prefix);
  for (const r of refs ?? []) {
    const hit = index.get(r.name);
    if (hit) out.push({ path: hit.path, source: r.category, detail: `${r.file}:${r.line} ${r.name}`, file: r.file });
  }
  return out;
}

// Pure: the interface document.
export function computeInterface({ all, links, contrastPairs, refs, prefix, designDocs }: InterfaceInputs): InterfaceDoc {
  const loc = semanticLocations(all);
  const semanticTokens = new Map<string, Token>();
  for (const s of all.sets.filter((x) => x.layer === 'semantic')) for (const t of s.tokens) semanticTokens.set(t.path, t);
  const used = new Map<string, Set<string>>();
  const use = (path: string, source: string): void => {
    const sources = used.get(path) ?? new Set<string>();
    used.set(path, sources);
    sources.add(source);
  };
  const foundation = new Set(all.sets.filter((s) => s.layer === 'foundation').flatMap((s) => s.tokens.map((t) => t.path)));
  const component = new Set(all.sets.filter((s) => s.layer === 'component').flatMap((s) => s.tokens.map((t) => t.path)));
  for (const r of collectReferences({ all, links, contrastPairs, refs, prefix, designDocs })) {
    // A reference to a semantic token, or to a path no layer has (still an interface need: T7 reports it).
    if (loc.has(r.path) || (!foundation.has(r.path) && !component.has(r.path))) use(r.path, r.source);
  }
  // Semantic tokens aliased by interface tokens are part of the interface too.
  const queue = [...used.keys()];
  for (let p = queue.shift(); p !== undefined; p = queue.shift()) {
    for (const s of all.sets.filter((x) => x.layer === 'semantic')) {
      const t = s.tokens.find((x) => x.path === p);
      const target = aliasOf(t?.value);
      if (target && loc.has(target)) {
        const isNew = !used.has(target);
        use(target, `alias:${p}`);
        if (isNew) queue.push(target);
      }
    }
  }
  const tokens: Record<string, InterfaceToken> = {};
  for (const path of [...used.keys()].sort()) {
    const where = loc.get(path) ?? [];
    tokens[path] = { type: semanticTokens.get(path)?.type ?? null, in: !where.length ? 'missing' : where.includes('base') ? 'base' : 'modes', usedBy: [...(used.get(path) ?? [])].sort() };
  }
  return {
    $description: 'GENERATED by npm run generate (harness/lib/interface.mjs). Semantic tokens that components, brand links, contrast pairs, stories, specs, .storybook and patterns rely on. "in": base (mode-less) or modes (every mode in brand.config). Change values freely; rename only with sketchbook tokens rename. Check T7 guards it.',
    tokens,
  };
}

export async function loadInterfaceInputs(root: string): Promise<InterfaceInputs> {
  const config = readJsonSync<HarnessConfigJson>(join(root, 'harness.config.json'));
  const prefix = config?.prefix ?? 'sb';
  const all = await loadAll(root);
  return {
    all, prefix,
    links: readJsonSync<{ links?: BrandLinks }>(join(root, 'spec/tokens/brand-links.json'))?.links ?? {},
    contrastPairs: readJsonSync<{ pairs?: ContrastPair[] }>(join(root, 'spec/tokens/contrast.json'))?.pairs ?? [],
    refs: scanRefs(root, prefix),
    designDocs: [...docTokenPaths(loadDesignDocs(root)), ...patternTokenPaths(root)],
  };
}

export const serializeInterface = (doc: InterfaceDoc): string => JSON.stringify(doc, null, 2) + '\n';

export async function buildInterface(root: string, { write = true }: { write?: boolean } = {}): Promise<{ doc: InterfaceDoc; text: string }> {
  const doc = computeInterface(await loadInterfaceInputs(root));
  const text = serializeInterface(doc);
  if (write && existsSync(join(root, 'spec/tokens'))) writeFileSync(join(root, INTERFACE_FILE), text);
  return { doc, text };
}

if (isMain(import.meta.url)) {
  const { doc } = await buildInterface(process.cwd());
  console.log(`${INTERFACE_FILE}: ${Object.keys(doc.tokens).length} interface tokens`);
}
