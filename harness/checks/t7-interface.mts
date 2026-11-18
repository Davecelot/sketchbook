import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { INTERFACE_FILE, semanticLocations, scanRefs, varIndex, computeInterface } from '../lib/interface.mjs';
import { docTokenPaths, loadDesignDocs, patternTokenPaths } from '../lib/design-docs.mjs';
import { buildFoundation } from '../generators/foundation.mjs';
import { modeNames } from '../standards/resolve.mjs';
import { computeLinks, foundationMap, type BrandLinks, type SemanticDocs } from '../generators/links.mjs';
import type { InterfaceDoc } from '../lib/interface.mjs';
import type { OverridesDoc } from '../generators/foundation.mjs';
import type { DtcgDoc } from '../lib/tokens.mjs';
import { errorCode, errorMessage, parseJson } from '../lib/files.mjs';
import type { CheckContext, CheckIssue, CheckResult } from './types.mjs';

export const id = 'T7';
export const title = 'Interface tokens, brand links and CSS variables used outside components all resolve';

const readJson = <T,>(root: string, p: string): T | null => { try { return parseJson<T>(readFileSync(join(root, p), 'utf8')); } catch { return null; } };

interface RenameLog { renames?: unknown }
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const RENAME = 'Restore the token, or rename it everywhere with sketchbook tokens rename <old> <new>.';

export function run({ root, all, brand, config, contrastPairs }: CheckContext): CheckResult {
  const errors: CheckIssue[] = [];
  const prefix = config.prefix;
  const loc = semanticLocations(all);
  const fileOf = (where: string): string => `spec/tokens/semantic/${where}.tokens.json`;

  // 1. The recorded interface: every token still exists in every file it was recorded in.
  const recorded = readJson<Partial<InterfaceDoc>>(root, INTERFACE_FILE);
  if (!recorded?.tokens) errors.push({ file: INTERFACE_FILE, msg: 'missing or not valid JSON', fix: 'Run npm run generate.' });
  const modes = modeNames(brand);
  for (const [path, entry] of Object.entries(recorded?.tokens ?? {})) {
    const now = loc.get(path) ?? [];
    const need = entry.in === 'base' ? ['base'] : entry.in === 'modes' ? modes : [];
    for (const where of need) {
      if (!now.includes(where)) errors.push({ file: fileOf(where), token: path, mode: where, msg: `interface token ${path} is missing in ${where} (used by ${entry.usedBy.join(', ')})`, fix: RENAME });
    }
  }

  // 2. The interface as it is now: every token something relies on exists somewhere.
  const links = readJson<{ links?: BrandLinks }>(root, 'spec/tokens/brand-links.json')?.links ?? {};
  const refs = scanRefs(root, prefix);
  const fresh = computeInterface({ all, links, contrastPairs, refs, prefix, designDocs: [...docTokenPaths(loadDesignDocs(root)), ...patternTokenPaths(root)] });
  for (const [path, entry] of Object.entries(fresh.tokens)) {
    if (entry.in === 'missing' && recorded?.tokens?.[path]?.in !== 'base' && recorded?.tokens?.[path]?.in !== 'modes') errors.push({ file: 'spec/tokens/semantic', token: path, msg: `${path} is used (${entry.usedBy.join(', ')}) but no semantic file defines it`, fix: `Add it with sketchbook tokens add ${path} …, or point the users at an existing token.` });
  }

  // 3. Brand links: every source (semantic token) and target (foundation token) exists; nothing is skipped silently.
  let built = null;
  try { built = buildFoundation(brand, readJson<OverridesDoc>(root, 'spec/tokens/overrides.json')?.overrides ?? {}); } catch { /* T1/G1 report a broken brand.config */ }
  if (built) {
    const semantic: SemanticDocs = {};
    for (const name of ['base', ...built.resolved.modes.map((m) => m.name)]) { const doc = readJson<DtcgDoc>(root, fileOf(name)); if (doc) semantic[name] = doc; }
    const r = computeLinks({ links, semantic, resolved: built.resolved, anchors: built.anchors, fmap: foundationMap(built.files) });
    for (const m of r.missing) errors.push({ file: m.file, token: m.token, msg: m.msg, fix: m.fix });
  }
  for (const [path, link] of Object.entries(links)) {
    for (const a of link.alsoOn ?? []) if (!loc.has(a)) errors.push({ file: 'spec/tokens/brand-links.json', token: path, msg: `alsoOn names ${a}, which no semantic file defines`, fix: 'Fix the path, or rename with sketchbook tokens rename.' });
  }

  // 4. CSS variables in stories, specs, .storybook and patterns name real tokens (the silent break on rename).
  const index = varIndex(all, prefix);
  for (const r of refs) {
    if (index.has(r.name)) continue;
    errors.push({ file: r.file, line: r.line, token: r.name, msg: `uses ${r.name}, which no token defines`, fix: 'Use an existing token variable (sketchbook tokens impact <path>), or rename tokens only with sketchbook tokens rename so references follow.' });
  }
  // 5. The rename log (sketchbook tokens rename appends; catalog installs read it): a source, so only its shape is checked.
  const RENAMES = 'spec/tokens/renames.json';
  let log: RenameLog | null | undefined;
  try { log = parseJson<RenameLog | null>(readFileSync(join(root, RENAMES), 'utf8')); } catch (e) { if (errorCode(e) !== 'ENOENT') errors.push({ file: RENAMES, msg: `not valid JSON: ${errorMessage(e)}`, fix: 'Fix the JSON syntax.' }); }
  if (log !== undefined) {
    const PATH = /^[a-z][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)+$/;
    if (!Array.isArray(log?.renames)) errors.push({ file: RENAMES, msg: 'has no "renames" array', fix: 'Shape: { "renames": [ { "from", "to", "date" } ] } (written by sketchbook tokens rename).' });
    else log.renames.forEach((r: unknown, i) => {
      const field = (k: string): string => { const v = isRecord(r) ? r[k] : undefined; return typeof v === 'string' ? v : ''; };
      if (!PATH.test(field('from')) || !PATH.test(field('to')) || !/^\d{4}-\d{2}-\d{2}$/.test(field('date'))) errors.push({ file: RENAMES, token: `renames[${i}]`, msg: `entry ${JSON.stringify(r)} needs "from" and "to" token paths and a YYYY-MM-DD "date"`, fix: 'Fix the entry; only sketchbook tokens rename should append to this file.' });
    });
  }
  return { errors };
}
