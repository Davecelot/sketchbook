import { lstatSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readJsonSync } from './files.mjs';

export const STAGED = 'move-to-.claude';
export const WORKFLOW_SKILLS = ['.agents/skills/contract-author/SKILL.md', '.agents/skills/component-builder/SKILL.md'];
const SHARED = ['AGENTS.md', 'AGENT-WORKFLOWS.md', '.agents/skills/sketchbook/SKILL.md', ...WORKFLOW_SKILLS];

const PROFILE_FILES = {
  claude: ['CLAUDE.md', ...WORKFLOW_SKILLS],
  codex: [...SHARED, '.codex/hooks.json', '.codex/sketchbook-guard.mjs'],
  gemini: [...SHARED, 'GEMINI.md', '.gemini/settings.json', '.gemini/sketchbook-guard.mjs'],
  copilot: [...SHARED, '.github/copilot-instructions.md', '.github/hooks/sketchbook.json', '.github/hooks/sketchbook-guard.mjs'],
  trae: [...SHARED, '.trae/rules/sketchbook.md'],
  jetbrains: [...SHARED, '.aiassistant/rules/sketchbook.md'],
  generic: SHARED,
};
export type AgentProfile = keyof typeof PROFILE_FILES;
export const AGENT_PROFILES = Object.keys(PROFILE_FILES) as AgentProfile[];
export const profileFiles = (profiles: AgentProfile[]): Set<string> => new Set(profiles.flatMap((profile) => PROFILE_FILES[profile]));
const ALL_FILES = profileFiles(AGENT_PROFILES);
export const isClaudeLayerFile = (file: string): boolean => file.startsWith('.claude/') || file.startsWith(`${STAGED}/`);
export const isAgentFile = (file: string): boolean => ALL_FILES.has(file) || isClaudeLayerFile(file);

export function parseAgentProfiles(value?: string): AgentProfile[] {
  if (value === undefined) return [];
  return [...new Set(value.split(',').map((entry) => {
    const profile = AGENT_PROFILES.find((name) => name === entry.trim());
    if (profile) return profile;
    throw Object.assign(new Error(`Unknown --agent profile: ${JSON.stringify(entry.trim())}.`), { fix: `Choose from ${AGENT_PROFILES.join(', ')}.` });
  }))];
}

// Inspect each parent before touching the destination. A symlink is a conflict, even if its target is absent.
export function agentFileState(root: string, file: string): 'missing' | 'file' | 'blocked' {
  const parts = file.split('/');
  for (let i = 1; i <= parts.length; i++) {
    try {
      const stat = lstatSync(join(root, ...parts.slice(0, i)));
      if (i === parts.length) return stat.isFile() ? 'file' : 'blocked';
      if (!stat.isDirectory()) return 'blocked';
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return 'missing';
      throw error;
    }
  }
  return 'blocked';
}

function matches(root: string, file: string, marker: RegExp): boolean {
  if (agentFileState(root, file) !== 'file') return false;
  try { return marker.test(readFileSync(join(root, file), 'utf8')); } catch { return false; }
}

export function hasClaudeLayer(root: string, base: string): boolean {
  return matches(root, `${base}/hooks/run.mjs`, /Sketchbook/i)
    || matches(root, `${base}/settings.json`, /guard-(?:generated|decisions)|hammock-activate/)
    || matches(root, `${base}/skills/contract-author/SKILL.md`, /^name: contract-author$/m)
    || (base === STAGED && matches(root, `${base}/INSTALL.md`, /Sketchbook/i));
}

export function claudeDestination(root: string): string {
  return hasClaudeLayer(root, STAGED) || !hasClaudeLayer(root, '.claude') ? STAGED : '.claude';
}

export function selectedAgentProfiles(root: string): AgentProfile[] {
  const config = readJsonSync<{ agentProfiles?: AgentProfile[]; claudeExtras?: string[] }>(join(root, 'harness.config.json'));
  if (Array.isArray(config?.agentProfiles)) return [...new Set(config.agentProfiles.filter((profile) => AGENT_PROFILES.includes(profile)))];
  const profiles: AgentProfile[] = [];
  const found = (file: string, marker: RegExp) => matches(root, file, marker);
  if (hasClaudeLayer(root, STAGED) || hasClaudeLayer(root, '.claude')
    || found('CLAUDE.md', /move-to-\.claude\/INSTALL\.md/) || config?.claudeExtras?.includes('forge')) profiles.push('claude');
  if (found('.codex/hooks.json', /sketchbook-guard/) || found('.codex/sketchbook-guard.mjs', /sketchbook/i)) profiles.push('codex');
  if (found('GEMINI.md', /Sketchbook project instructions/) || found('.gemini/settings.json', /sketchbook-guard|harness\/agent\/gemini-guard/)
    || found('.gemini/sketchbook-guard.mjs', /gemini-guard/)) profiles.push('gemini');
  // The source checkout links to the template, not an installed root-level workflow.
  if (found('.github/copilot-instructions.md', /(?:^|[^/\w-])(?:\.\.?\/)?AGENT-WORKFLOWS\.md\b/) || found('.github/hooks/sketchbook.json', /sketchbook-guard/)
    || found('.github/hooks/sketchbook-guard.mjs', /sketchbook/i)) profiles.push('copilot');
  if (found('.trae/rules/sketchbook.md', /AGENT-WORKFLOWS\.md/)) profiles.push('trae');
  if (found('.aiassistant/rules/sketchbook.md', /AGENT-WORKFLOWS\.md/)) profiles.push('jetbrains');
  if (!profiles.some((profile) => profile !== 'claude')
    && (found('AGENTS.md', /Sketchbook CLI[\s\S]*AGENT-WORKFLOWS\.md/) || found('AGENT-WORKFLOWS.md', /^# Sketchbook workflows/m))) profiles.push('generic');
  return profiles;
}

// Render only the two project-owned adapter templates that refer to the engine package by name.
export const AGENT_ENGINE_FILES = ['.gemini/sketchbook-guard.mjs', '.github/hooks/sketchbook-guard.mjs'] as const;

export function renderAgentSetup(file: string, source: string, packageName: string): string {
  if (!AGENT_ENGINE_FILES.some((name) => name === file)) return source;
  if (!/^(?:@[a-zA-Z0-9][\w.-]*\/)?[a-zA-Z0-9][\w.-]*$/.test(packageName)) throw new Error(`Invalid engine package name: ${packageName}`);
  if (packageName === 'sketchbook') return source;
  const marker = file === '.gemini/sketchbook-guard.mjs' ? "'sketchbook/harness/agent/gemini-guard.mjs'" : "'sketchbook/harness/cli.mjs'";
  if (!source.includes(marker)) throw new Error(`Cannot render ${file}: engine package marker is missing.`);
  const replacement = JSON.stringify(`${packageName}/${file === '.gemini/sketchbook-guard.mjs' ? 'harness/agent/gemini-guard.mjs' : 'harness/cli.mjs'}`);
  return source.replace(marker, replacement);
}
