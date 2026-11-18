// What a project has installed, by area, read from the files themselves (frontmatter, rule headings, hook script
// headers, the check and command registries), so the explanation init prints and docs/harness.md stay true (SB-0097).
import { existsSync, readFileSync, readdirSync, type Dirent } from 'node:fs';
import { join } from 'node:path';
import { frontmatter, hookScript } from './claude-layer.mjs';
import { ENGINE, parseJson } from './files.mjs';
import type { HarnessConfigJson } from '../../generated/types/harness-config.js';
import { CHECKS } from '../checks/run.mjs';
import { commands } from '../cli/registry.mjs';

export interface InstalledItem { name: string; what: string }
export interface InstalledArea { id: string; title: string; items: InstalledItem[] }
export interface Installed { areas: InstalledArea[] }
interface HookSettings { hooks?: Record<string, { matcher?: string; hooks?: { command: string }[] }[]> }
interface PackageJson { name?: string; engines?: { node?: string }; devDependencies?: Record<string, string> }

// The Claude layer is read where it is: staged in move-to-.claude/ until Claude installs it (even next to a team's .claude/), then .claude/.
export const claudeBase = (root: string): string => (existsSync(join(root, 'move-to-.claude')) ? 'move-to-.claude' : '.claude');
const read = (p: string): string | null => { try { return readFileSync(p, 'utf8'); } catch { return null; } };
const list = (dir: string, filter: (e: Dirent) => boolean = () => true): string[] => { try { return readdirSync(dir, { withFileTypes: true }).filter(filter).map((e) => e.name).sort(); } catch { return []; } };
const firstSentence = (s = ''): string => (s.replace(/\s+/g, ' ').trim().match(/^.*?[.!?](?=\s|$)/)?.[0] ?? s.trim()).slice(0, 220);
// Frontmatter values can be maps (metadata); only text has a sentence to show.
const textOf = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);
const beforeTrigger = (d = ''): string => firstSentence(d.split(/Trigger:/)[0]);

// A hook script's opening comment block: a title line followed by a blank comment line ends with a period.
function scriptHeader(path: string): string {
  const lines = (read(path) ?? '').split('\n').filter((l) => !l.startsWith('#!'));
  const out: string[] = [];
  for (const l of lines) { if (!l.startsWith('//')) break; out.push(l.replace(/^\/\/\s?/, '')); }
  const text = out.map((l, i) => { const prev = out[i - 1]; return l === '' && prev && !/[.:!?]$/.test(prev) ? '.' : l; }).join(' ').replace(/ \./g, '.');
  return firstSentence(text.replace(/^[A-Za-z]+ \([^)]*\):\s*/, '').replace(/^hammock — /, 'hammock: '));
}

function skills(root: string): InstalledItem[] {
  const items: InstalledItem[] = [];
  for (const s of list(join(root, claudeBase(root), 'skills'), (e) => e.isDirectory())) {
    const fm = frontmatter(read(join(root, claudeBase(root), 'skills', s, 'SKILL.md')) ?? '') ?? {};
    items.push({ name: s, what: beforeTrigger(textOf(fm.description)) || 'skill' });
    for (const b of list(join(root, claudeBase(root), 'skills', s, 'agents'), (e) => e.name.endsWith('.md'))) {
      const bf = frontmatter(read(join(root, claudeBase(root), 'skills', s, 'agents', b)) ?? '') ?? {};
      items.push({ name: `${s}/${b.replace(/\.md$/, '')}`, what: `agent brief: ${beforeTrigger(textOf(bf.description)) || 'delegated role'}` });
    }
  }
  return items;
}

function hooks(root: string): InstalledItem[] {
  const settings = parseJson<HookSettings>(read(join(root, claudeBase(root), 'settings.json')) ?? '{}');
  const items: InstalledItem[] = [];
  for (const [event, groups] of Object.entries(settings.hooks ?? {})) {
    for (const g of groups) for (const h of g.hooks ?? []) {
      const rel = hookScript(h.command);
      const script = rel ? `.claude/${rel}` : /\$\{CLAUDE_PROJECT_DIR\}\/([^"\s]+)/.exec(h.command)?.[1];
      items.push({ name: `${event}${g.matcher ? ` (${g.matcher})` : ''}: ${script ?? h.command}`, what: script ? scriptHeader(join(root, script.replace(/^\.claude\//, `${claudeBase(root)}/`))) || `runs ${script}` : `runs ${h.command}` });
    }
  }
  return items;
}

export function installed(root: string): Installed {
  const config = parseJson<Partial<HarnessConfigJson>>(read(join(root, 'harness.config.json')) ?? '{}');
  const files: [string, string][] = [
    ['.githooks/pre-commit', 'Runs npm run check before every commit and blocks the commit when a check fails.'],
    ['.storybook', 'Storybook: the reference preview of every component and kit (npm run storybook).'],
    ['playwright', 'Behavior tests in a real browser (npm run test:component), with shared helpers.'],
    ['harness/manifest.json', 'Who owns which file: sketchbook upgrade replaces harness-owned files and never touches yours.'],
    ['brand.config.json', 'Your foundations (color, type, spacing, radius, density…), each a preset or custom (sketchbook tokens).'],
    ['move-to-.claude/INSTALL.md', 'How Claude installs the staged Claude layer into .claude/: open Claude Code here and ask it to follow this file.'],
  ];
  const setup: InstalledItem[] = files.filter(([p]) => existsSync(join(root, p))).map(([name, what]) => ({ name, what }));
  const enginePkg = parseJson<PackageJson>(read(join(ENGINE, 'package.json')) ?? '{}');
  const engine = enginePkg.name;
  const pkg = parseJson<PackageJson>(read(join(root, 'package.json')) ?? '{}');
  if (engine && pkg.devDependencies?.[engine]) setup.unshift({ name: `${engine} (devDependency ${pkg.devDependencies[engine]})`, what: 'The engine: CLI, checks, generators and catalog, run from node_modules (npm run sketchbook -- <command>; npm update upgrades it).' });
  const needs: InstalledItem[] = [
    { name: `Node.js ${enginePkg.engines?.node ?? ''}`.trim(), what: 'Runs the CLI, the checks and the build.' },
    { name: 'Chromium for Playwright', what: 'npx playwright install chromium (init runs it unless --no-install).' },
    ...(config.adapters?.design?.tool === 'figma' ? [{ name: 'Figma MCP (use_figma)', what: 'Needed by sketchbook sync and the design-figma skill.' }] : []),
  ];
  const areas: InstalledArea[] = [
    { id: 'skills', title: 'Skills', items: skills(root) },
    { id: 'commands', title: 'Slash commands', items: list(join(root, claudeBase(root), 'commands'), (e) => e.name.endsWith('.md')).map((f) => ({ name: `/${f.replace(/\.md$/, '')}`, what: firstSentence(textOf((frontmatter(read(join(root, claudeBase(root), 'commands', f)) ?? '') ?? {}).description)) || 'command' })) },
    { id: 'rules', title: 'Rules', items: list(join(root, claudeBase(root), 'rules'), (e) => e.name.endsWith('.md')).map((f) => { const body = (read(join(root, claudeBase(root), 'rules', f)) ?? '').replace(/^---\n[\s\S]*?\n---\n/, '').split('\n').filter((l) => l.trim() && !l.startsWith('#')); return { name: f.replace(/\.md$/, ''), what: firstSentence(body.join(' ').replace(/^- /, '')) || 'rule' }; }) },
    { id: 'hooks', title: 'Hooks', items: hooks(root) },
    { id: 'checks', title: 'Checks', items: CHECKS.map((c) => ({ name: c.id, what: c.title })) },
    { id: 'cli', title: 'CLI commands', items: commands().map((c: { name: string; summary: string }) => ({ name: c.name, what: c.summary })) },
    { id: 'setup', title: 'Project setup', items: setup },
    { id: 'needs', title: 'Outside the project', items: needs },
  ];
  if (claudeBase(root) !== '.claude') for (const a of areas) if (['skills', 'commands', 'rules', 'hooks'].includes(a.id)) a.title += ' (staged in move-to-.claude/, not active yet)';
  return { areas: areas.filter((a) => a.items.length) };
}

export function installedMarkdown(data: Installed): string {
  const lines = ['# What Sketchbook installed', '', '<!-- GENERATED by sketchbook init from the files in this project. Do not edit; it is rewritten by init. -->', ''];
  for (const a of data.areas) lines.push(`## ${a.title} (${a.items.length})`, '', ...a.items.map((i) => `- **${i.name}**: ${i.what}`), '');
  return lines.join('\n');
}

export const installedSummary = (data: Installed): string[] => data.areas.map((a) => `  ${a.title} (${a.items.length}): ${a.items.map((i) => i.name).join(', ')}`);
