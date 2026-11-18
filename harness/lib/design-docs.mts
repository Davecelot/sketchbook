// spec/design-docs.json: the doc shell the design adapters render. One reader for the adapters, the interface
// (which tokens it uses) and check D3.
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { readJsonSync } from './files.mjs';

export const DOCS_FILE = 'spec/design-docs.json';
const TOKEN = /^(color|space|radius|size|border-width|opacity|elevation|font|layout|focus|motion|layer)\.[a-z0-9][a-z0-9.-]*$/;

export type DesignDocs = Record<string, unknown>;

export interface DocPage { name: string; flow?: string; perBatch?: boolean }
export interface DocBatch { id: string; title: string; components: string[] }
export interface ThemeAxis { name: string; from?: string }
export interface DocShell {
  section: { columns: string; gutter: string };
  body: { pad: string };
  code: { family: string; gap: string; numWidth: string };
  matrix: { line: string; head: { pad: string } };
  tree: { node: { pad: string } };
  header: { pattern: { opacity: string } };
  cards: { specimen: { pad: string } };
  sample: { gap: string };
  doc: { gap: string };
  tokenGroups: { label: string; prefix: string }[];
  [k: string]: unknown;
}
// What the doc builders read; check D3 validates the file, so they take this shape as given.
export interface DesignDocsSpec { pages: DocPage[]; themeAxes?: ThemeAxis[]; batches?: DocBatch[]; shell: DocShell }

export const loadDesignDocs = <T = DesignDocs,>(root: string): T | null => readJsonSync<T>(join(root, DOCS_FILE), null);

// Every semantic token path the shell names: whole strings that look like a token path.
export function docTokenPaths(doc: unknown): string[] {
  const out = new Set<string>();
  const walk = (n: unknown): void => {
    if (typeof n === 'string') { if (TOKEN.test(n)) out.add(n); }
    else if (Array.isArray(n)) n.forEach(walk);
    else if (n && typeof n === 'object') for (const [k, v] of Object.entries(n)) if (!k.startsWith('$')) walk(v);
  };
  walk(doc);
  return [...out].sort();
}

// text-style.<role> (the typography composite push-tokens writes) for a font.size.<role> token.
export const textStyleOf = (sizePath: string): string => `text-style.${sizePath.replace(/^font\.size\./, '')}`;

export const patternFiles = (root: string): string[] => {
  try { return readdirSync(join(root, 'src/patterns'), { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => `src/patterns/${e.name}/pattern.json`).sort(); } catch { return []; }
};

// The semantic tokens the pattern layouts name (what a design file draws a screen with).
export const patternTokenPaths = (root: string): string[] => [...new Set(patternFiles(root).flatMap((f) => docTokenPaths(readJsonSync<{ layout?: unknown }>(join(root, f), null)?.layout ?? {})))].sort();
