# Plan: Switch (planning gate)

Status: **draft**. Tests and code start only after approval (planning gate, then test-first). This session wrote the specification only; no tests or component code were written. The open questions below were answered with their recommendation because no reviewer was available; a reviewer may still overturn any of them by superseding SB-0101.

## Scope

`sb-switch`: one form-associated on/off toggle with built-in label, description and error message, sizes `small` and `medium`, per [contract.json](./contract.json). Out of scope: a mixed state, a loading state, icons in the thumb, a switch group element, read-only.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` |

## Implementation notes

- Class: extends `NativeControl(FormAssociated(LitElement))` (rule form-associated-controls: NativeControl sits between FormAssociated and the component).
- Hooks: `formValue()` → `checked ? value : null`; `formReset()` → `checked = hasAttribute('checked')`; `formStateRestore(state)` → `checked = state != null`; `validationAnchor()` → the inner input (from NativeControl).
- Inner control: `<input type="checkbox" role="switch">` with `.checked`, `?disabled=${this.isDisabled}`, `?required`, `aria-describedby` (description id + error id while error), `aria-invalid` while `validation="error"`, `@keydown=${this.implicitSubmit}`, `@focus/@keyup=${this.syncFocusVisible}`, `@blur=${this.handleBlur}`, `@change` → set `checked`, `syncFormState()` synchronously, then `handleChange()`.
- The label renders as a `<label>` around or for the inner input, so pressing it toggles; `NativeControl` forwards `<label for>` host clicks.
- Styles: `:host(:disabled)` for dimming, `:state(focus-visible)` ring, `@media (prefers-reduced-motion: reduce)` drops the thumb transition, thumb offset mirrored with `:dir(rtl)`.

## Tokens

All component tokens are in `contract.json` `tokens` and alias semantic tokens only (`size.switch.*`, `space.switch.inset`, `color.input/primary/primary-foreground/background/destructive/ring/foreground/muted-foreground`, `radius.pill`, `border-width.default`, `elevation.xs`, `motion.*`, `opacity.disabled`, `focus.ring.width`, type tokens). No new semantic tokens needed. Thumb size is computed from track height and inset.

## Accessibility approach

Native checkbox with `role="switch"` (APG Switch); label prop as name; description and error via `aria-describedby`; `aria-invalid` for `validation="error"`; Space toggles, Enter submits (Q1); keyboard-only focus ring; whole-row target; reduced motion. Declared contrast pairs pass check T6 in light and dark.

## Accessibility deviations from the references

- Enter does not toggle (APG lists it as optional): kept native for consistent implicit submission (Q1).
- Focus ring at full strength rather than half alpha; error shown as border plus text (see drift in contract.json).

## Test plan (test-first)

Playwright behavior spec `playwright/tests/switch/switch.behavior.spec.ts`, using `playwright/helpers/forms.ts`:

1. Role `switch`, accessible name from `label`, `aria-checked` false/true; description and error in the accessible description; `aria-invalid` only with `validation="error"`.
2. Click on track, thumb and label toggles; Space toggles; `input` then `change` fire once each, composed, on the host; programmatic `checked` change fires nothing.
3. Enter does not toggle and submits the form (`submitsOnEnter`).
4. FormData: nothing while off; `name=on` while on; custom `value`; no `name` → nothing. `change` listener sees the new FormData (`recordEntriesOnChange`).
5. `form.reset()` restores the `checked` attribute (both directions) without firing `change`.
6. `<fieldset disabled>`: not focusable, click does nothing, not submitted, `disabled` attribute untouched; re-enable restores.
7. `required`: off → `validity.valueMissing`, `checkValidity()` false, `reportValidity()` focuses it; on → valid.
8. `<label for>` activates the switch.
9. `disabled`: skipped by Tab, ignores click and Space.
10. Sizes: track dimensions match `size.switch.*` tokens for `small` and `medium`.
11. Focus ring only on keyboard focus; no thumb transition under `prefers-reduced-motion: reduce`.
12. Empty `label` warns once.

## Risks

- Small track (24 × 16) is under the 24 × 24 target alone; relies on the label being part of the pressable row. A future hidden-label option would need padding to keep 2.5.8.
- `ElementInternals` custom states are missing in older engines; only the focus ring for composing parents is lost (handled by NativeControl).

## Open questions (recommendation first)

| Id | Question | Recommendation (taken) |
| --- | --- | --- |
| Q1 | Enter: toggle or submit? | Submit, like a native checkbox; Space toggles. |
| Q2 | Does `validation="error"` block submit? | No; look and `aria-invalid` only; `required` drives validity. |
| Q3 | Size names | Canonical `small` / `medium`. |
| Q4 | Reset target | The `checked` attribute (native default state). |
| Q5 | Label placement | Built in, after the track. |
| Q6 | Manual screen-reader pass | Still open: run before `stable`. |
