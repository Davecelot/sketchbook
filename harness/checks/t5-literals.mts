import { allowedLiteral, literalsIn } from '../lib/css.mjs';
import type { CheckContext, CheckIssue, CheckResult } from './types.mjs';

export const id = 'T5';
export const title = 'No hard-coded values where a token exists';

const FIX: Record<string, string> = { 'color literal': 'Use a color component token.', 'color function': 'Use a color component token.', 'length literal': 'Use a dimension component token (spacing, size, radius, border width).' };

export function run({ css }: CheckContext): CheckResult {
  const errors: CheckIssue[] = [];
  const warnings: CheckIssue[] = [];
  for (const sheet of css) {
    if (sheet.error || !sheet.ast) continue;
    sheet.ast.walkDecls((decl) => {
      const allowed = allowedLiteral(decl);
      for (const l of literalsIn(decl)) {
        const msg = l.what === 'z-index literal' ? l.what : `${l.what} "${l.match}"`;
        const item = { file: sheet.file, line: decl.source?.start?.line, token: `${decl.prop}: ${decl.value}`, msg, fix: FIX[l.what] ?? l.fix };
        if (allowed) warnings.push({ ...item, msg: `${item.msg} allowed by sketchbook-allow-literal comment` });
        else errors.push(item);
      }
    });
  }
  return { errors, warnings };
}
