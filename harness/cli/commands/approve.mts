import { existsSync, readdirSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { kebab } from '../../commands/catalog.mjs';
import { parseJson } from '../../lib/files.mjs';
import { readRecord, snapshotFile, snapshotOf, stamp, verifyApproval, writeRecord } from '../../lib/plan-approval.mjs';
import { classifyComponent } from '../../lib/contract-diff.mjs';
import type { PlanRecord } from '../../lib/plan-approval.mjs';
import type { HarnessConfigJson } from '../../../generated/types/harness-config.js';
import type { ComponentRegistry } from '../../../generated/types/registry.js';
import type { Command, CommandResult, OptionSpecs } from '../types.mjs';

const options = {
  by: { type: 'string', value: 'name', description: 'The person approving (approve, --backfill) or confirming carried approvals (--review)' },
  diff: { type: 'boolean', description: 'Show what changed since the approval and how the CLI classifies it (none, mechanical, editorial, material). Read-only' },
  carry: { type: 'boolean', description: 'Carry the approval over a mechanical change, or an editorial one when approval.triage is on. Refuses a material change' },
  reason: { type: 'string', value: 'text', description: 'With --carry: why the approved scope is unchanged (required for an editorial change)' },
  review: { type: 'boolean', description: 'List approvals carried by triage; with --by, confirm them all' },
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

interface Files { planFile: string; text: string; contract: object; record: PlanRecord }

async function load(root: string, name: string): Promise<Files | CommandResult> {
  const contractFile = `spec/components/${name}/contract.json`;
  const planFile = `spec/components/${name}/plan.md`;
  for (const f of [contractFile, planFile]) if (!existsSync(join(root, f))) return { exitCode: 1, errors: [{ file: f, msg: 'missing', fix: 'Write the contract and plan first (contract-author workflow).' }] };
  const text = await readFile(join(root, planFile), 'utf8');
  return { planFile, text, contract: parseJson<object>(await readFile(join(root, contractFile), 'utf8')), record: readRecord(text) ?? {} };
}

async function save(root: string, name: string, f: Files, record: PlanRecord): Promise<string[]> {
  await writeFile(join(root, f.planFile), writeRecord(f.text, stamp(record, f.contract, f.text)));
  await writeFile(join(root, snapshotFile(name)), JSON.stringify(snapshotOf(f.contract, f.text), null, 2) + '\n');
  return [f.planFile, snapshotFile(name)];
}

const plans = (root: string): string[] => readdirSync(join(root, 'spec/components'))
  .filter((n) => existsSync(join(root, 'spec/components', n, 'plan.md')) && existsSync(join(root, 'spec/components', n, 'contract.json')));

export default {
  name: 'approve',
  group: 'components',
  summary: 'Record a person’s approval of a component’s contract and plan, or carry it over a change that leaves the scope as approved. Check C4 verifies it.',
  args: [{ name: 'Component Name', required: false, variadic: true, description: 'Component with spec/components/<name>/contract.json and plan.md (not with --review or --backfill)' }],
  options,
  examples: ['sketchbook approve switch --by "Ana Diaz"', 'sketchbook approve switch --diff', 'sketchbook approve switch --carry --reason "Reworded the summary"', 'sketchbook approve --review --by Ana', 'sketchbook approve --backfill --by Ana --basis SB-0011 --dry-run'],
  mutates: true,
  dryRun: true,
  async run({ root, args, options, dryRun, out }) {
    const config = parseJson<HarnessConfigJson>(await readFile(join(root, 'harness.config.json'), 'utf8'));
    const by = options.by?.trim();

    if (options.review) {
      const pending: Files[] = [];
      const names: string[] = [];
      for (const name of plans(root)) {
        const f = await load(root, name) as Files;
        if (f.record['carried-by'] === 'triage' && !f.record['confirmed-by']) { pending.push(f); names.push(name); out(`${name}: ${f.record['carried-reason'] ?? '(no reason)'} (carried ${f.record['carried-on'] ?? '?'})`); }
      }
      if (!pending.length) out('No carried approvals await review.');
      if (!by || dryRun || !pending.length) return { data: { pending: names }, next: pending.length && !by ? 'Review each change (git diff), then: sketchbook approve --review --by <name>' : null };
      for (const f of pending) await writeFile(join(root, f.planFile), writeRecord(f.text, { ...f.record, 'confirmed-by': by }));
      out(`${by} confirmed ${pending.length} carried approval(s).`);
      return { changed: pending.map((f) => f.planFile), data: { pending: names, confirmedBy: by } };
    }

    if (options.backfill) {
      const basis = options.basis?.trim();
      if (!by || !basis) return { exitCode: 1, errors: [{ msg: '--backfill needs --by and --basis', fix: 'sketchbook approve --backfill --by <name> --basis <ref> --dry-run' }] };
      const registry = parseJson<ComponentRegistry>(await readFile(join(root, 'spec/registry.json'), 'utf8'));
      const status = new Map(registry.components.map((c) => [kebab(c.name), c.status]));
      const changed: string[] = [];
      const names: string[] = [];
      for (const name of plans(root)) {
        const f = await load(root, name) as Files;
        if (readRecord(f.text)) continue;
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
    if (!('planFile' in f)) return f;

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
      if (cls === 'material') return { exitCode: 1, data, errors: [{ file: f.planFile, msg: `${name}: a material change needs a person's approval`, fix: `A person reviews it (sketchbook approve ${name} --diff) and runs sketchbook approve ${name} --by <name>.` }] };
      if (cls === 'editorial' && !config.approval?.triage) return { exitCode: 1, data, errors: [{ file: f.planFile, msg: 'approval.triage is off: an editorial change needs a person', fix: `sketchbook approve ${name} --by <name>, or turn on approval.triage in harness.config.json.` }] };
      const reason = options.reason?.trim() || (cls === 'mechanical' ? 'recorded token renames or prefix change' : '');
      if (!reason) return { exitCode: 1, data, errors: [{ msg: '--carry needs --reason for an editorial change', fix: `sketchbook approve ${name} --carry --reason "<why scope is unchanged>"` }] };
      // Renaming after triage must not replace the reason a person still needs to review.
      const record: PlanRecord = cls === 'mechanical' && f.record['carried-by'] === 'triage' ? f.record
        : { ...f.record, 'carried-by': cls === 'editorial' ? 'triage' : 'sketchbook', 'carried-reason': reason, 'carried-on': today(), 'confirmed-by': undefined };
      if (dryRun) { out(`Would carry ${name}'s approval over ${cls === 'editorial' ? 'an' : 'a'} ${cls} change.`); return { changed: [f.planFile, snapshotFile(name)], data }; }
      const changed = await save(root, name, f, record);
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
    if (dryRun) { out(`Would record ${by}'s approval of ${name} in ${f.planFile} (stage: ${stage}).`); return { changed: [f.planFile, snapshotFile(name)], data }; }
    const changed = await save(root, name, f, record);
    out(`Recorded ${by}'s approval of ${name} (stage: ${stage}). Check C4 fails if the contract or plan changes in scope.`);
    return { changed, next: `Continue at stage ${stage}; npm run check verifies the approval.`, data };
  },
} satisfies Command<typeof options>;
