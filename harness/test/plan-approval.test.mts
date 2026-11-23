import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appendFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { runChecks } from '../checks/run.mjs';
import { contractDigest, planDigest, readRecord, snapshotOf, writeRecord } from '../lib/plan-approval.mjs';
import { classify } from '../lib/contract-diff.mjs';
import { componentFiles } from '../commands/catalog.mjs';
import { fixture, edit, ROOT, must } from './helpers.mjs';
import type { CheckOutcome } from '../checks/types.mjs';
import type { ComponentRegistry } from '../../generated/types/registry.js';
import type { HarnessConfigJson } from '../../generated/types/harness-config.js';

const CLI = join(ROOT, 'harness/cli.mjs');
const CONTRACT = {
  component: 'Probe', tag: 'sb-probe', status: 'draft', platforms: ['web'], summary: 'A probe component used only by tests.',
  props: {}, anatomy: [{ name: 'root', role: 'container', parent: null }],
  tokens: { 'probe.bg': '{color.background}' },
  accessibility: { role: 'none', accessibleNameSource: 'none', keyboard: {}, contrast: [] },
  realizations: {}, openQuestions: [],
};
const BODY = '# Plan: Probe (planning gate)\n\n## Scope\nA probe.\n';
const PLAN = 'spec/components/probe/plan.md';
const CONTRACT_FILE = 'spec/components/probe/contract.json';

async function probe(): Promise<string> {
  const dir = await fixture();
  await mkdir(join(dir, 'spec/components/probe'), { recursive: true });
  await writeFile(join(dir, CONTRACT_FILE), JSON.stringify(CONTRACT));
  await edit<ComponentRegistry>(dir, 'spec/registry.json', (r) => r.components.push({ name: 'Probe', tier: 1, status: 'draft' }));
  await writeFile(join(dir, PLAN), BODY);
  return dir;
}
const c4 = async (dir: string): Promise<CheckOutcome> => must((await runChecks(dir, { only: ['C4'] })).results[0], 'the C4 result');
const msgs = (issues: { msg: string }[]): string => issues.map((e) => e.msg).join('\n');
const approved = (stage: string, contract: object = CONTRACT, body = BODY): string => writeRecord(body, {
  stage, 'approved-by': 'Ana', 'approved-on': '2026-11-22', 'approved-contract': contractDigest(contract), 'approved-plan': planDigest(body),
});

test('C4 skips a plan without a record and rejects an unknown stage or a stage past plan without approval', async () => {
  const dir = await probe();
  await edit<HarnessConfigJson>(dir, 'harness.config.json', (c) => { c.approval = { requireRecord: false }; });
  assert.deepEqual((await c4(dir)).errors, []);
  await writeFile(join(dir, PLAN), writeRecord(BODY, { stage: 'implement' }));
  assert.match(msgs((await c4(dir)).errors), /stage "implement" needs an approval/);
  await writeFile(join(dir, PLAN), writeRecord(BODY, { stage: 'plan', next: 'Answer open questions' }));
  assert.deepEqual((await c4(dir)).errors, []);
  await writeFile(join(dir, PLAN), writeRecord(BODY, { stage: 'shipping' }));
  assert.match(msgs((await c4(dir)).errors), /unknown stage "shipping"/);
  await rm(dir, { recursive: true });
});

test('C4 accepts a matching approval and keeps it through build metadata changes', async () => {
  const dir = await probe();
  await writeFile(join(dir, PLAN), approved('implement'));
  assert.deepEqual((await c4(dir)).errors, []);
  const built = { ...CONTRACT, status: 'beta', version: '1.0.0', realizations: { web: { files: ['src/components/probe/Probe.ts'] } } };
  await writeFile(join(dir, CONTRACT_FILE), JSON.stringify(built, null, 2));
  assert.deepEqual((await c4(dir)).errors, [], 'status, version and realizations are outside the approved scope');
  await rm(dir, { recursive: true });
});

test('C4 rejects a stale approval after a contract or plan edit, and only warns while back at stage plan', async () => {
  const dir = await probe();
  await writeFile(join(dir, PLAN), approved('test'));
  await writeFile(join(dir, CONTRACT_FILE), JSON.stringify({ ...CONTRACT, summary: 'A probe that now does more.' }));
  assert.match(msgs((await c4(dir)).errors), /the contract changed after approval/);
  await writeFile(join(dir, PLAN), approved('plan'));
  const r = await c4(dir);
  assert.deepEqual(r.errors, []);
  assert.match(msgs(r.warnings), /the contract changed after approval/);
  await writeFile(join(dir, CONTRACT_FILE), JSON.stringify(CONTRACT));
  await writeFile(join(dir, PLAN), `${approved('review')}\n## Added scope\nAlso a tooltip.\n`);
  assert.match(msgs((await c4(dir)).errors), /the plan changed after approval/);
  await writeFile(join(dir, PLAN), approved('review').replace(/approved-by: Ana\n/, ''));
  assert.match(msgs((await c4(dir)).errors), /names no person/);
  await rm(dir, { recursive: true });
});

test('approve records the person and digests, moves the stage on, and needs --by', async () => {
  const dir = await probe();
  const cli = (...args: string[]) => spawnSync('node', [CLI, ...args], { cwd: dir, encoding: 'utf8' });
  assert.equal(cli('approve', 'probe', '--json').status, 1);
  assert.equal(cli('approve', 'probe', '--by', 'Ana', '--dry-run').status, 0);
  assert.equal(await readFile(join(dir, PLAN), 'utf8'), BODY, '--dry-run writes nothing');
  assert.equal(cli('approve', 'probe', '--by', 'Ana').status, 0);
  const record = must(readRecord(await readFile(join(dir, PLAN), 'utf8')), 'the plan record');
  assert.equal(record['approved-by'], 'Ana');
  assert.equal(record.stage, 'test', 'testFirst moves an approved plan to the test stage');
  assert.deepEqual((await c4(dir)).errors, []);
  assert.match(await readFile(join(dir, PLAN), 'utf8'), /## Scope\nA probe\./, 'the plan body is kept');
  assert.ok(!componentFiles(dir, 'probe').some((f) => /plan\.md|approved\.json/.test(f)), 'process records stay out of the catalog');
  await rm(dir, { recursive: true });
});

const sb = (dir: string, ...args: string[]) => spawnSync('node', [CLI, ...args], { cwd: dir, encoding: 'utf8' });
const contractNow = async (dir: string): Promise<Record<string, unknown>> => JSON.parse(await readFile(join(dir, CONTRACT_FILE), 'utf8')) as Record<string, unknown>;

test('a recorded token rename carries the approval with no person and no AI', async () => {
  const dir = await probe();
  assert.equal(sb(dir, 'approve', 'probe', '--by', 'Ana').status, 0);
  const r = sb(dir, 'tokens', 'rename', 'color.background', 'color.canvas');
  assert.equal(r.status === 0 || r.status === 2, true, r.stdout + r.stderr);
  assert.match(JSON.stringify(await contractNow(dir)), /color\.canvas/);
  const out = await c4(dir);
  assert.deepEqual(out.errors, []);
  assert.match(JSON.stringify(out.info), /recorded token renames or the prefix/);
  assert.equal(sb(dir, 'approve', 'probe', '--carry').status, 0, 'a mechanical carry needs no reason and no triage');
  assert.equal(must(readRecord(await readFile(join(dir, PLAN), 'utf8')), 'record')['carried-by'], 'sketchbook');
  await rm(dir, { recursive: true });
});

test('classify: a prefix change is mechanical, wording is editorial, scope is material', () => {
  const snap = snapshotOf(CONTRACT, BODY);
  assert.equal(classify(snap, { ...CONTRACT, tag: 'acme-probe' }, BODY, { prefix: 'acme' }).class, 'mechanical');
  assert.equal(classify(snap, { ...CONTRACT, summary: 'Reworded.' }, `${BODY}\n## Risks\nNone.\n`).class, 'editorial');
  assert.equal(classify(snap, CONTRACT, BODY.replace('A probe.', 'A probe with a tooltip.')).class, 'material', 'the Scope section');
  assert.equal(classify(snap, { ...CONTRACT, props: { size: { type: 'string' } } }, BODY).class, 'material');
  const duplicate = `${BODY}\n## Scope\nAn extra detail.\n`;
  assert.equal(classify(snapshotOf(CONTRACT, duplicate), CONTRACT, duplicate.replace('A probe.', 'A probe with a tooltip.')).class, 'material', 'the first Scope section still counts');
  const fenced = `${BODY}\n\`\`\`md\n## Notes\nThis is an example.\n\`\`\`\n`;
  assert.equal(classify(snapshotOf(CONTRACT, fenced), CONTRACT, fenced.replace('This is an example.', 'New scope.')).class, 'material', 'a heading inside a code block does not close Scope');
});

test('a real prefix rename carries approval across contract and plan and leaves the snapshot intact', async () => {
  const dir = await probe();
  await writeFile(join(dir, PLAN), BODY.replace('A probe.', 'Use `<sb-probe>` and `--sb-probe-bg`.'));
  assert.equal(sb(dir, 'approve', 'probe', '--by', 'Ana').status, 0);
  const snapshot = join(dir, 'spec/components/probe/approved.json');
  const before = await readFile(snapshot, 'utf8');
  const plan = await readFile(join(dir, PLAN), 'utf8');
  const dry = sb(dir, 'prefix', 'testbrand', '--dry-run');
  assert.equal(dry.status, 0, dry.stdout + dry.stderr);
  assert.equal(await readFile(join(dir, PLAN), 'utf8'), plan);
  sb(dir, 'prefix', 'testbrand');
  assert.match(await readFile(join(dir, PLAN), 'utf8'), /<testbrand-probe>.*--testbrand-probe-bg/);
  assert.equal(await readFile(snapshot, 'utf8'), before);
  assert.deepEqual((await c4(dir)).errors, []);
  assert.match(sb(dir, 'approve', 'probe', '--diff').stdout, /mechanical change/);
  await rm(dir, { recursive: true });
});

test('a missing plan fails for local work, but not for an untouched catalog unit', async () => {
  const dir = await probe();
  await rm(join(dir, PLAN));
  const missing = async () => Object.fromEntries((await runChecks(dir, { only: ['C4', 'C5'] })).results.map((r) => [r.id, r.errors.map((e) => e.file)]));
  assert.deepEqual(await missing(), { C4: [PLAN], C5: [PLAN] });
  await appendFile(join(dir, 'src/components/badge/Badge.ts'), '\n// Local customization.\n');
  const files = [PLAN, 'spec/components/badge/plan.md'].sort();
  const result = await missing();
  assert.deepEqual(result.C4?.sort(), files);
  assert.deepEqual(result.C5?.sort(), files);
  await rm(dir, { recursive: true });
});

test('an editorial change is carried by triage only when approval.triage is on, and a person confirms it later', async () => {
  const dir = await probe();
  assert.equal(sb(dir, 'approve', 'probe', '--by', 'Ana').status, 0);
  await writeFile(join(dir, CONTRACT_FILE), JSON.stringify({ ...CONTRACT, summary: 'A probe, reworded.' }));
  await appendFile(join(dir, PLAN), '\n## Notes\nA clarification.\n');
  assert.match((await c4(dir)).errors.map((e) => e.msg).join(), /editorial change/);
  const diff = JSON.parse(sb(dir, 'approve', 'probe', '--diff', '--json').stdout) as { data: { class: string; contractKeys: string[] } };
  assert.deepEqual([diff.data.class, diff.data.contractKeys], ['editorial', ['summary']]);
  await edit<HarnessConfigJson>(dir, 'harness.config.json', (c) => { c.approval = { triage: false }; });
  assert.equal(sb(dir, 'approve', 'probe', '--carry', '--reason', 'wording').status, 1, 'triage off');
  await edit<HarnessConfigJson>(dir, 'harness.config.json', (c) => { c.approval = { triage: true }; });
  assert.equal(sb(dir, 'approve', 'probe', '--carry').status, 1, 'an editorial carry needs a reason');
  assert.equal(sb(dir, 'approve', 'probe', '--carry', '--reason', 'Summary reworded; scope unchanged').status, 0);
  const out = await c4(dir);
  assert.deepEqual(out.errors, []);
  assert.match(msgs(out.warnings), /awaiting a person/);
  const review = sb(dir, 'approve', '--review').stdout;
  assert.match(review, /probe: Summary reworded/);
  assert.ok(review.includes(CONTRACT.summary));
  assert.match(review, /A clarification/);
  assert.match(sb(dir, 'approve', 'probe', '--diff').stdout, /approval holds/);
  const json = JSON.parse(sb(dir, 'approve', '--review', '--json').stdout) as { data: { reviews: { component: string; carries: { contract: unknown; plan: unknown }[] }[] } };
  const pending = must(json.data.reviews[0], 'pending review');
  const carry = must(pending.carries[0], 'saved changes');
  assert.equal(pending.component, 'probe');
  assert.deepEqual(carry.contract, [{ key: 'summary', before: CONTRACT.summary, after: 'A probe, reworded.' }]);
  assert.deepEqual(carry.plan, [{ section: 'Notes', after: ['## Notes\nA clarification.'] }]);
  const beforeReview = await readFile(join(dir, PLAN), 'utf8');
  assert.equal(sb(dir, 'approve', '--review', '--by', 'Ana', '--dry-run').status, 0);
  assert.equal(await readFile(join(dir, PLAN), 'utf8'), beforeReview);
  assert.equal(sb(dir, 'approve', '--review', '--by', 'Ana').status, 0);
  assert.equal(must(readRecord(await readFile(join(dir, PLAN), 'utf8')), 'record')['confirmed-by'], 'Ana');
  assert.deepEqual((await c4(dir)).warnings, []);
  await rm(dir, { recursive: true });
});

test('a mechanical carry does not clear a pending human review', async () => {
  const dir = await probe();
  assert.equal(sb(dir, 'approve', 'probe', '--by', 'Ana').status, 0);
  await writeFile(join(dir, CONTRACT_FILE), JSON.stringify({ ...CONTRACT, summary: 'A probe, reworded.' }));
  assert.equal(sb(dir, 'approve', 'probe', '--carry', '--reason', 'Summary reworded').status, 0);
  await writeFile(join(dir, CONTRACT_FILE), JSON.stringify({ ...CONTRACT, summary: 'A probe, with another rewording.' }));
  assert.equal(sb(dir, 'approve', 'probe', '--carry', '--reason', 'Another rewording').status, 0);
  const rename = sb(dir, 'tokens', 'rename', 'color.background', 'color.canvas');
  assert.ok(rename.status === 0 || rename.status === 2, rename.stdout + rename.stderr);
  assert.match(msgs((await c4(dir)).warnings), /Another rewording.*awaiting a person/);
  assert.equal(sb(dir, 'approve', '--review', '--by', 'Ana', '--dry-run').status, 0, 'an unrecorded mechanical change does not invalidate the carried scope');
  assert.equal(sb(dir, 'approve', 'probe', '--carry').status, 0);
  const review = sb(dir, 'approve', '--review').stdout;
  assert.match(review, /probe: Summary reworded/);
  assert.match(review, /probe: Another rewording/);
  assert.match(msgs((await c4(dir)).warnings), /awaiting a person/);
  await rm(dir, { recursive: true });
});

test('batch confirmation leaves every plan alone if a later scope change makes one carry stale', async () => {
  const dir = await probe();
  await edit<ComponentRegistry>(dir, 'spec/registry.json', (r) => r.components.push({ name: 'Notice', tier: 1, status: 'planned' }));
  assert.equal(sb(dir, 'add', 'notice', '--blank').status, 0);
  for (const name of ['notice', 'probe']) {
    assert.equal(sb(dir, 'approve', name, '--by', 'Ana').status, 0);
    await edit<{ summary: string }>(dir, `spec/components/${name}/contract.json`, (c) => { c.summary += ' Rephrased.'; });
    assert.equal(sb(dir, 'approve', name, '--carry', '--reason', 'Wording only').status, 0);
  }
  const files = ['spec/components/notice/plan.md', PLAN].map((f) => join(dir, f));
  const before = await Promise.all(files.map((f) => readFile(f, 'utf8')));
  const carriedContract = await readFile(join(dir, CONTRACT_FILE), 'utf8');
  await edit<{ props: object }>(dir, CONTRACT_FILE, (c) => { c.props = { size: { type: 'string' } }; });
  const result = sb(dir, 'approve', '--review', '--by', 'Ana', '--json');
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /no longer matches the carry/);
  assert.deepEqual(await Promise.all(files.map((f) => readFile(f, 'utf8'))), before);
  assert.equal(sb(dir, 'approve', '--review', 'notice', '--by', 'Ana').status, 1, 'a component argument must not confirm a whole batch');
  await rm(join(dir, CONTRACT_FILE));
  assert.equal(sb(dir, 'approve', '--review', '--by', 'Ana').status, 1, 'a missing contract must not silently omit a pending carry');
  assert.deepEqual(await Promise.all(files.map((f) => readFile(f, 'utf8'))), before);
  await writeFile(join(dir, CONTRACT_FILE), carriedContract);
  assert.equal(sb(dir, 'approve', '--review', '--by', 'Ana').status, 0);
  await rm(dir, { recursive: true });
});

test('a pending carry without a valid saved diff cannot be confirmed', async () => {
  const dir = await probe();
  assert.equal(sb(dir, 'approve', 'probe', '--by', 'Ana').status, 0);
  const current = { ...CONTRACT, summary: 'A probe, reworded.' };
  await writeFile(join(dir, CONTRACT_FILE), JSON.stringify(current));
  assert.equal(sb(dir, 'approve', 'probe', '--carry', '--reason', 'Wording only').status, 0);
  const plan = await readFile(join(dir, PLAN), 'utf8');
  // This is also the snapshot shape for a carry made before saved review diffs.
  await writeFile(join(dir, 'spec/components/probe/approved.json'), JSON.stringify(snapshotOf(current, plan)));
  assert.match(sb(dir, 'approve', '--review').stdout, /no valid saved changes/);
  assert.equal(sb(dir, 'approve', '--review', '--by', 'Ana').status, 1);
  assert.equal(await readFile(join(dir, PLAN), 'utf8'), plan);
  assert.equal(sb(dir, 'approve', 'probe', '--by', 'Ana').status, 0, 'an explicit reapproval still works');
  await rm(dir, { recursive: true });
});

test('a material change or a tampered snapshot is never carried', async () => {
  const dir = await probe();
  await edit<HarnessConfigJson>(dir, 'harness.config.json', (c) => { c.approval = { triage: true }; });
  assert.equal(sb(dir, 'approve', 'probe', '--by', 'Ana').status, 0);
  await writeFile(join(dir, CONTRACT_FILE), JSON.stringify({ ...CONTRACT, props: { size: { type: 'string' } } }));
  assert.equal(sb(dir, 'approve', 'probe', '--carry', '--reason', 'small').status, 1);
  await writeFile(join(dir, CONTRACT_FILE), JSON.stringify({ ...CONTRACT, summary: 'Reworded.' }));
  await writeFile(join(dir, 'spec/components/probe/approved.json'), JSON.stringify(snapshotOf({ ...CONTRACT, summary: 'Reworded.' }, BODY)));
  assert.equal(sb(dir, 'approve', 'probe', '--carry', '--reason', 'small').status, 1, 'a snapshot that is not what was approved does not count');
  await rm(dir, { recursive: true });
});

test('backfill writes records for plans without one, and requireRecord fails a plan without a record', async () => {
  const dir = await probe();
  await edit<HarnessConfigJson>(dir, 'harness.config.json', (c) => { c.approval = { requireRecord: true }; });
  assert.match(msgs((await c4(dir)).errors), /no plan record/);
  assert.equal(sb(dir, 'approve', '--backfill', '--by', 'Owner').status, 1, 'needs --basis');
  assert.equal(sb(dir, 'approve', '--backfill', '--by', 'Owner', '--basis', 'SB-0011', '--dry-run').status, 0);
  assert.equal(await readFile(join(dir, PLAN), 'utf8'), BODY);
  assert.equal(sb(dir, 'approve', '--backfill', '--by', 'Owner', '--basis', 'SB-0011').status, 0);
  const record = must(readRecord(await readFile(join(dir, PLAN), 'utf8')), 'record');
  assert.deepEqual([record.basis, record.stage, record['approved-by']], ['SB-0011', 'plan', 'Owner'], 'a draft component stays at stage plan');
  assert.deepEqual((await c4(dir)).errors, []);
  await writeFile(join(dir, PLAN), BODY.replace('\n## Scope', '\nStatus: Approved under SB-0042 (owner, 2026-11-01).\n\n## Scope'));
  assert.equal(sb(dir, 'approve', '--backfill', '--by', 'Owner', '--basis', 'SB-0011').status, 0);
  assert.equal(must(readRecord(await readFile(join(dir, PLAN), 'utf8')), 'record').basis, 'SB-0042', 'the plan names its own basis');
  await rm(dir, { recursive: true });
});
