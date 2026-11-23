import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { kebab } from '../../commands/catalog.mjs';
import { parseJson } from '../../lib/files.mjs';
import { readRecord, writeRecord } from '../../lib/plan-approval.mjs';
import { digestFile, evidenceFile, isGreen, isRed, outcomeOf, readEvidence, runInputs, sameRunInputs, specOf, STUB_HOOK_FIX } from '../../lib/evidence.mjs';
import type { Outcome } from '../../lib/evidence.mjs';
import { runChecks } from '../../checks/run.mjs';
import type { Command, OptionSpecs } from '../types.mjs';
import type { HarnessConfigJson } from '../../../generated/types/harness-config.js';

const options = {} satisfies OptionSpecs;

const STEP = {
  red: { from: 'test', to: 'implement', want: 'failed', next: 'Implement the smallest code that makes the tests pass, then sketchbook evidence green <name>.' },
  green: { from: 'implement', to: 'review', want: 'passed', next: 'Review behavior, accessibility and parity before moving the status on.' },
} as const;

function runSpec(root: string, spec: string, stub = ''): Outcome {
  const blocker = (detail: string): Outcome => ({ kind: 'blocker', failed: 0, total: 0, detail, passing: [] });
  let cli: string;
  try { cli = createRequire(join(root, 'package.json')).resolve('@playwright/test/cli'); }
  catch { return blocker('the project does not have @playwright/test installed'); }
  const filter = spec.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$';
  // Evidence is against the working copy, not a static Storybook build left over from an earlier CI run.
  const r = spawnSync(process.execPath, [cli, 'test', '-c', 'playwright/playwright.config.ts', filter, '--project=chromium', '--reporter=json', '--forbid-only', '--retries=0'], {
    cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: { ...process.env, CI: '', SKETCHBOOK_STUB_TAG: stub },
  });
  return r.error ? blocker(r.error.message) : outcomeOf(r.stdout ?? '', r.status);
}

const BLOCKER_FIX = 'Fix the reported problem before retrying. To diagnose it, run the behavior spec directly with Playwright.';
const READY_CHECKS = ['C1', 'C2', 'C3', 'C4', 'C5', 'A1', 'R1', 'S1'];

export default {
  name: 'evidence',
  group: 'quality',
  summary: 'Record a component’s behavior spec failing (red) and passing (green) with the same test setup. Stub reports which tests pass without the element. Ready requires current green evidence and clean component checks. A test setup failure records nothing.',
  args: [{ name: 'step', required: true, description: 'red | green | stub | ready' }, { name: 'Component Name', required: true, variadic: true, description: 'Component whose contract names realizations.web.spec' }],
  options,
  subcommands: ['red', 'green', 'stub', 'ready'],
  examples: ['sketchbook evidence red banner', 'sketchbook evidence green banner --json', 'sketchbook evidence stub switch', 'sketchbook evidence ready banner'],
  mutates: true,
  dryRun: true,
  async run({ root, args, dryRun, out }) {
    const [stepName, ...rest] = args;
    if (stepName !== 'red' && stepName !== 'green' && stepName !== 'stub' && stepName !== 'ready') return { exitCode: 1, errors: [{ msg: 'step must be red, green, stub or ready', fix: 'sketchbook evidence red <name>' }] };
    const name = kebab(rest.join(' '));
    const contractFile = `spec/components/${name}/contract.json`;
    const planFile = `spec/components/${name}/plan.md`;
    for (const f of [contractFile, planFile]) if (!existsSync(join(root, f))) return { exitCode: 1, errors: [{ file: f, msg: 'missing', fix: 'Write and approve the contract and plan first.' }] };
    const contractText = await readFile(join(root, contractFile), 'utf8');
    const contract = parseJson<object>(contractText);
    const text = await readFile(join(root, planFile), 'utf8');
    const record = readRecord(text) ?? {};
    const spec = specOf(contract);
    if (stepName === 'stub') {
      const tag = (contract as { tag?: string }).tag;
      if (!spec || !existsSync(join(root, spec)) || !tag) return { exitCode: 1, errors: [{ file: contractFile, msg: 'no behavior spec or tag', fix: 'List the spec in realizations.web.spec.' }] };
      // Without the fixture hook the element would load and the run would measure nothing.
      const fixtures = join(root, 'playwright/fixtures.ts');
      const hooked = existsSync(fixtures) && (await readFile(fixtures, 'utf8')).includes('SKETCHBOOK_STUB_TAG') && /from ['"][./]*fixtures['"]/.test(await readFile(join(root, spec), 'utf8'));
      if (!hooked) return { exitCode: 2, errors: [{ file: 'playwright/fixtures.ts', msg: 'blocker, nothing recorded: the stub hook is missing (SKETCHBOOK_STUB_TAG in playwright/fixtures.ts, and the spec must import test from it)', fix: STUB_HOOK_FIX }] };
      if (dryRun) { out(`Would run ${spec} with ${tag} never defined and record stub in ${evidenceFile(name)}.`); return { changed: [evidenceFile(name)] }; }
      const o = runSpec(root, spec, tag);
      const data = { component: name, step: 'stub', outcome: o.kind, failed: o.failed, total: o.total, passing: o.passing };
      if (o.kind === 'blocker') return { exitCode: 2, data, errors: [{ file: spec, msg: `blocker, nothing recorded: ${o.detail}`, fix: BLOCKER_FIX }] };
      const evidence = readEvidence(root, name);
      evidence.stub = { on: new Date().toISOString().slice(0, 10), spec: digestFile(root, spec), failed: o.failed, total: o.total, passing: o.passing };
      await writeFile(join(root, evidenceFile(name)), JSON.stringify(evidence, null, 2) + '\n');
      out(`Recorded stub for ${name}: ${o.failed} of ${o.total} tests need ${tag}.`);
      for (const t of o.passing) out(`  passes without ${tag}: ${t}`);
      return { changed: [evidenceFile(name)], data, warnings: o.passing.map((t) => ({ file: spec, msg: `passes without ${tag}: ${t}`, fix: 'Make the test depend on the element, or say why it does not.' })) };
    }
    if (stepName === 'ready') {
      if ((record.stage ?? 'plan') !== 'review') return { exitCode: 1, errors: [{ file: planFile, msg: `evidence ready runs at stage review, not ${record.stage ?? 'plan'}`, fix: `Record the green run first (sketchbook evidence green ${name}).` }] };
      const { green } = readEvidence(root, name);
      if (!isGreen(green) || !spec || !existsSync(join(root, spec)) || !sameRunInputs(green, runInputs(root, name, contract, spec))) return { exitCode: 1, errors: [{ file: evidenceFile(name), msg: 'no green run for the current code, spec and test setup', fix: `Set stage: implement and run sketchbook evidence green ${name} again.` }] };
      const label = (contract as { component?: string }).component ?? name;
      const report = await runChecks(root, { only: READY_CHECKS });
      const mine = report.results.flatMap((r) => r.errors.map((e) => ({ ...e, check: r.id }))).filter((e) => e.token === name || e.token === label || (e.file ?? '').includes(`/${name}/`) || (e.file ?? '').includes(`/${name}.`));
      if (mine.length) return { exitCode: 1, errors: mine, data: { component: name, ready: false } };
      if (dryRun) { out(`${name} meets the done gate (${READY_CHECKS.join(', ')}, green run current); would set stage ready.`); return { changed: [planFile], data: { component: name, ready: true } }; }
      await writeFile(join(root, planFile), writeRecord(text, { ...record, stage: 'ready', next: 'Done. A person moves the registry status on (beta, then stable with the audits R1 asks for).', blocker: undefined }));
      out(`${name} is ready: ${READY_CHECKS.join(', ')} pass for it and the green run matches the current code and spec.`);
      return { changed: [planFile], data: { component: name, ready: true } };
    }
    const step = STEP[stepName];
    if ((record.stage ?? 'plan') !== step.from) return { exitCode: 1, errors: [{ file: planFile, msg: `evidence ${stepName} runs at stage ${step.from}, not ${record.stage ?? 'plan'}`, fix: stepName === 'red' ? `Approve first (sketchbook approve ${name} --by <name>).` : `Record the red run first (sketchbook evidence red ${name}).` }] };
    if (!spec || !existsSync(join(root, spec))) return { exitCode: 1, errors: [{ file: contractFile, msg: 'no behavior spec (realizations.web.spec)', fix: 'Write the spec from the contract and list it in realizations.web.spec.' }] };
    const before = runInputs(root, name, contract, spec);
    const evidence = readEvidence(root, name);
    const { features } = parseJson<HarnessConfigJson>(await readFile(join(root, 'harness.config.json'), 'utf8'));
    const needsRed = stepName === 'green' && features?.testFirst === true;
    const redFix = `Set stage: test and record red for the current test suite against the pre-change implementation (sketchbook evidence red ${name}).`;
    if (needsRed && !isRed(evidence.red)) return { exitCode: 1, errors: [{ file: evidenceFile(name), msg: 'no valid red run', fix: redFix }] };
    if (needsRed && evidence.red?.spec !== before.spec) return { exitCode: 1, errors: [{ file: spec, msg: 'the behavior spec changed after the red run', fix: redFix }] };
    if (needsRed && evidence.red?.context !== before.context) return { exitCode: 1, errors: [{ file: spec, msg: 'the story or test setup changed after the red run', fix: redFix }] };
    if (dryRun) { out(`Would run ${spec} and record ${stepName} in ${evidenceFile(name)}.`); return { changed: [evidenceFile(name), planFile] }; }
    const o = runSpec(root, spec);
    const data = { component: name, step: stepName, outcome: o.kind, failed: o.failed, total: o.total };
    if (o.kind === 'blocker') return { exitCode: 2, data, errors: [{ file: spec, msg: `blocker, nothing recorded: ${o.detail}`, fix: BLOCKER_FIX }] };
    if (o.kind !== step.want) {
      const msg = stepName === 'red' ? `the spec passes before the implementation (${o.detail}): it does not test the new behavior` : `the spec still fails (${o.detail})`;
      return { exitCode: 1, data, errors: [{ file: spec, msg, fix: stepName === 'red' ? 'Write tests for the behavior the contract adds.' : 'Fix the implementation, not the tests.' }] };
    }
    if (needsRed && evidence.red?.total !== o.total) return { exitCode: 1, data, errors: [{ file: spec, msg: 'the number of tests run differs from red', fix: redFix }] };
    if (!sameRunInputs(before, runInputs(root, name, contract, spec))
      || contractText !== await readFile(join(root, contractFile), 'utf8') || text !== await readFile(join(root, planFile), 'utf8')) {
      return { exitCode: 2, data, errors: [{ file: spec, msg: 'blocker, nothing recorded: the component or test inputs changed during the run', fix: 'Keep these inputs unchanged while running the tests, then try again.' }] };
    }
    evidence[stepName] = { on: new Date().toISOString().slice(0, 10), ...before, failed: o.failed, total: o.total };
    if (stepName === 'red') delete evidence.green;
    await writeFile(join(root, evidenceFile(name)), JSON.stringify(evidence, null, 2) + '\n');
    await writeFile(join(root, planFile), writeRecord(text, { ...record, ...(stepName === 'red' ? { 'test-first': undefined } : {}), stage: step.to, next: step.next.replace('<name>', name) }));
    out(`Recorded ${stepName} for ${name}: ${o.detail}. Stage: ${step.to}.`);
    return { changed: [evidenceFile(name), planFile], data, next: step.next.replace('<name>', name) };
  },
} satisfies Command<typeof options>;
