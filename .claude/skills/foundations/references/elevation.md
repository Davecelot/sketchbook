# Elevation

Where it lives: `brand.config.json` → `elevation` (a preset or custom shadow list). Generated: `spec/tokens/foundation/shadow.tokens.json` (`shadow.xs` … `shadow.lg`, DTCG shadow composites). Semantic: `elevation.xs|sm|md|lg` in `spec/tokens/semantic/base.tokens.json`. Storybook: `Foundations/Elevation`.

## Decisions to make (guided order)
1. **Shadows or borders?** Recommended: soft, short shadows for floating things (menus, popovers, dialogs) and borders for things that sit on the page (cards, inputs). Fully flat (borders only) is a valid style.
2. **How many levels?** Recommended: four (xs, sm, md, lg). Each level should mean something: resting, raised, floating, modal.
3. **Dark mode.** Recommended: shadows barely show on dark backgrounds; rely on a lighter surface step (card vs background) and a border, and keep shadows for floating layers.
4. **Elevation vs z-index.** Recommended: keep them independent; a higher shadow does not imply a higher layer (see [z-index.md](z-index.md)).

## Options (`sketchbook tokens presets elevation` is authoritative)
| Preset id | What it is | Pick it when | Source |
| --- | --- | --- | --- |
| `elevation: tailwind` (default) | Soft, single-layer shadows xs to lg that grow with height | Product UI, familiar look | [tailwindcss.com/docs/box-shadow](https://tailwindcss.com/docs/box-shadow) |
| `elevation: flat` | No shadows: layers separate by border and surface color only; works the same in dark mode | Dense tools, very flat brands | none (ours) |
| `elevation: layered-5` | Five levels xs to xl, each clearly separated; our own values, in the spirit of tonal elevation | You need more distinct floating levels | [m3.material.io elevation](https://m3.material.io/styles/elevation/overview) (inspiration only) |

## Not in the catalog yet
- **Tonal elevation** (levels 0–5 expressed as surface tint rather than shadow, as in [Material elevation](https://m3.material.io/styles/elevation/overview)). Shadows only here; for tint, point the semantic surface tokens at different neutral steps per level (`sketchbook tokens impact color.card`).
- **Your own shadows**: each is `[offsetY, blur, spread, alpha]` in px on black. Change one level on top of a preset with `sketchbook tokens set elevation.shadows.md "[4, 8, -2, 0.12]"`. A whole new set under `custom` must keep every level the semantic layer aliases (xs to lg), or the harness refuses it.

## Accessibility limits
- Never rely on a shadow alone to show that something is a separate surface or a control: a border or a surface color change is needed for people with low contrast sensitivity ([WCAG 1.4.11 Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) applies to the boundary of controls).
- In forced-colors mode shadows disappear; components must still show their edges (borders become `CanvasText`).

## Commands
```sh
sketchbook tokens presets elevation
sketchbook tokens preset elevation flat --dry-run
sketchbook tokens impact elevation.md
```
Run `sketchbook help tokens` to confirm options.

## Guarded by
T1 (shadow composites are valid DTCG), T2, T7, G1.

## Realizations that update
`generated/css/tokens.css`, menus, popovers, cards and dialogs through `elevation.*`, Storybook `Foundations/Elevation` (light and dark), Figma effect styles (`/sync tokens`).

## Roast questions
- What replaces shadows in dark mode: a surface tint, a border, nothing?
- Does every level have a job, or are there levels nobody uses?
- Is elevation tied to z-index by accident?
- Do cards need a shadow, or would a border do?
