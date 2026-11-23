import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appendFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { runChecks } from '../checks/run.mjs';
import { readRecord, writeRecord } from '../lib/plan-approval.mjs';
import { addStubHook, outcomeOf } from '../lib/evidence.mjs';
import { fixture, edit, ROOT, must } from './helpers.mjs';
import type { CheckOutcome } from '../checks/types.mjs';
import type { ComponentRegistry } from '../../generated/types/registry.js';

const CLI = join(ROOT, 'harness/cli.mjs');
const SPEC = 'playwright/tests/probe/probe.behavior.spec.ts';
const IMPL = 'src/components/probe/Probe.ts';
const PLAN = 'spec/components/probe/plan.md';
const PROBE_SPEC = "import { expect, test } from '../../fixtures';\n";
const CONTRACT = {
  component: 'Probe', tag: 'sb-probe', status: 'draft', platforms: ['web'], summary: 'A probe component used only by tests.',
  props: {}, anatomy: [{ name: 'root', role: 'container', parent: null }],
  tokens: { 'probe.bg': '{color.background}' },
  accessibility: { role: 'none', accessibleNameSource: 'none', keyboard: {}, contrast: [] },
  realizations: { web: { spec: SPEC } }, openQuestions: [],
};
const report = (failed: number, passed: number, errors: string[] = []): string => JSON.stringify({ stats: { expected: passed, unexpected: failed }, errors: errors.map((message) => ({ message })) });

async function probe(): Promise<string> {
  const dir = await fixture();
  await mkdir(join(dir, 'spec/components/probe'), { recursive: true });
  await mkdir(join(dir, 'playwright/tests/probe'), { recursive: true });
  await writeFile(join(dir, 'spec/components/probe/contract.json'), JSON.stringify(CONTRACT));
  await writeFile(join(dir, SPEC), PROBE_SPEC);
  await writeFile(join(dir, PLAN), '# Plan: Probe\n\n## Scope\nA probe.\n');
  // Stand in for the project's installed Playwright package. There is no runner-override switch in the CLI.
  const pw = join(dir, 'node_modules/@playwright/test');
  await mkdir(pw, { recursive: true });
  await writeFile(join(pw, 'package.json'), JSON.stringify({ exports: { './cli': './cli.cjs' } }));
  await writeFile(join(pw, 'cli.cjs'), 'if (process.env.FAKE_TAG === undefined || process.env.FAKE_TAG === process.env.SKETCHBOOK_STUB_TAG) { const text = process.env.FAKE_REPORT || ""; process.stdout.write(text); process.exitCode = text && JSON.parse(text).stats?.unexpected === 0 ? 0 : 1; }\n');
  await edit<ComponentRegistry>(dir, 'spec/registry.json', (r) => r.components.push({ name: 'Probe', tier: 1, status: 'draft' }));
  return dir;
}
const sb = (dir: string, fake: string, ...args: string[]) => sbEnv(dir, fake, {}, ...args);
const sbEnv = (dir: string, fake: string, env: Record<string, string>, ...args: string[]) => spawnSync('node', [CLI, ...args], {
  cwd: dir, encoding: 'utf8', env: { ...process.env, FAKE_REPORT: fake, ...env },
});
const titled = (passing: string[], failing: string[]): string => JSON.stringify({
  stats: { expected: passing.length, unexpected: failing.length }, errors: [],
  suites: [{ specs: [...passing.map((title) => ({ title, tests: [{ results: [{ status: 'passed' }] }] })), ...failing.map((title) => ({ title, tests: [{ results: [{ status: 'failed', error: { message: 'locator not visible' } }] }] }))] }],
});
const c5 = async (dir: string): Promise<CheckOutcome> => must((await runChecks(dir, { only: ['C5'] })).results[0], 'the C5 result');
const msgs = (issues: { msg: string }[]): string => issues.map((e) => e.msg).join('\n');
const stage = async (dir: string): Promise<string | undefined> => readRecord(await readFile(join(dir, PLAN), 'utf8'))?.stage;

test('outcomeOf: infrastructure trouble is a blocker, never a result', () => {
  assert.equal(outcomeOf('', 1).kind, 'blocker');
  assert.equal(outcomeOf(report(0, 0), 1).kind, 'blocker', 'no tests ran');
  assert.equal(outcomeOf(report(2, 0, ['browserType.launch: Executable does not exist']), 1).kind, 'blocker');
  const launch = JSON.stringify({ stats: { expected: 0, unexpected: 1 }, errors: [], suites: [{ suites: [{ specs: [{ tests: [{ results: [{ status: 'failed', error: { message: "Error: browserType.launch: Executable doesn't exist at /x" } }] }] }] }] }] });
  assert.equal(outcomeOf(launch, 1).kind, 'blocker', 'Playwright reports a missing browser as a failed test');
  assert.deepEqual([outcomeOf(report(2, 3), 1).kind, outcomeOf(report(0, 5), 0).kind], ['failed', 'passed']);
  assert.equal(outcomeOf(report(0, 5), 1).kind, 'blocker', 'a failing process cannot record green');
  assert.equal(outcomeOf(JSON.stringify({ stats: { expected: 0, unexpected: 0, flaky: 1 } }), 0).kind, 'blocker', 'a flaky test is not green');
});

test('red then green: the spec must fail before the implementation and pass after it, and C5 accepts the record', async () => {
  const dir = await probe();
  assert.equal(sb(dir, report(3, 0), 'evidence', 'red', 'probe').status, 1, 'red runs only at stage test (after approval)');
  assert.equal(sb(dir, '', 'approve', 'probe', '--by', 'Ana').status, 0);
  const blocker = sb(dir, report(1, 0, ['Executable does not exist']), 'evidence', 'red', 'probe', '--json');
  assert.equal(blocker.status, 2, 'a missing browser is a blocker');
  assert.equal((JSON.parse(blocker.stdout) as { ok: boolean }).ok, false, 'JSON consumers must also see the blocker');
  assert.ok(!existsSync(join(dir, 'spec/components/probe/evidence.json')), 'a blocker records nothing');
  assert.equal(sb(dir, report(0, 4), 'evidence', 'red', 'probe').status, 1, 'tests that already pass test nothing new');
  assert.equal(sb(dir, report(4, 0), 'evidence', 'red', 'probe').status, 0);
  assert.equal(await stage(dir), 'implement');
  assert.deepEqual((await c5(dir)).errors, [], 'the implementation was absent at the red run');
  await mkdir(join(dir, 'src/components/probe'), { recursive: true });
  await writeFile(join(dir, IMPL), 'export class Probe {}\n');
  assert.equal(sb(dir, report(1, 3), 'evidence', 'green', 'probe').status, 1, 'still failing');
  assert.equal(sb(dir, report(0, 4), 'evidence', 'green', 'probe').status, 0);
  assert.equal(await stage(dir), 'review');
  const r = await c5(dir);
  assert.deepEqual([r.errors, r.warnings], [[], []]);
  await writeFile(join(dir, IMPL), 'export class Probe { changed = true }\n');
  assert.match(msgs((await c5(dir)).warnings), /changed after the green run/);
  await rm(dir, { recursive: true });
});

test('C5 rejects a stage past test without red, and a red run against code that already existed', async () => {
  const dir = await probe();
  await writeFile(join(dir, PLAN), writeRecord(await readFile(join(dir, PLAN), 'utf8'), { stage: 'implement' }));
  assert.match(msgs((await c5(dir)).errors), /without a recorded red run/);
  await writeFile(join(dir, PLAN), '# Plan: Probe\n\n## Scope\nA probe.\n');
  await mkdir(join(dir, 'src/components/probe'), { recursive: true });
  await writeFile(join(dir, IMPL), 'export class Probe {}\n');
  assert.equal(sb(dir, '', 'approve', 'probe', '--by', 'Ana').status, 0);
  assert.equal(sb(dir, report(2, 0), 'evidence', 'red', 'probe').status, 0);
  assert.equal(sb(dir, report(0, 2), 'evidence', 'green', 'probe').status, 0);
  assert.match(msgs((await c5(dir)).errors), /unchanged since the red run/);
  await writeFile(join(dir, PLAN), writeRecord(await readFile(join(dir, PLAN), 'utf8'), { ...readRecord(await readFile(join(dir, PLAN), 'utf8')), 'test-first': 'unverified (pre-record)' }));
  assert.match(msgs((await c5(dir)).errors), /unchanged since the red run/, 'the legacy label does not hide a recorded red run');
  await rm(join(dir, 'spec/components/probe/evidence.json'));
  const legacy = await c5(dir);
  assert.deepEqual(legacy.errors, []);
  assert.match(JSON.stringify(legacy.info), /unverified/);
  await rm(dir, { recursive: true });
});

test('stub runs the spec with the element never defined and lists tests that pass without it', async () => {
  const dir = await probe();
  const r = sbEnv(dir, titled(['axe finds nothing'], ['Space toggles', 'has a name']), { FAKE_TAG: 'sb-probe' }, 'evidence', 'stub', 'probe', '--json');
  assert.equal(r.status, 0, r.stdout);
  const out = JSON.parse(r.stdout) as { data: { failed: number; total: number; passing: string[] }; warnings: { msg: string }[] };
  assert.deepEqual([out.data.failed, out.data.total, out.data.passing], [2, 3, ['axe finds nothing']]);
  assert.match(out.warnings.map((w) => w.msg).join(), /passes without sb-probe: axe finds nothing/);
  assert.equal(sbEnv(dir, '', { FAKE_TAG: 'sb-probe' }, 'evidence', 'stub', 'probe').status, 2, 'no report is a blocker');
  await writeFile(join(dir, SPEC), "import { expect, test } from '@playwright/test';\n");
  assert.match(sbEnv(dir, titled([], ['x']), { FAKE_TAG: 'sb-probe' }, 'evidence', 'stub', 'probe').stderr + '', /stub hook is missing/, 'a spec that bypasses the fixture cannot be stubbed');
  await writeFile(join(dir, PLAN), writeRecord(await readFile(join(dir, PLAN), 'utf8'), { stage: 'ready', 'test-first': 'unverified (pre-record)' }));
  assert.doesNotMatch(JSON.stringify((await c5(dir)).info), /tests need the element/, 'stale stub counts are not reported');
  await writeFile(join(dir, SPEC), PROBE_SPEC);
  assert.match(JSON.stringify((await c5(dir)).info), /2 of 3 tests need the element/);
  await rm(dir, { recursive: true });
});

test('ready is the done gate: stage review, a green run that matches the current code and spec, and clean component checks', async () => {
  const dir = await probe();
  assert.equal(sb(dir, '', 'approve', 'probe', '--by', 'Ana').status, 0);
  assert.equal(sb(dir, report(4, 0), 'evidence', 'red', 'probe').status, 0);
  assert.equal(sb(dir, '', 'evidence', 'ready', 'probe').status, 1, 'not at stage review');
  await mkdir(join(dir, 'src/components/probe'), { recursive: true });
  await writeFile(join(dir, IMPL), 'export class Probe {}\n');
  assert.equal(sb(dir, report(0, 4), 'evidence', 'green', 'probe').status, 0);
  await writeFile(join(dir, IMPL), 'export class Probe { late = true }\n');
  const stale = sb(dir, '', 'evidence', 'ready', 'probe');
  assert.equal(stale.status, 1);
  assert.match(stale.stdout + stale.stderr, /no green run for the current code/);
  await writeFile(join(dir, IMPL), 'export class Probe {}\n');
  const fixtures = join(dir, 'playwright/fixtures.ts');
  const originalFixture = await readFile(fixtures, 'utf8');
  await appendFile(fixtures, '\n// Changed after the test run.\n');
  assert.equal(sb(dir, '', 'evidence', 'ready', 'probe').status, 1);
  await writeFile(fixtures, originalFixture);
  const story = join(dir, 'src/components/probe/Probe.stories.ts');
  await writeFile(story, 'export const NewStory = {};\n');
  assert.equal(sb(dir, '', 'evidence', 'ready', 'probe').status, 1);
  await rm(story);
  const r = sb(dir, '', 'evidence', 'ready', 'probe');
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(await stage(dir), 'ready');
  await rm(dir, { recursive: true });
});

test('a green run must use the spec that was recorded red', async () => {
  const dir = await probe();
  assert.equal(sb(dir, '', 'approve', 'probe', '--by', 'Ana').status, 0);
  assert.equal(sb(dir, report(4, 0), 'evidence', 'red', 'probe').status, 0);
  await mkdir(join(dir, 'src/components/probe'), { recursive: true });
  await writeFile(join(dir, IMPL), 'export class Probe {}\n');
  await appendFile(join(dir, SPEC), '\n// Changed between red and green.\n');
  const r = sb(dir, report(0, 4), 'evidence', 'green', 'probe');
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout + r.stderr, /spec changed after the red run/);
  assert.equal(await stage(dir), 'implement');
  await writeFile(join(dir, SPEC), PROBE_SPEC);
  const count = sb(dir, report(0, 3), 'evidence', 'green', 'probe');
  assert.equal(count.status, 1);
  assert.match(count.stderr, /number of tests run differs from red/);
  await appendFile(join(dir, 'playwright/fixtures.ts'), '\n// Changed since red.\n');
  const setup = sb(dir, report(0, 4), 'evidence', 'green', 'probe');
  assert.equal(setup.status, 1);
  assert.match(setup.stderr, /test setup changed after the red run/);
  await rm(dir, { recursive: true });
});

test('upgrade adds the stub hook to an existing fixtures file once, and leaves a rewritten one alone', async () => {
  const dir = await fixture(['playwright']);
  const file = join(dir, 'playwright/fixtures.ts');
  const before = (await readFile(file, 'utf8')).replace(/^ *\/\/ sketchbook evidence stub[\s\S]*?\n {4}\}\n/m, '');
  assert.doesNotMatch(before, /SKETCHBOOK_STUB_TAG/, 'the fixtures file as projects had it before SB-0123');
  await writeFile(file, before);
  assert.equal(addStubHook(dir, { dryRun: true }), 'added');
  assert.equal(await readFile(file, 'utf8'), before, '--dry-run writes nothing');
  assert.equal(addStubHook(dir), 'added');
  const after = await readFile(file, 'utf8');
  assert.match(after, /process\.env\.SKETCHBOOK_STUB_TAG/);
  assert.equal(after.replace(/^ *\/\/ sketchbook evidence stub[\s\S]*?\n {4}\}\n/m, ''), before, 'only the stub block is added');
  assert.equal(addStubHook(dir), 'present');
  await writeFile(file, "export { test, expect } from '@playwright/test';\n");
  assert.equal(addStubHook(dir), 'manual');
  assert.equal(await readFile(file, 'utf8'), "export { test, expect } from '@playwright/test';\n", 'a rewritten fixture is not touched');
  await rm(dir, { recursive: true });
});
