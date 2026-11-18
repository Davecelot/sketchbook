import type { AtRule, Declaration } from 'postcss';
import { VAR_REF, cssVarName } from '../lib/css.mjs';
import type { CheckContext, CheckIssue, CheckResult } from './types.mjs';

export const id = 'T4';
export const title = 'Component CSS uses its own component tokens, and every one of them';

const kebab = (s: string): string => s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

export function run({ all, css, config }: CheckContext): CheckResult {
  const errors: CheckIssue[] = [];
  const prefix = config.prefix;
  for (const sheet of css) {
    if (sheet.error) { errors.push({ file: sheet.file, msg: `CSS does not parse: ${sheet.error}`, fix: 'Fix the CSS syntax.' }); continue; }
    const { ast } = sheet;
    if (!ast) continue;
    const entry = all.contracts.find((c) => c.name === sheet.name);
    if (!entry?.contract) { errors.push({ file: sheet.file, msg: `no contract at spec/components/${sheet.name}/contract.json`, fix: 'Every component needs a contract before code (D-003).' }); continue; }
    const { contract } = entry;
    const own = Object.keys(contract.tokens || {});
    const ownVars = new Map(own.map((p) => [cssVarName(prefix, p), p]));
    const used = new Set<string>();
    // Declarations, @include arguments (shared mixins receive token variables as arguments) and @media conditions
    // (a length token there is inlined at build time, SB-0109).
    const visit = (node: Declaration | AtRule, text: string) => {
      for (const [, name = ''] of text.matchAll(VAR_REF)) {
        if (name.startsWith('--_')) continue; // private, component-local custom property
        if (ownVars.has(name)) { used.add(name); continue; }
        const isDs = name.startsWith(`--${prefix}-`);
        errors.push({
          file: sheet.file, token: name, line: node.source?.start?.line,
          msg: isDs ? `uses ${name}, which is not one of ${contract.component}'s component tokens` : `uses ${name}, which is not a design token`,
          fix: `Add a component token to the contract (e.g. "${kebab(sheet.name)}.<part>": "{semantic.token}") and use its variable.`,
        });
      }
    };
    ast.walkDecls((decl) => visit(decl, decl.value));
    ast.walkAtRules('include', (rule) => visit(rule, rule.params));
    ast.walkAtRules('media', (rule) => visit(rule, rule.params));
    for (const [v, path] of ownVars) if (!used.has(v)) errors.push({ file: sheet.file, token: path, msg: `component token ${path} is in the contract but never used`, fix: 'Use it in the CSS, or remove it from the contract.' });
  }
  return { errors };
}
