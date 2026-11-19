#!/usr/bin/env node
// PreToolUse (Edit|Write|MultiEdit): settled decisions stay settled. New entries may be added to
// spec/decisions/DECISIONS.md, and the index may change, but an existing entry's text may not.
// To change a decision, add a new entry that supersedes it.
import { readFileSync, realpathSync } from 'node:fs';
import { join } from 'node:path';

interface Edit { old_string?: string; new_string?: string }
interface ToolCall { tool_name?: string; tool_input?: Edit & { file_path?: string; content?: string; edits?: Edit[] } }
const input = JSON.parse(await new Promise<string>((r) => { let d = ''; process.stdin.on('data', (c: Buffer) => (d += String(c))); process.stdin.on('end', () => r(d || '{}')); })) as ToolCall;
const file = String(input.tool_input?.file_path ?? '');
const normalizedFile = file.replace(/\\/g, '/');
const windowsPath = process.platform === 'win32' || /^[A-Za-z]:\//.test(normalizedFile);
let isDecisions = windowsPath ? normalizedFile.toLowerCase().endsWith('spec/decisions/decisions.md') : normalizedFile.endsWith('spec/decisions/DECISIONS.md');
if (!isDecisions && process.env.CLAUDE_PROJECT_DIR) {
  try {
    const actual = realpathSync(file);
    const expected = realpathSync(join(process.env.CLAUDE_PROJECT_DIR, 'spec/decisions/DECISIONS.md'));
    isDecisions = process.platform === 'win32' ? actual.toLowerCase() === expected.toLowerCase() : actual === expected;
  } catch { /* A missing or inaccessible alias cannot be compared. */ }
}
if (!isDecisions) process.exit(0);
let current = '';
try { current = readFileSync(file, 'utf8'); } catch { process.exit(0); }
// Only accepted (and superseded/incident) entries are settled; proposed ones can still be edited.
const entries = current.split(/\n(?=### SB-\d{4} )/).slice(1).map((e) => e.trim()).filter((e) => !/\*\*Status:\*\* proposed/.test(e));
const block = (msg: string): never => { process.stderr.write(`Blocked: ${msg} Settled decisions stay settled: add a new SB entry that supersedes it instead.\n`); process.exit(2); };
const t = input.tool_input ?? {};
if (input.tool_name === 'Write') {
  for (const e of entries) if (!String(t.content ?? '').includes(e)) block(`this write would change or remove ${e.slice(4, 11)}.`);
} else {
  const edits = t.edits ?? [{ old_string: t.old_string, new_string: t.new_string }];
  for (const { old_string: o = '', new_string: n = '' } of edits) {
    const touched = entries.find((e) => o && (e.includes(o) || o.includes(e.slice(0, 40))));
    if (!touched) continue;
    if (!n.includes(o)) block(`this edit changes ${touched.slice(4, 11)}.`);
    // Keeping the old text is not enough: only whole new entries (and separators) may be added next to a settled one.
    const added = n.replace(o, '').replace(/^[\s-]+/, '');
    if (added && !/^### SB-\d{4} /.test(added)) block(`this edit adds text to ${touched.slice(4, 11)}.`);
  }
}
