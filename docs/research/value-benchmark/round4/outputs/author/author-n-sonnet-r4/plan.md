# Plan: Switch (planning gate)

Status: **approved by default** — no approver was available; every open question took the recommendation and is recorded in the contract's `openQuestions` (as SB-0011 allows). Tests and code start from here (planning gate, then test-first).

## Scope
A form-associated on/off control: native `<input type="checkbox" role="switch">` in the shadow root, with `label`, `hide-label`, `description`, `error`, `name`, `value`, `checked`, `required`, `disabled` and `size` (`default`, `sm`). Out of scope: indeterminate, an `lg` size, a switch group, an `on-label`/`off-label` text.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` |

Tokens: `--sb-switch-*` from the contract's `tokens` (all alias existing semantic tokens, including `size.switch.*` and `space.switch.inset`). No new semantic tokens.

## Form association
`FormAssociated(NativeControl(LitElement))` per rule form-associated-controls; implement only the four hooks:
- `formValue()`: `value` while checked, else `null`.
- `formReset()`: restore `checked` from the attribute.
- `formStateRestore(state)`: set `checked` from the saved state.
- `validationAnchor()`: the inner input (`required` -> `valueMissing`).
Render the input with `?disabled=${this.isDisabled}`; style with `:host(:disabled)`; call `syncFormState()` in the input handler; forward `<label for>` clicks to the input; `error` sets `customError` validity; Enter calls `form.requestSubmit()` (SB-0009).

## Test plan (test-first)
One test per item in the Playwright spec, each seen failing for the right reason before code:
- Props: label is the accessible name; `hide-label` keeps the name; description and error in the accessible description; `size` changes the track (32x20 vs 24x16); `value`, `name`, `required` (asterisk aria-hidden), `disabled`.
- Keyboard: Tab focuses; Space toggles; Enter submits the form and does not toggle; keyboard focus ring visible.
- Events: `input` and `change` composed, once per toggle; a `change` listener reading `FormData` sees the new value.
- States: checked paints differently (track and thumb position, mirrored in rtl); invalid shows `aria-invalid` and the error.
- Form: FormData holds `value` only while on; `form.reset()` restores the attribute default; `<fieldset disabled>` blocks and re-enable restores, without rewriting the `disabled` attribute; `required` off is `valueMissing` and `reportValidity()` focuses the input; `error` is `customError`; `<label for>` activates it.
- Accessibility: role `switch`, `aria-checked`, axe clean on every story.

## Accessibility deviations from the references
- Off track uses `color.input` (3:1) and the focus ring is a solid 3px ring, where shadcn is lighter (WCAG 1.4.11). Listed in `realizations.web.drift`.
- `sm` track (24x16px) is under 24px; it relies on the label row and gap for WCAG 2.5.8.
- Error is announced when it appears and blocks submission (SB-0009).

## Risks
- `role="switch"` on a native checkbox: confirm in the browser spec that axe and the accessibility tree report `switch` with `aria-checked`.
- Contrast of `switch.thumb.bg` on `switch.bg` in dark mode: the contract lists the pairs for check T6; adjust the semantic mapping, not the component, if one fails.

## Open questions (recommendation first)
All answered with the recommendation; the full text is in the contract's `openQuestions`.
- Q1 Native input with `role="switch"`, not an ARIA div.
- Q2 `checked` is not reflected (the attribute is the reset default).
- Q3 `label` is required; `hide-label` keeps it as the name.
- Q4 No indeterminate state.
- Q5 Sizes `default` and `sm`.
- Q6 Off submits nothing.
- Q7 Error through an `error` prop with `customError` validity.
- Q8 Space toggles; Enter submits the form.
