// The propagation record (generated/propagation.json): a hash of every input the outputs are built from, written by
// `sketchbook propagate` and read by check O1. A changed input with no propagate after it is a failure.
import { createHash } from 'node:crypto';
import type { Dirent } from 'node:fs';
import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { parseJson } from './files.mjs';

export const RECORD = 'generated/propagation.json';

const INPUT_DIRS = ['spec/tokens', 'spec/components', 'harness/standards', 'src/patterns'];
const INPUT_FILES = ['brand.config.json', 'spec/design-docs.json', 'spec/api.json', 'spec/figma-practices.json', 'spec/icons.json'];
// Outputs of the spec, not inputs: the foundation token files, hand overrides and the design stamps.
export interface MaintainerBuild { file: string; hash: string; inputs?: string }
export interface PropagationRecord {
  inputsHash: string;
  docsInputsHash?: string;
  at?: string;
  maintainer?: Record<string, MaintainerBuild> | null;
  [key: string]: unknown;
}

// Plan records, approval snapshots and test evidence are process records, not build inputs (SB-0123).
const OUTPUT = /(^|\/)foundation\/|overrides\.json$|stamp\.json$|verify\.json$|\.snapshot\.json$|^generated\/|^spec\/components\/[^/]+\/(plan\.md|approved\.json|evidence\.json)$/;

async function walk(root: string, rel: string, out: string[], ext = /\.(json|md|ts|mts|mjs)$/): Promise<void> {
  let entries: Dirent[];
  try { entries = await readdir(join(root, rel), { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const p = join(rel, e.name).split('\\').join('/');
    if (e.isDirectory()) await walk(root, p, out, ext);
    else if (ext.test(e.name)) out.push(p);
  }
}

// A .mjs or .d.mts beside its .mts is compiled output: the source is the input, so the hash does not depend on the compiler.
const withoutCompiled = (files: Iterable<string>): string[] => {
  const all = new Set(files);
  return [...all].filter((f) => !(f.endsWith('.d.mts') && all.has(f.replace(/\.d\.mts$/, '.mts'))) && !(f.endsWith('.mjs') && all.has(f.replace(/\.mjs$/, '.mts'))));
};

// Every file a build reads from the spec: tokens, contracts and their docs, standards, patterns, design docs, API vocabulary.
export async function inputFiles(root: string): Promise<string[]> {
  const files: string[] = [];
  for (const d of INPUT_DIRS) await walk(root, d, files);
  for (const f of INPUT_FILES) {
    try { await stat(join(root, f)); files.push(f); } catch { /* optional input */ }
  }
  return withoutCompiled(files).filter((f) => !OUTPUT.test(f)).sort();
}

export async function inputsHash(root: string): Promise<string> {
  const h = createHash('sha256');
  for (const f of await inputFiles(root)) {
    h.update(f + '\0');
    h.update(await readFile(join(root, f)));
    h.update('\0');
  }
  return h.digest('hex');
}

// The docs build reads its pages, assets, generators, CLI reference, brand defaults and package version.
const DOCS_FILES = ['docs/cli.md', 'brand.config.json', 'package.json'];

export async function docsInputsHash(root: string): Promise<string> {
  const files: string[] = [];
  await walk(root, 'apps/docs/content', files, /\.(json|md|html|css|js|svg|fig)$/);
  await walk(root, 'apps/docs/scripts', files, /\.m(js|ts)$/);
  files.push(...DOCS_FILES);
  const h = createHash('sha256');
  for (const f of withoutCompiled(files).sort()) {
    let body: Buffer | null = null;
    try { body = await readFile(join(root, f)); } catch { /* optional */ }
    if (body === null) continue;
    h.update(f + '\0');
    h.update(body);
    h.update('\0');
  }
  return h.digest('hex');
}

export async function readRecord(root: string): Promise<PropagationRecord | null> {
  try { return parseJson<PropagationRecord>(await readFile(join(root, RECORD), 'utf8')); } catch { return null; }
}

export async function writeRecord(root: string, record: PropagationRecord): Promise<void> {
  await mkdir(dirname(join(root, RECORD)), { recursive: true });
  await writeFile(join(root, RECORD), JSON.stringify(record, null, 2) + '\n');
}

// `at` is when the outputs were last built from these inputs: a rebuild that changes no hash keeps it, so it adds no diff.
export const keepTime = (previous: PropagationRecord | null | undefined, next: PropagationRecord): PropagationRecord =>
  previous?.inputsHash === next.inputsHash && JSON.stringify(previous?.maintainer ?? null) === JSON.stringify(next.maintainer ?? null) && previous.at ? { ...next, at: previous.at } : next;

export const hashFile = async (root: string, file: string): Promise<string> => createHash('sha256').update(await readFile(join(root, file))).digest('hex');
