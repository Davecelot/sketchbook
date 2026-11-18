import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative, basename, dirname } from 'node:path';
import { buildTokens as build } from '../build/index.mjs';
import { barrel } from '../../scripts/build-barrel.mjs';
import { scssSources, compileStyles, mediaVars } from '../../scripts/build-styles.mjs';
import { buildFoundation, generate, serialize, snapshotText } from '../generators/foundation.mjs';
import { computeLinks, foundationMap } from '../generators/links.mjs';
import { cliDocs } from '../cli/docs.mjs';
import { knownCommands, KNOWN_FILE } from '../cli/known.mjs';
import { catalogDrift } from '../commands/catalog.mjs';
import { brandsDrift, listBrands } from '../commands/brand.mjs';
import { buildInterface, INTERFACE_FILE } from '../lib/interface.mjs';
import type { BrandConfig } from '../../generated/types/brand-config.js';
import type { BrandLinks, SemanticDocs } from '../generators/links.mjs';
import type { GeneratedFoundation, OverridesDoc } from '../generators/foundation.mjs';
import type { DtcgDoc } from '../lib/tokens.mjs';
import { errorMessage, parseJson } from '../lib/files.mjs';
import type { CheckContext, CheckIssue, CheckResult } from './types.mjs';

export const id = 'G1';
export const title = 'Generated files match a fresh rebuild';

const read = (p: string): string | null => { try { return readFileSync(p, 'utf8'); } catch { return null; } };
const readJson = <T,>(p: string): T | null => { try { return parseJson<T>(readFileSync(p, 'utf8')); } catch { return null; } };
const list = (dir: string): string[] => { try { return readdirSync(dir).sort(); } catch { return []; } };
const SNAPSHOT = 'generated/foundation.snapshot.json';

// Foundation = generator(brand.config) + overrides, and the linked semantic tokens follow it.
function foundationAndLinks(root: string, brand: BrandConfig, errors: CheckIssue[], warnings: CheckIssue[]): void {
  const overrides = readJson<OverridesDoc>(join(root, 'spec/tokens/overrides.json'))?.overrides ?? {};
  let built: GeneratedFoundation;
  try { built = buildFoundation(brand, overrides); } catch (e) { errors.push({ file: 'brand.config.json', msg: errorMessage(e), fix: 'Fix brand.config.json (see sketchbook presets).' }); return; }
  for (const [name, doc] of Object.entries(built.files)) {
    const file = `spec/tokens/foundation/${name}.tokens.json`;
    if (read(join(root, file)) !== serialize(doc)) errors.push({ file, msg: 'differs from generator(brand.config.json) + overrides (brand.config changed without regenerating, or a hand edit not recorded yet)', fix: 'Run npm run tokens:generate (it keeps and records hand edits), then npm run tokens:build.' });
  }
  // Only the generator's files live in the foundation folder: a file it does not make is never rebuilt or checked.
  for (const f of list(join(root, 'spec/tokens/foundation'))) {
    if (f.endsWith('.tokens.json') && !built.files[f.slice(0, -'.tokens.json'.length)]) errors.push({ file: `spec/tokens/foundation/${f}`, msg: 'not made by the generator (the foundation layer is generator(brand.config.json) + overrides)', fix: 'Move its tokens into brand.config.json (or add them to a generated file to record them as overrides), then delete the file.' });
  }
  // The snapshot is how the generator tells a hand edit from its own output: without it, edits can't be told apart.
  const snap = read(join(root, SNAPSHOT));
  if (snap === null) errors.push({ file: SNAPSHOT, msg: 'missing: the generator cannot tell hand edits from its own output without it', fix: 'Run npm run tokens:generate (it records every value that differs from the generator as an override), then review sketchbook tokens overrides list.' });
  else if (snap !== snapshotText(generate(brand).files)) errors.push({ file: SNAPSHOT, msg: 'differs from generate(brand.config.json) (brand.config changed without regenerating, or the snapshot was edited)', fix: 'Run npm run tokens:generate; never edit the snapshot by hand.' });
  const links = readJson<{ links?: BrandLinks }>(join(root, 'spec/tokens/brand-links.json'))?.links;
  if (!links) return;
  const semantic: SemanticDocs = {};
  for (const name of ['base', ...built.resolved.modes.map((m) => m.name)]) { const doc = readJson<DtcgDoc>(join(root, `spec/tokens/semantic/${name}.tokens.json`)); if (doc) semantic[name] = doc; }
  const r = computeLinks({ links, semantic, resolved: built.resolved, anchors: built.anchors, fmap: foundationMap(built.files) });
  for (const c of r.changed) errors.push({ file: `spec/tokens/semantic/${c.split(':')[0]}.tokens.json`, token: (c.split(': ')[1] ?? '').split(' -> ')[0], msg: `linked token is stale (${c})`, fix: 'Run npm run tokens:generate; to own the token by hand, delete its entry in spec/tokens/brand-links.json.' });
  warnings.push(...r.missing);
}

function styleOutputs(root: string): string[] {
  try {
    return readdirSync(join(root, 'src'), { recursive: true, withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith('.styles.ts'))
      .map((e) => relative(root, join(e.parentPath, e.name))).sort();
  } catch { return []; }
}

export async function run({ root, brand }: CheckContext): Promise<CheckResult> {
  const errors: CheckIssue[] = [];
  const warnings: CheckIssue[] = [];
  const stale = (file: string, cmd: string) => errors.push({ file, msg: 'differs from a fresh rebuild (edited by hand, or not regenerated)', fix: `Run ${cmd}; change the source, not the output.` });
  foundationAndLinks(root, brand, errors, warnings);
  const { css, componentJson, fontsCss } = await build({ root, write: false });
  if (read(join(root, 'generated/css/tokens.css')) !== css) stale('generated/css/tokens.css', 'npm run tokens:build');
  if (read(join(root, 'generated/css/fonts.css')) !== fontsCss) stale('generated/css/fonts.css', 'npm run tokens:build');
  if (read(join(root, 'generated/tokens/component.tokens.json')) !== componentJson) stale('generated/tokens/component.tokens.json', 'npm run tokens:build');
  // A missing output is stale too, whenever its source is in this project.
  const missing = (file: string, cmd: string) => errors.push({ file, msg: 'missing (generated output not built)', fix: `Run ${cmd}.` });
  const idx = read(join(root, 'src/index.ts'));
  if (idx === null) { if (existsSync(join(root, 'src/components'))) missing('src/index.ts', 'npm run build:barrel'); } else if (idx !== barrel(root)) stale('src/index.ts', 'npm run build:barrel');
  if (read(join(root, INTERFACE_FILE)) !== (await buildInterface(root, { write: false })).text) stale(INTERFACE_FILE, 'npm run build:interface (or npm run generate)');
  // docs/cli.md and known-commands.json follow the CLI registry, which lives in harness/cli when the harness is here.
  const cli = existsSync(join(root, 'harness/cli'));
  const docs = read(join(root, 'docs/cli.md'));
  if (docs === null) { if (cli) missing('docs/cli.md', 'npm run build:cli-docs'); } else if (docs !== cliDocs()) stale('docs/cli.md', 'npm run build:cli-docs');
  const known = read(join(root, KNOWN_FILE));
  if (known === null) { if (cli) missing(KNOWN_FILE, 'npm run build:cli-docs'); } else if (known !== knownCommands()) stale(KNOWN_FILE, 'npm run build:cli-docs');
  const sources = scssSources(root);
  const vars = await mediaVars(root);
  for (const file of sources) {
    const { out, contents } = compileStyles(file, vars);
    const now = read(out);
    if (now === null) missing(relative(root, out), 'npm run build:styles');
    else if (now !== contents) stale(relative(root, out), 'npm run build:styles');
  }
  // A *.styles.ts whose .scss is gone is never rebuilt: it ships styles nobody can edit.
  const scss = new Set(sources.map((f) => relative(root, f)));
  for (const f of styleOutputs(root)) {
    const src = join(dirname(f), `${basename(f, '.styles.ts')}.scss`);
    if (!scss.has(src)) errors.push({ file: f, msg: `generated styles without a source (${src} is missing)`, fix: `Restore ${src}, or delete ${f} (and its import).` });
  }
  // Brand css files with no brand behind them (a removed brand, or brands/ deleted) are stale outputs too.
  const brands = new Set(listBrands(root).map((b) => b.name));
  for (const f of list(join(root, 'generated/css'))) {
    const name = /^tokens\.(.+)\.css$/.exec(f)?.[1];
    if (name !== undefined && !brands.has(name)) errors.push({ file: `generated/css/${f}`, msg: `no brand "${name}" in brands/ (brands/${name}.brand.json)`, fix: 'Delete the file, or add the brand back (sketchbook brand add), then npm run generate.' });
    if (f === 'brands.css' && !brands.size) errors.push({ file: 'generated/css/brands.css', msg: 'no brands/ to build it from', fix: 'Delete the file (single brand), or add brands with sketchbook brand add.' });
  }
  // The component catalog follows the repo it is built from (SB-0045); brand token files follow brands/ (SB-0047).
  const catalog = catalogDrift(root);
  errors.push(...catalog.errors);
  errors.push(...(await brandsDrift(root)));
  return { errors, warnings, info: catalog.info ?? [] };
}
