# Spacing and the baseline grid

Where it lives: `brand.config.json` → `spacing` (base unit and steps, or a preset). Generated: `spec/tokens/foundation/space.tokens.json` (`space.<step>` = step × base). Semantic: `space.*` in `spec/tokens/semantic/base.tokens.json` (`space.control.padding-x.*`, `space.control.gap.*`, `space.inset.*`, `space.stack.*`, `space.prose.*`). Storybook: `Foundations/Spacing`.

## Decisions to make (guided order)
1. **Base unit.** Recommended: 4px. It divides common type sizes (12, 16, 20, 24), line heights and control heights cleanly, and still allows small steps inside controls. Trade-offs below.
2. **Steps.** Recommended: the default list (0, 0.5, 1, 1.5, 2 … 16 × base). Remove steps nobody uses; add large ones only if layouts need 96px or more.
3. **Linear or growing?** Recommended: dense steps at the small end, growing gaps at the large end (4, 8, 12, 16, 24, 32, 48, 64). A purely linear scale runs out of useful large values.
4. **Baseline grid.** Recommended: off for product UI. Turn it on (line heights snapped to the base) for long-form reading or print-like layouts.
5. **Fluid spacing.** Recommended: no, unless typography is fluid too.

## Base unit trade-offs
| Base | Strengths | Costs | Fits |
| --- | --- | --- | --- |
| **2px** | Hairline control, any size reachable | Too many choices; teams drift to odd values; hard to see the rhythm | Icon and control internals only, as a half-step under 4 |
| **4px** (default) | Divides 12/16/20/24 type and 24–48 controls; fine enough inside controls | More steps to choose from than 8 | Most product UI |
| **5px** | Matches 15/20/25 line heights; easy mental math (×5) | Doesn't divide 16px type or 36px controls; fewer shared presets | Public-service and reading-first sites |
| **8px** | Fast, coarse, consistent; easy to see the rhythm | Too coarse inside controls (needs 4px half-steps anyway); 36px controls are off-grid | Layout-level spacing, marketing pages |
| **10px** | Decimal math, few steps | Doesn't divide 16px type or common controls; fights 4px-based fonts and icons | Rare; teams already on a decimal system |

Whatever the base, check: the smallest control height and the body line height must be multiples of it, or the grid is a fiction.

## Options (`sketchbook tokens presets spacing` is authoritative)
| Preset id | What it is | Pick it when | Source |
| --- | --- | --- | --- |
| `spacing: grid-4` (default) | One 4px unit; steps are multiples, with 2px half-steps | Product UI | [tailwindcss.com/docs/theme](https://tailwindcss.com/docs/theme) |
| `spacing: grid-8` | 8px unit, 4px half-steps: every default distance doubles | Coarser rhythm, layout-first | [Carbon 2x grid](https://carbondesignsystem.com/elements/2x-grid/overview/) (8px mini unit) |
| `spacing: grid-2` | 2px unit: the default step names give half the distances, and extra large steps are added | Dense tools that need hairline adjustments | [Carbon spacing](https://carbondesignsystem.com/elements/spacing/overview/) (2px step) |
| `spacing: grid-5` | 5px unit, in the spirit of public-service systems (line heights in multiples of 5); static, no responsive shrink | 5px base, reading-first | [GOV.UK spacing](https://design-system.service.gov.uk/styles/spacing/) |
| `spacing: grid-10` | 10px unit, 5px half-steps; our own, not taken from a published system | Teams that already think in tens | none |

Every preset keeps the same step names (`space.1`, `space.2` …) because the semantic layer aliases them; only the unit changes.

## Not in the catalog yet
Ideas from the research draft with no preset. Do not pass these ids to `tokens preset`; they do not exist.
- **A named, growing scale** such as Carbon's 2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 160 ([Carbon spacing](https://carbondesignsystem.com/elements/spacing/overview/)), Bootstrap's six steps 0, 4, 8, 16, 24, 48 ([Bootstrap spacing](https://getbootstrap.com/docs/5.3/utilities/spacing/)), or GOV.UK's 0, 5, 10, 15, 20, 25, 30, 40, 50, 60. Closest today: `spacing: grid-2`, `spacing: grid-4` or `spacing: grid-5`. A custom `{ "base": n, "steps": [...] }` must keep every step the semantic layer aliases (the harness refuses a scale that drops one), so a short scale needs the semantic tokens re-pointed first (edit `spec/tokens/semantic/base.tokens.json`, then `sketchbook tokens impact space.control.gap.default`).
- **Fluid space** interpolated between two viewports ([utopia.fyi](https://utopia.fyi/)). Spacing here is static px; a fluid scale would be your own CSS on top of the tokens.

## Accessibility limits
- Spacing must not shrink targets: interactive targets stay at least 24×24px ([WCAG 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)); see [density.md](density.md).
- Layouts must reflow at 320px width without horizontal scrolling ([WCAG 1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)): large fixed gaps are the usual culprit.
- Text spacing overrides (line height 1.5, paragraph spacing 2× font size) must not clip content.

## Commands
```sh
sketchbook tokens presets spacing
sketchbook tokens preset spacing grid-8 --dry-run
sketchbook tokens set spacing.base 4 --dry-run
sketchbook tokens impact space.control.gap.default
```
Run `sketchbook help tokens` to confirm options.

## Guarded by
F1 (semantic space tokens and control heights land on the declared grid; warnings name the off-grid token), T5 (no literal lengths in component CSS where a token exists), T7 (links and interface), T2, G1.

## Realizations that update
`generated/css/tokens.css`, every component's padding and gaps through `space.*`, behavior specs that read paddings and gaps from tokens, Storybook `Foundations/Spacing`, Figma spacing variables (`/sync tokens`).

## Roast questions
- Why this base? What are the smallest control height and body line height, and does the base divide them?
- Is there a half-step below 4px, and is it actually used?
- Is the scale linear and running out at the large end?
- Do component paddings reference semantic space tokens, or raw numbers?
- Are there near-duplicate semantic steps (two names for 8px)?
