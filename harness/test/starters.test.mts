// Starting points (cases S1–S21 in TEST.md): component catalog, starters, kits, brands, upgrades, doctor, CSS audit.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, rm, mkdir, readdir, appendFile, access, symlink } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { fixture, edit, readJson, failing, errorsOf, reference, must, sourceRepoOnly, checkoutOnly, ROOT } from './helpers.mjs';
import { runChecks } from '../checks/run.mjs';
import { hashOf, parseJson } from '../lib/files.mjs';
import { snapshotComponent, buildCatalog, catalogIndex } from '../commands/catalog.mjs';
import { auditCss } from '../commands/audit-css.mjs';
import { mergePatch } from '../commands/start.mjs';
import type { Envelope } from '../cli/types.mjs';
import type { CatalogIndex, ComponentManifest, Kit } from '../commands/catalog.mjs';
import type { DtcgTokenNode } from '../commands/tokens.mjs';
import type { ComponentRegistry } from '../../generated/types/registry.js';

const CLI = join(ROOT, 'harness/cli.mjs');
// The --json envelope; D is the shape of its data a test reads (the JSON boundary).
type CliJson<D> = Envelope & { data: D };
const cli = <D = unknown,>(dir: string, ...args: string[]) => {
  const r = spawnSync('node', [CLI, ...args], { cwd: dir, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  let json: CliJson<D> | null = null;
  try { json = parseJson<CliJson<D>>(r.stdout); } catch { /* human output */ }
  return { code: r.status, out: r.stdout, err: r.stderr, json };
};
// A run whose envelope the test reads: output that is not JSON fails here, by name, where reading it threw before.
const cliJson = <D = unknown,>(dir: string, ...args: string[]) => { const r = cli<D>(dir, ...args); return { ...r, json: must(r.json, `JSON from sketchbook ${args.join(' ')}: ${r.out}${r.err}`) }; };
const exists = async (p: string) => { try { await access(p); return true; } catch { return false; } };
const components = async (dir: string) => { try { return (await readdir(join(dir, 'spec/components'))).sort(); } catch { return []; } };
const patterns = async (dir: string) => { try { return (await readdir(join(dir, 'src/patterns'))).sort(); } catch { return []; } };
const vars = (css: string) => [...new Set([...css.matchAll(/^\s*(--[\w-]+):/gm)].map((m) => m[1]))].sort();
const block = (css: string, selector: string) => css.slice(css.indexOf(`${selector} {`), css.indexOf('}', css.indexOf(`${selector} {`)));
const CATALOG = parseJson<CatalogIndex>(readFileSync(join(ROOT, 'harness/catalog/index.json'), 'utf8'));
const KITS = parseJson<{ kits: Kit[] }>(readFileSync(join(ROOT, 'harness/kits/index.json'), 'utf8')).kits;

test('S1 the catalog holds every component as a content-addressed unit with its dependencies', async () => {
  assert.equal(CATALOG.components.length, 38);
  assert.equal(CATALOG.prefix, 'sb');
  const button = parseJson<ComponentManifest>(await readFile(join(ROOT, 'harness/catalog/button/manifest.json'), 'utf8'));
  const paths = button.files.map((f) => f.path);
  for (const p of ['spec/components/button/contract.json', 'src/components/button/Button.ts', 'src/components/button/Button.scss', 'src/components/button/Button.stories.ts', 'playwright/tests/button/button.behavior.spec.ts']) assert.ok(paths.includes(p), p);
  assert.ok(!paths.some((p) => p.endsWith('/plan.md')), 'plans stay in the source repo');
  assert.deepEqual(paths.filter((p) => p.startsWith('docs/')).map((p) => p.split('/')[1]).sort(), ['a11y-audits', 'parity-audits'], 'a stable unit ships its latest audits only');
  assert.ok(!paths.some((p) => p.endsWith('.styles.ts')), 'generated styles are not catalogued');
  assert.ok(!paths.some((p) => p.includes('button-group')), 'button-group audits belong to button-group');
  assert.deepEqual(button.dependsOn, ['spinner']);
  const card = parseJson<ComponentManifest>(await readFile(join(ROOT, 'harness/catalog/card/manifest.json'), 'utf8'));
  assert.ok(card.uses.includes('button'), 'card stories render a button');
  for (const { path, hash } of button.files) assert.equal(hashOf(await readFile(join(ROOT, 'harness/catalog/button/files', hash))), hash, path);
  // Installed into the reference project, button snapshots back to the same unit.
  assert.deepEqual(snapshotComponent(await reference(), 'button').manifest, button);
  assert.deepEqual(CATALOG.kits.sort(), KITS.map((k) => k.id).sort());
});

test('S2 G1 keeps the catalog fresh in its source repo only', async () => {
  const dir = await fixture();
  await edit<{ catalog: { source: boolean } }>(dir, 'harness.config.json', (c) => { c.catalog = { source: true }; });
  // Fixtures have no harness/: give this one its own catalog, built from the fixture itself.
  buildCatalog(dir);
  assert.deepEqual(failing(await runChecks(dir, { only: ['G1'] })), []);
  await appendFile(join(dir, 'src/components/badge/Badge.ts'), '\n// edited\n');
  const r = await runChecks(dir, { only: ['G1'] });
  assert.deepEqual(failing(r), ['G1']);
  assert.match(JSON.stringify(must(r.results[0], 'the G1 result').errors), /harness\/catalog\/badge\/manifest\.json.*catalog:build/);
  await edit<{ catalog: { source: boolean } }>(dir, 'harness.config.json', (c) => { c.catalog.source = false; });
  assert.deepEqual(failing(await runChecks(dir, { only: ['G1'] })), []);
  await rm(dir, { recursive: true });
});

test('S3 + S4 blank removes every catalog component and kit only with --yes, and every check passes', async () => {
  const dir = await fixture();
  const refused = cliJson(dir, 'init', '--start', 'blank', '--json');
  assert.equal(refused.code, 1);
  const refusal = must(refused.json.errors[0], 'the refusal');
  assert.match(refusal.msg, /would remove 38 component/);
  assert.match(must(refusal.fix, 'its fix'), /--yes/);
  assert.equal((await components(dir)).length, 38);
  const r = cliJson(dir, 'init', '--start', 'blank', '--yes', '--detach-catalog', '--json');
  assert.equal(r.json.ok, true, r.out + r.err);
  assert.deepEqual(await components(dir), []);
  assert.deepEqual(await patterns(dir), []);
  assert.deepEqual(await readdir(join(dir, 'src/components')), []);
  assert.ok(!(await exists(join(dir, 'playwright/tests/button'))));
  assert.match(await readFile(join(dir, 'src/index.ts'), 'utf8'), /export \{\};/);
  const reg = await readJson<ComponentRegistry>(dir, 'spec/registry.json');
  assert.ok(reg.components.every((c) => c.status === 'planned'));
  const config = await readJson<{ starter: string; catalog: { source: boolean } }>(dir, 'harness.config.json');
  assert.equal(config.starter, 'blank');
  assert.equal(config.catalog.source, false);
  assert.ok(r.json.warnings.some((w) => typeof w !== 'string' && /WARNING: this repo was the catalog's source/.test(w.msg)), 'detaching the catalog source with --yes is loud');
  const report = await runChecks(dir);
  assert.deepEqual(failing(report), [], errorsOf(report));
  await rm(dir, { recursive: true });
});

test('S5 library has all 38 components and no kits; library+kits adds every kit', async () => {
  const dir = await fixture();
  assert.equal(cli(dir, 'init', '--start', 'blank', '--yes', '--detach-catalog').code, 0);
  const lib = cliJson(dir, 'init', '--start', 'library', '--json');
  assert.equal(lib.json.ok, true, lib.out);
  assert.equal((await components(dir)).length, 38);
  assert.deepEqual(await patterns(dir), []);
  const kits = cliJson(dir, 'init', '--start', 'library+kits', '--json');
  assert.equal(kits.json.ok, true, kits.out);
  assert.deepEqual(await patterns(dir), KITS.map((k) => k.id).sort());
  assert.deepEqual(failing(await runChecks(dir)), []);
  await rm(dir, { recursive: true });
});

test('S6 pick installs the chosen components and what they need, nothing else', async () => {
  const dir = await fixture();
  assert.equal(cli(dir, 'init', '--start', 'pick', '--yes', '--detach-catalog').code, 1, 'pick without --components fails');
  const dry = cliJson<{ starter: { components: { target: string[] } } }>(dir, 'init', '--start', 'pick', '--components', 'card,button', '--dry-run', '--json');
  assert.equal(dry.json.ok, true);
  assert.deepEqual(dry.json.data.starter.components.target, ['spinner', 'button', 'card']);
  const r = cliJson(dir, 'init', '--start', 'pick', '--components', 'card,button', '--yes', '--detach-catalog', '--json');
  assert.equal(r.json.ok, true, r.out);
  assert.deepEqual(await components(dir), ['button', 'card', 'spinner']);
  assert.match(await readFile(join(dir, 'src/index.ts'), 'utf8'), /components\/button\/index\.js[\s\S]*components\/card\/index\.js[\s\S]*components\/spinner\/index\.js/);
  assert.deepEqual(failing(await runChecks(dir)), []);
  await rm(dir, { recursive: true });
});

test('S7 + S9 + S10 add from the catalog into blank, refuse removals with dependents, remove cleanly', async () => {
  const dir = await fixture();
  cli(dir, 'init', '--start', 'blank', '--yes', '--detach-catalog');
  const r = cliJson<{ installed: string[] }>(dir, 'add', 'button', '--json');
  assert.equal(r.json.ok, true, r.out);
  assert.deepEqual(r.json.data.installed, ['spinner', 'button']);
  for (const f of ['spec/components/button/contract.json', 'spec/components/button/contract.md', 'src/components/button/Button.ts', 'src/components/button/Button.styles.ts', 'src/components/button/Button.stories.ts', 'playwright/tests/button/button.behavior.spec.ts', 'src/components/spinner/Spinner.ts']) assert.ok(await exists(join(dir, f)), f);
  const reg = await readJson<ComponentRegistry>(dir, 'spec/registry.json');
  const unit = await readJson<{ status: string }>(ROOT, 'harness/catalog/button/manifest.json');
  assert.equal(reg.components.find((c) => c.name === 'Button')?.status, unit.status, 'an added component keeps its catalog status');
  const report = await runChecks(dir, { only: ['C1', 'C2', 'C3', 'P1', 'R1', 'T2', 'T4'] });
  assert.deepEqual(failing(report), [], errorsOf(report));
  assert.equal(cliJson<{ installed: string[] }>(dir, 'add', 'button', '--json').json.data.installed.length, 0, 'idempotent');

  const blocked = cliJson(dir, 'remove', 'spinner', '--json');
  assert.equal(blocked.code, 1);
  assert.match(must(blocked.json.errors[0], 'the refusal').msg, /spinner is needed by component button/);
  assert.ok(await exists(join(dir, 'spec/components/spinner/contract.json')));

  cli(dir, 'add', 'badge');
  assert.ok(cliJson<{ components: { name: string }[] }>(dir, 'list', '--installed', '--json').json.data.components.some((c) => c.name === 'badge'));
  const removed = cliJson(dir, 'remove', 'badge', '--json');
  assert.equal(removed.json.ok, true, removed.out);
  assert.ok(!(await exists(join(dir, 'src/components/badge'))));
  assert.equal((await readJson<ComponentRegistry>(dir, 'spec/registry.json')).components.find((c) => c.name === 'Badge')?.status, 'planned');
  assert.doesNotMatch(await readFile(join(dir, 'src/index.ts'), 'utf8'), /badge/);
  const available = cliJson<{ components: { name: string }[] }>(dir, 'list', '--available', '--json').json.data.components.map((c) => c.name);
  assert.ok(available.includes('badge') && !available.includes('button'));
  assert.deepEqual(failing(await runChecks(dir)), []);
  await rm(dir, { recursive: true });
});

test('S8 add into a project with another prefix rewrites tags, variables and class names', async () => {
  const dir = await fixture();
  cli(dir, 'init', '--start', 'blank', '--yes', '--detach-catalog');
  assert.equal(cli(dir, 'prefix', 'acme').code, 0);
  const r = cliJson(dir, 'add', 'button', '--json');
  assert.equal(r.json.ok, true, r.out);
  const ts = await readFile(join(dir, 'src/components/button/Button.ts'), 'utf8');
  assert.match(ts, /'acme-button'/);
  assert.match(ts, /class AcmeButton/);
  assert.match(await readFile(join(dir, 'src/components/button/Button.scss'), 'utf8'), /--acme-button-/);
  assert.equal((await readJson<{ tag: string }>(dir, 'spec/components/button/contract.json')).tag, 'acme-button');
  for (const f of ['src/components/button/Button.ts', 'src/components/button/Button.stories.ts', 'playwright/tests/button/button.behavior.spec.ts']) assert.doesNotMatch(await readFile(join(dir, f), 'utf8'), /['<]sb-|--sb-|\bSb[A-Z]/, f);
  const report = await runChecks(dir);
  assert.deepEqual(failing(report), [], errorsOf(report));
  await rm(dir, { recursive: true });
});

test('S11 --blank (and registry entries outside the catalog) keep the contract scaffold', async () => {
  const dir = await fixture();
  cli(dir, 'init', '--start', 'blank', '--yes', '--detach-catalog');
  const r = cliJson<{ scaffold: boolean }>(dir, 'add', 'badge', '--blank', '--json');
  assert.equal(r.json.ok, true, r.out);
  assert.equal(r.json.data.scaffold, true);
  assert.equal((await readJson<{ status: string }>(dir, 'spec/components/badge/contract.json')).status, 'draft');
  await edit<ComponentRegistry>(dir, 'spec/registry.json', (reg) => reg.components.push({ name: 'Probe Widget', tier: 3, status: 'planned' }));
  assert.equal(cliJson<{ scaffold: boolean }>(dir, 'add', 'Probe Widget', '--json').json.data.scaffold, true);
  assert.deepEqual(failing(await runChecks(dir)), []);
  await rm(dir, { recursive: true });
});

test('S12 kits list, remove and add against harness/kits/index.json; remove refuses components a kit uses', async () => {
  const dir = await fixture();
  await edit<{ catalog: { source: boolean } }>(dir, 'harness.config.json', (c) => { c.catalog.source = false; });
  const list = cliJson<{ kits: { installed: boolean; inCatalog: boolean }[] }>(dir, 'kits', 'list', '--json').json.data.kits;
  assert.equal(list.length, KITS.length);
  assert.ok(list.every((k) => k.installed && k.inCatalog));
  const kit = must(KITS.find((k) => k.id === 'sign-in'), 'the sign-in kit');
  const blocked = cliJson(dir, 'remove', 'checkbox', '--json');
  assert.equal(blocked.code, 1);
  assert.match(must(blocked.json.errors[0], 'the refusal').msg, /kit sign-in/);
  const removed = cliJson(dir, 'kits', 'remove', 'sign-in', '--json');
  assert.equal(removed.json.ok, true, removed.out);
  assert.ok(!(await exists(join(dir, kit.path))));
  assert.deepEqual(failing(await runChecks(dir, { only: ['G1'] })), [], 'interface.json rebuilt after kits remove (SG-10)');
  assert.ok(!(await exists(join(dir, 'playwright/tests/patterns/sign-in.behavior.spec.ts'))));
  assert.deepEqual(failing(await runChecks(dir, { only: ['K1'] })), [], 'a catalogued kit may be listed while not installed');
  // A blank project, then the kit: its components come first.
  cli(dir, 'init', '--start', 'blank', '--yes', '--detach-catalog');
  const add = cliJson(dir, 'kits', 'add', 'sign-in', '--json');
  assert.equal(add.json.ok, true, add.out);
  assert.ok(await exists(join(dir, kit.path, 'pattern.json')));
  for (const c of kit.components) assert.ok(await exists(join(dir, 'spec/components', c, 'contract.json')), c);
  assert.deepEqual(failing(await runChecks(dir)), []);
  await rm(dir, { recursive: true });
});

test('S13 a starter foundations patch merges into brand.config.json', async () => {
  assert.deepEqual(mergePatch({ a: 1, b: { c: 2, d: 3 }, e: [1] }, { b: { c: 5, d: null }, e: [2], f: 'x' }), { a: 1, b: { c: 5 }, e: [2], f: 'x' });
  const dir = await fixture();
  await mkdir(join(dir, 'harness/starters'), { recursive: true });
  await writeFile(join(dir, 'harness/starters/teal.json'), JSON.stringify({ id: 'teal', title: 'Teal', for: 'test', foundations: { color: { primary: '#0F766E' } }, components: 'all', kits: 'all', next: [] }));
  const r = cliJson(dir, 'init', '--start', 'teal', '--json');
  assert.equal(r.json.ok, true, r.out);
  assert.equal((await readJson<{ color: { primary: string } }>(dir, 'brand.config.json')).color.primary, '#0F766E');
  assert.match((await readJson<{ color: { primary: DtcgTokenNode & { $value: string } } }>(dir, 'spec/tokens/semantic/light.tokens.json')).color.primary.$value, /^\{color\.brand\.\d+\}$/);
  await rm(dir, { recursive: true });
});

test('S14 no brands/ folder: brand build writes nothing and tokens.css stays byte-identical', async () => {
  const dir = await fixture();
  const before = await readFile(join(dir, 'generated/css/tokens.css'));
  const r = cliJson(dir, 'brand', 'build', '--json');
  assert.equal(r.json.ok, true);
  assert.deepEqual(r.json.changed, []);
  assert.ok((await readFile(join(dir, 'generated/css/tokens.css'))).equals(before));
  // No brand outputs (tokens.<brand>.css, brands.css); tokens.css and fonts.css are the single-brand outputs.
  assert.deepEqual((await readdir(join(dir, 'generated/css'))).filter((f) => /^tokens\..+\.css$|^brands\.css$/.test(f)), []);
  await rm(dir, { recursive: true });
});

test('S15 + S16 two brands: two token files with one interface, scoped brands.css, T6 per brand, brand use', async () => {
  const dir = await fixture();
  assert.equal(cli(dir, 'brand', 'add', 'ocean', '--from', 'current').code, 0);
  await edit<{ color: { primary: string } }>(dir, 'brands/ocean.brand.json', (b) => { b.color.primary = '#0369A1'; });
  assert.equal(cli(dir, 'brand', 'add', 'forest', '--from', 'ocean').code, 0);
  await edit<{ color: { primary: string }; radius: unknown }>(dir, 'brands/forest.brand.json', (b) => { b.color.primary = '#15803D'; b.radius = { preset: 'sharp' }; });
  assert.equal(cli(dir, 'brand', 'add', 'ocean').code, 1, 'existing brand');
  assert.equal(cli(dir, 'brand', 'add', 'Bad Name').code, 1, 'name pattern');
  const before = await readFile(join(dir, 'generated/css/tokens.css'));
  const r = cliJson(dir, 'brand', 'build', '--json');
  assert.equal(r.json.ok, true, r.out);
  assert.ok((await readFile(join(dir, 'generated/css/tokens.css'))).equals(before), 'tokens.css untouched');
  const base = await readFile(join(dir, 'generated/css/tokens.css'), 'utf8');
  const ocean = await readFile(join(dir, 'generated/css/tokens.ocean.css'), 'utf8');
  const forest = await readFile(join(dir, 'generated/css/tokens.forest.css'), 'utf8');
  assert.deepEqual(vars(block(ocean, '[data-theme="dark"]')), vars(block(base, '[data-theme="dark"]')), 'same semantic interface');
  assert.deepEqual(vars(block(forest, '[data-theme="dark"]')), vars(block(base, '[data-theme="dark"]')));
  assert.match(ocean, /--sb-color-brand-\d+: #0369a1/i);
  assert.match(forest, /--sb-radius-xs: 0px/);
  const scoped = await readFile(join(dir, 'generated/css/brands.css'), 'utf8');
  assert.match(scoped, /:root\[data-brand="ocean"\], \[data-brand="ocean"\]\[data-theme="light"\] \{/);
  assert.match(scoped, /\[data-brand="forest"\]\[data-theme="dark"\] \{/);
  const t6 = must((await runChecks(dir, { only: ['T6'] })).results[0], 'the T6 result');
  assert.deepEqual(t6.errors, []);
  assert.deepEqual([...new Set(t6.info.map((i) => (typeof i === 'string' ? undefined : i.brand)).filter(Boolean))].sort(), ['forest', 'ocean']);
  assert.deepEqual(failing(await runChecks(dir)), []);
  // G1 notices a brand edited without a build; T6 rejects a brand that misses its contrast targets (AAA alone now
  // passes: the linked text colors follow the target, SB-0058; a 4.5:1 UI target is something borders do not meet).
  await edit<{ contrast?: unknown }>(dir, 'brands/forest.brand.json', (b) => { b.contrast = { standard: 'wcag-aaa', targets: { ui: 4.5 } }; });
  const after = await runChecks(dir, { only: ['T6', 'G1'] });
  assert.deepEqual(failing(after), ['T6', 'G1']);
  assert.match(must(after.results[0]?.errors[0], 'the first T6 error').msg, /^brand forest: /);
  assert.equal(must(after.results[0]?.errors[0], 'the first T6 error').file, 'brands/forest.brand.json');
  await edit<{ contrast?: unknown }>(dir, 'brands/forest.brand.json', (b) => { delete b.contrast; });
  const unsaved = cliJson(dir, 'brand', 'use', 'ocean', '--json');
  assert.equal(unsaved.code, 1, 'brand.config.json is saved in no brand file');
  assert.match(must(unsaved.json.errors[0], 'the refusal').msg, /saved in no brands/);
  const use = cliJson(dir, 'brand', 'use', 'ocean', '--yes', '--json');
  assert.equal(use.json.ok, true, use.out);
  assert.equal((await readJson<{ color: { primary: string } }>(dir, 'brand.config.json')).color.primary, '#0369A1');
  assert.equal((await readJson<{ $schema: string }>(dir, 'brand.config.json')).$schema, './spec/schemas/brand-config.schema.json');
  assert.deepEqual(cliJson<{ brands: { name: string; active: boolean }[] }>(dir, 'brand', 'list', '--json').json.data.brands.map((b) => [b.name, b.active]), [['forest', false], ['ocean', true]]);
  assert.deepEqual(failing(await runChecks(dir)), []);
  await rm(dir, { recursive: true });
});

test('S14 the Sketchbook repo itself is single-brand: its token CSS is what a single-brand build of its own files produces', sourceRepoOnly, async () => {
  // The source repo carries its own brand (color.primary), so the comparison is against a fresh build of the live files,
  // not against the default project the fixture copies.
  const { buildTokens } = await import('../build/index.mjs');
  const fresh = (await buildTokens({ root: ROOT, write: false })).css;
  assert.equal(await readFile(join(ROOT, 'generated/css/tokens.css'), 'utf8'), fresh, 'the repo itself is single-brand: the live token CSS equals a fresh build');
});

const PROJECT = ['spec', 'brand.config.json', 'harness.config.json', 'generated', 'src', 'playwright', 'docs', 'harness', '.claude', 'scripts', '.githooks'];

test('S17 + S18 upgrade replaces harness-owned files only and lists team-owned differences', async () => {
  const target = await fixture(PROJECT);
  const source = await fixture(PROJECT);
  await appendFile(join(source, 'harness/checks/x1-decisions.mjs'), '// upstream fix\n');
  await writeFile(join(source, 'harness/standards/new-family.json'), '{}\n');
  await appendFile(join(source, 'docs/cli.md'), '\nupstream\n');
  await edit<{ $description: string }>(source, 'spec/registry.json', (r) => { r.$description = 'upstream edit'; });
  await appendFile(join(source, 'src/components/badge/Badge.scss'), '\n');
  await appendFile(join(target, 'docs/getting-started.md'), '\nour notes\n');
  await edit<{ version: string }>(source, 'harness/manifest.json', (m) => { m.version = '9.9.9'; });
  const teamBefore = await readFile(join(target, 'spec/registry.json'));
  const dry = cliJson<{ update: string[]; protected: string[]; add: string[]; teamDiffers: string[] }>(target, 'upgrade', '--from', source, '--dry-run', '--json');
  assert.equal(dry.json.ok, true, dry.out + dry.err);
  const d = dry.json.data;
  assert.deepEqual(d.update.sort(), ['docs/cli.md', 'harness/checks/x1-decisions.mjs']);
  assert.deepEqual(d.protected, ['harness/manifest.json'], 'the ownership manifest is reported, never written (SB-0070)');
  assert.deepEqual(d.add, ['harness/standards/new-family.json']);
  assert.deepEqual(d.teamDiffers.sort(), ['docs/getting-started.md', 'spec/registry.json', 'src/components/badge/Badge.scss']);
  assert.doesNotMatch(await readFile(join(target, 'harness/checks/x1-decisions.mjs'), 'utf8'), /upstream fix/, 'dry run writes nothing');
  const real = cliJson<{ version: { after: string } }>(target, 'upgrade', '--from', source, '--yes', '--json');
  assert.equal(real.json.data.version.after, '9.9.9');
  assert.match(await readFile(join(target, 'harness/checks/x1-decisions.mjs'), 'utf8'), /upstream fix/);
  assert.ok((await readFile(join(target, 'spec/registry.json'))).equals(teamBefore), 'team file untouched');
  assert.match(await readFile(join(target, 'docs/getting-started.md'), 'utf8'), /our notes/);
  assert.equal((await readJson<{ harnessVersion: string }>(target, 'harness.config.json')).harnessVersion, '9.9.9');
  assert.ok(Array.isArray(real.json.errors), 'checks ran');
  assert.equal(cli(target, 'upgrade', '--json').code, 1, '--from is required');
  await rm(target, { recursive: true });
  await rm(source, { recursive: true });
});

// The doctor data S19 reads.
interface Doctor {
  starter: string; harnessVersion: string | null; harnessAvailable: unknown;
  components: { installed: string[]; available: string[]; customized: string[]; teamMade: string[] };
  kits: { installed: string[] }; brands: unknown; overrides: number; design: object; checks: { failing: unknown[] };
}

test('S19 doctor --json reports starter, versions, components, kits, brands, overrides, design and checks', async () => {
  const dir = await fixture();
  cli(dir, 'init', '--start', 'pick', '--components', 'badge', '--yes', '--detach-catalog');
  await appendFile(join(dir, 'src/components/badge/Badge.scss'), '\n');
  const { json, code } = cliJson<Doctor>(dir, 'doctor', '--json');
  assert.equal(code, 0);
  for (const k of ['ok', 'command', 'changed', 'warnings', 'errors', 'next']) assert.ok(k in json, k);
  const d = json.data;
  assert.equal(d.starter, 'pick');
  assert.equal(d.harnessVersion, null);
  assert.equal(typeof d.harnessAvailable, 'string');
  assert.deepEqual(d.components.installed, ['badge']);
  assert.equal(d.components.available.length, 37);
  assert.deepEqual(d.components.customized, ['badge']);
  assert.deepEqual(d.components.teamMade, []);
  assert.deepEqual(d.kits.installed, []);
  assert.deepEqual(d.brands, { list: [], active: null });
  assert.equal(d.overrides, 0);
  assert.ok('tool' in d.design);
  assert.deepEqual(Object.keys(d.checks).sort(), ['exitCode', 'failing', 'warnings']);
  assert.ok(Array.isArray(d.checks.failing));
  await rm(dir, { recursive: true });
});

test('S19b doctor exits like check: 1 when a check fails, 0 when they pass', async () => {
  const dir = await fixture();
  cli(dir, 'init', '--start', 'pick', '--components', 'badge', '--yes', '--detach-catalog');
  assert.equal(cli(dir, 'doctor', '--json').code, cli(dir, 'check', '--json').code);
  await writeFile(join(dir, 'spec/components/badge/contract.json'), '{}');
  assert.equal(cli(dir, 'check', '--json').code, 1, 'the fixture breaks a check');
  const r = cliJson<{ checks: { failing: unknown[] } }>(dir, 'doctor', '--json');
  assert.equal(r.code, 1);
  assert.equal(r.json.ok, false);
  assert.ok(r.json.data.checks.failing.length);
  await rm(dir, { recursive: true });
});

const SHEET = `
:root { --brand: #2563eb; }
.btn { color: #2563EB; background: #2463EB; padding: 8px 16px; border-radius: 6px; font-size: 14px; box-shadow: 0 1px 2px rgba(0,0,0,.05); }
.btn-alt { color: rgb(37, 99, 235); margin: 0 0 24px; border-radius: 6px; font-size: 0.875rem; }
.card { background: #fff; border: 1px solid #e5e7eb; padding: 1rem; gap: 12px; border-radius: 12px; font-size: 16px; box-shadow: 0 1px 2px rgba(0,0,0,.05); }
.danger { color: #dc2626; margin-top: 4px; font-size: 2rem; }
.muted { color: #6B7280; padding: 2px 8px; }
`;

test('S20 audit-css clusters colors by OKLCH distance and proposes foundations, deterministically', async () => {
  const dir = await fixture(['harness.config.json', 'brand.config.json']);
  await mkdir(join(dir, 'app/styles'), { recursive: true });
  await writeFile(join(dir, 'app/styles/main.css'), SHEET);
  await writeFile(join(dir, 'app/styles/extra.scss'), '$x: 1;\n.extra { .inner { color: #DC2626; padding: 32px; } }\n');
  const p = auditCss(dir, ['app/**/*.*ss']);
  assert.deepEqual(p.sources, ['app/styles/extra.scss', 'app/styles/main.css']);
  const blue = must(p.colors.clusters.find((c) => c.value === '#2563EB'), 'the #2563EB cluster');
  assert.equal(blue.count, 4, 'hex, near-identical hex and rgb() join one cluster');
  assert.deepEqual(blue.members.map((m) => m.value).sort(), ['#2463EB', '#2563EB']);
  assert.equal(p.colors.clusters.find((c) => c.value === '#DC2626')?.count, 2);
  assert.equal(p.colors.clusters.find((c) => c.value === '#FFFFFF')?.role, 'neutral');
  assert.deepEqual(p.fontSizes.map((s) => [s.value, s.count]), [[14, 2], [16, 1], [32, 1]]);
  assert.equal(p.spacing.base, 4);
  assert.deepEqual(p.radii.map((r) => [r.value, r.count]), [[6, 2], [12, 1]]);
  assert.deepEqual(p.shadows.map((s) => [s.value, s.count]), [['0 1px 2px rgba(0,0,0,.05)', 2]]);
  assert.equal(p.proposedFoundations.color.primary, '#2563EB');
  assert.equal(p.proposedFoundations.typography.baseSize, 14);
  const a = cliJson(dir, 'audit-css', 'app', '--json');
  assert.equal(a.json.ok, true, a.out);
  assert.match(must(a.json.next, 'next'), /AGENT-WORKFLOWS\.md/);
  const first = await readFile(join(dir, 'generated/import/codebase.proposal.json'));
  cli(dir, 'audit-css', 'app');
  assert.ok((await readFile(join(dir, 'generated/import/codebase.proposal.json'))).equals(first), 'same input, same bytes');
  assert.equal(cli(dir, 'audit-css', 'nope', '--json').code, 1);
  await rm(dir, { recursive: true });
});

test('S20b audit-css takes the body size from html, body or :root; otherwise the most used, ties going to the size closest to 16px', async () => {
  const dir = await fixture(['harness.config.json', 'brand.config.json']);
  await mkdir(join(dir, 'a'), { recursive: true });
  await writeFile(join(dir, 'a/app.css'), 'body { font-size: 16px; }\n.small { font-size: 12px; }\n.tiny { font-size: 12px; }\n.title { font-size: 24px; }\n');
  assert.equal(auditCss(dir, ['a']).proposedFoundations.typography.baseSize, 16, 'the body rule wins over the most used size');
  await mkdir(join(dir, 'b'), { recursive: true });
  await writeFile(join(dir, 'b/app.css'), '.a { font-size: 12px; }\n.b { font-size: 15px; }\n.c { font-size: 20px; }\n');
  assert.equal(auditCss(dir, ['b']).proposedFoundations.typography.baseSize, 15, 'a tie goes to the size closest to 16px');
  await rm(dir, { recursive: true });
});

test('S21 import and from-codebase starters run or print their next step', async () => {
  const dir = await fixture();
  await mkdir(join(dir, 'legacy'), { recursive: true });
  await writeFile(join(dir, 'legacy/site.css'), SHEET);
  const code = cliJson(dir, 'init', '--start', 'from-codebase', '--from', 'legacy', '--json');
  assert.equal(code.json.ok, true, code.out);
  assert.ok(code.json.changed.includes('generated/import/codebase.proposal.json'));
  assert.match(must(code.json.next, 'next'), /AGENT-WORKFLOWS\.md/);
  assert.doesNotMatch(must(code.json.next, 'next'), /\/foundations import/);
  assert.ok(await exists(join(dir, 'generated/import/codebase.proposal.json')));
  const imp = cliJson(dir, 'init', '--start', 'import', '--json');
  assert.equal(imp.json.ok, true);
  assert.match(must(imp.json.next, 'next'), /tokens import/);
  assert.equal((await readJson<{ starter: string }>(dir, 'harness.config.json')).starter, 'import');
  assert.equal(cli(dir, 'init', '--start', 'nope', '--json').code, 1);
  await rm(dir, { recursive: true });
});

test('every starter file has the documented shape and every --start id in known-commands exists', async () => {
  const known = parseJson<{ starters: string[] }>(await readFile(join(ROOT, 'harness/cli/known-commands.json'), 'utf8'));
  const files = (await readdir(join(ROOT, 'harness/starters'))).filter((f) => f.endsWith('.json'));
  assert.deepEqual(files.map((f) => f.replace('.json', '')).sort(), [...known.starters].sort());
  for (const f of files) {
    const s = parseJson<Record<string, unknown>>(await readFile(join(ROOT, 'harness/starters', f), 'utf8'));
    for (const k of ['id', 'title', 'for', 'foundations', 'components', 'kits', 'next']) assert.ok(k in s, `${f} lacks ${k}`);
    assert.equal(`${String(s.id)}.json`, f);
    for (const k of ['components', 'kits']) assert.ok(s[k] === 'all' || s[k] === 'none' || Array.isArray(s[k]), `${f} ${k}`);
    for (const step of s.next as string[]) if (/\/(?:foundations|import-tokens|kits)\b/.test(step)) assert.match(step, /Claude Code: \/(?:foundations|import-tokens|kits)/, `${f}: label Claude-specific slash commands`);
  }
  assert.deepEqual(catalogIndex(ROOT).components.length, 38);
});

// The harness tests run on any install (TEST.md, "Reference project"): the fixture builder reads harness-owned files
// only, and the suite passes after the starters that take the default content away. A self test runs the suite in a
// copy, so the copy skips these two (no recursion).
// The pinned skeleton is a copy of this repo's default project; it must not drift from it (refresh: npm run
// test:reference-sync). DECISIONS.md grows with every change, so there each pinned entry must still be in the live log
// word for word (accepted entries are read-only) instead of the whole file being equal.
test('R1 the reference skeleton equals its live counterparts (DECISIONS.md: every pinned entry, verbatim)', sourceRepoOnly, async () => {
  const { skeletonDrift } = await import('./sync-reference.mjs');
  const drift = skeletonDrift(ROOT);
  assert.ok(drift.length > 20, 'the skeleton was read');
  const entries = (text: string) => text.split(/^(?=### SB-)/m).slice(1).map((e) => e.replace(/\n---\n*$|\n+$/, ''));
  const off: string[] = [];
  for (const d of drift) {
    if (d.file !== 'spec/decisions/DECISIONS.md') { if (d.state !== 'same') off.push(`${d.file} (${d.state})`); continue; }
    const live = await readFile(join(ROOT, d.file), 'utf8');
    for (const e of entries(await readFile(join(ROOT, 'harness/templates/project', d.file), 'utf8'))) if (!live.includes(e)) off.push(`${d.file}: ${e.split('\n')[0]}`);
  }
  assert.deepEqual(off, [], 'run npm run test:reference-sync (or restore the live file)');
});

const SELF_TEST = 'SKETCHBOOK_HARNESS_SELF_TEST';
const outsideSelfTest = { skip: process.env[SELF_TEST] ? 'inside a harness self test' : checkoutOnly.skip };
// A temp project made of the given parts, with this install's node_modules.
async function project(parts: string[]) {
  const dir = await fixture(parts);
  await symlink(join(ROOT, 'node_modules'), join(dir, 'node_modules'), 'dir');
  return dir;
}

test('S34 the reference project is built from harness-owned files only', outsideSelfTest, async () => {
  // Only the harness-owned parts (harness/manifest.json "harness"): no spec/, src/, docs/, playwright/ or configs.
  const dir = await project(['harness', 'scripts', '.claude', '.githooks']);
  for (const team of ['spec', 'src', 'docs', 'playwright', '.storybook', 'brand.config.json', 'harness.config.json']) assert.ok(!(await exists(join(dir, team))), `${team} absent`);
  const out = join(dir, 'built');
  const script = `import { buildReference } from ${JSON.stringify(pathToFileURL(join(dir, 'harness/test/reference.mjs')).href)};\nimport { runChecks } from ${JSON.stringify(pathToFileURL(join(dir, 'harness/checks/run.mjs')).href)};\nawait buildReference(${JSON.stringify(out)});\nconst r = await runChecks(${JSON.stringify(out)});\nconsole.log(JSON.stringify({ exitCode: r.exitCode, failing: r.results.filter((x) => x.errors.length).map((x) => [x.id, x.errors.slice(0, 2)]) }));`;
  const r = spawnSync('node', ['--input-type=module', '-e', script], { cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(parseJson(r.stdout), { exitCode: 0, failing: [] });
  assert.equal((await components(out)).length, CATALOG.components.length);
  assert.deepEqual(await patterns(out), KITS.map((k) => k.id).sort());
  await rm(dir, { recursive: true });
});

// The tests that used to read the team's files (golden output, catalog snapshot, interface, Penpot payload, prefix
// rename, brand links vs templates) and the ones about the Sketchbook repo itself (skipped once the catalog is detached).
const SELF_TESTS = ['baseline passes', 'tokens\\.css starts', 'X1 rejects', 'W1 rejects a contract', 'S1 ', 'S3 ', 'S14', 'S24', 'F1 golden', 'F13', 'K17', 'P1 typography', 'renamePrefix to a new prefix', 'L9', 'F-none', 'docs name only', 'K13', 'P8', 'P3 docs', 'P4 theme', 'P9 CLI', 'P10 generic', 'P11 verify', 'P12 progress', 'T7 and D3'];

for (const start of ['blank', 'library']) {
  void test(`S35 after init --start ${start} --yes --detach-catalog the harness tests still pass`, outsideSelfTest, async () => {
    const dir = await project([...PROJECT, '.storybook']);
    const init = cliJson(dir, 'init', '--start', start, '--yes', '--detach-catalog', '--json');
    assert.equal(init.json.ok, true, init.out + init.err);
    const files = (await readdir(join(dir, 'harness/test'))).filter((f) => f.endsWith('.test.mjs')).map((f) => `harness/test/${f}`);
    const env: NodeJS.ProcessEnv = { ...process.env, [SELF_TEST]: '1' };
    delete env.NODE_TEST_CONTEXT; // a run of its own, not a child of this one
    const r = spawnSync('node', ['--test', '--test-reporter=spec', ...SELF_TESTS.flatMap((p) => ['--test-name-pattern', p]), ...files], { cwd: dir, encoding: 'utf8', env, maxBuffer: 64 * 1024 * 1024 });
    assert.equal(r.status, 0, r.stdout.split('\n').filter((l) => /^not ok|✖|Error|expected|actual/.test(l)).slice(0, 40).join('\n'));
    assert.match(r.stdout, /ℹ pass ([1-9]\d+)/, 'the subset ran');
    assert.match(r.stdout, /ℹ fail 0/);
    await rm(dir, { recursive: true });
  });
}
