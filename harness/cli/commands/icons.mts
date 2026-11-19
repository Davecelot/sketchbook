import { addIcons, ICONS_FILE, loadIcons, removeIcons } from '../../lib/icons.mjs';
import type { Command, OptionSpecs } from '../types.mjs';

const ACTIONS = ['list', 'add', 'remove'];

const options = { category: { type: 'string', value: 'category', description: 'add: group in the design file (action, navigation, feedback, content, ...)' } } satisfies OptionSpecs;

export default {
  name: 'icons',
  group: 'design',
  summary: 'List the icons in your project or add icons from Lucide.',
  subcommands: ACTIONS,
  args: [
    { name: 'action', required: false, description: 'list (default) | add | remove' },
    { name: 'names', required: false, variadic: true, description: 'Lucide icon names, e.g. chevron-down check' },
  ],
  options,
  examples: ['sketchbook icons list', 'sketchbook icons add chevron-down check --category navigation', 'sketchbook icons remove star'],
  mutates: true,
  dryRun: true,
  async run({ root, args, options, dryRun, out }) {
    const [action = 'list', ...names] = args;
    if (!ACTIONS.includes(action)) throw Object.assign(new Error(`Unknown icons action "${action}".`), { fix: `Use ${ACTIONS.join(' | ')}.` });
    if (action === 'list') {
      const { icons } = loadIcons(root);
      const byCategory: Record<string, string[]> = {};
      for (const [name, i] of Object.entries(icons)) (byCategory[i.category] ??= []).push(name);
      for (const [c, list] of Object.entries(byCategory).sort(([a], [b]) => a.localeCompare(b))) out(`${c.padEnd(12)} ${list.join(', ')}`);
      return { data: { icons: Object.keys(icons).length, byCategory }, next: 'sketchbook icons add <name> --category <group>' };
    }
    if (!names.length) throw Object.assign(new Error(`Usage: sketchbook icons ${action} <names...>`), { fix: 'sketchbook icons list' });
    if (dryRun) { out(`Would ${action} ${names.join(', ')} in ${ICONS_FILE}.`); return { changed: [ICONS_FILE] }; }
    if (action === 'add') {
      const r = await addIcons(root, names, options.category);
      out(`Icons added: ${r.added.join(', ') || 'none (already there)'}. ${r.total} in ${ICONS_FILE}.`);
      return { changed: [ICONS_FILE], next: 'sketchbook sync icons', data: r };
    }
    const r = await removeIcons(root, names);
    out(`Icons removed: ${r.removed.join(', ') || 'none'}${r.missing.length ? `; not in the catalog: ${r.missing.join(', ')}` : ''}. ${r.total} left.`);
    return { changed: [ICONS_FILE], next: 'sketchbook sync icons (a removed icon stays in the design file until deleted there)', data: r };
  },
} satisfies Command<typeof options>;
