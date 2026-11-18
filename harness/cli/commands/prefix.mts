import { renamePrefix } from '../../commands/prefix.mjs';
import type { Command } from '../types.mjs';

export default {
  name: 'prefix',
  group: 'project',
  summary: 'Rename the element and CSS prefix everywhere (sources, contracts, tests, docs), rebuild, then check.',
  args: [{ name: 'new', required: true, description: 'Lowercase letters and digits, e.g. acme' }],
  options: {},
  examples: ['sketchbook prefix acme', 'sketchbook prefix acme --dry-run'],
  mutates: true,
  dryRun: true,
  async run({ root, args, dryRun, out, checks, json }) {
    const [next] = args;
    if (args.length !== 1 || next === undefined) throw Object.assign(new Error('Usage: sketchbook prefix <new>   (lowercase letters and digits, e.g. acme)'), { fix: 'Pass exactly one prefix.' });
    const r = await renamePrefix(root, undefined, next, { quiet: json || dryRun, dryRun });
    if (dryRun) { out(`prefix ${r.from} -> ${r.to}: would make ${r.replacements} replacement(s) in ${r.files.length} file(s), update harness.config.json and rebuild.`); return { changed: r.files, data: r }; }
    out('Checks:');
    const c = await checks();
    return { changed: [...r.files, 'harness.config.json', 'generated/css/tokens.css'], errors: c.errors, warnings: c.warnings, exitCode: c.exitCode === 1 ? 1 : 0, data: { from: r.from, to: r.to, replacements: r.replacements } };
  },
} satisfies Command;
