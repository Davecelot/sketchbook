# Border width

Where it lives: `brand.config.json` → `border` (a preset, or fine overrides of single steps in px, `{ "2": 1.5 }`). Generated: `spec/tokens/foundation/border.tokens.json` (`border.width.0` … `border.width.3`). Semantic: `border-width.default|quote|thick|indicator` and `focus.ring.width|offset` in `spec/tokens/semantic/base.tokens.json`. Storybook: `Foundations/Border width`.

## Decisions to make (guided order)
1. **Hairline.** Recommended: 1px for every control and surface border (`border-width.default`). Below 1px renders unevenly across screens.
2. **Emphasis.** Recommended: 2px for selected or active indicators (tabs, block quotes): `border-width.thick`, `border-width.indicator`, `border-width.quote`.
3. **Focus ring.** Recommended: 3px (`focus.ring.width`), with no offset by default. The ring must stay visible on every surface and shape; at least 2px.
4. **Borders or shadows?** Decide with [elevation.md](elevation.md): borders for things that sit on the page, shadows for floating layers. A flat elevation preset leans on borders, so they must reach 3:1 where they identify a control.

## Options (`sketchbook tokens presets border` is authoritative; the family is called borderWidth)
| Preset id | What it is | Pick it when | Source |
| --- | --- | --- | --- |
| `borderWidth: standard` (default) | 0, 1, 2, 3 px: hairline, emphasis and a 3px focus ring | Always; it is the only preset | [Atlassian design tokens](https://atlassian.design/components/tokens/all-tokens) |

Changing one step is a fine override on top of the preset: `sketchbook tokens set border.3 2` thins the focus ring and anything else on `border.width.3`; `sketchbook tokens set border.4 4` adds a step.

## Not in the catalog yet
- **Heavier systems** (2px default borders, as some high-contrast or playful brands use). Re-point `border-width.default` instead of changing `border.width.1`, so "1" keeps meaning one pixel: `sketchbook tokens impact border-width.default` first, then edit `spec/tokens/semantic/base.tokens.json`.
- **Sub-pixel hairlines** (0.5px on dense screens). Not recommended: they disappear at 100 % zoom on standard displays.

## Accessibility limits
- A border that identifies a control (input, checkbox, radio) needs 3:1 against what is next to it ([WCAG 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)); width does not compensate for a light border color.
- The focus indicator must be clearly visible: at least 2px thick around the control is the AAA guidance ([WCAG 2.4.13 Focus Appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html)); `focus.ring.width` at 3px meets it.
- In forced-colors mode borders become `CanvasText`: a control drawn by background alone vanishes, so keep a border (even transparent) on every control.
- Thicker selected-state borders must not shift layout (use `inset` box-shadow or keep the width constant).

## Commands
```sh
sketchbook tokens presets border
sketchbook tokens preset border standard --dry-run
sketchbook tokens set border.3 2 --dry-run
sketchbook tokens impact border-width.default
sketchbook tokens impact focus.ring.width
```
Run `sketchbook help tokens` to confirm options and key names.

## Guarded by
T5 (no literal lengths in component CSS where a token exists), T1, T2, T7 (`border-width.*` and `focus.ring.*` are interface tokens), G1, T6 for the border colors (contract pairs of kind `ui`).

## Realizations that update
`generated/css/tokens.css` (`--sb-border-width-*`, `--sb-focus-ring-width`), every control's outline and focus ring, separators and tab indicators, Storybook `Foundations/Border width`, Figma border-width variables (`/sync tokens`).

## Roast questions
- Is the focus ring at least 2px and visible on the brand color, the card and the dark background?
- Do input and checkbox borders reach 3:1, or only look fine on a good screen?
- Does any component write `1px solid` instead of `border-width.default`?
- Does a selected tab or toggle change its border width and make the layout jump?
- Is "thick" used for meaning (selected, quote) or for decoration?
