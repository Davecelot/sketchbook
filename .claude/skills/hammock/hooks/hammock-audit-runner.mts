#!/usr/bin/env node
// hammock — PostToolUse hook (matcher: Edit|Write|MultiEdit)
//
// Discharges the audit debt hammock-gate (PreToolUse) marks: whenever a
// component-source edit set pendingAudit, run the heuristic simplicity scan
// scoped to the current diff and inject its output back into context — so
// findings are visible immediately after the edit, not something the agent
// has to remember to go check. Clears pendingAudit once surfaced.
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getProjectDir } from './hammock-config.mjs';
import { getPendingAudit, setPendingAudit } from './hammock-runtime.mjs';

if (!getPendingAudit()) {
  process.exit(0);
}

const scriptPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'audit-simplicity.sh');

let output: string;
try {
  output = execFileSync('bash', [scriptPath, '--diff'], {
    cwd: getProjectDir(),
    encoding: 'utf8',
    timeout: 15000,
  });
} catch (e: unknown) {
  // The script is advisory-only and always exits 0; a thrown error here
  // means bash/the script itself is unavailable — don't block the turn.
  const stdout = typeof e === 'object' && e !== null && 'stdout' in e ? (e.stdout as string | Buffer | null) : undefined;
  output = stdout ? String(stdout) : 'hammock: audit-simplicity.sh could not run.';
}

setPendingAudit(false);

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: 'HAMMOCK AUTO-AUDIT (post-edit, --diff scope):\n\n' + output,
    },
  }),
);
