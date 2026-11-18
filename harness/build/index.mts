// Token build entry: picks the adapter named in harness.config.json (adapters.tokens).
//   style-dictionary (default) | plain
// Also writes generated/css/fonts.css from typography.source (any adapter; SB-0050).
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { BrandConfig } from '../../generated/types/brand-config.js';
import type { HarnessConfigJson } from '../../generated/types/harness-config.js';
import { parseJson, isMain } from '../lib/files.mjs';
import { fontsCss } from './fonts.mjs';
import type { BuildOptions, BuildResult } from './tokens.mjs';

export const TOKEN_ADAPTERS: Record<string, string> = { 'style-dictionary': './tokens.mjs', plain: './tokens-plain.mjs' };

export interface TokenAdapter { name: string; build(opts?: BuildOptions): Promise<BuildResult> }
// Literal specifiers keep the imports typed; TOKEN_ADAPTERS stays the public name -> file table.
const LOADERS: Record<string, () => Promise<Pick<TokenAdapter, 'build'>>> = { 'style-dictionary': () => import('./tokens.mjs'), plain: () => import('./tokens-plain.mjs') };
export interface BuiltTokens extends BuildResult { fontsCss: string }

export async function tokenAdapter(root: string): Promise<TokenAdapter> {
  const config = parseJson<Partial<HarnessConfigJson>>(await readFile(join(root, 'harness.config.json'), 'utf8'));
  const name = config.adapters?.tokens ?? 'style-dictionary';
  const load = LOADERS[name];
  if (!load) throw new Error(`Unknown token adapter "${name}". Known: ${Object.keys(TOKEN_ADAPTERS).join(', ')}.`);
  const adapter = await load();
  return { name, ...adapter };
}

// Returns the adapter's { css, componentJson } plus fontsCss; writes generated/ unless write is false.
export async function buildTokens(opts: BuildOptions = {}): Promise<BuiltTokens> {
  const root = opts.root ?? process.cwd();
  const result = await (await tokenAdapter(root)).build({ ...opts, root });
  const fonts = fontsCss(parseJson<BrandConfig>(await readFile(join(root, 'brand.config.json'), 'utf8')));
  if (opts.write !== false) {
    await mkdir(join(root, 'generated/css'), { recursive: true });
    await writeFile(join(root, 'generated/css/fonts.css'), fonts);
  }
  return { ...result, fontsCss: fonts };
}

if (isMain(import.meta.url)) {
  const { name } = await tokenAdapter(process.cwd());
  const { css } = await buildTokens();
  console.log(`tokens.css (${name}): ${css.split('\n').filter((l) => l.trim().startsWith('--')).length} variables`);
}
