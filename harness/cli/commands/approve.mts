import { existsSync, readdirSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { kebab } from '../../commands/catalog.mjs';
import { parseJson } from '../../lib/files.mjs';
import { awaitingReview, carryDigest, planFile, readCarries, readRecord, snapshotFile, snapshotOf, stamp, verifyApproval, writeRecord } from '../../lib/plan-approval.mjs';
import { classifyComponent } from '../../lib/contract-diff.mjs';
import type { CarryDiff, PlanRecord } from '../../lib/plan-approval.mjs';
import type { HarnessConfigJson } from '../../../generated/types/harness-config.js';
import type { ComponentRegistry } from '../../../generated/types/registry.js';
import type { Command, CommandResult, OptionSpecs } from '../types.mjs';

const options = {
  by: { type: 'string', value: 'name', description: 'The person approving (approve, --backfill) or confirming carried approvals (--review)' },
  diff: { type: 'boolean', description: 'Show what changed since the approval and how the CLI classifies it (none, mechanical, editorial, material). Read-only' },
  carry: { type: 'boolean', description: 'Carry the approval over a mechanical change, or an editorial one when approval.triage is on. Refuses a material change' },
  reason: { type: 'string', value: 'text', description: 'With --carry: why the approved scope is unchanged (required for an editorial change)' },
  review: { type: 'boolean', description: 'Show the saved changes for each pending editorial carry. With --by, confirm the batch only if every carry still matches the current scope' },
  backfill: { type: 'boolean', description: 'Write a record for every plan that has none (needs --by and --basis)' },
  basis: { type: 'string', value: 'ref', description: 'With --backfill: what the original approval rests on (for example SB-0011); "Approved under SB-NNNN" or another approved Status line on the plan wins' },
} satisfies OptionSpecs;

const NEXT: Record<string, string> = {
  test: 'Write the behavior tests and confirm they fail for the intended reason.',
  implement: 'Implement the approved contract.',
};
const STAGE_OF_STATUS: Record<string, string> = { planned: 'plan', draft: 'plan', wip: 'implement', beta: 'review', stable: 'ready', 'code-only': 'review', deprecated: 'ready' };
// "Approved under SB-0011" names its basis; another approved Status line is its own evidence (it stays in the plan body).
const basisOf = (text: string, fallback: string): string => {
  const status = /^Status:(.*)$/m.exec(text)?.[1] ?? '';
  return /approved under (SB-\d{4})/i.exec(status)?.[1] ?? (/approved/i.test(status) ? `plan Status line${/\d{4}-\d{2}-\d{2}/.exec(status) ? ` (${/\d{4}-\d{2}-\d{2}/.exec(status)?.[0] ?? ''})` : ''}` : fallback);
};
const today = (): string => new Date().toISOString().slice(0, 10);

interface Plan { file: string; text: string; record: PlanRecord }
interface Files extends Plan { contract: object }
const contractFile = (name: string): string => `spec/components/${name}/contract.json`;

async function load(root: string, name: string): Promise<Files | CommandResult> {
  const file = planFile(name);
  const contract = contractFile(name);
  for (const f of [contract, file]) if (!existsSync(join(root, f))) return { exitCode: 1, errors: [{ file: f, msg: 'missing', fix: 'Write the contract and plan first (contract-author workflow).' }] };
  const text = await readFile(join(root, file), 'utf8');
  return { file, text, contract: parseJson<object>(await readFile(join(root, contract), 'utf8')), record: readRecord(text) ?? {} };
}

async function save(root: string, name: string, f: Files, record: PlanRecord, carries?: CarryDiff[]): Promise<string[]> {
  const snap = { ...snapshotOf(f.contract, f.text), ...(carries ? { carries } : {}) };
  const updated = stamp({ ...record, 'carried-diff': carries ? carryDigest(carries) : undefined }, f.contract, f.text);
  await writeFile(join(root, f.file), writeRecord(f.text, updated));
  await writeFile(join(root, snapshotFile(name)), JSON.stringify(snap, null, 2) + '\n');
  return [f.file, snapshotFile(name)];
}

const plans = (root: string): string[] => readdirSync(join(root, 'spec/components'))
  .filter((n) => existsSync(join(root, planFile(n)))).sort();

const reviewFix = (name: string): string => `Review the change in Git, then have a person run sketchbook approve ${name} --by <name>.`;
const show = (value: unknown): string => JSON.stringify(value) ?? '(not present)';

export default {
  name: 'approve',
  group: 'components',
  summary: 'Record a person’s approval of a component’s contract and plan, or carry it over a change that leaves the scope as approved. Check C4 verifies it.',
  args: [{ name: 'Component Name', required: false, variadic: true, description: 'Component with spec/components/<name>/contract.json and plan.md (not with --review or --backfill)' }],
  options,
  examples: ['sketchbook approve switch --by "Ana Diaz"', 'sketchbook approve switch --diff', 'sketchbook approve switch --carry --reason "Reworded the summary"', 'sketchbook approve --review', 'sketchbook approve --review --by Ana', 'sketchbook approve --backfill --by Ana --basis SB-0011 --dry-run'],
  mutates: true,
  dryRun: true,
  async run({ root, args, options, dryRun, out }) {
    const config = parseJson<HarnessConfigJson>(await readFile(join(root, 'harness.config.json'), 'utf8'));
    const by = options.by?.trim();

    if (options.review) {
      if (args.length || options.carry || options.diff || options.backfill || options.reason || options.basis) {
        return { exitCode: 1, errors: [{ msg: '--review lists or confirms the entire batch; do not pass a component or another approval mode', fix: 'Run sketchbook approve --review to inspect the batch.' }] };
      }
      const pending: Plan[] = [];
      const reviews: { component: string; carries: CarryDiff[]; problem: string | null }[] = [];
      const errors: NonNullable<CommandResult['errors']> = [];
      for (const name of plans(root)) {
        const file = planFile(name);
        const text = await readFile(join(root, file), 'utf8');
        const record = readRecord(text);
        if (!record || !awaitingReview(record)) continue;
        const carries = readCarries(root, name, record);
        const contract = await readFile(join(root, contractFile(name)), 'utf8').then((t) => parseJson<object>(t)).catch(() => null);
        const holds = contract && Boolean(record['approved-by']) && (verifyApproval(record, contract, text).ok
          || classifyComponent(root, name, record, contract, text, config.prefix)?.class === 'mechanical');
        const problem = !carries ? 'no valid saved changes for this carry' : !holds ? 'the current contract or plan no longer matches the carry' : null;
        reviews.push({ component: name, carries: carries ?? [], problem });
        pending.push({ file, text, record });
        if (!carries) out(`${name}: ${record['carried-reason'] ?? '(no reason)'} (carried ${record['carried-on'] ?? '?'})`);
        for (const carry of carries ?? []) {
          out(`${name}: ${carry.reason} (carried ${carry.on})`);
          for (const c of carry.contract) out(`  contract.${c.key}: ${show(c.before)} -> ${show(c.after)}`);
          for (const p of carry.plan) {
            out(`  plan section: ${p.section || '(top)'}`);
            for (const [label, sections] of [['before', p.before], ['after', p.after]] as const) {
              out(`    ${label}:${sections ? '' : ' (not present)'}`);
              for (const section of sections ?? []) for (const line of section.split('\n')) out(`      ${line}`);
            }
          }
        }
        if (problem) {
          out(`  Cannot confirm: ${problem}.`);
          errors.push({
            file, msg: `${name}: ${problem}`,
            fix: carries ? `Run sketchbook approve ${name} --diff. Restore the carried scope, carry another wording-only change, or get a new approval before confirming the batch.` : reviewFix(name),
          });
        }
      }
      const data = { pending: reviews.map(({ component }) => component), reviews };
      if (!pending.length) out('No carried approvals await review.');
      if (!by || !pending.length) return { data, next: !pending.length ? null : errors.length ? 'Resolve the unconfirmable carries before confirming the batch.' : 'Review the saved changes above, then: sketchbook approve --review --by <name>' };
      // Check the entire batch before writing a confirmation to any plan.
      if (errors.length) return { exitCode: 1, data, errors };
      if (dryRun) { out(`Would confirm ${pending.length} carried approval(s) as ${by}.`); return { changed: pending.map((f) => f.file), data }; }
      for (const f of pending) await writeFile(join(root, f.file), writeRecord(f.text, { ...f.record, 'confirmed-by': by }));
      out(`${by} confirmed ${pending.length} carried approval(s).`);
      return { changed: pending.map((f) => f.file), data: { ...data, confirmedBy: by } };
    }

    if (options.backfill) {
      const basis = options.basis?.trim();
      if (!by || !basis) return { exitCode: 1, errors: [{ msg: '--backfill needs --by and --basis', fix: 'sketchbook approve --backfill --by <name> --basis <ref> --dry-run' }] };
      const registry = parseJson<ComponentRegistry>(await readFile(join(root, 'spec/registry.json'), 'utf8'));
      const status = new Map(registry.components.map((c) => [kebab(c.name), c.status]));
      const changed: string[] = [];
      const names: string[] = [];
      for (const name of plans(root)) {
        const f = await load(root, name);
        if (!('file' in f) || readRecord(f.text)) continue;
        const stage = STAGE_OF_STATUS[status.get(name) ?? 'draft'] ?? 'plan';
        const record: PlanRecord = {
          stage, basis: basisOf(f.text, basis), 'approved-by': by, 'approved-on': /\d{4}-\d{2}-\d{2}/.exec(f.text)?.[0] ?? today(),
          ...(stage === 'plan' ? {} : { 'test-first': 'unverified (pre-record)' }),
        };
        names.push(name);
        if (!dryRun) changed.push(...await save(root, name, f, record));
      }
      out(`${dryRun ? 'Would write' : 'Wrote'} ${names.length} plan record(s) on basis ${basis}${names.length ? `: ${names.join(', ')}` : ''}.`);
      return { changed, data: { backfilled: names, basis } };
    }

    const name = kebab(args.join(' '));
    if (!name) return { exitCode: 1, errors: [{ msg: 'name a component', fix: 'sketchbook approve <name> --by <name>' }] };
    const f = await load(root, name);
    if (!('file' in f)) return f;

    if (options.diff || options.carry) {
      const held = verifyApproval(f.record, f.contract, f.text).ok;
      const change = held ? null : classifyComponent(root, name, f.record, f.contract, f.text, config.prefix);
      const cls = held ? 'none' : change?.class ?? 'material';
      const data = { component: name, class: cls, contractKeys: change?.contractKeys ?? [], planSections: change?.planSections ?? [], snapshot: held || Boolean(change) };
      if (options.diff) {
        out(held ? `${name}: the approval holds; nothing changed.` : change ? `${name}: ${cls} change` : `${name}: no valid snapshot of the approval, so the change counts as material.`);
        for (const k of data.contractKeys) out(`  contract.${k}: ${JSON.stringify(change?.before[k])} -> ${JSON.stringify(change?.after[k])}`);
        for (const s of data.planSections) out(`  plan section: ${s || '(top)'}`);
        return { data };
      }
      if (cls === 'none') { out(`${name}: the approval holds; nothing to carry.`); return { data }; }
      if (cls === 'material') return { exitCode: 1, data, errors: [{ file: f.file, msg: `${name}: a material change needs a person's approval`, fix: `A person reviews it (sketchbook approve ${name} --diff) and runs sketchbook approve ${name} --by <name>.` }] };
      if (cls === 'editorial' && !config.approval?.triage) return { exitCode: 1, data, errors: [{ file: f.file, msg: 'approval.triage is off: an editorial change needs a person', fix: `sketchbook approve ${name} --by <name>, or turn on approval.triage in harness.config.json.` }] };
      const reason = options.reason?.trim() || (cls === 'mechanical' ? 'recorded token renames or prefix change' : '');
      if (!reason) return { exitCode: 1, data, errors: [{ msg: '--carry needs --reason for an editorial change', fix: `sketchbook approve ${name} --carry --reason "<why scope is unchanged>"` }] };
      const previous = readCarries(root, name, f.record);
      if (awaitingReview(f.record) && !previous) return { exitCode: 1, data, errors: [{ file: f.file, msg: 'the existing carry has no valid saved changes for review', fix: reviewFix(name) }] };
      let carries = previous ?? undefined;
      if (change?.class === 'editorial') {
        carries = [...(awaitingReview(f.record) ? previous ?? [] : []), {
          reason, on: today(),
          contract: change.contractKeys.map((key) => ({ key, before: change.before[key], after: change.after[key] })),
          plan: change.planChanges,
        }];
      }
      // Renaming after triage must not replace the reason a person still needs to review.
      const record: PlanRecord = cls === 'mechanical' && f.record['carried-by'] === 'triage' ? f.record
        : { ...f.record, 'carried-by': cls === 'editorial' ? 'triage' : 'sketchbook', 'carried-reason': reason, 'carried-on': today(), 'confirmed-by': undefined };
      if (dryRun) { out(`Would carry ${name}'s approval over ${cls === 'editorial' ? 'an' : 'a'} ${cls} change.`); return { changed: [f.file, snapshotFile(name)], data }; }
      const changed = await save(root, name, f, record, carries);
      out(`Carried ${name}'s approval over ${cls === 'editorial' ? 'an' : 'a'} ${cls} change${cls === 'editorial' ? '; a person confirms it with sketchbook approve --review' : ''}.`);
      return { changed, data };
    }

    if (!by) return { exitCode: 1, errors: [{ msg: 'approve needs the approving person', fix: `sketchbook approve ${name} --by <name>` }] };
    const advanced = !f.record.stage || f.record.stage === 'plan';
    const stage = advanced ? (config.features?.testFirst ? 'test' : 'implement') : f.record.stage ?? 'plan';
    const record: PlanRecord = {
      ...f.record, stage, next: advanced ? NEXT[stage] : f.record.next,
      'approved-by': by, 'approved-on': today(),
      'carried-by': undefined, 'carried-reason': undefined, 'carried-on': undefined, 'confirmed-by': undefined,
    };
    const data = { component: name, stage, approvedBy: by };
    if (dryRun) { out(`Would record ${by}'s approval of ${name} in ${f.file} (stage: ${stage}).`); return { changed: [f.file, snapshotFile(name)], data }; }
    const changed = await save(root, name, f, record);
    out(`Recorded ${by}'s approval of ${name} (stage: ${stage}). Check C4 fails if the contract or plan changes in scope.`);
    return { changed, next: `Continue at stage ${stage}; npm run check verifies the approval.`, data };
  },
} satisfies Command<typeof options>;
