import { regenerate } from '../../commands/prefix.mjs';
import type { Command } from '../types.mjs';

export const GENERATED = ['generated/css/tokens.css', 'generated/css/fonts.css', 'generated/tokens/component.tokens.json', 'src/components/*/*.styles.ts', 'src/index.ts', 'spec/tokens/interface.json'];

export default {
  name: 'generate',
  group: 'project',
  summary: 'Rebuild tokens, styles, and other generated outputs from your project sources. Run npm run generate in an initialized project for the same build.',
  args: [],
  options: {},
  examples: ['sketchbook generate', 'sketchbook generate --json'],
  mutates: true,
  dryRun: false,
  async run({ root, out }) {
    await regenerate(root);
    out(`Rebuilt: ${GENERATED.join(', ')}.`);
    return { changed: GENERATED, next: 'sketchbook check' };
  },
} satisfies Command;
