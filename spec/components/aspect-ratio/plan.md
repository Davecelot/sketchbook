---
stage: ready
basis: SB-0011
test-first: unverified (pre-record)
approved-by: Davecelot
approved-on: 2026-11-08
approved-contract: sha256:0d1c1a1c351846a02606fc421aa776bab63bc9b41283f56b5e7de2fb889cfd07
approved-plan: sha256:dd3573f750dc8e44f46a8820d22ea6dc1bb8045adfd11bbc49a771b815d623fd
---

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
