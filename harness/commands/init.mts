// sketchbook init: set up (or rebrand) the system from a few answers. Deterministic: writes brand.config.json and
// harness.config.json, regenerates the foundation (which re-points the linked semantic tokens), rebuilds, and
// reports the checks. The /init Claude command asks the questions; flags work without Claude.
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { BrandConfig } from '../../generated/types/brand-config.js';
import { runGenerator } from '../generators/foundation.mjs';
import type { GeneratorReport } from '../generators/foundation.mjs';
import type { LinkResult } from '../generators/links.mjs';
import type { ResolvedBrand } from '../standards/resolve.mjs';
import { buildTokens } from '../build/index.mjs';
import { parseJson } from '../lib/files.mjs';
import { renamePrefix } from './prefix.mjs';
import type { PrefixResult } from './prefix.mjs';
import type { AdapterConfig } from './swap.mjs';

const readJson = async <T,>(p: string): Promise<T> => parseJson<T>(await readFile(p, 'utf8'));
const writeJson = (p: string, j: unknown): Promise<void> => writeFile(p, JSON.stringify(j, null, 2) + '\n');

export interface InitOptions { name?: string; primary?: string; font?: string; radius?: string; density?: string; danger?: string; design?: string; file?: string; prefix?: string }
export interface InitPlan { brand: BrandConfig; config: AdapterConfig; changed: string[]; dryRun: true }
export interface InitResult {
  brand: BrandConfig;
  config: AdapterConfig;
  anchors: Record<string, number>;
  resolved: ResolvedBrand;
  changed: string[];
  missing: LinkResult['missing'];
  overrides: GeneratorReport;
  renamed: PrefixResult | null;
}

export const INIT_OPTIONS: Record<string, string> = {
  name: 'Brand or system name',
  primary: 'Primary color as #RRGGBB, or "neutral" for the shadcn default',
  font: 'Font family name (falls back to the system stack)',
  radius: 'sharp | soft | round | pill-heavy (sketchbook presets radius)',
  density: 'compact | comfortable | spacious',
  danger: 'Destructive color as #RRGGBB',
  design: 'Design-file adapter: figma | none',
  file: 'Figma file key (when design is figma)',
  prefix: 'Element and CSS prefix, e.g. acme (acme-button, --acme-*); rewrites sources (see sketchbook prefix)',
};

// Pure: the brand and harness configs after applying the answers. v1 and v2 shapes are both kept as written.
export function planInit(brand: BrandConfig, config: AdapterConfig, opts: InitOptions): { brand: BrandConfig; config: AdapterConfig } {
  brand = structuredClone(brand);
  config = structuredClone(config);
  if (opts.name) brand.name = opts.name;
  if (opts.primary) {
    if (opts.primary !== 'neutral' && !/^#[0-9a-f]{6}$/i.test(opts.primary)) throw new Error('primary must be #RRGGBB or "neutral"');
    (brand.color ??= {}).primary = opts.primary;
  }
  if (opts.danger) ((brand.color ??= {}).accents ??= {}).danger = opts.danger;
  if (opts.font) (brand.typography ??= {}).family = opts.font;
  if (opts.radius) {
    const radius = brand.radius;
    brand.radius = radius && typeof radius === 'object' && 'style' in radius && (opts.radius === 'sharp' || opts.radius === 'soft' || opts.radius === 'round') ? { ...radius, style: opts.radius } : { preset: opts.radius };
  }
  if (opts.density) brand.density = typeof brand.density === 'object' ? { preset: opts.density } : opts.density;
  if (opts.design) {
    config.adapters.design = opts.design === 'none'
      ? { tool: null, file: null, available: false }
      : { ...config.adapters.design, tool: opts.design, file: opts.file ?? config.adapters.design.file ?? null, available: Boolean(opts.file ?? config.adapters.design.file) };
  }
  return { brand, config };
}

export async function init(root: string, opts: InitOptions, options: { dryRun: true }): Promise<InitPlan>;
export async function init(root: string, opts: InitOptions, options?: { dryRun?: false }): Promise<InitResult>;
export async function init(root: string, opts: InitOptions, { dryRun = false }: { dryRun?: boolean } = {}): Promise<InitPlan | InitResult> {
  const brandPath = join(root, 'brand.config.json');
  const configPath = join(root, 'harness.config.json');
  if (dryRun) {
    const { brand, config } = planInit(await readJson<BrandConfig>(brandPath), await readJson<AdapterConfig>(configPath), opts);
    const changed: string[] = [];
    if (JSON.stringify(brand) !== JSON.stringify(await readJson<BrandConfig>(brandPath))) changed.push('brand.config.json');
    if (JSON.stringify(config) !== JSON.stringify(await readJson<AdapterConfig>(configPath))) changed.push('harness.config.json');
    if (opts.prefix) changed.push(`prefix -> ${opts.prefix} (sources rewritten)`);
    if (changed.length) changed.push('spec/tokens/foundation/*', 'spec/tokens/semantic/* (linked tokens)', 'generated/css/tokens.css');
    return { brand, config, changed, dryRun: true };
  }
  // Validate the answers before anything is written (a bad --primary must not leave a prefix rewrite behind).
  planInit(await readJson<BrandConfig>(brandPath), await readJson<AdapterConfig>(configPath), opts);
  // The prefix codemod writes harness.config.json itself, so it runs before the config is read below.
  const renamed = opts.prefix ? await renamePrefix(root, undefined, opts.prefix, { quiet: true }) : null;
  const { brand, config } = planInit(await readJson<BrandConfig>(brandPath), await readJson<AdapterConfig>(configPath), opts);
  await writeJson(brandPath, brand);
  await writeJson(configPath, config);
  const gen = await runGenerator(root, { quiet: true });
  await buildTokens({ root });
  return { brand, config, anchors: gen.anchors, resolved: gen.resolved, changed: gen.links.changed, missing: gen.links.missing, overrides: gen.overrides, renamed };
}
