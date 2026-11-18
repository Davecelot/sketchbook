import { ALIAS } from '../lib/tokens.mjs';
import { validate } from '../lib/schema.mjs';
import { cssVarName } from '../lib/css.mjs';
import { schemaOrThrow, type CheckContext, type CheckIssue, type CheckResult } from './types.mjs';

export const id = 'T1';
export const title = 'Token files are valid DTCG';

const TYPES = ['color', 'dimension', 'fontFamily', 'fontWeight', 'duration', 'cubicBezier', 'number', 'shadow'] as const;
type TokenType = (typeof TYPES)[number];
export const KNOWN: string[] = [...TYPES];
const isKnown = (t: string): t is TokenType => KNOWN.includes(t);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const shadowOk = (v: unknown): boolean => !!v && typeof v === 'object' && ['color', 'offsetX', 'offsetY', 'blur', 'spread'].every((k) => k in v);
export const VALUE: Record<TokenType, (v: unknown) => boolean> = {
  color: (v) => typeof v === 'string' && /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(v),
  dimension: (v) => typeof v === 'string' && /^-?\d*\.?\d+(px|rem|em)$/.test(v),
  duration: (v) => typeof v === 'string' && /^\d+(\.\d+)?(ms|s)$/.test(v),
  number: isNum,
  fontWeight: (v) => (isNum(v) && v >= 1 && v <= 1000) || typeof v === 'string',
  fontFamily: (v) => typeof v === 'string' || (Array.isArray(v) && v.every((x) => typeof x === 'string')),
  cubicBezier: (v) => Array.isArray(v) && v.length === 4 && v.every(isNum),
  shadow: (v) => shadowOk(v) || (Array.isArray(v) && v.every(shadowOk)),
};

export function run({ all, brand, schemas, config }: CheckContext): CheckResult {
  const errors: CheckIssue[] = [];
  for (const e of validate(schemaOrThrow(schemas.brand, 'brand-config'), brand)) errors.push({ file: 'brand.config.json', msg: e, fix: 'Match spec/schemas/brand-config.schema.json.' });
  for (const set of all.sets) {
    if (set.error) { errors.push({ file: set.file, msg: `not valid JSON: ${set.error}`, fix: 'Fix the JSON syntax.' }); continue; }
    for (const t of set.tokens) {
      const where = t.path;
      if (typeof t.value === 'string' && t.value.includes('{') && !ALIAS.test(t.value)) {
        errors.push({ file: t.file, token: where, msg: `math or partial alias "${t.value}" in a source file`, fix: 'Use a plain alias {a.b} or a literal value; math belongs in generated output, never in a source file.' });
        continue;
      }
      if (set.layer === 'component' && !t.type) continue; // inferred from the alias target (T2 checks it resolves)
      if (!t.type) { errors.push({ file: t.file, token: where, msg: 'no $type on the token or its groups', fix: 'Add $type to the token or a parent group.' }); continue; }
      if (!isKnown(t.type)) { errors.push({ file: t.file, token: where, msg: `unknown $type "${t.type}"`, fix: `Use one of: ${KNOWN.join(', ')}.` }); continue; }
      if (typeof t.value === 'string' && ALIAS.test(t.value)) continue;
      if (!VALUE[t.type](t.value)) errors.push({ file: t.file, token: where, msg: `value ${JSON.stringify(t.value)} is not a valid ${t.type}`, fix: t.type === 'color' ? 'Use #RRGGBB or #RRGGBBAA.' : t.type === 'dimension' ? 'Use a number with px or rem, e.g. "8px".' : `Use a valid ${t.type} value.` });
    }
  }
  // A path can't be both a token and a group (e.g. semantic color.primary vs a color.primary.* ramp):
  // flat resolution hides it, but merging builders (Style Dictionary) lose references.
  const paths = new Map<string, string>();
  for (const set of all.sets) for (const t of set.tokens) if (!paths.has(t.path)) paths.set(t.path, t.file);
  for (const [path, file] of paths) {
    const child = [...paths.keys()].find((p) => p.startsWith(path + '.'));
    if (child) errors.push({ file, token: path, msg: `"${path}" is both a token and a group (${child} in ${paths.get(child)})`, fix: 'Rename one of them; a path is either a token or a group.' });
  }
  // Two paths that differ only in dots and dashes (size.control.sm, size.control-sm) build one CSS variable:
  // the later declaration silently wins. Every layer shares one variable namespace.
  const byVar = new Map<string, { path: string; file: string }>();
  for (const [path, file] of paths) {
    const v = cssVarName(config?.prefix ?? 'sb', path);
    const other = byVar.get(v);
    if (other) errors.push({ file, token: path, msg: `"${path}" and "${other.path}" (${other.file}) both become ${v}`, fix: 'Rename one of them (sketchbook tokens rename): each token needs its own CSS variable.' });
    else byVar.set(v, { path, file });
  }
  return { errors };
}
