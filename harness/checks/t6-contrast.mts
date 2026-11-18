import { tokensForMode, resolve, type Resolved, type Token, type TokenSet } from '../lib/tokens.mjs';
import { wcagRatio, apcaLc } from '../lib/color.mjs';
import { contrastOf } from '../standards/resolve.mjs';
import { listBrands, brandTokenSets, type BrandTokenSet } from '../commands/brand.mjs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { BrandConfig } from '../../generated/types/brand-config.js';
import type { BrandLinks } from '../generators/links.mjs';
import { errorMessage, parseJson } from '../lib/files.mjs';
import type { CheckContext, CheckIssue, CheckResult } from './types.mjs';

export const id = 'T6';
export const title = 'Declared color pairs meet contrast in every mode (and every brand)';

const RAMP = /^color\.([a-z]+)\.(\d+)$/;
const LINKS = 'spec/tokens/brand-links.json';

export interface ContrastCheckPair { fg: string; bg: string; kind?: string; source: string }
interface Evaluation { errors: CheckIssue[]; info: Record<string, unknown>[] }

// Every brand link's alsoOn surfaces are text pairs too (the link promises the text target on them), so
// contrast.json and the links can't drift apart. A foreground link's alsoOn constrains its solid, checked by that link.
export function linkPairs(root: string, declared: { fg: string; bg: string }[]): ContrastCheckPair[] {
  let links: BrandLinks = {};
  try { links = parseJson<{ links?: BrandLinks }>(readFileSync(join(root, LINKS), 'utf8')).links ?? {}; } catch { /* no links */ }
  const have = new Set(declared.map((p) => `${p.fg} on ${p.bg}`));
  const out: ContrastCheckPair[] = [];
  for (const [path, link] of Object.entries(links)) {
    if (link.from !== 'color' || link.part === 'foreground') continue;
    for (const bg of link.alsoOn ?? []) {
      if (have.has(`${path} on ${bg}`)) continue;
      have.add(`${path} on ${bg}`);
      out.push({ fg: path, bg, kind: 'text', source: LINKS });
    }
  }
  return out;
}

export function run({ root, all, brand, contrastPairs }: CheckContext): CheckResult {
  const pairs: ContrastCheckPair[] = [
    ...contrastPairs.map((p) => ({ ...p, source: 'spec/tokens/contrast.json' })),
    ...all.contracts.flatMap((c) => (c.contract?.accessibility?.contrast || []).map((p) => ({ ...p, source: c.file }))),
  ];
  pairs.push(...linkPairs(root ?? '.', pairs));
  const out = evaluate(all, brand, pairs);
  // Every brand in brands/ is held to the same pairs with its own foundation and links (SB-0047).
  const componentSet = all.sets.find((s) => s.layer === 'component');
  for (const b of listBrands(root ?? '.')) {
    if (!b.brand) continue;
    let sets: { sets: BrandTokenSet[]; modes: string[] };
    try { sets = brandTokenSets(root, b.brand, componentSet); } catch (e) { out.errors.push({ file: b.file, msg: `brand does not build: ${errorMessage(e)}`, fix: 'Fix the brand file (same schema as brand.config.json).' }); continue; }
    const r = evaluate({ sets: asTokenSets(sets.sets), modes: sets.modes }, b.brand, pairs);
    out.errors.push(...r.errors.map((e) => ({ ...e, brand: b.name, file: b.file, msg: `brand ${b.name}: ${e.msg}` })));
    out.info.push(...r.info.map((i) => ({ ...i, brand: b.name })));
  }
  return out;
}

// A brand's flat tokens carry their set's file, layer and mode, as loadAll's tokens do, so one resolver serves both.
const asTokenSets = (sets: BrandTokenSet[]): TokenSet[] => sets.map((s) => ({ ...s, tokens: s.tokens.map((t): Token => ({ ...t, file: s.file, layer: s.layer, mode: s.mode })) }));

function evaluate(all: { sets: TokenSet[]; modes: string[] }, brand: BrandConfig, pairs: ContrastCheckPair[]): Evaluation {
  const errors: CheckIssue[] = [];
  const info: Record<string, unknown>[] = [];
  const { targets, apca } = contrastOf(brand);
  for (const mode of all.modes) {
    const map = tokensForMode(all, mode);
    for (const p of pairs) {
      const fg = resolve(map, p.fg), bg = resolve(map, p.bg);
      if (fg.error || bg.error) { errors.push({ file: p.source, mode, token: `${p.fg} on ${p.bg}`, msg: `pair does not resolve (${fg.error ? p.fg : p.bg})`, fix: 'Fix the token names in the pair.' }); continue; }
      if (typeof fg.value !== 'string' || typeof bg.value !== 'string' || fg.value.length !== 7 || bg.value.length !== 7) {
        info.push({ mode, pair: `${p.fg} on ${p.bg}`, note: 'skipped: translucent or non-hex color' });
        continue;
      }
      const ratio = wcagRatio(fg.value, bg.value);
      const target = targets[p.kind ?? ''];
      const need = typeof target === 'number' ? target : undefined;
      const lc = apca ? Math.round(apcaLc(fg.value, bg.value) * 10) / 10 : undefined;
      info.push({ mode, pair: `${p.fg} on ${p.bg}`, kind: p.kind, ratio: Math.round(ratio * 100) / 100, need, apcaLc: lc });
      if (need !== undefined && ratio >= need) continue;
      errors.push({
        file: p.source, mode, token: `${p.fg} on ${p.bg}`,
        msg: `${ratio.toFixed(2)}:1 (${fg.value} on ${bg.value}), needs ${need}:1 for ${p.kind}`,
        fix: suggest(map, fg, bg.value, need) ?? 'Pick a foreground or background further apart in lightness.',
      });
    }
  }
  return { errors, info };
}

// Names the nearest step on the foreground's ramp that passes.
function suggest(map: Map<string, Token>, fg: Resolved, bgHex: string, need: number | undefined): string | null {
  const last = fg.chain.at(-1);
  const m = RAMP.exec(last ?? '');
  if (!m) return null;
  const [, hue, step] = m;
  const steps = [...map.keys()].map((k) => RAMP.exec(k)).filter((x) => x && x[1] === hue).map((x) => Number(x?.[2])).sort((a, b) => a - b);
  const passing = steps
    .map((s) => ({ s, hex: map.get(`color.${hue}.${s}`)?.value }))
    .filter((x): x is { s: number; hex: string } => typeof x.hex === 'string' && need !== undefined && wcagRatio(x.hex, bgHex) >= need)
    .sort((a, b) => Math.abs(a.s - Number(step)) - Math.abs(b.s - Number(step)));
  const [best] = passing;
  if (!best) return `No step of color.${hue} passes on ${bgHex}; change the background.`;
  return `Nearest passing step: color.${hue}.${best.s} (${best.hex}, ${wcagRatio(best.hex, bgHex).toFixed(2)}:1). Re-point the semantic token to it.`;
}
