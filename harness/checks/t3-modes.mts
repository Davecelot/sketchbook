import { modeNames } from '../standards/resolve.mjs';
import type { CheckContext, CheckIssue, CheckResult } from './types.mjs';

export const id = 'T3';
export const title = 'Every semantic token exists in every mode';

export function run({ all, brand }: CheckContext): CheckResult {
  const errors: CheckIssue[] = [];
  const modes = modeNames(brand);
  const bySet = new Map(all.sets.flatMap((s): [string, Set<string>][] => (s.layer === 'semantic' && s.mode ? [[s.mode, new Set(s.tokens.map((t) => t.path))]] : [])));
  for (const m of modes) if (!bySet.has(m)) errors.push({ file: `spec/tokens/semantic/${m}.tokens.json`, msg: `mode "${m}" from brand.config.json has no semantic file`, fix: `Create spec/tokens/semantic/${m}.tokens.json, or run npm run tokens:generate.` });
  for (const m of bySet.keys()) if (!modes.includes(m)) errors.push({ file: `spec/tokens/semantic/${m}.tokens.json`, msg: `mode "${m}" is not listed in brand.config.json modes`, fix: 'Add it to modes, or rename the file to base.tokens.json if it is mode-independent.' });
  const union = new Set([...bySet.values()].flatMap((s) => [...s]));
  for (const [mode, paths] of bySet) {
    for (const p of union) if (!paths.has(p)) errors.push({ file: `spec/tokens/semantic/${mode}.tokens.json`, token: p, mode, msg: `missing in mode ${mode}`, fix: `Add ${p} to the ${mode} set; modes must define the same tokens.` });
  }
  return { errors };
}
