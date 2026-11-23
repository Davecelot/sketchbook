// Proves each check can reject: copy the reference project (helpers.mjs) into a temp dir, break one thing, expect that
// check to fail. The reference project uses the default prefix (sb), whatever this install renamed its own to.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { formatHuman, runChecks } from '../checks/run.mjs';
import { compileStyles, mediaVars } from '../../scripts/build-styles.mjs';
import { fixture, reference, ROOT, sourceRepoOnly, readJson, writeJson, must } from './helpers.mjs';
import { engineSchema, parseJson } from '../lib/files.mjs';
import { validate } from '../lib/schema.mjs';
import type { CheckIssue, CheckOutcome, Report } from '../checks/types.mjs';
import type { ComponentContract, Realization } from '../../generated/types/contract.js';
import type { ComponentRegistry } from '../../generated/types/registry.js';
import type { BrandConfig } from '../../generated/types/brand-config.js';
import type { HarnessConfigJson } from '../../generated/types/harness-config.js';
import type { APIVocabulary } from '../../generated/types/api.js';

const run = promisify(execFile);
// Unlike helpers.mjs edit, this one writes no trailing newline.
async function edit<T>(dir: string, file: string, fn: (j: T) => unknown): Promise<void> { const p = join(dir, file); const j = parseJson<T>(await readFile(p, 'utf8')); fn(j); await writeFile(p, JSON.stringify(j, null, 2)); }
const failing = (report: Report): string[] => report.results.filter((r) => r.errors.length).map((r) => r.id);
const first = (report: Report): CheckOutcome => must(report.results[0], 'the first check result');

const CONTRACT = {
  component: 'Probe', tag: 'sb-probe', status: 'draft', platforms: ['web'], summary: 'A probe component used only by tests.',
  props: {}, anatomy: [{ name: 'root', role: 'container', parent: null }],
  tokens: { 'probe.bg': '{color.background}' },
  accessibility: { role: 'none', accessibleNameSource: 'none', keyboard: {}, contrast: [] },
  realizations: {}, openQuestions: [],
};
async function withProbe(dir: string, contract: object = CONTRACT, css?: string): Promise<void> {
  await mkdir(join(dir, 'spec/components/probe'), { recursive: true });
  await writeFile(join(dir, 'spec/components/probe/contract.json'), JSON.stringify(contract));
  await edit<ComponentRegistry>(dir, 'spec/registry.json', (r) => r.components.push({ name: 'Probe', tier: 1, status: 'draft' }));
  if (css) { await mkdir(join(dir, 'src/components/probe'), { recursive: true }); await writeFile(join(dir, 'src/components/probe/Probe.scss'), css); }
}

test('baseline passes', async () => {
  const dir = await fixture();
  const r = await runChecks(dir);
  assert.deepEqual(failing(r), []);
  await rm(dir, { recursive: true });
});

test('T1 rejects math in source and bad values', async () => {
  const dir = await fixture();
  await edit<{ space: { inset: { surface: { $value: string } } } }>(dir, 'spec/tokens/semantic/base.tokens.json', (j) => { j.space.inset.surface.$value = '{space.4} * 2'; });
  await edit<{ radius: { md: { $value: string } } }>(dir, 'spec/tokens/foundation/radius.tokens.json', (j) => { j.radius.md.$value = '6'; });
  assert.deepEqual(failing(await runChecks(dir, { only: ['T1'] })), ['T1']);
});

test('T2 rejects missing aliases and layer skips', async () => {
  const dir = await fixture();
  await edit<{ color: { background: { $value: string } } }>(dir, 'spec/tokens/semantic/light.tokens.json', (j) => { j.color.background.$value = '{color.nope.500}'; });
  await withProbe(dir, { ...CONTRACT, tokens: { 'probe.bg': '{color.neutral.50}' } }); // component -> foundation skips semantic
  const r = await runChecks(dir, { only: ['T2'] });
  const msgs = first(r).errors.map((e) => e.msg).join('\n');
  assert.match(msgs, /does not exist/);
  assert.match(msgs, /component token aliases foundation token/);
});

test('T3 rejects a token missing from one mode', async () => {
  const dir = await fixture();
  await edit<{ color: { ring?: unknown } }>(dir, 'spec/tokens/semantic/dark.tokens.json', (j) => { delete j.color.ring; });
  assert.deepEqual(failing(await runChecks(dir, { only: ['T3'] })), ['T3']);
});

test('T4 rejects foreign variables and unused component tokens', async () => {
  const dir = await fixture();
  await withProbe(dir, CONTRACT, ':host{color:var(--sb-color-fg-default)}');
  const r = await runChecks(dir, { only: ['T4'] });
  const msgs = first(r).errors.map((e) => e.msg).join('\n');
  assert.match(msgs, /not one of Probe's component tokens/);
  assert.match(msgs, /never used/);
});

test('T4 counts token variables passed to @include mixins', async () => {
  const dir = await fixture();
  await withProbe(dir, CONTRACT, ':host{ @include a11y.focus-ring(var(--sb-probe-bg), var(--sb-color-ring)); }');
  const r = await runChecks(dir, { only: ['T4'] });
  const msgs = first(r).errors.map((e) => e.msg).join('\n');
  assert.doesNotMatch(msgs, /never used/);
  assert.match(msgs, /--sb-color-ring/);
});

test('T4 parses declarations without spaces (margin:var(--x))', async () => {
  const dir = await fixture();
  await withProbe(dir, CONTRACT, ':host{margin:var(--sb-space-4);background:var(--sb-probe-bg)}');
  const r = await runChecks(dir, { only: ['T4'] });
  assert.match(first(r).errors.map((e) => e.msg).join('\n'), /--sb-space-4/);
});

test('T5 rejects literals and accepts an annotated exception as a warning', async () => {
  const dir = await fixture();
  await withProbe(dir, CONTRACT, ':host{background:var(--sb-probe-bg);padding:8px;color:#fff;transition:opacity 150ms}\n:host([x]){/* sketchbook-allow-literal: hairline divider */ border-top-width:1px}');
  const r = await runChecks(dir, { only: ['T5'] });
  // Only the probe's findings: the reference src/ may hold annotated exceptions.
  const mine = (list: CheckIssue[]): CheckIssue[] => list.filter((x) => x.file === 'src/components/probe/Probe.scss');
  assert.equal(mine(first(r).errors).length, 3);
  assert.equal(mine(first(r).warnings).length, 1);
});

test('T6 rejects low contrast and names a passing step', async () => {
  const dir = await fixture();
  await edit<{ color: { 'muted-foreground': { $value: string } } }>(dir, 'spec/tokens/semantic/light.tokens.json', (j) => { j.color['muted-foreground'].$value = '{color.neutral.300}'; });
  const r = await runChecks(dir, { only: ['T6'] });
  assert.match(must(must(first(r).errors[0], 'the first error').fix, 'its fix'), /Nearest passing step: color\.neutral\.\d+/);
});

test('C1 rejects schema errors and tag mismatch', async () => {
  const dir = await fixture();
  await withProbe(dir, { ...CONTRACT, tag: 'x-probe', props: { size: { type: 'variant', note: 'Size.' } } });
  const r = await runChecks(dir, { only: ['C1'] });
  const msgs = first(r).errors.map((e) => e.msg).join('\n');
  assert.match(msgs, /should be "sb-probe"/);
  assert.match(msgs, /variant prop without values/);
});

test('C1 rejects lifecycle metadata that disagrees with the JSON contract', async () => {
  const dir = await fixture();
  try {
    await withProbe(dir, { ...CONTRACT, version: '1.0.0' });
    const md = join(dir, 'spec/components/probe/contract.md');
    await writeFile(md, '---\r\nstatus: beta\r\nversion: 0.1.0\r\n---\r\n# Probe\r\n');
    await edit<HarnessConfigJson>(dir, 'harness.config.json', (config) => { config.catalog = { source: false }; });
    const downstream = first(await runChecks(dir, { only: ['C1'] }));
    assert.equal(downstream.errors.length, 0);
    assert.equal(downstream.warnings.filter((w) => w.file?.endsWith('probe/contract.md')).length, 2);
    await edit<HarnessConfigJson>(dir, 'harness.config.json', (config) => { config.catalog = { source: true }; });
    const issues = first(await runChecks(dir, { only: ['C1'] })).errors.filter((e) => e.file?.endsWith('probe/contract.md'));
    assert.equal(issues.length, 2);
    assert.match(issues.map((e) => e.msg).join('\n'), /status.*beta.*draft/);
    assert.match(issues.map((e) => e.msg).join('\n'), /version.*0\.1\.0.*1\.0\.0/);
    await writeFile(md, '---\nstatus: draft\nversion: 1.0.0\n---\n# Probe\n');
    assert.deepEqual(failing(await runChecks(dir, { only: ['C1'] })), []);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('runtime schema validation honors constraints used by the API and harness config', async () => {
  const api = await readJson<APIVocabulary>(ROOT, 'spec/api.json');
  const schema = must(engineSchema('api'), 'API schema');
  assert.deepEqual(validate(schema, api), []);
  const invalid = { ...api, states: { ...api.states, canonicalKeys: { Focus: 42 } }, regions: { 'probe.content': { name: 'Content', meaning: 'Body', preferred: ['button', 'button'] } } };
  assert.match(validate(schema, invalid).join('\n'), /canonicalKeys\.Focus/);
  assert.match(validate(schema, invalid).join('\n'), /preferred.*unique/);
  const config = await readJson<HarnessConfigJson>(ROOT, 'harness.config.json');
  const badConfig = { ...config, contextBudget: { alwaysOnBytes: -1 }, agentProfiles: ['claude', 'claude'] };
  const errors = validate(must(engineSchema('harness-config'), 'harness config schema'), badConfig).join('\n');
  assert.match(errors, /alwaysOnBytes.*at least 0/);
  assert.match(errors, /agentProfiles.*unique/);
});

test('C1 keeps the contract closed except for namespaced $extensions with valid design.figma options', async () => {
  const opt = { name: 'Third', kind: 'boolean', default: false, shows: ['trigger-third'], reason: 'A third tab, drawn only in the design file.' };
  const c1 = async (contract: object): Promise<string> => {
    const dir = await fixture();
    await withProbe(dir, contract);
    return first(await runChecks(dir, { only: ['C1'] })).errors.map((e) => e.msg).join('\n');
  };
  assert.equal(await c1({ ...CONTRACT, $extensions: { 'design.figma': { options: [opt] } } }), '');
  assert.match(await c1({ ...CONTRACT, extra: 1 }), /additional|extra/i);
  assert.match(await c1({ ...CONTRACT, $extensions: { figma: {} } }), /namespace|pattern|additional/i);
  assert.match(await c1({ ...CONTRACT, $extensions: { 'design.figma': { options: [{ ...opt, reason: '' }] } } }), /reason/);
  assert.match(await c1({ ...CONTRACT, $extensions: { 'design.figma': { options: [{ ...opt, kind: 'enum' }] } } }), /values/);
  assert.match(await c1({ ...CONTRACT, $extensions: { 'design.figma': { options: [opt, opt] } } }), /duplicate|twice/i);
});

test('generator keeps a hand edit and check flags it (exit 2)', async () => {
  const dir = await fixture();
  await edit<{ radius: { md: { $value: string } } }>(dir, 'spec/tokens/foundation/radius.tokens.json', (j) => { j.radius.md.$value = '7px'; });
  await run('node', [join(ROOT, 'harness/generators/foundation.mjs')], { cwd: dir });
  await run('node', [join(ROOT, 'harness/build/tokens.mjs')], { cwd: dir });
  const kept = parseJson<{ radius: { md: { $value: string } } }>(await readFile(join(dir, 'spec/tokens/foundation/radius.tokens.json'), 'utf8'));
  assert.equal(kept.radius.md.$value, '7px');
  const r = await runChecks(dir);
  assert.equal(r.exitCode, 2);
  const [summary, ...details] = formatHuman(r);
  assert.equal(summary, 'All checks passed (with overrides).');
  assert.match(details.join('\n'), /radius\.md/);
  assert.equal(must(r.overrides[0], 'the first override').token, 'radius.md');
});

test('C2 rejects state and contrast references to unknown tokens', async () => {
  const dir = await fixture();
  await withProbe(dir, { ...CONTRACT, states: { hover: { trigger: 'pointer', tokens: ['probe.nope'] } }, accessibility: { ...CONTRACT.accessibility, contrast: [{ fg: 'probe.bg', bg: 'color.nope', kind: 'text' }] } });
  const msgs = first(await runChecks(dir, { only: ['C2'] })).errors.map((e) => e.msg).join('\n');
  assert.match(msgs, /probe\.nope/);
  assert.match(msgs, /color\.nope/);
});

test('C3 rejects props and parts missing from the contract', async () => {
  const dir = await fixture();
  await withProbe(dir, { ...CONTRACT, props: { tone: { type: 'variant', values: ['a', 'b'], note: 'Tone.' } } });
  await mkdir(join(dir, 'src/components/probe'), { recursive: true });
  await writeFile(join(dir, 'src/components/probe/Probe.ts'), `import { LitElement, html } from 'lit';\nimport { property } from 'lit/decorators.js';\nexport class SbProbe extends LitElement {\n  @property() size = 'md';\n  render() { return html\`<div part="box"><slot></slot></div>\`; }\n}\ncustomElements.define('sb-probe', SbProbe);\n`);
  const msgs = first(await runChecks(dir, { only: ['C3'] })).errors.map((e) => e.msg).join('\n');
  assert.match(msgs, /contract prop "tone"/);
  assert.match(msgs, /@property "size"/);
  assert.match(msgs, /part="box"/);
  assert.match(msgs, /<slot> is not in the contract/);
});

test('A1 rejects unregistered props, values, events and state keys, and an alias to nowhere', async () => {
  const dir = await fixture();
  await withProbe(dir, {
    ...CONTRACT,
    props: { flavour: { type: 'text', default: '' }, variant: { type: 'variant', values: ['primary', 'wacky'], default: 'primary' }, size: { type: 'variant', values: ['medium', 'small'], default: 'medium' } },
    events: { 'fancy-thing': { bubbles: true, composed: true, cancelable: false, detail: null } },
    states: { sparkly: {} },
  });
  await edit<APIVocabulary>(dir, 'spec/api.json', (j) => { j.aliases['probe.flavour'] = { to: 'nowhere' }; });
  const msgs = first(await runChecks(dir, { only: ['A1'] })).errors.map((e) => `${e.token ?? ''} ${e.msg}`).join('\n');
  assert.match(msgs, /value "wacky" of variant is neither canonical/);
  assert.match(msgs, /event "fancy-thing" is not standard/);
  assert.match(msgs, /state key "sparkly" is not in spec\/api\.json/);
  assert.match(msgs, /alias "probe\.flavour" points at "nowhere"/);
  assert.doesNotMatch(msgs, /value "(primary|medium|small)"/, 'canonical values are accepted');
  const dir2 = await fixture();
  await withProbe(dir2, { ...CONTRACT, props: { flavour: { type: 'text', default: '' } } });
  assert.match(first(await runChecks(dir2, { only: ['A1'] })).errors.map((e) => e.msg).join('\n'), /prop "flavour" is not in spec\/api\.json/);
  await rm(dir2, { recursive: true });
  await rm(dir, { recursive: true });
});

test('A1 state keys: the kebab-case title or a declared canonical key (one or a list) is canonical, any other spelling an alias', async () => {
  const { auditApi } = await import('../lib/api.mjs');
  const dir = await fixture();
  await withProbe(dir, { ...CONTRACT, states: { 'focus-visible': {}, 'focus-within': {}, focused: {}, 'read-only': {}, readonly: {} } });
  await edit<APIVocabulary>(dir, 'spec/api.json', (j) => { j.states.keys.readonly = 'Read only'; j.states.keys.focused = 'Focus'; });
  const rows = Object.fromEntries(auditApi(dir, 'sb').states.filter((s) => s.component === 'probe').map((s) => [s.state, s.status]));
  assert.deepEqual(rows, { 'focus-visible': 'canonical', 'focus-within': 'canonical', focused: 'alias', 'read-only': 'canonical', readonly: 'alias' });
  await rm(dir, { recursive: true });
});

test('A1 rejects a repeating part that is not in the anatomy, or that repeats per a prop the contract lacks', async () => {
  const dir = await fixture();
  await withProbe(dir, CONTRACT);
  await edit<APIVocabulary>(dir, 'spec/api.json', (j) => {
    j.parts = {
      'probe.nowhere': { repeats: 'size', meaning: 'x', figma: { name: 'Second', as: 'property' } },
      'ghost.thumb': { repeats: 'value', meaning: 'x', figma: { name: 'Range', as: 'property' } },
      'probe.root': { repeats: 'count', meaning: 'x', figma: { name: 'More', as: 'property' } },
    };
  });
  const msgs = first(await runChecks(dir, { only: ['A1'] })).errors.map((e) => e.msg).join('\n');
  assert.match(msgs, /parts "probe\.nowhere" names a part that probe's anatomy does not have/);
  assert.match(msgs, /parts "probe\.root" repeats per "count", which is not a prop of probe/);
  assert.doesNotMatch(msgs, /ghost/, "an entry for a component that is not installed is ignored");
  await rm(dir, { recursive: true });
});

test('A1 rejects an element set whose component has no such element; a set of a component that is not installed is ignored', async () => {
  const dir = await fixture();
  await withProbe(dir, CONTRACT);
  await edit<APIVocabulary>(dir, 'spec/api.json', (j) => { j.sets = { 'probe.probe-nowhere': { meaning: 'x' }, 'ghost.ghost-group': { meaning: 'x' } }; });
  const msgs = first(await runChecks(dir, { only: ['A1'] })).errors.map((e) => e.msg).join('\n');
  assert.match(msgs, /sets "probe\.probe-nowhere" names an element that probe's contract does not have/);
  assert.doesNotMatch(msgs, /ghost/, 'an entry for a component that is not installed is ignored');
  await rm(dir, { recursive: true });
});

test('A1 rejects a content region that prefers something that is not a component; a region of a component that is not installed is ignored', async () => {
  const dir = await fixture();
  await withProbe(dir, CONTRACT);
  await edit<APIVocabulary>(dir, 'spec/api.json', (j) => { j.regions = { 'probe.body': { name: 'Body', meaning: 'x', preferred: ['nothing-here'] }, 'ghost.body': { name: 'Body', meaning: 'x', preferred: ['nothing-here'] } }; });
  const msgs = first(await runChecks(dir, { only: ['A1'] })).errors.map((e) => e.msg).join('\n');
  assert.match(msgs, /regions "probe\.body" prefers "nothing-here", which is not a component/);
  assert.doesNotMatch(msgs, /ghost/, 'an entry for a component that is not installed is ignored');
  await rm(dir, { recursive: true });
});

test('A1 rejects a practice that adopts a missing option or cites an unknown source', sourceRepoOnly, async () => {
  const dir = await fixture();
  await writeFile(join(dir, 'spec/schemas/figma-practices.schema.json'), await readFile(join(ROOT, 'spec/schemas/figma-practices.schema.json'), 'utf8'));
  const practices = parseJson<{ aspects: { 'state-model': { adopted: string }; description: { options: { sectioned: { seenIn: string[] } } } } }>(await readFile(join(ROOT, 'spec/figma-practices.json'), 'utf8'));
  await writeFile(join(dir, 'spec/figma-practices.json'), JSON.stringify(practices));
  assert.equal(first(await runChecks(dir, { only: ['A1'] })).errors.length, 0, 'the shipped registry passes');
  practices.aspects['state-model'].adopted = 'nonexistent';
  practices.aspects['description'].options.sectioned.seenIn.push('nobody');
  await writeFile(join(dir, 'spec/figma-practices.json'), JSON.stringify(practices));
  const msgs = first(await runChecks(dir, { only: ['A1'] })).errors.map((e) => e.msg).join('\n');
  assert.match(msgs, /aspect "state-model" adopts "nonexistent"/);
  assert.match(msgs, /cites source "nobody"/);
  await rm(dir, { recursive: true });
});

test('R1 rejects a beta status without code, stories or spec', async () => {
  const dir = await fixture();
  await withProbe(dir, { ...CONTRACT, status: 'beta', realizations: { web: { files: ['src/components/probe/Probe.ts'] } } });
  await edit<ComponentRegistry>(dir, 'spec/registry.json', (r) => { must(r.components.find((c) => c.name === 'Probe'), 'registry entry Probe').status = 'beta'; });
  const msgs = must((await runChecks(dir, { only: ['C3', 'R1'] })).results.find((x) => x.id === 'R1'), 'the R1 result').errors.map((e) => e.msg).join('\n');
  assert.match(msgs, /missing src\/components\/probe\/Probe\.ts/);
  assert.match(msgs, /no stories file/);
  assert.match(msgs, /no behavior spec/);
});

test('R1 counts only <name>-YYYY-MM-DD audits for a stable component, never a longer name that shares the prefix', async () => {
  const dir = await fixture();
  await withProbe(dir, { ...CONTRACT, status: 'stable' });
  await edit<ComponentRegistry>(dir, 'spec/registry.json', (r) => { must(r.components.find((c) => c.name === 'Probe'), 'registry entry Probe').status = 'stable'; });
  for (const d of ['docs/parity-audits', 'docs/a11y-audits']) {
    await mkdir(join(dir, d), { recursive: true });
    await writeFile(join(dir, d, 'probe-group-2026-11-15.md'), 'Verdict: ready\nApproved-by: Someone (2026-11-15)\n');
  }
  const msgs = must((await runChecks(dir, { only: ['C3', 'R1'] })).results.find((x) => x.id === 'R1'), 'the R1 result').errors.filter((e) => e.token === 'Probe').map((e) => e.msg).join('\n');
  assert.match(msgs, /no parity audit report/);
  assert.match(msgs, /no a11y audit report/);
});

test('M1 rejects a shipped component missing its docs, only in maintainer mode', async () => {
  const dir = await fixture();
  await withProbe(dir, { ...CONTRACT, status: 'beta' });
  await edit<ComponentRegistry>(dir, 'spec/registry.json', (r) => { Object.assign(must(r.components.find((c) => c.name === 'Probe'), 'registry entry Probe'), { status: 'beta', path: 'src/components/probe' }); });
  await mkdir(join(dir, 'apps/docs/content/demo'), { recursive: true });
  assert.deepEqual(failing(await runChecks(dir, { only: ['M1'] })), []);
  const msgs = first(await runChecks(dir, { only: ['M1'], maintainer: true })).errors.filter((e) => e.token === 'Probe').map((e) => e.msg).join('\n');
  assert.match(msgs, /no parity audit report/);
  assert.match(msgs, /no docs site page apps\/docs\/content\/demo\/probe\.md/);
  assert.match(msgs, /no docs site example/);
  await rm(dir, { recursive: true });
});

test('M1 rejects a contract drafting label on a public demo page, only in maintainer mode', async () => {
  const dir = await fixture();
  await mkdir(join(dir, 'apps/docs/content/demo'), { recursive: true });
  await writeFile(join(dir, 'apps/docs/content/demo/probe.md'), 'Events\n\n| `sb-toggle` | PROPOSAL: fires after open changes |\n');
  assert.deepEqual(failing(await runChecks(dir, { only: ['M1'] })), []);
  const msgs = first(await runChecks(dir, { only: ['M1'], maintainer: true })).errors.map((e) => e.msg).join('\n');
  assert.match(msgs, /drafting label/);
  await writeFile(join(dir, 'apps/docs/content/demo/probe.md'), 'Events\n\n| `sb-toggle` | fires after open changes |\n');
  assert.ok(!first(await runChecks(dir, { only: ['M1'], maintainer: true })).errors.some((e) => /drafting label/.test(e.msg)));
  await rm(dir, { recursive: true });
});

test('S1 rejects a shipped component with no stored screen-reader view, an unnamed control, or no view after a key press', async () => {
  const dir = await fixture();
  await withProbe(dir, { ...CONTRACT, status: 'beta', accessibility: { ...CONTRACT.accessibility, keyboard: { Space: 'presses it' } } });
  await edit<ComponentRegistry>(dir, 'spec/registry.json', (r) => { Object.assign(must(r.components.find((c) => c.name === 'Probe'), 'registry entry Probe'), { status: 'beta', path: 'src/components/probe' }); });
  const probeErrors = async () => first(await runChecks(dir, { only: ['S1'] })).errors.filter((e) => e.token === 'Probe').map((e) => e.msg).join('\n');
  let msgs = await probeErrors();
  assert.match(msgs, /no stored screen-reader view of its stories/);
  assert.match(msgs, /stores no screen-reader view after a key press/);
  const views = join(dir, 'playwright/tests/probe/__screen-reader__');
  await mkdir(join(views, 'stories'), { recursive: true });
  await writeFile(join(views, 'stories/components-probe--default.txt'), '- button [focused]\n');
  await writeFile(join(dir, 'playwright/tests/probe/probe.behavior.spec.ts'), "await expectScreenReaderView(page, 'probe-pressed');\n");
  msgs = await probeErrors();
  assert.match(msgs, /announces a control with no name: - button \[focused\]/);
  assert.doesNotMatch(msgs, /after a key press|no stored/);
  await writeFile(join(views, 'stories/components-probe--default.txt'), '- button "Probe" [focused]\n');
  assert.equal(await probeErrors(), '');
  await rm(dir, { recursive: true });
});

test('the style build inlines a component length token in a media query and rejects any other variable there (SB-0109)', async () => {
  const dir = await fixture();
  await withProbe(dir, { ...CONTRACT, tokens: { 'probe.narrow': '{size.control.default}' } }, ':host{display:block}\n@media (width < var(--sb-probe-narrow)) { :host { display: none } }');
  const scss = join(dir, 'src/components/probe/Probe.scss');
  const vars = await mediaVars(dir);
  assert.match(vars['--sb-probe-narrow'] ?? '', /^\d+(\.\d+)?(px|rem|em)$/, 'the probe length token resolves through the semantic layer');
  const { contents } = compileStyles(scss, vars);
  assert.ok(contents.includes(`@media (width < ${vars['--sb-probe-narrow']})`), 'the media query carries the resolved length');
  assert.ok(contents.includes('var(--sb-probe-narrow)') === false);
  const t4 = first(await runChecks(dir, { only: ['T4'] })).errors.map((e) => e.msg).join('\n');
  assert.doesNotMatch(t4, /probe\.narrow is in the contract but never used/, 'T4 counts a token used only in a media query');
  await writeFile(scss, '@media (width < var(--sb-probe-nope)) { :host { display: none } }');
  assert.throws(() => compileStyles(scss, {}), /--sb-probe-nope in a media query/);
  await rm(dir, { recursive: true });
});

test('G1 rejects a hand-edited generated file', async () => {
  const dir = await fixture();
  await writeFile(join(dir, 'generated/css/tokens.css'), (await readFile(join(dir, 'generated/css/tokens.css'), 'utf8')) + '/* edited */\n');
  const r = await runChecks(dir, { only: ['G1'] });
  assert.match(first(r).errors.map((e) => e.file).join(), /tokens\.css/);
});

test('sketchbook add scaffolds a contract that passes the checks', async () => {
  const dir = await fixture();
  const { add } = await import('../cli.mjs');
  await edit<ComponentRegistry>(dir, 'spec/registry.json', (reg) => reg.components.push({ name: 'Probe Widget', tier: 3, status: 'planned' }));
  const r = await add(dir, 'Probe Widget');
  assert.equal(r.tag, 'sb-probe-widget');
  assert.match(must(r.decision, 'the decision id'), /^SB-\d{4}$/);
  assert.match(await readFile(join(dir, 'spec/decisions/DECISIONS.md'), 'utf8'), new RegExp(`### ${r.decision} · .* · Add ProbeWidget\\n\\*\\*Status:\\*\\* proposed`));
  const report = await runChecks(dir);
  assert.deepEqual(failing(report), []);
  const reg = parseJson<ComponentRegistry>(await readFile(join(dir, 'spec/registry.json'), 'utf8'));
  assert.equal(must(reg.components.find((c) => c.name === 'Probe Widget'), 'registry entry Probe Widget').status, 'draft');
  await assert.rejects(add(dir, 'Probe Widget'), /already exists/);
  await assert.rejects(add(dir, 'Nope'), /not in spec\/registry\.json/);
});

test('tokens.css starts with a clean :root rule (no comment that closes early)', async () => {
  const css = await readFile(join(await reference(), 'generated/css/tokens.css'), 'utf8');
  const header = css.slice(0, css.indexOf('\n'));
  assert.equal((header.match(/\*\//g) || []).length, 1, 'the header comment must contain exactly one */');
  const { default: postcss } = await import('postcss');
  const second = must(postcss.parse(css).first?.next(), 'the node after the header');
  if (second.type !== 'rule') throw new Error(`expected a rule after the header, got ${second.type}`);
  assert.equal(second.selector, ':root, [data-theme="light"]');
});

test('C3 checks family sub-elements against contract.elements', async () => {
  const dir = await fixture();
  await withProbe(dir, { ...CONTRACT, elements: [{ tag: 'sb-probe-part', summary: 'A part.', props: { tone: { type: 'variant', values: ['a', 'b'], note: 'Tone.' } }, content: { default: { notes: 'Text.' } } }] });
  await mkdir(join(dir, 'src/components/probe'), { recursive: true });
  await writeFile(join(dir, 'src/components/probe/ProbePart.ts'), `import { LitElement, html } from 'lit';\nimport { property } from 'lit/decorators.js';\nexport class SbProbePart extends LitElement {\n  @property() tone = 'a';\n  render() { return html\`<slot></slot>\`; }\n}\ncustomElements.define('sb-probe-part', SbProbePart);\n`);
  await writeFile(join(dir, 'src/components/probe/ProbeOther.ts'), `import { LitElement, html } from 'lit';\nexport class SbProbeOther extends LitElement {\n  render() { return html\`<slot></slot>\`; }\n}\ncustomElements.define('sb-probe-other', SbProbeOther);\n`);
  const msgs = first(await runChecks(dir, { only: ['C3'] })).errors.map((e) => e.msg).join('\n');
  assert.doesNotMatch(msgs, /sb-probe-part/);
  assert.match(msgs, /<sb-probe-other> has no contract/);
});

test('sketchbook init rebrands: new primary ramp, semantic primary re-pointed, all checks pass', async () => {
  const dir = await fixture();
  const { init } = await import('../commands/init.mjs');
  const r = await init(dir, { primary: '#2563EB', radius: 'round', name: 'acme' });
  assert.equal(r.anchors.primary, 500);
  const light = parseJson<{ color: { primary: { $value: string } } }>(await readFile(join(dir, 'spec/tokens/semantic/light.tokens.json'), 'utf8'));
  assert.equal(light.color.primary.$value, '{color.brand.500}');
  const css = await readFile(join(dir, 'generated/css/tokens.css'), 'utf8');
  assert.match(css, /--sb-color-brand-500: #2563eb/);
  assert.match(css, /--sb-radius-lg: 16px/);
  const report = await runChecks(dir);
  assert.deepEqual(failing(report), [], JSON.stringify(report.results.filter((x) => x.errors.length).map((x) => x.errors.slice(0, 2))));
});

test('sketchbook init density and radius reach the semantic layer: control heights and the smallest corner follow', async () => {
  const dir = await fixture();
  const { init } = await import('../commands/init.mjs');
  await init(dir, { density: 'compact', radius: 'sharp' });
  const base = parseJson<{ size: { control: Record<string, { $value: string }> } }>(await readFile(join(dir, 'spec/tokens/semantic/base.tokens.json'), 'utf8'));
  assert.deepEqual(['sm', 'default', 'lg'].map((k) => base.size.control[k]?.$value), ['{size.28}', '{size.32}', '{size.36}']);
  const css = await readFile(join(dir, 'generated/css/tokens.css'), 'utf8');
  assert.match(css, /--sb-radius-xs: 0px/);
  assert.match(css, /--sb-checkbox-radius: var\(--sb-radius-xsmall\)/);
  assert.deepEqual(failing(await runChecks(dir)), []);
});

test('W1 rejects a contract that copies the reference description, and brand names in generated files', async () => {
  const dir = await fixture();
  await edit<ComponentContract>(dir, 'spec/components/badge/contract.json', (j) => { j.summary = 'Displays a badge or a component that looks like a badge.'; });
  await writeFile(join(dir, 'generated/design/probe.js'), '// built the Examplecorp way\n');
  process.env.SKETCHBOOK_FORBIDDEN_TERMS = 'examplecorp';
  try {
    const msgs = first(await runChecks(dir, { only: ['W1'] })).errors.map((e) => `${e.file} ${e.msg}`).join('\n');
    assert.match(msgs, /badge\/contract\.json copies the reference's description/);
    assert.match(msgs, /generated\/design\/probe\.js brand or product name "Examplecorp"/);
  } finally {
    delete process.env.SKETCHBOOK_FORBIDDEN_TERMS;
  }
});

test('sketchbook swap tokens plain rebuilds with the plain adapter and G1 accepts it', async () => {
  const dir = await fixture();
  const { swap } = await import('../commands/swap.mjs');
  const r = await swap(dir, 'tokens', 'plain');
  assert.deepEqual(r, { before: 'style-dictionary', after: 'plain' });
  assert.match(await readFile(join(dir, 'generated/css/tokens.css'), 'utf8'), /plain adapter/);
  assert.deepEqual(failing(await runChecks(dir, { only: ['G1'] })), []);
  await assert.rejects(swap(dir, 'design', 'penpot'), /Unknown design adapter/);
  assert.equal((await swap(dir, 'design', 'figma', { dryRun: true })).after, 'figma');
});

test('T1 rejects a path that is both a token and a group', async () => {
  const dir = await fixture();
  await edit<{ color: { background: unknown } }>(dir, 'spec/tokens/foundation/color.tokens.json', (j) => { j.color.background = { 50: { $value: '#FFFFFF' } }; });
  const msgs = first(await runChecks(dir, { only: ['T1'] })).errors.map((e) => e.msg).join('\n');
  assert.match(msgs, /both a token and a group/);
});

test('a fresh install gets the full semantic layer from templates, branded, and passes every check', async () => {
  const dir = await fixture();
  await rm(join(dir, 'spec/tokens/semantic'), { recursive: true });
  await edit<BrandConfig>(dir, 'brand.config.json', (b) => { must(b.color, 'brand color').primary = '#0F766E'; });
  await run('node', [join(ROOT, 'harness/generators/foundation.mjs')], { cwd: dir });
  await run('node', [join(ROOT, 'harness/build/index.mjs')], { cwd: dir });
  const light = parseJson<{ color: { primary: { $value: string } } }>(await readFile(join(dir, 'spec/tokens/semantic/light.tokens.json'), 'utf8'));
  assert.match(light.color.primary.$value, /^\{color\.brand\.\d+\}$/);
  assert.deepEqual(failing(await runChecks(dir)), []);
});

test('W1 rejects forbidden terms and the reference named outside source/drift', async () => {
  const dir = await fixture();
  await edit<HarnessConfigJson>(dir, 'harness.config.json', (j) => { j.whiteLabel = { forbiddenTerms: ['Globex'] }; });
  await withProbe(dir, { ...CONTRACT, summary: 'A probe styled after shadcn for Globex.' }, ':host{color:var(--sb-probe-bg)}');
  const msgs = first(await runChecks(dir, { only: ['W1'] })).errors.map((e) => `${e.file} ${e.msg}`).join('\n');
  assert.match(msgs, /contract\.json.*names the visual reference/);
  assert.match(msgs, /brand or product name/);
});

test('X1 rejects incomplete entries, unknown supersedes and missing contract decisions', async () => {
  const dir = await fixture();
  const p = join(dir, 'spec/decisions/DECISIONS.md');
  const text = await readFile(p, 'utf8');
  await writeFile(p, text.replace('\n---\n\n', '\n---\n\n### SB-0999 · 2026-11-08 · Half done\n**Context:** x\n**Supersedes:** SB-0998\n\n'));
  await withProbe(dir, { ...CONTRACT, decisions: ['SB-0777'] });
  const msgs = first(await runChecks(dir, { only: ['X1'] })).errors.map((e) => `${e.token} ${e.msg}`).join('\n');
  assert.match(msgs, /SB-0999 missing Decision, Why, Watch out/);
  assert.match(msgs, /supersedes unknown SB-0998/);
  assert.match(msgs, /SB-0999 not listed in the index/);
  assert.match(msgs, /SB-0777 cites a decision that does not exist/);
});

test('P1 rejects element names and custom properties that ignore the configured prefix', async () => {
  const dir = await fixture();
  await mkdir(join(dir, 'src/components/probe'), { recursive: true });
  await writeFile(join(dir, 'src/components/probe/Probe.ts'), `import { LitElement, html } from 'lit';\nconst TAG = 'xx-probe';\nexport class SbProbe extends LitElement {\n  render() { return html\`<xx-button style="color: var(--xx-color-ring)"></xx-button>\`; }\n}\ncustomElements.define('xx-probe', SbProbe);\n`);
  await writeFile(join(dir, 'src/components/probe/Probe.scss'), ':host{color:var(--xx-probe-bg);--_ok:1px}\n::slotted(xx-button){display:block}\n');
  const r = await runChecks(dir, { only: ['P1'] });
  const msgs = first(r).errors.map((e) => `${e.file}:${e.line} ${e.msg}`).join('\n');
  assert.match(msgs, /Probe\.ts:2 element name uses prefix "xx", not "sb"/);
  assert.match(msgs, /Probe\.ts:6 element name uses prefix "xx"/);
  assert.match(msgs, /Probe\.ts:4 element xx-button should be sb-button/);
  assert.match(msgs, /Probe\.ts:4 custom property --xx-color-ring/);
  assert.match(msgs, /Probe\.scss:1 custom property --xx-probe-bg/);
  assert.match(msgs, /Probe\.scss:2 element xx-button should be sb-button/);
  assert.doesNotMatch(msgs, /--_ok/);
  assert.match(must(must(first(r).errors[0], 'the first error').fix, 'its fix'), /sketchbook prefix <new>/);
  await rm(dir, { recursive: true });
});

async function withKit(dir: string, files: Record<string, unknown>): Promise<void> {
  await mkdir(join(dir, 'src/patterns/probe'), { recursive: true });
  for (const [name, text] of Object.entries(files)) await writeFile(join(dir, 'src/patterns/probe', name), typeof text === 'string' ? text : JSON.stringify(text));
}
const KIT = {
  name: 'Probe', summary: 'A probe kit used only by tests.', components: ['sb-button', 'sb-card'], landmarks: ['main'], a11y: ['One h1.'], states: ['default'],
};
const kitStory = (body: string): string => `import { html } from 'lit';\nimport './probe.css';\nexport default { title: 'Patterns/Probe' };\nexport const Default = { render: () => html\`<main><h1>Probe</h1>${body}</main>\` };\nexport const Busy = {};\n`;

test('K1 rejects unknown elements, a component list or states that drift from the stories, inline styles and a kit missing from the index', async () => {
  const dir = await fixture();
  await withKit(dir, { 'Probe.stories.ts': kitStory('<sb-button>Go</sb-button><sb-widget></sb-widget><div style="gap: 4px"></div>'), 'pattern.json': KIT, 'probe.css': '.probe { display: grid; }\n' });
  const msgs = first(await runChecks(dir, { only: ['K1'] })).errors.map((e) => `${e.file} ${e.token ?? ''} ${e.msg}`).join('\n');
  assert.match(msgs, /sb-widget.*is not a component/);
  assert.match(msgs, /pattern\.json sb-card.*not used by the stories/);
  assert.match(msgs, /pattern\.json sb-widget.*missing from components/);
  assert.match(msgs, /busy.*not listed in states/);
  assert.match(msgs, /Probe\.stories\.ts.*inline style/);
  assert.match(msgs, /harness\/kits\/index\.json probe.*not listed/);
  await rm(dir, { recursive: true });
});

test('K1 rejects a layout with a missing state, a token that is not semantic, a part that does not exist and a component the stories do not use', async () => {
  const dir = await fixture();
  const layout = { screen: { fill: 'color.muted', pad: 'space.nope' }, states: { default: [{ stack: [{ component: 'card' }, { use: 'ghost' }], gap: 'space.stack.lg' }], extra: [] } };
  await withKit(dir, { 'Probe.stories.ts': kitStory('<sb-button>Go</sb-button>'), 'pattern.json': { ...KIT, components: ['sb-button'], states: ['default', 'busy'], layout }, 'probe.css': '.probe { display: grid; }\n' });
  const msgs = first(await runChecks(dir, { only: ['K1'] })).errors.map((e) => `${e.file} ${e.token ?? ''} ${e.msg}`).join('\n');
  assert.match(msgs, /busy layout has no state busy/);
  assert.match(msgs, /extra layout state extra is not listed in states/);
  assert.match(msgs, /space\.nope screen\.pad is not a semantic token/);
  assert.match(msgs, /ghost layout uses a part that is not in parts/);
  assert.match(msgs, /card layout draws a component the stories do not use/);
  await rm(dir, { recursive: true });
});

test('K1 rejects component tokens, foundation tokens and literals in pattern CSS', async () => {
  const dir = await fixture();
  await withKit(dir, {
    'Probe.stories.ts': kitStory('<sb-button>Go</sb-button><sb-card></sb-card>'),
    'pattern.json': { ...KIT, states: ['default', 'busy'] },
    'probe.css': '.probe {\n  gap: var(--sb-space-stack-md);\n  color: var(--sb-button-default-bg);\n  border-color: var(--sb-color-neutral-200);\n  padding: 12px;\n  background: #fff;\n  margin: 0;\n}\n',
  });
  const errors = first(await runChecks(dir, { only: ['K1'] })).errors;
  const msgs = errors.map((e) => `${e.file}:${e.line} ${e.msg}`).join('\n');
  assert.match(msgs, /probe\.css:3 .*--sb-button-default-bg is a component token/);
  assert.match(msgs, /probe\.css:4 .*--sb-color-neutral-200 is not a semantic token/);
  assert.match(msgs, /probe\.css:5 length literal "12px"/);
  assert.match(msgs, /probe\.css:6 color literal "#fff"/);
  assert.doesNotMatch(msgs, /probe\.css:(2|7) /);
  await rm(dir, { recursive: true });
});

test('W1 and P1 scan pattern docs, data and CSS', async () => {
  const dir = await fixture();
  await withKit(dir, {
    'README.md': '# Probe\n\nCopied from shadcn blocks.\n',
    'pattern.json': { ...KIT, summary: 'The shadcn login block.' },
    'probe.css': '.probe { color: var(--xx-color-ring); }\nxx-button { display: block; }\n',
  });
  const r = await runChecks(dir, { only: ['W1', 'P1'] });
  const w1 = must(r.results.find((x) => x.id === 'W1'), 'the W1 result').errors.map((e) => `${e.file}:${e.line ?? ''} ${e.msg}`).join('\n');
  const p1 = must(r.results.find((x) => x.id === 'P1'), 'the P1 result').errors.map((e) => `${e.file}:${e.line} ${e.msg}`).join('\n');
  assert.match(w1, /src\/patterns\/probe\/README\.md:3 names the visual reference/);
  assert.match(w1, /src\/patterns\/probe\/pattern\.json.*names the visual reference/);
  assert.match(p1, /probe\.css:1 custom property --xx-color-ring/);
  assert.match(p1, /probe\.css:2 element xx-button should be sb-button/);
  await rm(dir, { recursive: true });
});

test('T7 rejects a missing interface token, a broken brand link and an unknown CSS variable outside components', async () => {
  const dir = await fixture();
  const t7 = async () => first(await runChecks(dir, { only: ['T7'] })).errors.map((e) => `${e.file}${e.line ? `:${e.line}` : ''} ${e.token ?? ''} ${e.msg}`).join('\n');
  assert.equal(await t7(), '', 'baseline');
  // T7a: an interface token deleted from one mode only.
  await edit<{ color: { ring?: unknown } }>(dir, 'spec/tokens/semantic/dark.tokens.json', (j) => { delete j.color.ring; });
  assert.match(await t7(), /dark\.tokens\.json color\.ring interface token color\.ring is missing in dark/);
  await rm(dir, { recursive: true });

  const dir2 = await fixture();
  const t7b = async () => first(await runChecks(dir2, { only: ['T7'] })).errors.map((e) => `${e.file}${e.line ? `:${e.line}` : ''} ${e.msg}`).join('\n');
  // T7b: a brand link whose semantic token is gone (G1 only warns about it).
  await edit<{ links: Record<string, unknown> }>(dir2, 'spec/tokens/brand-links.json', (j) => { j.links['color.gone'] = { from: 'color', role: 'primary', part: 'solid' }; });
  assert.match(await t7b(), /brand-links\.json color\.gone: semantic token not found/);
  // T7c: CSS variables that no token defines, in a story, a spec and a pattern.
  await edit<{ links: Record<string, unknown> }>(dir2, 'spec/tokens/brand-links.json', (j) => { delete j.links['color.gone']; });
  await writeFile(join(dir2, 'src/stories/Probe.stories.ts'), "export const P = { render: () => '<div style=\"color: var(--sb-color-nope)\"></div>' };\n");
  await writeFile(join(dir2, 'playwright/tests/probe.spec.ts'), "const v = getComputedStyle(el).getPropertyValue('--sb-color-gone');\n");
  await mkdir(join(dir2, 'src/patterns/probe'), { recursive: true });
  await writeFile(join(dir2, 'src/patterns/probe/probe.css'), '.p {\n  --sb-local-x: 1px;\n  gap: var(--sb-local-x);\n  color: var(--sb-color-renamed);\n}\n');
  const msgs = await t7b();
  assert.match(msgs, /src\/stories\/Probe\.stories\.ts:1 uses --sb-color-nope/);
  assert.match(msgs, /playwright\/tests\/probe\.spec\.ts:1 uses --sb-color-gone/);
  assert.match(msgs, /src\/patterns\/probe\/probe\.css:4 uses --sb-color-renamed/);
  assert.doesNotMatch(msgs, /--sb-local-x/, 'a variable the file declares itself is local');
  await rm(dir2, { recursive: true });
});

test('F1 warns (never fails) when foundations leave their standard', async () => {
  const dir = await fixture();
  const f1 = async () => first(await runChecks(dir, { only: ['F1'] }));
  const base = await f1();
  assert.deepEqual([base.errors, base.warnings], [[], []], 'default config follows its standard');
  await edit<BrandConfig>(dir, 'brand.config.json', (b) => {
    must(b.typography, 'brand typography').scale = { preset: 'perfect-fourth' };
    b.contrast = { preset: 'wcag-aa', targets: { text: 3 } };
  });
  await edit<{ font: { 'line-height': { body: { $value: string } } } }>(dir, 'spec/tokens/semantic/base.tokens.json', (j) => { j.font['line-height'].body.$value = '{font.line-height.tight}'; });
  const { runGenerator } = await import('../generators/foundation.mjs');
  await runGenerator(dir, { quiet: true });
  await edit<{ space: { '1': { $value: string } } }>(dir, 'spec/tokens/foundation/space.tokens.json', (j) => { j.space['1'].$value = '3px'; });
  await writeFile(join(dir, 'src/components/badge/Badge.scss'), (await readFile(join(dir, 'src/components/badge/Badge.scss'), 'utf8')).replace(/@include respect-reduced-motion;?|@media \(prefers-reduced-motion[^}]*\}\s*\}?/g, '').replace(/reduced-motion/g, 'x'));
  const r = await f1();
  assert.deepEqual(r.errors, []);
  const w = r.warnings.map((x) => `${x.token ?? x.file} ${x.msg}`).join('\n');
  assert.match(w, /font\.size\.control-xs resolves to 10px, below 12px/);
  assert.match(w, /font\.line-height\.body body line height 1\.25 is below 1\.5/);
  assert.match(w, /space\.1 3px is off the 4px grid/);
  assert.match(w, /contrast\.text contrast target for text is 3:1, weaker than WCAG AA/);
  assert.match(w, /Badge\.scss animates .* no reduced-motion handling/);
  assert.ok(r.warnings.every((x) => x.fix), 'every warning names the fix');
  await rm(dir, { recursive: true });
});

test('T1 rejects two tokens that build the same CSS variable (in any layers)', async () => {
  const dir = await fixture();
  // font.line-height.heading-1 exists: font.line-height.heading.1 would also be --sb-font-line-height-heading-1.
  await edit<{ font: { 'line-height': { heading: unknown } } }>(dir, 'spec/tokens/semantic/base.tokens.json', (j) => { j.font['line-height'].heading = { 1: { $value: 1.1 } }; });
  const msgs = first(await runChecks(dir, { only: ['T1'] })).errors.map((e) => e.msg).join('\n');
  assert.match(msgs, /both become --sb-font-line-height-heading-1/);
  await rm(dir, { recursive: true });
});

test('G1 rejects missing outputs, orphan styles, foreign foundation files and brand css without a brand', async () => {
  const dir = await fixture();
  const files = async () => first(await runChecks(dir, { only: ['G1'] })).errors.map((e) => `${e.file}: ${e.msg}`).join('\n');
  assert.equal(await files(), '', 'baseline');
  await rm(join(dir, 'src/index.ts'));
  await rm(join(dir, 'docs/cli.md'));
  await mkdir(join(dir, 'harness/cli'), { recursive: true }); // the harness lives here, so its outputs must too
  await writeFile(join(dir, 'src/components/button/Orphan.styles.ts'), 'export const orphanStyles = null;\n');
  await rm(join(dir, 'src/components/badge/Badge.styles.ts'));
  await writeFile(join(dir, 'spec/tokens/foundation/zz.tokens.json'), JSON.stringify({ zz: { $type: 'number', a: { $value: 1 } } }));
  await writeFile(join(dir, 'generated/css/tokens.ghost.css'), ':root {}\n');
  await writeFile(join(dir, 'generated/css/brands.css'), '/* none */\n');
  const msgs = await files();
  assert.match(msgs, /^src\/index\.ts: missing/m);
  assert.match(msgs, /^docs\/cli\.md: missing/m);
  assert.match(msgs, /^harness\/cli\/known-commands\.json: missing/m);
  assert.match(msgs, /^src\/components\/button\/Orphan\.styles\.ts: generated styles without a source/m);
  assert.match(msgs, /^src\/components\/badge\/Badge\.styles\.ts: missing/m);
  assert.match(msgs, /^spec\/tokens\/foundation\/zz\.tokens\.json: not made by the generator/m);
  assert.match(msgs, /^generated\/css\/tokens\.ghost\.css: no brand "ghost"/m);
  assert.match(msgs, /^generated\/css\/brands\.css: no brands/m);
  await rm(dir, { recursive: true });
});

test('G1 rejects a missing or stale foundation snapshot', async () => {
  const dir = await fixture();
  const g1 = async () => first(await runChecks(dir, { only: ['G1'] })).errors.map((e) => `${e.file}: ${e.msg}`).join('\n');
  const snap = await readFile(join(dir, 'generated/foundation.snapshot.json'), 'utf8');
  await writeFile(join(dir, 'generated/foundation.snapshot.json'), snap.replace('#FAFAFA', '#FAFAFB'));
  assert.match(await g1(), /foundation\.snapshot\.json: differs from generate/);
  await rm(join(dir, 'generated/foundation.snapshot.json'));
  assert.match(await g1(), /foundation\.snapshot\.json: missing/);
  await rm(dir, { recursive: true });
});

test('T6 holds every brand link to its alsoOn surfaces (contrast.json and the links cannot drift)', async () => {
  const dir = await fixture();
  // muted-foreground promises the text target on each alsoOn surface; on primary (near black in light) it fails.
  await edit<{ links: { 'color.muted-foreground': { alsoOn: string[] } } }>(dir, 'spec/tokens/brand-links.json', (j) => { j.links['color.muted-foreground'].alsoOn.push('color.primary'); });
  const errs = first(await runChecks(dir, { only: ['T6'] })).errors;
  assert.ok(errs.some((e) => e.file === 'spec/tokens/brand-links.json' && e.token === 'color.muted-foreground on color.primary'), JSON.stringify(errs.slice(0, 3)));
  await rm(dir, { recursive: true });
});

test('T7 rejects a malformed rename log (spec/tokens/renames.json)', async () => {
  const dir = await fixture();
  const t7 = async () => first(await runChecks(dir, { only: ['T7'] })).errors.map((e) => `${e.file} ${e.msg}`).join('\n');
  await writeFile(join(dir, 'spec/tokens/renames.json'), JSON.stringify({ renames: [{ from: 'color.muted', to: 'color.subtle', date: '2026-11-08' }] }));
  assert.equal(await t7(), '');
  await writeFile(join(dir, 'spec/tokens/renames.json'), JSON.stringify({ renames: [{ from: 'color.muted', to: 'Color Subtle' }] }));
  assert.match(await t7(), /renames\.json entry .* needs "from" and "to" token paths/);
  await writeFile(join(dir, 'spec/tokens/renames.json'), '{ nope');
  assert.match(await t7(), /renames\.json not valid JSON/);
  await rm(dir, { recursive: true });
});

test('D4 holds a complete design realization to its read-back and drift: unread, stale, undrawn without drift and drift on a drawn token are rejected', sourceRepoOnly, async () => {
  const { contractHash, mdOf } = await import('../lib/design/components.mjs');
  const dir = await fixture();
  await edit<HarnessConfigJson>(dir, 'harness.config.json', (j) => { j.adapters.design = { ...j.adapters.design, tool: 'figma' }; });
  const { readdir } = await import('node:fs/promises');
  for (const name of await readdir(join(dir, 'spec/components'))) await edit<ComponentContract>(dir, `spec/components/${name}/contract.json`, (j) => { j.realizations.design = { status: 'partial', coverage: [], drift: [] }; });
  const complete = (name: string, drift: NonNullable<Realization['drift']> = []): Promise<void> => edit<ComponentContract>(dir, `spec/components/${name}/contract.json`, (j) => { j.realizations.design = { status: 'complete', properties: { sets: { [j.component]: name === 'separator' ? 2 : 1 } }, coverage: [], drift }; });
  const errors = async () => first(await runChecks(dir, { only: ['D4'] })).errors.map((e) => e.msg).join('\n');
  await complete('separator');
  assert.equal(await errors(), '', 'a library never read back is not checked');
  await mkdir(join(dir, 'generated/design'), { recursive: true });
  await writeJson(dir, 'generated/design/library-verify.json', { sets: {} });
  assert.match(await errors(), /set Separator is not read back/);
  const hash = contractHash(await readJson<ComponentContract>(dir, 'spec/components/separator/contract.json'), await mdOf(dir, 'separator'));
  await writeJson(dir, 'generated/design/library-verify.json', { sets: { Separator: { name: 'separator', ok: true, checked: 2, problems: [], hash }, Skeleton: { name: 'skeleton', ok: true, checked: 1, problems: [], hash: 'old' } } });
  assert.equal(await errors(), '', 'read back clean and every styled token drawn');
  await complete('separator', [{ aspect: 'separator.color', contract: 'styled', realization: 'x' }]);
  assert.match(await errors(), /drift entry separator\.color names a token the design file now draws/);
  await complete('separator');
  await complete('skeleton');
  const msgs = await errors();
  assert.match(msgs, /set Skeleton is read back before the contract last changed/);
  assert.match(msgs, /skeleton\.pulse-opacity is used by the styles and drawn by no set, with no drift entry/);
  await rm(dir, { recursive: true });
});

test('H1 rejects a Claude layer that names an invented command or breaks the skill standard; no .claude/ passes', async () => {
  const dir = await fixture();
  assert.deepEqual(failing(await runChecks(dir, { only: ['H1'] })), []);
  await mkdir(join(dir, '.claude/commands'), { recursive: true });
  await writeFile(join(dir, '.claude/commands/ship.md'), '---\ndescription: Ship it\n---\nRun `sketchbook teleport` then `sketchbook check`.\n');
  await mkdir(join(dir, '.claude/skills/demo'), { recursive: true });
  await writeFile(join(dir, '.claude/skills/demo/SKILL.md'), '---\nname: demo\ndescription: No trigger here.\n---\n# Demo\n');
  const r = await runChecks(dir, { only: ['H1'] });
  assert.deepEqual(failing(r), ['H1']);
  const msgs = JSON.stringify(first(r).errors);
  assert.match(msgs, /unknown command \\"teleport\\"/);
  assert.match(msgs, /Trigger:/);
  assert.doesNotMatch(msgs, /sketchbook check/);
  await rm(dir, { recursive: true });
});

test('H2 rejects a hand-written .mjs in the harness sources; a compiled one, an allowlisted one and a project with no build script pass', async () => {
  const dir = await fixture();
  const put = async (file: string) => { await mkdir(join(dir, file, '..'), { recursive: true }); await writeFile(join(dir, file), 'export {};\n'); };
  await put('harness/lib/x.mjs');
  assert.deepEqual(failing(await runChecks(dir, { only: ['H2'] })), []);
  for (const f of ['scripts/build-harness.mjs', '.claude/hooks/run.mjs', 'harness/lib/y.mts', 'harness/lib/y.mjs', 'harness/templates/project/eslint.config.js']) await put(f);
  const r = await runChecks(dir, { only: ['H2'] });
  assert.deepEqual(failing(r), ['H2']);
  assert.deepEqual(first(r).errors.map((e) => e.file), ['harness/lib/x.mjs']);
  assert.match(must(first(r).errors[0], 'H2 error').fix ?? '', /Convert it to \.mts/);
  await rm(join(dir, 'harness/lib/x.mjs'));
  assert.deepEqual(failing(await runChecks(dir, { only: ['H2'] })), []);
  await rm(dir, { recursive: true });
});

test('D3 accepts a batch member that was removed (registry entry, planned) and rejects one the registry does not know', async () => {
  const dir = await fixture();
  await writeJson(dir, 'spec/design-docs.json', { shell: {}, pages: [], themeAxes: [], batches: [{ id: 'A', components: ['button-group', 'not-a-thing'] }] });
  // As init --start blank does it: the entry stays (planned) but loses its path; only its name ("Button Group") is left.
  const { removeComponents, removeKits, kitIndex } = await import('../commands/catalog.mjs');
  await removeKits(dir, kitIndex(dir).map((k) => k.id), { rebuild: false, yes: true });
  await removeComponents(dir, ['button-group'], { rebuild: false, yes: true });
  const msgs = JSON.stringify(first(await runChecks(dir, { only: ['D3'] })).errors);
  assert.match(msgs, /batch A names not-a-thing/);
  assert.doesNotMatch(msgs, /batch A names button-group/);
  await rm(dir, { recursive: true });
});

test('T7 and D3 reject a doc shell or view that names a token that does not exist, or no doc width', sourceRepoOnly, async () => {
  const withDocs = async () => {
    const dir = await fixture();
    await cp(join(ROOT, 'spec/design-docs.json'), join(dir, 'spec/design-docs.json'));
    await cp(join(ROOT, 'docs/design-docs'), join(dir, 'docs/design-docs'), { recursive: true });
    await edit<HarnessConfigJson>(dir, 'harness.config.json', (j) => { j.adapters.design.docs = { width: 1440 }; });
    return dir;
  };
  const dir = await withDocs();
  assert.deepEqual(failing(await runChecks(dir, { only: ['D3'] })), []);
  await edit<{ shell: { header: { fill: string } } }>(dir, 'spec/design-docs.json', (j) => { j.shell.header.fill = 'color.nope'; });
  assert.deepEqual(failing(await runChecks(dir, { only: ['T7'] })), ['T7']);
  const dir2 = await withDocs();
  await writeFile(join(dir2, 'docs/design-docs/anatomy.md'), 'Header uses `radius.huge` for its corners.\n');
  const r = await runChecks(dir2, { only: ['D3'] });
  assert.deepEqual(failing(r), ['D3']);
  assert.match(JSON.stringify(first(r).errors), /radius\.huge/);
  const dir3 = await withDocs();
  await edit<HarnessConfigJson>(dir3, 'harness.config.json', (j) => { delete j.adapters.design.docs; });
  assert.deepEqual(failing(await runChecks(dir3, { only: ['D3'] })), ['D3']);
  await Promise.all([dir, dir2, dir3].map((d) => rm(d, { recursive: true })));
});
