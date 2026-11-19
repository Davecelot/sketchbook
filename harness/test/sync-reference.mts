// npm run test:reference-sync: refresh the pinned reference skeleton (harness/templates/project/) from this
// repo's live files, the default project it is a copy of. Run it in the Sketchbook source repo after changing one of
// those files (R1 in TEST.md fails until then). It only overwrites files the skeleton already pins; adding a new file
// to the skeleton is a deliberate copy by hand.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SKELETON } from './reference.mjs';
import { readJson, walk } from '../lib/files.mjs';
import type { HarnessConfigJson } from '../../generated/types/harness-config.js';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));

// npm never packs a file named .gitignore, so the skeleton keeps it as `gitignore` (init restores the name).
export const LIVE_NAME: Record<string, string> = { gitignore: '.gitignore' };
export const liveOf = (rel: string): string => LIVE_NAME[rel] ?? rel;

// Folders the skeleton pins whole: installed components and their specs import any of their files, so a live file the
// skeleton lacks breaks a project's typecheck.
export const PINNED_DIRS = ['playwright/helpers', 'src/controllers', 'src/mixins', 'src/utils'];

// These are consumer instructions, not copies of the source repository's own agent instructions.
// They are exercised by the bootstrap and package tests and must not be overwritten by reference-sync.
export const PROJECT_AGENT_INSTRUCTIONS = new Set(['AGENTS.md', '.trae/rules/sketchbook.md', '.aiassistant/rules/sketchbook.md', '.agents/skills/sketchbook/SKILL.md', 'AGENT-WORKFLOWS.md', 'GEMINI.md', '.codex/hooks.json', '.codex/sketchbook-guard.mjs', '.gemini/settings.json', '.gemini/sketchbook-guard.mjs', '.github/copilot-instructions.md', '.github/hooks/sketchbook.json', '.github/hooks/sketchbook-guard.mjs']);

// Skeleton path -> 'same' | 'differs' | 'missing' (no live counterpart); a live file in a PINNED_DIRS folder that the
// skeleton lacks -> 'unpinned'.
export interface Drift { file: string; state: 'same' | 'differs' | 'missing' | 'unpinned' }

export function skeletonDrift(root: string = ROOT): Drift[] {
  const pinned = walk(SKELETON, '.').filter((rel) => !PROJECT_AGENT_INSTRUCTIONS.has(rel)).sort().map((rel): Drift => {
    const live = join(root, liveOf(rel));
    if (!existsSync(live)) return { file: rel, state: 'missing' };
    return { file: rel, state: readFileSync(live).equals(readFileSync(join(SKELETON, rel))) ? 'same' : 'differs' };
  });
  const unpinned = PINNED_DIRS.flatMap((dir) => walk(join(root, dir), '.').map((f) => join(dir, f)))
    .filter((rel) => !existsSync(join(SKELETON, rel)))
    .sort()
    .map((rel): Drift => ({ file: rel, state: 'unpinned' }));
  return [...pinned, ...unpinned];
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const config = readJson<HarnessConfigJson>(join(ROOT, 'harness.config.json'));
  if (config.catalog?.source !== true) {
    console.error('Not the Sketchbook source repo (harness.config.json catalog.source is not true): the skeleton is a copy of the default project, so it is refreshed only there.');
    process.exit(1);
  }
  const drift = skeletonDrift();
  for (const d of drift.filter((x) => x.state === 'differs')) { writeFileSync(join(SKELETON, d.file), readFileSync(join(ROOT, liveOf(d.file)))); console.log(`refreshed ${d.file}`); }
  for (const d of drift.filter((x) => x.state === 'missing')) console.log(`no live counterpart (left as is): ${d.file}`);
  for (const d of drift.filter((x) => x.state === 'unpinned')) console.log(`not in the skeleton (copy it by hand): ${d.file}`);
  if (!drift.some((x) => x.state !== 'same')) console.log('The reference skeleton already matches the live files.');
}
