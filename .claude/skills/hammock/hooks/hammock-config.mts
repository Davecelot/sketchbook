#!/usr/bin/env node
// hammock — shared configuration resolver
//
// Resolution order for default mode:
//   1. Project .sketchbook/hammock.json defaultMode
//   2. HAMMOCK_DEFAULT_MODE environment variable
//   3. Legacy user config defaultMode field:
//      - $XDG_CONFIG_HOME/hammock/config.json (any platform, if set)
//      - ~/.config/hammock/config.json (macOS / Linux fallback)
//      - %APPDATA%\hammock\config.json (Windows fallback)
//   4. 'full'
//
// Adapted from ponytail's hooks/ponytail-config.js
// (https://github.com/DietrichGebert/ponytail), stripped of the
// multi-platform (Codex/Copilot/Qoder) and statusline branching this
// Claude-Code-only repo doesn't need.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const DEFAULT_MODE = 'full';
export const VALID_MODES: string[] = ['off', 'lite', 'full', 'ultra', 'review'];
export const RUNTIME_MODES: string[] = ['off', 'lite', 'full', 'ultra'];

export function normalizeMode(mode: unknown): string | null {
  if (typeof mode !== 'string') return null;
  const normalized = mode.trim().toLowerCase();
  return RUNTIME_MODES.includes(normalized) ? normalized : null;
}

export function normalizeConfigMode(mode: unknown): string | null {
  if (typeof mode !== 'string') return null;
  const normalized = mode.trim().toLowerCase();
  return VALID_MODES.includes(normalized) ? normalized : null;
}

// "stop hammock" / "normal mode" turn hammock off, but only as a standalone
// command — matching the phrase anywhere in the message would turn it off
// mid-task for an ordinary request like "add a normal mode toggle".
export function isDeactivationCommand(text: string | null | undefined): boolean {
  const t = String(text || '')
    .trim()
    .toLowerCase()
    .replace(/[.!?\s]+$/, '');
  return t === 'stop hammock' || t === 'normal mode';
}

export function getConfigDir(): string {
  if (process.env.XDG_CONFIG_HOME) {
    return path.join(process.env.XDG_CONFIG_HOME, 'hammock');
  }
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'hammock');
  }
  return path.join(os.homedir(), '.config', 'hammock');
}

export function getConfigPath(): string {
  return path.join(getConfigDir(), 'config.json');
}

export function getClaudeDir(): string {
  return process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
}

export function getProjectDir(): string {
  return process.env.CLAUDE_PROJECT_DIR || process.cwd();
}

export function getDefaultMode(): string {
  const readMode = (file: string) => {
    try {
      const config = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')) as { defaultMode?: unknown } | null;
      return normalizeMode(config?.defaultMode);
    } catch {
      return null;
    }
  };
  const local = readMode(path.join(getProjectDir(), '.sketchbook', 'hammock.json'));
  if (local) return local;
  const envMode = process.env.HAMMOCK_DEFAULT_MODE;
  if (envMode && RUNTIME_MODES.includes(envMode.toLowerCase())) {
    return envMode.toLowerCase();
  }

  return readMode(getConfigPath()) ?? DEFAULT_MODE;
}
