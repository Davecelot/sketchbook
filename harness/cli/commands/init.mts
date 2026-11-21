import { init, INIT_OPTIONS } from '../../commands/init.mjs';
import { staleLinks } from '../../commands/tokens.mjs';
import { applyStarter, listStarters, planStarter, preflightStarter, refuseStaleLinks } from '../../commands/start.mjs';
import { installAgents, bootstrap, EXTRAS, isProject, repair, STAGED } from '../../commands/bootstrap.mjs';
import { AGENT_PROFILES, parseAgentProfiles } from '../../lib/agent-config.mjs';
import { installedSummary } from '../../lib/installed.mjs';
import { join, resolve } from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { show } from '../../lib/files.mjs';
import { changedFiles, conflicts, copyBack, snapshot } from '../../lib/stage.mjs';
import { formatHuman, runChecks } from '../../checks/run.mjs';
import type { BrandConfig } from '../../../generated/types/brand-config.js';
import type { Command, CommandResult, IssueLike, OptionSpecs } from '../types.mjs';

const START_OPTIONS = {
  start: { type: 'string', value: 'starter', description: 'Starting point: blank | foundations | library (default) | library+kits | pick | import | from-codebase (harness/starters)' },
  components: { type: 'string', value: 'a,b', description: 'With --start: the components to have (pick needs it; all | none also work); dependencies come along' },
  from: { type: 'string', value: 'file', description: 'With --start import: the tokens file; with --start from-codebase: the CSS path or glob to audit' },
  yes: { type: 'boolean', description: 'Confirm what would lose work: with --start, removing components or kits the starter does not include; with brand options or a starter that patches foundations, letting the brand links overwrite hand-edited linked tokens. It never detaches the catalog' },
  dir: { type: 'string', value: 'folder', description: 'Create the project in this folder (new or empty), e.g. a design-system folder inside an existing repository; default: here' },
  adopt: { type: 'boolean', description: 'In an existing project: add the design system in its own folder (design-system/, or --dir) without changing your files; your package.json gets one script that runs its checks' },
  engine: { type: 'string', value: 'spec', description: 'For new projects, override the engine dependency with an npm version or tag, a local tarball, or a Git URL. A published CLI uses its version range by default. Relative local paths are resolved from the directory where init starts' },
  'no-install': { type: 'boolean', description: 'New project only: skip npm install and the Chromium download (init lists them as next steps)' },
  agent: { type: 'string', value: 'profiles', description: `Install selected agent profiles (comma-separated): ${AGENT_PROFILES.join(', ')}. New projects default to core only` },
  with: { type: 'string', value: 'groups', description: `Select the Claude profile and add optional groups (comma-separated): ${EXTRAS.join(', ')}. Forge adds the forge-me-a-skill skill` },
  'detach-catalog': { type: 'boolean', description: 'With --start in the catalog source repo (catalog.source true): stop tracking harness/catalog; the components become the team\'s own' },
} satisfies OptionSpecs;

const options = { ...Object.fromEntries(Object.entries(INIT_OPTIONS).map(([k, description]) => [k, { type: 'string' as const, description }])), ...START_OPTIONS };

// A string radius or density (the v1 shape) has no .style or .preset: as before, the label falls back.
const radiusOf = (radius: BrandConfig['radius']) => (radius && typeof radius === 'object' ? radius.style ?? radius.preset : undefined);
const densityOf = (density: BrandConfig['density']) => (density && typeof density === 'object' ? density.preset ?? density : density);

// Starter, prefix and brand inputs/outputs, plus the files the staged checks inspect.
const STARTER_PATHS = ['src', 'spec', 'playwright', '.storybook', 'docs', 'README.md', 'CLAUDE.md', '.claude', '.agents', 'move-to-.claude', 'brands', 'brand.config.json', 'harness.config.json', 'generated', 'harness', 'scripts', 'package.json', 'AGENTS.md'];

export default {
  name: 'init',
  group: 'project',
  summary: 'Set up a design system from a starter, or update the setup in an existing project. Choose --agent to add guidance for your coding tools.',
  args: [],
  options,
  examples: ['sketchbook init', 'sketchbook init --agent claude', 'sketchbook init --agent codex,trae --dry-run', 'sketchbook init --dir design-system --start library', 'sketchbook init --start library', 'sketchbook init --with forge', 'sketchbook init --start blank --yes', 'sketchbook init --start pick --components card,button', 'sketchbook init --start from-codebase --from "../app/**/*.css"', 'sketchbook init --primary "#2563EB" --font Inter --radius round', 'sketchbook init --density compact --dry-run'],
  mutates: true,
  project: false,
  dryRun: true,
  async run({ root, options, dryRun, out, checks, json }) {
    // Every INIT_OPTIONS option is a string option, so typeof only narrows.
    const opts = Object.fromEntries(Object.entries(options).flatMap(([k, v]) => (k in INIT_OPTIONS && typeof v === 'string' ? [[k, v]] : [])));
    const start = options.start;
    const profiles = parseAgentProfiles(options.agent);
    const extras = options.with?.split(',').map((group) => group.trim()).filter(Boolean) ?? [];
    const target = resolve(root, options.dir ?? (options.adopt ? 'design-system' : '.'));
    if (!isProject(target)) {
      const r = await bootstrap(root, { dir: options.dir, adopt: options.adopt, engine: options.engine, extras, profiles, start: start ?? 'library', components: options.components, from: options.from, opts, dryRun, install: !options['no-install'], json, out });
      for (const l of r.lines ?? []) out(l);
      if (r.exitCode === 1) return r;
      // Past the exitCode 1 return, data is the install summary; `in` only narrows the inferred union.
      if (!dryRun && 'target' in r.data) { out(`\nCreated your design system in ${r.data.target}. See docs/harness.md in that folder for the installation details.`); for (const l of installedSummary(r.data.installed)) out(l); }
      for (const w of r.warnings ?? []) out(`warning: ${w.msg}${w.fix ? `\n  fix: ${w.fix}` : ''}`);
      if (r.claudeStep) out(`\nOptional setup for Claude Code: the Claude layer (skills, commands, rules, hooks) is staged in ${STAGED}/.\n  ${r.claudeStep.charAt(0).toUpperCase()}${r.claudeStep.slice(1)}.\n  Claude Code asks for approval to write into .claude/.`);
      if (r.next) out(`Next: ${r.next}`);
      return r;
    }
    if (options.dir && target !== resolve(root)) throw Object.assign(new Error(`${options.dir} is already a Sketchbook project.`), { fix: `cd ${options.dir}, then run sketchbook init again.` });
    for (const k of ['no-install', 'adopt', 'engine'] as const) if (options[k] !== undefined) throw Object.assign(new Error(`--${k} goes with a new project (a folder without harness.config.json).`), { fix: `Drop --${k}.` });
    const agentInstall = options.agent !== undefined || options.with !== undefined;
    const projectChange = Object.keys(opts).length || start || options.components || options.from || options.yes || options['detach-catalog'];
    if (agentInstall && projectChange) throw Object.assign(new Error('Apply integration and starter or brand options in separate commands in an existing project.'), { fix: 'Run sketchbook init --agent <profiles> separately.' });
    if (!projectChange) {
      const r = agentInstall ? installAgents(root, profiles, extras, { dryRun }) : { ...repair(root, { dryRun }), configChanged: false };
      if ('profiles' in r) out(`Agent profiles: ${r.profiles.join(', ') || 'none'}`);
      if (r.configChanged) out(`${dryRun ? 'Would record' : 'Recorded'} the selection in harness.config.json.`);
      if (r.added.length) out(`${dryRun ? 'Would restore' : 'Restored'} ${r.added.length} missing file(s):\n  ${r.added.join('\n  ')}`);
      else if (!r.skipped.length) out('All expected setup files are present.');
      const { hooks } = r;
      if (hooks.length) out(`${dryRun ? 'Would add or update' : 'Added or updated'} ${hooks.length} Sketchbook hook(s) in settings.json (your own hooks and settings are kept):\n  ${hooks.join('\n  ')}`);
      if (r.edited.length) out(`Harness-owned files that differ from the installed engine (kept; sketchbook upgrade replaces them):\n  ${r.edited.join('\n  ')}`);
      if (r.preserved.length) out(`Existing agent files kept: ${r.preserved.join(', ')}`);
      if (r.skipped.length) out(`Could not restore agent instructions without touching existing paths: ${r.skipped.join(', ')}. Resolve the path conflict and run sketchbook init again.`);
      const git = 'git' in r ? r.git : undefined;
      if (git?.line) out(git.line);
      if (git?.warning) out(`warning: ${git.warning.msg}\n  fix: ${git.warning.fix}`);
      out('To change the starting point or the brand: sketchbook init --start <starter> and/or --primary, --font, … (sketchbook help init).');
      return { changed: [...r.added, ...(r.configChanged ? ['harness.config.json'] : []), ...(hooks.length && r.hookSettings ? [r.hookSettings] : [])], warnings: [...(git?.warning ? [git.warning] : []), ...r.skipped.map((file) => ({ file, msg: 'Agent instructions were not restored because an existing path blocks them.', fix: 'Resolve the path conflict and run sketchbook init again.' }))], data: { repair: r, starters: listStarters(root).map((s) => s?.id) }, next: agentInstall ? 'sketchbook doctor' : r.edited.length ? 'sketchbook upgrade --dry-run' : 'sketchbook check' };
    }
    if (!start && (options.components || options.from || options['detach-catalog'])) throw Object.assign(new Error('--components, --from and --detach-catalog go with --start <starter>.'), { fix: 'sketchbook init --start pick --components card,button' });
    if (!start && options.yes && !Object.keys(opts).length) throw Object.assign(new Error('--yes goes with --start <starter> or brand options.'), { fix: 'sketchbook init --start blank --yes' });
    // Every refusal runs before anything is written (SB-0071): removals and hand-edited linked tokens need --yes.
    // A dry run reports them instead (the plan is what it shows).
    const brandChange = Object.keys(opts).length > 0;
    if (!dryRun) {
      if (start) await preflightStarter(root, planStarter(root, start, { components: options.components }), { yes: options.yes, brandChange });
      else if (brandChange) await refuseStaleLinks(root, { yes: options.yes });
    }
    if (dryRun) {
      const changed: string[] = [];
      const data: Record<string, unknown> = {};
      const stale = brandChange || (start && planStarter(root, start, { components: options.components }).starter.foundations) ? await staleLinks(root) : [];
      if (stale.length) { data.staleLinks = stale; out(`${stale.length} hand-edited linked token(s) would be overwritten; the real run needs --yes: ${stale.join('; ')}`); }
      if (Object.keys(opts).length) { const r = await init(root, opts, { dryRun }); changed.push(...r.changed); data.brand = r.brand; }
      if (start) {
        const { plan, catalog } = await applyStarter(root, start, { components: options.components, yes: options.yes, detachCatalog: options['detach-catalog'], dryRun: true });
        data.starter = { id: start, components: plan.components, kits: plan.kits };
        out(`Starter ${start} (${plan.starter.title}): ${plan.starter.for}`);
        out(`  components: install ${plan.components.install.join(', ') || 'none'}; remove ${plan.components.remove.join(', ') || 'none'}${plan.components.kept.length ? `; team-made kept: ${plan.components.kept.join(', ')}` : ''}`);
        out(`  kits: install ${plan.kits.install.join(', ') || 'none'}; remove ${plan.kits.remove.join(', ') || 'none'}`);
        if (plan.components.remove.length || plan.kits.remove.length) out('  Removing needs --yes.');
        if (catalog.line || catalog.warning) out(`  ${catalog.warning ?? catalog.line}`);
        data.catalogSource = catalog.source;
        changed.push(...plan.components.install.map((n) => `+ ${n}`), ...plan.components.remove.map((n) => `- ${n}`), ...plan.kits.install.map((k) => `+ kit ${k}`), ...plan.kits.remove.map((k) => `- kit ${k}`), 'harness.config.json');
      }
      if (changed.length && Object.keys(opts).length) out(`Would change: ${changed.join(', ')}`);
      return { changed, data };
    }
    const apply = async (dir: string, out: (line?: string) => void): Promise<CommandResult> => {
      const changed: string[] = [];
      const warnings: IssueLike[] = [];
      const data: Record<string, unknown> = {};
      let next = 'Review in Storybook (npm run storybook), then sketchbook sync tokens if a design file is connected.';
      if (brandChange) {
        const r = await init(dir, opts);
        const b = r.resolved;
        if (r.renamed) out(`Prefix ${r.renamed.from} -> ${r.renamed.to}: ${r.renamed.replacements} replacement(s) in ${r.renamed.files.length} file(s).`);
        out(`Brand "${r.brand.name}": primary ${b.color.primary}${r.anchors.primary ? ` (anchored at ${r.anchors.primary})` : ''}, radius ${radiusOf(r.brand.radius) ?? 'soft'}, density ${show(densityOf(r.brand.density) ?? 'comfortable')}, font ${r.brand.typography?.family ?? 'ui-sans-serif'}.`);
        if (r.changed.length) out(`Semantic tokens re-pointed:\n  ${r.changed.join('\n  ')}`);
        for (const m of r.missing) out(`Link not applied: ${m.msg}`);
        warnings.push(...r.missing);
        changed.push('brand.config.json', 'harness.config.json', 'spec/tokens/foundation/*', ...r.changed.map((x) => `spec/tokens/semantic/${x.split(':')[0]}.tokens.json`), 'generated/css/tokens.css');
        data.brand = r.brand;
        data.anchors = r.anchors;
      }
      if (start) {
        const r = await applyStarter(dir, start, { components: options.components, from: options.from, inputRoot: root, yes: options.yes, detachCatalog: options['detach-catalog'] });
        if (r.actionExit) return { changed: [], errors: [{ msg: r.lines.join('\n') || `The ${start} step exited ${r.actionExit}.`, fix: r.next[0] }], exitCode: 1 };
        if (r.warning) { out(r.warning); warnings.push({ file: 'harness.config.json', msg: r.warning, fix: 'Set catalog.source back to true if this repo is the catalog source.' }); }
        out(`Starter ${start}: installed ${r.plan.components.install.length} component(s), removed ${r.plan.components.remove.length}; kits installed ${r.plan.kits.install.length}, removed ${r.plan.kits.remove.length}. Components now: ${r.plan.components.target.length}.`);
        for (const l of r.lines) out(l);
        data.starter = { id: start, components: r.plan.components.target, kits: r.plan.kits.target };
        data.catalogSource = r.catalog.source;
        next = r.next.join('; ');
        const report = await runChecks(dir);
        // Propagation includes external outputs and is intentionally separate from applying the starter.
        // G1 still validates local generation; standalone O1 still requires propagation afterward.
        const propagation = report.results.find((check) => check.id === 'O1');
        const pending = Boolean(propagation?.errors.length);
        if (propagation && pending) {
          propagation.warnings.push(...propagation.errors);
          propagation.errors = [];
        }
        const errors = report.results.flatMap((check) => check.errors.map((issue) => ({ ...issue, id: check.id })));
        report.ok = errors.length === 0;
        report.exitCode = !report.ok ? 1 : report.overrides.length ? 2 : 0;
        if (!json) for (const line of formatHuman(report)) out(line);
        return {
          changed, errors, warnings: [...warnings, ...report.results.flatMap((check) => check.warnings.map((issue) => ({ ...issue, id: check.id })))],
          exitCode: report.ok ? 0 : 1, next: !report.ok ? 'Fix the failing checks, then rerun init.' : pending ? `Run sketchbook propagate; ${next}` : next, data,
        };
      }
      out('Checks:');
      const c = await checks();
      return {
        changed, warnings: [...warnings, ...c.warnings], errors: c.errors, exitCode: c.exitCode === 1 ? 1 : 0,
        next: c.exitCode === 1 ? 'Fix the failing checks, then sketchbook check.' : next, data,
      };
    };
    if (!start) return apply(root, out);

    const stage = mkdtempSync(join(tmpdir(), 'sketchbook-starter-'));
    try {
      const before = snapshot(root, STARTER_PATHS, stage);
      const lines: string[] = [];
      // Buffer success messages until the checked changes have been published.
      const result = await apply(stage, (line = '') => { lines.push(line); });
      if (result.exitCode === 1) {
        out('Starter not applied. The project was not changed.');
        return { ...result, changed: [] };
      }
      const after = snapshot(stage, STARTER_PATHS);
      const changed = changedFiles(before, after);
      const edited = conflicts(root, before, changed);
      if (edited.length) throw Object.assign(new Error(`${edited.length} file(s) changed while the starter ran: ${edited.slice(0, 6).join(', ')}. Nothing was written.`), { fix: 'Save your edits, then rerun the starter.' });
      copyBack(root, stage, before, after, changed);
      for (const line of lines) out(line);
      return { ...result, changed };
    } finally {
      rmSync(stage, { recursive: true, force: true });
    }
  },
} satisfies Command<typeof options>;
