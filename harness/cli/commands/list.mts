import { catalogIndex, manifestOf, installedComponents, kitIndex, kitInstalled, requiresOf } from '../../commands/catalog.mjs';
import type { Command, OptionSpecs } from '../types.mjs';

const options = {
  installed: { type: 'boolean', description: 'Only installed components (including ones the team made)' },
  available: { type: 'boolean', description: 'Only catalog components not installed yet' },
} satisfies OptionSpecs;

export default {
  name: 'list',
  group: 'components',
  summary: 'List catalog components (installed or available) with what each needs, plus template kits (read-only).',
  args: [],
  options,
  examples: ['sketchbook list', 'sketchbook list --available', 'sketchbook list --installed --json'],
  mutates: false,
  project: false,
  dryRun: false,
  run({ root, options, out }) {
    const index = catalogIndex(root);
    const present = installedComponents(root);
    let rows = [...new Set([...index.components, ...present])].sort().map((name) => {
      const m = manifestOf(root, name);
      return { name, installed: present.includes(name), catalog: Boolean(m), status: m?.status ?? null, requires: m ? requiresOf(m) : [] };
    });
    if (options.installed) rows = rows.filter((r) => r.installed);
    if (options.available) rows = rows.filter((r) => !r.installed && r.catalog);
    for (const r of rows) out(`${r.installed ? '*' : ' '} ${r.name.padEnd(16)} ${r.catalog ? r.status : 'team-made'}${r.requires.length ? `  needs ${r.requires.join(', ')}` : ''}`);
    const kits = kitIndex(root).map((k) => ({ id: k.id, title: k.title, installed: kitInstalled(root, k), components: k.components }));
    if (!options.installed && !options.available && kits.length) { out('\nKits:'); for (const k of kits) out(`${k.installed ? '*' : ' '} ${k.id.padEnd(16)} ${k.title}`); }
    out('\n* = installed. sketchbook add <name> installs (with what it needs); sketchbook remove <name> uninstalls.');
    return { data: { components: rows, kits }, next: options.available ? 'sketchbook add <name>' : null };
  },
} satisfies Command<typeof options>;
