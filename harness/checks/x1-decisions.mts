import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CheckContext, CheckIssue, CheckResult } from './types.mjs';

export const id = 'X1';
export const title = 'Decision records are complete and referenced decisions exist';

// Typed decision records (one fact per place, settled decisions stay settled): each entry in
// spec/decisions/DECISIONS.md is "### SB-NNNN · YYYY-MM-DD · Title" with Context, Decision, Why and
// Watch out; optional **Status:** proposed | accepted | superseded | incident (default accepted) and
// **Supersedes:** SB-NNNN. Contracts may cite SB-NNNN (this file) or D-NNN (the harness spec log).
const HEAD = /^### (SB-\d{4}) · (\d{4}-\d{2}-\d{2}) · (.+)$/;
const REQUIRED = ['Context', 'Decision', 'Why', 'Watch out'];
const STATUS = ['proposed', 'accepted', 'superseded', 'incident'];

export interface DecisionEntry { id: string | undefined; date: string | undefined; title: string | undefined; head: string; body: string; status: string; supersedes: string | undefined; missing: string[] }

export function parseDecisions(text: string): DecisionEntry[] {
  const parts = text.split(/\n(?=### SB-\d{4} )/).slice(1);
  return parts.map((body) => {
    const head = body.split('\n')[0] ?? '';
    const m = HEAD.exec(head.trim());
    const field = (name: string) => new RegExp(`\\*\\*${name}:\\*\\*\\s*(.+)`).exec(body)?.[1]?.trim();
    return { id: m?.[1], date: m?.[2], title: m?.[3], head, body, status: field('Status') ?? 'accepted', supersedes: field('Supersedes'), missing: REQUIRED.filter((r) => !field(r)) };
  });
}

export function run({ root, all }: CheckContext): CheckResult {
  const errors: CheckIssue[] = [];
  const file = 'spec/decisions/DECISIONS.md';
  let text: string;
  try { text = readFileSync(join(root, file), 'utf8'); } catch { return { errors: [{ file, msg: 'missing decision log', fix: 'Create spec/decisions/DECISIONS.md.' }] }; }
  const entries = parseDecisions(text);
  const ids = new Set<string>();
  for (const e of entries) {
    if (!e.id) { errors.push({ file, msg: `entry heading "${e.head.slice(0, 60)}" is not "### SB-NNNN · YYYY-MM-DD · Title"`, fix: 'Fix the heading.' }); continue; }
    if (ids.has(e.id)) errors.push({ file, token: e.id, msg: 'duplicate decision id', fix: 'Use the next free id.' });
    ids.add(e.id);
    if (e.missing.length) errors.push({ file, token: e.id, msg: `missing ${e.missing.join(', ')}`, fix: 'Every decision says Context, Decision, Why and Watch out.' });
    if (!STATUS.includes(e.status)) errors.push({ file, token: e.id, msg: `status "${e.status}"`, fix: `Use one of ${STATUS.join(', ')}.` });
  }
  for (const e of entries) {
    if (e.supersedes && !ids.has(e.supersedes)) errors.push({ file, token: e.id, msg: `supersedes unknown ${e.supersedes}`, fix: 'Point to an existing decision.' });
  }
  const index = text.split(/\n---\n/)[0] ?? '';
  for (const i of ids) if (!index.includes(i)) errors.push({ file, token: i, msg: 'not listed in the index', fix: 'Add it to the "## Index" section.' });
  for (const { name, contract } of all.contracts) {
    for (const d of contract?.decisions ?? []) {
      if (/^SB-\d{4}$/.test(d) && !ids.has(d)) errors.push({ file: `spec/components/${name}/contract.json`, token: d, msg: 'cites a decision that does not exist', fix: 'Fix the id, or record the decision.' });
      else if (!/^(SB-\d{4}|D-\d{3})$/.test(d)) errors.push({ file: `spec/components/${name}/contract.json`, token: d, msg: 'decision ids are SB-NNNN or D-NNN', fix: 'Fix the id.' });
    }
  }
  return { errors };
}
