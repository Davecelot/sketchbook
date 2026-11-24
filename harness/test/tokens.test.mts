// sketchbook tokens … (cases K1–K17 in TEST.md): every subcommand answers the --json envelope, dry runs write nothing,
// mutating subcommands regenerate, rebuild and run the token checks, and the interface keeps renames honest.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, rm, readdir, chmod } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fixture, readJson, edit, failing, errorsOf, reference, must, ROOT, PARTS } from './helpers.mjs';
import { dispatch } from '../cli/run.mjs';
import { find } from '../cli/registry.mjs';
import { runChecks } from '../checks/run.mjs';
import { buildInterface, INTERFACE_FILE } from '../lib/interface.mjs';
import { cssDiff, parseCssVars } from '../commands/tokens.mjs';
import { parseSets, proposeMapping, resolveImport, toHex, roleSet } from '../commands/tokens-import.mjs';
import { errorMessage, parseJson } from '../lib/files.mjs';
import type { Envelope } from '../cli/types.mjs';
import type { CssDiff, DtcgTokenNode, Impact } from '../commands/tokens.mjs';
import type { ImportProposal, TokensStudioTheme } from '../commands/tokens-import.mjs';
import type { ContrastPair, InterfaceDoc } from '../lib/interface.mjs';
import type { Json } from '../standards/resolve.mjs';

const FIX = join(ROOT, 'harness/test/fixtures/import');
const isStringMap = (v: Json | undefined): v is Record<string, string> => typeof v === 'object' && v !== null && !Array.isArray(v) && Object.values(v).every((x) => typeof x === 'string');

type Result<D = unknown> = { code: number; json: Envelope & { data: D } };

// D is the shape of the envelope's data the test reads: the JSON boundary.
async function sb<D = unknown>(dir: string, ...args: string[]): Promise<Result<D>> {
  let stdout = '';
  const code = await dispatch([...args, '--json'], { root: dir, stdout: (s) => { stdout += s; }, stderr: () => {} });
  const json = parseJson<Envelope & { data: D }>(stdout);
  return { code, json };
}
const envelope = (j: Envelope) => {
  for (const k of ['ok', 'command', 'changed', 'warnings', 'errors', 'next']) assert.ok(k in j, `envelope lacks ${k}`);
  assert.equal(j.command, 'tokens');
  for (const e of j.errors) for (const k of ['file', 'msg', 'fix']) assert.ok(k in e, `error lacks ${k}`);
};
const ok = (r: Result, label: string) => { envelope(r.json); assert.equal(r.json.ok, true, `${label}: ${JSON.stringify(r.json.errors).slice(0, 600)}`); assert.notEqual(r.code, 1, label); };

test('Tokens Studio ignores inactive sets and resolves competing sets in set order per theme', () => {
  const color = (value: string) => ({ $type: 'color', $value: value });
  const themes: TokensStudioTheme[] = [
    { name: 'Light', selectedTokenSets: { shared: 'source', light: 'enabled', disabled: 'disabled' } },
    { name: 'Dark', selectedTokenSets: { shared: 'source', dark: 'enabled', disabled: 'disabled' } },
  ];
  const doc = {
    $metadata: { tokenSetOrder: ['shared', 'light', 'dark', 'disabled', 'unselected'] },
    shared: { color: { primary: color('#000000'), accent: color('{color.primary}'), background: color('#ffffff'), link: color('{color.lightOnly}') } },
    light: { color: { primary: color('#0000ff'), lightOnly: color('#cccccc') } },
    dark: { color: { primary: color('#00ff00') } },
    disabled: { color: { primary: color('#ff0000') } },
    unselected: { color: { primary: color('#ffff00') } },
    $themes: themes,
  };
  const { tokens } = parseSets(doc);
  assert.deepEqual([...new Set(tokens.map((t) => t.set))].sort(), ['dark', 'light', 'shared']);
  const resolved = resolveImport(tokens, { themeScoped: true });
  assert.equal(resolved.find((t) => t.path === 'color.link' && t.mode === 'dark')?.resolved, null);
  const { mapping } = proposeMapping(resolved, {
    semantic: ['color.primary', 'color.accent', 'color.background'].map((path) => ({ path, type: 'color' })),
  });
  for (const path of ['primary', 'accent']) {
    assert.deepEqual(mapping.find((entry) => entry.to === `color.${path}`)?.values, { light: '#0000ff', dark: '#00ff00' });
  }
  assert.deepEqual(mapping.find((entry) => entry.to === 'color.background')?.values, { base: '#ffffff' });
  assert.equal(mapping.find((entry) => entry.to === 'foundation:color.primary')?.value, '#0000FF');
  const sharedLast = parseSets({ ...doc, $metadata: { tokenSetOrder: ['light', 'dark', 'shared'] } });
  assert.deepEqual(sharedLast.tokens.filter((t) => t.path === 'color.primary').map((t) => t.value), ['#000000', '#000000']);
  assert.deepEqual(parseSets({ color: { primary: color('#000000') } }).tokens.map((t) => t.value), ['#000000']);
  assert.deepEqual(parseSets({ $metadata: { tokenSetOrder: ['light'] }, light: doc.light }).tokens.map((t) => [t.path, t.mode]), [
    ['color.primary', 'light'],
    ['color.lightOnly', 'light'],
  ]);
});

// Every file under these folders, as text, to prove a dry run writes nothing.
async function snapshot(dir: string, folders = ['spec', 'src', 'playwright', '.storybook', 'generated/css', 'generated/tokens']) {
  const out: Record<string, string> = {};
  const walk = async (rel: string) => {
    for (const e of await readdir(join(dir, rel), { withFileTypes: true }).catch(() => [])) {
      const p = `${rel}/${e.name}`;
      if (e.isDirectory()) await walk(p); else out[p] = await readFile(join(dir, p), 'utf8');
    }
  };
  for (const f of folders) await walk(f);
  out['brand.config.json'] = await readFile(join(dir, 'brand.config.json'), 'utf8');
  return out;
}

test('K1 tokens is one registry command with documented subcommands', () => {
  const c = find('tokens');
  assert.ok(c && c.mutates && c.dryRun && c.cssVarArgs);
  const subcommands = must(c.subcommands, 'tokens subcommands').map((s) => { assert.ok(typeof s === 'object', 'every tokens subcommand is described'); return s; });
  const names = subcommands.map((s) => s.name);
  assert.deepEqual(names, ['rebuild', 'set', 'preset', 'presets', 'diff', 'impact', 'add', 'remove', 'rename', 'rename-plan', 'import', 'scratch', 'overrides']);
  for (const s of subcommands) for (const k of ['name', 'usage', 'summary', 'mutates', 'examples']) assert.ok(k in s, `${s.name} lacks ${k}`);
  const known = parseJson<{ commands: { tokens: { subcommands: string[] } } }>(spawnSync('cat', [join(ROOT, 'harness/cli/known-commands.json')], { encoding: 'utf8' }).stdout);
  assert.deepEqual(known.commands.tokens.subcommands, names);
});

test('tokens rebuild previews and applies a direct brand edit without requiring repository-only npm scripts', async () => {
  const dir = await fixture(PARTS);
  try {
    await edit<{ radius: unknown }>(dir, 'brand.config.json', (brand) => { brand.radius = { style: 'round' }; });
    const foundation = join(dir, 'spec/tokens/foundation/radius.tokens.json');
    const before = await readFile(foundation, 'utf8');
    const preview = await sb(dir, 'tokens', 'rebuild', '--dry-run', '--yes');
    ok(preview, 'rebuild dry run');
    assert.equal(await readFile(foundation, 'utf8'), before);
    const result = await sb(dir, 'tokens', 'rebuild', '--yes');
    ok(result, 'rebuild');
    assert.notEqual(await readFile(foundation, 'utf8'), before);
    assert.deepEqual(failing(await runChecks(dir, { only: ['G1'] })), []);
    const unexpected = await sb(dir, 'tokens', 'rebuild', 'extra');
    assert.equal(unexpected.code, 1);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('K2 + K3 read-only subcommands answer the envelope; every mutating dry run writes nothing', async () => {
  const dir = await fixture(PARTS);
  const proposal = 'generated/import/shadcn.proposal.json';
  ok(await sb(dir, 'tokens', 'import', join(FIX, 'shadcn-theme.css'), '--from', 'css', '--name', 'shadcn'), 'import');
  await writeFile(join(dir, 'answers.json'), JSON.stringify({ name: 'probe', spacing: 'grid-8' }));
  const before = await snapshot(dir);
  for (const args of [['presets'], ['presets', 'color'], ['impact', 'color.primary'], ['impact', '--sb-color-border'], ['overrides', 'list']]) ok(await sb(dir, 'tokens', ...args), args.join(' '));
  const dry = [
    ['rebuild'], ['set', 'typography.family', 'Inter'], ['preset', 'spacing', 'grid-8'],
    ['add', 'color.highlight', '--light', '{color.neutral.100}', '--dark', '{color.neutral.800}'],
    ['rename', 'color.muted', 'color.subtle'], ['import', join(FIX, 'tokens-studio.json'), '--from', 'dtcg'],
    ['import', 'apply', proposal], ['scratch', '--answers', 'answers.json'], ['overrides', 'reset', '--all'],
  ];
  for (const args of dry) {
    const r = await sb<{ dryRun: boolean }>(dir, 'tokens', ...args, '--dry-run');
    ok(r, args.join(' '));
    assert.equal(r.json.data.dryRun, true, args.join(' '));
  }
  const set = await sb<{ diff: CssDiff }>(dir, 'tokens', 'set', 'typography.family', 'Inter', '--dry-run');
  assert.ok(set.json.changed.includes('brand.config.json'));
  assert.equal(set.json.data.diff.light?.changed[0]?.name, '--sb-font-family-sans');
  assert.deepEqual(await snapshot(dir), before);
  const ro = await sb(dir, 'tokens', 'impact', 'color.primary', '--dry-run');
  assert.equal(ro.json.ok, false);
  await rm(dir, { recursive: true });
});

test('K4 + K6 set and preset change brand.config, rebuild, pass checks and propose a decision', async () => {
  const dir = await fixture(PARTS);
  const decisions = () => readFile(join(dir, 'spec/decisions/DECISIONS.md'), 'utf8');
  const count = async () => ((await decisions()).match(/^### SB-/gm) ?? []).length;
  const n0 = await count();
  const a = await sb<{ decision: string }>(dir, 'tokens', 'set', 'typography.family', 'Inter');
  ok(a, 'set family');
  assert.equal((await readJson<{ typography: { family: string } }>(dir, 'brand.config.json')).typography.family, 'Inter');
  assert.match(await readFile(join(dir, 'generated/css/tokens.css'), 'utf8'), /--sb-font-family-sans: Inter,/);
  assert.match(a.json.data.decision, /^SB-\d{4}$/);
  assert.equal(await count(), n0 + 1);
  assert.match(await decisions(), new RegExp(`- Theme: ${a.json.data.decision}`));
  const b = await sb(dir, 'tokens', 'set', 'spacing.preset', 'grid-8', '--no-record');
  ok(b, 'set spacing.preset');
  assert.deepEqual((await readJson<{ spacing: unknown }>(dir, 'brand.config.json')).spacing, { preset: 'grid-8' });
  assert.ok(b.json.warnings.some((w) => typeof w === 'string' && /replaces base, steps/.test(w)));
  assert.equal(await count(), n0 + 1, '--no-record adds no record');
  const c = await sb(dir, 'tokens', 'preset', 'typography', 'perfect-fourth', '--no-record');
  ok(c, 'preset typography');
  assert.deepEqual((await readJson<{ typography: { scale: unknown } }>(dir, 'brand.config.json')).typography.scale, { preset: 'perfect-fourth' });
  assert.ok(c.json.warnings.some((w) => typeof w !== 'string' && w.check === 'F1' && /control-xs/.test(w.token ?? w.msg)), 'F1 warns about the 10px xs step');
  const p = await sb<{ families: { family: string }[] }>(dir, 'tokens', 'presets', 'typography');
  assert.ok(p.json.data.families.map((f) => f.family).includes('typeScale'));
  const report = await runChecks(dir);
  assert.deepEqual(failing(report), [], errorsOf(report));
  await rm(dir, { recursive: true });
});

test('K5 set refuses values the schema or catalog rejects, writing nothing', async () => {
  const dir = await fixture(['spec', 'brand.config.json', 'harness.config.json', 'generated']);
  const before = await readFile(join(dir, 'brand.config.json'), 'utf8');
  // The last one points a z role at a value the preset lacks: the layer.toast link could not follow it.
  for (const args of [['color.primary', 'blue'], ['motion.preset', 'nope'], ['colour', 'x'], ['radius.custom.lg', '12'], ['z.roles', '{"toast":"600"}']]) {
    const r = await sb(dir, 'tokens', 'set', ...args);
    envelope(r.json);
    assert.equal(r.code, 1, args.join(' '));
    assert.ok(r.json.errors[0]?.fix);
  }
  assert.equal(await readFile(join(dir, 'brand.config.json'), 'utf8'), before);
  await rm(dir, { recursive: true });
});

test('K7 diff lists CSS custom properties per mode against git HEAD', async () => {
  const dir = await fixture(PARTS);
  const git = (...a: string[]) => spawnSync('git', ['-C', dir, ...a], { encoding: 'utf8' });
  git('init', '-q'); git('add', '-A'); git('-c', 'user.name=t', '-c', 'user.email=t@example.com', 'commit', '-qm', 'base');
  ok(await sb(dir, 'tokens', 'set', 'color.primary', '#0F766E', '--no-record'), 'set primary');
  const r = await sb<{ diff: CssDiff }>(dir, 'tokens', 'diff');
  ok(r, 'diff');
  assert.ok(r.json.data.diff.light?.added.some((x) => x.name === '--sb-color-brand-500'));
  assert.ok(r.json.data.diff.light?.changed.some((x) => x.name === '--sb-color-primary'));
  assert.ok(r.json.data.diff.dark?.changed.some((x) => x.name === '--sb-color-primary'));
  assert.equal(git('status', '--porcelain', 'generated/css/tokens.css').stdout.trim().length > 0, true);
  const none = await sb(dir, 'tokens', 'diff', '--against', 'nope-ref');
  assert.equal(none.code, 1);
  // Pure diff of two snippets.
  const d = cssDiff(':root, [data-theme="light"] {\n  --a: 1;\n  --b: 2;\n}\n', ':root, [data-theme="light"] {\n  --a: 1;\n  --b: 3;\n  --c: 4;\n}\n');
  assert.deepEqual(d.light, { added: [{ name: '--c', after: '4' }], removed: [], changed: [{ name: '--b', before: '2', after: '3' }] });
  assert.ok(parseCssVars('[data-theme="dark"] {\n  --x: 1;\n}\n').dark?.has('--x'));
  await rm(dir, { recursive: true });
});

test('K8 impact names aliases, links, contracts, contrast pairs and files', async () => {
  const dir = await fixture(PARTS);
  const p = (await sb<Impact>(dir, 'tokens', 'impact', 'color.primary')).json.data;
  assert.equal(p.layer, 'semantic');
  assert.ok(p.links.length && p.contracts.some((c) => c.name === 'button') && p.contrast.length);
  assert.ok(p.interface?.usedBy.includes('brand-links'));
  const v = (await sb<Impact>(dir, 'tokens', 'impact', '--sb-color-border')).json.data;
  assert.equal(v.token, 'color.border');
  assert.ok(v.files.some((f) => f.category === 'patterns') && v.files.some((f) => f.category === 'specs') && v.files.some((f) => f.category === 'stories'));
  const f = (await sb<Impact>(dir, 'tokens', 'impact', 'color.neutral.900')).json.data;
  assert.equal(f.layer, 'foundation');
  assert.ok(f.aliasedBy.some((a) => a.path === 'color.primary'));
  assert.ok(f.contracts.length > 0);
  assert.equal((await sb(dir, 'tokens', 'impact', 'color.nope')).code, 1);
  await rm(dir, { recursive: true });
});

test('K9 + K10 + K11 add (per mode or mode-less, with a pair), refuse duplicates and used tokens, remove unused ones', async () => {
  const dir = await fixture(PARTS);
  const a = await sb(dir, 'tokens', 'add', 'color.highlight', '--light', '{color.neutral.100}', '--dark', '{color.neutral.800}', '--pair', 'color.foreground:color.highlight', '--kind', 'ui', '--no-record');
  ok(a, 'add color');
  assert.equal((await readJson<{ color: { highlight: DtcgTokenNode } }>(dir, 'spec/tokens/semantic/light.tokens.json')).color.highlight.$value, '{color.neutral.100}');
  assert.equal((await readJson<{ color: { highlight: DtcgTokenNode } }>(dir, 'spec/tokens/semantic/dark.tokens.json')).color.highlight.$value, '{color.neutral.800}');
  assert.ok((await readJson<{ pairs: ContrastPair[] }>(dir, 'spec/tokens/contrast.json')).pairs.some((p) => p.bg === 'color.highlight' && p.kind === 'ui'));
  ok(await sb(dir, 'tokens', 'add', 'space.probe', '--value', '{space.4}', '--no-record'), 'add base');
  assert.equal((await readJson<{ space: { probe: DtcgTokenNode } }>(dir, 'spec/tokens/semantic/base.tokens.json')).space.probe.$value, '{space.4}');
  const dup = await sb(dir, 'tokens', 'add', 'color.primary', '--light', '#000000', '--dark', '#000000');
  assert.equal(dup.code, 1);
  const before = await readFile(join(dir, 'spec/tokens/semantic/light.tokens.json'), 'utf8');
  const used = await sb(dir, 'tokens', 'remove', 'color.primary');
  assert.equal(used.code, 1);
  assert.match(must(used.json.errors[0], 'the refusal').msg, /still used: .*contract button/);
  assert.equal(await readFile(join(dir, 'spec/tokens/semantic/light.tokens.json'), 'utf8'), before);
  ok(await sb(dir, 'tokens', 'remove', 'space.probe', '--no-record'), 'remove unused');
  assert.equal((await readJson<{ space: { probe?: DtcgTokenNode } }>(dir, 'spec/tokens/semantic/base.tokens.json')).space.probe, undefined);
  const report = await runChecks(dir);
  assert.deepEqual(failing(report), [], errorsOf(report));
  await rm(dir, { recursive: true });
});

test('K12 rename end to end: no broken variable left, every check passes', async () => {
  const dir = await fixture(PARTS);
  const r = await sb<{ files: string[] }>(dir, 'tokens', 'rename', 'color.muted', 'color.subtle', '--no-record');
  ok(r, 'rename');
  const files = r.json.data.files;
  for (const kind of ['spec/tokens/semantic/', 'spec/components/', 'spec/tokens/contrast.json', 'playwright/', 'src/patterns/', 'src/stories/']) assert.ok(files.some((f) => f.startsWith(kind)), `rewrote ${kind}`);
  const grep = spawnSync('grep', ['-rnE', '--sb-color-muted([^-a-z0-9_]|$)|"\\{color\\.muted\\}"|"color\\.muted"', 'spec', 'src', 'playwright', '.storybook'], { cwd: dir, encoding: 'utf8' });
  assert.equal(grep.stdout.split('\n').filter((l) => l && !l.includes('spec/decisions/')).join('\n'), '');
  const layout = await readFile(join(dir, 'src/patterns/sign-in/pattern.json'), 'utf8');
  assert.ok(layout.includes('"color.subtle"') && !layout.includes('"color.muted"'), 'a pattern layout names the renamed token');
  assert.ok((await readJson<InterfaceDoc>(dir, INTERFACE_FILE)).tokens['color.subtle']);
  assert.equal((await readJson<InterfaceDoc>(dir, INTERFACE_FILE)).tokens['color.muted'], undefined);
  const report = await runChecks(dir);
  assert.deepEqual(failing(report), [], errorsOf(report));
  assert.equal((await sb(dir, 'tokens', 'rename', 'color.subtle', 'color.background')).code, 1, 'refuses an existing name');
  // A2: the rename is logged for catalog installs.
  const log = await readJson<{ $description: string; renames: { from: string; to: string; date: string }[] }>(dir, 'spec/tokens/renames.json');
  assert.match(log.$description, /Catalog installs apply them/);
  assert.equal(log.renames.length, 1);
  assert.deepEqual({ ...log.renames[0], date: 'x' }, { from: 'color.muted', to: 'color.subtle', date: 'x' });
  assert.match(must(log.renames[0], 'the logged rename').date, /^\d{4}-\d{2}-\d{2}$/);
  await rm(dir, { recursive: true });
});

test('K12b rename and add refuse a name whose CSS variable another token already builds, or one the generator can make', async () => {
  const dir = await fixture(PARTS);
  const before = await snapshot(dir);
  // font.line-height.heading.1 would be --sb-font-line-height-heading-1, which font.line-height.heading-1 builds.
  const r = await sb(dir, 'tokens', 'rename', 'color.muted', 'font.line-height.heading.1');
  assert.equal(r.code, 1);
  assert.match(must(r.json.errors[0], 'the refusal').msg, /--sb-font-line-height-heading-1/);
  const a = await sb(dir, 'tokens', 'add', 'font.line-height.heading.1', '--value', '1.1');
  assert.equal(a.code, 1);
  assert.match(must(a.json.errors[0], 'the refusal').msg, /CSS variable of font\.line-height\.heading-1/);
  // A3: paths the generator can make, whatever brand.config says now (primary is neutral, so color.brand.* is absent).
  for (const args of [['rename', 'color.primary', 'color.brand'], ['rename', 'color.muted', 'color.green.450'], ['add', 'color.brand.tint', '--light', '#000000', '--dark', '#000000'], ['add', 'space.32', '--value', '128px']]) {
    const x = await sb(dir, 'tokens', ...args);
    assert.equal(x.code, 1, args.join(' '));
    assert.match(must(x.json.errors[0], 'the refusal').msg, /reserved/, args.join(' '));
  }
  assert.deepEqual(await snapshot(dir), before);
  await rm(dir, { recursive: true });
});

test('a naming preset writes only an editable list, which the CLI can preview and apply together', async (t) => {
  const dir = await fixture(PARTS);
  t.after(() => rm(dir, { recursive: true, force: true }));
  const file = 'token-renames.json';
  const make = ['tokens', 'rename-plan', '--preset', 'on-role-colors', '--out', file];
  const before = await snapshot(dir);
  const list = await sb<{ presets: { id: string }[] }>(dir, 'tokens', 'rename-plan');
  assert.deepEqual(list.json.data.presets.map(({ id }) => id), ['on-role-colors']);
  ok(await sb(dir, ...make, '--dry-run'), 'preview list write');
  await assert.rejects(readFile(join(dir, file)), { code: 'ENOENT' });
  ok(await sb(dir, ...make), 'write proposal');
  const raw = await readFile(join(dir, file), 'utf8');
  const proposal = parseJson<{ renames: { from: string; to: string }[] }>(raw);
  assert.deepEqual(proposal.renames.find(({ from }) => from === 'color.primary-foreground'), { from: 'color.primary-foreground', to: 'color.on-primary' });
  assert.ok(!proposal.renames.some(({ from }) => from === 'color.foreground'));
  const overwrite = await sb(dir, ...make);
  assert.equal(overwrite.code, 1);
  assert.match(overwrite.json.errors[0]?.msg ?? '', /already exists/);
  assert.equal(await readFile(join(dir, file), 'utf8'), raw);

  const args = ['tokens', 'rename', '--map', file];
  const preview = await sb<{ tokens: Record<string, string>; files: string[]; diff: CssDiff }>(dir, ...args, '--dry-run');
  ok(preview, 'preview batch');
  assert.match(preview.json.next ?? '', /npx sketchbook tokens rename --map token-renames\.json/);
  assert.ok(preview.json.data.files.includes('spec/components/button/contract.json'));
  assert.ok(preview.json.data.diff.light?.added.some(({ name }) => name === '--sb-color-on-primary'));
  assert.deepEqual(await snapshot(dir), before);
  const applied = await sb<{ decision: string }>(dir, ...args);
  ok(applied, 'apply batch');
  assert.match(applied.json.data.decision, /^SB-\d+$/);
  assert.ok(applied.json.changed.includes('spec/tokens/contrast.json'));
  assert.equal(await readFile(join(dir, file), 'utf8'), raw);
  const log = await readJson<{ renames: { from: string; to: string; date: string }[] }>(dir, 'spec/tokens/renames.json');
  assert.deepEqual(log.renames.map(({ from, to }) => ({ from, to })), proposal.renames);
  assert.deepEqual(failing(await runChecks(dir)), []);
  const alreadyRenamed = await sb(dir, ...make.slice(0, -1), 'repeat.json');
  assert.equal(alreadyRenamed.code, 0);
  assert.deepEqual(alreadyRenamed.json.changed, []);
});

test('a hand-written rename list rejects bad entries and failed checks without applying any rename', async (t) => {
  const dir = await fixture(PARTS);
  t.after(() => rm(dir, { recursive: true, force: true }));
  const file = 'rename list.json';
  const args = ['tokens', 'rename', '--map', file];
  const good = { from: 'color.primary-foreground', to: 'color.on-primary' };
  const other = { from: 'color.secondary-foreground', to: 'color.on-secondary' };
  const before = await snapshot(dir);
  const cases: [string, RegExp][] = [
    ['{', /not valid JSON/],
    [JSON.stringify({ renames: [good, { from: 'color.missing', to: 'color.new' }] }), /not a semantic token/],
    [JSON.stringify({ renames: [good, { ...other, to: good.to }] }), /destination for more than one/],
    [JSON.stringify({ renames: [good, { ...other, to: 'color.on.primary' }] }), /both use --sb-color-on-primary/],
    [JSON.stringify({ renames: [good, { ...other, to: good.from }] }), /already exists/],
    [JSON.stringify({ renames: [good, { ...good, to: 'color.other' }] }), /listed more than once/],
  ];
  for (const [text, expected] of cases) {
    await writeFile(join(dir, file), text);
    const r = await sb(dir, ...args);
    assert.equal(r.code, 1);
    assert.match(r.json.errors[0]?.msg ?? '', expected);
    assert.deepEqual(r.json.changed, []);
  }
  assert.deepEqual(await snapshot(dir), before);
  await writeFile(join(dir, file), JSON.stringify({ renames: [good, other] }));
  const preview = await sb(dir, ...args, '--dry-run');
  ok(preview, 'preview manual list');
  assert.match(preview.json.next ?? '', /--map 'rename list\.json'/);

  await edit<{ pairs: ContrastPair[] }>(dir, 'spec/tokens/contrast.json', (doc) => {
    doc.pairs.push({ fg: 'color.background', bg: 'color.background', kind: 'text' });
  });
  const badBaseline = await snapshot(dir);
  const refused = await sb(dir, ...args);
  assert.equal(refused.code, 1);
  assert.deepEqual(refused.json.changed, []);
  assert.deepEqual(await snapshot(dir), badBaseline);
});

test('bulk rename plans from the snapshot and preserves an edit made just before staging', async (t) => {
  const { stageHooks } = await import('../commands/tokens.mjs');
  const dir = await fixture(PARTS);
  t.after(() => rm(dir, { recursive: true, force: true }));
  const file = 'spec/tokens/semantic/light.tokens.json';
  const teamEdit = 'Team copy saved just before the snapshot.';
  await writeFile(join(dir, 'rename.json'), JSON.stringify({ renames: [{ from: 'color.primary-foreground', to: 'color.on-primary' }] }));
  stageHooks.beforeStage = async () => {
    await edit<{ color: Record<string, DtcgTokenNode> }>(dir, file, (doc) => {
      must(doc.color['primary-foreground'], 'original foreground').$description = teamEdit;
    });
  };
  try {
    ok(await sb(dir, 'tokens', 'rename', '--map', 'rename.json', '--no-record'), 'apply after editor save');
    const light = await readJson<{ color: Record<string, DtcgTokenNode> }>(dir, file);
    assert.equal(light.color['on-primary']?.$description, teamEdit);
    assert.equal(light.color['primary-foreground'], undefined);
  } finally {
    stageHooks.beforeStage = null;
  }
});

test('bulk rename previews the decision log and refuses the whole apply if it cannot record the decision', async (t) => {
  const dir = await fixture(PARTS);
  t.after(() => rm(dir, { recursive: true, force: true }));
  const log = 'spec/decisions/DECISIONS.md';
  await writeFile(join(dir, 'rename.json'), JSON.stringify({ renames: [{ from: 'color.primary-foreground', to: 'color.on-primary' }] }));
  const args = ['tokens', 'rename', '--map', 'rename.json'];
  const before = await snapshot(dir);
  const preview = await sb(dir, ...args, '--dry-run');
  ok(preview, 'preview with a decision record');
  assert.ok(preview.json.changed.includes(log));
  assert.deepEqual(await snapshot(dir), before);

  await rm(join(dir, log));
  const missingLog = await snapshot(dir);
  for (const flags of [['--dry-run'], []]) {
    const refused = await sb(dir, ...args, ...flags);
    assert.equal(refused.code, 1);
    assert.deepEqual(refused.json.changed, []);
    assert.equal(refused.json.errors[0]?.file, log);
    assert.match(refused.json.errors[0]?.fix ?? '', /--no-record/);
    assert.deepEqual(await snapshot(dir), missingLog);
  }
  const skip = await sb(dir, ...args, '--no-record', '--dry-run');
  ok(skip, 'preview without a decision record');
  assert.ok(!skip.json.changed.includes(log));
  assert.deepEqual(await snapshot(dir), missingLog);

  await writeFile(join(dir, log), '# Decisions\n');
  const malformed = await snapshot(dir);
  const refused = await sb(dir, ...args);
  assert.equal(refused.code, 1);
  assert.match(refused.json.errors[0]?.msg ?? '', /needs an index and an entry separator/);
  assert.deepEqual(await snapshot(dir), malformed);
});

test('a decision log edited after staging blocks the whole rename and keeps the edit', async (t) => {
  const { stageHooks } = await import('../commands/tokens.mjs');
  const dir = await fixture(PARTS);
  t.after(() => rm(dir, { recursive: true, force: true }));
  const log = 'spec/decisions/DECISIONS.md';
  const before = await snapshot(dir);
  const teamEdit = (await readFile(join(dir, log), 'utf8')) + '\n<!-- Team copy saved during preview. -->\n';
  stageHooks.beforeCopyBack = async () => { await writeFile(join(dir, log), teamEdit); };
  try {
    const r = await sb<{ conflict: string[] }>(dir, 'tokens', 'rename', 'color.primary-foreground', 'color.on-primary');
    assert.equal(r.code, 1);
    assert.deepEqual(r.json.changed, []);
    assert.deepEqual(r.json.data.conflict, [log]);
    assert.deepEqual(await snapshot(dir), { ...before, [log]: teamEdit });
  } finally {
    stageHooks.beforeCopyBack = null;
  }
});

test('K13 import: Tokens Studio DTCG and a shadcn-style CSS theme become proposals', async () => {
  const dir = await fixture(PARTS);
  const core = ['color.background', 'color.foreground', 'color.primary', 'color.destructive', 'color.border', 'color.ring'];
  const run = async (file: string, from: string, name: string) => {
    const r = await sb(dir, 'tokens', 'import', file, '--from', from, '--name', name);
    ok(r, name);
    const p = await readJson<ImportProposal>(dir, `generated/import/${name}.proposal.json`);
    for (const k of ['source', 'tokens', 'mapping', 'unmapped']) assert.ok(k in p, `${name} lacks ${k}`);
    for (const m of p.mapping) for (const k of ['from', 'to', 'confidence', 'reason']) assert.ok(k in m, `${name} mapping lacks ${k}`);
    return p;
  };
  const ts = await run(join(FIX, 'tokens-studio.json'), 'dtcg', 'studio');
  for (const t of core) assert.ok(ts.mapping.some((m) => m.to === t), `studio maps ${t}`);
  const to = (p: ImportProposal, t: string) => must(p.mapping.find((m) => m.to === t), `a mapping to ${t}`);
  assert.equal(to(ts, 'color.primary').from, 'brand');
  assert.equal(to(ts, 'color.primary-foreground').from, 'on-brand');
  assert.equal(to(ts, 'foundation:color.primary').value, '#14857A');
  assert.deepEqual(to(ts, 'foundation:spacing').value, { preset: 'grid-8' });
  assert.equal(to(ts, 'foundation:typography.family').value, 'Source Sans 3');
  assert.ok(ts.tokens.some((t) => t.mode === 'dark' && t.path === 'brand' && t.resolved === '#80CBC4'));

  const css = await run(join(FIX, 'shadcn-theme.css'), 'css', 'shadcn');
  for (const t of core) assert.ok(css.mapping.some((m) => m.to === t), `css maps ${t}`);
  assert.deepEqual(to(css, 'foundation:radius').value, { custom: { base: 8 } });
  assert.equal(to(css, 'foundation:typography.family').value, 'Figtree');
  assert.deepEqual(css.unmapped.map((u) => u.path).sort(), ['chart-1']);
  // Heuristic building blocks.
  assert.equal(toHex('oklch(1 0 0)'), '#FFFFFF');
  assert.equal(toHex('222 47% 11%'), toHex('hsl(222, 47%, 11%)'));
  assert.equal(toHex('#fff'), '#FFFFFF');
  assert.deepEqual([...roleSet('on-danger')].sort(), ['destructive', 'foreground']);
  assert.deepEqual([...roleSet('bg.subtle')], ['muted']);
  await rm(dir, { recursive: true });
});

test('K14 import apply writes brand.config and semantic values, keeps every interface token, runs checks', async () => {
  const dir = await fixture(PARTS);
  ok(await sb(dir, 'tokens', 'import', join(FIX, 'shadcn-theme.css'), '--from', 'css', '--name', 'shadcn'), 'import');
  const iface = Object.keys((await readJson<InterfaceDoc>(dir, INTERFACE_FILE)).tokens);
  const r = await sb(dir, 'tokens', 'import', 'apply', 'generated/import/shadcn.proposal.json', '--no-record');
  ok(r, 'apply');
  const brand = await readJson<{ color: { primary: string }; typography: { family: string }; radius: unknown }>(dir, 'brand.config.json');
  assert.equal(brand.color.primary, '#006262');
  assert.equal(brand.typography.family, 'Figtree');
  assert.deepEqual(brand.radius, { custom: { base: 8 } });
  assert.equal((await readJson<{ color: { background: DtcgTokenNode } }>(dir, 'spec/tokens/semantic/light.tokens.json')).color.background.$value, '#FAFCFE');
  assert.ok(r.json.warnings.some((w) => typeof w === 'string' && /color\.primary follows brand\.config/.test(w)));
  const after = (await readJson<InterfaceDoc>(dir, INTERFACE_FILE)).tokens;
  for (const t of iface) assert.ok(after[t], `interface token ${t} kept`);
  const report = await runChecks(dir);
  assert.deepEqual(failing(report), [], errorsOf(report));
  const only = await sb(dir, 'tokens', 'import', 'apply', 'generated/import/shadcn.proposal.json', '--only', 'nope');
  assert.equal(only.code, 1);
  await rm(dir, { recursive: true });
});

test('K15 scratch writes a minimal brand.config from answers and keeps the semantic interface', async () => {
  const dir = await fixture(PARTS);
  const iface = await readFile(join(dir, INTERFACE_FILE), 'utf8');
  await writeFile(join(dir, 'answers.json'), JSON.stringify({ name: 'acme', primary: '#7C3AED', spacing: 'grid-8', radius: 'round', scale: 'major-third' }));
  ok(await sb(dir, 'tokens', 'scratch', '--answers', 'answers.json', '--no-record'), 'scratch');
  const brand = await readJson<{ name: string; spacing: unknown; density?: unknown }>(dir, 'brand.config.json');
  assert.equal(brand.name, 'acme');
  assert.deepEqual(brand.spacing, { preset: 'grid-8' });
  assert.equal(brand.density, undefined, 'unanswered foundations stay out');
  assert.equal(await readFile(join(dir, INTERFACE_FILE), 'utf8'), iface);
  const report = await runChecks(dir);
  assert.deepEqual(failing(report), [], errorsOf(report));
  await writeFile(join(dir, 'answers.json'), JSON.stringify({ colour: 'red' }));
  assert.equal((await sb(dir, 'tokens', 'scratch', '--answers', 'answers.json')).code, 1);
  await rm(dir, { recursive: true });
});

test('K16 overrides list, reset one, reset all (needs --yes)', async () => {
  const dir = await fixture(PARTS);
  const { runGenerator } = await import('../generators/foundation.mjs');
  await edit<{ radius: { md: DtcgTokenNode; huge?: DtcgTokenNode } }>(dir, 'spec/tokens/foundation/radius.tokens.json', (j) => { j.radius.md.$value = '7px'; j.radius.huge = { $value: '40px' }; });
  await runGenerator(dir, { quiet: true });
  const l = await sb<{ overrides: { token: string }[] }>(dir, 'tokens', 'overrides', 'list');
  envelope(l.json);
  assert.equal(l.code, 2);
  assert.deepEqual(l.json.data.overrides.map((o) => o.token).sort(), ['radius.huge', 'radius.md']);
  ok(await sb(dir, 'tokens', 'overrides', 'reset', 'radius.md'), 'reset one');
  assert.notEqual((await readJson<{ radius: { md: DtcgTokenNode } }>(dir, 'spec/tokens/foundation/radius.tokens.json')).radius.md.$value, '7px');
  assert.equal((await sb(dir, 'tokens', 'overrides', 'reset', '--all')).code, 1, 'reset --all asks for --yes');
  ok(await sb(dir, 'tokens', 'overrides', 'reset', '--all', '--yes'), 'reset all');
  assert.equal((await readJson<{ radius: { huge?: DtcgTokenNode } }>(dir, 'spec/tokens/foundation/radius.tokens.json')).radius.huge, undefined);
  assert.equal((await sb(dir, 'tokens', 'overrides', 'list')).code, 0);
  await rm(dir, { recursive: true });
});

test('K17 spec/tokens/interface.json equals a fresh computation and covers every kind of user', async () => {
  const REF = await reference();
  const { text, doc } = await buildInterface(REF, { write: false });
  assert.equal(await readFile(join(REF, INTERFACE_FILE), 'utf8'), text);
  const sources = new Set(Object.values(doc.tokens).flatMap((t) => t.usedBy.map((u) => u.split(':')[0])));
  for (const s of ['contract', 'brand-links', 'contrast', 'stories', 'specs', '.storybook', 'patterns']) assert.ok(sources.has(s), `interface has users of kind ${s}`);
  assert.equal(doc.tokens['color.primary']?.in, 'modes');
  assert.equal(doc.tokens['font.size.body']?.in, 'base');
});

test('K18 every implemented preset of every family applies through tokens preset with the token checks clean', async () => {
  const { planPreset, runPlan } = await import('../commands/tokens.mjs');
  const { families, presetsOf, FAMILY_KEYS } = await import('../standards/resolve.mjs');
  const { TOKEN_CHECKS } = await import('../cli/commands/tokens.mjs');
  const dir = await fixture(PARTS);
  const original = await readFile(join(dir, 'brand.config.json'), 'utf8');
  // The CLI's own help example.
  ok(await sb(dir, 'tokens', 'preset', 'motion', 'material-like', '--dry-run'), 'preset motion material-like --dry-run');
  const refused: string[] = [];
  for (const fam of families()) {
    // semanticRoles is the color roles catalog: every role is always present, chosen through color.roles.
    if (!FAMILY_KEYS[fam]) { assert.equal(fam, 'semanticRoles', `${fam} has no brand.config key`); continue; }
    for (const p of presetsOf(fam)) {
      if (p.implemented === false) continue;
      await writeFile(join(dir, 'brand.config.json'), original);
      let plan: Awaited<ReturnType<typeof planPreset>>;
      try { plan = await planPreset(dir, fam, p.id); } catch (e) { refused.push(`${fam}/${p.id}: ${errorMessage(e)}`); continue; }
      const r = await runPlan(dir, plan);
      assert.deepEqual(r.linkWarnings, [], `${fam}/${p.id} links`);
      const report = await runChecks(dir, { only: TOKEN_CHECKS });
      assert.deepEqual(failing(report), [], `${fam}/${p.id}: ${errorsOf(report)}`);
      if (fam === 'motion' || fam === 'zIndex') {
        const base = await readJson<{ motion: { duration: { normal: DtcgTokenNode }; easing: { enter: DtcgTokenNode } }; layer: { modal: DtcgTokenNode } }>(dir, 'spec/tokens/semantic/base.tokens.json');
        const roles = p.values.roles;
        assert.ok(isStringMap(roles), `${fam}/${p.id} has roles`);
        if (fam === 'motion') {
          assert.equal(base.motion.duration.normal.$value, `{duration.${roles['duration.normal']}}`, `${p.id} duration.normal follows its role`);
          assert.equal(base.motion.easing.enter.$value, `{easing.${roles['easing.enter']}}`, `${p.id} easing.enter follows its role`);
        } else assert.equal(base.layer.modal.$value, `{z.${roles.modal}}`, `${p.id} layer.modal follows its role`);
      }
    }
  }
  assert.deepEqual(refused, []);
  await rm(dir, { recursive: true });
});

test('K19 set parses a flat JSON object as an object and keeps {dot.path} as a token alias', async () => {
  const { parseValue } = await import('../commands/tokens.mjs');
  assert.deepEqual(parseValue('{"hue":250,"chroma":0.02}'), { hue: 250, chroma: 0.02 });
  assert.deepEqual(parseValue('{ "hue": 250 }'), { hue: 250 });
  assert.deepEqual(parseValue('[4, 8, 12]'), [4, 8, 12]);
  assert.equal(parseValue('{color.neutral.100}'), '{color.neutral.100}');
  assert.equal(parseValue('{space.1-5}'), '{space.1-5}');
  assert.throws(() => parseValue('{"hue":}'), /not valid JSON/);
  const dir = await fixture(['spec', 'brand.config.json', 'harness.config.json', 'generated']);
  const r = await sb<{ after: unknown }>(dir, 'tokens', 'set', 'color.neutral', '{"hue":250,"chroma":0.02}', '--no-record', '--dry-run');
  ok(r, 'set color.neutral object');
  assert.deepEqual(r.json.data.after, { hue: 250, chroma: 0.02 });
  await rm(dir, { recursive: true });
});

test('K20 a dry run runs the token checks: a change the real run would refuse is ok:false, and a refused real run writes nothing', async () => {
  const dir = await fixture(PARTS);
  const git = (...a: string[]) => spawnSync('git', ['-C', dir, ...a], { encoding: 'utf8' });
  git('init', '-q'); git('add', '-A'); git('-c', 'user.name=t', '-c', 'user.email=t@example.com', 'commit', '-qm', 'base');
  const decisions = await readFile(join(dir, 'spec/decisions/DECISIONS.md'), 'utf8');
  // A pair below the contrast target passes planning but fails T6.
  const bad = ['add', 'color.highlight', '--light', '{color.neutral.100}', '--dark', '{color.neutral.800}', '--pair', 'color.highlight:color.background'];
  const dry = await sb(dir, 'tokens', ...bad, '--dry-run');
  assert.equal(dry.json.ok, false, 'the dry run predicts the refusal');
  assert.equal(dry.code, 1);
  assert.ok(dry.json.errors.some((e) => e.check === 'T6' && /color\.highlight on color\.background/.test(e.token ?? '')), JSON.stringify(dry.json.errors).slice(0, 400));
  const real = await sb(dir, 'tokens', ...bad);
  assert.equal(real.code, 1);
  assert.deepEqual(real.json.changed, []);
  assert.equal(git('status', '--porcelain').stdout, '', 'a refused run leaves the tree clean');
  assert.equal(await readFile(join(dir, 'spec/decisions/DECISIONS.md'), 'utf8'), decisions, 'and proposes no record');
  // Refused before anything is staged: an unknown --type and an alias to no token, with the reason in the message.
  const t = await sb(dir, 'tokens', 'add', 'space.probe', '--value', '4px', '--type', 'size');
  assert.equal(t.code, 1);
  assert.match(must(t.json.errors[0], 'the refusal').msg, /--type size is not a token type/);
  const v = await sb(dir, 'tokens', 'add', 'space.probe', '--value', '#123456', '--type', 'dimension');
  assert.equal(v.code, 1);
  assert.match(must(v.json.errors[0], 'the refusal').msg, /not a valid dimension/);
  const u = await sb(dir, 'tokens', 'add', 'color.highlight', '--light', '{color.nope.1}', '--dark', '{color.nope.1}', '--type', 'color');
  assert.equal(u.code, 1);
  assert.match(must(u.json.errors[0], 'the refusal').msg, /names no token \(unresolved reference\)/);
  assert.equal(git('status', '--porcelain').stdout, '');
  await rm(dir, { recursive: true });
});

test('K21 a hand-edited brand-linked token is not reverted silently: refused without --yes; links and overrides are always reported', async () => {
  const dir = await fixture(PARTS);
  await edit<{ color: { primary: DtcgTokenNode } }>(dir, 'spec/tokens/semantic/light.tokens.json', (j) => { j.color.primary.$value = '{color.neutral.700}'; });
  const before = await snapshot(dir);
  const r = await sb(dir, 'tokens', 'add', 'space.probe', '--value', '{space.4}', '--no-record');
  assert.equal(r.code, 1);
  const refusal = must(r.json.errors[0], 'the refusal');
  assert.match(refusal.msg, /light: color\.primary -> \{color\.neutral\.900\}/);
  assert.match(must(refusal.fix, 'its fix'), /delete that token's entry in spec\/tokens\/brand-links\.json.*--yes/);
  assert.deepEqual(await snapshot(dir), before, 'nothing written');
  const y = await sb<{ links: { changed: string[] }; overrides: Record<string, unknown> }>(dir, 'tokens', 'add', 'space.probe', '--value', '{space.4}', '--no-record', '--yes');
  ok(y, 'with --yes the link wins');
  assert.ok(y.json.data.links.changed.some((c) => /light: color\.primary -> \{color\.neutral\.900\}/.test(c)));
  for (const k of ['kept', 'added', 'dropped']) assert.ok(Array.isArray(y.json.data.overrides[k]), `overrides.${k} reported`);
  assert.equal((await readJson<{ color: { primary: DtcgTokenNode } }>(dir, 'spec/tokens/semantic/light.tokens.json')).color.primary.$value, '{color.neutral.900}');
  await rm(dir, { recursive: true });
});

test('K22 a no-op run changes nothing, lists nothing and proposes no record; changed lists exact files', async () => {
  const dir = await fixture(PARTS);
  const count = async () => ((await readFile(join(dir, 'spec/decisions/DECISIONS.md'), 'utf8')).match(/^### SB-/gm) ?? []).length;
  const n0 = await count();
  const a = await sb(dir, 'tokens', 'set', 'typography.family', 'Inter');
  ok(a, 'first');
  for (const f of ['brand.config.json', 'spec/tokens/foundation/typography.tokens.json', 'generated/css/tokens.css', 'generated/foundation.snapshot.json', 'spec/decisions/DECISIONS.md']) assert.ok(a.json.changed.includes(f), `changed lists ${f}: ${a.json.changed.join(',')}`);
  assert.ok(!a.json.changed.some((f) => f.includes('*')), 'no globs');
  assert.ok(!a.json.changed.includes('spec/tokens/foundation/color.tokens.json'), 'only files whose content changed');
  assert.equal(await count(), n0 + 1);
  const b = await sb<{ decision: string | null }>(dir, 'tokens', 'set', 'typography.family', 'Inter');
  ok(b, 'again');
  assert.deepEqual(b.json.changed, []);
  assert.equal(b.json.data.decision, null);
  assert.equal(await count(), n0 + 1, 'no record for a no-op');
  await rm(dir, { recursive: true });
});

test('K23 keys and token paths cannot reach Object.prototype', async () => {
  const dir = await fixture(['spec', 'brand.config.json', 'harness.config.json', 'generated']);
  const before = await snapshot(dir, ['spec']);
  for (const args of [['set', '__proto__.polluted', '1'], ['set', 'color.constructor.x', '1'], ['set', 'typography.prototype', '1'], ['add', 'color.constructor', '--value', '#000000'], ['remove', 'color.__proto__'], ['rename', 'constructor.x', 'color.x']]) {
    const r = await sb(dir, 'tokens', ...args);
    assert.equal(r.code, 1, args.join(' '));
  }
  assert.equal(({} as { polluted?: unknown }).polluted, undefined);
  assert.deepEqual(await snapshot(dir, ['spec']), before);
  const { safeParts } = await import('../commands/tokens.mjs');
  assert.throws(() => safeParts('a.__proto__.b'), /not allowed/);
  assert.deepEqual(safeParts('color.primary'), ['color', 'primary']);
  await rm(dir, { recursive: true });
});

test('K25 tokens import reads the format from the file (.css/.scss -> css, .json or a folder -> dtcg); anything else still needs --from', async () => {
  const dir = await fixture();
  ok(await sb(dir, 'tokens', 'import', join(FIX, 'shadcn-theme.css'), '--name', 'a'), 'css by extension');
  ok(await sb(dir, 'tokens', 'import', join(FIX, 'tokens-studio.json'), '--name', 'b'), 'dtcg by extension');
  await writeFile(join(dir, 'tokens.txt'), '--x: 1;\n');
  const r = await sb(dir, 'tokens', 'import', 'tokens.txt');
  assert.equal(r.code, 1);
  assert.match(must(r.json.errors[0], 'the refusal').msg, /--from/);
  await rm(dir, { recursive: true });
});

test('K24 files saved while a token command runs are never reverted or deleted; a conflicting target refuses the command; a failed copy-back restores every file', async () => {
  const { stageHooks } = await import('../commands/tokens.mjs');
  const dir = await fixture(PARTS);
  const git = (...a: string[]) => spawnSync('git', ['-C', dir, ...a], { encoding: 'utf8' });
  git('init', '-q'); git('add', '-A'); git('-c', 'user.name=t', '-c', 'user.email=t@example.com', 'commit', '-qm', 'base');
  const add = (name: string) => sb<{ conflict: string[] }>(dir, 'tokens', 'add', name, '--value', '{color.neutral.500}', '--type', 'color', '--no-record');
  const badge = join(dir, 'src/components/badge/Badge.ts');
  try {
    // 1. Unrelated files saved or created mid-run (editor autosave, another agent) survive; the command applies.
    stageHooks.beforeCopyBack = async () => {
      await writeFile(join(dir, 'docs/team-notes.md'), 'x\n');
      await writeFile(badge, (await readFile(badge, 'utf8')) + '// team edit\n');
    };
    ok(await add('color.zzz'), 'add with unrelated edits mid-run');
    assert.equal(await readFile(join(dir, 'docs/team-notes.md'), 'utf8'), 'x\n', 'a file created mid-run is not deleted');
    assert.match(await readFile(badge, 'utf8'), /\/\/ team edit\n$/, 'an edit saved mid-run is not reverted');
    git('add', '-A'); git('-c', 'user.name=t', '-c', 'user.email=t@example.com', 'commit', '-qm', 'zzz');
    // 2. A file the command would write was changed mid-run: refused, nothing written, the edit kept.
    const css = join(dir, 'generated/css/tokens.css');
    stageHooks.beforeCopyBack = async () => { await writeFile(css, (await readFile(css, 'utf8')) + '/* mid-run */\n'); };
    const r = await add('color.yyy');
    assert.equal(r.code, 1);
    assert.deepEqual(r.json.changed, []);
    assert.ok(r.json.data.conflict.includes('generated/css/tokens.css'), JSON.stringify(r.json.data.conflict));
    assert.match(must(r.json.errors[0], 'the refusal').msg, /changed in the project while the command ran/);
    assert.equal(git('status', '--porcelain').stdout.trim(), 'M generated/css/tokens.css', 'only the mid-run edit is in the tree');
    assert.match(await readFile(css, 'utf8'), /\/\* mid-run \*\/\n$/);
    git('checkout', '--', '.');
    // 3. A copy-back that fails halfway restores every file it had written.
    const last = join(dir, 'spec/tokens/semantic/base.tokens.json');
    stageHooks.beforeCopyBack = async () => { await chmod(last, 0o444); };
    const f = await add('color.xxx');
    await chmod(last, 0o644);
    assert.equal(f.code, 1, JSON.stringify(f.json).slice(0, 400));
    assert.equal(git('status', '--porcelain').stdout, '', 'rolled back');
  } finally { stageHooks.beforeCopyBack = null; }
  await rm(dir, { recursive: true });
});
