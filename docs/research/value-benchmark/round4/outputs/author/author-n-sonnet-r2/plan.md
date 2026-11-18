# Plan: Switch (planning gate)

Status: **approved by default**: nobody was available in the authoring session, so every open question took its recommended answer, recorded in `contract.json` `openQuestions` and in SB-0101. Revisit if a reviewer disagrees before the build starts.

## Scope
`sb-switch`: an on/off setting that is form-associated (submits `value` while on, resets with its form, disabled by a disabled `<fieldset>`, validates `required`), with `label`, `hide-label`, `description`, `error` and `size` (`default`, `sm`). Out of scope: on/off text or icons, an indeterminate state, a group wrapper, a loading state.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` |

## Tokens
All in `contract.json` `tokens`, aliasing semantic tokens only. Track size reuses the existing `size.switch.*` and `space.switch.inset` semantic tokens; no new semantic token and no foundation change.

## Implementation approach
`class Switch extends NativeControl(FormAssociated(LitElement))`, copying the Checkbox shape: implement `formValue()` (value while on, else `null`), `formReset()` (back to the `checked` attribute), `formStateRestore()` and `validationAnchor()` (the inner input). Render `<input type="checkbox" role="switch" ?disabled=${this.isDisabled}>` with `describedBy`, `renderDescription()`, and `syncFocusVisible`/`handleBlur`/`handleChange` wired. Call `syncFormState()` synchronously in the input handler. Enter submits via `form.requestSubmit()` (SB-0009), as Checkbox does. Style a dimmed host with `:host(:disabled)`.

## Test plan (test-first)
One Playwright test per item, each seen failing for the right reason (element missing) before implementing:
- Props: `label` is the accessible name; `hide-label` keeps it; `description` and `error` in the accessible description; `size` sm changes the track to 24×16px; `value`; `checked`; `required` asterisk; `disabled`.
- Accessibility: role `switch`, `aria-checked` follows state, `aria-invalid` with error, empty-label warning, axe clean on every story.
- Keyboard: Tab focus with visible ring; Space toggles; Enter submits and does not toggle.
- Events: `input` and `change` composed, once per toggle; label click toggles.
- Forms: FormData has the value only while on and the custom value; `form.reset()` restores the attribute default; `<fieldset disabled>` blocks and re-enable restores; `required` gives `valueMissing`, `:invalid` and `reportValidity()` focuses the input; `error` gives `customError`; `<label for>` activates; `formStateRestore`.
- Visual state: on and off paint differently; the thumb moves to the end edge and mirrors in RTL.

## Accessibility deviations from the references
- Solid 3px focus ring instead of a translucent one (WCAG 1.4.11).
- Off-state track uses `color.input` (3:1) instead of the lighter reference border.
- Enter submits the form instead of toggling (the APG makes Enter optional).
Record these in `realizations.web.drift` when built.

## Risks
- A 16px sm track is under 24px: relies on the label row and the spacing exception (WCAG 2.5.8).
- `role="switch"` on a checkbox input: confirm the accessibility tree in Chromium, Firefox and WebKit.
- Thumb travel depends on `size.switch.*` minus `space.switch.inset`: verify with both sizes and RTL.

## Open questions (recommendation first)
All answered with the recommendation (see `contract.json` Q1 to Q7): native input with `role="switch"`; Enter does not toggle; `label` required; `checked` not reflected; sizes `default` and `sm`; error as `customError`; no on/off text.
