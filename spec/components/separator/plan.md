---
stage: ready
basis: SB-0011
test-first: unverified (pre-record)
approved-by: Davecelot
approved-on: 2026-11-08
approved-contract: sha256:e72bf8b5127941f5993172c5db9ef40e2fdec8dc867148299c680175d0129ea9
approved-plan: sha256:8eab3ce6c9d4e16884ea3c027304c7e6cf541bdf0c48f68a6df34174a618d685
---

# Plan: Separator (planning gate)

Status: Approved under SB-0011 (owner pre-approval, 2026-11-08).

## Scope
`sb-separator`: `orientation` and `decorative` (default true), role none or separator set on the host before first render. Out of scope: labelled separators (text in the middle).

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/separator/Separator.stories.ts` |
| 2 | `playwright/tests/separator/separator.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/separator/Separator.scss` -> `Separator.styles.ts` (generated) |
| 4 | `src/components/separator/Separator.ts`, `index.ts` |

No new semantic tokens.

## Test plan (test-first)
- Default: horizontal, decorative, role none, no separator in the accessibility tree.
- `decorative="false"` and property false: role separator; `aria-orientation` only when vertical.
- Role never wrong during first render; toggling updates the role.
- Horizontal 1px high full width; vertical 1px wide stretching a flex row; color and thickness from tokens.
- Not focusable; axe clean.

## Accessibility deviations from the references
None. Boolean default true is handled with a `"false"` attribute value (documented).

## Open questions (recommendation first)
Both answered in contract.json (decorative by default; no contrast pair).
