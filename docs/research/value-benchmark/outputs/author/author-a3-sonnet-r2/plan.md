# Plan: Switch (planning gate)

Status: **draft**. Tests and code start only after approval (planning gate, then test-first). No one was available in the authoring session, so every open question below took its recommended answer and is recorded in `contract.json` `openQuestions`; approval of the plan confirms or overturns them.

## Scope

A form-associated on/off control with label, description, error message, `size` small and medium, `validation` none and error. Out of scope: indeterminate, read-only, loading, icons in the thumb, a group wrapper, a live error announcement.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` |

Tokens: the 16 `switch.*` tokens in the contract, all aliasing semantic tokens.

## Implementation approach

- Extend `NativeControl(FormAssociated(LitElement))` (rule form-associated-controls); the inner `<input type="checkbox" role="switch">` is the validation anchor.
- Implement only the four hooks: `formValue()` returns `value` while selected, else `null`; `formReset()` restores the initial `selected`; `formStateRestore()` restores `selected`; `validationAnchor()` is the input.
- Render the input with `?disabled=${this.isDisabled}`; style dimming with `:host(:disabled)`.
- Call `syncFormState()` in the input handler before dispatching `change`.
- Describe the control with the description and, while `validation` is error, the error message; set `aria-invalid`. The mixin's `describedBy` covers only the description, so the switch composes its own value for this (small extension, no change to the mixin).
- Thumb motion is dropped under `prefers-reduced-motion`.

## Test plan (test-first)

One test per item in `playwright/tests/switch/switch.behavior.spec.ts`:

- Props: `label`, `description`, `errorMessage` (shown only in error), `selected`, `validation`, `size`, `disabled`, `required`, `name`, `value` reflect and act.
- Event: `change` fires on click and Space, bubbles and is composed, not fired when `selected` is set by script or on reset.
- Keyboard: Space toggles; Tab enters and leaves; disabled is skipped; Enter submits the form and does not toggle.
- Form: `FormData` holds `name=value` only while on; a `change` listener already sees the new value; `form.reset()` restores the initial state; `<fieldset disabled>` disables, drops the value and re-enabling restores it without touching the `disabled` attribute; `required` is `valueMissing` while off and valid while on; `reportValidity()` focuses it; `<label for>` toggles it.
- Accessibility: role switch and checked state; name from `label`; description linked; error linked and `aria-invalid` only in error; console warning without a label; axe clean in off, on, error and disabled.
- Visual states in the stories: size by validation by selected, plus hover, focus, disabled.

Each test must be seen failing for the right reason (element missing) before implementing.

## Accessibility deviations from the references

None. The APG switch pattern asks for Space to toggle; Enter is optional in the APG and is left to form submission, as for the native checkbox.

## Open questions (recommendation first)

All answered with the recommendation (details in the contract):

1. **Q1** on/off prop name: `selected` (registered; `checked` is an alias).
2. **Q2** does `validation` follow native validity: no, author-set.
3. **Q3** sizes: `small`, `medium` (default).
4. **Q4** meaning of `required`: invalid while off, like a native checkbox.
5. **Q5** live error announcement: no, describedby and `aria-invalid` only; revisit after the manual screen-reader pass.
6. **Q6** separate small track height: both sizes alias `size.control.sm` for now; the two height tokens let them diverge without a contract change. The builder confirms visual dimensions against Storybook.

Risk: a manual screen-reader pass is still due before `beta`.
