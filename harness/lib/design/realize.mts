// The design realization of a component, from what the design file holds: its sets (the component and its element sets),
// each set's last read-back (sync verify-library --ingest) and the tokens its styles use that no set draws, which the
// contract records as drift with a reason. `sync realize` writes realizations.design; check D4 holds it to that.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ComponentContract, Realization } from '../../../generated/types/contract.js';
import { contractHash, contractOf, folderOf, mdOf } from './components.mjs';
import { libraryModel } from './library.mjs';
import type { LibraryModel } from './library.mjs';
import { parityOf } from './parity.mjs';
import { loadApi, withSets } from '../api.mjs';
import { parseJson } from '../files.mjs';

export const LIBRARY_VERIFY = 'generated/design/library-verify.json';

export interface LibraryReadback { title: string; ok?: unknown; checked?: number; problems?: string[] }
export interface VerifiedSet { name: string; ok: boolean; checked: number; problems: string[]; hash: string }
export interface LibraryVerifyFile { sets: Record<string, VerifiedSet> }
export type Verified = 'ok' | 'failed' | 'stale' | 'missing';
export interface RealizedSet { name: string; title: string; variants: number; axes: LibraryModel['axes']; verified: Verified; problems: string[] }
export type Drift = NonNullable<Realization['drift']>;
export interface RealizationResult { name: string; sets: RealizedSet[]; notDrawn: string[]; unexplained: string[]; staleDrift: string[]; complete: boolean; drift: Drift }

export async function readLibraryVerify(root: string): Promise<LibraryVerifyFile> {
  try { return parseJson<LibraryVerifyFile>(await readFile(join(root, LIBRARY_VERIFY), 'utf8')); } catch { return { sets: {} }; }
}

const hashOf = async (root: string, name: string) => contractHash(await contractOf(root, folderOf(name)), await mdOf(root, name));

// results: what the library verify script returned, [{ title, ok, checked, problems }]; a set is matched by its title.
// The contract hash is kept with each result, so a contract changed since is read back again.
export async function ingestLibraryVerify(root: string, results: LibraryReadback[], names: string[], { write = true } = {}): Promise<{ file: LibraryVerifyFile; unknown: string[]; failed: string[] }> {
  const byTitle = new Map<string, string>();
  for (const n of withSets(loadApi(root), names)) byTitle.set((await contractOf(root, n)).component, n);
  const file = await readLibraryVerify(root);
  const unknown: string[] = [];
  for (const r of results) {
    const name = byTitle.get(r.title);
    if (!name) { unknown.push(r.title); continue; }
    file.sets[r.title] = { name, ok: Boolean(r.ok), checked: r.checked ?? 0, problems: r.problems ?? [], hash: await hashOf(root, name) };
  }
  file.sets = Object.fromEntries(Object.entries(file.sets).sort(([a], [b]) => a.localeCompare(b)));
  if (write) {
    await mkdir(join(root, 'generated/design'), { recursive: true });
    await writeFile(join(root, LIBRARY_VERIFY), JSON.stringify(file, null, 2) + '\n');
  }
  return { file, unknown, failed: results.filter((r) => !r.ok).map((r) => r.title) };
}

// verified: ok | failed | stale (the contract changed after the read-back) | missing (never read back).
export async function realizationOf(root: string, name: string): Promise<RealizationResult> {
  const contract = await contractOf(root, name);
  const read = (await readLibraryVerify(root)).sets;
  const hash = await hashOf(root, name);
  const sets: RealizedSet[] = [];
  for (const n of withSets(loadApi(root), [name])) {
    const L = await libraryModel(root, n);
    const v = read[L.title];
    sets.push({ name: n, title: L.title, variants: L.variants.length, axes: L.axes, verified: !v ? 'missing' : v.hash !== hash ? 'stale' : v.ok ? 'ok' : 'failed', problems: v?.problems ?? [] });
  }
  const notDrawn = (await parityOf(root, name))?.notDrawn ?? [];
  const drift = contract.realizations?.design?.drift ?? [];
  const aspects = new Set(drift.map((d) => d.aspect));
  const tokens = new Set(Object.keys(contract.tokens ?? {}));
  const unexplained = notDrawn.filter((t) => !aspects.has(t));
  const staleDrift = drift.filter((d) => tokens.has(d.aspect) && !notDrawn.includes(d.aspect)).map((d) => d.aspect);
  const complete = sets.every((s) => s.verified === 'ok') && !unexplained.length && !staleDrift.length;
  return { name, sets, notDrawn, unexplained, staleDrift, complete, drift };
}

const axisLine = (axes: LibraryModel['axes']) => axes.map((a) => `${a.name} (${a.values.join(', ')})`).join(' x ');

// What realizations.design holds: the status, each set's variant count, one coverage line per set, the authored drift.
export function designRealization(r: RealizationResult): Realization {
  return {
    status: r.complete ? 'complete' : 'partial',
    properties: { sets: Object.fromEntries(r.sets.map((s) => [s.title, s.variants])) },
    coverage: r.sets.map((s) => `${s.title}: ${s.variants} variant(s)${s.axes.length ? `, ${axisLine(s.axes)}` : ''}; read back ${s.verified}`),
    drift: r.drift,
  };
}

export async function realize(root: string, names: string[], { write = true } = {}): Promise<RealizationResult[]> {
  const out: RealizationResult[] = [];
  for (const name of names) {
    const r = await realizationOf(root, name);
    const path = join(root, 'spec/components', name, 'contract.json');
    const contract = parseJson<ComponentContract>(await readFile(path, 'utf8'));
    contract.realizations = { ...contract.realizations, design: designRealization(r) };
    if (write) await writeFile(path, JSON.stringify(contract, null, 2) + '\n');
    out.push(r);
  }
  return out;
}
