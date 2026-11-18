# Plan: Button Group (planning gate)

Status: Approved under SB-0011 (owner pre-approval, 2026-11-08).

## Scope
`sb-button-group` (orientation, role=group, aria-label), `sb-button-group-separator`, `sb-button-group-text`. Joined corners and borders for slotted `sb-button`, driven by `data-position` written on slotchange.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/button-group/ButtonGroup.stories.ts` |
| 2 | `playwright/tests/button-group/button-group.behavior.spec.ts` (written first, must fail) |
| 3 | `ButtonGroup.scss` -> `ButtonGroup.styles.ts` (one sheet for the three elements) |
| 4 | `ButtonGroup.ts`, `ButtonGroupSeparator.ts`, `ButtonGroupText.ts`, `index.ts` |

## Test plan (test-first)
- role=group named by aria-label; buttons still reachable by role and name.
- data-position and data-orientation on children, updated when children are added or removed; data-overlap after a separator is absent.
- Corner radii of the inner buttons per position, horizontal, vertical and RTL; shared border overlap for outline buttons.
- Separator is hidden from the accessibility tree and sized per orientation; text cell renders its content with token colors.
- Tab visits each button; the focused button is raised; axe clean.

## Accessibility deviations from the references
- None beyond the shared solid focus ring on the buttons themselves.

## Open questions (recommendation first)
- Q1 corners via `--sb-button-radius`. Q2 overlap by negative margin. Q3 no focus or selection. All answered.
