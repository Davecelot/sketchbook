import type { CheckContext, CheckIssue, CheckResult } from './types.mjs';

export const id = 'C2';
export const title = 'Contract token references point at real tokens';

// T2 checks every component token's alias; C2 checks the token names a contract mentions elsewhere
// (states, contrast pairs) so a renamed token can't leave stale references behind.
export function run({ all }: CheckContext): CheckResult {
  const errors: CheckIssue[] = [];
  const known = new Set(all.sets.flatMap((s) => s.tokens.map((t) => t.path)));
  for (const { file, contract } of all.contracts) {
    if (!contract?.component) continue;
    const own = new Set(Object.keys(contract.tokens || {}));
    for (const [state, s] of Object.entries(contract.states || {})) {
      for (const t of s.tokens || []) if (!own.has(t)) errors.push({ file, token: t, msg: `state "${state}" lists ${t}, which is not one of this contract's tokens`, fix: 'Add it to tokens, or fix the name.' });
    }
    for (const p of contract.accessibility?.contrast || []) {
      for (const t of [p.fg, p.bg]) {
        const ownOrOther = own.has(t) || known.has(t);
        if (!ownOrOther) errors.push({ file, token: t, msg: `contrast pair names ${t}, which does not exist`, fix: 'Use a component token of this contract or an existing semantic token.' });
        else if (!own.has(t) && t.split('.')[0] !== 'color') errors.push({ file, token: t, msg: `contrast pair uses ${t}; pairs use this contract's tokens or semantic color tokens`, fix: 'Point to a color token.' });
      }
    }
  }
  return { errors };
}
