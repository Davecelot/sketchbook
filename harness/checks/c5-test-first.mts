import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { missingPlanIssues, planFile, readRecord } from '../lib/plan-approval.mjs';
import { digestFile, isGreen, isRed, readEvidence, runInputs, sameImplementation, sameRunInputs, specOf } from '../lib/evidence.mjs';
import type { CheckContext, CheckInfo, CheckIssue, CheckResult } from './types.mjs';

export const id = 'C5';
export const title = 'Test-first evidence: the behavior spec failed before the implementation and passes after it';

const LATER = { implement: 1, review: 2, ready: 3 } as Record<string, number | undefined>;

export function run(ctx: CheckContext): CheckResult {
  const { root, all, config } = ctx;
  if (config.features?.testFirst !== true) return {};
  const errors = missingPlanIssues(ctx);
  const warnings: CheckIssue[] = [];
  const info: CheckInfo[] = [];
  for (const { name, contract } of all.contracts) {
    if (!contract) continue;
    const plan = planFile(name);
    if (!existsSync(join(root, plan))) continue;
    const record = readRecord(readFileSync(join(root, plan), 'utf8'));
    const rank = LATER[record?.stage ?? 'plan'];
    if (!record || !rank) continue;
    const spec = specOf(contract);
    const { red, green, stub } = readEvidence(root, name);
    if (record['test-first'] === 'unverified (pre-record)' && !red) {
      info.push(`${name}: test-first ${record['test-first']}${stub && spec && stub.spec === digestFile(root, spec) ? `; ${stub.failed} of ${stub.total} tests need the element (${stub.on})` : ''}`);
      continue;
    }
    const file = `spec/components/${name}/evidence.json`;
    if (!isRed(red)) { errors.push({ file: plan, token: name, msg: `stage "${record.stage}" without a recorded red run`, fix: `Set stage: test, then sketchbook evidence red ${name} before implementing.` }); continue; }
    if (spec && red.spec !== digestFile(root, spec)) {
      (rank >= 2 ? errors : warnings).push({ file, token: name, msg: 'the behavior spec changed after the red run', fix: `Record red again for this spec against the pre-change implementation: sketchbook evidence red ${name}.` });
    }
    if (rank < 2) continue;
    if (!isGreen(green)) { errors.push({ file: plan, token: name, msg: `stage "${record.stage}" without a recorded green run`, fix: `Set stage: implement, then sketchbook evidence green ${name}.` }); continue; }
    if (sameImplementation(red, green)) errors.push({ file, token: name, msg: 'the implementation is unchanged since the red run: the code existed before the failing tests', fix: 'Record red against the code before the change (tests first), not after.' });
    if (red.spec !== green.spec || red.context !== green.context || red.total !== green.total) errors.push({ file, token: name, msg: 'red and green did not run the same spec, test setup and number of tests', fix: 'Record red and green again against the same test suite.' });
    if (!spec || !existsSync(join(root, spec)) || !sameRunInputs(green, runInputs(root, name, contract, spec))) {
      (rank === 3 ? errors : warnings).push({ file, token: name, msg: 'the code or spec changed after the green run, or the test setup changed', fix: `Set stage: implement, then sketchbook evidence green ${name} again.` });
    }
  }
  return { errors, warnings, info };
}
