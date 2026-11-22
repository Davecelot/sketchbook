# Color

Where it lives: `brand.config.json` → `color` (primary, neutral, accents mapped to roles, ramp method). Generated: `spec/tokens/foundation/color.tokens.json` (`color.neutral.*`, `color.brand.*`, one ramp per accent). Semantic: `color.*` in `spec/tokens/semantic/light|dark.tokens.json`, linked by `spec/tokens/brand-links.json`. Storybook: `Foundations/Color`.

## Decisions to make (guided order)
1. **Primary color.** Recommended: keep the neutral default until the brand color is known; a near-black primary works for any brand. With a brand color, use the exact hex from the brand guide — the generator keeps it unchanged on one ramp step.
2. **Neutral tint.** Recommended: pure neutral (chroma 0), because it never clashes. A cool or warm tint (or the brand hue at very low chroma) gives character; check that the page background and card surfaces stay distinct in both modes.
3. **Status roles** (danger, success, warning, info). Recommended: give each its own hue; make sure info and primary are not the same blue by accident.
4. **Ramp method and steps.** Recommended: OKLCH perceptual with 11 steps (the default). Fewer steps are fine if every step has a job.
5. **Modes.** Recommended: light and dark, each tuned separately (dark is not the light ramp turned upside down).

## How a ramp is built (OKLCH perceptual method, the default)
Ramps are generated from one input color by `harness/generators/foundation.mts`, never hand-picked.
- **Lightness** follows a fixed ladder (`LADDER` in the generator), the same for every hue, so step 500 of red and step 500 of blue look equally heavy.
- **Chroma** follows a curve that peaks mid-ramp and tapers at both ends, so the lightest tints are not washed out and the darkest shades are not muddy.
- **Hue** stays the input hue.
- **Anchor:** the step whose ladder lightness is closest to the input keeps the exact input hex, so the brand color appears unchanged. The generator prints which step is the anchor.
- **Gamut:** colors outside sRGB are pulled in by lowering chroma only; lightness and hue are kept.
- **Foregrounds:** `primary-foreground` (and each status foreground) is white or near-black, whichever contrasts more with its background step (a brand link rule, `fg: readable`).
- Dark mode uses a different anchor step (the link names it), not the same color.
- **Muted text:** `color.muted-foreground` is a text link (`part: "text"`): per mode, the neutral step nearest the preferred one (500 light, 400 dark) that meets the contrast target on its `alsoOn` backgrounds. Delete its link in `brand-links.json` to own it by hand.

## Options (`sketchbook tokens presets color` lists both families and is authoritative)
Ramp methods (how one brand color becomes a ramp). Only `oklch` is implemented; the others are in the catalog for later and `tokens preset` refuses them.

| Preset id | What it is | Pick it when | Source |
| --- | --- | --- | --- |
| `rampMethods: oklch` (default) | Fixed lightness ladder, chroma curve, one hue; 11 steps 50–950; the step closest to the brand color keeps its exact hex | You want one rule for every hue | [oklch.com](https://oklch.com/) |
| `rampMethods: tailwind-11` (not implemented) | 11 hand-tuned steps 50–950 stored in OKLCH; cannot be derived from one color | You want steps people already know | [tailwindcss.com/docs/colors](https://tailwindcss.com/docs/colors) |
| `rampMethods: radix-12` (not implemented) | 12 steps, each with a job (backgrounds, borders, solids, text), with separate dark scales | You want the step number to say what it is for | [radix-ui.com colors](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale) |
| `rampMethods: m3-tonal` (not implemented) | Tones 0–100; roles point at tones per mode | You think in roles and tones | [Material color (Android docs)](https://raw.githubusercontent.com/material-components/material-components-android/master/docs/theming/Color.md) |
| `rampMethods: contrast-targeted` (not implemented) | Steps generated from target contrast ratios against a background | Contrast matters more than an even look | [leonardocolor.io](https://leonardocolor.io/) |

Neutral tint (the grey family under the page, borders and text), under `color.neutral`:

| Preset id | What it is | Pick it when | Source |
| --- | --- | --- | --- |
| `neutrals: neutral` (default) | Pure gray, no tint | It never clashes | [tailwindcss.com/docs/colors](https://tailwindcss.com/docs/colors) |
| `neutrals: slate` | Noticeably blue gray (hue 257, chroma 0.03) | Blue and violet brands | [tailwindcss.com/docs/colors](https://tailwindcss.com/docs/colors) |
| `neutrals: gray` | Lightly cool gray (hue 264, chroma 0.02) | A little cool character | [tailwindcss.com/docs/colors](https://tailwindcss.com/docs/colors) |
| `neutrals: zinc` | Almost neutral, faint cool cast (hue 286, chroma 0.01) | Nearly neutral with a hint | [tailwindcss.com/docs/colors](https://tailwindcss.com/docs/colors) |
| `neutrals: stone` | Faintly warm gray (hue 58, chroma 0.01) | Earthy and orange brands | [tailwindcss.com/docs/colors](https://tailwindcss.com/docs/colors) |

## Not in the catalog yet
- **A brand-tinted neutral** (the brand hue at very low chroma) has no preset, but needs none: set `color.neutral` hue and chroma yourself, for example `sketchbook tokens set color.neutral.hue 175` and `sketchbook tokens set color.neutral.chroma 0.015`, or edit `{ "hue": 175, "chroma": 0.015 }` in `brand.config.json`. The same works for any cool or warm tint.

## Accessibility limits
- Text pairs 4.5:1, large text and UI parts 3:1, in every mode (see [contrast.md](contrast.md)). A ratio of 4.499 fails.
- Never use color alone to carry meaning: danger, success and warning need an icon or words as well.
- The focus ring reaches 3:1 on every surface it can appear on.
- Light tints (50–200) are backgrounds, not text colors.

## Commands
```sh
sketchbook tokens presets color
sketchbook tokens set color.primary "#0F766E" --dry-run
sketchbook tokens set color.primary "#0F766E"
sketchbook tokens preset color slate --dry-run   # a neutral tint; ramp methods other than oklch are not implemented
sketchbook tokens add color.highlight --light "{color.neutral.200}" --dark "{color.neutral.800}" --pair color.foreground/color.highlight --dry-run
sketchbook tokens impact color.primary
sketchbook init --primary "#0F766E" --dry-run     # the original rebrand path, still valid
```
Run `sketchbook help tokens` to confirm options.

## Fixing a contrast failure (T6)
- The failure names the pair, its ratio, the target and the nearest passing step on the same ramp.
- Fix it in the semantic layer or the brand link: point the semantic token at the suggested step (`spec/tokens/semantic/<mode>.tokens.json`, or the link's step in `brand-links.json`), or pick a slightly darker or lighter brand color and regenerate.
- Do not fix it by editing `spec/tokens/foundation/color.tokens.json`. The generator would **keep** that edit as a flagged override (listed by `sketchbook tokens overrides list`, check exits 2) — it survives brand changes, but it no longer follows the method, so the next ramp is silently inconsistent. Prefer the semantic or config fix; if an override is truly needed, record why.
- Explain a deliberate departure from the default in the token's `$description` (as `color.input`, `color.ring` and `color.muted` do).

## APCA
`contrast.apca: true` reports APCA Lc next to each WCAG ratio, for information. Use it for small text: below about Lc 60, 14px body text reads weakly even when WCAG passes.

## Guarded by
T1 (valid tokens, no path that is both token and group), T3 (every semantic color exists in every mode), T6 (declared pairs meet contrast), T7 (brand links and interface tokens resolve), F1 (contrast target matches the declared standard), G1 (foundation = generator(config) + overrides).

## Realizations that update
`generated/css/tokens.css` (light and dark), every component through its semantic aliases, Storybook `Foundations/Color` (ramps, semantic tokens per mode, contrast ratios), Figma color variables with a `Mode` collection (`/sync tokens`).

## Roast questions
- Who checked every pair that is actually used for contrast, not just the 500 step?
- Is the ramp even to the eye, or does yellow jump next to blue?
- Does dark mode have its own anchors, or is it the light ramp reversed?
- Are info and primary the same blue by accident?
- Do you need 11 steps, or do five roles cover the product?
- Is any meaning carried by color alone?
