import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseJson } from '../../lib/files.mjs';
import type { CheckIssue, Report } from '../../checks/types.mjs';
import type { Command, OptionSpecs } from '../types.mjs';

const RUN = fileURLToPath(new URL('../../checks/run.mjs', import.meta.url));

const options = {
  only: { type: 'string', value: 'T1,T6', description: 'Run a subset of checks by id' },
  fix: { type: 'boolean', description: 'Rebuild generated outputs first (the only automatic fix)' },
  verbose: { type: 'boolean', description: 'List every check, not only failures and warnings' },
  maintainer: { type: 'boolean', description: 'Also require the Storybook and docs site builds to be current (O1) and that every shipped component is documented in every output (M1); maintainers only' },
} satisfies OptionSpecs;

export default {
  name: 'check',
  group: 'quality',
  summary: 'Check that your sources and outputs agree. Exit 0 means pass, 1 means a failure, and 2 means pass with flagged overrides.',
  args: [],
  options,
  examples: ['sketchbook check', 'sketchbook check --only T6', 'sketchbook check --maintainer', 'sketchbook check --json'],
  mutates: false,
  dryRun: false,
  run({ root, options, json }) {
    const args = [RUN, ...(options.only ? [`--only=${options.only}`] : []), ...(options.fix ? ['--fix'] : []), ...(options.maintainer ? ['--maintainer'] : []), ...(options.verbose ? ['--verbose'] : [])];
    if (!json) return { exitCode: spawnSync('node', args, { stdio: 'inherit', cwd: root }).status ?? 1 };
    const r = spawnSync('node', [...args, '--json'], { cwd: root, encoding: 'utf8' });
    const report = parseJson<Report>(r.stdout);
    const flat = (k: 'errors' | 'warnings') => report.results.flatMap((x) => x[k].map((e: CheckIssue) => ({ ...e, id: x.id })));
    return {
      exitCode: report.exitCode,
      errors: flat('errors'),
      warnings: flat('warnings'),
      changed: options.fix ? ['generated/**', 'src/components/*/*.styles.ts', 'src/index.ts'] : [],
      next: report.ok ? (report.overrides.length ? 'Review the flagged overrides (spec/tokens/overrides.json).' : null) : 'Fix the errors above (each has a fix), then run sketchbook check again.',
      data: report,
    };
  },
} satisfies Command<typeof options>;
