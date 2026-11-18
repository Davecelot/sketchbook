#!/usr/bin/env node
// hammock — Claude Code SubagentStart hook
//
// SessionStart/UserPromptSubmit context is parent-thread only and never
// reaches subagents, so without this every Task-spawned agent (Explore,
// Plan, general-purpose) runs
// hammock-unaware even while the parent session has it active. Inject the
// same ladder when hammock mode is active.
//
// Adapted from ponytail's hooks/ponytail-subagent.js
// (https://github.com/DietrichGebert/ponytail).
import { getHammockInstructions } from './hammock-instructions.mjs';
import { getMode, writeHookOutput } from './hammock-runtime.mjs';

const mode = getMode();

if (!mode || mode === 'off') {
  process.exit(0);
}

try {
  writeHookOutput('SubagentStart', getHammockInstructions(mode));
} catch {
  // Silent fail — a stdout error at hook exit must not surface as a hook failure.
}
