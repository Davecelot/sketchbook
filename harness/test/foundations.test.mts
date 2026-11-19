// Foundations engine: standards catalog, brand.config v2, semantic links, overrides lifecycle (cases F1–F13 in TEST.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fixture, readJson, writeJson, edit, failing, errorsOf, ROOT, must } from './helpers.mjs';
import { runChecks } from '../checks/run.mjs';
import { runGenerator, generate } from '../generators/foundation.mjs';
import { buildTokens } from '../build/index.mjs';
import { families, presetsOf, resolveBrand, FAMILY_KEYS } from '../standards/resolve.mjs';
import { listOverrides, resetOverride, resetAll } from '../generators/overrides.mjs';
import * as t1 from '../checks/t1-tokens-valid.mjs';
import { flatten } from '../lib/tokens.mjs';
import { parseJson } from '../lib/files.mjs';
import type { CheckContext } from '../checks/types.mjs';
import type { BrandConfig } from '../../generated/types/brand-config.js';

// A DTCG token as these tests read it; each read names the groups it walks.
interface Leaf { $value: unknown }
interface Radius { radius: { md: Leaf; huge?: Leaf } }
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
// T1 reads only all, brand and schemas.brand; the flattened tokens carry no mode, as in the untyped test.
const runT1 = (ctx: { all: { sets: { file: string; layer: string; tokens: object[] }[] }; brand: BrandConfig; schemas: { brand: object } }) => t1.run(ctx as CheckContext);

const DEFAULT = parseJson<BrandConfig>(await readFile(join(ROOT, 'harness/test/golden/brand.default.json'), 'utf8'));
const regenerate = async (dir: string) => { const r = await runGenerator(dir, { quiet: true }); await buildTokens({ root: dir }); return r; };
const setIn = <T extends object>(obj: T, path: string, value: unknown): T => { const ks = path.split('.'); let n: unknown = obj; for (const k of ks.slice(0, -1)) { if (!isRecord(n)) throw new TypeError(`setIn: ${path} crosses a non-object at ${k}`); n = n[k] ??= {}; } if (!isRecord(n)) throw new TypeError(`setIn: ${path} ends in a non-object`); n[must(ks.at(-1), path)] = value; return obj; };

test('F1 golden: the default config reproduces tokens.css byte for byte', async () => {
  const dir = await fixture(['spec', 'harness.config.json', 'generated']);
  await writeJson(dir, 'brand.config.json', DEFAULT);
  for (const p of ['spec/components', 'spec/tokens/semantic', 'spec/tokens/foundation', 'spec/tokens/brand-links.json', 'generated/foundation.snapshot.json']) await rm(join(dir, p), { recursive: true, force: true });
  await writeJson(dir, 'spec/tokens/overrides.json', { overrides: {} });
  await runGenerator(dir, { quiet: true });
  const { css } = await buildTokens({ root: dir });
  assert.equal(css, await readFile(join(ROOT, 'harness/test/golden/tokens.default.css'), 'utf8'));
  await rm(dir, { recursive: true });
});

test('F2 every preset of every family resolves and generates valid tokens', () => {
  const fams = families();
  assert.ok(fams.length >= 19, `families: ${fams.join(', ')}`);
  for (const family of fams) {
    const key = FAMILY_KEYS[family];
    for (const p of presetsOf(family)) {
      for (const k of ['id', 'label', 'values', 'description', 'source', 'verified']) assert.ok(k in p, `${family}/${p.id} lacks ${k}`);
      if (!key || p.implemented === false) continue;
      const brand = setIn(structuredClone(DEFAULT), key, { preset: p.id });
      const r = resolveBrand(brand);
      assert.ok(r, `${family}/${p.id}`);
      const { files } = generate(brand);
      const tokens = Object.entries(files).flatMap(([name, doc]) => flatten(doc).map((t) => ({ ...t, file: name, layer: 'foundation' })));
      const { errors } = runT1({ all: { sets: [{ file: 'x', layer: 'foundation', tokens }] }, brand, schemas: { brand: {} } });
      assert.deepEqual(errors, [], `${family}/${p.id}: ${JSON.stringify(errors?.slice(0, 2))}`);
    }
  }
});

// A catalogued ramp method the schema does not accept yet: F3 proves resolveBrand refuses it at run time.
const RADIX_RAMP: unknown = { method: 'radix-12', steps: [50, 500, 950] };

test('F3 unknown presets and catalogued-only ramp methods fail loudly', () => {
  assert.throws(() => resolveBrand({ ...DEFAULT, motion: { preset: 'nope' } }), /Unknown motion preset "nope".*Known: /);
  assert.throws(() => resolveBrand({ ...DEFAULT, color: { ...must(DEFAULT.color, 'color'), ramp: RADIX_RAMP as NonNullable<BrandConfig['color']>['ramp'] } }), /not implemented/);
});

test('F4 a v1 config and the same choices as presets resolve to the same values', () => {
  const v1 = resolveBrand(DEFAULT);
  const v2 = resolveBrand({ name: 'x', color: { primary: 'neutral', accents: { danger: '#E7000B' } }, spacing: { preset: 'grid-4' }, radius: { preset: 'soft' }, density: { preset: 'comfortable' }, typography: { family: 'ui-sans-serif', fallback: must(DEFAULT.typography, 'typography').fallback, scale: { preset: 'tailwind' }, letterSpacing: { preset: 'tailwind' } }, contrast: { preset: 'wcag-aa' } });
  for (const k of ['spacing', 'radius', 'density', 'typography', 'motion', 'elevation', 'z', 'icons'] as const) assert.deepEqual(v2[k], v1[k], k);
  assert.deepEqual(v2.contrast.targets, v1.contrast.targets);
  assert.deepEqual(v1.modes, [{ name: 'light', role: 'light' }, { name: 'dark', role: 'dark' }]);
});

test('F5 preset mix (8px grid, perfect fourth, material-like motion, compact, sharp, success and warning accents) passes every check', async () => {
  const dir = await fixture();
  await edit<BrandConfig>(dir, 'brand.config.json', (b) => {
    b.spacing = { preset: 'grid-8' };
    b.typography = { ...b.typography, scale: { preset: 'perfect-fourth' } };
    b.motion = { preset: 'material-like' };
    b.density = { preset: 'compact' };
    b.radius = { preset: 'sharp' };
    must(b.color, 'color').accents = { danger: '#E7000B', green: '#15803D', amber: '#F59E0B' };
    must(b.color, 'color').roles = { success: 'green', warning: 'amber' };
  });
  await regenerate(dir);
  const report = await runChecks(dir);
  assert.deepEqual(failing(report), [], errorsOf(report));
  const fdn = <T,>(f: string) => readJson<T>(dir, `spec/tokens/foundation/${f}.tokens.json`);
  assert.equal((await fdn<{ space: { 4: Leaf } }>('space')).space['4'].$value, '32px');
  assert.equal((await fdn<{ font: { size: { lg: Leaf } } }>('typography')).font.size.lg.$value, '22px');
  assert.equal((await fdn<{ radius: { lg: Leaf } }>('radius')).radius.lg.$value, '2px');
  assert.deepEqual((await fdn<{ easing: { 'emphasized-decelerate': Leaf } }>('motion')).easing['emphasized-decelerate'].$value, [0.05, 0.7, 0.1, 1]);
  assert.ok(Object.values((await fdn<{ color: { green: Record<string, Leaf> } }>('color')).color.green).some((t) => t.$value === '#15803D'));
  const base = await readJson<{ size: { control: Record<string, Leaf> }; motion: { easing: { enter: Leaf } } }>(dir, 'spec/tokens/semantic/base.tokens.json');
  assert.deepEqual(['sm', 'default', 'lg'].map((k) => base.size.control[k]?.$value), ['{size.28}', '{size.32}', '{size.36}']);
  assert.equal(base.motion.easing.enter.$value, '{easing.emphasized-decelerate}');
  const light = await readJson<{ color: { success: { $value: string }; warning: { $value: string } } }>(dir, 'spec/tokens/semantic/light.tokens.json');
  assert.match(light.color.success.$value, /^\{color\.green\.\d+\}$/);
  assert.match(light.color.warning.$value, /^\{color\.amber\.\d+\}$/);
  assert.deepEqual(report.results.find((r) => r.id === 'T6')?.errors, []);
  await rm(dir, { recursive: true });
});

test('F6 tokens:generate alone re-points the linked semantic tokens', async () => {
  const dir = await fixture();
  await edit<BrandConfig>(dir, 'brand.config.json', (b) => { must(b.color, 'color').primary = '#2563EB'; b.density = 'spacious'; });
  const r = await regenerate(dir);
  assert.ok(r.links.changed.some((c) => /light: color\.primary -> \{color\.brand\.500\}/.test(c)), r.links.changed.join('\n'));
  const base = await readJson<{ size: { control: { default: Leaf } } }>(dir, 'spec/tokens/semantic/base.tokens.json');
  assert.equal(base.size.control.default.$value, '{size.40}');
  assert.deepEqual(failing(await runChecks(dir)), []);
  await rm(dir, { recursive: true });
});

test('F7 a link to a missing semantic token or foundation target is reported', async () => {
  const dir = await fixture();
  await edit<{ links: Record<string, object> }>(dir, 'spec/tokens/brand-links.json', (l) => {
    l.links['color.nope'] = { from: 'color', role: 'primary', part: 'solid' };
    l.links['size.control.sm'] = { from: 'density', role: 'height.huge' };
  });
  const r = await regenerate(dir);
  const missing = r.links.missing.map((m) => m.msg).join('\n');
  assert.match(missing, /color\.nope/);
  assert.match(missing, /height\.huge/);
  const g1 = must((await runChecks(dir, { only: ['G1'] })).results[0], 'the G1 result');
  assert.match(g1.warnings.map((w) => w.msg).join('\n'), /color\.nope/);
  await rm(dir, { recursive: true });
});

test('F8 modes are defined by name and role', async () => {
  const dir = await fixture();
  await edit<BrandConfig>(dir, 'brand.config.json', (b) => { b.modes = ['light', { name: 'night', role: 'dark' }]; });
  await rm(join(dir, 'spec/tokens/semantic/dark.tokens.json'));
  await regenerate(dir);
  const night = await readJson<{ color: { destructive: Leaf } }>(dir, 'spec/tokens/semantic/night.tokens.json');
  const dark = parseJson<{ color: { destructive: Leaf } }>(await readFile(join(ROOT, 'harness/templates/semantic/dark.tokens.json'), 'utf8'));
  assert.equal(night.color.destructive.$value, dark.color.destructive.$value);
  assert.match(await readFile(join(dir, 'generated/css/tokens.css'), 'utf8'), /prefers-color-scheme: dark\) \{\n {2}:root:not\(\[data-theme\]\)/);
  assert.deepEqual(failing(await runChecks(dir)), []);
  await rm(dir, { recursive: true });
});

test('F9 + F12 a hand-added foundation token is kept, recorded and reported', async () => {
  const dir = await fixture();
  await edit<Radius>(dir, 'spec/tokens/foundation/radius.tokens.json', (j) => { j.radius.huge = { $value: '40px' }; j.radius.md.$value = '7px'; });
  const r = await regenerate(dir);
  assert.equal(must((await readJson<Radius>(dir, 'spec/tokens/foundation/radius.tokens.json')).radius.huge, 'radius.huge').$value, '40px');
  assert.deepEqual(r.overrides.added, ['radius.huge']);
  assert.ok(r.overrides.kept.includes('radius.md'));
  const o = await readJson<{ overrides: Record<string, { added?: boolean }> }>(dir, 'spec/tokens/overrides.json');
  assert.equal(o.overrides['radius.huge']?.added, true);
  const report = await runChecks(dir);
  assert.equal(report.exitCode, 2);
  // Regenerating again keeps both, without new findings.
  const again = await regenerate(dir);
  assert.deepEqual(again.overrides.added, []);
  assert.equal(must((await readJson<Radius>(dir, 'spec/tokens/foundation/radius.tokens.json')).radius.huge, 'radius.huge').$value, '40px');
  await rm(dir, { recursive: true });
});

test('F10 overrides lifecycle: list, reset one, reset all', async () => {
  const dir = await fixture();
  await edit<Radius>(dir, 'spec/tokens/foundation/radius.tokens.json', (j) => { j.radius.md.$value = '7px'; j.radius.huge = { $value: '40px' }; });
  await edit<{ opacity: { 50: Leaf } }>(dir, 'spec/tokens/foundation/opacity.tokens.json', (j) => { j.opacity['50'].$value = 0.4; });
  await regenerate(dir);
  assert.deepEqual((await listOverrides(dir)).map((o) => o.token).sort(), ['opacity.50', 'radius.huge', 'radius.md']);
  await resetOverride(dir, 'radius.md');
  assert.equal((await readJson<Radius>(dir, 'spec/tokens/foundation/radius.tokens.json')).radius.md.$value, '8px');
  await assert.rejects(resetOverride(dir, 'radius.md'), /No override/);
  await resetAll(dir);
  assert.deepEqual(await listOverrides(dir), []);
  const radius = await readJson<Radius>(dir, 'spec/tokens/foundation/radius.tokens.json');
  assert.equal(radius.radius.huge, undefined);
  assert.equal((await readJson<{ opacity: { 50: Leaf } }>(dir, 'spec/tokens/foundation/opacity.tokens.json')).opacity['50'].$value, 0.5);
  await buildTokens({ root: dir });
  assert.equal((await runChecks(dir)).exitCode, 0);
  await rm(dir, { recursive: true });
});

test('F11 G1 rejects a foundation that no longer matches brand.config', async () => {
  const dir = await fixture();
  await edit<BrandConfig>(dir, 'brand.config.json', (b) => { b.radius = { style: 'round' }; });
  const g1 = must((await runChecks(dir, { only: ['G1'] })).results[0], 'the G1 result');
  const e = g1.errors.find((x) => x.file === 'spec/tokens/foundation/radius.tokens.json');
  assert.ok(e, JSON.stringify(g1.errors));
  assert.match(e.fix ?? '', /sketchbook tokens rebuild/);
  await rm(dir, { recursive: true });
});

test('F13 success, warning and info roles exist in every mode with readable foregrounds', async () => {
  const dir = await fixture();
  const pairs = (await readJson<{ pairs: { fg: string; bg: string }[] }>(dir, 'spec/tokens/contrast.json')).pairs.map((p) => `${p.fg} on ${p.bg}`);
  for (const role of ['success', 'warning', 'info']) {
    for (const mode of ['light', 'dark']) {
      const doc = await readJson<{ color: Record<string, unknown> }>(dir, `spec/tokens/semantic/${mode}.tokens.json`);
      assert.ok(doc.color[role] && doc.color[`${role}-foreground`], `${mode} ${role}`);
    }
    assert.ok(pairs.includes(`color.${role}-foreground on color.${role}`), role);
  }
  const report = await runChecks(dir, { only: ['T6'] });
  assert.deepEqual(report.results[0]?.errors, []);
  assert.deepEqual(parseJson(await readFile(join(ROOT, 'harness/templates/brand-links.json'), 'utf8')), await readJson(dir, 'spec/tokens/brand-links.json'));
  await rm(dir, { recursive: true });
});

test('F10b a hand revert to the generated value drops the override; a hand-deleted token stays deleted', async () => {
  const dir = await fixture();
  await edit<Radius>(dir, 'spec/tokens/foundation/radius.tokens.json', (j) => { j.radius.md.$value = '7px'; j.radius.huge = { $value: '40px' }; });
  await regenerate(dir);
  assert.deepEqual((await listOverrides(dir)).map((o) => o.token).sort(), ['radius.huge', 'radius.md']);
  await edit<Radius>(dir, 'spec/tokens/foundation/radius.tokens.json', (j) => { j.radius.md.$value = '8px'; delete j.radius.huge; });
  const r = await regenerate(dir);
  assert.deepEqual(await listOverrides(dir), []);
  assert.deepEqual(r.overrides.dropped.sort(), ['radius.huge', 'radius.md']);
  const radius = (await readJson<Radius>(dir, 'spec/tokens/foundation/radius.tokens.json')).radius;
  assert.equal(radius.md.$value, '8px');
  assert.equal(radius.huge, undefined, 'a deleted hand-added token does not come back');
  // A generated token deleted by hand while overridden: the override goes, the generated value comes back.
  await edit<Radius>(dir, 'spec/tokens/foundation/radius.tokens.json', (j) => { j.radius.md.$value = '7px'; });
  await regenerate(dir);
  await edit<{ radius: { md?: Leaf } }>(dir, 'spec/tokens/foundation/radius.tokens.json', (j) => { delete j.radius.md; });
  await regenerate(dir);
  assert.deepEqual(await listOverrides(dir), []);
  assert.equal((await readJson<Radius>(dir, 'spec/tokens/foundation/radius.tokens.json')).radius.md.$value, '8px');
  assert.equal((await runChecks(dir)).exitCode, 0);
  await rm(dir, { recursive: true });
});

test('F14 without a snapshot, hand edits are recorded as overrides instead of disappearing', async () => {
  const dir = await fixture();
  await edit<Radius>(dir, 'spec/tokens/foundation/radius.tokens.json', (j) => { j.radius.md.$value = '7px'; j.radius.huge = { $value: '40px' }; });
  await rm(join(dir, 'generated/foundation.snapshot.json'));
  await regenerate(dir);
  const radius = (await readJson<Radius>(dir, 'spec/tokens/foundation/radius.tokens.json')).radius;
  assert.equal(radius.md.$value, '7px');
  assert.equal(must(radius.huge, 'radius.huge').$value, '40px');
  assert.deepEqual((await listOverrides(dir)).map((o) => [o.token, o.added]).sort(), [['radius.huge', true], ['radius.md', false]]);
  assert.deepEqual(failing(await runChecks(dir, { only: ['G1'] })), [], 'the snapshot is written again');
  await rm(dir, { recursive: true });
});

test('F7b a color link with no ramp step that meets the contrast target is reported, never a silent fallback', async () => {
  const dir = await fixture();
  await edit<BrandConfig>(dir, 'brand.config.json', (b) => { b.contrast = { ...b.contrast, targets: { text: 21 } }; });
  const r = await regenerate(dir);
  for (const t of ['color.muted-foreground', 'color.destructive', 'color.success']) assert.ok(r.links.missing.some((m) => m.token === t && /no step of color\.\w+ reaches 21:1/.test(m.msg)), `${t}: ${r.links.missing.map((m) => m.msg).join('\n')}`);
  const t7 = must((await runChecks(dir, { only: ['T7'] })).results[0], 'the T7 result').errors;
  assert.ok(t7.some((e) => e.token === 'color.muted-foreground' && /reaches 21:1/.test(e.msg)));
  await rm(dir, { recursive: true });
});
