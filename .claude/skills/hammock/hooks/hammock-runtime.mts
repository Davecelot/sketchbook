#!/usr/bin/env node
// hammock — shared session-state + hook-output helpers
//
// Adapted from ponytail's hooks/ponytail-runtime.js
// (https://github.com/DietrichGebert/ponytail), stripped to Claude Code
// only (no Codex/Copilot/Qoder output-shape branching).
import fs from 'node:fs';
import path from 'node:path';

import { getProjectDir } from './hammock-config.mjs';

const STATE_FILE = '.hammock-state.json';

interface HammockState { mode?: string; pendingAudit?: boolean; [key: string]: unknown }

export function getStatePath(): string {
  return path.join(getProjectDir(), '.claude', STATE_FILE);
}

export function readState(): HammockState {
  try {
    const raw = fs.readFileSync(getStatePath(), 'utf8').replace(/^\uFEFF/, '');
    const state = JSON.parse(raw) as HammockState | null;
    return state && typeof state === 'object' ? state : {};
  } catch {
    return {};
  }
}

export function writeState(state: HammockState): void {
  const statePath = getStatePath();
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');
}

export function getMode(): string | null {
  return readState().mode || null;
}

export function setMode(mode: string): void {
  const state = readState();
  state.mode = mode;
  writeState(state);
}

export function clearMode(): void {
  const state = readState();
  delete state.mode;
  writeState(state);
}

export function getPendingAudit(): boolean {
  return Boolean(readState().pendingAudit);
}

export function setPendingAudit(value: unknown): void {
  const state = readState();
  state.pendingAudit = Boolean(value);
  writeState(state);
}

// Native Claude Code: SessionStart and UserPromptSubmit accept raw stdout as
// additionalContext, but SubagentStart needs the hookSpecificOutput JSON form
// or the context is dropped (mirrors ponytail-runtime.js's native-Claude path).
export function writeHookOutput(event: string, context = ''): void {
  if (event === 'SubagentStart') {
    process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: event, additionalContext: context } }));
    return;
  }
  process.stdout.write(context);
}
