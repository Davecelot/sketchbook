import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { HARNESS } from '../../lib/files.mjs';
import type { Command } from '../types.mjs';

export default {
  name: 'selftest',
  group: 'quality',
  summary: 'Run the harness\'s own tests against the installed engine: they prove every check can still reject and that the CLI, starters and generators work (what npm run test:harness runs in a project).',
  args: [],
  options: {},
  examples: ['sketchbook selftest'],
  mutates: false,
  dryRun: false,
  run({ root, json }) {
    const dir = join(HARNESS, 'test');
    const files = readdirSync(dir).filter((f) => f.endsWith('.test.mjs')).sort().map((f) => join(dir, f));
    const r = spawnSync('node', ['--test', ...files], { cwd: root, stdio: json ? 'pipe' : 'inherit', encoding: 'utf8' });
    const summary = json ? Object.fromEntries([...(r.stdout ?? '').matchAll(/^ℹ (tests|pass|fail|skipped) (\d+)$/gm)].map((m): [string, number] => [m[1] ?? '', Number(m[2])])) : undefined;
    return { exitCode: r.status === 0 ? 0 : 1, data: summary ? { tests: summary } : undefined, next: r.status === 0 ? null : 'Each failing test names the check or command it proves; report it upstream if the engine is unchanged.' };
  },
} satisfies Command;
