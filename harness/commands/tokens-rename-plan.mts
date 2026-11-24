import { access, lstat, readFile, stat, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, join } from 'node:path';
import { errorMessage, parseJson } from '../lib/files.mjs';
import { semanticPaths } from '../lib/renames.mjs';
import { fail, serialize } from './tokens.mjs';

export interface RenamePair { from: string; to: string }
interface RenameList { renames: RenamePair[] }

export const NAMING_PRESET = {
  id: 'on-role-colors',
  label: 'On-role colors',
  description: 'Rename paired colors such as color.primary-foreground to color.on-primary. Leave other names alone.',
} as const;

const object = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
const formatFix = 'Use {"renames":[{"from":"color.primary-foreground","to":"color.on-primary"}]}.';
const errorCode = (error: unknown): unknown => object(error) ? error.code : undefined;

export async function readRenameList(file: string, label: string): Promise<RenameList> {
  let text: string;
  try {
    if (!(await stat(file)).isFile()) throw fail(`${label} is not a file.`, 'Pass a JSON rename list to --map.');
    text = await readFile(file, 'utf8');
  } catch (e) {
    if (object(e) && e.fix) throw e;
    throw fail(errorCode(e) === 'ENOENT' ? `Could not find ${label}.` : `Could not read ${label}: ${errorMessage(e)}.`, 'Check the path passed to --map and whether you can read it.');
  }
  let doc: unknown;
  try { doc = parseJson(text); } catch { throw fail(`${label} is not valid JSON.`, formatFix); }
  if (!object(doc) || Object.keys(doc).some((k) => k !== 'renames') || !Array.isArray(doc.renames)) throw fail(`${label} must contain a "renames" array.`, formatFix);
  return {
    renames: (doc.renames as unknown[]).map((pair, i) => {
      if (!object(pair) || typeof pair.from !== 'string' || typeof pair.to !== 'string' || Object.keys(pair).length !== 2) {
        throw fail(`${label}: entry ${i + 1} needs a "from" and a "to" token name.`, formatFix);
      }
      return { from: pair.from, to: pair.to };
    }),
  };
}

export async function namingProposal(root: string): Promise<RenameList> {
  const paths = new Set(semanticPaths(root));
  const path = 'spec/tokens/contrast.json';
  let pairs: unknown[];
  try {
    const doc = parseJson<unknown>(await readFile(join(root, path), 'utf8'));
    if (!object(doc) || !Array.isArray(doc.pairs)) throw new Error('Expected a pairs array.');
    pairs = doc.pairs as unknown[];
  } catch (e) {
    throw fail(`Could not read the contrast pairs in ${path}: ${errorMessage(e)}`, 'Check the contrast file, then run npx sketchbook check.');
  }
  const renames = new Map<string, string>();
  for (const pair of pairs) {
    if (!object(pair) || typeof pair.fg !== 'string' || typeof pair.bg !== 'string') {
      throw fail(`A pair in ${path} is missing a foreground or background token.`, 'Fix the pair, then run npx sketchbook check.');
    }
    const { fg, bg } = pair;
    const role = /^color\.([a-z][a-z0-9-]*)$/.exec(bg)?.[1];
    if (role && fg === `${bg}-foreground` && paths.has(fg) && paths.has(bg)) renames.set(fg, `color.on-${role}`);
  }
  return { renames: [...renames].sort(([a], [b]) => a.localeCompare(b, 'en')).map(([from, to]) => ({ from, to })) };
}

export async function writeRenameList(file: string, label: string, doc: RenameList, dryRun: boolean): Promise<void> {
  try {
    if (dryRun) {
      // lstat sees a dangling symlink too; the actual write below never follows an existing path.
      try { await lstat(file); } catch (e) {
        if (errorCode(e) !== 'ENOENT') throw e;
        await access(dirname(file), constants.W_OK);
        return;
      }
      throw fail(`${label} already exists.`, 'Choose a new path with --out, or edit the existing list.');
    }
    await writeFile(file, serialize(doc), { flag: 'wx' });
  } catch (e) {
    if (object(e) && e.fix) throw e;
    if (errorCode(e) === 'EEXIST') throw fail(`${label} already exists.`, 'Choose a new path with --out, or edit the existing list.');
    throw fail(`Could not write ${label}: ${errorMessage(e)}.`, 'Choose a new file in a folder you can write to.');
  }
}
