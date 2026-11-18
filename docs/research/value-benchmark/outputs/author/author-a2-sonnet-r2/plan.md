# Plan: Switch (planning gate)

Status: **draft**. Tests and code start only after approval (planning gate, then test-first). No approver was available when this was written; the open questions below were answered with their recommendations and recorded in the contract and in SB-0101. Approval of the plan is still pending.

## Scope

`sb-switch`: a form-associated on/off toggle (shared form-associated mixin, native checkbox input with role switch as the validation anchor) with label, description, error message and sizes small and medium. Only the spec exists today; no component code is written.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` |

## Test plan (test-first)

Stories: size by selected; description; error; required; disabled; in a form; in a disabled fieldset; right-to-left.

Behavior spec (real browser):
- Space toggles; Enter does not; click on the label toggles; Tab skips a disabled switch.
- `input` then `change` fire once per user toggle and not for code or reset changes.
- Form submission contains `name=value` when on and nothing when off; no name, nothing.
- Form reset restores the initial `selected`, with no events.
- A disabled fieldset disables it and re-enabling restores it, with the `disabled` prop unchanged; it is not submitted.
- Required and off: `checkValidity()` is false with `valueMissing`; on: true; `reportValidity` focuses the control.
- Form state restore sets `selected`.
- Accessible name from label, slot, aria-label; role switch and checked state; describedby covers description and error; aria-invalid with `validation=error`.
- Focus-visible ring on keyboard focus only; target at least 24 by 24.

## Accessibility deviations from the references

None intended. Following the APG, Space toggles and Enter is left to implicit form submission. shadcn/ui draws the switch without a built-in description or error; those are additions, using the same field layout as Checkbox.

## Open questions (recommendation first)

All answered with the recommendation; see `contract.json` openQuestions Q1 to Q7.
1. Prop name: `selected` (not `checked`).
2. `validation` author-controlled, not automatic.
3. Sizes `small` and `medium`.
4. Reset returns to the initial attribute, no events.
5. Space only, not Enter.
6. Content column after the control.
7. Events `input` and `change` only.
