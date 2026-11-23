// Proves the prefix is rebrandable: rename ds -> acme on a copy of the reference project, then nothing of "ds" is left and every check passes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { renamePrefix, rewrite } from '../commands/prefix.mjs';
import { runChecks } from '../checks/run.mjs';
import { fixture, PARTS } from './helpers.mjs';
import { parseJson } from '../lib/files.mjs';
import type { ComponentContract } from '../../generated/types/contract.js';
import type { HarnessConfigJson } from '../../generated/types/harness-config.js';

test('rewrite renames prefixed names only, never parts of other words', () => {
  const src = [
    `const TAG = 'ds-tabs'; customElements.get('ds-tabs'); class DsTabs {} 'ds-button': DsButton;`,
    `<ds-card><ds-card-header></ds-card-header></ds-card> ::slotted(ds-item) {} ds-* and ds-<name>`,
    `color: var(--ds-color-muted); --ds-button-bg: red; @keyframes ds-spin {} 'components-input-group--ds-textarea-footer'`,
    `records fields needs-review builds-up adds-on SB-0009 sketchbook init SKETCHBOOK_PORT sketchbook/bundle sketchbook-allow-literal: x Dsl`,
  ].join('\n');
  const { text, count } = rewrite(src, 'ds', 'acme');
  assert.equal(text, [
    `const TAG = 'acme-tabs'; customElements.get('acme-tabs'); class AcmeTabs {} 'acme-button': AcmeButton;`,
    `<acme-card><acme-card-header></acme-card-header></acme-card> ::slotted(acme-item) {} acme-* and acme-<name>`,
    `color: var(--acme-color-muted); --acme-button-bg: red; @keyframes acme-spin {} 'components-input-group--acme-textarea-footer'`,
    `records fields needs-review builds-up adds-on SB-0009 sketchbook init SKETCHBOOK_PORT sketchbook/bundle sketchbook-allow-literal: x Dsl`,
  ].join('\n'));
  assert.equal(count, 16);
});

async function* files(dir: string): AsyncGenerator<string> {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* files(p); else yield p;
  }
}

test('renamePrefix to a prefix with digits leaves no trace of the old one in src/ or playwright/ and passes every check', async () => {
  // On the reference project (helpers.mjs), whatever prefix this install uses.
  const dir = await fixture(PARTS);
  const FROM = parseJson<HarnessConfigJson>(await readFile(join(dir, 'harness.config.json'), 'utf8')).prefix;
  const TO = FROM === 'zeta7' ? 'omega9' : 'zeta7';
  const Pascal = (FROM[0] ?? '').toUpperCase() + FROM.slice(1);
  await assert.rejects(renamePrefix(dir, FROM, 'Acme', { quiet: true }), /must match/);
  await assert.rejects(renamePrefix(dir, FROM, 'my-brand', { quiet: true }), /must match/);
  const r = await renamePrefix(dir, FROM, TO, { quiet: true });
  assert.ok(r.files.length > 100, `only ${r.files.length} files changed`);
  const left: string[] = [];
  for (const top of ['src', 'playwright']) {
    for await (const f of files(join(dir, top))) {
      const text = await readFile(f, 'utf8');
      for (const re of [new RegExp(`'${FROM}-`), new RegExp(`<${FROM}-`), new RegExp(`--${FROM}-`), new RegExp(`\\b${Pascal}[A-Z]`)]) if (re.test(text)) left.push(`${f.slice(dir.length + 1)} ${re}`);
    }
  }
  assert.deepEqual(left, []);
  assert.equal(parseJson<HarnessConfigJson>(await readFile(join(dir, 'harness.config.json'), 'utf8')).prefix, TO);
  assert.match(await readFile(join(dir, 'generated/css/tokens.css'), 'utf8'), new RegExp(`--${TO}-color-background:`));
  for (const name of await readdir(join(dir, 'spec/components'))) {
    const c = parseJson<ComponentContract>(await readFile(join(dir, 'spec/components', name, 'contract.json'), 'utf8'));
    assert.match(c.tag, new RegExp(`^${TO}-`), name);
    for (const e of c.elements || []) assert.match(e.tag, new RegExp(`^${TO}-`), `${name} ${e.tag}`);
  }
  const report = await runChecks(dir);
  assert.deepEqual(report.results.filter((x) => x.errors.length).map((x) => [x.id, x.errors.slice(0, 2)]), []);
  await rm(dir, { recursive: true });
});
