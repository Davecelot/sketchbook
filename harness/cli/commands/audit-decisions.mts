import { readFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { parseDecisions } from '../../checks/x1-decisions.mjs';
import type { Command, IssueLike, OptionSpecs } from '../types.mjs';

// Entry separators belong to the log, not to either neighboring decision.
const entryText = (body: string): string => body.replace(/\r\n/g, '\n').replace(/\n---\s*$/, '').trim();
const decisionHeading = /^### SB-\d{4} · \d{4}-\d{2}-\d{2} · .+$/;
const options = { 'git-ref': { type: 'string', value: 'ref', description: 'Compare against the committed log at this Git revision (for example HEAD)' } } satisfies OptionSpecs;

function gitBaseline(root: string, ref: string, file: string): string {
  const git = (...args: string[]) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
  const commit = git('rev-parse', '--verify', '--end-of-options', `${ref}^{commit}`).trim();
  if (!/^[a-f0-9]{40,64}$/i.test(commit)) throw new Error('Git did not return a commit ID for the baseline.');
  const prefix = git('rev-parse', '--show-prefix').replace(/\r?\n$/, '');
  return git('show', '--no-ext-diff', '--no-textconv', `${commit}:${prefix}${file}`);
}

export default {
  name: 'audit-decisions',
  group: 'quality',
  summary: 'Compare the decision log with a trusted earlier copy or Git revision and report changes to settled entries. This read-only audit does not replace check X1.',
  args: [{ name: 'baseline', required: false, description: 'Path to a trusted earlier copy of spec/decisions/DECISIONS.md' }],
  options,
  examples: ['sketchbook audit-decisions ../decisions-before.md', 'sketchbook audit-decisions --git-ref HEAD --json'],
  mutates: false,
  dryRun: false,
  run({ root, args, options, out }) {
    const file = args[0];
    const ref = options['git-ref'];
    if ((!file && !ref) || (file && ref) || args.length > 1) return { errors: [{ msg: 'Choose exactly one baseline file or --git-ref.', fix: 'Run sketchbook help audit-decisions.' }] };
    const baseline = ref ? `git:${ref}` : file ?? '';
    const current = 'spec/decisions/DECISIONS.md';
    if (file && realpathSync(resolve(root, file)) === realpathSync(resolve(root, current))) return { errors: [{ file, msg: 'The baseline is the current decision log.', fix: 'Supply a trusted copy from before the change.' }] };
    const beforeText = ref ? gitBaseline(root, ref, current) : readFileSync(resolve(root, baseline), 'utf8');
    const afterText = readFileSync(resolve(root, current), 'utf8');
    // The shared parser expects a newline before each entry, including the first.
    const before = parseDecisions(`\n${beforeText}`);
    const after = parseDecisions(`\n${afterText}`);
    const errors: IssueLike[] = [];
    for (const [path, text] of [[baseline, beforeText], [current, afterText]] as const) {
      for (const heading of text.split(/\r?\n/).filter((line) => /^#{1,6}[ \t]*SB-/.test(line))) {
        if (!decisionHeading.test(heading.trim())) errors.push({ file: path, msg: `Invalid decision heading: ${heading}`, fix: 'Use ### SB-NNNN · YYYY-MM-DD · Title before comparing.' });
      }
    }
    for (const [file, entries] of [[baseline, before], [current, after]] as const) {
      const ids = new Set<string>();
      for (const entry of entries) {
        if (!entry.id) errors.push({ file, msg: `Invalid decision heading: ${entry.head}`, fix: 'Fix the decision log heading before comparing.' });
        else if (ids.has(entry.id)) errors.push({ file, token: entry.id, msg: `Duplicate decision ${entry.id}.`, fix: 'Use unique decision IDs before comparing.' });
        else ids.add(entry.id);
      }
    }
    const byId = new Map(after.filter((e) => e.id).map((e) => [e.id, e]));
    for (const entry of before) {
      if (!entry.id || entry.status === 'proposed') continue;
      const found = byId.get(entry.id);
      if (!found || entryText(entry.body) !== entryText(found.body)) errors.push({ file: current, token: entry.id, msg: `Settled decision ${entry.id} was changed or removed.`, fix: 'Restore it and add a new decision that supersedes it.' });
    }
    const compared = before.filter((e) => e.id && e.status !== 'proposed').length;
    if (!errors.length) out(compared ? 'Settled decisions match the supplied baseline. Run sketchbook check to validate the log.' : 'No settled decisions were found in the baseline; none were compared. Run sketchbook check to validate the log.');
    return { errors, data: { baseline, current, compared } };
  },
} satisfies Command<typeof options>;
