import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { resolveBrand } from '../../standards/resolve.mjs';
import { listOverrides } from '../../generators/overrides.mjs';
import { readProgress, readStamp } from '../../lib/design/sync.mjs';
import { patternIds } from '../../lib/design/patterns.mjs';
import { tokenPayload } from '../../lib/design/tokens.mjs';
import { contractHash, mdOf } from '../../lib/design/components.mjs';
import { loadContracts } from '../../lib/tokens.mjs';
import { parseJson, show } from '../../lib/files.mjs';
import { presentation } from '../presentation.mjs';
import type { BrandConfig } from '../../../generated/types/brand-config.js';
import type { HarnessConfigJson } from '../../../generated/types/harness-config.js';
import type { ComponentRegistry } from '../../../generated/types/registry.js';
import type { Command, CommandContext } from '../types.mjs';

const readJson = async <T,>(root: string, p: string): Promise<T> => parseJson<T>(await readFile(join(root, p), 'utf8'));

export interface DesignState {
  tool: string | null;
  file: string | null;
  available: boolean;
  tokens: string;
  components: { synced: number; stale: string[] };
  patterns: { total: number; checked: number };
}

export async function designState(root: string, config: HarnessConfigJson): Promise<DesignState> {
  const d: Partial<HarnessConfigJson['adapters']['design']> = config.adapters?.design ?? {};
  const state: DesignState = { tool: d.tool ?? null, file: d.file ?? null, available: d.available !== false && Boolean(d.tool), tokens: 'n/a', components: { synced: 0, stale: [] }, patterns: { total: 0, checked: 0 } };
  if (!d.tool || d.tool === 'none') return state;
  const progress = await readProgress(root);
  const ids: string[] = await patternIds(root);
  state.patterns = { total: ids.length, checked: ids.filter((id) => progress.patterns[id]?.stage === 'checked').length };
  const stamp = await readStamp(root);
  if (!stamp) return { ...state, tokens: 'never synced' };
  state.tokens = !stamp.tokens ? 'never synced' : stamp.tokens.hash === (await tokenPayload(root)).hash ? 'in sync' : 'changed since last sync';
  for (const { name, contract } of await loadContracts(root)) {
    const s = stamp.components?.[name];
    if (!s || !contract) continue;
    state.components.synced++;
    if (s.hash !== contractHash(contract, await mdOf(root, name))) state.components.stale.push(name);
  }
  return state;
}

const status = {
  name: 'status',
  group: 'project',
  summary: 'Show the prefix, brand summary, components by status, overrides and design sync state (read-only).',
  args: [],
  options: {},
  examples: ['sketchbook status', 'sketchbook status --json'],
  mutates: false,
  dryRun: false,
  // Narrower than CommandContext: the interactive menu runs it for its hints with no dispatch context.
  async run({ root, out, human }: Pick<CommandContext, 'root' | 'args' | 'options' | 'out' | 'human'>) {
    const config = await readJson<HarnessConfigJson>(root, 'harness.config.json');
    const brand = await readJson<BrandConfig>(root, 'brand.config.json');
    const registry = await readJson<ComponentRegistry>(root, 'spec/registry.json');
    const r = resolveBrand(brand);
    const byStatus: Record<string, number> = {};
    for (const c of registry.components) byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;
    const overrides = await listOverrides(root);
    const design = await designState(root, config);
    const data = {
      prefix: config.prefix,
      brand: { name: brand.name, primary: r.color.primary, font: brand.typography?.family ?? 'ui-sans-serif', modes: r.modes.map((m) => (m.name === m.role ? m.name : `${m.name} (${m.role})`)), spacingBase: r.spacing.base, radiusLg: r.radius.scale.lg, density: r.density.height, contrast: r.contrast.id, accents: Object.keys(r.color.accents) },
      components: { total: registry.components.length, byStatus },
      overrides: overrides.length,
      design,
    };
    if (human) {
      const ui = presentation(true);
      out(`${ui.section('Overview')}\n  ${data.brand.name}  ·  ${data.prefix}  ·  ${data.components.total} components\n`);
      out(`${ui.section('Brand')}\n  Primary ${data.brand.primary}  ·  ${data.brand.font}  ·  ${data.brand.modes.join(' / ')}\n  Spacing ${show(data.brand.spacingBase)}px  ·  Radius ${data.brand.radiusLg}px  ·  ${data.brand.contrast}\n`);
      out(`${ui.section('Health')}\n  ${Object.entries(byStatus).map(([s, n]) => `${n} ${s}`).join('  ·  ')}  ·  ${data.overrides} overrides\n  Design: ${design.tool ?? 'none'}${design.tool ? `  ·  tokens ${design.tokens}  ·  ${design.components.synced} synced${design.components.stale.length ? `  ·  stale: ${design.components.stale.join(', ')}` : ''}${design.patterns.total ? `  ·  ${design.patterns.checked}/${design.patterns.total} pattern docs checked` : ''}` : ''}`);
    } else {
    out(`Prefix: ${data.prefix}`);
    out(`Brand: ${data.brand.name} (primary ${data.brand.primary}, font ${data.brand.font}, modes ${data.brand.modes.join(', ')}, spacing ${show(data.brand.spacingBase)}px, radius ${data.brand.radiusLg}px, contrast ${data.brand.contrast})`);
    out(`Components: ${data.components.total} (${Object.entries(byStatus).map(([s, n]) => `${n} ${s}`).join(', ')})`);
    out(`Overrides: ${data.overrides}${data.overrides ? ' (spec/tokens/overrides.json)' : ''}`);
    out(`Design: ${design.tool ?? 'none'}${design.tool ? `, tokens ${design.tokens}, ${design.components.synced} component(s) synced${design.components.stale.length ? `, stale: ${design.components.stale.join(', ')}` : ''}${design.patterns.total ? `, ${design.patterns.checked} of ${design.patterns.total} pattern docs checked` : ''}` : ''}`);
    }
    const next = design.tokens === 'changed since last sync' || design.components.stale.length ? 'sketchbook sync tokens (or components <names>)' : 'sketchbook check';
    return { data, next };
  },
} satisfies Command;

export default status;
