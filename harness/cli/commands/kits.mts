import { kitIndex, kitInstalled, kitManifestOf, installKits, removeKits, readConfig, catalogDrift } from '../../commands/catalog.mjs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readProgress } from '../../lib/design/sync.mjs';
import { runChecks } from '../../checks/run.mjs';
import { COMPONENT_CHECKS } from './add.mjs';
import { parseJson } from '../../lib/files.mjs';
import type { Kit } from '../../commands/catalog.mjs';
import type { CheckIssue } from '../../checks/types.mjs';
import type { Command, OptionSpecs } from '../types.mjs';

// After adding or removing a kit: the component checks, the kit index (K1) and the generated files (G1: interface.json).
export const KIT_CHECKS = [...COMPONENT_CHECKS, 'K1', 'G1'];

const ACTIONS = ['list', 'add', 'remove'];

const options = { yes: { type: 'boolean', description: 'remove: confirm removing a kit whose files differ from the catalog (your edits are only in git)' } } satisfies OptionSpecs;

export default {
  name: 'kits',
  group: 'components',
  summary: 'Browse template kits, install a kit with its components, or remove one.',
  subcommands: ['list', 'add', 'remove'],
  args: [
    { name: 'action', required: false, description: 'list (default) | add | remove' },
    { name: 'kit', required: false, variadic: true, description: 'Kit id(s), e.g. sign-in settings' },
  ],
  options,
  examples: ['sketchbook kits list', 'sketchbook kits add sign-in --dry-run', 'sketchbook kits remove dashboard', 'sketchbook kits remove dashboard --yes'],
  mutates: true,
  dryRun: true,
  async run({ root, args, options, dryRun, out }) {
    const [action = 'list', ...ids] = args;
    if (!ACTIONS.includes(action)) throw Object.assign(new Error(`Unknown kits action "${action}".`), { fix: `Use ${ACTIONS.join(' | ')}.` });
    if (action === 'list') {
      const progress = await readProgress(root);
      const layoutOf = (k: Kit) => { try { return Object.keys(parseJson<{ layout?: { states?: Record<string, unknown> } }>(readFileSync(join(root, k.path, 'pattern.json'), 'utf8')).layout?.states ?? {}).length; } catch { return 0; } };
      const kits = kitIndex(root).map((k) => ({ ...k, installed: kitInstalled(root, k), inCatalog: Boolean(kitManifestOf(root, k.id)), design: { states: layoutOf(k), stage: progress.patterns[k.id]?.stage ?? 'planned' } }));
      if (!kits.length) out('No template kits (harness/kits/index.json is missing or empty).');
      for (const k of kits) out(`${k.installed ? '*' : ' '} ${k.id.padEnd(14)} ${k.title}: ${k.summary}\n    uses ${k.components.join(', ')}${k.installed ? `\n    design file: ${k.design.states ? `${k.design.states} state layout(s)` : 'no layout yet'}, ${k.design.stage}` : ''}`);
      if (kits.length) out('\n* = installed (src/patterns/<kit>). sketchbook kits add <kit> installs it with its components.');
      return { data: { kits }, next: 'sketchbook kits add <kit>' };
    }
    if (!ids.length) throw Object.assign(new Error(`Usage: sketchbook kits ${action} <kit...>`), { fix: 'sketchbook kits list' });
    const r = action === 'add' ? await installKits(root, ids, { dryRun }) : await removeKits(root, ids, { dryRun, yes: options.yes });
    if (dryRun) {
      out(`Would ${action} ${ids.join(', ')}:\n  ${r.changed.join('\n  ') || '(nothing: already in that state)'}`);
      if ('customized' in r && r.customized.length) out(`Needs --yes: kit ${r.customized.join(', ')} differs from the catalog (edited); removing loses those edits.`);
      return { changed: r.changed, data: r };
    }
    out('installed' in r ? `Kits added: ${r.installed.join(', ') || 'none (already installed)'}${r.components.length ? `; components installed first: ${r.components.join(', ')}` : ''}.` : `Kits removed: ${r.removed.join(', ')}; interface and barrel rebuilt. Their components stay (sketchbook remove <name> to drop one).`);
    const report = await runChecks(root, { only: KIT_CHECKS });
    const restore = 'removed' in r && readConfig(root).catalog?.source === true ? r.removed.filter((id) => kitManifestOf(root, id)) : [];
    const g1 = report.results.find((x) => x.id === 'G1');
    if (restore.length && g1) {
      // Recheck just the catalog portion with these restore copies allowed. Keep other G1 errors unchanged.
      g1.errors = [...g1.errors.filter((e) => e.file !== 'harness/catalog' && !e.file?.startsWith('harness/catalog/')), ...catalogDrift(root, restore).errors];
    }
    const errors = report.results.flatMap((x) => x.errors.map((e: CheckIssue) => ({ ...e, id: x.id })));
    out(`Checks: ${report.results.map((x) => `${x.errors.length ? 'FAIL' : 'pass'} ${x.id}`).join(', ')}`);
    const note = restore.length ? `Kept a catalog restore copy for ${restore.join(', ')}. Full G1 still reports the mismatch.` : null;
    if (note) out(`warning: ${note}`);
    const removedNext = restore.length ? `Run sketchbook kits add ${restore.join(' ')} to restore, or npm run catalog:build to drop the catalog ${restore.length === 1 ? 'copy' : 'copies'}.` : 'sketchbook check';
    if (!errors.length && action === 'add') out('Next: Run npm run storybook and open the kit under Patterns.');
    return { changed: r.changed, errors, warnings: note ? [note] : [], exitCode: errors.length ? 1 : 0, next: action === 'add' ? 'npm run storybook (Patterns/<Kit>), then sketchbook check.' : removedNext, data: r };
  },
} satisfies Command<typeof options>;
