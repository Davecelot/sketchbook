# Radius

Where it lives: `brand.config.json` → `radius` (a preset, or a base and steps in px; `style` is the older spelling of the preset). Generated: `spec/tokens/foundation/radius.tokens.json` (`radius.none`, `xs` … `xl`, `full`). Semantic: `radius.xsmall`, `radius.small`, `radius.control`, `radius.surface`, `radius.large`, `radius.pill` in `spec/tokens/semantic/base.tokens.json`. Storybook: `Foundations/Radius`.

## Decisions to make (guided order)
1. **Overall style.** Recommended: soft (the default, about 10px on surfaces) for most products. Sharp reads technical and dense; round reads friendly and consumer.
2. **Controls vs surfaces.** Recommended: controls one step smaller than the surfaces that hold them (that is what `radius.control` vs `radius.surface` is for).
3. **Nested corners.** Recommended: inner radius = outer radius minus the padding between them, so nested corners look parallel.
4. **Pills.** Recommended: only for badges, tags and toggles that are meant to look like chips; not for every button.

## Options (`sketchbook tokens presets radius` is authoritative)
From a base r: xs = r-6, sm = r-4, md = r-2, lg = r, xl = r+4 (never below 0), plus none and full.

| Preset id | What it is | Pick it when | Source |
| --- | --- | --- | --- |
| `radius: sharp` | Base 2: xs–xl 0, 0, 0, 2, 6 px | Technical tools, dense data | our default set |
| `radius: soft` (default) | Base 10: xs–xl 4, 6, 8, 10, 14 px | General product UI | [shadcn/ui theming](https://ui.shadcn.com/docs/theming) |
| `radius: round` | Base 16: xs–xl 10, 12, 14, 16, 20 px | Consumer, friendly tone | our default set |
| `radius: pill-heavy` | Soft surfaces (base 10) with fully rounded controls | A brand built on chips and pills | our default set |

## Not in the catalog yet
- **Tailwind's** named steps (2, 4, 6, 8, 12, 16, 24, 32 px and full; [tailwindcss.com/docs/border-radius](https://tailwindcss.com/docs/border-radius)) and **Material shape families** (0 to 48 px; [Material shape](https://raw.githubusercontent.com/material-components/material-components-android/master/docs/theming/Shape.md)). Closest: the presets above.
- **Exact numbers from a brand guide**: change the base (`sketchbook tokens set radius.base 12`, which recomputes every step), one step (`sketchbook tokens set radius.scale.lg 12`), or write `{ "custom": { "base": 12 } }` under `radius` in `brand.config.json`.

## Accessibility limits
- Radius does not change contrast, but very round small controls can hide the focus ring's corners; check the ring still shows clearly (3:1, at least 2px) on every shape.
- Large radii on small checkboxes make them look like radios: keep the checkbox square-ish (it uses `radius.xsmall`).

## Commands
```sh
sketchbook tokens presets radius
sketchbook tokens preset radius round --dry-run
sketchbook tokens set radius.scale.lg 12 --dry-run
sketchbook tokens impact radius.control
```
Run `sketchbook help tokens` to confirm options and key names.

## Guarded by
T1, T2, T7 (links and interface), T5 (no literal radii in component CSS), G1.

## Realizations that update
`generated/css/tokens.css`, every component's corners, behavior specs that read radius from tokens, Storybook `Foundations/Radius`, Figma radius variables (`/sync tokens`).

## Roast questions
- Do nested radii subtract the padding, or do inner corners look thicker?
- Why do buttons and inputs differ (or why don't they)?
- Is "pill" used because it means something, or because it was the default?
- Does the radius match the brand's other touchpoints (marketing site, app icon)?
