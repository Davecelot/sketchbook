# Plan: Aspect Ratio (planning gate)

Status: Approved under SB-0011 (owner pre-approval, 2026-11-08).

## Scope
`sb-aspect-ratio`: `ratio` (number or `a/b`), one slotted child stretched to fill. No tokens (it draws nothing). Out of scope: cropping presets.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/aspect-ratio/AspectRatio.stories.ts` |
| 2 | `playwright/tests/aspect-ratio/aspect-ratio.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/aspect-ratio/AspectRatio.scss` -> `AspectRatio.styles.ts` (generated) |
| 4 | `src/components/aspect-ratio/AspectRatio.ts`, `index.ts` |

## Test plan (test-first)
- Default is square; width and ratio give the height (number, attribute, fraction form, property change).
- Invalid ratios fall back to 1.
- The slotted child fills the box exactly; tall content does not stretch the box.
- No role and no focus stop; the child keeps its name; axe clean.

## Accessibility deviations from the references
None.

## Open questions (recommendation first)
Both answered in contract.json (number or fraction; child fills, author picks object-fit).
