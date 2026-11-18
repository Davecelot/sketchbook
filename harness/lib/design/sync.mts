// Design file bookkeeping, tool-neutral: the stamp that records what reached the file (check D1), the read-back
// verify result (D2) and the component docs progress register. The adapter writes the scripts; this records the outcome.
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tokenPayload } from './tokens.mjs';
import { contractHash, contractOf, mdOf } from './components.mjs';
import { compareReadback, type CompareResult, type Readback } from './verify.mjs';
import { loadDesignDocs, type DesignDocsSpec } from '../design-docs.mjs';
import { patternIds } from './patterns.mjs';
import { parseJson } from '../files.mjs';
import type { HarnessConfigJson } from '../../../generated/types/harness-config.js';

export const STAMP = 'generated/design/stamp.json';
export const VERIFY = 'generated/design/verify.json';

type DesignAdapter = Partial<HarnessConfigJson['adapters']['design']>;
export interface Synced { hash: string; syncedAt: string }
export interface Stamp { tool: DesignAdapter['tool']; file: DesignAdapter['file']; tokens: Synced | null; foundations?: Synced; components: Record<string, Synced | undefined> }

export async function readStamp(root: string): Promise<Stamp | null> {
  try { return parseJson<Stamp>(await readFile(join(root, STAMP), 'utf8')); } catch { return null; }
}

export async function designOf(root: string): Promise<DesignAdapter> {
  const design: DesignAdapter = parseJson<HarnessConfigJson>(await readFile(join(root, 'harness.config.json'), 'utf8')).adapters?.design ?? {};
  if (!design.tool || design.tool === 'none') throw Object.assign(new Error('No design adapter configured in harness.config.json.'), { fix: 'sketchbook swap design figma --file <file key>' });
  if (design.available === false) throw Object.assign(new Error(`${design.tool} is marked unavailable in harness.config.json (adapters.design.available: false).`), { fix: 'Everything else keeps working; run sketchbook init --design again once the preflight passes.' });
  return design;
}

// Called after the agent ran a script successfully, so the stamp only records what really reached the file.
export async function stamp(root: string, what: string, names: string[] = []): Promise<Stamp> {
  const config = parseJson<HarnessConfigJson>(await readFile(join(root, 'harness.config.json'), 'utf8'));
  const s = (await readStamp(root)) ?? { tool: config.adapters.design.tool, file: config.adapters.design.file, tokens: null, components: {} };
  s.tool = config.adapters.design.tool;
  s.file = config.adapters.design.file;
  const now = new Date().toISOString();
  if (what === 'tokens') s.tokens = { hash: (await tokenPayload(root)).hash, syncedAt: now };
  if (what === 'foundations') s.foundations = { hash: (await tokenPayload(root)).hash, syncedAt: now };
  if (what === 'components') for (const n of names) s.components[n] = { hash: contractHash(await contractOf(root, n), await mdOf(root, n)), syncedAt: now };
  await mkdir(join(root, 'generated/design'), { recursive: true });
  await writeFile(join(root, STAMP), JSON.stringify(s, null, 2) + '\n');
  return s;
}

export interface IngestReadback extends Readback { file?: string; hash?: string; [k: string]: unknown }
export interface IngestOptions<R> { write?: boolean; compare?: (root: string, readback: R) => Promise<CompareResult> }

// sync verify --ingest <file>: compare the read-back with the spec per combination and write verify.json (check D1).
// compare: the adapter's comparison when its read-back has another shape (default: values per combination).
export async function ingestVerify<R extends IngestReadback>(root: string, readback: R, { write = true, compare = compareReadback }: IngestOptions<R> = {}) {
  const design = await designOf(root);
  const r = await compare(root, readback);
  const doc = {
    tool: design.tool, file: design.file, readFile: readback.file ?? null, checkedAt: new Date().toISOString().slice(0, 10),
    method: 'sketchbook sync verify: the design file resolved every managed variable for every theme combination; compared with the spec for the same combination (composites skipped).',
    specHash: r.hash, readHash: readback.hash ?? null, compared: r.compared, skipped: r.skipped, mismatches: r.mismatches,
  };
  if (write) {
    await mkdir(join(root, 'generated/design'), { recursive: true });
    await writeFile(join(root, VERIFY), JSON.stringify(doc, null, 2) + '\n');
  }
  return { ...doc, stale: r.stale, wrongFile: Boolean(readback.file && design.file && readback.file !== design.file) };
}

// ---- progress register: the stage of every component doc (generated/design/progress.json), a readable list
// (docs/design-docs/progress.md), written only here. Stages move one step at a time; rebuilding an earlier stage resets the later ones.
export const PROGRESS = 'generated/design/progress.json';
export const PROGRESS_VIEW = 'docs/design-docs/progress.md';
export const STAGES = ['planned', 'library', 'doc', 'checked'];

export interface ProgressEntry { stage: string; needsFix: boolean; note: string; updatedAt?: string }
export interface Progress { components: Record<string, ProgressEntry>; patterns: Record<string, ProgressEntry> }

export async function readProgress(root: string): Promise<Progress> {
  let p: Partial<Progress> & Pick<Progress, 'components'>;
  try { p = parseJson<Progress>(await readFile(join(root, PROGRESS), 'utf8')); } catch { p = { components: {} }; }
  return { ...p, patterns: p.patterns ?? {} };
}

export const PATTERN_STAGES = ['planned', 'doc', 'checked'];

const componentNames = async (root: string) => (await readdir(join(root, 'spec/components'), { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name).sort();

// stage: library | doc | checked | note (note: names is one component, text the fix to do).
export async function setProgress(root: string, stage: string, names: string[], text = ''): Promise<Progress> {
  const known = await componentNames(root);
  const patterns = await patternIds(root);
  const bad = names.filter((n) => !known.includes(n) && !patterns.includes(n));
  if (bad.length) throw Object.assign(new Error(`Unknown component or pattern: ${bad.join(', ')}.`), { fix: `Use a folder name from spec/components (${known.slice(0, 5).join(', ')}, ...) or a pattern id from src/patterns.` });
  const patternOnly = names.filter((n) => patterns.includes(n) && !known.includes(n));
  if (patternOnly.length && stage === 'library') throw Object.assign(new Error(`A pattern has no library stage: ${patternOnly.join(', ')}.`), { fix: 'Stamp doc, then checked.' });
  if (!['note', 'clear'].includes(stage) && !STAGES.includes(stage)) throw Object.assign(new Error(`Unknown stage "${stage}".`), { fix: `Use ${STAGES.slice(1).join(', ')}, note or clear.` });
  const p = await readProgress(root);
  const now = new Date().toISOString();
  for (const n of names) {
    const isPattern = patternOnly.includes(n);
    const stages = isPattern ? PATTERN_STAGES : STAGES;
    const bucket = isPattern ? p.patterns : p.components;
    const cur = bucket[n] ?? { stage: 'planned', needsFix: false, note: '' };
    if (stage === 'clear') { cur.note = ''; cur.needsFix = false; }
    else if (stage === 'note') { cur.note = text; cur.needsFix = true; }
    else {
      if (stages.indexOf(stage) > stages.indexOf(cur.stage) + 1) throw Object.assign(new Error(`${n} is at "${cur.stage}": it cannot go to "${stage}" yet.`), { fix: `Stamp ${String(stages[stages.indexOf(cur.stage) + 1])} first.` });
      cur.stage = stage;
      if (stage === 'checked') { cur.needsFix = false; cur.note = ''; }
    }
    cur.updatedAt = now;
    bucket[n] = cur;
  }
  await mkdir(join(root, 'generated/design'), { recursive: true });
  await writeFile(join(root, PROGRESS), JSON.stringify(p, null, 2) + '\n');
  const drawn = names.filter((n) => known.includes(n));
  if ((stage === 'library' || stage === 'doc') && drawn.length) await stamp(root, 'components', drawn);
  return p;
}

export interface ProgressRow extends ProgressEntry { name: string; batch: string }
export interface ProgressView { rows: ProgressRow[]; done: number; kits: (ProgressEntry & { name: string })[]; kitsDone: number; text: string }

// The readable list: one row per component, in batch order, with the stage as checkboxes.
export async function progressView(root: string): Promise<ProgressView> {
  const names = await componentNames(root);
  const p = await readProgress(root);
  const batches = loadDesignDocs<DesignDocsSpec>(root)?.batches ?? [];
  const order = [...batches.flatMap((b) => b.components.map((c) => ({ c, b }))), ...names.filter((n) => !batches.some((b) => b.components.includes(n))).map((c) => ({ c, b: { id: '-', title: 'Not in a batch' } }))];
  const rows = order.map(({ c, b }) => ({ name: c, batch: b.id, ...(p.components[c] ?? { stage: 'planned', needsFix: false, note: '' }) }));
  const at = (r: ProgressEntry, s: string) => STAGES.indexOf(r.stage) >= STAGES.indexOf(s) ? '[x]' : '[ ]';
  const done = rows.filter((r) => r.stage === 'checked').length;
  const kits = (await patternIds(root)).map((id) => ({ name: id, ...(p.patterns[id] ?? { stage: 'planned', needsFix: false, note: '' }) }));
  const kitAt = (r: ProgressEntry, st: string) => (PATTERN_STAGES.indexOf(r.stage) >= PATTERN_STAGES.indexOf(st) ? '[x]' : '[ ]');
  const kitsDone = kits.filter((r) => r.stage === 'checked').length;
  const lines = [
    '# Component docs: progress', '',
    `Generated by \`sketchbook sync progress\` from \`${PROGRESS}\`; do not edit by hand. Stages are recorded with \`sketchbook sync stamp library|doc|checked <names>\`; batches are in \`spec/design-docs.json\`.`, '',
    `${done} of ${rows.length} components checked.`, '',
    '| Batch | Component | Library | Doc | Checked | Fix to do |', '| --- | --- | --- | --- | --- | --- |',
    ...rows.map((r) => `| ${r.batch} | ${r.name} | ${at(r, 'library')} | ${at(r, 'doc')} | ${at(r, 'checked')} | ${r.needsFix ? r.note || 'yes' : ''} |`), '',
    ...(kits.length ? ['## Patterns', '', `${kitsDone} of ${kits.length} patterns checked. Recorded with \`sketchbook sync stamp doc|checked <pattern ids>\`.`, '', '| Pattern | Doc | Checked | Fix to do |', '| --- | --- | --- | --- |', ...kits.map((r) => `| ${r.name} | ${kitAt(r, 'doc')} | ${kitAt(r, 'checked')} | ${r.needsFix ? r.note || 'yes' : ''} |`), ''] : []),
  ];
  return { rows, done, kits, kitsDone, text: lines.join('\n') };
}

export async function writeProgress(root: string, { write = true }: { write?: boolean } = {}): Promise<ProgressView> {
  const v = await progressView(root);
  if (write) { await mkdir(join(root, 'docs/design-docs'), { recursive: true }); await writeFile(join(root, PROGRESS_VIEW), v.text); }
  return v;
}
