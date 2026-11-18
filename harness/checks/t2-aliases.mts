import { ALIAS, tokensForMode, resolve, type Layer } from '../lib/tokens.mjs';
import type { CheckContext, CheckIssue, CheckResult } from './types.mjs';

export const id = 'T2';
export const title = 'Aliases resolve and respect the layers';

// Each layer may reference only the layer directly below it (D-011).
const ALLOWED: Record<Layer, Layer[]> = { foundation: [], semantic: ['foundation'], component: ['semantic'] };

export function run({ all }: CheckContext): CheckResult {
  const errors: CheckIssue[] = [];
  const seen = new Set<string>();
  const modes: (string | null)[] = all.modes.length ? all.modes : [null];
  for (const mode of modes) {
    const map = tokensForMode(all, mode);
    for (const t of map.values()) {
      const m = typeof t.value === 'string' ? ALIAS.exec(t.value) : null;
      if (!m) continue;
      const ref = m[1] ?? '';
      const target = map.get(ref);
      const report = (msg: string, fix: string) => { const k = `${t.file}|${t.path}|${msg}`; if (!seen.has(k)) { seen.add(k); errors.push({ file: t.file, token: t.path, mode, msg, fix }); } };
      if (!target) { report(`alias {${ref}} does not exist${mode ? ` in mode ${mode}` : ''}`, 'Point to an existing token, or add it in the layer below.'); continue; }
      if (!ALLOWED[t.layer].includes(target.layer)) {
        report(`${t.layer} token aliases ${target.layer} token {${ref}}`, t.layer === 'foundation' ? 'Foundation tokens hold literal values.' : `A ${t.layer} token may only alias a ${ALLOWED[t.layer][0]} token. Add or use a ${ALLOWED[t.layer][0]} token in between.`);
      }
      const r = resolve(map, t.path);
      if (r.error === 'cycle') report(`alias cycle: ${r.chain.join(' -> ')}`, 'Break the cycle.');
      else if (r.error) report(`chain breaks at {${r.path}}`, 'Fix the missing token in the chain.');
      if (t.type && target.type && t.type !== target.type) report(`type ${t.type} aliases a ${target.type} token`, 'Alias a token of the same $type.');
    }
  }
  return { errors };
}
