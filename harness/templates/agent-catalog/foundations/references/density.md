# Density

Where it lives: `brand.config.json` → `density` (compact, comfortable, spacious, or a custom set). It drives control heights, paddings, gaps and the control font size through brand links. Generated: `spec/tokens/foundation/size.tokens.json` steps it points at. Semantic: `size.control.sm|default|lg`, `space.control.*`, `font.size.control` in `spec/tokens/semantic/base.tokens.json`, linked in `spec/tokens/brand-links.json`. Storybook: `Foundations/Density`.

## Decisions to make (guided order)
1. **Default density.** Recommended: comfortable (36px default control). Compact (32px) for data-heavy desktop tools; spacious (40px) for touch-first or occasional users.
2. **One global setting or per area?** Recommended: one global setting. A per-component or per-page switch doubles the testing surface; add it only when a real screen needs it.
3. **What scales with density?** Recommended: control height, horizontal padding and gaps together; keep font size unless compact needs 13–14px.

## Options (`sketchbook tokens presets density` is authoritative)
| Preset id | Control heights sm / default / lg | Pick it when | Source |
| --- | --- | --- | --- |
| `density: compact` | 28 / 32 / 36 px | Dense data, expert desktop users | our default set; [WCAG 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) sets the floor; names after [Primer](https://primer.style/product/primitives/token-names/) (condensed/normal/spacious) |
| `density: comfortable` (default) | 32 / 36 / 40 px | General product UI | our default set |
| `density: spacious` | 36 / 40 / 44 px | Touch, occasional or less confident users | our default set |

## Not in the catalog yet
- **Density through type size** (productive 14px vs expressive 16px type, as in [Carbon type sets](https://carbondesignsystem.com/elements/typography/type-sets/)). Density here moves control heights, paddings and gaps; type size is a separate foundation (`sketchbook tokens set typography.baseSize 14`, see [typography.md](typography.md)).
- **Your own heights**: `{ "custom": { "height": { "sm": 30, "default": 34, "lg": 38 } } }` under `density` in `brand.config.json` (accepted by `--dry-run`). Check the result against [spacing-grid.md](spacing-grid.md): F1 warns when a height is off the grid.

## Accessibility limits
- Targets at least 24×24px, or 24px of spacing around a smaller target ([WCAG 2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)). Compact must not go below this; `size.control.xs` (24px) is the floor.
- Touch-first products should aim at 44px ([WCAG 2.5.5, AAA](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html)).
- Denser is not smaller text: keep body text readable (see [typography.md](typography.md)).

## Commands
```sh
sketchbook tokens presets density
sketchbook tokens preset density compact --dry-run
sketchbook tokens impact size.control.default
```
Run `sketchbook help tokens` to confirm options.

## Guarded by
T7 (density links resolve: `size.control.*` must point at real size steps), F1 (control heights on the spacing grid), T2, G1; behavior specs read control heights, paddings and gaps from tokens, so they prove a density change.

## Realizations that update
`generated/css/tokens.css`, every control's height, padding and gap, behavior specs (heights read from tokens), Storybook `Foundations/Density`, Figma `Density` mode variables (`/sync tokens`).

## Roast questions
- Is compact still at least 24px for every pointer target?
- Is density a global switch or per component, and who tests both?
- Do heights, paddings and gaps move together, or does compact just squash text?
- Who are the users: experts at a desk, or people on phones?
