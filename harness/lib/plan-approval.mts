import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { frontmatter } from './claude-layer.mjs';
import { atRisk } from '../commands/catalog.mjs';
import type { CheckContext, CheckIssue } from '../checks/types.mjs';

export const STAGES = ['plan', 'test', 'implement', 'review', 'ready'] as const;
export type Stage = (typeof STAGES)[number];

export interface PlanRecord {
  stage?: string;
  next?: string;
  blocker?: string;
  basis?: string;
  'test-first'?: string;
  'approved-by'?: string;
  'approved-on'?: string;
  'approved-contract'?: string;
  'approved-plan'?: string;
  'carried-by'?: string;
  'carried-reason'?: string;
  'carried-on'?: string;
  'confirmed-by'?: string;
}

const FIELDS: (keyof PlanRecord)[] = ['stage', 'next', 'blocker', 'basis', 'test-first', 'approved-by', 'approved-on', 'approved-contract', 'approved-plan', 'carried-by', 'carried-reason', 'carried-on', 'confirmed-by'];
const FRONTMATTER = /^---\n[\s\S]*?\n---\n/;
export const PROCESS_RECORD = /^spec\/components\/[^/]+\/(plan\.md|approved\.json|evidence\.json)$/;
export const planFile = (name: string): string => `spec/components/${name}/plan.md`;

// Build and release metadata changes while the approved scope is built, so it stays out of the digest.
const UNSCOPED = new Set(['$schema', 'status', 'version', 'realizations']);

export const sorted = (v: unknown): unknown => (Array.isArray(v) ? v.map(sorted)
  : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sorted((v as Record<string, unknown>)[k])])) : v);
export const sha = (s: string): string => `sha256:${createHash('sha256').update(s).digest('hex')}`;

export function scopedContract(contract: object): Record<string, unknown> {
  return sorted(Object.fromEntries(Object.entries(contract).filter(([k]) => !UNSCOPED.has(k)))) as Record<string, unknown>;
}

export function contractDigest(contract: object): string {
  return sha(JSON.stringify(scopedContract(contract)));
}

export function planBody(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(FRONTMATTER, '').trim();
}

export function planDigest(text: string): string {
  return sha(planBody(text));
}

export function planFrontmatter(text: string): string {
  return /^---\r?\n[\s\S]*?\r?\n---\r?\n/.exec(text)?.[0] ?? '';
}

export function readRecord(text: string): PlanRecord | null {
  const fm = frontmatter(text.replace(/\r\n/g, '\n'));
  if (!fm) return null;
  return Object.fromEntries(FIELDS.filter((k) => typeof fm[k] === 'string').map((k) => [k, fm[k]]));
}

export function writeRecord(text: string, record: PlanRecord): string {
  const lines = FIELDS.filter((k) => record[k]).map((k) => `${k}: ${String(record[k]).replace(/\n/g, ' ')}`);
  return `---\n${lines.join('\n')}\n---\n\n${planBody(text)}\n`;
}

export interface Approval { ok: boolean; problem?: string }

export function verifyApproval(record: PlanRecord, contract: object, planText: string): Approval {
  if (!record['approved-contract'] && !record['approved-plan']) return { ok: false, problem: 'not approved' };
  if (!record['approved-by']) return { ok: false, problem: 'approval names no person (approved-by)' };
  if (record['approved-contract'] !== contractDigest(contract)) return { ok: false, problem: 'the contract changed after approval' };
  if (record['approved-plan'] !== planDigest(planText)) return { ok: false, problem: 'the plan changed after approval' };
  return { ok: true };
}

// What was approved, so a later change can be classified (contract-diff.mts). Written only by sketchbook approve.
export interface Snapshot { contract: Record<string, unknown>; plan: string }

export const snapshotFile = (name: string): string => `spec/components/${name}/approved.json`;

export function snapshotOf(contract: object, planText: string): Snapshot {
  return { contract: scopedContract(contract), plan: planBody(planText) };
}

// The snapshot counts only while it is exactly what the record approved.
export function readSnapshot(root: string, name: string, record: PlanRecord): Snapshot | null {
  const file = join(root, snapshotFile(name));
  if (!existsSync(file)) return null;
  try {
    const snap = JSON.parse(readFileSync(file, 'utf8')) as Snapshot;
    return sha(JSON.stringify(sorted(snap.contract))) === record['approved-contract'] && sha(snap.plan) === record['approved-plan'] ? snap : null;
  } catch { return null; }
}

export function stamp(record: PlanRecord, contract: object, planText: string): PlanRecord {
  return { ...record, 'approved-contract': contractDigest(contract), 'approved-plan': planDigest(planText) };
}

// An unchanged installed unit needs no local plan. A component already carrying process evidence must keep its plan,
// even if its current sources happen to match the catalog.
export function missingPlanIssues({ root, all, config }: CheckContext): CheckIssue[] {
  if (!config.approval?.requireRecord) return [];
  const missing = all.contracts.filter(({ name, contract }) => contract && !existsSync(join(root, planFile(name))));
  if (!missing.length) return [];
  const local = new Set(atRisk(root, missing.map(({ name }) => name)).map(({ name }) => name));
  return missing.filter(({ name }) => local.has(name) || [snapshotFile(name), `spec/components/${name}/evidence.json`].some((f) => existsSync(join(root, f))))
    .map(({ name }) => ({ file: planFile(name), token: name, msg: 'missing plan (approval.requireRecord)', fix: 'Restore the recorded plan, or write a plan with stage: plan and have a person approve it before implementation.' }));
}
