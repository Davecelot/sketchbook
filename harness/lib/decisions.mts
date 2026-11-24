// Decision first: commands that change the system open a proposed record in spec/decisions/DECISIONS.md (X1 format),
// listed in the index under its section. The person fills the PROPOSAL parts and changes the status to accepted.
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { HARNESS, parseJson } from './files.mjs';

const today = () => new Date().toISOString().slice(0, 10);
const LOG = 'spec/decisions/DECISIONS.md';
// The default system's decisions, as the project template pins them.
const PINNED = join(HARNESS, 'templates/project', LOG);
const INHERITED = 'Inherited from Sketchbook';
const idsIn = (text: string): string[] => [...text.matchAll(/^### (SB-\d{4}) /gm)].map((m) => m[1] ?? '');

// The first id after every default decision: inherited entries can arrive later, so team entries never reuse theirs.
export const firstTeamId = () => `SB-${String(Math.max(0, ...(existsSync(PINNED) ? idsIn(readFileSync(PINNED, 'utf8')) : []).map((id) => Number(id.slice(3)))) + 1).padStart(4, '0')}`;

export const emptyLog = () => `# Decisions\n\nDesign-system decisions for this project, newest first (harness format). Accepted decisions are read-only; change one by adding a new entry that supersedes it. Entries listed under "${INHERITED}" are defaults this project started from: they are copied in when a component that cites them is installed, with their own ids. Number your own entries from ${firstTeamId()} on.\n\n## Index\n\n---\n\n`;

export function entriesOf(text: string): Map<string, string> {
  return new Map(text.split(/\n(?=### SB-\d{4} )/).slice(1).map((e): [string, string] => [/^### (SB-\d{4})/.exec(e)?.[1] ?? '', e.replace(/\n---\n*$|\n+$/, '') + '\n\n']));
}

// SB ids the installed contracts cite.
export function citedDecisions(root: string): string[] {
  const dir = join(root, 'spec/components');
  if (!existsSync(dir)) return [];
  const ids = new Set<string>();
  for (const name of readdirSync(dir)) {
    try { for (const d of parseJson<{ decisions?: string[] }>(readFileSync(join(dir, name, 'contract.json'), 'utf8')).decisions ?? []) if (/^SB-\d{4}$/.test(d)) ids.add(d); } catch { /* no contract */ }
  }
  return [...ids].sort();
}

// Copies the cited default decisions the project's log does not have yet (X1 needs every cited id).
export function inheritDecisions(root: string, ids: string[] = citedDecisions(root)): string[] {
  const path = join(root, LOG);
  if (!existsSync(path) || !existsSync(PINNED)) return [];
  let text = readFileSync(path, 'utf8');
  const have = new Set(idsIn(text));
  const pinned = entriesOf(readFileSync(PINNED, 'utf8'));
  const missing = ids.filter((id) => !have.has(id) && pinned.has(id));
  if (!missing.length) return [];
  text = text.replace(/\n---\n\n/, `\n---\n\n${missing.map((id) => pinned.get(id)).join('')}`);
  const line = new RegExp(`^- ${INHERITED}: (.*)$`, 'm');
  text = line.test(text) ? text.replace(line, (_: string, list: string) => `- ${INHERITED}: ${[...list.split(', '), ...missing].sort().join(', ')}`) : text.replace('## Index\n', `## Index\n- ${INHERITED}: ${missing.join(', ')}\n`);
  writeFileSync(path, text);
  return missing;
}

export interface DecisionProposal { title: string; context: string; decision: string; why: string; watchOut: string; section: string }

export async function proposeDecision(root: string, { title, context, decision, why, watchOut, section }: DecisionProposal): Promise<string> {
  const path = join(root, LOG);
  const text = await readFile(path, 'utf8');
  const separator = /(\r?\n)---\1\1/;
  const eol = separator.exec(text)?.[1];
  if (!eol || !text.includes(`## Index${eol}`)) throw new Error('The decision log needs an index and an entry separator.');
  // After every default id too, so a later inherited entry never collides with the team's own.
  const pinnedIds = existsSync(PINNED) ? idsIn(readFileSync(PINNED, 'utf8')) : [];
  const next = Math.max(0, ...[...idsIn(text), ...pinnedIds].map((id) => Number(id.slice(3)))) + 1;
  const id = `SB-${String(next).padStart(4, '0')}`;
  const entry = `### ${id} · ${today()} · ${title}\n**Status:** proposed\n**Context:** ${context}\n**Decision:** ${decision}\n**Why:** ${why}\n**Watch out:** ${watchOut}\n\n`.replaceAll('\n', eol);
  let out = text.replace(separator, (marker) => marker + entry);
  const line = new RegExp(`- ${section}: `);
  out = line.test(out) ? out.replace(line, `- ${section}: ${id}, `) : out.replace(`## Index${eol}`, `## Index${eol}- ${section}: ${id}${eol}`);
  await writeFile(path, out);
  return id;
}
