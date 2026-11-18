// Design file adapter (Figma), cases FG1–FG7 in TEST.md: the variables model, a push and read-back round trip against a
// minimal mock of figma.variables, value comparison, the verify CLI that D1 reads, the generic planner and the
// progress register. The real Figma file is not needed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fixture, must, reference, ROOT, sourceRepoOnly } from './helpers.mjs';
import { parseJson } from '../lib/files.mjs';
import { resolvedValue } from '../lib/design/tokens.mjs';
import type { FigmaModel, VerifyReadback } from '../adapters/design/figma/variables.mjs';
import type { Token, TokenData } from '../lib/tokens.mjs';
import type { Mismatch } from '../lib/design/verify.mjs';
import type { PlanNode } from '../lib/design/plan.mjs';
import type { LayerNode } from '../lib/design/library.mjs';
import type { CodeCard, DocBlueprint, DocCard, MatrixCard, ScreenCard, ScreenComponentNode, ScreenNode, TableCard } from '../lib/design/doc-text.mjs';
import type { APIVocabulary } from '../../generated/types/api.js';
import type { BrandConfig } from '../../generated/types/brand-config.js';
import { comboMap, tokenPayload } from '../lib/design/tokens.mjs';
import { compareReadback, comboList, sameValue } from '../lib/design/verify.mjs';
import { genericPlan } from '../lib/design/plan.mjs';
import { contractOf, libraryVariants } from '../lib/design/components.mjs';
import { COLLECTION_ORDER, compareDigests, coverage, figmaModel, resolveModel, snapshotOf, variableParts, variablesScript, verifyScript } from '../adapters/design/figma/variables.mjs';
import { loadAll, resolve } from '../lib/tokens.mjs';
import { diffInventories } from '../lib/design/compare.mjs';
import { patternIds } from '../lib/design/patterns.mjs';
import { runChecks } from '../checks/run.mjs';

// The constructor of async functions has no lib type; T is what the generated script returns, typed where the test reads it.
type ScriptFunction = new (...args: string[]) => <T>(...args: unknown[]) => Promise<T>;
const AsyncFunction = (Object.getPrototypeOf(async () => {}) as { constructor: ScriptFunction }).constructor;
const REF = await reference();

// loadAll has no map: these tests fall back to building one from its sets.
type LoadedTokens = TokenData & { map?: Map<string, Token> };
interface CliResult<J> { code: number | null; json: J }
interface PushReport { errors: unknown[]; created: number }
interface SetVerify { title: string; ok: boolean; checked: number; problems: string[]; detail?: string[] }
// The doc and pattern nodes the walks below read; every ScreenNode fits it.
interface WalkNode { kind?: string; ratio?: number | null; set?: string; variant?: string; hide?: string[]; clear?: string[]; children?: WalkNode[]; slots?: Record<string, WalkNode[]> }

// Narrows a doc card to the kind the test reads; another kind throws by name, where the untyped test failed on the missing field.
function matrixCard(c: DocCard | undefined): MatrixCard { if (c?.type !== 'matrix') throw new Error(`expected a matrix card, got ${c?.type}`); return c; }
function tableCard(c: DocCard | undefined): TableCard { if (c?.type !== 'table') throw new Error(`expected a table card, got ${c?.type}`); return c; }
function codeCard(c: DocCard | undefined): CodeCard { if (c?.type !== 'code') throw new Error(`expected a code card, got ${c?.type}`); return c; }
function screenCard(c: DocCard | undefined): ScreenCard { if (c?.type !== 'screen') throw new Error(`expected a screen card, got ${c?.type}`); return c; }
function componentNode(n: ScreenNode | undefined): ScreenComponentNode { if (n?.kind !== 'component') throw new Error(`expected a component node, got ${n?.kind}`); return n; }

// What the component doc scripts embed as cfg: the draw parts carry blueprints (with per on a wrapped grid), the verify the cells.
interface DrawCfg { px: { width: number; docPad: number; cardPad: number; line: number; matrixPad: number }; docs: { name: string; sections: { title: string; cards: { per?: number; rows: { cells: unknown[] }[] }[] }[] }[] }
interface VerifyCfg { docs: { name: string; cards: { section: string; cells: unknown[] }[] }[] }

interface MockMode { modeId: string; name: string }
interface MockCollection { id: string; name: string; hiddenFromPublishing: boolean; modes: MockMode[]; renameMode(id: string, to: string): void; addMode(to: string): string }
interface MockVariable {
  id: string; name: string; variableCollectionId: string; resolvedType: string; valuesByMode: Record<string, unknown>; scopes: string[]; codeSyntax: Record<string, string>;
  setValueForMode(m: string, value: unknown): void; setVariableCodeSyntax(platform: string, code: string): void;
}
interface MockNode {
  type: string; name: string; visible: boolean; opacity: number; fills: unknown[]; strokes: unknown[]; boundVariables: Record<string, unknown>; effectStyleId: string;
  componentPropertyReferences: Record<string, unknown>; descriptionMarkdown?: string | null; [k: string]: unknown;
}
interface MockFigma { figma: { variables: unknown; fileKey: string }; cols: MockCollection[]; vars: MockVariable[] }

// Minimal stand-in for figma.variables: collections with modes, typed variables, values per mode, aliases.
function mockFigma(): MockFigma {
  let n = 0;
  const cols: MockCollection[] = [];
  const vars: MockVariable[] = [];
  const variables = {
    getLocalVariableCollectionsAsync: () => Promise.resolve([...cols]),
    getLocalVariablesAsync: () => Promise.resolve([...vars]),
    createVariableCollection(name: string) {
      const c: MockCollection = {
        id: `c${++n}`, name, hiddenFromPublishing: false, modes: [{ modeId: `m${++n}`, name: 'Mode 1' }],
        renameMode(id, to) { must(this.modes.find((m) => m.modeId === id), `mode ${id}`).name = to; },
        addMode(to) { const modeId = `m${++n}`; this.modes.push({ modeId, name: to }); return modeId; },
      };
      cols.push(c);
      return c;
    },
    createVariable(name: string, col: MockCollection, resolvedType: string) {
      const v: MockVariable = {
        id: `v${++n}`, name, variableCollectionId: col.id, resolvedType, valuesByMode: {}, scopes: [], codeSyntax: {},
        setValueForMode(m, value) { this.valuesByMode[m] = value; },
        setVariableCodeSyntax(platform, code) { this.codeSyntax[platform] = code; },
      };
      vars.push(v);
      return v;
    },
    createVariableAlias: (v: MockVariable) => ({ type: 'VARIABLE_ALIAS', id: v.id }),
  };
  return { figma: { variables, fileKey: 'file-1' }, cols, vars };
}
function run<T>(script: string, mock: MockFigma): Promise<T> { return new AsyncFunction('figma', script)<T>(mock.figma); }
async function readAll(model: FigmaModel, mock: MockFigma, detail?: string): Promise<VerifyReadback> {
  const r = await run<VerifyReadback>(verifyScript(model, { detail }), mock);
  assert.ok(Buffer.byteLength(JSON.stringify(r)) < 48000, 'verify fits the use_figma return limit (48,000 bytes)');
  return r;
}
async function pushAll(model: FigmaModel, mock: MockFigma): Promise<PushReport[]> {
  const reports: PushReport[] = [];
  for (const part of variableParts(model)) reports.push(await run<PushReport>(variablesScript(part, model.hash), mock));
  return reports;
}

test('FG1 variables model: one collection per theme axis (default mode first) plus foundation, semantic, component; every token once', async () => {
  const model = await figmaModel(REF);
  const names = model.collections.map((c) => c.name);
  for (const n of ['Primitives - Color', 'Primitives - Global', 'Semantic - Color', 'Semantic - Global', 'Semantic - Typography', 'Components']) assert.ok(names.includes(n), n);
  assert.deepEqual(names, COLLECTION_ORDER.filter((n) => names.includes(n)), 'collections in Layer - Domain order');
  assert.deepEqual(must(model.collections.find((c) => c.name === 'Semantic - Color'), 'Semantic - Color').modes, ['Light', 'Dark']);
  for (const c of model.collections) assert.equal(c.hidden, c.name.startsWith('Primitives'), `${c.name}: only primitives are hidden`);
  for (const c of model.collections) { const n = c.variables.map((v) => v.name); assert.equal(new Set(n).size, n.length, `${c.name}: names are unique`); }
  for (const v of must(model.collections.find((c) => c.name === 'Semantic - Color'), 'Semantic - Color').variables) assert.match(v.name, /^Color\/(Background|Text|Stroke)\//, v.name);
  const seen = new Map<string, string>();
  const keys = new Set(model.collections.flatMap((c) => c.variables.map((v) => `${c.name}::${v.name}`)));
  for (const c of model.collections) for (const v of c.variables) {
    assert.ok(!seen.has(v.token), `${v.token} in ${seen.get(v.token)} and ${c.name}`);
    seen.set(v.token, c.name);
    assert.match(v.code, v.token.startsWith('text-style.') ? /^(var\(--[a-z0-9-]+\)|calc\(.+\)|-?[\d.]+px)$/ : /^var\(--[a-z0-9]+-[a-z0-9-]+\)$/, v.token);
    assert.ok(!v.scopes.includes('ALL_SCOPES'), v.token);
    assert.deepEqual(Object.keys(v.values).sort(), [...c.modes].sort(), `${v.token} has a value for every mode`);
    for (const val of Object.values(v.values)) if (typeof val === 'object' && val !== null && 'alias' in val && val.alias) assert.ok(keys.has(`${val.alias.collection}::${val.alias.name}`), `${v.token} -> ${val.alias.collection}/${val.alias.name}`);
  }
  assert.ok(model.styles.text.length > 0 && model.styles.effect.length > 0);
  assert.deepEqual(model.skipped, [], 'no token is left out');
  assert.deepEqual((await coverage(REF, model)).missing, [], 'every spec token reaches the file: a variable, a text style or an effect style');
  for (const e of model.styles.effect) for (const l of e.layers) for (const n of Object.values(l.bind)) assert.ok(keys.has(n), `${e.name}: ${n}`);
  for (const t of model.styles.text) {
    assert.deepEqual(Object.keys(t.bind).sort(), ['fontFamily', 'fontSize', 'fontWeight', 'letterSpacing', 'lineHeight'], `${t.name} binds every field`);
    for (const n of Object.values(t.bind)) assert.ok(keys.has(n), `${t.name}: ${n} is a variable`);
  }
});

test('FG2 round trip: push every part into a mock file, read it back for every combination, compare with the spec', sourceRepoOnly, async () => {
  const model = await figmaModel(ROOT);
  const mock = mockFigma();
  const first = await pushAll(model, mock);
  assert.deepEqual(first.flatMap((r) => r.errors), []);
  assert.equal(first.reduce((n, r) => n + r.created, 0), model.collections.reduce((n, c) => n + c.variables.length, 0));
  const again = await pushAll(model, mock);
  assert.equal(again.reduce((n, r) => n + r.created, 0), 0, 'a second push creates nothing (upsert by name)');
  const snap = snapshotOf(model);
  assert.deepEqual(variableParts(model, snap), [], 'nothing changed since the snapshot: no parts');
  const changed = structuredClone(snap);
  must(changed.Components, 'Components snapshot').vars['Button/radius'] = 'old';
  assert.deepEqual(variableParts(model, changed).flatMap((p) => p.variables.map((v) => v[0])), ['Button/radius'], 'only the changed variable is written');
  assert.equal(must(mock.cols.find((c) => c.name === 'Semantic - Shape'), 'Semantic - Shape in the file').modes.length, must(model.collections.find((c) => c.name === 'Semantic - Shape'), 'Semantic - Shape').modes.length);

  // The model equals the spec for every combination (same engine as the code build) ...
  const byKey = new Map(model.collections.flatMap((c) => c.variables.map((v) => [`${c.name}::${v.name}`, v])));
  const themes = Object.fromEntries(model.combos.map((c) => [c.key, Object.fromEntries([...resolveModel(model, c.modes)].map(([k, v]) => [must(byKey.get(k), k).token, must(byKey.get(k), k).percent ? Number(v) / 100 : v]))]));
  const spec = await compareReadback(ROOT, { hash: model.hash, themes });
  assert.deepEqual(spec.mismatches, []);
  assert.ok(spec.compared > 10000, `compared ${spec.compared}`);
  // ... and the file equals the model: one digest per combination.
  assert.deepEqual(compareDigests(model, await readAll(model, mock)).mismatches, []);

  const shape = must(mock.cols.find((c) => c.name === 'Semantic - Shape'), 'Semantic - Shape in the file');
  const round = must(shape.modes.find((m) => m.name === 'Round'), 'Round mode').modeId;
  must(mock.vars.find((v) => v.name === 'Radius/control' && v.variableCollectionId === shape.id), 'Radius/control').valuesByMode[round] = 3;
  const drift = compareDigests(model, await readAll(model, mock));
  assert.ok(drift.mismatches.length > 0 && drift.mismatches.every((m) => m.token === '(combination)' && m.mode.includes('Round')), 'only Round combinations differ');
  const detail = compareDigests(model, await readAll(model, mock, 'Dark | Round | Compact'));
  const hit = detail.mismatches.filter((m) => m.mode === 'Dark | Round | Compact').map((m) => m.token);
  assert.ok(hit.includes('Semantic - Shape/Radius/control') && hit.includes('Components/Button/radius'), `the drift reaches the component alias: ${hit.join(', ')}`);
});

test('FG3 value comparison normalizes colors and numbers', () => {
  assert.equal(sameValue('color', '#FFF', '#ffffff'), true);
  assert.equal(sameValue('color', '#000000ff', '#000000'), true);
  assert.equal(sameValue('color', 'rgb(255, 0, 0)', '#FF0000'), true);
  assert.equal(sameValue('color', '#FFFFFF', '#FAFAFA'), false);
  assert.equal(sameValue('spacing', 16, '16px'), true);
  assert.equal(sameValue('number', '1.5', 1.5), true);
  assert.equal(sameValue('sizing', '15', '16px'), false);
  assert.equal(sameValue('fontFamilies', ['Inter', 'sans-serif'], "'Inter', sans-serif"), true);
  assert.equal(sameValue('shadow', 'x', 'y'), null);
  assert.equal(sameValue('color', null, '#fff'), false);
});

test('FG4 CLI: sync verify writes verify.js; --ingest writes verify.json that D1 reads', async () => {
  const dir = await fixture();
  const cli = (...args: string[]): CliResult<{ changed: string[]; data: { mismatches: Mismatch[] } }> => { const r = spawnSync('node', [join(ROOT, 'harness/cli.mjs'), ...args, '--json'], { cwd: dir, encoding: 'utf8' }); return { code: r.status, json: parseJson(r.stdout) }; };
  for (const args of [['verify'], ['--verify']]) {
    const v = cli('sync', ...args);
    assert.equal(v.code, 0, args.join(' '));
    assert.deepEqual(v.json.changed, ['generated/design/figma/verify.js']);
  }
  assert.equal(cli('sync', 'tokens', '--verify').code, 1);
  assert.equal(cli('sync', 'verify', '--ingest', 'nope.json').code, 1);
  assert.equal(cli('sync', 'stamp', 'tokens').code, 0);

  const model = await figmaModel(dir);
  const mock = mockFigma();
  await pushAll(model, mock);
  const light = must(must(mock.cols.find((c) => c.name === 'Semantic - Color'), 'Semantic - Color in the file').modes.find((m) => m.name === 'Light'), 'Light mode').modeId;
  must(mock.vars.find((v) => v.name === 'Color/Background/background'), 'Color/Background/background').valuesByMode[light] = { r: 0, g: 0, b: 0, a: 1 };
  const mode0 = must(model.combos[0], 'first combination').key;
  await writeFile(join(dir, 'readback.json'), JSON.stringify(await readAll(model, mock, mode0)));
  const verifyFile = () => readFile(join(dir, 'generated/design/verify.json'), 'utf8').catch(() => null);
  const before = await verifyFile();
  const dry = cli('sync', 'verify', '--ingest', 'readback.json', '--dry-run');
  assert.ok(dry.json.data.mismatches.length > 0);
  assert.equal(await verifyFile(), before, 'dry run writes nothing');
  assert.equal(cli('sync', 'verify', '--ingest', 'readback.json').code, 0);
  const written = parseJson<{ mismatches: Mismatch[] }>(await readFile(join(dir, 'generated/design/verify.json'), 'utf8'));
  assert.ok(written.mismatches.some((m) => m.token === 'Semantic - Color/Color/Background/background' && m.mode === mode0 && m.design === '#000000' && m.spec === '#FFFFFF'), JSON.stringify(written.mismatches.slice(0, 3)));
  const d1 = must((await runChecks(dir, { only: ['D1'] })).results.find((x) => x.id === 'D1'), 'D1 result');
  assert.ok(d1.errors.some((e) => e.token === 'Semantic - Color/Color/Background/background'), 'D1 fails on the mismatch');

  must(mock.vars.find((v) => v.name === 'Color/Background/background'), 'Color/Background/background').valuesByMode[light] = { type: 'VARIABLE_ALIAS', id: must(mock.vars.find((v) => v.name === 'Color/white'), 'Color/white').id };
  await writeFile(join(dir, 'readback.json'), JSON.stringify(await readAll(model, mock)));
  assert.equal(cli('sync', 'verify', '--ingest', 'readback.json').json.data.mismatches.length, 0);
  assert.equal(must((await runChecks(dir, { only: ['D1'] })).results.find((x) => x.id === 'D1'), 'D1 result').errors.length, 0);
  await rm(dir, { recursive: true });
});

test('FG5 generic planner: every contract gets a plan, and each binding is one of its own tokens', sourceRepoOnly, async () => {
  const names = (await readdir(join(ROOT, 'spec/components'), { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
  assert.ok(names.length >= 35);
  const walk = (n: PlanNode): PlanNode[] => [n, ...n.children.flatMap(walk)];
  for (const name of names) {
    const c = await contractOf(ROOT, name);
    const plan = genericPlan(c, name);
    assert.equal(plan.length, libraryVariants(c, name).length || 1, `${name}: one plan per variant`);
    for (const { tree } of plan) for (const n of walk(tree)) for (const b of n.bindings) assert.ok(b.token in (c.tokens ?? {}), `${name}: ${b.token} is a token of its contract`);
  }
  const checkbox = must(genericPlan(await contractOf(ROOT, 'checkbox'), 'checkbox')[0], 'checkbox plan').tree;
  const label = must([checkbox, ...checkbox.children].find((n) => n.part === 'label'), 'checkbox label');
  assert.equal(label.kind, 'text');
  assert.ok(label.bindings.some((b) => b.props.includes('fills')), 'the label text takes its foreground token');
});

test('FG9 library model: every component yields its grid, each binding is a token of its contract, recipes keep their counts', async () => {
  const { libraryModel } = await import('../lib/design/library.mjs');
  const { SCALE_BINDINGS } = await import('../lib/design/recipes.mjs');
  const names = (await readdir(join(REF, 'spec/components'), { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
  const walk = (n: LayerNode): LayerNode[] => [n, ...(n.kids ?? []).flatMap(walk)];
  const counts: Record<string, number> = {};
  for (const name of names) {
    const c = await contractOf(REF, name);
    const L = await libraryModel(REF, name);
    counts[name] = L.variants.length;
    assert.ok(L.variants.length >= 1, `${name}: at least one variant`);
    for (const { tree } of L.variants) for (const n of walk(tree)) for (const [bound] of n.b) { const token = must(bound, `${name} ${n.p} binding`); assert.ok(token in (c.tokens ?? {}) || token.startsWith('text-style.') || (SCALE_BINDINGS[name] ?? []).includes(token), `${name}: ${token} is a token of its contract`); }
  }
  assert.deepEqual([counts.button, counts.input, counts.checkbox, counts.switch, counts.toggle, counts['toggle-group'], counts['radio-group'], counts.spinner, counts.textarea, counts['native-select'], counts.field, counts['input-group'], counts.label, counts.slider], [220, 6, 18, 24, 48, 48, 6, 1, 6, 12, 4, 4, 2, 12]);
  const axes = (await libraryModel(REF, 'button')).axes.map((a) => a.name);
  assert.deepEqual(axes, ['Variant', 'Size', 'State', 'Disabled'], 'axis names come from the registry');
});

test('FG10 descriptions: every component gets a sectioned, bounded, deterministic description built from its source files, and its Behavior text is part of the stamp hash', sourceRepoOnly, async () => {
  const { describeComponent } = await import('../lib/design/description.mjs');
  const { contractHash, mdOf } = await import('../lib/design/components.mjs');
  const { libraryModel } = await import('../lib/design/library.mjs');
  const names = (await readdir(join(ROOT, 'spec/components'), { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
  for (const name of names) {
    const contract = await contractOf(ROOT, name);
    const md = await mdOf(ROOT, name);
    const L = await libraryModel(ROOT, name);
    const make = () => describeComponent({ contract, md, name, title: L.title, axes: L.axes });
    const text = make();
    assert.equal(text, make(), `${name}: deterministic`);
    assert.ok(text.startsWith(`**${L.title}**`) && text.includes(contract.summary.replace(/<([^>]+)>/g, '$1').replace(/\s+/g, ' ').trim()), `${name}: title and summary`);
    assert.ok(text.includes('**In the design file.**') && text.includes(`spec/components/${name}/contract.json`), `${name}: design and source sections`);
    assert.ok(text.length < 3200, `${name}: bounded (${text.length})`);
    assert.doesNotMatch(text, /[<>]/, `${name}: no angle brackets`);
    assert.doesNotMatch(text.replace(/\*\*/g, ''), /\*/, `${name}: no lone asterisk (Figma escapes it, so the read-back would differ)`);  }
  const contract = await contractOf(ROOT, 'slider');
  const md = await mdOf(ROOT, 'slider');
  assert.notEqual(contractHash(contract, md), contractHash(contract, md.replace(/^### Behavior\s*\n/m, '### Behavior\nChanged. ')), 'a Behavior edit makes the stamp stale');
  assert.equal(contractHash(contract, md), contractHash(contract, `${md}\n## Other\nunrelated`), 'other prose does not');
});

test('FG11 library verify: every variant has well-formed expected node lines, a matching page passes, and a drifted binding is named by node and field', sourceRepoOnly, async () => {
  const { libraryScripts, LINE_FIELDS } = await import('../adapters/design/figma/library.mjs');
  const names = (await readdir(join(ROOT, 'spec/components'), { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
  for (const name of names) {
    const r = await libraryScripts(ROOT, name);
    for (const [variant, lines] of r.lineSets) {
      assert.ok(lines[0]?.startsWith('@|COMPONENT|'), `${name}/${variant}: starts at the component`);
      for (const l of lines) assert.equal(l.split('|').length, LINE_FIELDS.length, `${name}/${variant}: ${l}`);
    }
  }

  const scriptOf = async (opts?: { detail?: string }) => must((await libraryScripts(ROOT, 'label', opts)).scripts.find((s) => s.file === 'label.verify.js'), 'label.verify.js').script;
  const node = (type: string, name: string, extra: Record<string, unknown> = {}): MockNode => ({ type, name, visible: true, opacity: 1, fills: [], strokes: [], boundVariables: {}, effectStyleId: '', componentPropertyReferences: {}, ...extra });
  const comp = (name: string, fillVar: string, dimVar: string | null) => node('COMPONENT', name, {
    boundVariables: dimVar ? { opacity: { id: dimVar } } : {},
    children: [node('TEXT', 'label-text', { fills: [{ boundVariables: { color: { id: fillVar } } }], textStyleId: 's1' })],
  });
  const page = (fillVar: string) => {
    const set = node('COMPONENT_SET', 'Label', { descriptionMarkdown: null, children: [comp('Disabled=False', fillVar, null), comp('Disabled=True', fillVar, 'v3')], componentPropertyDefinitions: { Disabled: { type: 'VARIANT', variantOptions: ['False', 'True'] } } });
    return { name: 'Library', children: [set], set };
  };
  const run = async <T,>(lib: unknown, script: string): Promise<T> => {
    const figma = {
      root: { children: [lib] },
      setCurrentPageAsync: async () => {},
      variables: { getLocalVariableCollectionsAsync: () => Promise.resolve([{ id: 'c1', name: 'Components' }]), getLocalVariablesAsync: () => Promise.resolve([{ id: 'v1', name: 'Label/fg', variableCollectionId: 'c1' }, { id: 'v2', name: 'Label/other', variableCollectionId: 'c1' }, { id: 'v3', name: 'Label/disabled-opacity', variableCollectionId: 'c1' }]) },
      getLocalTextStylesAsync: () => Promise.resolve([{ id: 's1', name: 'Text/Control' }]),
      getLocalEffectStylesAsync: () => Promise.resolve([]),
    };
    return new AsyncFunction('figma', script)<T>(figma);
  };
  const good = page('v1');
  const description = must(/"description":"((?:[^"\\]|\\.)*)"/.exec(await scriptOf()), 'description in label.verify.js');
  good.set.descriptionMarkdown = parseJson<string>(`"${description[1]}"`);
  const ok = await run<SetVerify>(good, await scriptOf());
  assert.equal(ok.ok, true, JSON.stringify(ok.problems));
  const drifted = page('v2');
  drifted.set.descriptionMarkdown = good.set.descriptionMarkdown;
  const bad = await run<SetVerify>(drifted, await scriptOf({ detail: 'Disabled=False' }));
  assert.equal(bad.ok, false);
  assert.match(bad.problems.join(' '), /2 of 2 variant\(s\) differ from the contract tokens/);
  assert.deepEqual(bad.detail, ['label-text fill: expected Components::Label/fg, actual Components::Label/other']);

  const { verifyAllScript } = await import('../adapters/design/figma/library.mjs');
  const all = await verifyAllScript(ROOT, ['label']);
  assert.deepEqual(await run<SetVerify[]>(good, all), [{ title: 'Label', ok: true, checked: 2, problems: [] }]);
  const drift = await run<SetVerify[]>(drifted, all);
  assert.equal(must(drift[0], 'Label read-back').ok, false);
  assert.match(must(drift[0], 'Label read-back').problems.join(' '), /differ from the contract tokens/);
});

test('FG12 Figma/code parity: every token the library model binds is a CSS variable the component styles use', sourceRepoOnly, async () => {
  const { parityOf } = await import('../lib/design/parity.mjs');
  const names = (await readdir(join(ROOT, 'spec/components'), { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
  for (const name of names) {
    const p = await parityOf(ROOT, name);
    if (!p) continue;
    assert.deepEqual(p.notInCss, [], `${name}: drawn in the design file but not styled by the component`);
  }
});

test('FG13 repeating parts: the Slider draws a hidden second thumb and track that the Range property shows, and no other component gets one', sourceRepoOnly, async () => {
  const { libraryModel } = await import('../lib/design/library.mjs');
  const walk = (n: LayerNode): LayerNode[] => [n, ...(n.kids ?? []).flatMap(walk)];
  const slider = await libraryModel(ROOT, 'slider');
  assert.equal(slider.variants.length, 12, 'Range is a property, not an axis');
  for (const { tree } of slider.variants) {
    const extra = walk(tree).filter((n) => n.sh === 'Range');
    assert.deepEqual(extra.map((n) => [n.p, n.v]), [['track-start', 0], ['thumb-start', 0]]);
  }
  const switchModel = await libraryModel(ROOT, 'switch');
  assert.equal(switchModel.variants.flatMap((v) => walk(v.tree)).filter((n) => n.sh === 'Range').length, 0);
});

test('FG14 generated scripts pass their own checksum guards (finish, describe, verify) for every component', sourceRepoOnly, async () => {
  const { libraryScripts, describeScripts } = await import('../adapters/design/figma/library.mjs');
  const names = (await readdir(join(ROOT, 'spec/components'), { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
  const run = async (script: string) => {
    const page: { name: string; children: unknown[] } = { name: 'Library', children: [] };
    const figma = { root: { children: [page] }, setCurrentPageAsync: async () => {}, variables: { getLocalVariableCollectionsAsync: () => Promise.resolve([]), getLocalVariablesAsync: () => Promise.resolve([]) }, getLocalTextStylesAsync: () => Promise.resolve([]), getLocalEffectStylesAsync: () => Promise.resolve([]) };
    return new AsyncFunction('figma', script)<unknown>(figma);
  };
  const guard = (e: unknown) => /checksum mismatch/.test(String(typeof e === 'object' && e !== null && 'message' in e ? e.message : undefined));
  for (const name of names) {
    const r = await libraryScripts(ROOT, name);
    for (const s of r.scripts.filter((x) => /\.(finish|verify)\.js$/.test(x.file))) {
      let failed: unknown = null;
      try { await run(s.script); } catch (e) { failed = e; }
      assert.ok(!guard(failed), `${name}: ${s.file} fails its own checksum guard`);
    }
  }
  for (const s of await describeScripts(ROOT, names)) {
    let failed: unknown = null;
    try { await run(s.script); } catch (e) { failed = e; }
    assert.ok(!guard(failed), `${s.file} fails its own checksum guard`);
  }
});

test('FG15 Checkbox and Switch follow the anatomy and the styles: control wraps the input, and disabled dims the box, thumb and label but not the description or error', sourceRepoOnly, async () => {
  const { libraryModel } = await import('../lib/design/library.mjs');
  const { parityOf } = await import('../lib/design/parity.mjs');
  const walk = (n: LayerNode): LayerNode[] => [n, ...(n.kids ?? []).flatMap(walk)];
  const dimmed = (n: LayerNode) => n.b.some(([, f]) => f === 'opacity');
  for (const name of ['checkbox', 'switch']) {
    const L = await libraryModel(ROOT, name);
    for (const { props, tree } of L.variants) {
      const kids = must(tree.kids, `${name} layers`);
      const control = must(kids[0], `${name} control`), content = must(kids[1], `${name} content`);
      assert.equal(control.p, 'control', `${name}: control first`);
      assert.deepEqual(must(control.kids, `${name} control layers`).map((k) => k.p), ['input'], `${name}: control holds the input`);
      const off = walk(tree).filter(dimmed).map((n) => n.p).sort();
      assert.deepEqual(off, props.Disabled === 'True' ? ['input', 'label'] : [], `${name} ${JSON.stringify(props)}: what disabled dims`);
      assert.ok(!dimmed(tree) && !must(content.kids, `${name} content layers`).filter((k) => k.p !== 'label').some(dimmed), `${name}: field, description and error stay`);
    }
    const p = must(await parityOf(ROOT, name), `${name} parity`);
    assert.deepEqual([p.layersNotInAnatomy, p.anatomyNotDrawn], [[], []], `${name}: every layer is an anatomy part or registered in layers`);
  }
});

test('FG16 RadioGroup and ToggleGroup follow the styles: a focus state on the selected radio, items dimmed one by one, and a joined toggle bar with no group gap and square inner corners', sourceRepoOnly, async () => {
  const { libraryModel } = await import('../lib/design/library.mjs');
  const walk = (n: LayerNode): LayerNode[] => [n, ...(n.kids ?? []).flatMap(walk)];
  const radio = await libraryModel(ROOT, 'radio-group');
  assert.deepEqual(radio.axes.map((a) => a.name), ['Orientation', 'State', 'Disabled']);
  const focus = must(radio.variants.find((v) => v.props.State === 'Focus'), 'radio Focus variant');
  const rings = walk(focus.tree).filter((n) => n.ring);
  assert.deepEqual(rings.map((n) => n.p), ['focus-ring'], 'one focus ring layer');
  assert.ok(walk(must(must(focus.tree.kids, 'radio items')[0], 'first radio item')).some((n) => n.p === 'control' && must(n.kids, 'control layers').some((k) => k.p === 'focus-ring')), 'on the first item control');
  const off = must(radio.variants.find((v) => v.props.Disabled === 'True'), 'radio disabled variant');
  assert.deepEqual(walk(off.tree).filter((n) => n.b.some(([, f]) => f === 'opacity')).map((n) => n.p), ['item', 'item', 'item'], 'each item is dimmed, not the group');
  const bar = await libraryModel(ROOT, 'toggle-group');
  for (const { props, tree } of bar.variants) {
    if (props.Spacing === '2') {
      assert.deepEqual(tree.b.filter(([, f]) => f === 'gap'), [['space.2', 'gap']], `${JSON.stringify(props)}: the gap is the scale's step 2 (SB-0121)`);
      assert.ok(must(tree.kids, 'toggle items').every((k) => !k.sq?.length), `${JSON.stringify(props)}: separate items keep every corner and border`);
      continue;
    }
    assert.ok(!tree.b.some(([, f]) => f === 'gap'), `${JSON.stringify(props)}: no group gap (spacing 0 joins the items)`);
    const row = props.Orientation === 'Horizontal';
    const [first, middle, last] = must(tree.kids, 'toggle items').map((k) => k.sq);
    const radii = (list: string[] | undefined) => must(list, 'item corners').filter((f) => /Radius$/.test(f));
    const edge = row ? 'strokeLeftWeight' : 'strokeTopWeight';
    assert.deepEqual(first, row ? ['topRightRadius', 'bottomRightRadius'] : ['bottomLeftRadius', 'bottomRightRadius']);
    assert.equal(radii(middle).length, 4);
    assert.deepEqual(radii(last), row ? ['topLeftRadius', 'bottomLeftRadius'] : ['topLeftRadius', 'topRightRadius']);
    const bordered = props.Variant === 'Tertiary';
    assert.equal(must(middle, 'middle corners').includes(edge), bordered, `${JSON.stringify(props)}: a bordered item drops the edge it shares with the previous one`);
    assert.equal(must(last, 'last corners').includes(edge), bordered);
    assert.ok(!must(first, 'first corners').includes(edge), 'the first item keeps all its borders');
  }
  const group = await libraryModel(ROOT, 'button-group');
  for (const { props, tree } of group.variants) {
    const edge = props.Orientation === 'Horizontal' ? 'strokeLeftWeight' : 'strokeTopWeight';
    assert.deepEqual(must(tree.kids, 'group buttons').map((k) => must(k.sq, `${k.p} corners`).includes(edge)), [false, true, true], `${JSON.stringify(props)}: joined buttons share one border line`);
  }
});

test('FG40 a transparent border (strokeTr) is a hidden paint, not opacity 0: a stroke bound to a color variable resets its opacity to 1', sourceRepoOnly, async () => {
  const { libraryScripts } = await import('../adapters/design/figma/library.mjs');
  const build = must((await libraryScripts(ROOT, 'item')).scripts.find((s) => /\.build-\d+\.js$/.test(s.file)), 'item build script').script;
  const line = must(build.split('\n').find((l) => l.includes("field === 'strokeTr'")), 'the strokeTr branch');
  assert.ok(line.includes('visible: false') && !line.includes('opacity: 0'), line.trim());
});

test('FG39 Typography follows its display: block kinds are a column that fills and wraps its text, inline code and small hug', sourceRepoOnly, async () => {
  const { libraryModel } = await import('../lib/design/library.mjs');
  const inline = new Set(['Inline code', 'Small']);
  for (const { props, tree } of (await libraryModel(ROOT, 'typography')).variants) {
    const kind = String(props.Kind);
    if (inline.has(kind)) assert.ok(tree.d === 'r' && tree.hug, `${kind}: inline, hugs its text`);
    else assert.ok(tree.d === 'c' && !tree.hug, `${kind}: display block, so the text fills the width and wraps`);
  }
});

test('FG17 disabled dims what the styles dim: the control of a field (Input, Textarea, NativeSelect, Slider), the label of a Label', sourceRepoOnly, async () => {
  const { libraryModel } = await import('../lib/design/library.mjs');
  const walk = (n: LayerNode): LayerNode[] => [n, ...(n.kids ?? []).flatMap(walk)];
  const dimmed = (n: LayerNode) => n.b.some(([, f]) => f === 'opacity');
  const expected: Record<string, string[]> = { input: ['input'], textarea: ['textarea'], 'native-select': ['select'], slider: ['control'], label: ['label'] };
  for (const [name, layers] of Object.entries(expected)) {
    const L = await libraryModel(ROOT, name);
    for (const { props, tree } of L.variants) assert.deepEqual(walk(tree).filter(dimmed).map((n) => n.p), props.Disabled === 'True' ? layers : [], `${name} ${JSON.stringify(props)}`);
  }
});

test('FG18 focus ring: one ring layer per focused variant, built from the ring tokens, replacing the shadow; a field takes the ring color as its border, an invalid one mixes the error color to 20%', sourceRepoOnly, async () => {
  const { libraryModel } = await import('../lib/design/library.mjs');
  const { INVALID_RING_ALPHA } = await import('../lib/design/recipes.mjs');
  const walk = (n: LayerNode): LayerNode[] => [n, ...(n.kids ?? []).flatMap(walk)];
  const borderRing = new Set(['input', 'textarea', 'native-select', 'input-group', 'checkbox', 'switch']);
  const names = ['button', 'toggle', 'radio-group', 'slider', ...borderRing];
  for (const name of names) {
    const L = await libraryModel(ROOT, name);
    for (const { props, tree } of L.variants) {
      const nodes = walk(tree);
      const rings = nodes.filter((n) => n.p === 'focus-ring');
      const focused = props.State === 'Focus';
      assert.equal(rings.length, focused ? 1 : 0, `${name} ${JSON.stringify(props)}: ring layers`);
      if (!focused) continue;
      const ring = must(rings[0], `${name} ring`);
      const invalid = props.Validation === 'Error' && borderRing.has(name);
      const tokens = ring.b.map(([t]) => must(t, `${name} ring token`).split('.').slice(1).join('.'));
      assert.deepEqual(tokens.sort(), [invalid ? 'border-invalid' : 'focus-ring.color', 'focus-ring.width', 'radius', 'track.radius'].filter((t) => tokens.includes(t)).sort(), `${name}: ring tokens`);
      assert.ok(ring.abs && ring.ring, `${name}: absolute, outside stroke`);
      assert.equal(ring.op, invalid ? INVALID_RING_ALPHA : undefined, `${name}: 20% only when invalid`);
      const control = must(nodes.find((n) => n.kids?.includes(ring)), `${name} ring parent`);
      assert.ok(!control.b.some(([, f]) => f === 'effect'), `${name}: the ring replaces the shadow`);
      const stroke = control.b.find(([, f]) => f === 'stroke')?.[0];
      if (borderRing.has(name) && !invalid) assert.ok(/focus-ring\.color$/.test(String(stroke)), `${name}: border takes the ring color`);
    }
  }
});

test('FG19 element sets: a component is followed by the elements it draws, each bound only to its component\'s tokens; the Field family leaves no styled token undrawn', sourceRepoOnly, async () => {
  const { libraryModel } = await import('../lib/design/library.mjs');
  const { parityOf } = await import('../lib/design/parity.mjs');
  const { loadApi, withSets } = await import('../lib/api.mjs');
  const api = must(loadApi(ROOT), 'spec/api.json');
  assert.deepEqual(withSets(api, ['field', 'button']), ['field', 'field/field-set', 'field/field-group', 'field/field-separator', 'field/field-title', 'button']);
  const walk = (n: LayerNode): LayerNode[] => [n, ...(n.kids ?? []).flatMap(walk)];
  for (const key of Object.keys(must(api.sets, 'api sets'))) {
    const name = key.replace('.', '/');
    const [folder] = name.split('/');
    const tokens = (await contractOf(ROOT, must(folder, key))).tokens;
    const L = await libraryModel(ROOT, name);
    assert.ok(L.variants.length >= 1, `${name}: drawn`);
    for (const { tree } of L.variants) for (const n of walk(tree)) for (const [bound] of n.b) { const t = must(bound, `${name} ${n.p} binding`); assert.ok(t in tokens || t.startsWith('text-style.'), `${name}: ${t} is a token of ${folder}`); }
  }
  assert.equal((await libraryModel(ROOT, 'field/field-set')).title, 'FieldSet', 'an element set is named after its element');
  assert.deepEqual((await libraryModel(ROOT, 'tabs/tabs-list')).axes, [{ name: 'Variant', values: ['Primary', 'Line'] }, { name: 'Active', values: ['1', '2', '3'] }]);
  assert.deepEqual(must(await parityOf(ROOT, 'field'), 'field parity').notDrawn, [], 'set, group, legend, separator and title are drawn');
  await assert.rejects(contractOf(ROOT, 'field/field-nowhere'), /has no element "field-nowhere"/);
});

test('FG22 generated scripts fit one use_figma call: every foundation part stays under 50,000 characters, and the Color ramps (brand included) are drawn in a part of their own', sourceRepoOnly, async () => {
  const { foundationScripts } = await import('../adapters/design/figma/docs.mjs');
  const { FOUNDATION_PAGES } = await import('../lib/design/verify.mjs');
  const parts = await foundationScripts(ROOT, FOUNDATION_PAGES);
  for (const part of parts) assert.ok(part.script.length < 50000, `part of ${part.names.join(', ')} is ${part.script.length} characters`);
  assert.ok(parts.some((x) => x.names.includes('Color: ramps')), 'the Color ramps are their own part');
});

test('FG21 zero steps: the semantic layer has a zero per kind; every generated script (library, docs, icons, layout) binds the zero paddings, gaps, corners and unused stroke sides it drew, and verify reports a zero left unbound', sourceRepoOnly, async () => {
  const { libraryScripts } = await import('../adapters/design/figma/library.mjs');
  const all: LoadedTokens = await loadAll(ROOT);
  for (const t of ['space.none', 'radius.square', 'border-width.none', 'opacity.none']) assert.equal(parseFloat(String(resolvedValue(resolve(all.map ?? new Map(all.sets.flatMap((s) => s.tokens.map((x) => [x.path, x]))), t)))), 0, `${t} resolves to 0`);
  const tg = await libraryScripts(ROOT, 'toggle-group');
  const build = must(tg.scripts.find((x) => /build-1/.test(x.file)), 'toggle-group build-1').script;
  const Z = parseJson<Record<string, string>>(must(/"Z":(\{[^}]*\})/.exec(build)?.[1], 'Z in build-1'));
  assert.deepEqual(Object.keys(Z), ['radius', 'border', 'space']);
  for (const v of Object.values(Z)) assert.ok(v && v.includes('::'), `zero variable ${v} reaches the file`);
  const { layoutScript } = await import('../adapters/design/figma/library.mjs');
  const { guideScript, foundationScripts } = await import('../adapters/design/figma/docs.mjs');
  const { iconScripts } = await import('../adapters/design/figma/icons.mjs');
  const { FOUNDATION_PAGES } = await import('../lib/design/verify.mjs');
  const generated = {
    build, finish: must(tg.scripts.find((x) => /finish/.test(x.file)), 'toggle-group finish').script, layout: await layoutScript(ROOT, ['button']),
    guide: await guideScript(ROOT), foundations: must((await foundationScripts(ROOT, FOUNDATION_PAGES))[0], 'first foundation part').script, icons: must((await iconScripts(ROOT))[0], 'first icon script'),
  };
  for (const [kind, script] of Object.entries(generated)) {
    assert.match(script, /const bindZeros = async/, `${kind}: carries the zero runtime`);
    assert.match(script, /await bindZeros\(/, `${kind}: binds the zeros it drew`);
    for (const v of Object.values(Z)) assert.ok(script.includes(v), `${kind}: names ${v}`);
  }
  const r = await libraryScripts(ROOT, 'separator');
  const script = must(r.scripts.find((x) => x.file === 'separator.verify.js'), 'separator.verify.js').script;
  const zeroVar = must(r.expected.zero[0], 'separator zero').split('::');
  const corner = (bound: boolean) => ({ type: 'FRAME', name: 'probe', layoutMode: 'HORIZONTAL', visible: true, opacity: 1, fills: [], strokes: [], effectStyleId: '', componentPropertyReferences: {}, children: [],
    topLeftRadius: 6, topRightRadius: 0, bottomRightRadius: 0, bottomLeftRadius: 6,
    boundVariables: { topLeftRadius: { id: 'v1' }, bottomLeftRadius: { id: 'v1' }, ...(bound ? { topRightRadius: { id: 'vz' }, bottomRightRadius: { id: 'vz' } } : {}) } });
  const run = async (bound: boolean) => {
    const comp = (name: string) => ({ type: 'COMPONENT', name, visible: true, opacity: 1, fills: [], strokes: [], boundVariables: {}, effectStyleId: '', componentPropertyReferences: {}, children: [corner(bound)] });
    const set = { type: 'COMPONENT_SET', name: 'Separator', visible: true, children: [comp('Orientation=Horizontal'), comp('Orientation=Vertical')], componentPropertyDefinitions: { Orientation: { type: 'VARIANT', variantOptions: ['Horizontal', 'Vertical'] } }, descriptionMarkdown: '' };
    const figma = {
      root: { children: [{ name: 'Library', children: [set] }] }, setCurrentPageAsync: async () => {},
      variables: { getLocalVariableCollectionsAsync: () => Promise.resolve([{ id: 'c1', name: 'Components' }, { id: 'c2', name: zeroVar[0] }]), getLocalVariablesAsync: () => Promise.resolve([{ id: 'v1', name: 'Separator/color', variableCollectionId: 'c1' }, { id: 'vz', name: zeroVar[1], variableCollectionId: 'c2' }]) },
      getLocalTextStylesAsync: () => Promise.resolve([]), getLocalEffectStylesAsync: () => Promise.resolve([]),
    };
    return new AsyncFunction('figma', script)<SetVerify>(figma);
  };
  assert.match((await run(false)).problems.join(' '), /4 zero value\(s\) not bound to a zero token, e\.g\. Orientation=Horizontal: probe topRightRadius/);
  assert.doesNotMatch((await run(true)).problems.join(' '), /zero value/);
});

test('FG22 underlined text: every text role has an underlined twin style; a variant with its own underline offset draws a second label on it, with its own text property, shown on hover', sourceRepoOnly, async () => {
  const { libraryModel } = await import('../lib/design/library.mjs');
  const { libraryScripts } = await import('../adapters/design/figma/library.mjs');
  const { stylesScript } = await import('../adapters/design/figma/variables.mjs');
  const m = await figmaModel(ROOT);
  const base = m.styles.text.filter((t) => !t.token.endsWith('-underline'));
  assert.ok(base.length > 0);
  for (const t of base) {
    const twin = m.styles.text.find((x) => x.token === `${t.token}-underline`);
    assert.ok(twin, `${t.token} has an underlined twin`);
    assert.equal(twin.decoration, 'UNDERLINE');
    assert.equal(t.decoration, 'NONE');
    assert.deepEqual(Object.keys(twin.bind), Object.keys(t.bind), `${twin.name} binds the same fields to its own variables`);
  }
  assert.match(stylesScript(m), /s\.textDecoration = t\.decoration/);
  const walk = (n: LayerNode): LayerNode[] => [n, ...(n.kids ?? []).flatMap(walk)];
  for (const name of ['button', 'badge']) {
    const L = await libraryModel(ROOT, name);
    const labels = (match: (p: Record<string, string>) => boolean) => walk(must(L.variants.find((v) => match(v.props)), `${name} variant`).tree).filter((n) => /^label/.test(n.p));
    const hover = labels((p) => p.Variant === 'Link' && p.State === 'Hover' && (p.Size ?? 'Medium') === 'Medium');
    assert.deepEqual(hover.map((n) => [n.p, n.v, n.tp, Boolean(n.ul)]), [['label', 0, 'Label text', false], ['label-underline', 1, 'Underlined label text', true]], `${name}: link hover shows the underlined label`);
    const rest = labels((p) => p.Variant === 'Link' && p.State === 'Rest' && (p.Size ?? 'Medium') === 'Medium');
    assert.deepEqual(rest.map((n) => [n.p, n.v]), [['label', 1], ['label-underline', 0]]);
    assert.ok(!must(hover.find((n) => n.p === 'label'), `${name} hover label`).sh, `${name}: a hidden label is not bound to a visibility property (it would show)`);
    assert.ok(!must(rest.find((n) => n.p === 'label-underline'), `${name} rest underline`).sh, `${name}: the hidden twin is not bound to a visibility property`);
    assert.deepEqual(labels((p) => p.Variant === 'Primary' && p.State === 'Rest' && (p.Size ?? 'Medium') === 'Medium').map((n) => n.p), ['label'], `${name}: a variant without an underline offset has one label`);
  }
  const r = await libraryScripts(ROOT, 'badge');
  const line = must(must(r.lineSets.get('Variant=Link, State=Hover'), 'badge Link Hover lines').find((l) => l.startsWith('label-underline|')), 'label-underline line');
  assert.match(line, /\|Text\/Caption-underline\|underline\|characters=Underlined label text,visible=Label$/);
});

test('FG23 exposed nested instances: a nested library instance whose component has properties is exposed and named after it with an index; one without properties is not', sourceRepoOnly, async () => {
  const { libraryModel } = await import('../lib/design/library.mjs');
  const { libraryScripts } = await import('../adapters/design/figma/library.mjs');
  const { parityOf } = await import('../lib/design/parity.mjs');
  const walk = (n: LayerNode): LayerNode[] => [n, ...(n.kids ?? []).flatMap(walk)];
  const nestedOf = async (name: string) => walk(must((await libraryModel(ROOT, name)).variants[0], `${name} first variant`).tree).filter((n) => n.k === 'c');
  assert.deepEqual((await nestedOf('toggle-group')).map((n) => [n.p, n.ex]), [['Toggle 1', 1], ['Toggle 2', 1], ['Toggle 3', 1]]);
  assert.deepEqual((await nestedOf('button-group/button-group-separator')).map((n) => [n.p, n.ex]), [['Button 1', 1], ['Button 2', 1]]);
  assert.deepEqual((await nestedOf('button')).map((n) => [n.p, Boolean(n.ex)]), [['spinner', false]], 'Spinner has no properties: not exposed, name kept');
  const r = await libraryScripts(ROOT, 'toggle-group');
  const build = must(r.scripts.find((s) => /\.build-1\.js$/.test(s.file)), 'toggle-group build-1').script;
  assert.match(build, /if \(n\.ex\) node\.isExposedInstance = true/);
  assert.match(build, /"p":"Toggle 1","k":"c","c":"toggle","pr":\{[^}]*\},"sq":\[[^\]]*\],"ex":1/, 'the packed build data carries the exposure');
  assert.ok(must([...r.lineSets.values()][0], 'first line set').some((l) => l.startsWith('Toggle 1|INSTANCE|') && l.endsWith(';exposed')), 'verify expects the exposure');
  assert.deepEqual(must(await parityOf(ROOT, 'toggle-group'), 'toggle-group parity').layersNotInAnatomy, [], 'an exposed instance needs no layer registry entry');
});

test('FG25 theme matrix: a Live column plus the corner combinations (each axis at its ends), one row per drawn set with its representative variants; the scripts pin every axis collection per cell, stay under the paste limit, bind zeros and are checksum-guarded', sourceRepoOnly, async () => {
  const { themeMatrixDoc } = await import('../lib/design/docs.mjs');
  const { themeMatrixScripts } = await import('../adapters/design/figma/docs.mjs');
  const { drawnSets } = await import('../adapters/design/figma/sync.mjs');
  const payload = await tokenPayload(ROOT);
  const groups = [...new Set(payload.themes.map((t) => t.group))];
  const names = await drawnSets(ROOT);
  const d = await themeMatrixDoc(ROOT, names);
  assert.deepEqual(d.columns[0], { name: 'Live', modes: {} });
  const corners = d.columns.slice(1);
  assert.equal(corners.length, 2 ** groups.length);
  for (const g of groups) {
    const values = payload.themes.filter((t) => t.group === g).map((t) => t.name);
    assert.deepEqual([...new Set(corners.map((c) => c.modes[g]))].sort(), [values[0], values.at(-1)].sort(), `${g}: its two ends`);
  }
  assert.equal(new Set(corners.map((c) => JSON.stringify(c.modes))).size, corners.length, 'every corner once');
  assert.equal(d.rows.length, names.length, 'one row per drawn set');
  const row = (t: string) => must(d.rows.find((r) => r.title === t), t);
  assert.deepEqual(row('Button').cells, ['Primary', 'Destructive', 'Tertiary', 'Secondary', 'Ghost', 'Link'].map((v) => `Variant=${v}, Size=Medium, State=Rest, Disabled=False`));
  assert.deepEqual(row('Input').cells, ['State=Rest, Validation=None, Disabled=False']);
  assert.deepEqual(row('Checkbox').cells, ['State=Rest, Selected=False, Indeterminate=False, Validation=None, Disabled=False', 'State=Rest, Selected=True, Indeterminate=False, Validation=None, Disabled=False']);
  assert.deepEqual(row('Kbd').cells, ['Kbd']);
  assert.ok(d.rows.every((r) => r.cells.length >= 1 && r.cells.length <= 6));
  const scripts = await themeMatrixScripts(ROOT, names);
  assert.ok(scripts.length > 1, 'rows are split over several pastes');
  assert.deepEqual(scripts.flatMap((s) => s.rows), d.rows.map((r) => r.title), 'every row once, in order');
  for (const s of scripts) {
    assert.ok(s.script.length < 50000, `${s.file} fits one paste`);
    assert.match(s.script, /checksum mismatch/);
    if (!s.rows.length) continue;
    assert.match(s.script, /setExplicitVariableModeForCollection/);
    assert.match(s.script, /bindZeros\(/);
  }
  const verify = scripts.find((s) => s.file === 'theme-matrix-verify.js');
  assert.ok(verify, 'a read-only read-back');
  assert.match(verify.script, /explicitVariableModes/);
});

test('FG24 native slots: a registered content region is drawn as a slot named after it, never the top layer, with no property bound inside; finish adds one SLOT property per set with its preferred components and verify expects the wiring', sourceRepoOnly, async () => {
  const { libraryModel } = await import('../lib/design/library.mjs');
  const { libraryScripts } = await import('../adapters/design/figma/library.mjs');
  const { parityOf } = await import('../lib/design/parity.mjs');
  const api = parseJson<APIVocabulary>(await readFile(join(ROOT, 'spec/api.json'), 'utf8'));
  const walk = (n: LayerNode): LayerNode[] => [n, ...(n.kids ?? []).flatMap(walk)];
  assert.ok(Object.keys(api.regions ?? {}).length >= 9, 'regions are registered');
  for (const [key, region] of Object.entries(must(api.regions, 'api regions'))) {
    const [component, layer] = key.split('.');
    const L = await libraryModel(ROOT, must(component, key));
    const slots = L.variants.flatMap((v) => walk(v.tree).filter((n) => n.slot === region.name));
    assert.ok(slots.length > 0, `${key} is drawn as a slot`);
    assert.ok(L.variants.every((v) => !v.tree.slot), `${key}: a slot is never the top layer`);
    for (const s of slots) {
      assert.equal(s.p, region.name, `${key}: the layer carries the slot's name (Figma ties them)`);
      assert.equal(s.part, layer);
      assert.ok(walk(s).every((n) => !n.tp && !n.sh && !n.sw && !n.ex), `${key}: nothing inside a slot is bound to a property`);
    }
    assert.deepEqual(L.slots.find((x) => x.name === region.name)?.preferred ?? [], (region.preferred ?? []).map((c) => must(c[0], `${key} preferred`).toUpperCase() + c.slice(1)));
  }
  const r = await libraryScripts(ROOT, 'card');
  const finish = must(r.scripts.find((s) => s.file.endsWith('.finish.js')), 'card finish').script;
  assert.match(finish, /addComponentProperty\(name, 'SLOT', ''/);
  assert.match(finish, /c\.layoutPositioning === 'ABSOLUTE' && \(c\.relativeTransform\[0\]\[0\] < 0 \|\| c\.relativeTransform\[1\]\[1\] < 0\)\) \{ c\.relativeTransform = \[\[1, 0, 0\], \[0, 1, 0\]\]/, 'finish puts a flipped absolute layer back over its variant');
  assert.match(must(r.scripts.find((s) => s.file.endsWith('.verify.js')), 'card verify').script, /with a flipped absolute layer/, 'verify reports a flipped absolute layer');
  assert.match(finish, /"slot":\[\["Content","[^"]+",\[\]\],\["Footer","[^"]+",\["Button"\]\],\["Action","[^"]+",\["Button"\]\]\]/);
  assert.ok(must([...r.lineSets.values()][0], 'first line set').some((l) => l.startsWith('Footer|SLOT|') && l.includes('slotContentId=Footer')), 'verify expects the slot wiring');
  assert.ok(r.expected.props.some(([n, t]) => n === 'Footer' && t === 'SLOT'));
  assert.match(r.description, /Slots: Content, Footer \(prefers Button\)/);
  for (const c of ['card', 'item', 'aspect-ratio', 'direction', 'collapsible']) assert.deepEqual(must(await parityOf(ROOT, c), `${c} parity`).layersNotInAnatomy, [], `${c}: a slot layer is explained by its region`);
});

test('FG6 verify compares every combination: a read-back built from the spec is clean, one drifted value is named by its combination', sourceRepoOnly, async () => {
  const payload = await tokenPayload(ROOT);
  const all = await loadAll(ROOT);
  const brand = parseJson<BrandConfig>(await readFile(join(ROOT, 'brand.config.json'), 'utf8'));
  const combos = comboList(payload);
  assert.equal(combos.length, 24, 'Mode x Shape x Density');
  const themes: Record<string, Record<string, string>> = {};
  for (const combo of combos) {
    const mode = must(combo.themes.find((t) => t.group === 'Mode'), 'Mode theme').name.toLowerCase();
    const map = comboMap(ROOT, all, brand, combo.themes, mode);
    const sets = new Set(combo.themes.flatMap((t) => t.sets));
    const values: Record<string, string> = {};
    for (const s of payload.sets.filter((x) => sets.has(x.name))) {
      for (const t of s.tokens) {
        const r = resolve(map, t.name);
        if (r.error || t.type === 'typography') continue;
        values[t.name] = typeof r.value === 'object' ? JSON.stringify(r.value) : typeof r.value === 'string' && /^-?\d*\.?\d+px$/.test(r.value) ? String(parseFloat(r.value)) : String(resolvedValue(r));
      }
    }
    themes[combo.key] = values;
  }
  const clean = await compareReadback(ROOT, { hash: payload.hash, themes });
  assert.deepEqual(clean.mismatches, []);
  must(themes['Dark | Round | Compact'], 'Dark | Round | Compact')['radius.control'] = '3';
  const drift = await compareReadback(ROOT, { hash: payload.hash, themes });
  assert.deepEqual([...new Set(drift.mismatches.map((m) => `${m.token} @ ${m.mode}`))], ['radius.control @ Dark | Round | Compact']);
  delete themes['Light | Soft | Spacious'];
  assert.ok((await compareReadback(ROOT, { hash: payload.hash, themes })).mismatches.some((m) => m.token === '(theme)' && m.mode === 'Light | Soft | Spacious'), 'a combination that was not read back is reported');
});

test('FG7 progress register: stages move one step at a time, unknown names are refused, notes clear on check, the list is deterministic', sourceRepoOnly, async () => {
  const dir = await fixture();
  await cp(join(ROOT, 'spec/design-docs.json'), join(dir, 'spec/design-docs.json'));
  const cli = (...args: string[]): CliResult<unknown> => { const r = spawnSync('node', [join(ROOT, 'harness/cli.mjs'), ...args, '--json'], { cwd: dir, encoding: 'utf8' }); return { code: r.status, json: parseJson(r.stdout) }; };
  assert.equal(cli('sync', 'stamp', 'doc', 'button').code, 1, 'planned -> doc skips library');
  assert.equal(cli('sync', 'stamp', 'library', 'button').code, 0);
  assert.equal(cli('sync', 'stamp', 'checked', 'button').code, 1, 'library -> checked skips doc');
  assert.equal(cli('sync', 'stamp', 'doc', 'button').code, 0);
  assert.equal(cli('sync', 'stamp', 'library', 'nope').code, 1, 'unknown component');
  assert.equal(cli('sync', 'stamp', 'note', 'button', 'Matrix is too wide').code, 0);
  const view = () => readFile(join(dir, 'docs/design-docs/progress.md'), 'utf8');
  assert.equal(cli('sync', 'progress').code, 0);
  const text = await view();
  assert.match(text, /\| 0 \| button \| \[x\] \| \[x\] \| \[ \] \| Matrix is too wide \|/);
  assert.match(text, /\| A \| checkbox \| \[ \] \| \[ \] \| \[ \] \| {2}\|/);
  assert.equal(cli('sync', 'progress').code, 0);
  assert.equal(await view(), text, 'same register, same list');
  assert.equal(cli('sync', 'stamp', 'checked', 'button').code, 0);
  cli('sync', 'progress');
  assert.match(await view(), /\| 0 \| button \| \[x\] \| \[x\] \| \[x\] \| {2}\|/, 'checking clears the note');
  assert.equal(cli('sync', 'stamp', 'note', 'button', 'Again').code, 0);
  assert.equal(cli('sync', 'stamp', 'clear', 'button').code, 0, 'clear removes a note');
  const cleared = parseJson<{ components: { button: { needsFix: boolean; note: string; stage: string } } }>(await readFile(join(dir, 'generated/design/progress.json'), 'utf8')).components.button;
  assert.deepEqual([cleared.needsFix, cleared.note, cleared.stage], [false, '', 'checked'], 'and keeps the stage');
  assert.equal(cli('sync', 'stamp', 'library', 'button').code, 0, 'a rebuild is always allowed');
  assert.equal(parseJson<{ components: { button: { stage: string } } }>(await readFile(join(dir, 'generated/design/progress.json'), 'utf8')).components.button.stage, 'library', 'and resets the later stages');
  await rm(dir, { recursive: true });
});

test('FG8 docs: every token the drawn shell and the foundation docs name is a Figma variable or style', sourceRepoOnly, async () => {
  const { foundationScripts, guideScript } = await import('../adapters/design/figma/docs.mjs');
  const { docTokenPaths } = await import('../lib/design-docs.mjs');
  const scripts = [await guideScript(ROOT), ...(await foundationScripts(ROOT, ['color', 'typography', 'spacing', 'radius', 'elevation', 'other'])).map((g) => g.script)];
  for (const script of scripts) {
    assert.ok(script.length < 50000, 'a doc script fits the use_figma code limit');
    const cfg = parseJson<{ shell: unknown; doc?: unknown; docs?: unknown[]; vars: Record<string, string>; effects?: Record<string, unknown>; styles: Record<string, string>; textByToken: Record<string, string> }>(must(/const cfg = (.*);\n/.exec(script)?.[1], 'cfg in the doc script'));
    const missing = docTokenPaths({ shell: cfg.shell, docs: cfg.docs ?? [cfg.doc] }).filter((t) => !cfg.vars[t] && !t.startsWith('font.size.') && !t.startsWith('elevation.') && !(t in (cfg.effects ?? {})));
    assert.deepEqual(missing, [], 'tokens without a variable');
    for (const name of [...Object.values(cfg.styles), ...Object.values(cfg.textByToken)]) assert.match(name, /^Text\//);
  }
});

test('FG26 component docs: Variants and States grids from the library set with cells that are its variant names, element sets in their component doc, a frameless anatomy tree, accessibility as contract rules plus the real source, checksum-guarded pastes under the limit', sourceRepoOnly, async () => {
  const { componentDoc, a11ySource } = await import('../lib/design/docs.mjs');
  const { componentScripts } = await import('../adapters/design/figma/docs.mjs');
  const { libraryModel } = await import('../lib/design/library.mjs');
  const grid = (d: DocBlueprint, title: string) => matrixCard(d.sections.find((s) => s.title === title)?.cards[0]);
  const button = await componentDoc(ROOT, 'button');
  const variants = grid(button, 'Variants');
  assert.equal(variants.rows.length, 6);
  assert.equal(variants.cols.length, 8);
  assert.ok(variants.rows.flatMap((r) => r.cells).filter(Boolean).every((n) => /State=Rest, Disabled=False$/.test(String(n))), 'variants at rest');
  assert.equal(must(variants.rows.at(-1), 'last variant row').cells.filter((c) => c === null).length, 4, 'Link has no icon sizes');
  assert.deepEqual(grid(button, 'States').cols, ['Rest', 'Hover', 'Focus', 'Loading', 'Disabled']);
  const L = await libraryModel(ROOT, 'button');
  const names = new Set(L.axes.reduce<string[][]>((acc, a) => acc.flatMap((c) => a.values.map((v) => c.concat(`${a.name}=${v}`))), [[]]).map((c) => c.join(', ')));
  for (const g of [variants, grid(button, 'States')]) for (const n of g.rows.flatMap((r) => r.cells).filter(Boolean)) assert.ok(names.has(String(n)), `${String(n)} is a Button variant`);
  const input = await componentDoc(ROOT, 'input');
  assert.equal(must(input.sections[0], 'first input section').title, 'States', 'no look axis: only the States grid');
  const field = await componentDoc(ROOT, 'field');
  assert.deepEqual(must(field.sections.find((s) => s.title === 'Elements'), 'Elements section').cards.map((c) => ('set' in c ? c.set : undefined)), ['FieldSet', 'FieldGroup', 'FieldSeparator', 'FieldTitle']);
  const a11y = must(button.sections.find((s) => s.title === 'Accessibility'), 'Accessibility section').cards;
  assert.deepEqual(a11y.map((c) => c.type), ['table', 'code']);
  assert.ok(codeCard(a11y[1]).source.some((l) => l.includes('aria-busy')), 'the real render() lines');
  assert.ok(!codeCard(a11y[1]).source.some((l) => /variant: ButtonVariant|#handleClick = /.test(l)), 'only members that set accessibility');
  assert.deepEqual(await a11ySource(ROOT, 'card'), [], 'a component that sets no accessibility has no code');
  const scripts = await componentScripts(ROOT, '0');
  assert.deepEqual(scripts.map((s) => s.file), ['components-0-1.js', 'components-0-2.js', 'components-0-verify.js']);
  for (const s of scripts) {
    assert.ok(s.script.length < 50000, `${s.file} fits one paste`);
    assert.match(s.script, /checksum mismatch/);
  }
  assert.match(must(scripts[0], 'components-0-1.js').script, /"codeFamilies":\["Roboto Mono"\]/, 'the code family is a design font');
  assert.match(must(scripts[0], 'components-0-1.js').script, /box\('Tree', \{ gap: S\.tree\.node\.gap, width \}\)/, 'the tree has no card frame');
  assert.match(must(scripts[0], 'components-0-1.js').script, /bind\(p, T\.padX, \['paddingLeft', 'paddingRight'\]\)/);
});

test('FG27 component docs highlight accessibility in the blueprint (rule accent, source marks) and read as text from the CLI, with the same grids', sourceRepoOnly, async () => {
  const { componentDoc, a11yMarks } = await import('../lib/design/docs.mjs');
  const { docText } = await import('../lib/design/doc-text.mjs');
  const doc = await componentDoc(ROOT, 'button');
  const [rulesCard, codeCardOf] = must(doc.sections.find((s) => s.title === 'Accessibility'), 'Accessibility section').cards;
  const rules = tableCard(rulesCard), code = codeCard(codeCardOf);
  assert.ok(rules.rows.every((r) => r[0].accent && !must(r[1], 'rule value').accent), 'the Rule column is highlighted');
  const marked = must(code.marks, 'source marks').map(([l, a, b]) => must(code.source[must(l, 'mark line')], 'marked line').slice(a, b));
  assert.ok(marked.includes('aria-busy') && marked.includes('role'), 'aria attributes and role are marked');
  assert.deepEqual(a11yMarks(["const aria = (name) => x;", "variant = 'a';"]), [], 'a variable named aria and the word variant are not attributes');
  const text = docText(doc, { highlight: (s: string) => `<${s}>` });
  assert.match(text, /== Variants ==/);
  assert.match(text, /\| Link +\| \[x\] .*\| n\/a /, 'excluded cells read n/a');
  assert.match(text, /<aria-busy>=/, 'source highlight');
  assert.match(text, /<role +> +button/, 'rule highlight');
  const r = spawnSync('node', [join(ROOT, 'harness/cli.mjs'), 'docs', 'button', '--json'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(parseJson<{ data: { doc: DocBlueprint } }>(r.stdout).data.doc.sections.map((s) => s.title), doc.sections.map((s) => s.title), 'the CLI serves the same blueprint');
});

test('FG29 doc shell: the Doc radius is the Header radius plus the inset between them; the header line names no repo path; the Guide is static: no sync date, no hash', sourceRepoOnly, async () => {
  const spec = parseJson<{ shell: { doc: { radius: string; pad: string }; header: { radius: string; link: { label: string } }; tree: { node: { radius: string[] } }; tag: { radius: string } } }>(await readFile(join(ROOT, 'spec/design-docs.json'), 'utf8'));
  const all: LoadedTokens = await loadAll(ROOT);
  const map = all.map ?? new Map(all.sets.flatMap((s) => s.tokens.map((x) => [x.path, x])));
  const px = (t: string) => parseFloat(String(resolvedValue(resolve(map, t))));
  const { doc, header } = spec.shell;
  assert.equal(px(doc.radius), px(header.radius) + px(doc.pad), `${doc.radius} = ${header.radius} + ${doc.pad}`);
  const tree = spec.shell.tree.node.radius.map(px);
  assert.ok(tree.every((r, i) => i === 0 || r < must(tree[i - 1], 'parent radius')), 'each nested anatomy node has a smaller radius than its parent');
  assert.equal(spec.shell.tag.radius, 'radius.pill', 'pills are not containers: the nested rule leaves them alone');
  assert.ok(!/[\\/]|\.(md|json)\b/.test(header.link.label), 'the header line is not a path');
  const { guideDoc } = await import('../lib/design/docs.mjs');
  assert.ok(!(await guideDoc(ROOT)).sections.some((s) => /sync/i.test(s.title ?? '')), 'the Guide has no sync status section');
  const { componentScripts } = await import('../adapters/design/figma/docs.mjs');
  const script = must((await componentScripts(ROOT, '0'))[0], 'components-0-1.js').script;
  assert.ok(!script.includes('text(d.link'), 'the design file draws the shell label, not the blueprint path');
});

test('FG28 no cropped examples: verify reports content larger than its variant; Pagination hugs its links and the ScrollArea slot fills its viewport', sourceRepoOnly, async () => {
  const { libraryModel } = await import('../lib/design/library.mjs');
  const { libraryScripts } = await import('../adapters/design/figma/library.mjs');
  const r = await libraryScripts(ROOT, 'pagination');
  assert.match(must(r.scripts.find((s) => s.file.endsWith('.verify.js')), 'pagination verify').script, /content overflows the variant frame/);
  const pagination = must((await libraryModel(ROOT, 'pagination')).variants[0], 'pagination variant').tree;
  assert.ok(!pagination.fw, 'a fixed 320 root cut the 338 wide links');
  for (const v of (await libraryModel(ROOT, 'scroll-area')).variants) {
    const content = must(must(v.tree.kids, 'scroll-area layers').find((k) => k.slot === 'Content'), 'Content slot');
    assert.ok(content.grow && content.st, 'the empty slot spilled out of the 64 high viewport');
  }
});

test('FG30 pattern docs: one screen per state from pattern.json, components resolved to library variants, a checksum-guarded paste under the limit, and a read-back that counts slot content', sourceRepoOnly, async () => {
  const { patternDoc, patternIds, variantOf } = await import('../lib/design/patterns.mjs');
  const { patternScripts } = await import('../adapters/design/figma/patterns.mjs');
  const { libraryModel } = await import('../lib/design/library.mjs');
  const doc = await patternDoc(ROOT, 'sign-in');
  assert.deepEqual(doc.sections.map((s) => s.title), ['Default', 'With error', 'Loading', 'Sign up', 'Components', 'Landmarks', 'Accessibility']);
  const card = componentNode(screenCard(must(doc.sections[0], 'first section').cards[0]).children[0]);
  assert.equal(card.set, 'Card');
  assert.equal(card.variant, 'Size=Medium');
  assert.ok(card.slots.Content?.length && card.slots.Footer?.length, 'the card slots hold the form and the footer');
  assert.throws(() => variantOf({ title: 'Button', axes: [{ name: 'Variant', values: ['Primary'] }] }, { colour: 'x' }), /no axis for colour/);
  assert.throws(() => variantOf({ title: 'Button', axes: [{ name: 'Variant', values: ['Primary'] }] }, { variant: 'loud' }), /no value loud/);
  assert.equal(variantOf(await libraryModel(ROOT, 'button'), { variant: 'tertiary', state: 'loading' }), 'Variant=Tertiary, Size=Medium, State=Loading, Disabled=False');
  assert.ok((await patternIds(ROOT)).includes('sign-in'));
  const scripts = await patternScripts(ROOT, ['sign-in']);
  const draw = must(scripts.find((s) => s.file === 'patterns-sign-in-1.js'), 'patterns-sign-in-1.js').script;
  assert.ok(draw.length < 50000, 'one paste fits the use_figma limit');
  assert.match(draw, /checksum mismatch/);
  assert.match(must(scripts.find((s) => s.file === 'patterns-runtime.js'), 'patterns-runtime.js').script, /scope\.setProperties/, 'a layout key such as Button 2/Variant sets a nested instance property');
  assert.match(must(scripts.find((s) => s.file === 'patterns-verify.js'), 'patterns-verify.js').script, /p\.type === 'SLOT'\) return true/);
});

test('FG31 parity diff: texts missing or extra, the edge that matches the alignment, duplicates paired by position, order only across rows', () => {
  const t = (text: string, x: number, y: number, w = 40, a?: string) => ({ t: text, x, y, w, h: 17, ...(a ? { a } : {}) });
  const sb = { texts: [t('Title', 20, 10), t('Install', 20, 60), t('Install', 20, 300), t('Done', 20, 400)] };
  const same = diffInventories(sb, { texts: [t('Title', 22, 14), t('Install', 22, 70), t('Install', 22, 310), t('Done', 22, 410)] });
  assert.equal(same.ok, true);
  const gap = diffInventories(sb, { texts: [t('Title', 22, 14), t('Install', 22, 70), t('Install', 22, 310)] });
  assert.deepEqual(gap.missing, ['Done']);
  const wide = diffInventories({ texts: [t('Hi', 20, 10, 20)] }, { texts: [t('Hi', 20, 10, 600, 'LEFT')] });
  assert.equal(wide.ok, true, 'a fill-width left-aligned box is judged by its left edge');
  const centered = diffInventories({ texts: [t('Hi', 600, 10, 40)] }, { texts: [t('Hi', 100, 10, 1040, 'CENTER')] });
  assert.equal(centered.moved.length, 0, 'a centered box is judged by its center');
  const swapped = diffInventories(sb, { texts: [t('Done', 20, 10), t('Install', 20, 70), t('Install', 20, 310), t('Title', 20, 410)] });
  assert.ok(swapped.order > 0);
  const stars = (dy: number) => [t('Full name', 435, 263 - dy), t('*', 498, 263 - dy), t('Email', 435, 349 - dy), t('*', 470, 349 - dy), t('Agree', 463, 565 - dy), t('*', 661, 565 - dy)];
  assert.equal(diffInventories({ texts: stars(0) }, { texts: stars(145) }).order, 0, 'repeated texts are paired in reading order, whatever the vertical offset');
  const jitter = diffInventories(
    { texts: [t('Native select', 20, 450), t('Choose one', 67, 500), t('Choose one', 376, 500), t('Choose one', 684, 500)] },
    { texts: [t('Native select', 20, 470), t('Choose one', 696, 508), t('Choose one', 69, 520), t('Choose one', 383, 520)] },
  );
  assert.equal(jitter.moved.length, 0, 'repeated texts are paired by position after the shift of their nearest unique neighbour, so a few pixels of row jitter do not swap columns');
  assert.equal(jitter.order, 0);
  const row = diffInventories({ texts: [t('a', 0, 100), t('b', 100, 103)] }, { texts: [t('b', 100, 100), t('a', 0, 108)] });
  assert.equal(row.order, 0, 'items on one row may differ by a few pixels');
});

test('FG32 pattern runtime: joined groups re-round their outer corners, mirrored under Direction, percentages and rules are drawn', async () => {
  const { readFile } = await import('node:fs/promises');
  const src = await readFile(join(ROOT, 'harness/adapters/design/figma/patterns.mjs'), 'utf8');
  for (const needle of ['async function closeGroup', 'function mirror', "n.rule", 'later.push', "a === 'center-x'", "a === 'end'", "node.height === 'fill'", "x.layoutMode === 'HORIZONTAL' && x.primaryAxisAlignItems === 'MIN'"]) assert.ok(src.includes(needle), needle);
  assert.ok((await patternIds(await reference())).length >= 8);
});

test('FG33 pattern layouts: a component with a ratio is drawn at that width-to-height ratio once its width is known', async () => {
  const { readFile } = await import('node:fs/promises');
  const { patternDoc } = await import('../lib/design/patterns.mjs');
  const found: WalkNode[] = [];
  const walk = (n: WalkNode | undefined): void => { if (n?.kind === 'component' && n.ratio) found.push(n); for (const k of [...(n?.children ?? []), ...Object.values(n?.slots ?? {}).flat()]) walk(k); };
  for (const sec of (await patternDoc(await reference(), 'dashboard')).sections) for (const c of sec.cards) for (const k of ('children' in c ? c.children : [])) walk(k);
  assert.ok(found.length >= 1 && Math.abs(Number(found[0]?.ratio) - 16 / 9) < 1e-9, 'the dashboard chart is 16/9');
  const src = await readFile(join(ROOT, 'harness/adapters/design/figma/patterns.mjs'), 'utf8');
  assert.ok(src.includes('n.ratio'));
});

test('FG41 pattern layouts: icons swap a nested icon layer to a registered icon (Profile shows calendar and hard-drive)', sourceRepoOnly, async () => {
  const { readFile } = await import('node:fs/promises');
  const { patternDoc } = await import('../lib/design/patterns.mjs');
  const icons: string[] = [];
  const walk = (n: (WalkNode & { icons?: Record<string, string> }) | undefined): void => { if (n?.kind === 'component' && n.icons) icons.push(...Object.entries(n.icons).map(([k, v]) => `${k}=${v}`)); for (const k of [...(n?.children ?? []), ...Object.values(n?.slots ?? {}).flat()]) walk(k); };
  for (const sec of (await patternDoc(ROOT, 'profile')).sections) for (const c of sec.cards) for (const k of ('children' in c ? c.children : [])) walk(k);
  assert.deepEqual([...new Set(icons)].sort(), ['media/icon=content / calendar', 'media/icon=data / hard-drive'], 'resolved to the drawn icon sets');
  const src = await readFile(join(ROOT, 'harness/adapters/design/figma/patterns.mjs'), 'utf8');
  assert.ok(src.includes('n.icons') && src.includes('swapComponent(target)'), 'the runtime swaps the layer');
});

test('FG34 pattern layouts: an axis the library has is never named twice in a variant, and the expected texts leave out percentages and variant values', sourceRepoOnly, async () => {
  const { patternDoc } = await import('../lib/design/patterns.mjs');
  const variants: string[] = [];
  const walk = (n: WalkNode | undefined): void => { if (n?.kind === 'component') variants.push(must(n.variant, 'component variant')); for (const k of [...(n?.children ?? []), ...Object.values(n?.slots ?? {}).flat()]) walk(k); };
  for (const id of ['dashboard', 'settings']) for (const sec of (await patternDoc(ROOT, id)).sections) for (const c of sec.cards) for (const k of ('children' in c ? c.children : [])) walk(k);
  const names = variants.flatMap((v) => v.split(', ').map((x) => x.split('=')[0]));
  assert.ok(variants.some((v) => /Active=2/.test(v)), 'settings selects the second tab');
  for (const v of variants) { const axes = v.split(', ').map((x) => x.split('=')[0]); assert.equal(new Set(axes).size, axes.length, v); }
  assert.ok(names.length > 0);
  const { patternScripts } = await import('../adapters/design/figma/patterns.mjs');
  const verify = must((await patternScripts(ROOT, ['dashboard'])).find((x) => x.file === 'patterns-verify.js'), 'patterns-verify.js').script;
  assert.ok(!/"68%"|"Tertiary"/.test(verify.slice(0, verify.indexOf('const SUM'))), 'a percentage and a variant value are not expected as shown text');
});

test('FG35 pattern scripts: the runtime is pasted once, kept in the file as hidden text, checked, and removed; each part carries only its data', sourceRepoOnly, async () => {
  const { patternScripts } = await import('../adapters/design/figma/patterns.mjs');
  const scripts = await patternScripts(ROOT, ['form-states', 'sign-in']);
  const files = scripts.map((x) => x.file);
  assert.equal(files[0], 'patterns-runtime.js');
  assert.equal(files.at(-1), 'patterns-runtime-remove.js');
  assert.ok(files.includes('patterns-verify.js'));
  const parts = scripts.filter((x) => /^patterns-(form-states|sign-in)-\d+\.js$/.test(x.file));
  assert.ok(parts.length >= 2);
  for (const p of parts) {
    assert.ok(p.script.length < 26000, `${p.file} is ${p.script.length} characters`);
    assert.ok(!p.script.includes('function mirror'), `${p.file} carries no runtime`);
    assert.match(p.script, /stored pattern runtime/);
  }
  const install = must(scripts[0], 'patterns-runtime.js').script;
  assert.ok(install.length < 40000, `the runtime script is ${install.length} characters`);
  const chunks = parseJson<string[]>(must(/const CHUNKS = (\[[\s\S]*?\]);\n/.exec(install)?.[1], 'CHUNKS in the runtime script'));
  assert.ok(chunks.every((c) => c.length <= 8000));
  const src = chunks.join('');
  assert.ok(src.includes('function mirror') && src.includes('async function draw'));
  assert.doesNotThrow(() => new AsyncFunction('cfg', src), 'the stored text is valid code');
  const rsum = must(/"rsum":(-?\d+)/.exec(must(parts[0], 'first part').script), 'rsum in the first part')[1];
  assert.ok(install.includes(`RSUM = ${rsum}`), 'the runtime script and every part name the same checksum');
  assert.match(must(scripts.at(-1), 'patterns-runtime-remove.js').script, /Pattern runtime/);
});

test('FG36 table rows and pattern tables: only the selected sample row has the selected fill, and a layout can clear it inside an instance', async () => {
  const { libraryModel } = await import('../lib/design/library.mjs');
  const { patternDoc } = await import('../lib/design/patterns.mjs');
  const { readFile } = await import('node:fs/promises');
  const flat = (n: LayerNode): LayerNode[] => [n, ...(n.kids ?? []).flatMap(flat)];
  const rows = flat(must((await libraryModel(await reference(), 'table')).variants[0], 'table variant').tree).filter((n) => /^row-\d$/.test(n.p));
  assert.equal(rows.length, 6);
  assert.deepEqual(rows.filter((n) => n.b.some(([, f]) => f === 'fill')).map((n) => n.p), ['row-2'], 'only row 2 is drawn selected');
  const tables: WalkNode[] = [];
  const walk = (n: WalkNode | undefined): void => { if (n?.kind === 'component' && n.set === 'Table') tables.push(n); for (const k of [...(n?.children ?? []), ...Object.values(n?.slots ?? {}).flat()]) walk(k); };
  for (const id of ['data-table', 'dashboard']) for (const sec of (await patternDoc(await reference(), id)).sections) for (const c of sec.cards) for (const k of ('children' in c ? c.children : [])) walk(k);
  const withRows = tables.filter((t) => !(t.hide ?? []).includes('row-1'));
  assert.ok(withRows.length >= 2, 'the data table and the orders table show body rows');
  for (const t of withRows) assert.deepEqual(t.clear, ['row-2'], 'a story table has no selected row');
  const src = await readFile(join(ROOT, 'harness/adapters/design/figma/patterns.mjs'), 'utf8');
  assert.ok(src.includes('n.clear'));
});

test('FG37 no cropped doc grid: a variant wider than its cell wraps the grid into bands of fewer columns (Dialog Open alone, Sidebar three by two), each with its head; the verify reads the cells in band order; a grid that fits keeps one band', sourceRepoOnly, async () => {
  const { componentDoc, drawnWidth } = await import('../lib/design/docs.mjs');
  const { componentScripts } = await import('../adapters/design/figma/docs.mjs');
  const { libraryModel } = await import('../lib/design/library.mjs');
  const cfgOf = <T,>(s: { script: string }): T => parseJson<T>(must(/^const cfg = (.*);$/m.exec(s.script)?.[1], 'cfg in the doc script'));
  const scripts = await componentScripts(ROOT, 'G');
  const parts = scripts.filter((s) => s.names.length).map((s) => cfgOf<DrawCfg>(s));
  const px = must(parts[0], 'first doc part').px;
  const w = px.width - 2 * px.docPad - 2 * px.cardPad, labelW = Math.round(w / 6);
  const room = (k: number) => Math.floor((w - labelW - k * px.line) / k) - 2 * px.matrixPad;
  const states = (name: string) => must(must(must(parts.flatMap((p) => p.docs).find((d) => d.name === name), name).sections.find((s) => s.title === 'States'), `${name} States`).cards[0], `${name} States grid`);
  const open = must((await libraryModel(ROOT, 'dialog')).variants.find((v) => v.props.Open === 'True'), 'dialog Open variant');
  const dialogPx: Record<string, number> = { 'dialog.max-width': 512, 'dialog.viewport-margin': 16 };
  assert.equal(drawnWidth(open.tree, (t) => dialogPx[String(t)] ?? 0), 544, 'the surface plus the backdrop margin on both sides');
  assert.equal(matrixCard(must((await componentDoc(ROOT, 'sidebar')).sections.find((s) => s.title === 'States'), 'sidebar States').cards[0]).minWidth, 288, 'panel plus trigger');
  for (const [name, per, minWidth] of [['Dialog', 1, 544], ['Sidebar', 3, 288]] satisfies [string, number, number][]) {
    const c = states(name);
    assert.equal(c.per, per, `${name} wraps to ${per} column(s) per band`);
    assert.ok(room(must(c.per, `${name} columns per band`)) >= minWidth, `${name}: every cell holds its widest variant`);
  }
  const sidebar = states('Sidebar');
  const cells = must(must(cfgOf<VerifyCfg>(must(scripts.at(-1), 'components-G-verify.js')).docs.find((d) => d.name === 'Sidebar'), 'Sidebar in verify').cards.find((c) => c.section === 'States'), 'Sidebar States in verify').cells;
  assert.deepEqual(cells, [...sidebar.rows.flatMap((r) => r.cells.slice(0, 3)), ...sidebar.rows.flatMap((r) => r.cells.slice(3))], 'verify expects the cells band by band');
  assert.match(must(scripts[0], 'components-G-1.js').script, /for \(let s = 0; s < c\.cols\.length; s \+= per\)/, 'the runtime draws one head row per band');
  assert.ok(!('per' in states('Command')), 'Command fits in one band');
  for (const s of (await componentScripts(ROOT, '0')).filter((x) => x.names.length)) for (const d of cfgOf<DrawCfg>(s).docs) for (const sec of d.sections) for (const c of sec.cards) assert.ok(!('per' in c), `${d.name} ${sec.title} keeps one band`);
});

test('FG38 icon on a nested instance: the Dialog close button swaps Button\'s icon to the registry "x" by name; build resolves it on the Icons page and verify reads it back by icon set name', sourceRepoOnly, async () => {
  const { libraryScripts } = await import('../adapters/design/figma/library.mjs');
  const r = await libraryScripts(ROOT, 'dialog');
  const close = must(r.lineSets.get('Open=True'), 'dialog Open lines').find((l) => /\/header-row\/Button \d\|INSTANCE\|/.test(l) && l.includes('Size=Icon small'));
  assert.ok(close, 'the close button is a nested Button');
  assert.match(close, /Left icon swap=action \/ x/, 'the close button shows the x icon');
  assert.ok(Object.entries(r.expected.nested).some(([p, keys]) => p.includes('/header-row/') && keys.includes('Left icon swap')), 'verify reads the swap property');
  const build = r.scripts.find((s) => /\.build-\d+\.js$/.test(s.file) && s.script.includes('"Left icon swap":"action / x"'));
  assert.ok(build, 'the build data carries the icon by set name');
  assert.match(build.script, /componentProperties\[key\]\.type !== 'INSTANCE_SWAP'/, 'build resolves a swap to the icon component');
  assert.match(must(r.scripts.find((s) => s.file.endsWith('.verify.js')), 'dialog verify').script, /p\.type === 'INSTANCE_SWAP' \? iconOf\.get\(p\.value\)/, 'verify names the swapped icon');
});
