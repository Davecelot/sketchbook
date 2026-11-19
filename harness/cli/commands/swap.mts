import { swap, SWAPPABLE } from '../../commands/swap.mjs';
import { show } from '../../lib/files.mjs';
import type { Command, OptionSpecs } from '../types.mjs';

const options = { file: { type: 'string', value: 'id', description: 'Design file key (design figma)' } } satisfies OptionSpecs;

export default {
  name: 'swap',
  group: 'project',
  summary: 'Change the tool that builds tokens or syncs your design file, then rebuild and check.',
  args: [
    { name: 'output', required: true, description: `What to swap: ${Object.keys(SWAPPABLE).join(' | ')}` },
    { name: 'adapter', required: true, description: `tokens: ${(SWAPPABLE.tokens ?? []).join(' | ')}; design: ${(SWAPPABLE.design ?? []).join(' | ')}` },
  ],
  options,
  examples: ['sketchbook swap tokens plain', 'sketchbook swap design none'],
  mutates: true,
  dryRun: true,
  async run({ root, args, options, dryRun, out, checks }) {
    // dispatch refuses fewer than the two required arguments.
    const [output = '', adapter = ''] = args;
    const r = await swap(root, output, adapter, { file: options.file, dryRun });
    const changed = ['harness.config.json', ...(output === 'tokens' ? ['generated/css/tokens.css', 'generated/tokens/component.tokens.json'] : [])];
    if (dryRun) { out(`${output}: ${show(r.before ?? 'none')} -> ${r.after} (dry run; would write ${changed.join(', ')})`); return { changed, data: r }; }
    out(`${output}: ${show(r.before ?? 'none')} -> ${r.after}. Checks:`);
    const c = await checks();
    return { changed, errors: c.errors, warnings: c.warnings, exitCode: c.exitCode === 1 ? 1 : 0, data: r };
  },
} satisfies Command<typeof options>;
