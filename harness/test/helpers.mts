// Shared test helpers: a temporary copy of the reference project (reference.mjs: built from harness-owned files only,
// never from the team's), JSON edits, failing check ids.
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { copyParts, reference } from './reference.mjs';
import { fileURLToPath } from 'node:url';
import { parseJson, readJsonSync } from '../lib/files.mjs';
import type { Report } from '../checks/types.mjs';
import type { HarnessConfigJson } from '../../generated/types/harness-config.js';

export const ROOT = fileURLToPath(new URL('../../', import.meta.url));
export { reference };

export const PARTS = ['spec', 'brand.config.json', 'harness.config.json', 'generated', 'src', 'playwright', 'docs', 'harness/kits', '.storybook'];
export const fixture = (parts: string[] = PARTS): Promise<string> => copyParts(parts, ROOT);

// Tests about this repository itself (not the harness) run only in the catalog's source repo, the Sketchbook repo.
export const SOURCE_REPO = readJsonSync<HarnessConfigJson>(join(ROOT, 'harness.config.json'))?.catalog?.source === true;
// A source checkout (src/, .claude/settings.json, its own node_modules), not the engine installed in a project's node_modules.
export const CHECKOUT = existsSync(join(ROOT, 'src')) && existsSync(join(ROOT, 'node_modules'));
export const checkoutOnly = { skip: CHECKOUT ? false : 'needs a source checkout (src/, .claude/settings.json, node_modules), not the installed engine' };
export const sourceRepoOnly = { skip: SOURCE_REPO ? false : 'about the Sketchbook source repo itself (harness.config.json catalog.source is not true here)' };

// T is the shape the test reads or edits: the JSON boundary, as readJson in lib/files.
export async function readJson<T = unknown>(dir: string, file: string): Promise<T> { return parseJson<T>(await readFile(join(dir, file), 'utf8')); }
export const writeJson = (dir: string, file: string, j: unknown): Promise<void> => writeFile(join(dir, file), JSON.stringify(j, null, 2) + '\n');
export async function edit<T = unknown>(dir: string, file: string, fn: (j: T) => unknown): Promise<void> { const j = await readJson<T>(dir, file); fn(j); await writeJson(dir, file, j); }
export const failing = (report: Report): string[] => report.results.filter((r) => r.errors.length).map((r) => r.id);
export const errorsOf = (report: Report): string => JSON.stringify(report.results.filter((x) => x.errors.length).map((x) => [x.id, x.errors.slice(0, 3)]));

// Narrows a value the test relies on; where the untyped test threw a TypeError on a missing value, this throws by name.
export function must<T>(value: T | null | undefined, what: string): T {
  if (value === null || value === undefined) throw new Error(`test setup: ${what} is missing`);
  return value;
}
