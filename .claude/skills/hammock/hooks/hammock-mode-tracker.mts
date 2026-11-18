#!/usr/bin/env node
// hammock — UserPromptSubmit hook
//
// Parses /hammock <mode> from the user's prompt (matching SKILL.md's
// existing documented convention: one skill, mode as an argument — no
// separate /hammock-review-style commands) and the "stop hammock" /
// "normal mode" deactivation phrase. It injects only when the level
// changes: an ordinary prompt adds nothing, because hook context is kept in
// the transcript and a per-prompt copy is paid again on every later turn.
// SessionStart (startup|resume|clear|compact) keeps the ladder in context.
//
// Adapted from ponytail's hooks/ponytail-mode-tracker.js
// (https://github.com/DietrichGebert/ponytail).
import { getDefaultMode, isDeactivationCommand, RUNTIME_MODES } from './hammock-config.mjs';
import { getHammockInstructions } from './hammock-instructions.mjs';
import { clearMode, getMode, setMode, setPendingAudit, writeHookOutput } from './hammock-runtime.mjs';

const REPORT_ONLY_MODES = ['review', 'audit', 'debt', 'gain', 'help'];

let input = '';
let done = false;

function finish() {
  if (done) return;
  done = true;
  try {
    const data = JSON.parse(input.replace(/^\uFEFF/, '')) as { prompt?: string };
    const prompt = (data.prompt || '').trim().toLowerCase();

    const match = prompt.match(/^\/hammock(?:\s+(\S+))?\s*$/);
    if (match) {
      const arg = match[1] || '';
      if (arg === 'off') {
        clearMode();
        setPendingAudit(false);
        writeHookOutput('UserPromptSubmit', 'HAMMOCK MODE OFF');
      } else if (RUNTIME_MODES.includes(arg)) {
        setMode(arg);
        writeHookOutput('UserPromptSubmit', 'HAMMOCK MODE CHANGED\n\n' + getHammockInstructions(arg));
      } else if (REPORT_ONLY_MODES.includes(arg)) {
        // The /hammock command itself loads SKILL.md, which drives these modes.
        writeHookOutput('UserPromptSubmit', 'HAMMOCK ' + arg.toUpperCase() + ' REQUESTED — active level: ' + (getMode() || getDefaultMode()));
      }
    } else if (isDeactivationCommand(prompt)) {
      clearMode();
      setPendingAudit(false);
      writeHookOutput('UserPromptSubmit', 'HAMMOCK MODE OFF');
    }
  } catch {
    // Silent fail
  }
}

process.stdin.on('data', (chunk: Buffer) => {
  input += String(chunk);
});
process.stdin.on('end', finish);

// Never hang the session — recover on stdin error or after a short timeout.
process.stdin.on('error', () => {
  finish();
  process.exit(0);
});
setTimeout(() => {
  finish();
  process.exit(0);
}, 1000).unref();
