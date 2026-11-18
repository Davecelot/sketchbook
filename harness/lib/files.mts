// Small file helpers shared by the catalog, starters, brands and upgrade: walking, hashing, globs.
import { readdirSync, readFileSync, existsSync, realpathSync, statSync, writeFileSync, renameSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Schema } from './schema.mjs';

export const HARNESS = fileURLToPath(new URL('../', import.meta.url));
// The installed engine's root (this repo, or node_modules/<package> in a project). Harness-defined formats (the
// schemas in spec/schemas) are read from here, so a project is always checked against the engine it runs.
export const ENGINE = fileURLToPath(new URL('../../', import.meta.url));
// A project with its own copy of harness/ (an older install) may have no schemas beside it: then the project's copy.
export const engineSchema = (name: string, root?: string): Schema | null => readJsonSync<Schema>(join(ENGINE, 'spec/schemas', `${name}.schema.json`)) ?? (root ? readJsonSync<Schema>(join(root, 'spec/schemas', `${name}.schema.json`)) : null);
export const SKIP_DIRS = new Set(['node_modules', 'dist', 'storybook-static', '.git', 'test-results', 'playwright-report', '.tmp']);
// Text files the prefix codemod may rewrite (same list as harness/commands/prefix.mjs).
export const TEXT = new Set(['.ts', '.js', '.mjs', '.cjs', '.scss', '.css', '.json', '.md', '.mdx', '.html', '.yml', '.yaml', '.txt']);
export const isText = (p: string) => TEXT.has(extname(p));

export const hashOf = (buf: string | Uint8Array): string => createHash('sha256').update(buf).digest('hex').slice(0, 20);

// The single typing boundary for JSON: parsing yields no static type, so the caller states the shape it expects.
export function parseJson<T = unknown>(text: string): T { return JSON.parse(text) as T; }
export function readJson<T = unknown>(file: string): T { return parseJson<T>(readFileSync(file, 'utf8')); }
export function readJsonSync<T = unknown>(p: string, fallback?: T | null): T | null { try { return readJson<T>(p); } catch { return fallback ?? null; } }

// A value from JSON or untyped code as template text, exactly as `${v}` renders it.
export const show = (v: unknown): string => String(v);
// Whether the module at `url` is the script node was started with. Compared as real paths: a URL built from argv by
// hand misses a path with a space (%20) or a symlink.
export const isMain = (url: string): boolean => !!process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(url));


export const errorMessage = (e: unknown): string => (e instanceof Error ? e.message : String(e));
export const errorCode = (e: unknown): unknown => (typeof e === 'object' && e !== null && 'code' in e ? e.code : undefined);

// For read-modify-write: readJsonSync's null on a parse error would let the caller overwrite a file the team can still fix.
export function readJsonStrict<T = unknown>(p: string): T | null {
  let text: string;
  try { text = readFileSync(p, 'utf8'); } catch (e) { if (errorCode(e) === 'ENOENT') return null; throw e; }
  try { return parseJson<T>(text); } catch (e) { throw Object.assign(new Error(`${p} is not valid JSON (${errorMessage(e)}). Nothing was written.`), { fix: 'Fix the file (git diff shows what changed), then run the command again.' }); }
}

// Temp file + rename on the same filesystem: a crash leaves the old file or the new one, never half of it.
export function writeFileAtomic(p: string, data: string | Uint8Array): void {
  const tmp = `${p}.${process.pid}.tmp`;
  writeFileSync(tmp, data);
  renameSync(tmp, p);
}

// Every file under root/rel (a file or a folder), as paths relative to root, sorted.
export function walk(root: string, rel: string): string[] {
  const abs = join(root, rel);
  if (!existsSync(abs)) return [];
  if (statSync(abs).isFile()) return [rel];
  const out: string[] = [];
  for (const e of readdirSync(abs, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) out.push(...walk(root, join(rel, e.name))); }
    else if (e.isFile()) out.push(relative(root, join(abs, e.name)));
  }
  return out.sort();
}

// A harness file: the project's own copy when it has one, else the copy next to this module (tests run the
// CLI from the repo against fixture folders that only hold the team's files).
export function harnessPath(root: string, rel: string): string {
  const own = join(root, 'harness', rel);
  return existsSync(own) ? own : join(HARNESS, rel);
}

// Glob to RegExp: ** any depth, * within one segment, ? one character.
export function globToRegExp(glob: string): RegExp {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob.charAt(i);
    if (c === '*' && glob[i + 1] === '*') { re += glob[i + 2] === '/' ? '(?:.*/)?' : '.*'; i += glob[i + 2] === '/' ? 2 : 1; }
    else if (c === '*') re += '[^/]*';
    else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`);
}
export const matchesAny = (path: string, globs: string[]): boolean => globs.some((g) => globToRegExp(g).test(path));
