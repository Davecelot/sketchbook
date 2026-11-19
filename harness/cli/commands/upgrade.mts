import { upgrade, loadOwnership } from '../../commands/upgrade.mjs';
import { syncHarness } from '../../commands/bootstrap.mjs';
import { ENGINE } from '../../lib/files.mjs';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseJson } from '../../lib/files.mjs';
import type { HarnessConfigJson } from '../../../generated/types/harness-config.js';
import type { Command, OptionSpecs } from '../types.mjs';

const options = {
  from: { type: 'string', value: 'path|git-url', description: 'A newer Sketchbook: a folder, or a git URL (cloned shallowly; its commit is printed)' },
  yes: { type: 'boolean', description: 'Confirm writing the upstream harness code (required whenever files would change), then run the checks with it' },
} satisfies OptionSpecs;

export default {
  name: 'upgrade',
  group: 'project',
  summary: 'Update harness-owned files. In a project that runs the engine from node_modules: from the installed engine (after npm update), no --from. Elsewhere: from a newer Sketchbook folder or git URL (harness-owned in both manifests); team-owned, shared, reclassified and protected files (the manifest itself, configs, package files) are listed, never touched; writing anything needs --yes (a dry run first shows what).',
  args: [],
  options,
  examples: ['sketchbook upgrade --from ../sketchbook --dry-run', 'sketchbook upgrade --from ../sketchbook --yes', 'sketchbook upgrade --from https://example.com/sketchbook.git --dry-run'],
  mutates: true,
  dryRun: true,
  async run({ root, options, dryRun, out, checks }) {
    // A project that runs the engine from node_modules (no harness/ of its own): npm update brings the engine; upgrade
    // then refreshes the project's copies of the other harness-owned files from it and records the version.
    if (!options.from && !existsSync(join(root, 'harness'))) {
      const r = syncHarness(root, { all: true, dryRun });
      const version = loadOwnership(ENGINE).version;
      const configPath = join(root, 'harness.config.json');
      const config = parseJson<HarnessConfigJson>(readFileSync(configPath, 'utf8'));
      const before = config.harnessVersion ?? null;
      if (!dryRun) { config.harnessVersion = version; writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n'); }
      out(`Harness ${before ?? 'unrecorded'} -> ${version} (the installed engine${dryRun ? '; dry run: nothing written' : ''})`);
      if (r.added.length) out(`${dryRun ? 'Would add' : 'Added'} (${r.added.length}):\n  ${r.added.join('\n  ')}`);
      if (r.updated.length) out(`${dryRun ? 'Would update' : 'Updated'} (${r.updated.length}):\n  ${r.updated.join('\n  ')}`);
      const { hooks } = r;
      if (hooks.length) out(`${dryRun ? 'Would add or update' : 'Added or updated'} ${hooks.length} Sketchbook hook(s) in settings.json (your own hooks and settings are kept):\n  ${hooks.join('\n  ')}`);
      if (r.preserved.length) out(`Existing agent files kept: ${r.preserved.join(', ')}`);
      if (r.skipped.length) out(`Blocked agent setup paths (kept): ${r.skipped.join(', ')}`);
      if (!r.skipped.length && !r.added.length && !r.updated.length && !hooks.length) out('The harness-owned files here already match the installed engine.');
      return { changed: [...r.added, ...r.updated, ...(hooks.length && r.hookSettings ? [r.hookSettings] : []), ...(dryRun ? [] : ['harness.config.json'])], warnings: r.skipped.map((file) => ({ file, msg: 'Existing path blocks agent setup.', fix: 'Review the path and run sketchbook init.' })), data: { version: { before, after: version }, ...r }, next: dryRun ? 'sketchbook upgrade' : 'sketchbook check' };
    }
    if (!options.from) throw Object.assign(new Error('Usage: sketchbook upgrade --from <path|git-url> [--dry-run] [--yes]'), { fix: 'Point --from at a newer Sketchbook (this project has its own harness/).' });
    const r = upgrade(root, options.from, { dryRun, yes: options.yes });
    const section = (title: string, list: string[]) => { if (list.length) out(`${title} (${list.length}):\n  ${list.join('\n  ')}`); };
    out(`Harness ${r.version.before ?? 'unrecorded'} -> ${r.version.after}${r.commit ? ` (commit ${r.commit})` : ''}${dryRun ? ' (dry run: nothing written)' : ''}`);
    section(dryRun ? 'Would update (harness-owned)' : 'Updated (harness-owned)', r.update);
    section(dryRun ? 'Would add (harness-owned)' : 'Added (harness-owned)', r.add);
    section('Gone upstream, kept here (harness-owned; delete if unused)', r.removedUpstream);
    section('Team-owned files that differ from upstream (not touched)', r.teamDiffers);
    section('Shared files that differ (not touched; merge by hand, e.g. package.json)', r.sharedDiffers);
    section('Shared files only upstream (not copied)', r.upstreamOnly);
    section('Ownership differs between the two manifests: shared — merge by hand (not touched)', r.reclassified);
    section('Protected (never written by an upgrade: the ownership manifest, team configs, package files, spec/src/brands/tests, agent settings) — review by hand', r.protected);
    const globs = Object.entries(r.manifest).flatMap(([k, d]) => [...d.added.map((g) => `${k} + ${g}`), ...d.removed.map((g) => `${k} - ${g}`)]);
    section('Upstream harness/manifest.json differs (not applied; merge by hand what you agree with)', globs);
    const data = { version: r.version, commit: r.commit, update: r.update, add: r.add, removedUpstream: r.removedUpstream, teamDiffers: r.teamDiffers, sharedDiffers: r.sharedDiffers, upstreamOnly: r.upstreamOnly, reclassified: r.reclassified, protected: r.protected, manifest: r.manifest };
    if (dryRun) return { changed: [...r.update, ...r.add], data, next: `sketchbook upgrade --from ${options.from}${r.update.length + r.add.length ? ' --yes' : ''}` };
    const next = r.sharedDiffers.includes('package.json') ? 'Merge package.json by hand, npm install, then npm run check.' : 'npm run check, then npm run test:harness';
    // The checks are the code just written: they run only when the upstream was confirmed with --yes.
    if (!options.yes) {
      out('Checks not run: they are the harness code just written. Review the diff (git diff harness/), then npm run check.');
      return { changed: [...r.update, ...r.add, 'harness.config.json'], data, next };
    }
    out('Checks:');
    const c = await checks();
    return { changed: [...r.update, ...r.add, 'harness.config.json'], errors: c.errors, warnings: c.warnings, exitCode: c.exitCode === 1 ? 1 : 0, data, next };
  },
} satisfies Command<typeof options>;
