import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { walk } from '../lib/files.mjs';
import type { CheckContext, CheckIssue, CheckResult } from './types.mjs';

export const id = 'H2';
export const title = 'Harness sources are TypeScript: every .mjs in harness/, scripts/ and the Claude hooks is compiled from the .mts beside it, or allowlisted (source repo)';

// The trees scripts/build-harness.mjs compiles; keep both lists in step.
const BUILD = 'scripts/build-harness.mjs';
const SKIP = ['harness/templates/', 'harness/catalog/'];

export const ALLOWED: Record<string, string> = {
  'scripts/build-harness.mjs': 'it compiles every .mts, so it cannot be one',
  '.claude/hooks/run.mjs': 'the hook launcher runs before any build, in a fresh clone too',
  'harness/lib/design/compare-runtime.mjs': 'inlined byte for byte into Figma scripts; tsc would re-indent it',
  'harness/adapters/design/figma/verify-runtime.mjs': 'inlined byte for byte into Figma scripts; tsc would re-indent it',
};

function trees(root: string): string[] {
  const skills = join(root, '.claude/skills');
  const skillHooks = existsSync(skills) ? readdirSync(skills, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => `.claude/skills/${e.name}/hooks`) : [];
  return ['harness', 'scripts', '.claude/hooks', ...skillHooks];
}

// Only where the harness sources live: a project runs the engine from node_modules, and its own scripts/ are the team's.
export function run({ root }: CheckContext): CheckResult {
  const errors: CheckIssue[] = [];
  if (!existsSync(join(root, BUILD))) return { errors, info: [`no ${BUILD} here: no harness sources to check`] };
  for (const file of trees(root).flatMap((t) => walk(root, t))) {
    if (!/\.(mjs|cjs|js)$/.test(file) || SKIP.some((s) => file.startsWith(s)) || file in ALLOWED) continue;
    if (file.endsWith('.mjs') && existsSync(join(root, file.replace(/\.mjs$/, '.mts')))) continue;
    errors.push({ file, msg: 'hand-written JavaScript: no .mts beside it compiles to this file', fix: 'Convert it to .mts (then npm run build:harness), or add it to the allowlist in harness/checks/h2-typescript-sources.mts with a reason.' });
  }
  return { errors };
}
