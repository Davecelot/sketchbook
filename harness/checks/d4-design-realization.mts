import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { LIBRARY_VERIFY, realizationOf } from '../lib/design/realize.mjs';
import type { CheckContext, CheckIssue, CheckResult } from './types.mjs';

export const id = 'D4';
export const title = 'A complete design realization is read back clean, and every token the styles use is drawn or recorded as drift';

// Only contracts whose realizations.design claims complete are held to it; a partial one that now qualifies is a warning.
// A project whose library was never read back (a copy of the reference contracts) is not checked, as D1 does for a sync.
export async function run({ root, config, all }: CheckContext): Promise<CheckResult> {
  const errors: CheckIssue[] = [];
  const warnings: CheckIssue[] = [];
  const tool = config.adapters?.design?.tool;
  if (!tool || tool === 'none') return { errors, warnings, info: [{ note: 'no design adapter configured' }] };
  if (!existsSync(join(root, LIBRARY_VERIFY))) return { errors, warnings, info: [{ note: 'library never read back' }] };
  for (const { name, contract } of all.contracts) {
    const design = contract?.realizations?.design;
    if (!design || design.status === 'not-started') continue;
    const file = `spec/components/${name}/contract.json`;
    const r = await realizationOf(root, name);
    if (design.status !== 'complete') {
      if (r.complete) warnings.push({ file, msg: `${contract.component}: the design realization is complete but recorded as ${design.status}`, fix: `sketchbook sync realize ${name}` });
      continue;
    }
    for (const s of r.sets.filter((x) => x.verified !== 'ok')) errors.push({ file, token: s.title, msg: `set ${s.title} is ${s.verified === 'missing' ? 'not read back' : s.verified === 'stale' ? 'read back before the contract last changed' : `read back with problems: ${s.problems.slice(0, 2).join('; ')}`}`, fix: `sketchbook sync verify-library ${name}, run it, then sketchbook sync verify-library --ingest <file>` });
    for (const t of r.unexplained) errors.push({ file, token: t, msg: `${t} is used by the styles and drawn by no set, with no drift entry`, fix: 'Draw it, or add realizations.design.drift { aspect: <token>, contract, realization: <why it is not drawn> }.' });
    for (const t of r.staleDrift) errors.push({ file, token: t, msg: `drift entry ${t} names a token the design file now draws`, fix: 'Remove the drift entry.' });
    const sets = Object.fromEntries(r.sets.map((s) => [s.title, s.variants]));
    if (JSON.stringify(sets) !== JSON.stringify(design.properties?.sets ?? {})) errors.push({ file, msg: `${contract.component}: the recorded sets differ from what the library draws now`, fix: `sketchbook sync realize ${name}` });
  }
  return { errors, warnings };
}
