import { componentDoc } from '../../lib/design/docs.mjs';
import { docText } from '../../lib/design/doc-text.mjs';
import { patternDoc, patternIds } from '../../lib/design/patterns.mjs';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Command } from '../types.mjs';

export default {
  name: 'docs',
  group: 'design',
  summary: 'Read a component or kit’s variants, tokens, and accessibility guidance. Use --json for the design blueprint.',
  args: [{ name: 'name', required: true, description: 'A component folder name (spec/components) or a pattern id (src/patterns)' }],
  options: {},
  examples: ['sketchbook docs button', 'sketchbook docs field --json', 'sketchbook docs sign-in'],
  mutates: false,
  dryRun: false,
  async run({ root, args, out }) {
    // dispatch refuses a missing <name> (required), so the default never applies.
    const [name = ''] = args;
    const isComponent = existsSync(join(root, 'spec/components', name, 'contract.json'));
    const doc = !isComponent && (await patternIds(root)).includes(name) ? await patternDoc(root, name) : await componentDoc(root, name);
    const tty = process.stdout.isTTY && !('NO_COLOR' in process.env);
    out(docText(doc, { highlight: tty ? (s) => `\x1b[34m${s}\x1b[0m` : (s) => s }));
    return { data: { doc } };
  },
} satisfies Command;
