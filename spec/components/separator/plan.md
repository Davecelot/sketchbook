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
