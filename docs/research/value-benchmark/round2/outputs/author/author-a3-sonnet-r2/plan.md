# Plan: Switch (planning gate)

Status: **approved by default on 2026-11-12**. Nobody was available to approve; every open question took the recommended answer (recorded in the contract's `openQuestions` and below). Tests and code are not written yet (test-first).

## Scope
A form-associated on/off switch: label, description, error, sizes `default` and `sm`, `required`, `disabled`, `name`, `value`, `checked`. Out of scope: `hide-label`, indeterminate, a group wrapper, label-position variants.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` |

## Tokens
Component tokens in `contract.json` (`--sb-switch-*`), all aliasing semantic tokens. Track and thumb sizes come from the existing `size.switch.*` and `size.icon.*`; no semantic token was added. The thumb inset is `(height - thumb size) / 2` in CSS, so it needs no token.

## Accessibility approach
- Native `<input type="checkbox" role="switch">` inside the shadow root with a native `<label for>`; the `label` prop is the accessible name.
- Space toggles; Enter submits the form (SB-0009); 3px solid focus ring; description and error through `aria-describedby`; error also sets `customError`.
- `FormAssociated(NativeControl(LitElement))`; hooks `formValue` (value only while on), `formReset` (checked attribute default), `formStateRestore`, `validationAnchor` (inner input). Inner input uses `?disabled=${this.isDisabled}`; dimmed host styled with `:host(:disabled)`. `syncFormState()` runs in the input handler.
- Style `:host(:disabled)`, thumb mirrors under `:dir(rtl)`.

## Test plan (test-first)
Behavior spec `playwright/tests/switch/switch.behavior.spec.ts`, one test each; all must fail first for the right reason (element missing):
- Props: `label` is the name and a label click toggles; `description`; `error`; `name`; `value`; `checked`; `size` default and sm (track 32x20 and 24x16); `required` (asterisk aria-hidden); `disabled`.
- States: focus-visible ring; checked paints differently and the thumb moves; invalid look; disabled cannot toggle.
- Keyboard: Tab focus; Space toggles; Enter submits the form and does not toggle.
- Events: `input` and `change` composed, once per toggle, and a `change` listener sees the new `FormData`.
- Form: FormData has the value only while on; custom `value`; `form.reset()` restores the `checked` attribute default; `<fieldset disabled>` disables, is not submitted, and re-enable restores without changing the `disabled` attribute; `required` off is `valueMissing` and on is valid; `error` gives `customError`; `<label for>` activates the host.
- Accessibility: role `switch`, checked state, name from `label`, description in the accessible description, `aria-invalid`, axe clean on all stories (both sizes, on/off, description, error, required, disabled).

## Accessibility deviations from the references
- Off track at 3:1 (`color.input`) instead of the reference's neutral-200 (WCAG 1.4.11).
- Solid 3px focus ring instead of ring/50 (WCAG 1.4.11).
- Track under 24px high; the label row and the gap meet WCAG 2.5.8 (same approach as Checkbox).
- Error announced when it appears (SB-0005, SB-0009).

## Risks
- A 20px track is below the 24px target size; if `label` is later made optional the spacing exception no longer holds.
- Dark theme: `switch.thumb` is `color.background`; confirm contrast against the off track in dark when building (contrast pairs are in the contract).
- Reflecting `value` while `checked` is not reflected mirrors Checkbox; consumers setting only the property after first render get no attribute.

## Open questions (recommendation first)
All answered with the recommendation (nobody available); see `openQuestions` in `contract.json` and SB-0101.
- Q1 native `role="switch"` checkbox: yes.
- Q2 Enter: submits the form, does not toggle.
- Q3 `checked` reflected: no.
- Q4 `hide-label`: not now; `label` required.
- Q5 sizes: `default`, `sm`.
- Q6 `required`: must be on.
- Q7 names `checked` / `error`: registered aliases, consistent with Checkbox and Input.
