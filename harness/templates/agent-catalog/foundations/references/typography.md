# Typography

Where it lives: `brand.config.json` → `typography` (family, fallback, mono, font source, base size, scale, weights, line heights, letter-spacing). Generated: `spec/tokens/foundation/typography.tokens.json` (`font.family.*`, `font.size.*`, `font.weight.*`, `font.line-height.*`, `font.letter-spacing.*`) and `generated/css/fonts.css` from the font source. Semantic: `font.*` in `spec/tokens/semantic/base.tokens.json` (`font.size.body`, `font.size.control`, `font.size.heading-1` …). Storybook: `Foundations/Typography`.

## Decisions to make (guided order)
1. **Typeface and source.** Recommended: the system stack until the brand font is licensed; then load it from Google Fonts, a URL or local files (the font source writes `fonts.css`). Keep a sensible fallback list.
2. **Monospace face.** Recommended: the system monospace stack; change only if code is central to the product.
3. **Base size.** Recommended: 16px for reading. 14px suits dense tools for control text, not for paragraphs.
4. **Scale.** Recommended: the hand-tuned default for product UI (small steps at the bottom where UI lives). A modular ratio (`typeScale: minor-third` 1.2 or `typeScale: major-third` 1.25) suits content-heavy sites; above 1.25 headings grow fast.
5. **Weights.** Recommended: use as few as the product needs (the default ships five: 400 to 800; `weights: full` has nine). Each weight is a file to download, and 500 must look different from 400 at 14px in your font.
6. **Line heights.** Recommended: body 1.5; headings 1.2–1.25; or snap line heights to the spacing grid (16/24) if you work on a baseline.
7. **Letter-spacing.** Recommended: 0 for body; slight negative only on large headings, and only if the font survives it.

## Options (`sketchbook tokens presets typography` is authoritative; it lists four families)
Steps are named xs, sm, base, lg, xl, 2xl, 3xl, 4xl. A modular scale multiplies `typography.baseSize` by the ratio per step and rounds to even pixels.

| Preset id | What it is | Pick it when | Source |
| --- | --- | --- | --- |
| `typeScale: tailwind` (default) | Hand-picked sizes 12–36px, each with its own line height; ignores `baseSize` | Product UI; you want familiar steps | [tailwindcss.com/docs/font-size](https://tailwindcss.com/docs/font-size) |
| `typeScale: minor-second` | Ratio 1.067: steps are hard to tell apart | Dense data screens with few levels | [modularscale.com](https://www.modularscale.com/) |
| `typeScale: major-second` | Ratio 1.125 | Product UI with many text levels | [modularscale.com](https://www.modularscale.com/) |
| `typeScale: minor-third` | Ratio 1.2 | Balanced growth for most interfaces | [modularscale.com](https://www.modularscale.com/) |
| `typeScale: major-third` | Ratio 1.25 | Clear hierarchy without very large headings | [modularscale.com](https://www.modularscale.com/) |
| `typeScale: perfect-fourth` | Ratio 1.333; small steps get small fast | Content and marketing pages | [modularscale.com](https://www.modularscale.com/) |
| `typeScale: augmented-fourth` | Ratio 1.414: large jumps | Few levels; headings get huge | [modularscale.com](https://www.modularscale.com/) |
| `typeScale: perfect-fifth` | Ratio 1.5 | Editorial layouts | [modularscale.com](https://www.modularscale.com/) |
| `typeScale: golden` | Ratio 1.618, the largest common ratio | Display-heavy pages only | [modularscale.com](https://www.modularscale.com/) |
| `weights: standard` (default) | Five weights: 400, 500, 600, 700, 800 | Most products | [tailwindcss.com/docs/font-weight](https://tailwindcss.com/docs/font-weight) |
| `weights: full` | Nine weights, thin (100) to black (900) | Variable fonts | [tailwindcss.com/docs/font-weight](https://tailwindcss.com/docs/font-weight) |
| `lineHeight: standard` (default) | Body 1.5, headings 1.25 | Most products | [tailwindcss.com/docs/line-height](https://tailwindcss.com/docs/line-height) |
| `lineHeight: relaxed` | Body 1.625, headings 1.3; stays above the 1.5 that text-spacing settings must survive | Long reading | [WCAG 1.4.12](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html) |
| `letterSpacing: standard` (default) | Three steps: tight (-0.025em), normal, wide (0.025em) | Most products | [tailwindcss.com/docs/letter-spacing](https://tailwindcss.com/docs/letter-spacing) |
| `letterSpacing: tailwind` | Six steps, tighter (-0.05em) to widest (0.1em) | Display and label styles | [tailwindcss.com/docs/letter-spacing](https://tailwindcss.com/docs/letter-spacing) |

## Not in the catalog yet
Ideas from the research draft with no preset. Do not pass these ids to `tokens preset`; they do not exist.
- **Role-named type** (display, headline, title, body, label × L/M/S), as in [Material typography](https://raw.githubusercontent.com/material-components/material-components-android/master/docs/theming/Typography.md). Express the sizes you want with `{ "custom": { "sizes": { … } } }` (or a `sizes` list) under `typography.scale`; role names belong in the semantic layer (`font.size.heading-1` …).
- **A 14px productive set** with fixed headings ([Carbon type sets](https://carbondesignsystem.com/elements/typography/type-sets/)). Closest: `typography.baseSize` 14 with a modular preset such as `typeScale: major-second`, or `custom` sizes.
- **Steps that shrink on small screens** ([GOV.UK type scale](https://design-system.service.gov.uk/styles/type-scale/)) and **fluid scales** interpolated between two viewports ([utopia.fyi](https://utopia.fyi/)). Sizes here are static px; fluid type would be your own CSS on top.
- **A three-weight set** (400/500/700 or 300/400/600). The semantic layer aliases `font.weight.medium` and `font.weight.extrabold`, so a shorter set is refused until those semantic tokens are re-pointed (`sketchbook tokens impact font.weight.medium`).
- **Positive tracking on small text**: add a step on top of the preset: `sketchbook tokens set typography.letterSpacing.small 0.02em`.
- **A plain ratio** that is not in the list (say 1.3): `sketchbook tokens set typography.scale 1.3` (a number is a custom ratio).

## Accessibility limits
- Body text no smaller than 12px anywhere, and 16px for long reading (F1 warns below 12px).
- Body line-height at least 1.5 for paragraphs (F1 warns below 1.5); text must survive the user overriding spacing ([WCAG 1.4.12 Text Spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html)).
- Sizes in rem (or px converted to rem) so browser zoom and font settings work ([WCAG 1.4.4 Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html)).
- The scale must grow with each step (F1 rejects a non-monotonic scale).
- Large text for the 3:1 contrast rule means about 24px, or about 18.5px bold.

## Commands
```sh
sketchbook tokens presets typography
sketchbook tokens preset typography major-third --dry-run
sketchbook tokens set typography.family "Inter" --dry-run
sketchbook tokens set typography.baseSize 16 --dry-run
sketchbook tokens impact font.size.body
```
Run `sketchbook help tokens` to confirm options and key names.

## Guarded by
T1, T2 (semantic font tokens alias the foundation one step), T7 (links and interface), F1 (monotonic scale, body ≥ 12px, body line-height ≥ 1.5), G1, T5 (no literal font sizes in component CSS).

## Realizations that update
`generated/css/tokens.css`, `generated/css/fonts.css`, every component's text through `font.*`, Storybook `Foundations/Typography` (scale, weights, specimen), Figma text styles (`/sync tokens`)

## Roast questions
- Why this base size, and not 16px for reading?
- Does every step have a job, or would six steps do?
- Is the ratio too big for dense UI?
- Do display and body sizes share one ratio, and should they?
- Do line heights land on the spacing grid?
- How many font files ship, and is 500 distinguishable from 400 at 14px?
- Does the negative heading tracking survive your font?
