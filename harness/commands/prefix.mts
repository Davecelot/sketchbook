// sketchbook prefix <new>: rebrand the element/CSS prefix (ds-button -> acme-button, --ds-* -> --acme-*, DsButton -> AcmeButton).
// Deterministic codemod over hand-written sources, then harness.config.json, then the generate pipeline
// (tokens.css, *.styles.ts, src/index.ts). Decision history, generated/ and build output are not touched.
import { buildInterface } from '../lib/interface.mjs';
import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import type { Stats } from 'node:fs';
import { join, extname, relative } from 'node:path';
import type { HarnessConfigJson } from '../../generated/types/harness-config.js';
import { parseJson } from '../lib/files.mjs';
import { buildTokens } from '../build/index.mjs';
import { scssSources, compileStyles, mediaVars } from '../../scripts/build-styles.mjs';
import { barrel } from '../../scripts/build-barrel.mjs';
import { buildBrands } from './brand.mjs';
import { buildCatalog } from './catalog.mjs';
import { planFrontmatter, PROCESS_RECORD } from '../lib/plan-approval.mjs';

export interface PrefixResult { from: string; to: string; files: string[]; replacements: number; dryRun?: true }

export const PREFIX_RE = /^[a-z][a-z0-9]*$/;

// Paths (relative to root) the codemod rewrites. spec/decisions is history; generated/ is rebuilt.
export const PREFIX_SCOPE = [
  'src', 'spec/components', 'spec/registry.json', 'spec/schemas', 'playwright', '.storybook', 'docs',
  'README.md', 'CLAUDE.md', '.claude/commands', '.claude/rules', '.claude/skills',
];
const SKIP_DIRS = new Set(['node_modules', 'dist', 'storybook-static', 'generated', '.git', 'test-results', 'playwright-report']);
// Generated files inside the scope: rebuilt from the harness (G1 guards them), never rewritten. docs/cli.md names
// "acme" as the example prefix.
const SKIP_FILES = new Set(['docs/cli.md']);
const isPlan = (file: string): boolean => PROCESS_RECORD.test(file) && file.endsWith('/plan.md');
// Never rewrite historical inputs to approval or evidence. Plan prose moves with the component; metadata does not.
function rewriteFile(file: string, text: string, from: string, to: string): { text: string; count: number } {
  const header = isPlan(file) ? planFrontmatter(text) : '';
  const result = rewrite(text.slice(header.length), from, to);
  return { ...result, text: header + result.text };
}
// Words a prefix may not be: renaming back from them would rewrite aria-*, data-*, on*, xml*, xlink:* and x-* names.
export const RESERVED_PREFIXES = ['aria', 'data', 'x', 'on', 'xml', 'xlink'];
const TEXT = new Set(['.ts', '.js', '.mjs', '.cjs', '.scss', '.css', '.json', '.md', '.mdx', '.html', '.yml', '.yaml', '.txt']);
// Fixed harness names that start with "<prefix>-" and must survive a rename. None today: the package
// (sketchbook) and the T5 annotation (sketchbook-allow-literal) don't use the element prefix.
const KEEP: string[] = [];

const pascal = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Pure text transform; exported for tests. Returns { text, count }.
export function rewrite(text: string, from: string, to: string): { text: string; count: number } {
  let count = 0;
  const F = esc(from);
  const sub = (re: RegExp, fn: (match: string, group: string) => string): void => { text = text.replace(re, (match: string, group: string) => { const r = fn(match, group); if (r !== match) count++; return r; }); };
  // CSS custom properties (--ds-color-x -> --acme-color-x) and Storybook ids of Ds* exports (group--ds-x -> group--acme-x).
  sub(new RegExp(`(?<!-)--${F}-`, 'g'), () => `--${to}-`);
  // Element names and their prose/selector forms: 'ds-tabs', <ds-tabs, </ds-tabs, ds-tabs {, ds-*, ds-<name>.
  // The lookbehind keeps words such as "builds-" or "needs-" intact.
  sub(new RegExp(`(?<![\\w$-])${F}-([\\w-]*)`, 'g'), (m, rest) => (KEEP.some((k) => `${from}-${rest}`.startsWith(k)) ? m : `${to}-${rest}`));
  // Identifiers: DsButton -> AcmeButton, dsFoo -> acmeFoo (only before an uppercase letter, so "SB-0009" and "ds" stay).
  sub(new RegExp(`(?<![\\w$])${esc(pascal(from))}(?=[A-Z])`, 'g'), () => pascal(to));
  sub(new RegExp(`(?<![\\w$])${F}(?=[A-Z])`, 'g'), () => to);
  return { text, count };
}

async function* walk(root: string, rel: string): AsyncGenerator<string> {
  const abs = join(root, rel);
  let s: Stats;
  try { s = await stat(abs); } catch { return; }
  if (s.isFile()) { if (TEXT.has(extname(rel))) yield rel; return; }
  for (const e of await readdir(abs, { withFileTypes: true })) {
    if (e.isDirectory() && SKIP_DIRS.has(e.name)) continue;
    if (SKIP_FILES.has(join(rel, e.name))) continue;
    const file = join(rel, e.name);
    if (PROCESS_RECORD.test(file) && !isPlan(file)) continue;
    yield* walk(root, file);
  }
}

// Rebuilds what depends on the prefix or the installed components: tokens.css (+ component tokens), brand token
// files (when brands/ exists), every *.styles.ts, src/index.ts and spec/tokens/interface.json.
export async function regenerate(root: string): Promise<void> {
  await buildTokens({ root });
  const vars = await mediaVars(root);
  for (const file of scssSources(root)) { const { out, contents } = compileStyles(file, vars); await writeFile(out, contents); }
  await writeFile(join(root, 'src/index.ts'), barrel(root));
  await buildBrands(root);
  // What the components and stories rely on changes when components come or go (check T7, G1).
  await buildInterface(root);
}

// A prefix is reversible only if it names nothing yet: when `<to>-`, `--<to>-` or `<To>Name` already occurs in the
// scope, renaming back later would rewrite those words too (aria-label -> ds-label). Refused, like the reserved words.
async function refuseTakenPrefix(root: string, from: string, to: string): Promise<void> {
  const fix = 'Pick a prefix that is not already a word in your sources (sketchbook prefix <new> --dry-run to try).';
  if (RESERVED_PREFIXES.includes(to)) throw Object.assign(new Error(`"${to}" is reserved (${RESERVED_PREFIXES.join(', ')}): HTML and SVG already use ${to}-* names, and renaming back would rewrite them.`), { fix });
  const hits = [];
  for (const rel of PREFIX_SCOPE) {
    for await (const file of walk(root, rel)) if (rewriteFile(file, await readFile(join(root, file), 'utf8'), to, from).count) hits.push(file);
  }
  if (hits.length) throw Object.assign(new Error(`"${to}" already occurs as a prefix (${to}-…, --${to}-… or ${pascal(to)}Name) in ${hits.length} file(s), e.g. ${hits.slice(0, 3).join(', ')}; renaming back later would rewrite those too.`), { fix });
}

export async function renamePrefix(root: string, from: string | undefined, to: string, { quiet = false, dryRun = false }: { quiet?: boolean; dryRun?: boolean } = {}): Promise<PrefixResult> {
  const configPath = join(root, 'harness.config.json');
  const config = parseJson<HarnessConfigJson>(await readFile(configPath, 'utf8'));
  from ??= config.prefix;
  for (const [k, v] of Object.entries({ from, to })) if (!PREFIX_RE.test(v ?? '')) throw new Error(`${k} prefix "${v}" must match ${PREFIX_RE} (lowercase letter, then letters or digits).`);
  if (from !== config.prefix) throw new Error(`harness.config.json has prefix "${config.prefix}", not "${from}".`);
  if (from !== to) await refuseTakenPrefix(root, from, to);
  const files: string[] = [];
  let replacements = 0;
  if (from !== to) {
    for (const rel of PREFIX_SCOPE) {
      for await (const file of walk(root, rel)) {
        const p = join(root, file);
        const before = await readFile(p, 'utf8');
        const { text, count } = rewriteFile(file, before, from, to);
        if (text !== before) { if (!dryRun) await writeFile(p, text); files.push(relative(root, p)); replacements += count; }
      }
    }
    if (dryRun) return { from, to, files, replacements, dryRun: true };
    config.prefix = to;
    await writeFile(configPath, JSON.stringify(config, null, 2) + '\n');
  }
  if (dryRun) return { from, to, files, replacements, dryRun: true };
  await regenerate(root);
  // In the catalog's source repo the catalog carries the prefix too (G1 treats a mismatch as an error, SB-0061).
  if (config.catalog?.source === true) buildCatalog(root);
  if (!quiet) console.log(`prefix ${from} -> ${to}: ${replacements} replacement(s) in ${files.length} file(s); config updated; tokens, styles and barrel rebuilt.`);
  return { from, to, files, replacements };
}
