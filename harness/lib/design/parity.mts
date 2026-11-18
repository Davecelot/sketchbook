// Figma <-> code parity of one component, through the contract's tokens: every token the library model binds must be a
// CSS variable the component's styles use (nothing is drawn that Storybook does not style), and the tokens the styles
// use that the design file does not draw are listed. Typography and motion are applied by styles, not bound.
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ComponentContract } from '../../../generated/types/contract.js';
import type { HarnessConfigJson } from '../../../generated/types/harness-config.js';
import { libraryModel } from './library.mjs';
import type { LayerNode } from './library.mjs';
import { parseJson, readJsonSync } from '../files.mjs';
import { loadApi, withSets } from '../api.mjs';
import { loadIcons } from '../icons.mjs';
import { SCALE_BINDINGS } from './recipes.mjs';

export interface Parity { layersNotInAnatomy: string[]; anatomyNotDrawn: string[]; bound: string[]; notInCss: string[]; notDrawn: string[] }

const BY_STYLE = /(^|\.)(font-family|font-size(?:-[a-z]+)?|font-weight|line-height|letter-spacing|(?:[a-z]+-)?duration|(?:[a-z]+-)?easing)$/;
const walk = (n: LayerNode): LayerNode[] => [n, ...(n.kids ?? []).flatMap(walk)];

export async function parityOf(root: string, name: string): Promise<Parity | null> {
  const prefix = readJsonSync<Partial<HarnessConfigJson>>(join(root, 'harness.config.json'), {})?.prefix ?? 'sb';
  const icons = loadIcons(root).icons;
  const api = loadApi(root);
  const models = await Promise.all(withSets(api, [name]).map((n) => libraryModel(root, n, { iconFor: () => 'circle', iconSet: (i) => (icons[i] ? i : null) })));
  const nodes = models.flatMap((L) => L.variants.flatMap((v) => walk(v.tree)));
  const explained = api?.layers ?? {};
  const contract = parseJson<ComponentContract>(await readFile(join(root, 'spec/components', name, 'contract.json'), 'utf8'));
  const dir = join(root, 'src/components', name);
  const files = (await readdir(dir).catch(() => [])).filter((f) => f.endsWith('.styles.ts'));
  if (!files.length) return null;
  const css = (await Promise.all(files.map((f) => readFile(join(dir, f), 'utf8')))).join('\n');
  const used = new Set([...css.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]));
  const cssVar = (t: string) => `--${prefix}-${t.replace(/\./g, '-')}`;
  const bound = [...new Set(nodes.flatMap((n) => n.b.map(([t]) => t)))].filter((t): t is string => typeof t === 'string' && !t.startsWith('text-style.')).sort();
  const anatomy = new Set([...(contract.anatomy ?? []), ...(contract.elements ?? []).flatMap((e) => e.anatomy ?? [])].map((a) => a.name));
  const hidden = new Set((contract.anatomy ?? []).filter((a) => /visually hidden/i.test(a.notes ?? '')).map((a) => a.name));
  // A layer under a design option is explained by that option's reason (contract $extensions).
  // A slot is explained by its region, and what it holds is a sample the person replaces.
  const outsideSlots = (n: LayerNode): LayerNode[] => (n.slot ? [] : [n, ...(n.kids ?? []).flatMap(outsideSlots)]);
  const layers = new Set(models.flatMap((L) => L.variants.flatMap((v) => outsideSlots(v.tree))).filter((n) => !n.ex && !n.opt).map((n) => n.p));
  return {
    layersNotInAnatomy: [...layers].filter((l) => !anatomy.has(l) && !explained[`${name}.${l}`]).sort(),
    anatomyNotDrawn: (contract.anatomy ?? []).map((a) => a.name).filter((a) => !layers.has(a) && !nodes.some((n) => n.part === a) && !hidden.has(a)).sort(),
    bound,
    notInCss: bound.filter((t) => !used.has(cssVar(t)) && !(SCALE_BINDINGS[name] ?? []).includes(t)),
    notDrawn: Object.keys(contract.tokens ?? {}).filter((t) => used.has(cssVar(t)) && !bound.includes(t) && !BY_STYLE.test(t)).sort(),
  };
}
