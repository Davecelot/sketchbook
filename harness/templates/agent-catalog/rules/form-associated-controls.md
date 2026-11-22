# Rule: form-associated-controls

Every component that stands in for a native form control (checkbox,
checkbox option, radio, switch, input, select, and any later one) must be
form-associated from its first implementation, through the shared mixin
`src/mixins/form-associated.ts`. It is never deferred to a later change or
left as a contract open question.

## How

- Extend `FormAssociated(LitElement)`. The mixin owns `formAssociated`,
  `attachInternals()`, the `name`/`disabled`/`required` props, the
  `form`/`validity`/`validationMessage`/`willValidate` getters,
  `checkValidity()`/`reportValidity()`, the form lifecycle callbacks, and
  the form value and validity sync after each render. If the component
  also needs custom states, use the mixin's `internals`; don't call
  `attachInternals()` a second time.
- A group-wide control (radio, radio option) computes its group like the
  native one (same root, `name` and form) and owns exclusivity, the tab
  stop, arrow keys and posinset, with the roving-focus controller in
  `src/controllers/roving-focus.ts` where it applies. Its validity anchor
  gets `required` set to "some member required, none selected", so the
  native `valueMissing` holds for every member. A composite member passes
  that down to its unnamed nested radio. Record the choice in the
  component's contract and in `spec/decisions/DECISIONS.md`.
- A control that wraps a native `<input>` (checkbox, radio, switch) also
  extends `NativeControl(...)` from `src/mixins/native-control.ts`: it owns
  `label`/`description`, `delegatesFocus`, `click()`, label forwarding, the
  `:state(focus-visible)` sync, the composed `change` and the empty-label
  warning. It goes between `FormAssociated` and the component. Render
  `this.describedBy`, `this.renderDescription()` and wire
  `syncFocusVisible`/`handleBlur`/`handleChange` on the input.
- Implement only the four hooks:
  - `formValue()`: what is submitted, or `null` for nothing (a checkbox
    submits `value` only while selected).
  - `formReset()`: the reset state.
  - `formStateRestore(state)`: how saved form state is restored.
  - `validationAnchor()`: the native control whose validity is mirrored,
    so the browser provides the validation message and `reportValidity()`
    focuses it.
- Render the inner native control with `?disabled=${this.isDisabled}`, not
  `this.disabled`. `isDisabled` also covers a `<fieldset disabled>`
  ancestor, which must never overwrite the author's `disabled` attribute.
  For the same reason, style a dimmed host with `:host(:disabled)`, not
  `:host([disabled])`.
- A `<label for>` clicks the host itself. Forward a click whose
  `composedPath()[0]` is the host to the inner control, as Checkbox does.
- Call `syncFormState()` synchronously in the user-input handler, not
  only from `updated()`: `change` fires before the next render, and a
  `change` listener reading `FormData` must see the new value. A
  composite that syncs from a nested control also has
  `getUpdateComplete()` await it. The library has no option row
  (checkbox option, radio option) yet; the first one puts that await,
  the row click and the row layout in a shared mixin in `src/mixins/`
  so the second reuses it.
- `<label for>` activates the control but doesn't name it: the browser
  names the host, a generic node, while the role lives on the inner
  control. Keep the component's own accessible-name prop (`label`).
- A composite control (checkbox option) is the form field itself. Don't
  give its nested control a `name`, and pass `isDisabled` and `required`
  down to it.
- The contract records `name`/`value`/`required` and
  `accessibility.formAssociation`. The Playwright behavior spec covers
  FormData, `form.reset()`, `<fieldset disabled>` and re-enable,
  `required` validity, and `<label for>` activation.

**Why:** without form association a control only works under something
that carries its state for it, such as a form library with a
`setFieldValue` adapter or a `ng-model` bridge. That means one adapter per
framework. A form-associated control behaves like `<input>` for the
browser. It submits in `FormData`, responds to `form.reset()` and
`<fieldset disabled>`, validates with `required`/`:invalid`/
`reportValidity()`, and is activated by `<label for>`. One shared mixin,
the pattern Material Web, Shoelace, Lion and Vaadin use, keeps each
control down to a few lines instead of re-implementing the protocol.

**Enforcement (manual for now):** before implementing a form control,
check its contract has `accessibility.formAssociation` and that the class
extends `FormAssociated(...)`. No automated check yet.
