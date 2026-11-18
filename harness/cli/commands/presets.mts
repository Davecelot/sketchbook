import { families, family } from '../../standards/resolve.mjs';
import { FAMILY_KEYS } from '../../standards/resolve.mjs';
import { show } from '../../lib/files.mjs';
import type { Command, CommandContext } from '../types.mjs';

export default {
  name: 'presets',
  group: 'tokens',
  summary: 'List the standards catalog: families, or one family\'s presets with sources (read-only).',
  args: [{ name: 'family', required: false, description: 'A family id, e.g. spacing, typeScale, motion' }],
  options: {},
  examples: ['sketchbook presets', 'sketchbook presets motion'],
  mutates: false,
  project: false,
  dryRun: false,
  // Narrower than CommandContext: tokens presets runs it with its own context.
  run({ args, out }: Pick<CommandContext, 'root' | 'args' | 'out'>) {
    if (!args[0]) {
      const list = families().map((f) => { const c = family(f); return { family: f, configKey: FAMILY_KEYS[f] ?? null, default: c.default, presets: c.presets.map((p) => p.id), description: c.$description }; });
      for (const f of list) out(`${f.family.padEnd(14)} ${(f.configKey ?? '-').padEnd(24)} ${f.presets.map((p) => (p === f.default ? `${p}*` : p)).join(', ')}`);
      out('\n* = default. sketchbook presets <family> shows values and sources.');
      return { data: { families: list }, next: 'sketchbook presets <family>' };
    }
    const c = family(args[0]);
    const presets = c.presets.map((p) => ({ id: p.id, label: p.label, default: p.id === c.default, implemented: p.implemented !== false, verified: p.verified, source: p.source, description: p.description, values: p.values }));
    out(`${c.family}: ${c.$description}${FAMILY_KEYS[c.family] ? `\nSet in brand.config.json: ${FAMILY_KEYS[c.family]} = { "preset": "<id>" }` : ''}\n`);
    for (const p of presets) out(`${p.id}${p.default ? ' (default)' : ''}${p.implemented ? '' : ' (catalogued, not implemented)'} - ${p.label}\n  ${p.description}\n  source: ${show(p.source ?? 'none (our own)')}${p.verified ? '' : ' (not verified)'}`);
    return { data: { family: c.family, configKey: FAMILY_KEYS[c.family] ?? null, presets } };
  },
} satisfies Command;
