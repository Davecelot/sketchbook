# Plan: Switch (planning gate)

Status: **approved by default**. No approver was available, so every open question took its recommended answer (listed below and in `contract.json` `openQuestions`, decision SB-0101). The owner can revisit any of them. Tests and code start next, test-first.

## Scope
`sb-switch`: an on/off setting that is form-associated (submits `value` while on, resets with its form, disabled by a disabled fieldset, `required` validity), with `label`, `hide-label`, `description`, `error`, and `size` (`default`, `sm`). Out of scope: a Field set wrapper, a design-file realization, an indeterminate state.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` |

Class: `FormAssociated(NativeControl(LitElement))`, as Checkbox. Reuse `src/mixins/`; no new mixin or controller.

## Tokens
Component tokens `--sb-switch-*` in `contract.json` `tokens`, aliasing semantic tokens only. Track and thumb sizes and inset come from the existing `size.switch.*` and `space.switch.inset` semantic tokens; no new semantic token is needed.

## Accessibility approach
Native `<input type="checkbox" role="switch">` plus `<label for>` in the same shadow root; Space toggles; Enter submits via `submitOnEnter`; `aria-describedby` to description and error; `aria-invalid`; persistent polite live region for the error. Focus ring 3px in `ring`; borders at 3:1.

## Test plan (test-first)
One test per item in `realizations.web.coverage`:
- name from `label`, role `switch`, label click, `<label for>` on the host
- Space toggles, Enter does not toggle and submits the form; focus ring on keyboard focus
- `checked` paints differently; thumb position
- `size` default and sm dimensions (32x20, 24x16)
- description and error in the accessible description; `aria-invalid`
- `required`: native required, aria-hidden asterisk, invalid after blur, `valueMissing`
- `hide-label` keeps the name
- `input` and `change` composed, once per toggle; `FormData` already updated inside a `change` listener
- `disabled` cannot toggle; `<fieldset disabled>` disables and re-enable restores, without rewriting the `disabled` attribute
- FormData: value only while on, custom `value`, off submits nothing; `form.reset()` restores the `checked` attribute
- `error` sets `customError`, blocking submit
- axe clean on all stories

Then run `npm run test:component -- tests/switch` and record that each new test fails for the right reason before implementing.

## Accessibility deviations from the references
- Solid 3px focus ring instead of a translucent one (below 3:1).
- Track border at 3:1 (`color.input`) instead of the lighter reference border.
- Label, description and error live inside the component (shadow DOM).

## Risks
- Chromium may not report `aria-checked` for `role="switch"` on a native checkbox the same way in every engine; the spec asserts the accessibility tree role and checked state in Chromium.
- Small track (24x16) is under 24px high; relies on the WCAG 2.5.8 spacing exception through the label row.

## Open questions (recommendation first)
All answered with the recommendation (no approver available):
- Q1 Native input with `role="switch"` or custom ARIA host? **Native input.** Gives Space, focus, validity and checked state for free.
- Q2 Reflect `checked`? **No**, like Checkbox; the attribute is the reset default.
- Q3 `label` required, hideable? **Required, with `hide-label`.**
- Q4 Sizes? **`default` (32x20) and `sm` (24x16).**
- Q5 Does Enter toggle? **No**; Space toggles, Enter submits the form.
- Q6 Value when off? **Nothing submitted.**
