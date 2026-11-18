import { removeComponents, kebab } from '../../commands/catalog.mjs';
import { componentChecks } from './add.mjs';
import type { AtRisk } from '../../commands/catalog.mjs';
import type { Command, OptionSpecs } from '../types.mjs';

const options = { yes: { type: 'boolean', description: 'Confirm removing a component the catalog cannot bring back as it is (team-made or customized)' } } satisfies OptionSpecs;

const why = (r: AtRisk): string => (r.reason === 'team-made' ? 'made by the team, not in the catalog: git is the only way back' : 'customized: sketchbook add brings back the catalog version, not your edits');

export default {
  name: 'remove',
  group: 'components',
  summary: 'Uninstall a component: refuses while another component or a kit needs it, and without --yes when it is team-made or customized; else removes its files, sets the registry to planned and rebuilds.',
  args: [{ name: 'Component Name', required: true, variadic: true, description: 'Installed component (button, "Button Group")' }],
  options,
  examples: ['sketchbook remove badge', 'sketchbook remove spinner --dry-run', 'sketchbook remove my-widget --yes'],
  mutates: true,
  dryRun: true,
  async run({ root, args, options, dryRun, out }) {
    const name = kebab(args.join(' '));
    const r = await removeComponents(root, [name], { dryRun, yes: options.yes });
    const risk = r.atRisk.find((x) => x.name === name);
    if (dryRun) {
      out(`Would remove ${name}:\n  ${r.changed.join('\n  ')}`);
      if (risk) out(`Needs --yes: ${name} is ${why(risk)}.`);
      return { changed: r.changed, data: { removed: [name], atRisk: r.atRisk } };
    }
    out(`Removed ${name} (${r.changed.length - 1} file(s)); registry -> planned; tokens, styles and barrel rebuilt.`);
    const c = await componentChecks(root);
    out(`Checks: ${c.summary}`);
    const next = !risk ? `sketchbook add ${name} brings it back from the catalog.`
      : risk.reason === 'team-made' ? `${name} was not in the catalog: git is the only way back (git checkout -- the removed files).`
        : `sketchbook add ${name} brings back the catalog version; your edits are only in git.`;
    return { changed: r.changed, errors: c.errors, warnings: c.warnings, exitCode: c.exitCode, next, data: { removed: [name], atRisk: r.atRisk } };
  },
} satisfies Command<typeof options>;
