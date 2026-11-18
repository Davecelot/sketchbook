import { regenerate } from '../../commands/prefix.mjs';
import type { Command } from '../types.mjs';

export const GENERATED = ['generated/css/tokens.css', 'generated/css/fonts.css', 'generated/tokens/component.tokens.json', 'src/components/*/*.styles.ts', 'src/index.ts', 'spec/tokens/interface.json'];

export default {
  name: 'generate',
  group: 'project',
  summary: 'Rebuild every generated output from the spec: token CSS, component tokens, component styles, the barrel, brand CSS and the token interface (what npm run generate runs in a project).',
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
