# Plan: Switch (planning gate)

Status: **draft, questions answered**. All open questions were answered on 2026-11-12 with the recommended option because no approver was available in the session; the answers are recorded in `contract.json` (`openQuestions` Q0–Q7) and below. A person should still confirm them before tests and code start (planning gate, then test-first).

## Scope

- `sb-switch`: one on/off control with `label`, `description`, `errorMessage`/`validation`, `size` (small, medium), `disabled`, `required`, `name`, `value`, `selected`.
- Form-associated from the first implementation (rule form-associated-controls): FormData, `form.reset()`, `<fieldset disabled>`, `required` validity, `<label for>` activation, form state restore.
- Out of scope: label position, hidden label, read-only, loading, a switch group element. None was asked for.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` |

## Implementation approach

- `class Switch extends NativeControl(FormAssociated(LitElement))`, reusing both mixins; no new mixin, controller or dependency.
- Hooks: `formValue()` returns `value` while selected, else `null`; `formReset()` sets `selected = this.hasAttribute('selected')`; `formStateRestore(state)` sets `selected = state !== null`; `validationAnchor()` is the inherited inner input.
- The input renders `?disabled=${this.isDisabled}`, `?required`, `.checked=${this.selected}`, `role="switch"`, `aria-invalid` and `aria-describedby` (description, then error). `validation="error"` calls `setCustomValidity(errorMessage)` on the input before `syncFormState()`.
- The input handler sets `selected` from the input and calls `syncFormState()` synchronously before the composed `change`.
- Dimmed host styled with `:host(:disabled)`; reduced motion removes the thumb transition.

## Tokens

All component tokens alias semantic tokens (see `contract.json` `tokens`). Existing semantic switch tokens are used for sizes (`size.switch.*`, `space.switch.inset`); no new semantic token is needed. The thumb diameter is derived in CSS from track height and inset (no extra token). `npm run check` passes, including T6 contrast for every declared pair in every mode.

## Accessibility approach

Native checkbox with `role="switch"` (APG Switch), named by the rendered `<label>` from `label`; description and error via `aria-describedby`; `aria-invalid` on error; Space toggles, Enter submits the form; focus ring on keyboard focus only; row min height 24 px for target size; state shown by thumb position as well as color.

## Test plan (test-first)

One Playwright test per item, written from the contract and seen failing before any code:

- Props: `selected` (attribute sets initial state, property not reflected), `label`, `description`, `errorMessage` shown only with `validation="error"`, `size` (track dimensions match the tokens for small and medium), `disabled`, `required`, `name`, `value` (default `on`).
- States: focus-visible ring on keyboard focus and not on click; selected track fill and thumb position; invalid outline; disabled opacity; reduced motion removes the transition.
- Keyboard: Space toggles and fires `input` then `change`; Enter submits the form and does not toggle; Tab/Shift+Tab move focus.
- Events: `change` bubbles and is composed, not fired on programmatic `selected`; a `change` listener reading `FormData` sees the new value.
- Form: FormData has `name=value` only while on; `form.reset()` restores the attribute state; `<fieldset disabled>` disables and re-enabling restores without touching `disabled`; `required` gives `valueMissing` and `checkValidity()` false while off; `validation="error"` gives `customError` with `errorMessage`; `<label for>` activation toggles.
- Accessibility: role switch with name from `label`; description (and error) as accessible description; `aria-invalid` with error; empty-label console warning; axe clean in every story.

## Accessibility deviations from the references

- Enter does not toggle (APG lists it as optional); it submits the form as a native checkbox does (Q4).
- Small size keeps the reference's 16 px track; the row provides the 24 px target (Q5).

## Risks

- `:state()` custom states are missing in older engines; only the focus-visible state for composing components is lost (handled by the mixin).
- Custom validity from `validation="error"` blocks submission until the application clears `validation`; documented in the contract's Usage.
- A screen-reader pass (VoiceOver, NVDA) is still needed before `stable`; axe does not verify the on/off announcement.

## Open questions (recommendation first)

All answered with the recommendation (2026-11-12, no approver available):

1. Q1 On/off prop name: **`selected`** (canonical vocabulary; native spelling `checked` discarded).
2. Q2 Reset state: **the `selected` attribute**; property not reflected.
3. Q3 Error trigger: **only `validation="error"`**, which also sets a custom validity error.
4. Q4 Enter key: **submits the form**, Space toggles.
5. Q5 Small target size: **row is the target, min height 24 px**.
6. Q6 Error association: **`aria-describedby` + `aria-invalid`**.
7. Q7 Label: **after the control**, no position or hidden-label prop.
