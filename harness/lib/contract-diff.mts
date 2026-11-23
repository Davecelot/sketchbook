import { applyRenames, readRenames, semanticPaths } from './renames.mjs';
import { planBody, readSnapshot, scopedContract, sorted } from './plan-approval.mjs';
import { rewrite } from '../commands/prefix.mjs';
import type { Rename } from './renames.mjs';
import type { CarryDiff, PlanRecord, Snapshot } from './plan-approval.mjs';

// none: nothing in scope changed. mechanical: explained by recorded token renames or a prefix change (no person needed).
// editorial: wording only (an agent may carry it when approval.triage is on). material: a person approves again.
export type ChangeClass = 'none' | 'mechanical' | 'editorial' | 'material';

export interface Classification {
  class: ChangeClass;
  contractKeys: string[];
  planSections: string[];
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  planChanges: CarryDiff['plan'];
}

const EDITORIAL_KEYS = new Set(['summary', 'aiHints', 'openQuestions', 'decisions']);
const MATERIAL_SECTION = /^(scope|files|test plan|accessibility)/i;

const same = (a: unknown, b: unknown): boolean => JSON.stringify(sorted(a)) === JSON.stringify(sorted(b));
const prefixOf = (c: Record<string, unknown>): string => (typeof c.tag === 'string' ? c.tag.split('-')[0] ?? '' : '');

function sections(body: string): Map<string, string[]> {
  const out = new Map<string, string[]>();
  let title = '';
  let lines: string[] = [];
  let fence = '';
  const push = (): void => {
    const content = lines.join('\n').replace(/\n+$/, '');
    const existing = out.get(title);
    if (existing) existing.push(content);
    else out.set(title, [content]);
  };
  for (const line of body.split('\n')) {
    const marker = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    if (fence) {
      const end = marker?.[1] ?? '';
      if (end[0] === fence[0] && end.length >= fence.length && !marker?.[2]?.trim()) fence = '';
      lines.push(line);
      continue;
    }
    if (marker?.[1]) { fence = marker[1]; lines.push(line); continue; }
    const h = /^ {0,3}##[ \t]+(.+)$/.exec(line);
    if (h) { push(); title = (h[1] ?? '').trim(); lines = [line]; } else lines.push(line);
  }
  push();
  return out;
}

export function classify(snap: Snapshot, contract: object, planText: string, { renames = [], prefix = '', paths = [] }: { renames?: Rename[]; prefix?: string; paths?: string[] } = {}): Classification {
  const after = scopedContract(contract);
  const currentPlan = planBody(planText);
  const from = prefixOf(snap.contract);
  const rebrand = (text: string): string => from && prefix && from !== prefix ? rewrite(text, from, prefix).text : text;
  const before = JSON.parse(applyRenames(rebrand(JSON.stringify(snap.contract)), renames, prefix, { file: 'contract.json', paths })) as Record<string, unknown>;
  const priorPlan = rebrand(snap.plan);
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter((k) => !same(before[k], after[k]));
  const a = sections(priorPlan);
  const b = sections(currentPlan);
  const planSections = [...new Set([...a.keys(), ...b.keys()])].filter((t) => !same(a.get(t), b.get(t)));
  const planChanges = planSections.map((section) => ({ section, before: a.get(section), after: b.get(section) }));
  const result = { contractKeys: keys, planSections, before, after, planChanges };
  if (same(snap.contract, after) && snap.plan === currentPlan) return { class: 'none', ...result };
  if (!keys.length && priorPlan === currentPlan) return { class: 'mechanical', ...result };
  // Grouping sections labels a diff but is not proof that the approved body is unchanged.
  if (!planSections.length && priorPlan !== currentPlan) return { class: 'material', ...result };
  if (!same([...a.keys()].filter((t) => b.has(t)), [...b.keys()].filter((t) => a.has(t)))) return { class: 'material', ...result };
  const editorial = keys.every((k) => EDITORIAL_KEYS.has(k)) && planSections.every((t) => !MATERIAL_SECTION.test(t));
  return { class: editorial ? 'editorial' : 'material', ...result };
}

export function classifyComponent(root: string, name: string, record: PlanRecord, contract: object, planText: string, prefix: string): Classification | null {
  const snap = readSnapshot(root, name, record);
  return snap && classify(snap, contract, planText, { renames: readRenames(root), prefix, paths: semanticPaths(root) });
}
