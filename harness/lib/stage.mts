// Run project changes on a copy, then publish only paths the command changed.
import { lstatSync, mkdirSync, readFileSync, readdirSync, rmSync, rmdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
import { errorCode, SKIP_DIRS, writeFileAtomic } from './files.mjs';

const stat = (path: string) => {
  try { return lstatSync(path); } catch (error) { if (errorCode(error) !== 'ENOENT') throw error; }
};
const digest = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
interface Snapshot {
  files: Map<string, string>;
  dirs: Set<string>;
}

export function snapshot(root: string, paths: string[], copyTo?: string): Snapshot {
  const files = new Map<string, string>();
  const dirs = new Set<string>();
  const walk = (rel: string): void => {
    const path = join(root, rel);
    const entry = stat(path);
    if (!entry) return;
    if (entry.isDirectory()) {
      dirs.add(rel);
      if (copyTo) mkdirSync(join(copyTo, rel), { recursive: true });
      for (const name of readdirSync(path)) if (!SKIP_DIRS.has(name)) walk(join(rel, name));
    } else if (entry.isFile()) {
      const bytes = readFileSync(path);
      files.set(rel, digest(bytes));
      if (copyTo) {
        const to = join(copyTo, rel);
        mkdirSync(dirname(to), { recursive: true });
        writeFileSync(to, bytes, { mode: entry.mode });
      }
    } else {
      throw new Error(`Cannot stage ${rel}: expected a regular file or directory. Nothing was written.`);
    }
  };
  for (const path of paths) walk(path);
  return { files, dirs };
}

export function changedFiles(before: Snapshot, after: Snapshot): string[] {
  return [...new Set([...before.files.keys(), ...after.files.keys()])]
    .filter((rel) => before.files.get(rel) !== after.files.get(rel)).sort();
}

export function conflicts(root: string, before: Snapshot, changed: string[]): string[] {
  return changed.filter((rel) => {
    // Do not follow a parent that was replaced with a symlink while staging.
    for (let parent = dirname(rel); parent !== '.'; parent = dirname(parent)) {
      const entry = stat(join(root, parent));
      if (entry && !entry.isDirectory()) return true;
    }
    const path = join(root, rel);
    const entry = stat(path);
    if (!entry) return before.files.has(rel);
    return !entry.isFile() || digest(readFileSync(path)) !== before.files.get(rel);
  });
}

export function copyBack(root: string, stage: string, before: Snapshot, after: Snapshot, changed: string[]): void {
  const undo: (() => void)[] = [];
  const order = (paths: string[]) => paths.sort((a, b) => a.split('/').length - b.split('/').length);
  const ensureDir = (path: string): void => {
    if (stat(path)?.isDirectory()) return;
    ensureDir(dirname(path));
    mkdirSync(path);
    undo.push(() => { rmdirSync(path); });
  };
  try {
    for (const rel of changed) {
      const path = join(root, rel);
      const entry = stat(path);
      if (entry) {
        const bytes = readFileSync(path);
        undo.push(() => { writeFileAtomic(path, bytes, entry.mode); });
      } else {
        ensureDir(dirname(path));
        undo.push(() => { rmSync(path, { force: true }); });
      }
      if (after.files.has(rel)) {
        const from = join(stage, rel);
        writeFileAtomic(path, readFileSync(from), entry?.mode ?? stat(from)?.mode);
      } else rmSync(path);
    }
    // Catalog installs and removals also change directory presence. Never recursively delete live paths:
    // a file created after staging must cause a conflict, not be lost.
    for (const rel of order([...before.dirs].filter((p) => !after.dirs.has(p))).reverse()) {
      const path = join(root, rel);
      if (stat(path)?.isDirectory()) {
        rmdirSync(path);
        undo.push(() => { mkdirSync(path); });
      }
    }
    for (const rel of order([...after.dirs].filter((p) => !before.dirs.has(p)))) ensureDir(join(root, rel));
  } catch (error) {
    const failures: unknown[] = [];
    for (const restore of undo.reverse()) {
      try { restore(); } catch (failure) { failures.push(failure); }
    }
    if (failures.length) throw new AggregateError([error, ...failures], `Could not publish the staged changes, and rollback was incomplete: ${String(error)}. Review git status before retrying.`);
    throw error;
  }
}
