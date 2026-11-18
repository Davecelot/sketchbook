// spec/icons.json: the icons the system uses (Lucide, ISC). Geometry is stored here, so syncing to a design tool needs
// no dependency; lucide-static is only read by `sketchbook icons add`.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { readJson, readJsonSync } from './files.mjs';
import { writeFile } from 'node:fs/promises';

export type IconNode = [tag: string, attrs: Record<string, string>];
export interface IconEntry { category: string; aliases: string[]; nodes: IconNode[] | null }
export interface IconCatalog { $description?: string; set: string; icons: Record<string, IconEntry> }

export const ICONS_FILE = 'spec/icons.json';
const EMPTY: IconCatalog = { $description: 'The icons the system uses (Lucide, ISC license). Edit with `sketchbook icons add|remove`; the design adapters draw one component per icon. Sizes are the size.icon.* tokens.', set: 'lucide', icons: {} };

export const loadIcons = (root: string): IconCatalog => readJsonSync<IconCatalog>(join(root, ICONS_FILE), EMPTY) ?? EMPTY;

export const svgOf = (nodes: IconNode[]): string => nodes.map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).filter(([k]) => k !== 'key').map(([k, v]) => `${k}="${v}"`).join(' ')}/>`).join('');

// icon-nodes.json lacks some icons that exist as SVG files (bold, circle-alert), so the SVG files are the source.
const ELEMENT = /<(\w+)\s+([^>]*?)\s*\/>/g;
const ATTR = /([\w-]+)="([^"]*)"/g;
const nodesOfSvg = (svg: string): IconNode[] => [...svg.slice(svg.indexOf('>', svg.indexOf('<svg')) + 1).matchAll(ELEMENT)].map(([, tag = '', attrs = '']): IconNode => [tag, Object.fromEntries([...attrs.matchAll(ATTR)].map(([, k = '', v = '']) => [k, v]))]);

function lucide(): { nodeOf: (name: string) => IconNode[] | null; tags: Record<string, string[]> } {
  try {
    const require = createRequire(import.meta.url);
    const dir = dirname(require.resolve('lucide-static/package.json'));
    return {
      nodeOf: (name) => { try { return nodesOfSvg(readFileSync(join(dir, 'icons', `${name}.svg`), 'utf8')); } catch { return null; } },
      tags: readJson<Record<string, string[]>>(join(dir, 'tags.json')),
    };
  } catch {
    throw Object.assign(new Error('lucide-static is not installed.'), { fix: 'npm install --save-dev lucide-static' });
  }
}

export async function writeIcons(root: string, catalog: IconCatalog): Promise<void> {
  const icons = Object.fromEntries(Object.entries(catalog.icons).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(join(root, ICONS_FILE), JSON.stringify({ ...catalog, icons }, null, 2) + '\n');
}

export async function addIcons(root: string, names: string[], category?: string): Promise<{ added: string[]; total: number }> {
  const catalog = loadIcons(root);
  const { nodeOf, tags } = lucide();
  const unknown = names.filter((n) => !nodeOf(n));
  if (unknown.length) throw Object.assign(new Error(`Not in Lucide: ${unknown.join(', ')}.`), { fix: 'Use the file name on lucide.dev/icons (kebab-case).' });
  const added: string[] = [];
  for (const name of names) {
    const existing = catalog.icons[name];
    if (existing) { if (category) existing.category = category; continue; }
    if (!category) throw Object.assign(new Error(`Icon "${name}" needs a category.`), { fix: 'sketchbook icons add <name> --category action|navigation|feedback|content|...' });
    catalog.icons[name] = { category, aliases: (tags[name] ?? []).slice(0, 8), nodes: nodeOf(name) };
    added.push(name);
  }
  await writeIcons(root, catalog);
  return { added, total: Object.keys(catalog.icons).length };
}

export async function removeIcons(root: string, names: string[]): Promise<{ removed: string[]; missing: string[]; total: number }> {
  const catalog = loadIcons(root);
  const removed = names.filter((n) => catalog.icons[n]);
  for (const n of removed) delete catalog.icons[n];
  await writeIcons(root, catalog);
  return { removed, missing: names.filter((n) => !removed.includes(n)), total: Object.keys(catalog.icons).length };
}
