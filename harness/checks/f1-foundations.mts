import { tokensForMode, resolve } from '../lib/tokens.mjs';
import { resolveBrand, TYPE_STEPS, type ResolvedBrand } from '../standards/resolve.mjs';
import type { CheckContext, CheckIssue, CheckResult } from './types.mjs';

export const id = 'F1';
export const title = 'Foundations follow their declared standard (warnings)';

// Warnings only: a team may deliberately step off a standard; the warning names the trade-off and the fix.
const AA: Record<string, number> = { text: 4.5, 'large-text': 3, ui: 3 };
const MIN_TEXT_PX = 12;
const MIN_BODY_LEADING = 1.5;
const px = (v: unknown): number | null => (typeof v === 'string' && /^-?\d*\.?\d+px$/.test(v) ? parseFloat(v) : typeof v === 'string' && /rem$/.test(v) ? parseFloat(v) * 16 : null);

export function run({ all, brand, css }: CheckContext): CheckResult {
  const warnings: CheckIssue[] = [];
  let r: ResolvedBrand;
  try { r = resolveBrand(brand); } catch { return { warnings }; } // T1/G1 report a broken brand.config
  const map = tokensForMode(all, all.modes[0] ?? null);
  const value = (path: string): unknown => { const x = resolve(map, path); return x.error ? undefined : x.value; };
  const foundation = all.sets.filter((s) => s.layer === 'foundation').flatMap((s) => s.tokens);
  const semantic = all.sets.filter((s) => s.layer === 'semantic' && !s.mode).flatMap((s) => s.tokens);

  // Spacing: every space value sits on the grid (multiples of the base, or of the half step the presets declare).
  const base = Number(r.spacing.base);
  const half = base / 2;
  for (const t of foundation.filter((x) => x.path.startsWith('space.'))) {
    const raw = t.value;
    if (typeof raw !== 'string') continue;
    const v = px(raw);
    if (v !== null && Math.abs(v / half - Math.round(v / half)) > 1e-6) warnings.push({ file: t.file, token: t.path, msg: `${raw} is off the ${base}px grid (multiples of ${base}px, half steps of ${half}px)`, fix: `Use steps that land on the grid in brand.config.json spacing (sketchbook tokens presets spacing), or record why this value stays.` });
  }

  // Type scale: sizes grow with the step, and text people read is never below 12px.
  const sizes = TYPE_STEPS.map((s) => ({ s, v: px(value(`font.size.${s}`)) })).filter((x): x is { s: string; v: number } => x.v !== null);
  for (let i = 1; i < sizes.length; i++) {
    const cur = sizes[i], prev = sizes[i - 1];
    if (cur && prev && cur.v <= prev.v) warnings.push({ file: 'spec/tokens/foundation/typography.tokens.json', token: `font.size.${cur.s}`, msg: `type scale is not monotonic: ${cur.s} ${cur.v}px <= ${prev.s} ${prev.v}px`, fix: 'Choose a type scale whose steps grow (sketchbook tokens presets typeScale), or fix typography.scale custom sizes.' });
  }
  for (const t of semantic.filter((x) => /^font\.size\.(body|control|caption|label)/.test(x.path))) {
    const v = px(value(t.path));
    if (v !== null && v < MIN_TEXT_PX) warnings.push({ file: t.file, token: t.path, msg: `${t.path} resolves to ${v}px, below ${MIN_TEXT_PX}px for body and control text`, fix: `Point ${t.path} at a size of at least ${MIN_TEXT_PX}px, or raise typography.baseSize / pick a flatter scale (the ratio pushes the small steps down).` });
  }

  // Body line height: at least 1.5 (WCAG 1.4.12 text spacing; comfortable reading).
  for (const t of semantic.filter((x) => x.path === 'font.line-height.body')) {
    const v = value(t.path);
    if (typeof v === 'number' && v < MIN_BODY_LEADING) warnings.push({ file: t.file, token: t.path, msg: `body line height ${v} is below ${MIN_BODY_LEADING}`, fix: 'Point font.line-height.body at a line height of 1.5 or more (sketchbook tokens presets lineHeight).' });
  }

  // Motion: components that animate honor prefers-reduced-motion (the media query or the respect-reduced-motion mixin).
  const hasMotion = foundation.some((t) => t.type === 'duration' && parseFloat(String(t.value)) > 0);
  if (hasMotion) {
    for (const sheet of css) {
      if (!sheet.ast) continue;
      const text = sheet.ast.toString();
      if (/\b(transition|animation)(-[a-z]+)?\s*:/.test(text) && !/reduced-motion/.test(text)) warnings.push({ file: sheet.file, msg: 'animates (transition or animation) with no reduced-motion handling', fix: 'Add @include respect-reduced-motion (src/styles/_a11y.scss) or an @media (prefers-reduced-motion: reduce) block.' });
    }
  }

  // Contrast standard: not weaker than WCAG AA.
  for (const [kind, need] of Object.entries(AA)) {
    const got = r.contrast.targets[kind];
    if (typeof got === 'number' && got < need) warnings.push({ file: 'brand.config.json', token: `contrast.${kind}`, msg: `contrast target for ${kind} is ${got}:1, weaker than WCAG AA (${need}:1)`, fix: 'Use the wcag-aa or wcag-aaa preset (sketchbook tokens preset contrast wcag-aa) and drop the lowered targets.' });
  }
  return { warnings };
}
