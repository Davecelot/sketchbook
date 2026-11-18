#!/usr/bin/env node
// hammock — Stop hook (safety net)
//
// In the normal path this never fires: hammock-audit-runner (PostToolUse)
// clears pendingAudit synchronously right after every component-source
// edit, in the same turn. This hook only catches the case where that
// somehow didn't happen (hook failure, mode flipped mid-stream) — it blocks
// ending the turn and asks the agent to run the audit manually first,
// rather than letting a component edit ship with no scan having ever run.
import { getPendingAudit } from './hammock-runtime.mjs';

if (getPendingAudit()) {
  process.stdout.write(
    JSON.stringify({
      decision: 'block',
      reason:
        'hammock: component source was edited but the post-edit audit never ran. ' +
        'Run `bash .claude/skills/hammock/scripts/audit-simplicity.sh --diff` and address or ' +
        'consciously accept its findings before finishing.',
    }),
  );
  process.exit(0);
}

process.exit(0);
