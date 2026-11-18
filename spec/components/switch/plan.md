# Plan: Switch (planning gate)

Status: Approved under SB-0011 (owner pre-approval, 2026-11-08).

## Scope
`sb-switch`: native checkbox with `role="switch"` in the shadow root, Field horizontal layout, sizes default and sm. Form-associated.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` |
| 4 | `src/components/switch/Switch.ts`, `index.ts` |

## Test plan
Role switch with name, label click, Space toggles, thumb moves, sizes (matrix), required/error validity, input and change composed, focus ring, form value, reset, disabled, disabled fieldset, label for, axe.

## Accessibility deviations
- From the visual reference: track 3:1 (color.input), solid focus ring.
- Sizes: 20/16 px track heights instead of 18.4/14 (foundation scale).

## Open questions (recommendation first)
- aria-checked? No: native checkbox with role=switch exposes it; ARIA in HTML forbids aria-checked here.
- Semantic tokens added: `size.switch.width`, `height`, `width-sm`, `height-sm`, `space.switch.inset`.
