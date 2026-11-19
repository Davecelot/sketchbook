import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { loadDesignDocs } from '../lib/design-docs.mjs';
import { kebab } from '../commands/catalog.mjs';
import { parseJson } from '../lib/files.mjs';
import type { CheckContext, CheckIssue, CheckResult } from './types.mjs';

export const id = 'M1';
export const title = 'Every shipped component is documented in every output (maintainer)';

const SHIPPED = new Set(['beta', 'stable', 'code-only']);
const PROGRESS = 'generated/design/progress.json';
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const field = (v: unknown, k: string): unknown => (isRecord(v) ? v[k] : undefined);

// Maintainer only: consumers have no docs site and draw their own design file at their own pace.
export function run({ root, config, registry, all, maintainer }: CheckContext): CheckResult {
  const errors: CheckIssue[] = [];
  if (!maintainer) return { errors };
  const content = 'apps/docs/content';
  const site = config.catalog?.source === true || existsSync(join(root, content));
  const tool = config.adapters?.design?.tool;
  const design = tool && tool !== 'none';
  const batched = new Set(list(loadDesignDocs(root)?.batches).flatMap((b) => list(field(b, 'components'))));
  let progress: Record<string, { stage?: string } | undefined> = {};
  try { progress = parseJson<{ components?: Record<string, { stage?: string }> }>(readFileSync(join(root, PROGRESS), 'utf8')).components ?? {}; } catch { /* absent: nothing checked yet */ }
  let audits: string[] = [];
  try { audits = readdirSync(join(root, 'docs/parity-audits')); } catch { /* absent */ }

  for (const c of registry.components.filter((x) => SHIPPED.has(x.status))) {
    const name = c.path ? basename(c.path) : kebab(c.name);
    const fail = (msg: string, fix: string) => errors.push({ file: 'spec/registry.json', token: c.name, msg: `${c.status}: ${msg}`, fix });
    if (!audits.some((f) => f.startsWith(`${name}-`))) fail('no parity audit report', 'Launch .claude/skills/component-builder/agents/parity-auditor.md (writes docs/parity-audits/<name>-<date>.md).');
    if (site) {
      if (!existsSync(join(root, `${content}/demo/${name}.md`))) fail(`no docs site page ${content}/demo/${name}.md`, 'Run npm run docs:components (generated from the contract).');
      if (!existsSync(join(root, `${content}/_examples/${name}.html`))) fail(`no docs site example ${content}/_examples/${name}.html`, 'Write a curated live example for the docs site.');
    }
    if (!design || c.status === 'code-only') continue;
    if (!batched.has(name)) fail('in no batch of spec/design-docs.json', 'Add it to a batch so sync components draws its doc page.');
    const contract = all.contracts.find((x) => x.name === name)?.contract;
    if (contract?.realizations?.design?.status !== 'complete') fail('design library realization is not complete', `sketchbook sync library ${name} (build, finish, verify), then sketchbook sync realize ${name}.`);
    if (progress[name]?.stage !== 'checked') fail(`design doc page is ${progress[name]?.stage ?? 'not started'}, not checked`, `sketchbook sync components <batch>, compare with Storybook, then sketchbook sync stamp checked ${name}.`);
  }
  if (site) {
    const LEAK = /PROPOSAL|owner to confirm|\(Q\d+\)/;
    for (const f of existsSync(join(root, `${content}/demo`)) ? readdirSync(join(root, `${content}/demo`)).filter((x) => x.endsWith('.md')) : []) {
      const hit = readFileSync(join(root, `${content}/demo`, f), 'utf8').split('\n').findIndex((line) => LEAK.test(line));
      if (hit >= 0) errors.push({ file: `${content}/demo/${f}`, msg: `line ${hit + 1} shows a contract drafting label (PROPOSAL, owner to confirm, Q-number) on a public page`, fix: 'Run npm run docs:components to regenerate the page without drafting labels.' });
    }
  }
  return { errors };
}
