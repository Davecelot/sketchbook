# Plan: Switch (planning gate)

Status: **approved by default** — no reviewer was available, so every open question took its recommended answer (recorded in `contract.json` `openQuestions` and decision SB-0101). Tests and code start next, test-first.

## Scope

In: `sb-switch`, a form-associated on/off control with `checked`, `label`, `description`, `errorMessage`, `validation`, `size` (small, medium), `name`, `value`, `required`, `disabled`, and a `change` event.

Out (Q4): label before the control, on/off text in the track, a group element, `readOnly`, `indeterminate`, `hideLabel`.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` |

## Implementation approach

- `class Switch extends NativeControl(FormAssociated(LitElement))` per the form-associated-controls rule: a native `<input type="checkbox" role="switch">` inside the shadow root.
- Four hooks: `formValue()` returns `value` while checked, else `null`; `formReset()` restores the initial `checked` attribute state; `formStateRestore(state)` sets `checked` from the saved state; `validationAnchor()` is the input, which gets `required`, so `valueMissing` holds while off.
- Render the input with `?disabled=${this.isDisabled}`; style the dimmed host with `:host(:disabled)`.
- `handleChange` sets `checked` from the input, calls `syncFormState()` synchronously, then dispatches the composed `change`. Enter uses `implicitSubmit`.
- `aria-invalid` and `aria-describedby` (description, plus error while `validation=error`) on the input; the error message element is rendered only in that case.
- Track and thumb drawn in SCSS from `:checked`; size from `size` attribute; only `--sb-switch-*` and `--_*` variables.

## Tokens

26 component tokens in `contract.json`, all aliasing semantic tokens (`size.switch.*`, `space.switch.inset`, `radius.pill`, `color.input|primary|background|primary-foreground|ring|destructive|foreground|muted-foreground`, focus, opacity, motion, type). No new semantic tokens are needed. Contrast pairs for all of them are in `accessibility.contrast` (T6).

## Accessibility approach

Native input with the switch role, so name, state, Space and focus ring come from the platform. Name from `label`; empty-label warning from the native-control mixin. Keyboard: Tab, Space; Enter submits. Error and description by `aria-describedby`. Target at least 24×24 px. Axe in the behavior spec; manual VoiceOver and NVDA pass before stable (Q5).

## Test plan (test-first)

One Playwright test per item, in `playwright/tests/switch/switch.behavior.spec.ts`, each seen failing first:

- Props: `checked` (attribute and property, reflected), `label`, `description`, `errorMessage` (shown only with `validation=error`), `validation`, `size` (small and medium dimensions), `name`, `value`, `required`, `disabled`.
- Keyboard: Tab focus, Space toggles, Enter does not toggle and submits the form, Space does nothing when disabled; focus ring only for keyboard focus.
- Pointer: click on the control and on the label toggles.
- Events: `change` fires once per user toggle, bubbles and is composed, reads the new value from `checked` and `FormData`; not fired by setting `checked` from code.
- Form: `FormData` has `name=value` only while on; `form.reset()` restores the initial state; `<fieldset disabled>` disables it and re-enabling restores it without changing the `disabled` attribute; `required` off is invalid, on is valid, `reportValidity()` focuses the control; `<label for>` click toggles; state restore.
- Accessibility: role switch and checked state, accessible name from `label`, description and error in the accessible description, `aria-invalid`, console warning without a label, axe with no violations in every size, state and error look.

## Accessibility deviations from the references

None. Enter is not made to toggle (the APG makes it optional); see Q2.

## Risks

- Contrast of the off thumb on the off track in dark mode: verified by T6 on the declared pairs, re-checked when the styles exist.
- `checked` is an alias of the canonical `selected`: it adds one counted alias to `sketchbook api list` (check A1 warns, does not fail).
- Browser support for custom states (`:state(focus-visible)`) is handled by the native-control mixin.

## Open questions (recommendation first)

All answered with the recommendation, on 2026-11-12:

1. **`checked` or `selected`?** `checked` (native spelling; registered alias).
2. **Enter toggles?** No; Enter submits the form.
3. **Automatic error look on failed `required`?** No; `validation` is author-controlled.
4. **Label placement / on-off text?** Neither in 0.1.0.
5. **Manual screen-reader pass?** Yes, before stable.
