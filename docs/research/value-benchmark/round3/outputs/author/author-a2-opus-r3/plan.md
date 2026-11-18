# Plan: Switch (planning gate)

Status: **draft, questions answered with the recommendation**. No approver was available in the authoring session (2026-11-12). Every open question was answered with the recommended option and recorded in `contract.json` `openQuestions` and in SB-0101. Tests and code start only after the owner confirms or changes these answers (planning gate, then test-first).

## Scope
- `sb-switch`: a form-associated on/off control with `label`, `hide-label`, `description`, `error`, `name`, `value`, `checked`, `required`, `disabled` and `size` (`default`, `sm`).
- Events `input` and `change` (composed). Parts `field`, `control`, `input`, `thumb`, `label`, `required-indicator`, `description`, `error`.
- Out of scope for 0.1.0: a label-first layout (compose it with Item and `hide-label`), a `lg` size, a loading state, read-only.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` (Default, Checked, Small, With description, Error, Required, Disabled, Hidden label, In a form, RTL) |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` |

## Tokens
All 29 `switch.*` component tokens alias existing semantic tokens (see `contract.json` `tokens`). The sizes come from `size.switch.*` and `space.switch.inset`. No new semantic token is needed. The contrast pairs are declared, and check T6 passes in every mode.

## Accessibility approach
- `FormAssociated(NativeControl(LitElement))`. The inner control is `<input type="checkbox" role="switch">` in the shadow root, with a native `<label for>` in the same root.
- `formValue()` returns `value` while checked and `null` otherwise. `formReset()` restores the `checked` attribute. `formStateRestore()` restores checked. `validationAnchor()` is the inner input.
- The inner input renders `?disabled=${this.isDisabled}`. The dimmed look uses `:host(:disabled)`. `syncFormState()` runs in the change handler before `change` is re-dispatched.
- Enter calls `form.requestSubmit()` (SB-0009). Space is native.
- `error` sets `customError`. The error region is a persistent `aria-live="polite"` node. Description and error ids go in `aria-describedby`.
- Under `prefers-reduced-motion: reduce` there is no thumb transition. The thumb position uses logical properties, so it flips in RTL.

## Test plan (test-first)
1. The role is `switch`, the accessible name is the label, and `aria-checked` follows the state.
2. Clicking the switch, clicking the label and pressing Space each toggle it, and `input` and `change` fire once per toggle and are composed. Setting `checked` in code fires neither.
3. Enter in a form submits it and does not toggle.
4. The focus ring shows on keyboard focus only.
5. The thumb is at the inline end when on, and in RTL it is mirrored.
6. Sizes: the track is 32x20 / 24x16 and the thumb 16 / 12.
7. Description and error are in the accessible description. With an error, `aria-invalid` is set, the error is announced, and the form does not submit.
8. FormData: there is no entry while off, `name=on` while on, and a custom `value` is sent.
9. `form.reset()` restores the attribute default, from both on and off.
10. `<fieldset disabled>` makes the switch unfocusable, not togglable and not submitted. Re-enabling the fieldset restores it, and the `disabled` attribute is never written.
11. `required`: off is `valueMissing`, the form is blocked, and `reportValidity()` focuses the switch. On makes it valid. The asterisk is aria-hidden. It shows as invalid after blur.
12. A `<label for>` outside the component toggles it.
13. `hide-label` keeps the accessible name.
14. A missing label gives a single dev warning.
15. Reduced motion means no transition.
16. axe is clean on all stories.

## Accessibility deviations from the references
- The unchecked track uses `color.input` (3:1) instead of the reference's lighter input color (WCAG 1.4.11).
- The focus ring is solid 3px instead of ring/50.
- Enter submits instead of the APG's optional Enter-toggles.
- Each state has one thumb color in every mode, so the thumb-on-track pairs are contrast-checked.

## Risks
- `role="switch"` on a checkbox input: older screen readers may announce "checkbox". This is acceptable because the state is still correct. The manual pass is Q7.
- The `sm` size with `hide-label` is 16px high and relies on the 2.5.8 spacing exception. Stories and docs show the spacing.
- A switch that applies its setting at once can fail. The guidance is to revert and set `error`, not to disable the switch.

## Open questions (recommendation first)
All of these were answered with the recommendation on 2026-11-12, because no approver was available:
- Q1: a native checkbox with the switch role. **Chosen.** The alternative was a button with `aria-checked`.
- Q2: Enter submits and Space toggles. **Chosen.** The alternative was Enter toggles.
- Q3: `checked` is not reflected, and the attribute is the reset default. **Chosen.**
- Q4: sizes `default` and `sm`. **Chosen.** The alternative was adding `lg`.
- Q5: the label goes after the switch, and a label-first row is composed with Item. **Chosen.** The alternative was a `label-position` prop.
- Q6: `label` is required. **Chosen.**

Still open:
- Q7: a manual screen-reader pass (VoiceOver, NVDA), to be done before the switch moves to stable.
