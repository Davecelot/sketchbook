import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { ComponentContract } from '../../generated/types/contract.js';
import type { HarnessConfigJson } from '../../generated/types/harness-config.js';
import { parseJson } from '../lib/files.mjs';
import type { CheckContext, CheckIssue, CheckResult } from './types.mjs';

export const id = 'W1';
export const title = 'White-label: no brand names, visual reference named only where allowed';

// The visual reference may be named only in a contract's `source:` line, its drift entries / "Known drift"
// section, and in credits, decisions and harness docs (outside this check's scope). Component code,
// stories, tests and the rest of each contract are written in our own words.
const REFERENCE = /shadcn/i;
// The reference's own description lines: copying them is caught even when the name isn't there.
const PHRASES = parseJson<{ phrases: string[] }>(readFileSync(new URL('./data/reference-phrases.json', import.meta.url), 'utf8')).phrases;
const normalize = (text: string): string => text.toLowerCase().replace(/[\s*_`>]+/g, ' ');
const copiedPhrase = (text: string): string | undefined => {
  const t = normalize(text);
  return PHRASES.find((p) => t.includes(p));
};

// Brand names to guard come from harness.config.json (shipped), plus a local untracked list
// (.sketchbook-forbidden-terms, one per line) or SKETCHBOOK_FORBIDDEN_TERMS (comma-separated), so a team can guard
// its own company names without writing them into the repo.
const forbiddenTerms = (root: string, config: HarnessConfigJson): string[] => {
  let local: string[] = [];
  try { local = readFileSync(join(root, '.sketchbook-forbidden-terms'), 'utf8').split('\n'); } catch { /* none */ }
  const env = (process.env.SKETCHBOOK_FORBIDDEN_TERMS ?? '').split(',');
  return [...new Set([...(config.whiteLabel?.forbiddenTerms ?? []), ...local, ...env].map((t) => t.trim()).filter((t) => t && !t.startsWith('#')))];
};

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const dropDrift = (realizations: unknown): void => { if (isRecord(realizations)) for (const r of Object.values(realizations)) if (isRecord(r)) delete r.drift; };

const walk = (dir: string): string[] => {
  let out: string[] = [];
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out = out.concat(walk(p));
    else out.push(p);
  }
  return out;
};

export function run({ root, config, all }: CheckContext): CheckResult {
  const errors: CheckIssue[] = [];
  const forbidden = forbiddenTerms(root, config).map((t) => new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'));
  const scan = (file: string, text: string, { reference = true }: { reference?: boolean } = {}) => {
    const rel = relative(root, file);
    text.split('\n').forEach((line, i) => {
      for (const re of forbidden) if (re.test(line)) errors.push({ file: rel, line: i + 1, msg: `brand or product name "${line.match(re)?.[0]}"`, fix: 'Use neutral wording; the harness is white-label (whiteLabel.forbiddenTerms in harness.config.json).' });
      if (reference && REFERENCE.test(line)) errors.push({ file: rel, line: i + 1, msg: 'names the visual reference outside a source line or drift entry', fix: 'Describe it in our own words; name the reference only in contract.md `source:` and drift entries.' });
    });
  };

  // Component code, stories and behavior specs; pattern kits also ship their CSS, pattern.json and README.
  for (const f of [...walk(join(root, 'src')), ...walk(join(root, 'playwright/tests'))]) {
    const kitFile = f.includes('/src/patterns/') && /\.(css|json|md)$/.test(f);
    if (!kitFile && (!/\.(ts|scss)$/.test(f) || f.endsWith('.styles.ts'))) continue;
    const text = readFileSync(f, 'utf8');
    scan(f, text);
    if (f.includes('/src/components/') && f.endsWith('.ts') && !f.endsWith('.stories.ts')) {
      text.split('\n').forEach((line, i) => {
        if (/#[0-9a-f]{3,8}\b/i.test(line) && !/^\s*(\/\/|\*)/.test(line)) errors.push({ file: relative(root, f), line: i + 1, msg: 'hard-coded color in component code', fix: 'Use a component token in the stylesheet so the color is themable.' });
      });
    }
  }

  // Forbidden terms anywhere that ships: docs, skills, rules, decisions, config, harness code.
  for (const f of [...walk(join(root, 'docs')), ...walk(join(root, '.claude')), ...walk(join(root, 'harness')), ...walk(join(root, 'spec/decisions')), join(root, 'CLAUDE.md'), join(root, 'README.md')]) {
    if (!/\.(md|mjs|js|json)$/.test(f) || f.includes('/test/')) continue;
    let text: string;
    try { text = readFileSync(f, 'utf8'); } catch { continue; }
    scan(f, text, { reference: false });
  }

  // Generated outputs ship too (tokens.css, design-tool scripts): no brand names there either.
  for (const f of walk(join(root, 'generated'))) {
    if (!/\.(css|js|json|ts)$/.test(f) || f.includes('/.tmp/')) continue;
    scan(f, readFileSync(f, 'utf8'), { reference: false });
  }

  // Contracts: everything except drift entries.
  for (const { name, contract } of all.contracts) {
    if (!contract) continue;
    const copy = parseJson<ComponentContract>(JSON.stringify(contract));
    dropDrift(copy.realizations || {});
    for (const e of copy.elements || []) dropDrift(isRecord(e) ? e.realizations || {} : {});
    const file = join(root, 'spec/components', name, 'contract.json');
    const copied = copiedPhrase(JSON.stringify(contract));
    if (copied) errors.push({ file: relative(root, file), msg: `copies the reference's description: "${copied}"`, fix: 'Write the summary and descriptions in our own words: what the component is for, not the reference text.' });
    for (const [i, line] of JSON.stringify(copy, null, 2).split('\n').entries()) {
      if (REFERENCE.test(line)) errors.push({ file: relative(root, file), msg: `names the visual reference outside drift: ${line.trim().slice(0, 90)}`, fix: 'Move it to realizations.*.drift, or say it in our own words.' });
      for (const re of forbidden) if (re.test(line)) errors.push({ file: relative(root, file), msg: `brand or product name at line ${i + 1}`, fix: 'Use neutral wording.' });
    }
    // contract.md and plan.md: allowed in `source:` lines and the "Known drift" section.
    for (const doc of ['contract.md', 'plan.md']) {
      let text: string;
      try { text = readFileSync(join(root, 'spec/components', name, doc), 'utf8'); } catch { continue; }
      const copiedDoc = copiedPhrase(text.split('\n').filter((l) => !/^source:/.test(l)).join('\n'));
      if (copiedDoc) errors.push({ file: `spec/components/${name}/${doc}`, msg: `copies the reference's description: "${copiedDoc}"`, fix: 'Write it in our own words: what the component is for, not the reference text.' });
      let inDrift = false;
      text.split('\n').forEach((line, i) => {
        if (/^#{2,3} /.test(line)) inDrift = /^### Known drift|^## (Accessibility deviations|Known drift)/i.test(line);
        const rel = `spec/components/${name}/${doc}`;
        for (const re of forbidden) if (re.test(line)) errors.push({ file: rel, line: i + 1, msg: 'brand or product name', fix: 'Use neutral wording.' });
        if (!inDrift && !/^source:/.test(line) && REFERENCE.test(line)) errors.push({ file: rel, line: i + 1, msg: 'names the visual reference outside the source line or drift', fix: 'Say it in our own words, or move it to Known drift.' });
      });
    }
  }
  return { errors };
}
