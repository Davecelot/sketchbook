# Screenshots: one approved output (2026-11-10, Guide, Components Surfaces, Library, Theme matrix retaken and Patterns added 2026-11-11)

A visual reference of well-organized documentation, captured after the person approved every page (35 of 35 components `checked`, decisions SB-0089 to SB-0093). It is **one output** of the method in `../working-method.md`, rendered with the default brand in Light mode. Another team's brand, page list or starting file will look different; what should carry over is the organization below, not the colors or the content.

Overviews are downscaled (a page is up to 10,000 px wide); read the details from `detail/`.

## Pages, in file order

| File | Page | What to look for |
|---|---|---|
| `01-guide.png` | Guide | Cover with inset header; page list (each line links to its page); variable collections; how to switch themes; last token sync date, no hash, no repo paths |
| `02-foundations.png` | Foundations | One doc per foundation (Color, Typography, Spacing, Radius, Elevation, Other), left to right, the same shell as every doc |
| `03-icons.png` | Icons | The icon sets in one grid frame |
| `04-components-actions.png` | Components · Actions | Pages named by role; one doc per component (Button, ButtonGroup) |
| `05`–`10` | The other Components pages | Docs left to right in batch order, 48 px apart, top-aligned; sections in a fixed order |
| `11-library.png` | Library | Every component set in one "Component library" frame, the source of every instance in the docs |
| `12-theme-matrix.png` | Theme matrix | One row per set, a Live column and the corner combinations of Mode x Shape x Density; every cell wide enough for its widest variant |
| `13-patterns.png` | Patterns | One doc per pattern kit (sign-in, onboarding, profile, settings, form states, docs article, data table, dashboard), left to right; each state a screen composed of library instances, then Components, Landmarks and Accessibility; the Data table and Dashboard are the longest |

## Details (`detail/`, Button unless noted)

| File | Shows |
|---|---|
| `doc-header.png` | The header inset 8 px inside the doc, concentric corners (14 outside, 6 inside), the fixed line "Auto-generated from the agnostic framework" |
| `doc-variants-grid.png` | Variants: look axes at rest, row and column heads, "not available" cells kept so the grid stays a grid |
| `doc-states-grid.png` | States: Rest, then each state, then Disabled, per variant |
| `doc-anatomy-tree.png` | Anatomy (Checkbox): frameless tree, the outer node is the container, radius steps down per level, pills untouched |
| `doc-accessibility.png` | Rule/Contract table with the rules highlighted, then the real source with `role`/`aria-*` highlighted by `code.highlight` |
| `doc-tokens.png` | Token pills grouped by kind, color pills with a dot bound to the component variable |
| `foundation-color.png` | A foundation doc: ramps, semantic roles, contrast pairs |

## Refreshing

Retake after a change that alters the organization (not after every sync): `get_screenshot` on each page id and on the detail nodes, saved under the same names. Keep this set small; it is a reference, not a record of the file.
