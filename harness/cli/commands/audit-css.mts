import { auditCss, writeProposal } from '../../commands/audit-css.mjs';
import type { Command } from '../types.mjs';

export default {
  name: 'audit-css',
  group: 'tokens',
  summary: 'Audit an existing product\'s CSS: cluster its colors (OKLCH distance), font sizes, spacing, radii and shadows into a foundations proposal (generated/import/codebase.proposal.json).',
  args: [{ name: 'paths', required: true, variadic: true, description: 'CSS/SCSS files, folders or globs (quote globs), relative to the project' }],
  options: {},
  examples: ['sketchbook audit-css ../product/src', 'sketchbook audit-css "app/**/*.css" --json'],
  mutates: true,
  project: false,
  dryRun: true,
  run({ root, args, dryRun, out }) {
    const p = auditCss(root, args);
    const summary = `${p.sources.length} file(s): ${p.colors.clusters.length} color cluster(s), ${p.fontSizes.length} font size(s), spacing base ${p.spacing.base}px (${Math.round(p.spacing.fit * 100)}% fit), ${p.radii.length} radius value(s), ${p.shadows.length} shadow(s).`;
    if (dryRun) { out(`Would write generated/import/codebase.proposal.json from ${summary}`); return { changed: ['generated/import/codebase.proposal.json'], data: p }; }
    const file = writeProposal(root, p);
    out(`${file} from ${summary}\nProposed primary ${p.proposedFoundations.color.primary}, body ${p.proposedFoundations.typography.baseSize}px. Nothing is applied.`);
    return { changed: [file], data: p, next: 'Review the CSS audit proposal; in a Sketchbook project, apply chosen foundation values with sketchbook tokens' };
  },
} satisfies Command;
