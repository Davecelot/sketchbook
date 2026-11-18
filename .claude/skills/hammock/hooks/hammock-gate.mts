#!/usr/bin/env node
// hammock — PreToolUse hook (matcher: Edit|Write|MultiEdit)
//
// Never blocks the edit itself — mid-task blocking on a judgment call would
// be noisy and runs against hammock's own "advisory, don't auto-block"
// stance for review/audit. Instead, when a component-source file is about
// to be touched and hammock mode is active, it marks the session as owing
// an audit pass. hammock-audit-runner (PostToolUse) discharges that debt
// automatically right after the edit; hammock-stop-gate (Stop) is the
// safety net if that somehow doesn't happen.
import { getMode, setPendingAudit } from './hammock-runtime.mjs';

const COMPONENT_PATH_RE = /(^|\/)src\/components\//;

let input = '';
let done = false;

function finish() {
  if (done) return;
  done = true;
  try {
    const data = JSON.parse(input.replace(/^\uFEFF/, '')) as { tool_input?: { file_path?: string } };
    const filePath = String((data.tool_input && data.tool_input.file_path) || '');
    const mode = getMode();

    if (mode && mode !== 'off' && COMPONENT_PATH_RE.test(filePath)) {
      setPendingAudit(true);
    }
  } catch {
    // Silent fail — never block a tool call over a state-tracking error.
  }
  process.stdout.write('{}');
}

process.stdin.on('data', (chunk: Buffer) => {
  input += String(chunk);
});
process.stdin.on('end', finish);
process.stdin.on('error', () => {
  finish();
  process.exit(0);
});
setTimeout(() => {
  finish();
  process.exit(0);
}, 1000).unref();
