// Read-only inspection of the specific native hook registrations shipped by Sketchbook.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { ENGINE, readJsonSync } from './files.mjs';
import { renderAgentSetup } from './agent-config.mjs';

export type HookRegistration = 'missing' | 'invalid' | 'unrecognized' | 'registered';
export type InstructionReference = 'referenced' | 'not-detected' | 'unavailable';
const INSTRUCTION_REFERENCES: Record<string, string[]> = {
  'AGENTS.md': ['AGENT-WORKFLOWS.md'],
  'GEMINI.md': ['AGENTS.md'],
  '.github/copilot-instructions.md': ['AGENTS.md', 'AGENT-WORKFLOWS.md'],
  '.trae/rules/sketchbook.md': ['AGENTS.md', 'AGENT-WORKFLOWS.md'],
  '.aiassistant/rules/sketchbook.md': ['AGENTS.md', 'AGENT-WORKFLOWS.md'],
  '.agents/skills/sketchbook/SKILL.md': ['AGENT-WORKFLOWS.md'],
};

// This is only a textual hint for reviewing preserved team instructions. A
// client may load other guidance, and a mention does not prove it was followed.
export function instructionReferences(root: string): Record<string, InstructionReference> {
  return Object.fromEntries(Object.entries(INSTRUCTION_REFERENCES).map(([file, references]) => {
    try {
      const text = readFileSync(join(root, file), 'utf8');
      return [file, references.every((reference) => text.includes(reference)) ? 'referenced' : 'not-detected'];
    } catch { return [file, 'unavailable']; }
  }));
}
interface Group { matcher?: unknown; hooks?: unknown }
interface Hook { name?: unknown; command?: unknown; type?: unknown; matcher?: unknown }
interface Config { version?: unknown; hooks?: Record<string, unknown> }
const legacyGeminiCommand = (name: string): string => `node "\${GEMINI_PROJECT_DIR}/node_modules/${name}/harness/agent/gemini-guard.mjs"`;
const GEMINI = 'node .gemini/sketchbook-guard.mjs';
const LEGACY_GEMINI_LAUNCHER = 'node "${GEMINI_PROJECT_DIR}/.gemini/sketchbook-guard.mjs"';
const COPILOT = 'node .github/hooks/sketchbook-guard.mjs';
const CODEX_MATCHER = '^(apply_patch|functions\\.apply_patch)$';
const CODEX = 'node .codex/sketchbook-guard.mjs';
const isFile = (file: string): boolean => { try { return statSync(file).isFile(); } catch { return false; } };

function matchesTemplate(root: string, file: string, engineName: string): boolean | null {
  try {
    const actual = readFileSync(join(root, file), 'utf8');
    const template = readFileSync(join(ENGINE, 'harness/templates/project', file), 'utf8');
    return actual.replace(/\r\n/g, '\n') === renderAgentSetup(file, template, engineName).replace(/\r\n/g, '\n');
  } catch { return null; }
}

function readConfig(file: string): { state: HookRegistration; config?: Config } {
  if (!existsSync(file)) return { state: 'missing' };
  try {
    const parsed: unknown = JSON.parse(readFileSync(file, 'utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { state: 'invalid' };
    return { state: 'unrecognized', config: parsed };
  } catch { return { state: 'invalid' }; }
}

// Existing hook settings are team-owned. Identify the shipped optional launcher without editing them.
export function codexSubdirectoryLauncher(root: string): boolean | null {
  const commands = (config?: Config): unknown[] => {
    const groups = config?.hooks?.PreToolUse;
    return Array.isArray(groups) ? groups.flatMap((group: Group) => group && group.matcher === CODEX_MATCHER && Array.isArray(group.hooks) ? group.hooks.filter((hook: Hook) => hook && hook.type === 'command').map((hook: Hook) => hook.command) : []) : [];
  };
  const shipped = readConfig(join(ENGINE, 'harness/templates/project/.codex/hooks.json'));
  const expected = commands(shipped.config).find((command) => typeof command === 'string' && command.startsWith('node -e '));
  if (!expected) return null;
  return commands(readConfig(join(root, '.codex/hooks.json')).config).includes(expected);
}

// The launcher hashes the adapter after normalizing CRLF, and skips other modifications.
export function codexSubdirectoryAdapterMatches(root: string): boolean | null {
  try {
    const normalized = (file: string) => readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
    return normalized(join(root, '.codex/sketchbook-guard.mjs')) === normalized(join(ENGINE, 'harness/templates/project/.codex/sketchbook-guard.mjs'));
  } catch { return null; }
}

// Repository hooks are discovered at the Git root; this does not inspect other hook sources.
export function copilotRepositoryHookLocation(root: string): 'repository-root' | 'nested' | 'unknown' {
  const git = spawnSync('git', ['-C', root, 'rev-parse', '--show-prefix'], { encoding: 'utf8' });
  if (git.status !== 0) return 'unknown';
  return git.stdout.replace(/\r?\n$/, '') ? 'nested' : 'repository-root';
}

export function nativeHookStatus(root: string, engineName = readJsonSync<{ name?: string }>(join(ENGINE, 'package.json'))?.name ?? 'sketchbook') {
  const gemini = readConfig(join(root, '.gemini/settings.json'));
  const groups = gemini.config?.hooks?.BeforeTool;
  const geminiCommands = Array.isArray(groups) ? groups.flatMap((item: Group) => item && item.matcher === 'write_file|replace' && Array.isArray(item.hooks) ? item.hooks.filter((h: Hook) => h && h.type === 'command').map((h: Hook) => h.command) : []) : [];
  const usesLauncher = geminiCommands.includes(GEMINI) || geminiCommands.includes(LEGACY_GEMINI_LAUNCHER);
  const usesLegacy = geminiCommands.includes(legacyGeminiCommand(engineName));
  if (usesLauncher || usesLegacy) gemini.state = 'registered';
  const geminiScript = join(root, '.gemini/sketchbook-guard.mjs');
  let geminiEngine = false;
  if (usesLegacy) geminiEngine = isFile(join(root, 'node_modules', engineName, 'harness/agent/gemini-guard.mjs'));
  if (usesLauncher) { try { createRequire(geminiScript).resolve(`${engineName}/harness/agent/gemini-guard.mjs`); geminiEngine = true; } catch { /* dependency unavailable */ } }

  const codex = readConfig(join(root, '.codex/hooks.json'));
  const codexGroups = codex.config?.hooks?.PreToolUse;
  if (Array.isArray(codexGroups) && codexGroups.some((item: Group) => item && item.matcher === CODEX_MATCHER && Array.isArray(item.hooks) && item.hooks.some((h: Hook) => h && h.type === 'command' && h.command === CODEX))) codex.state = 'registered';

  const copilot = readConfig(join(root, '.github/hooks/sketchbook.json'));
  const hooks = copilot.config?.hooks?.preToolUse;
  if (copilot.config?.version === 1 && Array.isArray(hooks) && hooks.some((h: Hook) => h && h.type === 'command' && h.matcher === 'create|edit' && h.command === COPILOT)) copilot.state = 'registered';
  const copilotScript = join(root, '.github/hooks/sketchbook-guard.mjs');
  let copilotEngine = false;
  try { createRequire(copilotScript).resolve(`${engineName}/harness/cli.mjs`); copilotEngine = true; } catch { /* dependency unavailable */ }
  return {
    codex: { registration: codex.state, scriptPresent: isFile(join(root, '.codex/sketchbook-guard.mjs')), scriptMatchesTemplate: matchesTemplate(root, '.codex/sketchbook-guard.mjs', engineName) },
    gemini: { registration: gemini.state, scriptPresent: usesLegacy || isFile(geminiScript), scriptMatchesTemplate: usesLauncher ? matchesTemplate(root, '.gemini/sketchbook-guard.mjs', engineName) : null, enginePresent: geminiEngine },
    copilot: { registration: copilot.state, scriptPresent: isFile(copilotScript), scriptMatchesTemplate: matchesTemplate(root, '.github/hooks/sketchbook-guard.mjs', engineName), enginePresent: copilotEngine },
  };
}
