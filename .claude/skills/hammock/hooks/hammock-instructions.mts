#!/usr/bin/env node
// hammock — ladder card builder for the hooks below.
//
// Injects assets/DECISION-LADDER.md (about 300 tokens), never the full
// SKILL.md: the hooks run at session start, after compaction and per
// subagent, so every byte here is paid on each of those. The full skill
// loads on demand with /hammock <mode> (ponytail and caveman upstreams
// inject once and small too).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CARD_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'DECISION-LADDER.md');

export function getFallbackInstructions(mode: string): string {
  return (
    'HAMMOCK MODE ACTIVE — level: ' +
    mode +
    '\n\n' +
    'Before writing new code, walk this ladder and stop at the first step that holds:\n' +
    '1. Does this need to exist at all? (YAGNI)\n' +
    '2. Already in this codebase? Reuse it.\n' +
    "3. Already defined in the component contract? Follow contract.md, don't invent.\n" +
    '4. Built into the framework/stdlib? Use it.\n' +
    "5. Already a dependency? Use it, don't add a new one.\n" +
    '6. Can it be one line? Stop there.\n' +
    '7. Only then: minimum viable code, nothing speculative.\n\n' +
    'Never simplify away: input validation/error handling that prevents data loss, ' +
    "accessibility, anything a component's contract.md requires, or a feature the user " +
    'explicitly asked for.'
  );
}

export function getHammockInstructions(mode: string): string {
  try {
    const card = fs.readFileSync(CARD_PATH, 'utf8').replace(/^# .*\n+/, '').trim();
    return 'HAMMOCK MODE ACTIVE — level: ' + mode + '\n\n' + card + '\n\nModes, review, audit and debt: /hammock <mode>.';
  } catch {
    return getFallbackInstructions(mode);
  }
}
