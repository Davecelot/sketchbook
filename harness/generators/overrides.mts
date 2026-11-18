// Overrides lifecycle: hand edits to the generated foundation live in spec/tokens/overrides.json (the generator keeps
// them). List them, reset one (back to the generated value; a hand-added token is removed), or reset all.
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { BrandConfig } from '../../generated/types/brand-config.js';
import { parseJson } from '../lib/files.mjs';
import { buildFoundation, paths, runGenerator, serialize, type Overrides, type OverridesDoc } from './foundation.mjs';

const readJson = async <T,>(p: string, fallback: T): Promise<T> => { try { return parseJson<T>(await readFile(p, 'utf8')); } catch { return fallback; } };

export interface OverrideListing { token: string; file: string; value: unknown; generated: unknown; added: boolean }

export async function listOverrides(root: string): Promise<OverrideListing[]> {
  const o = (await readJson<OverridesDoc>(paths(root).OVERRIDES, {})).overrides ?? {};
  return Object.entries(o).map(([token, e]) => ({ token, file: e.file, value: e.value, generated: e.generated ?? null, added: Boolean(e.added) }));
}

async function reset(root: string, pick: (overrides: Overrides) => string[]): Promise<string[]> {
  const { OVERRIDES, FOUNDATION } = paths(root);
  const doc = await readJson<OverridesDoc>(OVERRIDES, { overrides: {} });
  const overrides = (doc.overrides ??= {});
  const removed = pick(overrides);
  for (const p of removed) delete overrides[p];
  await writeFile(OVERRIDES, JSON.stringify(doc, null, 2) + '\n');
  // Rewrite the foundation from the remaining overrides first, so the generator sees no new hand edits.
  const brand = await readJson<Partial<BrandConfig>>(join(root, 'brand.config.json'), {});
  const { files } = buildFoundation(brand, overrides);
  for (const [name, d] of Object.entries(files)) await writeFile(join(FOUNDATION, `${name}.tokens.json`), serialize(d));
  await runGenerator(root, { quiet: true });
  return removed;
}

export function resetOverride(root: string, path: string): Promise<string[]> {
  return reset(root, (o) => {
    if (!o[path]) throw new Error(`No override for ${path}. Overrides: ${Object.keys(o).join(', ') || 'none'}.`);
    return [path];
  });
}

export const resetAll = (root: string): Promise<string[]> => reset(root, (o) => Object.keys(o));
