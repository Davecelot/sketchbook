import { explain } from '../../commands/explain.mjs';
import type { Command } from '../types.mjs';

export default {
  name: 'explain',
  group: 'quality',
  summary: 'Explain a token, CSS variable, component, tag or decision from the spec.',
  args: [{ name: 'thing', required: true, variadic: true, description: 'Token path, --css-var, component name, tag, SB-NNNN or free text' }],
  options: {},
  examples: ['sketchbook explain color.primary', 'sketchbook explain button', 'sketchbook explain SB-0024'],
  mutates: false,
  dryRun: false,
  async run({ root, args, out }) {
    const text = await explain(root, args.join(' '));
    out(text);
    return { data: { text } };
  },
} satisfies Command;
