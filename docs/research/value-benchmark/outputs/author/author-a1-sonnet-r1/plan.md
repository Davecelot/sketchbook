# Plan: Switch (planning gate)

Status: **draft**. Nobody was available to approve in this session, so every open question below took its recommended answer (recorded in `contract.json` `openQuestions`). Tests and code start only after a person confirms this plan.

## Scope

A form-associated on/off toggle `sb-switch`: `checked`, `name`, `value`, `disabled`, `required`, `label`, `description`, `errorMessage`, `validation`, `size` (`small`, `medium`), and a `change` event. Out of scope: hideLabel, read-only, indeterminate, label position, hover and pressed looks, a field wrapper.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` |

## Tokens

All in `contract.json` `tokens` (`switch.<part>.<name>`), aliasing existing semantic tokens only; no new semantic token is needed. Disabled dimming uses `opacity.disabled`.

## Implementation approach

- Extend `NativeControl(FormAssociated(LitElement))` (rule form-associated-controls); implement only `formValue()` (`value` while checked, else `null`), `formReset()` (back to the initial `checked`), `formStateRestore()` and use the default `validationAnchor()` (the inner input).
- Inner `<input type="checkbox" role="switch">` with `?disabled=${this.isDisabled}`, `?required`, `aria-invalid` from `validation`, `aria-describedby` for the description and, while shown, the error text.
- Call `syncFormState()` synchronously in the change handler, before dispatching `change`.
- Style the dimmed host with `:host(:disabled)`.
- Initial `checked` for reset: record it on first connect or first `checked` assignment before user input.

## Test plan (test-first)

Behavior spec, one test each, seen failing before code:
- Props: each prop and attribute reflection, defaults, both sizes, `description` and `errorMessage` rendering (error only while `validation` is `error`).
- Keyboard: Tab reaches it, disabled is skipped, Space toggles, Enter does not toggle and submits the form.
- Event: `change` fires on click and Space, bubbles and composes, shows the new `checked` and `FormData`; not fired on a programmatic change or reset.
- Form: `FormData` has `name=value` only while on; `form.reset()` returns to the initial state; `<fieldset disabled>` disables it, nothing submitted, re-enable restores it and the author's `disabled` attribute is untouched; `required` off gives `valueMissing`, `reportValidity()` focuses the control, on is valid; `<label for>` toggles it.
- Accessibility: role switch and checked state, name from `label`, one warning without a label, description and error via `aria-describedby`, `aria-invalid`, axe in rest, on, disabled and error, focus ring visible on keyboard focus only, 24 px target.
- Contrast pairs verified by `npm run check` (T6).

## Accessibility deviations from the references

- APG: Enter is optional for a switch; here it submits the form instead (Q2).
- No `aria-required`: the switch role does not support it; `required` is the native attribute.
- Visible `<label for>` activates the host but does not name it, hence the `label` prop.

## Risks

- Focus ring and `:state(focus-visible)` support in older engines (handled in the shared mixin).
- Thumb contrast on the off track depends on `color.input`; checked by T6 in every mode.
- `required` on a switch means "must be on", which some authors may not expect; documented in contract.md.

## Open questions (recommendation first)

All answered with the recommendation (see `contract.json`): Q1 error look follows `validation` only; Q2 Enter submits; Q3 prop is `checked`; Q4 and Q5 no extra features. Still open: Q6, a manual screen-reader pass before `stable`.
