import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { semanticLocations } from '../lib/interface.mjs';
import { DOCS_FILE, loadDesignDocs } from '../lib/design-docs.mjs';
import { kebab } from '../commands/catalog.mjs';
import type { CheckContext, CheckIssue, CheckResult } from './types.mjs';

export const id = 'D3';
export const title = 'Design docs: the shell file is complete, its readable view names only real tokens, the doc width is set';

const DIR = 'docs/design-docs';
const VIEW = ['README', 'anatomy', 'pages', 'foundations', 'components', 'themes', 'tool-mapping', 'reference-android-kit'];
const SHELL = ['doc', 'header', 'body', 'section', 'cards', 'caption'];
const WORD = /(?<![\w/.-])((?:color|space|radius|size|border-width|opacity|elevation|layout\.grid)\.[a-z0-9][a-z0-9.-]*)/g;
const FILE_EXT = /\.(json|mjs|md|js|ts)$/;
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const field = (v: unknown, k: string): unknown => (isRecord(v) ? v[k] : undefined);
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

export function run({ root, config, all, registry }: CheckContext): CheckResult {
  const errors: CheckIssue[] = [];
  if (!existsSync(join(root, DOCS_FILE))) return { errors, info: [`no ${DOCS_FILE}: design docs are not set up in this project`] };
  const doc = loadDesignDocs(root);
  if (!doc?.shell) errors.push({ file: DOCS_FILE, msg: 'missing or has no "shell"', fix: `Restore ${DOCS_FILE} (docs/design-docs/anatomy.md describes it).` });
  else for (const k of SHELL) if (!field(doc.shell, k)) errors.push({ file: DOCS_FILE, msg: `shell.${k} is missing`, fix: 'Add the region; docs/design-docs/anatomy.md lists them.' });
  for (const k of ['pages', 'themeAxes']) if (doc && !Array.isArray(doc[k])) errors.push({ file: DOCS_FILE, msg: `${k} must be an array`, fix: `Set ${k} (docs/design-docs/pages.md, themes.md).` });

  if (Array.isArray(doc?.batches)) {
    const folders = existsSync(join(root, 'spec/components')) ? readdirSync(join(root, 'spec/components'), { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name) : [];
    // A removed component keeps its registry entry (status planned, no path: only its name), so a starter that removes it does not break the batches.
    const known = new Set([...folders, ...(registry?.components ?? []).map((c) => (c.path ? basename(c.path) : kebab(c.name ?? '')))]);
    for (const b of doc.batches) for (const c of list(field(b, 'components'))) if (!(typeof c === 'string' && known.has(c))) errors.push({ file: DOCS_FILE, msg: `batch ${String(field(b, 'id'))} names ${String(c)}, which is neither in spec/components nor in spec/registry.json`, fix: 'Use a component folder name from spec/components (or a planned entry of spec/registry.json).' });
  }

  const design = config.adapters?.design;
  if (design?.tool && design.tool !== 'none' && !((design.docs?.width ?? 0) > 0)) errors.push({ file: 'harness.config.json', msg: 'adapters.design.docs.width is not set', fix: 'Set the doc root width in px (the only absolute in the doc shell).' });

  const tokens = new Set(semanticLocations(all).keys());
  for (const name of VIEW) {
    const file = `${DIR}/${name}.md`;
    if (!existsSync(join(root, file))) { errors.push({ file, msg: 'missing', fix: `Restore it; docs/design-docs/README.md has the file map.` }); continue; }
    const text = readFileSync(join(root, file), 'utf8');
    for (const m of text.matchAll(WORD)) {
      let path = m[1] ?? '';
      const next = text[m.index + path.length];
      if (path.endsWith('.')) { if (next === '<' || next === '*') continue; path = path.replace(/\.+$/, ''); }
      if (FILE_EXT.test(path) || tokens.has(path)) continue;
      if ([...tokens].some((t) => t.startsWith(path + '.'))) continue;
      errors.push({ file, token: path, msg: `names ${path}, which no semantic token defines`, fix: 'Use an existing semantic token (spec/tokens/interface.json), or follow a rename.' });
    }
  }
  return { errors };
}
