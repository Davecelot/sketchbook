# Plan: Switch (planning gate)

Status: **draft**. Tests and code start only after approval (planning gate, then test-first). No approver was available in the authoring session; every open question took its recommended answer.

## Scope

In: sb-switch, form-associated through `src/mixins/form-associated.ts`, with the props, events, states and tokens in contract.json. Out: indeterminate, readOnly, a switch group, any implementation in this step.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` |

## Test plan (test-first)

- Keyboard: Tab reaches it, Space toggles, Enter does not, disabled is skipped.
- Pointer: clicking the track or the label toggles.
- Events: `input` then `change` on user toggle; none when `selected` is set from code.
- Form: FormData has `name=value` while on and nothing while off; unnamed submits nothing; reset restores the initial state; a disabled fieldset disables it and re-enabling restores it without touching the `disabled` attribute.
- Validation: `required` and off gives `valueMissing`, `checkValidity()` false, `invalid` event sets the error look; turning on clears it.
- ARIA: role, `aria-checked`, `aria-describedby` for description and error, `aria-invalid`, missing-name warning.
- Look: stories for size x selected x validation, disabled, focus; contrast in both modes; reduced motion.

## Accessibility deviations from the references

None intended. `selected` replaces `checked` through the registered alias; Enter does not toggle, as in the reference.

## Open questions (recommendation first)

All answered with the recommendation: Q1 selected; Q2 small and medium; Q3 no Enter; Q4 text props; Q5 native checkbox submission and error timing; Q6 no indeterminate or readOnly. See contract.json openQuestions and SB-0101.
