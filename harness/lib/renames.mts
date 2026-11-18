// Semantic token renames carried to files that were written before the rename (SB-0060).
// `sketchbook tokens rename` records each rename in spec/tokens/renames.json:
//   { "$description": "...", "renames": [ { "from": "color.primary", "to": "color.main", "date": "YYYY-MM-DD" } ] }
// Catalog units (components, kits) still name the old paths; installing one applies the renames in order with the
// same text rules `tokens rename` uses: whole JSON strings ("{a}" aliases and "a" values) in .json files, and CSS
// variables plus exact quoted token paths in code, styles, stories and specs.
import { join, extname } from 'node:path';
import { readdirSync } from 'node:fs';
import { readJsonSync } from './files.mjs';
import { flatten } from './tokens.mjs';
import { cssVarName } from './css.mjs';

export interface Rename { from: string; to: string; date?: string }
export type RenameMap = Map<string, string>;

export const RENAMES_FILE = 'spec/tokens/renames.json';
const PATH_RE = /^[a-z][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)+$/;
const CODE = new Set(['.ts', '.js', '.mjs', '.cjs', '.css', '.scss', '.mdx', '.html']);
const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// The recorded renames, oldest first; entries that are not two token paths are ignored.
export function readRenames(root: string): Rename[] {
  const list = readJsonSync<{ renames?: (Partial<Rename> | null)[] }>(join(root, RENAMES_FILE))?.renames;
  return Array.isArray(list) ? list.filter((r): r is Rename => PATH_RE.test(r?.from ?? '') && PATH_RE.test(r?.to ?? '') && r?.from !== r?.to) : [];
}

// Every semantic token path the project has now.
export function semanticPaths(root: string): string[] {
  let files: string[] = [];
  try { files = readdirSync(join(root, 'spec/tokens/semantic')).filter((f) => f.endsWith('.tokens.json')); } catch { /* none */ }
  return [...new Set(files.flatMap((f) => flatten(readJsonSync(join(root, 'spec/tokens/semantic', f), {})).map((t) => t.path)))];
}

// One Map(old path -> new path) per rename. A rename of a group moves its tokens: the old paths are found by walking
// the renames backwards from the paths the project has now. Without a match the rename maps its own path only.
export function renameSteps(renames: { from: string; to: string }[], paths: string[] = []): RenameMap[] {
  let now = new Set(paths);
  const steps: RenameMap[] = [];
  for (const { from, to } of [...renames].reverse()) {
    const map: RenameMap = new Map();
    for (const p of now) if (p === to || p.startsWith(to + '.')) map.set(from + p.slice(to.length), p);
    if (!map.size) map.set(from, to);
    const before = new Set([...now].filter((p) => ![...map.values()].includes(p)));
    for (const old of map.keys()) before.add(old);
    now = before;
    steps.unshift(map);
  }
  return steps;
}

// The text rules, shared with sketchbook tokens rename (one source, SB-0060). map is Map(old path -> new path).
// JSON: whole strings only ("{a}" aliases and "a" values).
export function renameJsonText(text: string, map: RenameMap): string {
  let out = text;
  for (const [a, b] of map) out = out.replaceAll(`"{${a}}"`, `"{${b}}"`).replace(new RegExp(`"${esc(a)}"(?=\\s*[,}\\]])`, 'g'), `"${b}"`);
  return out;
}

// Code, styles, stories, specs: CSS variables (longest first, whole names) and exact quoted token paths.
export function renameCodeText(text: string, map: RenameMap, prefix: string): string {
  let out = text;
  const vars = [...map].map(([a, b]): [string, string, string, string] => [cssVarName(prefix, a), cssVarName(prefix, b), a, b]).sort((x, y) => y[0].length - x[0].length);
  for (const [va, vb, a, b] of vars) {
    out = out.replace(new RegExp(`${esc(va)}(?![A-Za-z0-9_-])`, 'g'), vb);
    out = out.replace(new RegExp(`(['"\`])${esc(a)}\\1`, 'g'), `$1${b}$1`);
  }
  return out;
}

// Applies the renames to one file's text. `file` picks the rules (.json: JSON strings; code: CSS vars and quoted paths).
export function applyRenames(text: string, renames: { from: string; to: string }[], prefix: string, { file = '', paths = [] }: { file?: string; paths?: string[] } = {}): string {
  const ext = extname(file);
  const json = ext === '.json';
  if (!renames.length || (!json && !CODE.has(ext))) return text;
  let out = text;
  for (const map of renameSteps(renames, paths)) out = json ? renameJsonText(out, map) : renameCodeText(out, map, prefix);
  return out;
}
