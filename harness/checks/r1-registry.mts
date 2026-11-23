import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { auditsOf, PARITY_AUDITS, A11Y_AUDITS } from '../lib/audits.mjs';
import type { ComponentRegistry } from '../../generated/types/registry.js';
import type { Realization } from '../../generated/types/contract.js';
import type { CheckContext, CheckIssue, CheckResult } from './types.mjs';

export const id = 'R1';
export const title = 'Registry statuses are backed by evidence';

const kebab = (s: string): string => s.toLowerCase().replace(/ /g, '-');
const RANK: Record<ComponentRegistry['components'][number]['status'], number> = { planned: 0, draft: 1, wip: 2, beta: 3, stable: 4, deprecated: 5, 'code-only': 3 };

// draft: contract exists. beta: web files, stories and behavior spec exist, C3 has no errors for it.
// stable: also a parity audit report, an a11y audit report whose verdict is ready, an approval line
// ("Approved-by:") in that report, and the design realization complete.
export function run({ root, all, registry, previous }: CheckContext): CheckResult {
  const errors: CheckIssue[] = [];
  const c3 = previous.find((r) => r.id === 'C3');
  for (const c of registry.components) {
    const name = kebab(c.name);
    const rank = RANK[c.status];
    const contract = all.contracts.find((x) => x.name === name)?.contract;
    const fail = (msg: string, fix: string) => errors.push({ file: 'spec/registry.json', token: c.name, msg: `${c.status}: ${msg}`, fix });
    if (rank >= 1 && !contract) { fail('no contract', `Write spec/components/${name}/contract.json or set status planned.`); continue; }
    if (rank < 3 || c.status === 'deprecated' || !contract) continue;
    const web: Realization = contract.realizations?.web || {};
    for (const f of web.files || []) if (!existsSync(join(root, f))) fail(`missing ${f}`, 'Build it, or lower the status.');
    if (!web.files?.some((f) => f.endsWith('.stories.ts'))) fail('no stories file listed in realizations.web.files', 'Add the stories file.');
    if (!web.spec || !existsSync(join(root, web.spec))) fail('no behavior spec', 'Write the Playwright behavior spec (test-first).');
    if (c3?.errors.some((e) => web.files?.some((f) => f === e.file))) fail('contract/code parity errors (C3)', 'Fix C3 first.');
    if (rank >= 4) {
      if (!auditsOf(root, PARITY_AUDITS, name).length) fail('no parity audit report', 'Run the parity-auditor brief of the component-builder skill (writes docs/parity-audits/<name>-<date>.md).');
      const a11y = auditsOf(root, A11Y_AUDITS, name);
      const last = a11y.at(-1);
      const latest = last !== undefined ? readFileSync(join(root, A11Y_AUDITS, last), 'utf8') : '';
      if (!latest) fail('no a11y audit report', 'Run the a11y-auditor brief of the a11y-checker skill (writes docs/a11y-audits/<name>-<date>.md).');
      else {
        if (!/verdict:\s*ready/i.test(latest)) fail('latest a11y audit is not "Verdict: ready"', 'Fix the findings and re-run the a11y-auditor brief of the a11y-checker skill.');
        if (!/^Approved-by:\s*\S/m.test(latest)) fail('no person approved it (Approved-by: line in the a11y audit)', 'A person reviews the component and adds "Approved-by: <name>" to the latest a11y audit.');
      }
      if (contract.realizations?.design?.status !== 'complete') fail('design realization not complete', 'Sync the design file.');
    }
  }
  return { errors };
}
