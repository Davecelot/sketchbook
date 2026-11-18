# Plan: Progress (planning gate)

Status: Approved under SB-0011 (owner pre-approval, 2026-11-08).

## Scope
`sb-progress` with `value`, `max`, `label`, determinate and indeterminate modes. Out of scope: visible percentage text, circular variant, paused/error states.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/progress/Progress.stories.ts` |
| 2 | `playwright/tests/progress/progress.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/progress/Progress.scss` -> `Progress.styles.ts` (generated) |
| 4 | `src/components/progress/Progress.ts`, `index.ts` |

## Test plan (test-first)
- Role, name from label, aria-valuemin/max/now; custom max; clamping.
- Fill width follows value/max; indeterminate has no aria-valuenow and animates; reduced motion stops it.
- aria-label and aria-labelledby from the page name the bar; one-time missing-name warning.
- Height, radius and colors from tokens; axe.

## Accessibility deviations from the references
None.

## Open questions (recommendation first)
All three answered with the recommendation: role on the host; no visible text; sliding segment for indeterminate.
