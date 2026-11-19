import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { catalogIndex, installedComponents, customized, kitIndex, kitInstalled } from '../../commands/catalog.mjs';
import { listBrands } from '../../commands/brand.mjs';
import { listOverrides } from '../../generators/overrides.mjs';
import { runChecks } from '../../checks/run.mjs';
import { readJsonSync, harnessPath, parseJson } from '../../lib/files.mjs';
import type { HarnessConfigJson } from '../../../generated/types/harness-config.js';
import { alwaysOnContext } from '../../lib/claude-layer.mjs';
import { expectedAgentFiles } from '../../commands/bootstrap.mjs';
import { agentFileState, hasClaudeLayer, selectedAgentProfiles, STAGED } from '../../lib/agent-config.mjs';
import { codexSubdirectoryAdapterMatches, codexSubdirectoryLauncher, copilotRepositoryHookLocation, instructionReferences, nativeHookStatus } from '../../lib/agent-diagnostics.mjs';
import { designState } from './status.mjs';
import type { Command } from '../types.mjs';

export default {
  name: 'doctor',
  group: 'project',
  summary: 'See what needs attention in your project. Review checks, installed files, agent profiles, and design sync. Uses the same exit codes as sketchbook check.',
  args: [],
  options: {},
  examples: ['sketchbook doctor', 'sketchbook doctor --json'],
  mutates: false,
  dryRun: false,
  async run({ root, out }) {
    const config = parseJson<HarnessConfigJson>(await readFile(join(root, 'harness.config.json'), 'utf8'));
    const index = catalogIndex(root);
    const installed = installedComponents(root);
    const report = await runChecks(root);
    const kits = kitIndex(root);
    const brands = listBrands(root);
    const profiles = selectedAgentProfiles(root);
    const expected = expectedAgentFiles(root, profiles);
    const nativeProfiles = (['codex', 'gemini', 'copilot'] as const).filter((profile) => profiles.includes(profile));
    const hookStatus = nativeProfiles.length ? nativeHookStatus(root) : null;
    const claude = !profiles.includes('claude') ? 'not-selected'
      : hasClaudeLayer(root, STAGED) ? 'staged'
        : hasClaudeLayer(root, '.claude') ? 'installed' : 'missing';
    const claudeBase = claude === 'staged' ? STAGED : '.claude';
    const data = {
      starter: config.starter ?? null,
      harnessVersion: config.harnessVersion ?? null,
      harnessAvailable: readJsonSync<{ version?: string }>(harnessPath(root, 'manifest.json'))?.version ?? null,
      catalogSource: config.catalog?.source === true,
      components: {
        installed,
        available: index.components.filter((n) => !installed.includes(n)),
        customized: customized(root),
        teamMade: installed.filter((n) => !index.components.includes(n)),
      },
      kits: { installed: kits.filter((k) => kitInstalled(root, k)).map((k) => k.id), available: kits.filter((k) => !kitInstalled(root, k)).map((k) => k.id) },
      brands: { list: brands.map((b) => b.name), active: brands.find((b) => b.active)?.name ?? null },
      overrides: (await listOverrides(root)).length,
      design: await designState(root, config),
      checks: { exitCode: report.exitCode, failing: report.results.filter((r) => r.errors.length).map((r) => r.id), warnings: report.results.reduce((n, r) => n + r.warnings.length, 0) },
      agentProfiles: profiles,
      // File presence is not proof that a particular client loaded or followed its instructions.
      agentInstructions: Object.fromEntries([...expected].map((file) => [file, agentFileState(root, file) === 'file'])),
      agentInstructionReferences: instructionReferences(root, expected),
      nativeHooks: Object.fromEntries(nativeProfiles.map((profile) => [profile, hookStatus?.[profile]])),
      codexSubdirectoryLauncher: profiles.includes('codex') ? codexSubdirectoryLauncher(root) : null,
      codexSubdirectoryAdapterMatches: profiles.includes('codex') ? codexSubdirectoryAdapterMatches(root) : null,
      copilotRepositoryHookLocation: profiles.includes('copilot') ? copilotRepositoryHookLocation(root) : null,
      claude,
      contextBudget: (claude === 'staged' || claude === 'installed') && config.contextBudget?.alwaysOnBytes
        ? { bytes: alwaysOnContext(root, claudeBase).total, budget: config.contextBudget.alwaysOnBytes } : null,
      // Active only when git points at .githooks and the hook can run: git silently skips a non-executable one.
      gitHook: spawnSync('git', ['-C', root, 'config', 'core.hooksPath'], { encoding: 'utf8' }).stdout.trim().match(/(^|\/)\.githooks\/?$/) && existsSync(join(root, '.githooks/pre-commit')) && statSync(join(root, '.githooks/pre-commit')).mode & 0o111 ? 'active' : 'inactive',
    };
    const c = data.components;
    out(`Checks: ${data.checks.failing.length ? `failed ${data.checks.failing.join(', ')}` : data.checks.exitCode === 2 ? 'passed with overrides' : 'passed'}${data.checks.warnings ? `, ${data.checks.warnings} warnings` : ''}.`);
    out(`Starter: ${data.starter ?? 'not recorded (sketchbook init --start <starter>)'}`);
    out(`Harness: ${data.harnessVersion ?? 'unrecorded'} (files here: ${data.harnessAvailable ?? 'no harness/manifest.json'})${data.catalogSource ? '; this repo is the catalog source' : ''}`);
    out(`Components: ${c.installed.length} installed, ${c.available.length} more in the catalog, ${c.customized.length} customized${c.customized.length ? ` (${c.customized.join(', ')})` : ''}, ${c.teamMade.length} team-made`);
    out(`Kits: ${data.kits.installed.length} installed, ${data.kits.available.length} available`);
    out(`Brands: ${data.brands.list.length ? `${data.brands.list.join(', ')} (active ${data.brands.active ?? 'none of them'})` : 'single brand'}`);
    out(`Overrides: ${data.overrides}`);
    out(`Design: ${data.design.tool ?? 'none'}${data.design.tool ? `, tokens ${data.design.tokens}, ${data.design.components.stale.length} stale component(s)` : ''}`);
    const missingInstructions = Object.entries(data.agentInstructions).filter(([, present]) => !present).map(([file]) => file);
    if (!profiles.length) out('Agent integrations: core only.');
    else out(`Agent setup (${profiles.join(', ')}): ${missingInstructions.length ? `missing ${missingInstructions.join(', ')} (sketchbook init can restore missing setup files when paths are available)` : 'all selected files present'}; confirm what your client loaded before relying on these files`);
    const reviewInstructions = Object.entries(data.agentInstructionReferences).filter(([, status]) => status === 'not-detected').map(([file]) => file);
    if (reviewInstructions.length) out(`Agent instruction references not detected: ${reviewInstructions.join(', ')}. Review preserved team instructions for the shared workflow; a textual check cannot determine whether equivalent guidance is present or loaded.`);
    const scriptState = (present: boolean, matches: boolean | null) => !present ? 'not found' : matches === false ? 'present, differs from current template' : 'present';
    for (const [profile, hook] of Object.entries(data.nativeHooks)) {
      if (!hook) continue;
      const engine = 'enginePresent' in hook ? `, engine ${hook.enginePresent ? 'present' : 'not found'}` : '';
      out(`Native edit hooks (${profile}): ${hook.registration} (script ${scriptState(hook.scriptPresent, hook.scriptMatchesTemplate)}${engine}). Verify activation and trust in the client.`);
    }
    if (data.nativeHooks.codex?.registration === 'registered' && data.codexSubdirectoryLauncher === false) out('Codex subdirectory launcher: not recognized. Existing hook settings are preserved; review the current template before merging any update.');
    if (data.codexSubdirectoryLauncher === true && data.codexSubdirectoryAdapterMatches === false) out('Codex subdirectory launcher: the adapter differs from the shipped version beyond line endings, so this launcher will skip it. Review your customization and use the project root until an appropriate hook is configured and trusted.');
    if (data.copilotRepositoryHookLocation === 'nested') out('Copilot repository hook: this project is nested, so its .github/hooks/ is not at the Git repository root. Copilot hook discovery varies by client and workspace: verify the local hook, and review root configuration for cloud or repository-root sessions.');
    else if (data.copilotRepositoryHookLocation === 'unknown') out('Copilot repository hook: Git repository root could not be determined; verify hook discovery in your workspace.');
    if (Object.values(data.nativeHooks).some((hook) => hook?.scriptMatchesTemplate === false)) out('Review differing adapter scripts against the installed templates and merge any changes deliberately; project files are not overwritten.');
    if (data.claude !== 'not-selected') out(`Claude layer: ${data.claude === 'staged' ? 'staged in move-to-.claude/ (optional Claude Code setup: move-to-.claude/INSTALL.md)' : data.claude === 'missing' ? 'missing (sketchbook init puts it back)' : data.claude}${data.contextBudget && data.claude !== 'missing' ? `, always-on context ${data.contextBudget.bytes} of ${data.contextBudget.budget} bytes (${Math.round((data.contextBudget.bytes / data.contextBudget.budget) * 100)}%)` : ''}`);
    out(`Commit gate: ${data.gitHook === 'active' ? 'active (npm run check runs before every commit)' : 'inactive (git config core.hooksPath .githooks at the repository root, or call npm run check from your own hook)'}`);
    const next = data.checks.failing.length ? 'Run sketchbook check to see the suggested fix for each failure.'
      : missingInstructions.length ? 'sketchbook init (restores missing setup files when paths are available)'
        : data.claude === 'staged' ? 'For Claude Code, optionally install the layer from move-to-.claude/ (move-to-.claude/INSTALL.md)'
        : data.claude === 'missing' ? 'sketchbook init (restores what is missing)'
          : !data.starter ? 'Run sketchbook help init --details to review the starter options.' : null;
    if (next) out(`\nNext: ${next}`);
    return { data, next, exitCode: report.exitCode };
  },
} satisfies Command;
