# Plan: Switch (planning gate)

Status: **approved** (2026-11-12) under SB-0011 and the session instruction to take the recommended answer for every open question without a reviewer. The answers are listed below and in the contract's `openQuestions`, so they can be revisited. Tests and code start next (test-first); no tests or code are written in this change.

## Scope
`sb-switch`: one on/off setting with label, description, error, `size` (`default`, `sm`), `required`, `disabled`, and full form association. Out of scope: a label-before-track layout prop (compose with Field or Item), a loading state, icons in the thumb, a read-only state.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` |

Then `npm run generate` (barrel, styles, component tokens) and update `contract.json` `realizations.web` (files, coverage, status).

## Reuse (no new shared code)
- `FormAssociated(NativeControl(LitElement))` from `src/mixins/`: name, disabled, required, label, description, focus-visible sync, composed `change`, label forwarding, `submitOnEnter`, empty-label warning. Switch implements only `formValue()` (`checked ? value : null`), `formReset()` (`checked` back to the `checked` attribute), `formStateRestore()` and `validationAnchor()` (the inner input).
- Structure and styles mirror Checkbox: same field grid, label/description/error parts and the same semantic tokens for text, focus and disabled.
- Tokens: only existing semantic tokens (`size.switch.*`, `space.switch.inset`, `size.icon.*`, `color.*`); no new semantic token needed. T6 passes for every pair in light and dark.

## Tokens
Component tokens are listed in `contract.json` `tokens`. Size `sm` swaps `switch.width-sm`, `switch.height-sm`, `switch.thumb.size-sm` into private `--_*` properties; the thumb travel is computed from width, thumb size and inset in CSS (`calc`, no literals).

## Accessibility approach
Native `<input type="checkbox" role="switch">` over the track (transparent, full size, so the whole track is the hit target), thumb `aria-hidden` with `pointer-events: none`. Name from `label` via `<label for>`; description and error by `aria-describedby`; `aria-invalid`; polite live error region; `?disabled=${this.isDisabled}`; `:host(:disabled)` for dimming; `syncFormState()` in the input handler; thumb travel mirrors with `:dir(rtl)`; no transition under `prefers-reduced-motion`.

## Test plan (test-first)
`playwright/tests/switch/switch.behavior.spec.ts`, one test per item, run with `npm run test:component -- tests/switch` and seen failing (element missing) before any code:
- Props: `label` is the accessible name and clicking it toggles; `hide-label` keeps the name; `description` in the accessible description; `error` sets `aria-invalid`, the description and customError; `value` custom value submitted; `checked` initial state and not reflected; `size` default 32x20 / sm 24x16 with 16 / 12 thumbs; `required` asterisk is aria-hidden; `disabled` cannot toggle.
- Role and state: role `switch`, `aria-checked` follows toggles; thumb at the end when on, mirrored in RTL.
- Keyboard: Tab focuses and shows the 3px ring; Space toggles; Enter submits the form and does not toggle.
- Events: `input` and `change` composed, once per user toggle; none for a programmatic `checked`; `FormData` in a `change` listener has the new value.
- Form: FormData has `value` only while on; `form.reset()` restores the attribute default; `<fieldset disabled>` disables without changing the attribute, and re-enable works; `required` off is `valueMissing` and blocks submit, `:invalid` after blur; `<label for>` on the host toggles.
- Accessibility: empty-label console warning once; axe clean on every story; contrast tokens resolved in light and dark.

Stories: Default, Checked, Small, With description, With error, Required, Disabled (off and on), In a form (submit/reset), Hidden label.

## Accessibility deviations from the references
- Native checkbox with `role="switch"` instead of the reference's button (SB-0007).
- Off track `input` (3:1) and a solid 3px focus ring instead of the reference's lighter fill and translucent ring (WCAG 1.4.11).
- Track 32x20 instead of 32x18.4 (4px grid).
- Enter submits instead of toggling (APG makes Enter optional; consistent with Checkbox, SB-0009).

## Risks
- `role="switch"` on a native checkbox: Safari/VoiceOver has announced it as a checkbox in older versions; the axe check and an accessibility-tree assertion in Chromium cover the role, a manual VoiceOver pass is recommended before `stable`.
- Thumb travel with `calc` must use logical properties so RTL mirrors.
- `formStateRestore` is only exercised by back/forward cache; covered by calling the callback in the test.

## Open questions (recommendation first)
All answered with the recommendation (2026-11-12), no reviewer available:
- Q1 Element: native checkbox with `role="switch"` (chosen) over a `<button role="switch">`.
- Q2 `checked` reflected? No (chosen); the attribute is the reset default.
- Q3 Enter: submits the form (chosen); only Space toggles.
- Q4 Sizes: `default` and `sm` (chosen), track and thumb only.
- Q5 Label position: after the track, like Checkbox (chosen); trailing-switch rows are composed.
- Q6 `required`: must be on (chosen).
- Q7 Reduced motion: no thumb transition (chosen).
