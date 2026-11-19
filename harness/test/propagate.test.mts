// The propagation wall (plan: Foundations propagate to every output). A change to Foundations must reach every output and
// stay in sync: the record gate (O1), the Figma stamp gate (D1), the generated outputs, and the consumer boundary.
// The Storybook and docs site builds are maintainer checks (check --maintainer), exercised by `npm run check:maintainer`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, rm, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fixture, ROOT, readJson, writeJson, edit, sourceRepoOnly, PARTS, must } from './helpers.mjs';
import { parseJson } from '../lib/files.mjs';
import type { Report } from '../checks/types.mjs';
import type { BrandConfig } from '../../generated/types/brand-config.js';
import { inputsHash, docsInputsHash, hashFile, writeRecord, readRecord, keepTime, RECORD } from '../lib/propagation.mjs';
import { runChecks } from '../checks/run.mjs';
import { runGenerator } from '../generators/foundation.mjs';
import { regenerate } from '../commands/prefix.mjs';
import { stamp } from '../lib/design/sync.mjs';

const only = (dir: string, ids: string[]): Promise<Report> => runChecks(dir, { only: ids });
const failing = (report: Report): string[] => report.results.filter((r) => r.errors.length).map((r) => r.id);

test('O1 record gate: no record yet is not a failure; a record that matches the inputs passes; a changed foundation fails until propagate records again', async () => {
  const dir = await fixture(PARTS);
  await rm(join(dir, RECORD), { force: true });
  assert.deepEqual(failing(await only(dir, ['O1'])), [], 'no record yet: nothing was propagated, so there is no baseline to be stale against');

  await writeRecord(dir, { inputsHash: await inputsHash(dir), at: 'test', maintainer: null });
  assert.deepEqual(failing(await only(dir, ['O1'])), [], 'a record that matches the inputs passes');

  await edit<BrandConfig>(dir, 'brand.config.json', (j) => { must(j.color, 'brand.config.json color').primary = '#2563EB'; });
  assert.deepEqual(failing(await only(dir, ['O1'])), ['O1'], 'a changed foundation with no propagate after it fails');

  await writeRecord(dir, { inputsHash: await inputsHash(dir), at: 'test', maintainer: null });
  assert.deepEqual(failing(await only(dir, ['O1'])), [], 'propagate records the new inputs and the gate passes');
});

test('O1 maintainer gate detects changes to docs content, builders and the downloadable Figma file', async () => {
  const dir = await fixture(PARTS);
  const sources = {
    'apps/docs/content/index.md': '# Home\n',
    'apps/docs/content/_assets/Sketchbook.fig': 'example file',
    'apps/docs/scripts/docs-site.mts': 'export {};\n',
  };
  for (const folder of ['apps/docs/content/_assets', 'apps/docs/scripts', 'site-dist']) {
    await mkdir(join(dir, folder), { recursive: true });
  }
  for (const [path, body] of Object.entries(sources)) await writeFile(join(dir, path), body);
  await writeFile(join(dir, 'site-dist/index.html'), '<h1>Home</h1>');
  const record = async () => writeRecord(dir, {
    inputsHash: await inputsHash(dir), at: 'test',
    maintainer: { docs: { file: 'site-dist/index.html', hash: await hashFile(dir, 'site-dist/index.html'), inputs: await docsInputsHash(dir) } }
  });
  const maintainerErrors = async () => must((await runChecks(dir, { only: ['O1'], maintainer: true })).results[0], 'the O1 result').errors.map((e) => e.msg).join('\n');
  await record();
  assert.equal(await maintainerErrors(), '', 'a docs build recorded from the current sources passes');
  await writeFile(join(dir, 'apps/docs/scripts/docs-site.mjs'), 'export {};\n');
  assert.equal(await maintainerErrors(), '', 'compiling a builder adds no tracked inputs');
  for (const [path, body] of Object.entries(sources)) {
    await writeFile(join(dir, path), body + '\n');
    assert.match(await maintainerErrors(), /docs site sources changed/, `${path} invalidates the build`);
    await record();
    assert.equal(await maintainerErrors(), '', 'recording again passes');
  }
});

test('O1 counts contract and standards changes as foundations, but not generated outputs', async () => {
  const dir = await fixture(PARTS);
  await writeRecord(dir, { inputsHash: await inputsHash(dir), at: 'test', maintainer: null });
  await writeJson(dir, 'generated/css/tokens.css.stamp.json', { ignored: true });
  assert.deepEqual(failing(await only(dir, ['O1'])), [], 'a generated output does not count as an input');
  const contract = join(dir, 'spec/components/button/contract.json');
  const text = await readFile(contract, 'utf8');
  await writeJson(dir, 'spec/components/button/contract.json', { ...parseJson<object>(text), _note: 'changed' });
  assert.deepEqual(failing(await only(dir, ['O1'])), ['O1'], 'a contract change counts as a change to the foundations');
});

test('D1 Figma gate: a token change without a Figma sync is an error, not a warning', sourceRepoOnly, async () => {
  const dir = await fixture(PARTS);
  await stamp(dir, 'tokens');
  const before = await only(dir, ['D1']);
  assert.deepEqual(failing(before), [], 'the design stamp matches the spec before the change');
  await edit<{ color: Record<string, object | undefined> }>(dir, 'spec/tokens/semantic/light.tokens.json', (j) => { j.color.background = { ...j.color.background, $value: '#F0F0F0' }; });
  const after = await only(dir, ['D1']);
  assert.ok(failing(after).includes('D1'), `a stale Figma stamp fails D1 (got ${JSON.stringify(after.results[0]?.errors.slice(0, 1))})`);
});

test('propagation reaches the generated outputs: a brand change moves the token CSS and the generated token files', async () => {
  const dir = await fixture(PARTS);
  const cssBefore = await readFile(join(dir, 'generated/css/tokens.css'), 'utf8');
  await edit<BrandConfig>(dir, 'brand.config.json', (j) => { must(j.color, 'brand.config.json color').primary = '#2563EB'; });
  await runGenerator(dir, { quiet: true });
  await regenerate(dir);
  const cssAfter = await readFile(join(dir, 'generated/css/tokens.css'), 'utf8');
  assert.notEqual(cssAfter, cssBefore, 'the token CSS is rebuilt from the changed brand color');
  assert.ok(cssAfter.toLowerCase().includes('#2563eb') || cssAfter.includes('--sb-color-brand'), 'the new brand color reaches the CSS variables');
});

test('the package allowlist excludes the docs app, maintainer builds and source tree', async () => {
  const pkg = await readJson<{ files?: string[] }>(ROOT, 'package.json');
  const files = pkg.files ?? [];
  for (const forbidden of ['apps', 'site-dist', 'storybook-static', 'src', 'spec/tokens', 'spec/components', 'generated/design']) {
    assert.ok(!files.some((f) => f === forbidden || f.startsWith(forbidden + '/')), `${forbidden} is not in the published package`);
  }
});

test('the propagation record is written as JSON with the input hash and a time', async () => {
  const dir = await fixture(PARTS);
  await writeRecord(dir, { inputsHash: 'abc', at: '2026-11-12T00:00:00Z', maintainer: null });
  const rec = await readRecord(dir);
  assert.equal(rec?.inputsHash, 'abc');
  assert.equal(rec?.at, '2026-11-12T00:00:00Z');
});

test('a propagate that changes no hash keeps the record time, so it adds no diff; a changed hash takes the new time', () => {
  const maintainer = { docs: { file: 'site-dist/index.html', hash: 'h', inputs: 'i' } };
  const previous = { inputsHash: 'abc', at: '2026-11-12T00:00:00Z', maintainer };
  const now = '2026-11-14T00:00:00Z';
  assert.deepEqual(keepTime(previous, { inputsHash: 'abc', at: now, maintainer: structuredClone(maintainer) }), previous);
  assert.equal(keepTime(previous, { inputsHash: 'abd', at: now, maintainer }).at, now, 'inputs changed');
  assert.equal(keepTime(previous, { inputsHash: 'abc', at: now, maintainer: { docs: { ...maintainer.docs, inputs: 'j' } } }).at, now, 'a maintainer build changed');
  assert.equal(keepTime(null, { inputsHash: 'abc', at: now, maintainer: null }).at, now, 'first propagate');
});
