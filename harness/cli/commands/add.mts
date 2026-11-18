import { add as scaffold } from '../../commands/add.mjs';
import { kebab, catalogIndex, installComponents, resolveOrder, installedComponents } from '../../commands/catalog.mjs';
import { runChecks } from '../../checks/run.mjs';
import type { CheckIssue } from '../../checks/types.mjs';
import type { Command, OptionSpecs } from '../types.mjs';

// The checks that cover a component (SB-0045): contracts, contract tokens, parity, prefix, registry, aliases, usage.
export const COMPONENT_CHECKS = ['C1', 'C2', 'C3', 'P1', 'R1', 'T2', 'T4'];

export async function componentChecks(root: string) {
  const report = await runChecks(root, { only: COMPONENT_CHECKS });
  const flat = (k: 'errors' | 'warnings') => report.results.flatMap((r) => r[k].map((e: CheckIssue) => ({ ...e, id: r.id })));
  return { exitCode: report.ok ? 0 : 1, errors: flat('errors'), warnings: flat('warnings'), summary: report.results.map((r) => `${r.errors.length ? 'FAIL' : 'pass'} ${r.id}`).join(', ') };
}

const options = { blank: { type: 'boolean', description: 'Scaffold an empty contract instead of installing from the catalog' } } satisfies OptionSpecs;

export default {
  name: 'add',
  group: 'components',
  summary: 'Install a component from the catalog (contract, code, stories, specs; dependencies first), or --blank to scaffold a new contract (status draft, proposed decision).',
  args: [{ name: 'Component Name', required: true, variadic: true, description: 'Catalog name (button, "Button Group") or a registry entry for --blank' }],
  options,
  examples: ['sketchbook add button', 'sketchbook add Button Group --dry-run', 'sketchbook add Date Picker --blank'],
  mutates: true,
  dryRun: true,
  async run({ root, args, options, dryRun, out }) {
    const display = args.join(' ');
    const name = kebab(display);
    if (!options.blank && catalogIndex(root).components.includes(name)) {
      const order = resolveOrder(root, [name]);
      const present = installedComponents(root);
      const r = await installComponents(root, [name], { dryRun });
      if (!r.installed.length) { out(`${name} is already installed (spec/components/${name}/). Nothing to do.`); return { data: { installed: [], already: r.already, order } }; }
      if (dryRun) { out(`Would install ${r.installed.join(', ')} from the catalog (order: ${order.filter((n) => !present.includes(n)).join(' -> ')}), writing:\n  ${r.changed.join('\n  ')}`); return { changed: r.changed, data: { installed: r.installed, order } }; }
      out(`Installed from the catalog: ${r.installed.join(', ')} (${r.changed.length} file(s)); registry, tokens, styles and barrel rebuilt.`);
      const c = await componentChecks(root);
      out(`Checks: ${c.summary}`);
      return {
        changed: [...r.changed, 'generated/css/tokens.css', 'src/index.ts'], errors: c.errors, warnings: c.warnings, exitCode: c.exitCode,
        next: c.exitCode ? 'Fix the failing checks, then sketchbook check.' : `npm run storybook (Components/${r.installed.at(-1)}), then sketchbook check.`,
        data: { installed: r.installed, already: r.already, order },
      };
    }
    const r = await scaffold(root, display, { dryRun });
    const next = 'Draft the contract with the contract-author skill, then npm run check, then fill plan.md and stop for approval.';
    if (dryRun) out(`Would scaffold spec/components/${r.name}/ (${r.tag}) and write:\n  ${r.files.join('\n  ')}`);
    else out(`Scaffolded spec/components/${r.name}/ (${r.tag}); registry status -> draft; proposed decision ${r.decision}.\nNext: ${next}`);
    return { changed: r.files, next, data: { name: r.name, component: r.component, tag: r.tag, decision: r.decision, scaffold: true } };
  },
} satisfies Command<typeof options>;
