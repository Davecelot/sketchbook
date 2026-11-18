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
import { claudeBase } from '../../lib/installed.mjs';
import { designState } from './status.mjs';
import type { Command } from '../types.mjs';

export default {
  name: 'doctor',
  group: 'project',
  summary: 'Health report (read-only): starter, harness version, installed vs catalog components, kits, brands, overrides, design sync, failing checks, the Claude layer (installed or staged) and the commit gate. Exits like check (0 pass, 1 a check fails, 2 pass with overrides).',
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
      // While move-to-.claude/ exists the layer is staged, even next to a .claude/ the team already had.
      claude: existsSync(join(root, 'move-to-.claude')) ? 'staged' : existsSync(join(root, '.claude')) ? 'installed' : 'missing',
      contextBudget: config.contextBudget?.alwaysOnBytes ? { bytes: alwaysOnContext(root, claudeBase(root)).total, budget: config.contextBudget.alwaysOnBytes } : null,
      // Active only when git points at .githooks and the hook can run: git silently skips a non-executable one.
      gitHook: spawnSync('git', ['-C', root, 'config', 'core.hooksPath'], { encoding: 'utf8' }).stdout.trim().match(/(^|\/)\.githooks\/?$/) && existsSync(join(root, '.githooks/pre-commit')) && statSync(join(root, '.githooks/pre-commit')).mode & 0o111 ? 'active' : 'inactive',
    };
    const c = data.components;
    out(`Starter: ${data.starter ?? 'not recorded (sketchbook init --start <starter>)'}`);
    out(`Harness: ${data.harnessVersion ?? 'unrecorded'} (files here: ${data.harnessAvailable ?? 'no harness/manifest.json'})${data.catalogSource ? '; this repo is the catalog source' : ''}`);
    out(`Components: ${c.installed.length} installed, ${c.available.length} more in the catalog, ${c.customized.length} customized${c.customized.length ? ` (${c.customized.join(', ')})` : ''}, ${c.teamMade.length} team-made`);
    out(`Kits: ${data.kits.installed.length} installed, ${data.kits.available.length} available`);
    out(`Brands: ${data.brands.list.length ? `${data.brands.list.join(', ')} (active ${data.brands.active ?? 'none of them'})` : 'single brand'}`);
    out(`Overrides: ${data.overrides}`);
    out(`Design: ${data.design.tool ?? 'none'}${data.design.tool ? `, tokens ${data.design.tokens}, ${data.design.components.stale.length} stale component(s)` : ''}`);
    out(`Checks: ${data.checks.failing.length ? `failing ${data.checks.failing.join(', ')}` : 'all pass'}${data.checks.warnings ? `, ${data.checks.warnings} warning(s)` : ''}`);
    out(`Claude layer: ${data.claude === 'staged' ? 'staged in move-to-.claude/ (not active yet: ask Claude Code to install it, move-to-.claude/INSTALL.md)' : data.claude === 'missing' ? 'missing (sketchbook init puts it back)' : data.claude}${data.contextBudget && data.claude !== 'missing' ? `, always-on context ${data.contextBudget.bytes} of ${data.contextBudget.budget} bytes (${Math.round((data.contextBudget.bytes / data.contextBudget.budget) * 100)}%)` : ''}`);
    out(`Commit gate: ${data.gitHook === 'active' ? 'active (npm run check runs before every commit)' : 'inactive (git config core.hooksPath .githooks at the repository root, or call npm run check from your own hook)'}`);
    const next = data.checks.failing.length ? 'sketchbook check (each error has a fix)'
      : data.claude === 'staged' ? 'Ask Claude Code to install the Claude layer from move-to-.claude/ (move-to-.claude/INSTALL.md)'
        : data.claude === 'missing' ? 'sketchbook init (restores what is missing)'
          : !data.starter ? 'sketchbook init --start <starter>' : null;
    return { data, next, exitCode: report.exitCode };
  },
} satisfies Command;
