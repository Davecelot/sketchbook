// Multi-brand (SB-0047): brands/<name>.brand.json, same schema as brand.config.json. One semantic interface
// (spec/tokens/semantic + brand-links.json) and the components' tokens are shared; each brand gets its own foundation
// and linked semantic values.
//   brand build -> generated/css/tokens.<brand>.css (standalone, a drop-in for tokens.css)
//                  generated/css/brands.css         (every brand, scoped under [data-brand="<name>"])
// No brands/ folder: nothing is written and tokens.css is untouched (single brand stays the default).
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, symlinkSync, rmSync, mkdtempSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import postcss from 'postcss';
import type { BrandConfig } from '../../generated/types/brand-config.js';
import { buildFoundation, serialize, runGenerator } from '../generators/foundation.mjs';
import type { OverridesDoc } from '../generators/foundation.mjs';
import { computeLinks, foundationMap } from '../generators/links.mjs';
import type { BrandLinks, LinkResult, MissingLink, SemanticDocs } from '../generators/links.mjs';
import { resolveBrand } from '../standards/resolve.mjs';
import type { ResolvedBrand } from '../standards/resolve.mjs';
import { buildTokens } from '../build/index.mjs';
import { flatten } from '../lib/tokens.mjs';
import type { DtcgDoc, FlatToken, Layer } from '../lib/tokens.mjs';
import { validate } from '../lib/schema.mjs';
import { readJsonSync, writeFileAtomic, errorMessage, HARNESS, engineSchema, isMain } from '../lib/files.mjs';
import type { FixError } from './catalog.mjs';

export const BRANDS = 'brands';
export const NAME_RE = /^[a-z][a-z0-9-]*$/;
const fail = (msg: string, fix: string): FixError => Object.assign(new Error(msg), { fix });
const fixOf = (e: unknown): string | undefined => (typeof e === 'object' && e !== null && 'fix' in e && typeof e.fix === 'string' ? e.fix : undefined);

export interface BrandEntry { name: string; file: string; brand: BrandConfig | null; active: boolean }
export interface BrandDocs { foundation: Record<string, DtcgDoc>; semantic: SemanticDocs; resolved: ResolvedBrand; missing: MissingLink[] }
export interface BrandTokenSet { file: string; layer: Layer; mode: string | null; tokens: FlatToken[] }
export interface BrandDrift { file: string; msg: string; fix: string }
export interface UseBrandPlan { name: string; brand: BrandConfig; unsaved: boolean; overrides: { path: string; value: unknown }[]; risks: string[] }
export interface UseBrandResult extends UseBrandPlan { resolved: ResolvedBrand; links: LinkResult }

export function listBrands(root: string): BrandEntry[] {
  let files: string[];
  try { files = readdirSync(join(root, BRANDS)).filter((f) => f.endsWith('.brand.json')).sort(); } catch { return []; }
  const active = readJsonSync<Partial<BrandConfig>>(join(root, 'brand.config.json'), {});
  return files.map((f) => {
    const name = f.slice(0, -'.brand.json'.length);
    const brand = readJsonSync<BrandConfig>(join(root, BRANDS, f));
    const same = brand && JSON.stringify({ ...brand, $schema: null }) === JSON.stringify({ ...active, $schema: null });
    return { name, file: `${BRANDS}/${f}`, brand, active: Boolean(same) };
  });
}

// A brand's foundation files and linked semantic documents, in memory.
export function brandDocs(root: string, brand: BrandConfig): BrandDocs {
  const built = buildFoundation(brand, {});
  const resolved = built.resolved;
  const semantic: SemanticDocs = {};
  for (const { name, role } of [{ name: 'base', role: 'base' }, ...resolved.modes]) {
    const own = join(root, `spec/tokens/semantic/${name}.tokens.json`);
    const template = join(HARNESS, `templates/semantic/${existsSync(join(HARNESS, `templates/semantic/${name}.tokens.json`)) ? name : role}.tokens.json`);
    const doc = readJsonSync<DtcgDoc>(existsSync(own) ? own : template);
    if (doc) semantic[name] = doc;
  }
  const links = readJsonSync<{ links?: BrandLinks }>(join(root, 'spec/tokens/brand-links.json'))?.links;
  const linked: LinkResult = links ? computeLinks({ links, semantic, resolved, anchors: built.anchors, fmap: foundationMap(built.files) }) : { changed: [], missing: [] };
  return { foundation: built.files, semantic, resolved, missing: linked.missing };
}

// The token sets T6 needs for a brand (same shape as lib/tokens loadAll), reusing the repo's component tokens.
export function brandTokenSets(root: string, brand: BrandConfig, componentSet?: BrandTokenSet): { sets: BrandTokenSet[]; modes: string[] } {
  const { foundation, semantic, resolved } = brandDocs(root, brand);
  const sets: BrandTokenSet[] = [
    ...Object.entries(foundation).map(([n, doc]): BrandTokenSet => ({ file: `foundation/${n}`, layer: 'foundation', mode: null, tokens: flatten(doc) })),
    ...Object.entries(semantic).map(([n, doc]): BrandTokenSet => ({ file: `semantic/${n}`, layer: 'semantic', mode: n === 'base' ? null : n, tokens: flatten(doc) })),
    ...(componentSet ? [componentSet] : []),
  ];
  return { sets, modes: resolved.modes.map((m) => m.name).sort() };
}

function brandSchemaErrors(root: string, brand: BrandConfig): string[] {
  const schema = engineSchema('brand-config', root);
  return schema ? validate(schema, brand) : [];
}

// Builds one brand's tokens.css in a scratch root that mirrors the project (config, contracts) with the brand's tokens.
async function brandCss(root: string, brand: BrandConfig): Promise<string> {
  const tmp = mkdtempSync(join(tmpdir(), 'sketchbook-brand-'));
  try {
    const { foundation, semantic } = brandDocs(root, brand);
    mkdirSync(join(tmp, 'spec/tokens/foundation'), { recursive: true });
    mkdirSync(join(tmp, 'spec/tokens/semantic'), { recursive: true });
    copyFileSync(join(root, 'harness.config.json'), join(tmp, 'harness.config.json'));
    writeFileSync(join(tmp, 'brand.config.json'), serialize(brand));
    for (const [n, doc] of Object.entries(foundation)) writeFileSync(join(tmp, `spec/tokens/foundation/${n}.tokens.json`), serialize(doc));
    for (const [n, doc] of Object.entries(semantic)) writeFileSync(join(tmp, `spec/tokens/semantic/${n}.tokens.json`), serialize(doc));
    if (existsSync(join(root, 'spec/components'))) symlinkSync(join(root, 'spec/components'), join(tmp, 'spec/components'), 'dir');
    return (await buildTokens({ root: tmp, write: false })).css;
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

export function scopeCss(css: string, name: string): string {
  const ast = postcss.parse(css);
  const attr = `[data-brand="${name}"]`;
  ast.walkRules((rule) => { rule.selectors = rule.selectors.map((s) => (s.startsWith(':root') ? `:root${attr}${s.slice(5)}` : `${attr}${s}`)); });
  ast.walkComments((c) => { c.remove(); });
  return ast.toString().trim();
}

// Every brand's files, in memory: { 'generated/css/tokens.<name>.css': css, 'generated/css/brands.css': css }.
export async function brandOutputs(root: string): Promise<Record<string, string>> {
  const brands = listBrands(root);
  if (!brands.length) return {};
  const out: Record<string, string> = {};
  const scoped: string[] = [];
  for (const { name, file, brand } of brands) {
    if (!brand) throw fail(`${file} is not valid JSON`, 'Fix the JSON syntax.');
    const errs = brandSchemaErrors(root, brand);
    if (errs.length) throw fail(`${file}: ${errs[0]}`, 'Match spec/schemas/brand-config.schema.json (same as brand.config.json).');
    const css = await brandCss(root, brand);
    out[`generated/css/tokens.${name}.css`] = `/* Brand "${name}" from ${file}: built by sketchbook brand build. Do not edit. */\n${css}`;
    scoped.push(`/* ${name} */\n${scopeCss(css, name)}`);
  }
  out['generated/css/brands.css'] = `/* GENERATED by sketchbook brand build from each brands/<name>.brand.json: every brand scoped under [data-brand="<name>"]. Do not edit. */\n${scoped.join('\n\n')}\n`;
  return out;
}

export async function buildBrands(root: string, { write = true }: { write?: boolean } = {}): Promise<{ files: string[]; brands: string[] }> {
  const out = await brandOutputs(root);
  if (write) for (const [f, css] of Object.entries(out)) { mkdirSync(join(root, 'generated/css'), { recursive: true }); writeFileSync(join(root, f), css); }
  return { files: Object.keys(out), brands: listBrands(root).map((b) => b.name) };
}

// Check G1 (brand part): generated brand files equal a fresh brand build.
export async function brandsDrift(root: string): Promise<BrandDrift[]> {
  if (!listBrands(root).length) return [];
  let out: Record<string, string>;
  try { out = await brandOutputs(root); } catch (e) { return [{ file: BRANDS, msg: errorMessage(e), fix: fixOf(e) ?? 'Fix the brand file.' }]; }
  const errors: BrandDrift[] = [];
  for (const [f, css] of Object.entries(out)) {
    let now: string | null = null;
    try { now = readFileSync(join(root, f), 'utf8'); } catch { /* missing */ }
    if (now !== css) errors.push({ file: f, msg: now === null ? 'missing' : 'differs from a fresh brand build', fix: 'Run sketchbook brand build (or npm run generate).' });
  }
  return errors;
}

export function addBrand(root: string, name: string, { from = 'current', dryRun = false }: { from?: string; dryRun?: boolean } = {}): { name: string; file: string; brand: BrandConfig } {
  if (!NAME_RE.test(name)) throw fail(`Brand name "${name}" must match ${NAME_RE}.`, 'Use lowercase letters, digits and dashes, e.g. ocean.');
  const file = `${BRANDS}/${name}.brand.json`;
  if (existsSync(join(root, file))) throw fail(`${file} already exists.`, `Edit it, or sketchbook brand use ${name}.`);
  const source = from === 'current' ? join(root, 'brand.config.json') : join(root, BRANDS, `${from}.brand.json`);
  const base = readJsonSync<BrandConfig>(source);
  if (!base) throw fail(`Cannot read ${from === 'current' ? 'brand.config.json' : `${BRANDS}/${from}.brand.json`}.`, 'Use --from current or an existing brand name (sketchbook brand list).');
  const brand = { ...base, $schema: '../spec/schemas/brand-config.schema.json', name };
  if (!dryRun) { mkdirSync(join(root, BRANDS), { recursive: true }); writeFileSync(join(root, file), serialize(brand)); }
  return { name, file, brand };
}

// brand use <name> (SB-0062): validated before anything is written (dry run too). It refuses without --yes when
// brand.config.json holds edits saved in no brands/*.brand.json (they would be lost), and when foundation overrides
// exist: overrides belong to the active brand.config only (brand build ignores them), so --yes clears them.
export async function useBrand(root: string, name: string, { dryRun = false, yes = false }: { dryRun?: boolean; yes?: boolean } = {}): Promise<UseBrandPlan | UseBrandResult> {
  const brands = listBrands(root);
  const b = brands.find((x) => x.name === name);
  if (!b) throw fail(`No brand "${name}" in ${BRANDS}/.`, 'sketchbook brand list, or sketchbook brand add <name>.');
  if (!b.brand) throw fail(`${b.file} is not valid JSON.`, 'Fix the JSON syntax.');
  const brand = { ...b.brand, $schema: './spec/schemas/brand-config.schema.json' };
  const { validateBrand } = await import('./tokens.mjs');
  try { await validateBrand(root, brand); } catch (e) { throw fail(`${b.file}: ${errorMessage(e)}`, fixOf(e) ?? 'Fix the brand file.'); }
  // Saved = equal to some brand file apart from its name and $schema (brand add --from current renames the copy).
  const values = (j: Partial<BrandConfig>): string => JSON.stringify({ ...j, $schema: null, name: null });
  const current = readJsonSync<BrandConfig>(join(root, 'brand.config.json'));
  const invalid = !current && existsSync(join(root, 'brand.config.json'));
  const unsaved = invalid || (!!current && !brands.some((x) => x.brand && values(x.brand) === values(current)));
  const recorded = readJsonSync<OverridesDoc>(join(root, 'spec/tokens/overrides.json'))?.overrides ?? {};
  const overrides = Object.entries(recorded).map(([path, o]) => ({ path, value: o.value }));
  // Clearing drops hand-added foundation tokens: refuse while a semantic token still aliases one.
  const added = new Set(Object.entries(recorded).filter(([, o]) => o.added).map(([p]) => p));
  const aliased = added.size ? readdirSync(join(root, 'spec/tokens/semantic')).filter((f) => f.endsWith('.tokens.json')).flatMap((f) => flatten(readJsonSync<DtcgDoc>(join(root, 'spec/tokens/semantic', f), {})).map((t) => /^\{([^{}]+)\}$/.exec(String(t.value))?.[1]).filter((a): a is string => a !== undefined && added.has(a))) : [];
  if (aliased.length) throw fail(`brand use ${name} would clear hand-added foundation token(s) the semantic layer still uses: ${[...new Set(aliased)].join(', ')}.`, 'Add them to the brand (or re-point those semantic tokens) first.');
  const risks = [
    ...(invalid ? ['brand.config.json is not valid JSON; it would be replaced (fix it, or rerun with --yes to replace it)'] : []),
    ...(unsaved && !invalid ? ['brand.config.json has edits saved in no brands/*.brand.json; they would be overwritten (save them first: sketchbook brand add <name> --from current)'] : []),
    ...(overrides.length ? [`${overrides.length} foundation override(s) belong to the current brand and would be cleared: ${overrides.map((o) => `${o.path} = ${JSON.stringify(o.value)}`).join(', ')}`] : []),
  ];
  if (risks.length && !yes && !dryRun) throw Object.assign(fail(`brand use ${name} would lose work: ${risks.join('; ')}.`, 'Commit first (git is the undo), check with --dry-run, then rerun with --yes.'), { data: { unsaved, overrides } });
  if (dryRun) return { name, brand, unsaved, overrides, risks };
  writeFileAtomic(join(root, 'brand.config.json'), serialize(brand));
  if (overrides.length) {
    // Cleared, not carried: the foundation files are rebuilt from the new brand alone, so the generator does not
    // re-record the old hand edits it would otherwise find in them.
    writeFileSync(join(root, 'spec/tokens/overrides.json'), JSON.stringify({ ...readJsonSync<OverridesDoc>(join(root, 'spec/tokens/overrides.json')), overrides: {} }, null, 2) + '\n');
    for (const file of Object.keys(buildFoundation(brand, {}).files)) rmSync(join(root, 'spec/tokens/foundation', `${file}.tokens.json`), { force: true });
  }
  const gen = await runGenerator(root, { quiet: true });
  await buildTokens({ root });
  await buildBrands(root);
  return { name, brand, resolved: resolveBrand(brand), links: gen.links, unsaved, overrides, risks };
}

if (isMain(import.meta.url)) {
  const { files } = await buildBrands(process.cwd());
  console.log(files.length ? `[brands:build] ${files.join(', ')}` : '[brands:build] no brands/ folder: single brand, nothing to build');
}
