import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { awaitingReview, missingPlanIssues, planFile, readRecord, verifyApproval, STAGES } from '../lib/plan-approval.mjs';
import { classifyComponent } from '../lib/contract-diff.mjs';
import type { CheckContext, CheckInfo, CheckIssue, CheckResult } from './types.mjs';

export const id = 'C4';
export const title = 'Plan records are valid and approvals match the current contract and plan';

export function run(ctx: CheckContext): CheckResult {
  const { root, all, config } = ctx;
  const errors = missingPlanIssues(ctx);
  const warnings: CheckIssue[] = [];
  const info: CheckInfo[] = [];
  const { requireRecord = false, triage = false } = config.approval ?? {};
  for (const { name, contract } of all.contracts) {
    if (!contract) continue;
    const file = planFile(name);
    if (!existsSync(join(root, file))) continue;
    const text = readFileSync(join(root, file), 'utf8');
    const record = readRecord(text);
    const approve = `A person reviews the contract and plan, then runs \`sketchbook approve ${name} --by <their name>\`.`;
    if (!record || (requireRecord && !record.stage)) {
      if (requireRecord) errors.push({ file, token: name, msg: 'no plan record (approval.requireRecord)', fix: `Set stage: plan in the frontmatter, or ${approve}` });
      continue;
    }
    const stage = record.stage ?? 'plan';
    if (!(STAGES as readonly string[]).includes(stage)) {
      errors.push({ file, token: name, msg: `unknown stage "${stage}"`, fix: `Use one of: ${STAGES.join(', ')}.` });
      continue;
    }
    if (!record['approved-contract'] && !record['approved-plan']) {
      if (stage !== 'plan') errors.push({ file, token: name, msg: `stage "${stage}" needs an approval`, fix: `Set stage: plan until approved. ${approve}` });
      continue;
    }
    if (awaitingReview(record)) warnings.push({ file, token: name, msg: `carried by triage (${record['carried-reason'] ?? 'no reason'}), awaiting a person`, fix: 'Run sketchbook approve --review to see the saved changes before confirming them.' });
    const v = verifyApproval(record, contract, text);
    if (v.ok) continue;
    const change = record['approved-by'] ? classifyComponent(root, name, record, contract, text, config.prefix) : null;
    if (change?.class === 'mechanical' || change?.class === 'none') { info.push(`${name}: changed only by recorded token renames or the prefix; the approval carries`); continue; }
    const fix = change?.class === 'editorial'
      ? (triage ? `Wording only (${[...change.contractKeys, ...change.planSections].join(', ')}): run the change-triage brief, or \`sketchbook approve ${name} --carry --reason "<why scope is unchanged>"\`.` : `Wording only; ${approve} (approval.triage is off).`)
      : `${approve} \`sketchbook approve ${name} --diff\` shows what changed.`;
    const issue = { file, token: name, msg: `approval does not hold: ${v.problem}${change ? ` (${change.class} change)` : ''}`, fix };
    (stage === 'plan' ? warnings : errors).push(issue);
  }
  return { errors, warnings, info };
}
