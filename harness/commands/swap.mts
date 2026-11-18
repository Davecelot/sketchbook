// sketchbook swap <output> <adapter>: replace an adapter without touching the spec, then rebuild that output.
//   tokens: style-dictionary | plain     design: figma | none
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { TOKEN_ADAPTERS, buildTokens } from '../build/index.mjs';
import { parseJson } from '../lib/files.mjs';

// Looser than the harness-config schema: swapping to "none" writes tool: null.
export interface AdapterConfig {
  adapters: {
    tokens?: string;
    design: { tool?: string | null; file?: string | null; available?: boolean; [k: string]: unknown };
    [k: string]: unknown;
  };
  [k: string]: unknown;
}

export interface SwapResult { before: unknown; after: string; dryRun?: true }

export const SWAPPABLE: Record<string, string[]> = {
  tokens: Object.keys(TOKEN_ADAPTERS),
  design: ['figma', 'none'],
};

export async function swap(root: string, output: string, adapter: string, { file, dryRun = false }: { file?: string; dryRun?: boolean } = {}): Promise<SwapResult> {
  const known = SWAPPABLE[output];
  if (!known) throw new Error(`Can't swap "${output}". Swappable outputs: ${Object.keys(SWAPPABLE).join(', ')}.`);
  if (!known.includes(adapter)) throw new Error(`Unknown ${output} adapter "${adapter}". Known: ${known.join(', ')}.`);
  const path = join(root, 'harness.config.json');
  const config = parseJson<AdapterConfig>(await readFile(path, 'utf8'));
  const before = output === 'design' ? config.adapters.design.tool : config.adapters[output];
  if (dryRun) return { before, after: adapter, dryRun: true };
  if (output === 'tokens') config.adapters.tokens = adapter;
  else config.adapters.design = adapter === 'none' ? { tool: null, file: null, available: false } : { ...config.adapters.design, tool: adapter, file: file ?? config.adapters.design.file ?? null, available: Boolean(file ?? config.adapters.design.file) };
  await writeFile(path, JSON.stringify(config, null, 2) + '\n');
  if (output === 'tokens') await buildTokens({ root });
  return { before, after: adapter };
}
