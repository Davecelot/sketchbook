import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isSketchbookPage, pageOutlineMisses } from '../../lib/page-outline.mjs';
import { readJsonSync } from '../../lib/files.mjs';
import type { Command } from '../types.mjs';

export default {
  name: 'audit-page',
  group: 'quality',
  summary: 'Check a complete HTML page using this design system for a level-one heading and main landmark. This static check is not a full accessibility audit.',
  args: [{ name: 'file', required: true, description: 'HTML file to check, relative to the current project' }],
  options: {},
  examples: ['sketchbook audit-page preview.html', 'sketchbook audit-page preview.html --json'],
  mutates: false,
  dryRun: false,
  run({ root, args, out }) {
    const file = args[0] ?? '';
    if (!/\.html?$/i.test(file)) return { errors: [{ file, msg: 'Expected an HTML file.', fix: 'Pass a .html or .htm file.' }] };
    const html = readFileSync(resolve(root, file), 'utf8');
    const prefix = readJsonSync<{ prefix?: string }>(resolve(root, 'harness.config.json'))?.prefix ?? 'sb';
    const checked = isSketchbookPage(html, prefix);
    const misses = pageOutlineMisses(html, prefix);
    if (!checked) out(`${file}: skipped; expected a complete HTML page containing a <${prefix}-...> element.`);
    else if (!misses.length) out(`${file}: no page-outline issues found. This is not a full accessibility audit.`);
    return { data: { file, checked, misses }, errors: misses.map((msg) => ({ file, msg, fix: 'Add the missing heading or main landmark, then run a browser accessibility audit.' })) };
  },
} satisfies Command;
