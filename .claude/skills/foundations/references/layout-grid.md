# Layout grid and breakpoints

Where it lives: `brand.config.json` → `grid` (columns, gutter, margin) and `breakpoints` (widths in px). Generated: `spec/tokens/foundation/grid.tokens.json` (`grid.columns`, `grid.gutter`, `grid.margin`, breakpoints). Semantic: `layout.grid.columns|gutter|margin` in `spec/tokens/semantic/base.tokens.json`. Storybook: `Foundations/Layout grid`.

## Decisions to make (guided order)
1. **Breakpoints.** Recommended: choose them where your content breaks (a table stops fitting, a form gets too wide), not from device lists. Start from a preset and move the ones that don't fit.
2. **Columns.** Recommended: 12 on wide screens, 4 on phones, 8 in between. Ask whether 12 is needed or just habit: many product layouts only use a sidebar and a content area.
3. **Gutter and margin.** Recommended: on the spacing grid (24px gutter and margin by default, 16px on small screens).
4. **Max content width.** Recommended: cap reading text at about 70 characters per line; let data tables use the full width.

## Options (`sketchbook tokens presets layout-grid` lists the grid; `sketchbook tokens presets breakpoints` lists the breakpoints)
Two families: the page grid (config key `grid`) and the breakpoints (config key `breakpoints`, none by default).

| Preset id | What it is | Pick it when | Source |
| --- | --- | --- | --- |
| `layoutGrid: 12-col` (default) | 12 columns, 24px gutter, 24px margin: divides into halves, thirds and quarters | Most web apps | [getbootstrap.com grid](https://getbootstrap.com/docs/5.3/layout/grid/) |
| `layoutGrid: 16-col` | 16 columns, 32px gutter, 16px margin, on an 8px rhythm | Wide, data-dense layouts | [carbondesignsystem.com 2x grid](https://carbondesignsystem.com/elements/2x-grid/overview/) |
| `breakpoints: tailwind` | 640, 768, 1024, 1280, 1536 px | Familiar steps, web apps | [tailwindcss.com/docs/responsive-design](https://tailwindcss.com/docs/responsive-design) |
| `breakpoints: bootstrap` | 0, 576, 768, 992, 1200, 1400 px | Teams moving from that ecosystem | [getbootstrap.com breakpoints](https://getbootstrap.com/docs/5.3/layout/breakpoints/) |

## Not in the catalog yet
- **Carbon's 2x breakpoints** (320 / 672 / 1056 / 1312 / 1584 px with 4, 8 and 16 columns; [carbondesignsystem.com 2x grid](https://carbondesignsystem.com/elements/2x-grid/overview/)): there is no per-breakpoint column count. Closest: `layoutGrid: 16-col` for the grid, plus your own breakpoint widths.
- **Breakpoints placed by content** (three steps where your layouts actually break): write them under `breakpoints` in `brand.config.json` as `{ "custom": { "sm": 600, "md": 900, "lg": 1200 } }`, or start from a preset and change one with `sketchbook tokens set breakpoints.md 900`.

## Accessibility limits
- Content reflows at 320 CSS px width without two-dimensional scrolling (except data tables, maps, diagrams) ([WCAG 1.4.10 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)).
- Zoom to 200% must not lose content or function ([WCAG 1.4.4](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html)); breakpoints in rem (or px converted) respond to zoom.
- Visual order follows reading and focus order when columns stack ([WCAG 1.3.2](https://www.w3.org/WAI/WCAG22/Understanding/meaningful-sequence.html)).

## Commands
```sh
sketchbook tokens presets layout-grid
sketchbook tokens preset layout-grid 16-col --dry-run
sketchbook tokens set grid.gutter 24 --dry-run
sketchbook tokens impact layout.grid.gutter
```
Run `sketchbook help tokens` to confirm options and key names.

## Guarded by
F1 (gutter and margin on the spacing grid), T1, T2, T7, G1.

## Realizations that update
`generated/css/tokens.css`, template kits that lay out pages (`src/patterns/`), Storybook `Foundations/Layout grid`, Figma grid variables (`/sync tokens`).

## Roast questions
- Were breakpoints chosen from content or copied from devices?
- Is the grid 12 columns by habit?
- Are gutters and margins on the spacing grid?
- Does any page still scroll sideways at 320px?
