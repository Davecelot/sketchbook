import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { hasClaudeLayer, STAGED } from '../lib/agent-config.mjs';
import { alwaysOnContext, claudeLayerProblems } from '../lib/claude-layer.mjs';
import type { CheckContext, CheckIssue, CheckResult } from './types.mjs';

export const id = 'H1';
export const title = 'Claude layer: every skill, brief and command loads, skills follow the standard, and only real CLI commands are named, within the always-on context budget';

export function run({ root, config }: CheckContext): CheckResult {
  const profiles = config?.agentProfiles;
  const configured = Array.isArray(profiles);
  if (configured && !profiles.includes('claude')) return { errors: [], info: ['Claude integration is unselected'] };
  const installed = configured ? hasClaudeLayer(root, '.claude') : existsSync(join(root, '.claude'));
  const staged = configured ? hasClaudeLayer(root, STAGED) : existsSync(join(root, STAGED));
  if (!installed && !staged) return { errors: [], info: ['no .claude/ here: no Claude layer to check'] };
  // While staged, the staged layer is what is checked, even next to a .claude/ the team already had.
  const base = staged ? STAGED : '.claude';
  const p = claudeLayerProblems(root, undefined, base);
  const errors: CheckIssue[] = [
    ...p.frontmatter.map((msg) => ({ file: msg.split(':')[0], msg, fix: 'Give it frontmatter with a name (its folder or file name) and a description.' })),
    ...p.skills.map((msg) => ({ file: msg.split(':')[0], msg, fix: 'Follow the skill standard (.claude/skills/forge-me-a-skill; add it with sketchbook init --with forge).' })),
    ...p.commands.map((msg) => ({ file: msg.split(':')[0], msg, fix: 'Name only commands that sketchbook help lists (harness/cli/known-commands.json).' })),
  ];
  const warnings: CheckIssue[] = [];
  const budget = config?.contextBudget?.alwaysOnBytes;
  if (budget) {
    const { parts, total, unmeasured } = alwaysOnContext(root, base);
    if (unmeasured.length) warnings.push({ file: `${base}/settings.json`, msg: `${unmeasured.length} hook(s) not run, so not measured (${unmeasured.slice(0, 3).join('; ')}${unmeasured.length > 3 ? '; …' : ''})`, fix: 'A check runs only the hooks the harness ships, unchanged (SB-0116): a hook of your own still adds to the context but is not counted here, so leave room for it in the budget.' });
    const usage = `${total} of ${budget} bytes (${Math.round((total / budget) * 100)}%: ${Object.entries(parts).map(([k, v]) => `${k} ${v}`).join(', ')})`;
    const fix = 'Give a task-specific rule paths:, shorten a description or CLAUDE.md, make a rarely used skill slash-only (disable-model-invocation), or inject less from a hook. The budget is the team\'s (harness.config.json contextBudget.alwaysOnBytes): raise it only with a reason and measure the change with docs/research/value-benchmark/scripts/fixed-context.mjs (SB-0114).';
    if (total > budget) errors.push({ file: 'harness.config.json', msg: `the Claude layer puts ${usage} in context every session, over budget`, fix });
    else if (total >= budget * 0.9) warnings.push({ file: 'harness.config.json', msg: `the Claude layer puts ${usage} in context every session, close to the budget`, fix });
  }
  if (staged) warnings.push({ file: STAGED, msg: 'the Claude layer is staged, not installed: its skills, rules and hooks are not active yet', fix: `For Claude Code, optionally install the layer from ${STAGED}/ (${STAGED}/INSTALL.md); the install deletes ${STAGED}/ at the end.` });
  return { errors, warnings };
}
