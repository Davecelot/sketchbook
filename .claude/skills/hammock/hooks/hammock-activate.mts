#!/usr/bin/env node
// hammock — Claude Code SessionStart activation hook
//
// Runs on every session start: resolves the default mode, writes it to
// session state, and emits the ladder ruleset as hidden SessionStart
// context — so the ladder is present before the agent's first response,
// not something it has to remember to fetch via /hammock.
//
// Adapted from ponytail's hooks/ponytail-activate.js
// (https://github.com/DietrichGebert/ponytail), stripped of the
// statusline-nudge section (no statusline in this repo).
import { getDefaultMode } from './hammock-config.mjs';
import { getHammockInstructions } from './hammock-instructions.mjs';
import { clearMode, setMode, writeHookOutput } from './hammock-runtime.mjs';

const mode = getDefaultMode();

if (mode === 'off') {
  clearMode();
  writeHookOutput('SessionStart', '');
  process.exit(0);
}

try {
  setMode(mode);
} catch {
  // Silent fail — flag is best-effort, don't block the hook
}

try {
  writeHookOutput('SessionStart', getHammockInstructions(mode));
} catch {
  // Silent fail — stdout closed/EPIPE at hook exit must not surface as a
  // hook failure
}
