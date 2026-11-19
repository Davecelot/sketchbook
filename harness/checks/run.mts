// npm run check  (--maintainer also checks the Storybook and docs site builds)  -> deterministic checks (T1–T7, F1, C1–C3, A1, P1, R1, G1, D1/D2/D3/D4, O1, M1 (maintainer), S1, W1, X1, K1, H1, H2), no AI. Exit 0 = pass, 1 = fail, 2 = pass with flagged overrides.
// --json for agents and CI. --verbose lists every check, not only the ones with findings. --only=T1,T6 to run a subset. --fix rebuilds generated outputs first.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { loadAll } from '../lib/tokens.mjs';
import { loadComponentCss } from '../lib/css.mjs';
import { engineSchema, HARNESS, parseJson, isMain } from '../lib/files.mjs';
import type { BrandConfig } from '../../generated/types/brand-config.js';
import type { HarnessConfigJson } from '../../generated/types/harness-config.js';
import type { ComponentRegistry } from '../../generated/types/registry.js';
import type { OverridesDoc, Overrides } from '../generators/foundation.mjs';
import type { ContrastPair } from '../lib/interface.mjs';
import type { Check, CheckContext, CheckOutcome, Report } from './types.mjs';
import * as t1 from './t1-tokens-valid.mjs';
import * as t2 from './t2-aliases.mjs';
import * as t3 from './t3-modes.mjs';
import * as t4 from './t4-usage.mjs';
import * as t5 from './t5-literals.mjs';
import * as t6 from './t6-contrast.mjs';
import * as c1 from './c1-contracts.mjs';
import * as c2 from './c2-contract-tokens.mjs';
import * as c3 from './c3-parity.mjs';
import * as p1 from './p1-prefix.mjs';
import * as r1 from './r1-registry.mjs';
import * as g1 from './g1-generated.mjs';
import * as d1 from './d1-design-drift.mjs';
import * as w1 from './w1-white-label.mjs';
import * as x1 from './x1-decisions.mjs';
import * as k1 from './k1-patterns.mjs';
import * as t7 from './t7-interface.mjs';
import * as f1 from './f1-foundations.mjs';
import * as d3 from './d3-design-docs.mjs';
import * as d4 from './d4-design-realization.mjs';
import * as a1 from './a1-api.mjs';
import * as h1 from './h1-claude-layer.mjs';
import * as h2 from './h2-typescript-sources.mjs';
import * as o1 from './o1-propagation.mjs';
import * as m1 from './m1-docs-coverage.mjs';
import * as s1 from './s1-screen-reader.mjs';

export const CHECKS: Check[] = [t1, t2, t3, t4, t5, t6, t7, f1, c1, c2, c3, a1, p1, r1, g1, d1, d3, d4, o1, m1, s1, w1, x1, k1, h1, h2];

export interface RunOptions { only?: string[]; maintainer?: boolean }

export async function runChecks(root: string, { only, maintainer = false }: RunOptions = {}): Promise<Report> {
  const readJson = async <T,>(p: string): Promise<T> => parseJson<T>(await readFile(join(root, p), 'utf8'));
  const ctx: Omit<CheckContext, 'previous'> = {
    root,
    config: await readJson<HarnessConfigJson>('harness.config.json'),
    brand: await readJson<BrandConfig>('brand.config.json'),
    registry: await readJson<ComponentRegistry>('spec/registry.json'),
    contrastPairs: (await readJson<{ pairs: ContrastPair[] }>('spec/tokens/contrast.json')).pairs,
    schemas: {
      brand: engineSchema('brand-config', root),
      contract: engineSchema('contract', root),
      registry: engineSchema('registry', root),
    },
    all: await loadAll(root),
    css: await loadComponentCss(root),
    maintainer,
  };
  let overrides: Overrides = {};
  try { overrides = (await readJson<OverridesDoc>('spec/tokens/overrides.json')).overrides || {}; } catch { /* absent: treated as empty */ }
  const results: CheckOutcome[] = [];
  for (const c of CHECKS) {
    if (only && !only.includes(c.id)) continue;
    const r = await c.run({ ...ctx, previous: results });
    results.push({ id: c.id, title: c.title, errors: r.errors || [], warnings: r.warnings || [], info: r.info || [] });
  }
  const failed = results.some((r) => r.errors.length);
  const overrideList = Object.entries(overrides).map(([token, o]) => ({ token, ...o }));
  return { ok: !failed, exitCode: failed ? 1 : overrideList.length ? 2 : 0, results, overrides: overrideList };
}

// The human report as lines (npm run check prints them; sketchbook tokens prints them for its staged checks).
// Clean checks fold into one line unless verbose: agents read this output on every run (SB-0114).
export function formatHuman(report: Report, { verbose = false }: { verbose?: boolean } = {}): string[] {
  const lines: string[] = [];
  const clean = report.results.filter((r) => !r.errors.length && !r.warnings.length);
  if (!verbose && clean.length) lines.push(`pass  ${clean.map((r) => r.id).join(' ')}`);
  for (const r of report.results) {
    if (!verbose && clean.includes(r)) continue;
    const mark = r.errors.length ? 'FAIL' : 'pass';
    lines.push(`${mark}  ${r.id}  ${r.title}${r.errors.length ? `  (${r.errors.length})` : ''}`);
    for (const e of r.errors) {
      lines.push(`      ${e.file}${e.line ? `:${e.line}` : ''}${e.token ? `  ${e.token}` : ''}${e.mode ? `  [${e.mode}]` : ''}`);
      lines.push(`        ${e.msg}`);
      if (e.fix) lines.push(`        fix: ${e.fix}`);
    }
    for (const w of r.warnings) lines.push(`      warn: ${w.file}${w.line ? `:${w.line}` : ''}  ${w.msg}`);
  }
  if (report.overrides.length) {
    lines.push('', `flagged  ${report.overrides.length} hand edit(s) to generated tokens (spec/tokens/overrides.json):`);
    for (const o of report.overrides) lines.push(`      ${o.token} = ${JSON.stringify(o.value)} (${o.added ? 'added by hand' : `generated ${JSON.stringify(o.generated)}`})`);
  }
  lines.push('', `${report.ok ? 'All checks passed' : 'Checks failed'}${report.exitCode === 2 ? ' (with overrides)' : ''}.`);
  return lines;
}

const printHuman = (report: Report, opts: { verbose?: boolean }) => {
  const tty = Boolean(process.stdout.isTTY);
  const color = tty && !('NO_COLOR' in process.env);
  for (const line of formatHuman(report, opts)) {
    const formatted = tty ? line.replace(/^(pass|FAIL|flagged|All checks passed|Checks failed)/, (label) => color ? `\u001b[${label === 'FAIL' || label === 'Checks failed' ? '31' : '38;5;208'}m${label}\u001b[0m` : label) : line;
    console.log(formatted);
  }
};

if (isMain(import.meta.url)) {
  const args = process.argv.slice(2);
  const onlyArg = args.find((a) => a.startsWith('--only='));
  // --fix applies only safe mechanical fixes: rebuild generated outputs (tokens, styles, barrel). Everything else is reported.
  if (args.includes('--fix')) {
    const { regenerate } = await import('../commands/prefix.mjs');
    await regenerate(process.cwd());
    // The CLI docs, the command allowlist and the catalog are rebuilt only where the harness source lives.
    const { existsSync } = await import('node:fs');
    if (existsSync(join(process.cwd(), 'harness/cli'))) {
      const { execFileSync } = await import('node:child_process');
      for (const script of ['cli/docs.mjs', 'cli/known.mjs', '../scripts/build-catalog.mjs']) execFileSync('node', [join(HARNESS, script)], { stdio: 'ignore', cwd: process.cwd() });
    }
    if (!args.includes('--json')) console.log('fixed: generated outputs rebuilt (tokens.css, brand css, component tokens, *.styles.ts, src/index.ts, spec/tokens/interface.json, docs/cli.md, known-commands.json)\n');
  }
  const report = await runChecks(process.cwd(), { only: onlyArg?.slice(7).split(','), maintainer: args.includes('--maintainer') });
  if (args.includes('--json')) console.log(JSON.stringify(report, null, 2));
  else printHuman(report, { verbose: args.includes('--verbose') });
  process.exitCode = report.exitCode; // not process.exit(): a large --json report on a pipe would be cut at 64 KB
}
