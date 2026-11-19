// The Claude layer (.claude/ skills and their agent briefs, commands, rules, hooks) must load and must not invent CLI
// commands (SB-0038, SB-0073). Used by check H1 in every project and by harness/test/claude-layer.test.mts.
import { spawnSync } from 'node:child_process';
import { existsSync, lstatSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, basename, dirname } from 'node:path';
import { harnessPath, readJsonSync, ENGINE } from './files.mjs';
import { agentFileState } from './agent-config.mjs';

export interface Frontmatter {
  metadata?: Record<string, string>;
  [key: string]: string | Record<string, string> | undefined;
}
export interface Mention { text: string; cmd: string; sub: string | undefined }
export interface KnownCommands {
  starters: string[];
  commands: Record<string, { subcommands?: string[]; summary?: string; planned?: boolean }>;
}
export interface ClaudeLayerProblems { frontmatter: string[]; skills: string[]; commands: string[] }
export type AlwaysOnParts = Record<'CLAUDE.md' | 'rules' | 'descriptions' | 'hooks', number>;
export interface AlwaysOnContext { parts: AlwaysOnParts; total: number; unmeasured: string[] }

export interface HookCommand { command?: string; timeout?: number; [key: string]: unknown }
export interface HookEntry { matcher?: string; hooks?: HookCommand[]; [key: string]: unknown }
interface ClaudeSettings { hooks?: Record<string, HookEntry[]>; [key: string]: unknown }

const isObject = (value: unknown): boolean => !!value && typeof value === 'object' && !Array.isArray(value);
const isDirectory = (path: string): boolean => lstatSync(path, { throwIfNoEntry: false })?.isDirectory() === true;

export function readClaudeSettings(path: string): ClaudeSettings | null {
  const settings = readJsonSync<ClaudeSettings>(path);
  if (!settings || !isObject(settings)) return null;
  if (settings.hooks === undefined) return settings;
  if (!isObject(settings.hooks)) return null;
  for (const entries of Object.values(settings.hooks)) {
    if (!Array.isArray(entries)) return null;
    for (const entry of entries) {
      if (!isObject(entry) || (entry.hooks !== undefined && (!Array.isArray(entry.hooks) || !entry.hooks.every(isObject)))) return null;
    }
  }
  return settings;
}

const str = (value: string | Record<string, string> | undefined): string | undefined => (typeof value === 'string' ? value : undefined);

function walk(dir: string, skip?: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (p === skip) continue;
    if (entry.isDirectory()) out.push(...walk(p, skip));
    else if (entry.isFile()) out.push(p);
  }
  return out;
}

// Minimal YAML frontmatter reader: `key: value` lines, folded/literal blocks (`key: >`), and one level of
// nesting (`metadata:` followed by indented `key: value` lines, read into out.metadata).
export function frontmatter(source: string): Frontmatter | null {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(source);
  if (!m) return null;
  const lines = (m[1] ?? '').split('\n');
  const read = (indent: number, start: number, out: Record<string, string | Record<string, string> | undefined>): number => {
    let i = start;
    for (; i < lines.length; i++) {
      const line = lines[i] ?? '';
      const kv = new RegExp(`^ {${indent}}([A-Za-z][\\w-]*):\\s*(.*)$`).exec(line);
      if (!kv) { if (line.trim() && !line.startsWith(' '.repeat(indent))) break; continue; }
      const key = kv[1] ?? '';
      let value = (kv[2] ?? '').trim();
      const deeper = (l: string | undefined): l is string => l !== undefined && l.length - l.trimStart().length > indent && l.trim() !== '';
      const following = lines[i + 1] ?? '';
      if (value === '' && indent === 0 && /^\s+[A-Za-z][\w-]*:/.test(following)) {
        const nested: Record<string, string> = {};
        i = read(following.length - following.trimStart().length, i + 1, nested) - 1;
        out[key] = nested;
        continue;
      }
      if (value === '' || /^[>|][-+]?$/.test(value)) {
        const block: string[] = [];
        for (let next = lines[i + 1]; deeper(next); next = lines[i + 1]) { block.push(next.trim()); i++; }
        value = block.join(' ');
      }
      out[key] = value.replace(/^["']|["']$/g, '');
    }
    return i;
  };
  const out: Frontmatter = {};
  read(0, 0, out);
  return out;
}

// The skill standard (.claude/skills/forge-me-a-skill): frontmatter, `##` sections in order outside code
// fences, and only the known folders. Returns the problems for one skill.
export const SKILL_FOLDERS = ['agents', 'assets', 'hooks', 'references', 'scripts'];
const REQUIRED_METADATA = ['author', 'version', 'changelog', 'auto-invoke', 'allowed-tools'];
const FIRST = ['When to use', 'Critical patterns', 'Decision tree'];
// Every description is in context in every session, so its length is a per-session cost (SB-0114).
export const DESCRIPTION_MAX = 400;
export const BRIEF_MODELS = ['haiku', 'sonnet', 'opus'];
export function skillProblems(name: string, text: string, folders: string[] = []): string[] {
  const problems: string[] = [];
  const fm = frontmatter(text);
  if (!fm) return ['no frontmatter'];
  const description = str(fm.description) ?? '';
  if (fm.name !== name) problems.push(`name "${str(fm.name) ?? ''}" must be "${name}"`);
  if (!/Trigger:/.test(description)) problems.push('description has no "Trigger:" clause');
  if (description.length > DESCRIPTION_MAX) problems.push(`description is ${description.length} characters; keep it at most ${DESCRIPTION_MAX} (what it does, then the triggers)`);
  if ('version' in fm) problems.push('top-level version: move it to metadata.version');
  const meta = typeof fm.metadata === 'object' ? fm.metadata : {};
  for (const k of REQUIRED_METADATA) if (!meta[k]) problems.push(`metadata.${k} missing`);
  if (meta.version && !/^\d+\.\d+\.\d+$/.test(meta.version)) problems.push(`metadata.version "${meta.version}" is not semver`);
  const headings = text.replace(/^---\n[\s\S]*?\n---\n/, '').replace(/```[\s\S]*?```/g, '')
    .split('\n').filter((l) => l.startsWith('## ')).map((l) => l.slice(3).trim());
  if (headings.slice(0, 3).join('|') !== FIRST.join('|')) problems.push(`sections must start with ${FIRST.join(', ')} (found ${headings.slice(0, 3).join(', ')})`);
  if (headings.at(-1) !== 'Resources') problems.push('last section must be Resources');
  if (headings.at(-2) !== 'Commands') problems.push('Commands must come right before Resources');
  for (const f of folders) if (!SKILL_FOLDERS.includes(f)) problems.push(`folder "${f}/" is not one of ${SKILL_FOLDERS.join(', ')}`);
  return problems;
}

// Command mentions: in Markdown, where a command starts inside inline code or a fenced block (start of the
// span or line, or after `&&`, `;`, `|`, `$`); in scripts, anywhere. Prose like "sketchbook skill" is not a command.
const CMD = String.raw`(?:npx\s+)?(?:sketchbook|node\s+harness\/cli\.mjs)\s+([a-z][\w+-]*)(?:[ \t]+([a-z][\w+-]*))?`;
const AT_START = new RegExp(String.raw`(?:^|&&|;|\|)\s*(?:\$\s+)?` + CMD, 'gm');
const ANYWHERE = new RegExp(String.raw`\b` + CMD, 'g');
export function mentions(text: string, { markdown = true }: { markdown?: boolean } = {}): Mention[] {
  const regions: string[] = [];
  if (markdown) {
    for (const m of text.matchAll(/```[^\n]*\n([\s\S]*?)```/g)) regions.push(m[1] ?? '');
    for (const m of text.replace(/```[\s\S]*?```/g, '').matchAll(/`([^`\n]+)`/g)) regions.push(m[1] ?? '');
  } else regions.push(text);
  const re = markdown ? AT_START : ANYWHERE;
  const out: Mention[] = [];
  for (const region of regions) for (const m of region.matchAll(re)) out.push({ text: m[0].trim(), cmd: m[1] ?? '', sub: m[2] });
  return out;
}

export function unknownMentions(found: Mention[], known: KnownCommands): string[] {
  const bad: string[] = [];
  for (const { text, cmd, sub } of found) {
    const entry = known.commands[cmd];
    if (!entry) { bad.push(`${text} (unknown command "${cmd}")`); continue; }
    if (entry.subcommands && sub && !entry.subcommands.includes(sub)) bad.push(`${text} (unknown ${cmd} subcommand "${sub}")`);
  }
  return bad;
}

export function unknownStarters(text: string, known: KnownCommands): string[] {
  return [...text.matchAll(/--start[ =]([a-z][\w+-]*)/g)].map((m) => m[1] ?? '').filter((s) => !known.starters.includes(s));
}

export const loadKnown = (root: string): KnownCommands | null => readJsonSync<KnownCommands>(harnessPath(root, 'cli/known-commands.json'));

// Every problem in root/<base> (.claude, or move-to-.claude while staged), by kind; empty arrays when it is absent.
export function claudeLayerProblems(root: string, known: KnownCommands | null = loadKnown(root), base = '.claude'): ClaudeLayerProblems {
  const out: ClaudeLayerProblems = { frontmatter: [], skills: [], commands: [] };
  const claude = join(root, base);
  if (!isDirectory(claude)) return out;
  if (!known) throw new TypeError("Cannot read properties of null (reading 'commands')");
  const files = walk(claude, join(claude, 'worktrees'));
  for (const file of files) {
    const rel = relative(root, file);
    const inner = relative(claude, file);
    const isSkill = /^skills\/[^/]+\/SKILL\.md$/.test(inner);
    const isBrief = /^skills\/[^/]+\/agents\/[^/]+\.md$/.test(inner);
    const isCommand = /^commands\/[^/]+\.md$/.test(inner);
    if (isSkill || isBrief || isCommand) {
      const fm = frontmatter(readFileSync(file, 'utf8'));
      if (!fm) out.frontmatter.push(`${rel}: no frontmatter`);
      else {
        if (!fm.description) out.frontmatter.push(`${rel}: no description`);
        if (isBrief && !fm.tools) out.frontmatter.push(`${rel}: no tools (the brief's declared tool contract)`);
        if (isBrief && !BRIEF_MODELS.includes(str(fm.model) ?? '')) out.frontmatter.push(`${rel}: model must be one of ${BRIEF_MODELS.join(', ')} (the launching skill passes it to the Agent tool)`);
        const expected = isSkill ? basename(dirname(file)) : basename(file, '.md');
        if (isCommand) { if (fm.name && fm.name !== expected) out.frontmatter.push(`${rel}: name "${str(fm.name)}" is not "${expected}"`); }
        else if (fm.name !== expected) out.frontmatter.push(`${rel}: name "${str(fm.name) ?? ''}" must be "${expected}"`);
      }
    }
    if (/\.(md|mjs|mts|js)$/.test(file)) {
      const text = readFileSync(file, 'utf8');
      for (const b of unknownMentions(mentions(text, { markdown: file.endsWith('.md') }), known)) out.commands.push(`${rel}: ${b}`);
      for (const s of unknownStarters(text, known)) out.commands.push(`${rel}: unknown starter "${s}"`);
    }
  }
  const skills = join(claude, 'skills');
  if (isDirectory(skills)) {
    for (const entry of readdirSync(skills, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const dir = join(skills, entry.name);
      const folders = readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
      const skill = join(dir, 'SKILL.md');
      if (agentFileState(root, relative(root, skill)) !== 'file') { out.skills.push(`${base}/skills/${entry.name}: no SKILL.md`); continue; }
      for (const p of skillProblems(entry.name, readFileSync(skill, 'utf8'), folders)) out.skills.push(`${base}/skills/${entry.name}: ${p}`);
    }
  }
  if (isDirectory(join(claude, 'agents')) && readdirSync(join(claude, 'agents')).length) out.skills.push(`${base}/agents/ exists: move each agent into its skill's agents/ folder`);
  return out;
}

// What the Claude layer puts in context in every session (SB-0114), in bytes: CLAUDE.md, rules without
// paths:, the descriptions Claude Code lists for skills and commands, and what the session-start,
// ordinary-prompt and subagent-start hooks print. Check H1 holds the total to harness.config.json
// contextBudget.alwaysOnBytes.
const HOOK_EVENTS: Record<string, { source?: string; prompt?: string }> = { SessionStart: { source: 'startup' }, UserPromptSubmit: { prompt: 'Fix the button label.' }, SubagentStart: {} };
// A check runs only the hooks the harness ships, unchanged: a cloned project's own hook commands are not executed by
// `check` or the pre-commit hook (SB-0116). Known = `node "${CLAUDE_PROJECT_DIR}/.claude/hooks/run.mjs" <hooks|skills>/...`
// (the launcher, SB-0119) or a direct `node "${CLAUDE_PROJECT_DIR}/.claude/<hooks|skills>/..."` (settings from before
// it), on a file identical to the engine's copy.
const HOOK_COMMAND = /^node "\$\{CLAUDE_PROJECT_DIR\}\/\.claude\/(?:hooks\/run\.mjs" ((?:hooks|skills)\/[\w/-]+)|((?:hooks|skills)\/[^"]+)")$/;
// The script a Sketchbook hook command runs, relative to .claude/ (null for any other command).
export function hookScript(command: unknown): string | null {
  const m = HOOK_COMMAND.exec(String(command).trim());
  return m?.[1] ? `${m[1]}.mjs` : (m?.[2] ?? null);
}
export function knownHook(root: string, base: string, command: unknown): string | null {
  const rel = hookScript(command);
  if (!rel || rel.split('/').includes('..')) return null;
  const local = join(root, base, rel);
  const engine = join(ENGINE, '.claude', rel);
  if (agentFileState(root, join(base, rel)) !== 'file' || !existsSync(engine)) return null;
  return readFileSync(local).equals(readFileSync(engine)) ? local : null;
}
export function alwaysOnContext(root: string, base = '.claude'): AlwaysOnContext {
  const claude = join(root, base);
  const parts: AlwaysOnParts = { 'CLAUDE.md': 0, rules: 0, descriptions: 0, hooks: 0 };
  if (agentFileState(root, 'CLAUDE.md') === 'file') parts['CLAUDE.md'] = readFileSync(join(root, 'CLAUDE.md')).length;
  const list = (dir: string): string[] => isDirectory(claude) && isDirectory(dir) ? readdirSync(dir) : [];
  for (const f of list(join(claude, 'rules')).filter((f) => f.endsWith('.md'))) {
    const file = join(base, 'rules', f);
    if (agentFileState(root, file) !== 'file') continue;
    const text = readFileSync(join(root, file), 'utf8');
    if (!/^---\n(?:[^\n]*\n)*?paths:/.test(text)) parts.rules += Buffer.byteLength(text);
  }
  const described = [
    ...list(join(claude, 'skills')).map((s) => join(claude, 'skills', s, 'SKILL.md')),
    ...list(join(claude, 'commands')).filter((f) => f.endsWith('.md')).map((f) => join(claude, 'commands', f)),
  ].filter((f) => agentFileState(root, relative(root, f)) === 'file');
  for (const f of described) {
    const fm = frontmatter(readFileSync(f, 'utf8'));
    if (fm && fm['disable-model-invocation'] !== 'true') parts.descriptions += Buffer.byteLength(str(fm.description) ?? '');
  }
  const settingsFile = join(base, 'settings.json');
  const settingsState = agentFileState(root, settingsFile);
  const settings = settingsState === 'file' ? readClaudeSettings(join(root, settingsFile)) : null;
  // Hooks may write state under $CLAUDE_PROJECT_DIR; a check must not, so they get a throwaway one.
  const scratch = mkdtempSync(join(tmpdir(), 'sb-hooks-'));
  const unmeasured = !settings && settingsState !== 'missing' ? [`${settingsFile}: unreadable or invalid settings`] : [];
  try {
    for (const [event, input] of Object.entries(HOOK_EVENTS)) {
      for (const group of settings?.hooks?.[event] ?? []) {
        if (group.matcher) {
          try { if (!new RegExp(`^(${group.matcher})$`).test(input.source ?? '')) continue; }
          catch { unmeasured.push(`${event}: invalid matcher`); continue; }
        }
        for (const h of group.hooks ?? []) {
          const file = knownHook(root, base, h.command);
          if (!file) { unmeasured.push(`${event}: ${h.command}`); continue; }
          const r = spawnSync(process.execPath, [file], { cwd: scratch, input: JSON.stringify({ hook_event_name: event, ...input }), encoding: 'utf8', timeout: (h.timeout ?? 5) * 1000, env: { PATH: process.env.PATH, HOME: process.env.HOME, CLAUDE_PROJECT_DIR: scratch } });
          parts.hooks += Buffer.byteLength(r.stdout ?? '');
        }
      }
    }
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
  return { parts, total: Object.values(parts).reduce((a, b) => a + b, 0), unmeasured };
}
