import { applyHarnessPlan, CATALOG_CLIENTS, catalogAvailability, harnessCatalog, harnessPlan, harnessPlanId } from '../../lib/agent-catalog.mjs';
import { catalogList, catalogRows } from '../harness-view.mjs';
import type { Command, OptionSpecs } from '../types.mjs';

const options = {
  agent: { type: 'string', value: 'client', description: `Show discovery and activation guidance for ${CATALOG_CLIENTS.join(', ')} (default: generic)` },
} satisfies OptionSpecs;

export default {
  name: 'harness',
  group: 'project',
  summary: 'Find and install agent skills, rules, and named workflows.',
  subcommands: [
    { name: 'list', usage: 'sketchbook harness list [--details]', summary: 'Find item IDs. Use `--details` to include integration references.', mutates: false, examples: [] },
    { name: 'show', usage: 'sketchbook harness show <item>', summary: 'See the item’s files, dependencies, and setup steps for your client.', mutates: false, examples: [] },
    { name: 'add', usage: 'sketchbook harness add <item...> [--dry-run]', summary: 'Install the items you select and their dependencies without activating hooks. Preview new files, updates, and conflicts with `--dry-run`.', mutates: true, examples: [] },
  ],
  args: [
    { name: 'action', required: false, description: '`list` (default outside the interactive picker), `show`, or `add`' },
    { name: 'item', required: false, variadic: true, description: 'An ID from `sketchbook harness list`, such as `recommended`, `hammock`, or `rule:contract-first`' },
  ],
  options,
  project: false,
  mutates: true,
  dryRun: true,
  examples: ['sketchbook harness list', 'sketchbook harness show hammock --agent opencode', 'sketchbook harness add hammock --agent opencode --dry-run'],
  run({ root, args, options, dryRun, out, details, expectedHarnessPlan }) {
    const [action = 'list', ...ids] = args;
    const client = CATALOG_CLIENTS.find((id) => id === (options.agent ?? 'generic'));
    if (!client) throw new Error(`Unknown harness client "${options.agent}". Choose from ${CATALOG_CLIENTS.join(', ')}.`);
    if (!['list', 'show', 'add'].includes(action) || (action === 'list' && ids.length) || (action === 'show' && ids.length !== 1) || (action === 'add' && !ids.length)) {
      throw new Error('Use sketchbook harness list, show <item>, or add <item...>.');
    }
    const describe = (entry: ReturnType<typeof harnessCatalog>[number]) => ({
      id: entry.id,
      kind: entry.kind,
      summary: entry.summary,
      members: entry.members,
      availability: catalogAvailability(entry, client),
      ...(entry.partOf ? { partOf: entry.partOf } : {}),
    });
    if (action === 'list') {
      const catalog = harnessCatalog();
      const entries = catalog.map(describe);
      out('Harness catalog');
      for (const line of catalogList(catalogRows(catalog), { details: Boolean(details), width: process.stdout.columns || 80 })) out(line);
      return { data: { client, entries }, next: 'sketchbook harness show <item>' };
    }
    const plan = harnessPlan(root, ids, { show: action === 'show' });
    const entries = plan.requested.map(describe);
    const files = plan.items.map(({ path, state }) => ({ path, state }));
    const skills = plan.entries.some((entry) => entry.kind === 'skill');
    const guidance = plan.entries.some((entry) => entry.kind === 'agent' || entry.kind === 'rule' || entry.kind === 'command');
    const reference = entries.some((entry) => entry.availability === 'reference only');
    const activation = [
      ...(skills ? [plan.entries.some((entry) => catalogAvailability(entry, client) === 'shared discovery')
        ? 'Open the target project as your client workspace and confirm skill discovery in the client.'
        : 'Read the installed SKILL.md directly if your client does not discover .agents/skills/.'] : []),
      ...(reference ? ['Integration references: copy for reference—not activated.'] : []),
      ...(guidance ? ['Read installed rules, commands and briefs as instructions; installing them grants no tool permissions or delegation.'] : []),
      ...(plan.entries.some(({ id }) => id === 'hammock') ? ['Hammock includes .sketchbook/hammock.json. The default inherits existing preferences; existing project settings are kept. The optional audit requires Bash and Git.'] : []),
      ...(plan.entries.some(({ id }) => id === 'review-rangers') ? ['An independent verdict requires separate reviewers and permission to delegate.'] : []),
      ...(client === 'claude' ? ['For the full Claude Code integration, use the Claude profile and review its staged activation instructions.'] : []),
    ];
    const dependencies = plan.entries.filter(({ id }) => !ids.includes(id)).map(({ id }) => id);
    if (action === 'show') {
      for (const { title, id, summary, partOf } of catalogRows(plan.requested)) {
        out(`${title} (${id})`);
        out(`  ${entries.find((entry) => entry.id === id)?.summary ?? summary}`);
        if (partOf) out(`  Included in ${partOf}; not installed separately.`);
      }
    } else {
      out(`Destination: ${root}`);
      out(`Selected: ${entries.map(({ id }) => id).join(', ')}`);
    }
    if (dependencies.length) out(`Dependencies: ${dependencies.join(', ')}`);
    for (const [states, label] of [
      [['missing'], dryRun || action === 'show' ? 'Files to add' : 'New files'],
      [['update'], 'Known earlier copies to refresh'],
      [['conflict', 'blocked'], 'Conflicts'],
    ] as const) {
      const group = files.filter(({ state }) => states.some((known) => known === state));
      if (group.length) { out(`${label} (${group.length}):`); for (const { path } of group) out(`  ${path}`); }
    }
    const present = files.filter(({ state }) => state === 'present');
    if (present.length) {
      out(`Already installed: ${present.length} matching ${present.length === 1 ? 'file' : 'files'}.`);
      if (details || action === 'show') for (const { path } of present) out(`  ${path}`);
    }
    const preserved = files.filter(({ state }) => state === 'preserved');
    if (preserved.length) {
      out('Project settings kept:');
      for (const { path } of preserved) out(`  ${path}`);
    }
    if (!dryRun || details || action === 'show') {
      for (const note of activation) out(note);
    } else if (reference) out('Integration references: copy for reference—not activated.');
    if (action === 'add') out('No hook registrations, permissions, or user configuration will be changed.');
    const configurationChanges = files.filter(({ path, state }) => path === '.sketchbook/hammock.json' && (state === 'missing' || state === 'update')).map(({ path }) => path);
    const planId = harnessPlanId(plan);
    const data = { client, entries, dependencies, files, activation, configurationChanges, planId };
    if (action === 'show') return { data, next: `sketchbook harness add ${plan.requested.map((entry) => entry.partOf ?? entry.id).join(' ')} --agent ${client} --dry-run` };
    if (!dryRun && expectedHarnessPlan !== undefined && expectedHarnessPlan !== planId) return {
      data: { ...data, planChanged: true },
      errors: [{ msg: 'The install plan changed. Nothing was written.', fix: 'Review the new preview before installing.' }],
    };
    const errors = files.filter(({ state }) => state === 'blocked' || state === 'conflict').map(({ path }) => ({
      file: path, msg: 'Existing project path conflicts with the catalog. Nothing was installed.', fix: 'Keep the existing file or review and resolve the conflict before retrying.',
    }));
    if (errors.length) return { data, errors };
    const outcome = dryRun
      ? { changed: files.filter(({ state }) => state === 'missing' || state === 'update').map(({ path }) => path), errors: [], warnings: [] }
      : applyHarnessPlan(root, plan);
    for (const warning of outcome.warnings) out(`Warning: ${warning}`);
    if (outcome.errors.length) return { ...outcome, data };
    const { changed } = outcome;
    out(`${dryRun ? 'Would write' : 'Wrote'} ${changed.length} ${changed.length === 1 ? 'file' : 'files'}.`);
    return { ...outcome, data };
  },
} satisfies Command<typeof options>;
