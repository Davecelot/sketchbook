# Switch

A toggle control for an on/off setting. It participates in native forms: it submits a value, resets with its form, is disabled by a disabled `<fieldset>`, and validates `required`. It is keyboard operable and accessible, and supports a label, a description, an error message and two sizes.

Status: draft. Scope: specification only; no implementation.

## 1. Decisions on open questions

No reviewer was available, so each open question was resolved with the recommended option. Each is recorded here.

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| D1 | Underlying element | A visually styled native `<input type="checkbox" role="switch">` | Native checkbox gives form submission, reset, fieldset disabling, and constraint validation (`required`, `:invalid`, `setCustomValidity`) for free. `role="switch"` supplies the correct semantics. |
| D2 | Controlled and uncontrolled | Both are supported (`checked` / `defaultChecked`) | Matches common form-control conventions; uncontrolled is needed for plain-form use and reset. |
| D3 | Value submitted when on | `value` prop, default `"on"`; nothing submitted when off | Identical to native checkbox, so server code needs no special case. |
| D4 | Meaning of `required` | Must be on to be valid | Native checkbox behaviour. Typical use is "accept terms". |
| D5 | Sizes | `sm` and `md`; default `md` | Requested "two sizes". |
| D6 | Error display | Shown when `error` is set, or after a failed validation. Native browser bubble suppressed. | Consistent, accessible, stylable message. |
| D7 | When native validation messages appear | On `invalid` event (form submit attempt), cleared on next change | Avoids showing errors on pristine fields. |
| D8 | Label position | Label after the control (inline end); flips under RTL | Common convention. No configurable position in v1. |
| D9 | Missing label | Required: either `label` or an accessible name via `aria-label` / `aria-labelledby`. Missing both is a developer error (dev-mode warning). | Switch must always have an accessible name. |
| D10 | `readOnly` | Not supported in v1 | Native checkbox has no `readonly`; faking it is error-prone. Use `disabled`. |
| D11 | Indeterminate | Not supported | A switch is strictly binary. |
| D12 | Change event | One `onChange` receiving the native event; `onCheckedChange(checked: boolean)` convenience | Both idioms are widely used. |
| D13 | Motion | Thumb transition is disabled under `prefers-reduced-motion: reduce` | Accessibility. |
| D14 | Touch target | Minimum 44×44 CSS px hit area for `md`, 24×24 for `sm` (WCAG 2.2 target size minimum) | Meets WCAG 2.5.8 at minimum; `md` meets the enhanced guidance. |

## 2. Anatomy

```
<root>                      wrapper element (div), holds layout and size class
  <label>                   wraps/associates control + label text
    <input role="switch">   native checkbox, visually hidden but focusable
    <track><thumb/></track> decorative, aria-hidden
    <label text>
  <description>             optional helper text
  <error message>           optional, replaces nothing; shown alongside description
```

The whole label area (track plus text) is clickable and toggles the switch. The `input` is the element that receives focus, and it is never `display:none` or `visibility:hidden`.

## 3. API

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `label` | node | none | Visible label. See D9. |
| `description` | node | none | Helper text below the label. |
| `error` | node or string | none | Error message. Sets invalid state when non-empty. |
| `size` | `"sm"` or `"md"` | `"md"` | |
| `checked` | boolean | none | Controlled value. |
| `defaultChecked` | boolean | `false` | Uncontrolled initial value; also the value restored on form reset. |
| `onChange` | event handler | none | Native change event. |
| `onCheckedChange` | `(checked: boolean) => void` | none | Called after each user toggle. |
| `name` | string | none | Form field name. Without it nothing is submitted. |
| `value` | string | `"on"` | Submitted when checked. |
| `required` | boolean | `false` | See section 6. |
| `disabled` | boolean | `false` | See section 7. |
| `id` | string | generated | Applied to the `input`. |
| `form` | string | none | Associates with a form by id, as native. |
| `aria-label`, `aria-labelledby`, `aria-describedby` | string | none | Passed to the `input`. A consumer `aria-describedby` is merged with the generated description and error ids. |
| other attributes | | | `autoFocus`, `className`, `data-*` etc. pass through to the root, except input-specific attributes, which go to the `input`. |

Warnings (dev mode): providing both `checked` and `defaultChecked`; switching between controlled and uncontrolled over the component's lifetime; no accessible name.

## 4. Behaviour

### 4.1 State

- Two states: on (`checked`) and off.
- Controlled: displayed state always equals `checked`. A user toggle fires events but does not change the display until the parent updates `checked`.
- Uncontrolled: internal state initialised from `defaultChecked`, toggled by user action.

### 4.2 Keyboard

| Key | Result |
|-----|--------|
| `Tab` / `Shift+Tab` | Moves focus to / from the switch. A disabled switch is skipped. |
| `Space` | Toggles. |
| `Enter` | Does not toggle (native checkbox behaviour, and matches the ARIA switch pattern where Enter is optional). In a form, Enter performs implicit submission as for other inputs. |

Arrow keys have no effect.

### 4.3 Pointer and touch

- Click or tap anywhere in the label area toggles once.
- Clicking the description or error text does not toggle.
- Dragging the thumb is not supported in v1; a tap is the only gesture.
- Text selection of the label via double-click must not toggle twice (native label behaviour accepted).

### 4.4 Focus

- A visible focus indicator appears around the track on keyboard focus (`:focus-visible`), with at least 3:1 contrast against adjacent colours and at least 2 CSS px thickness.
- Focus is not lost when the state changes, including when the error appears or clears.

## 5. Accessibility

- Role: `switch` with the native `checked` state exposed as `aria-checked` equivalent. Do not add a redundant `aria-checked` to the native input.
- Accessible name from the associated label (`<label for>` or wrapping), or from `aria-label` / `aria-labelledby`.
- Accessible description: the `input` has `aria-describedby` listing, in order, the description id, the error id (when shown), then any consumer-supplied ids.
- Invalid: `aria-invalid="true"` when the error is shown. The error element has a stable id. It is announced by being referenced in `aria-describedby`; it is not a separate live region, to avoid double announcements. Announcement relies on the `aria-describedby` link (decision D6); v1 adds no `role="alert"`.
- Required: the native `required` attribute is set on the input (exposed as `aria-required` by the browser). A visual required marker, if shown, is `aria-hidden`.
- Disabled: native `disabled` attribute; exposed as disabled to assistive technology.
- The on/off state is never conveyed by colour alone: the thumb position differs, and the on state also shows a distinct glyph or contrast change in the track. Text alternatives are not added to the track; state is exposed through the role.
- Contrast: label, description and error text at least 4.5:1; the track and thumb boundary at least 3:1 against the background in both states. The disabled state is exempt per WCAG but must still be perceptibly distinct.
- Forced colours mode: track and thumb remain distinguishable using system colours (borders, `ButtonText`, `Highlight`); focus ring uses an outline that is not removed.
- Reduced motion: see D13.
- Right-to-left: thumb travel direction mirrors.

## 6. Form participation

### 6.1 Submission

- When `name` is set and the switch is on, the form submits `name=value` (`value` default `"on"`).
- When off, nothing is submitted for that name.
- Works with `FormData`, native submit, and `form.elements`.
- With the `form` attribute, association follows native rules even when the element is outside the form subtree.

### 6.2 Reset

- On form `reset`, an uncontrolled switch returns to `defaultChecked`.
- A controlled switch: the reset event fires `onChange`/`onCheckedChange` with the default state so the parent can sync; the display follows the parent's `checked` (it is the parent's responsibility). Reset also clears any shown validation error that came from native validation.

### 6.3 Disabled fieldset

- A switch inside a `<fieldset disabled>` is disabled, as for native controls: not focusable, not toggleable, not submitted, and styled as disabled. Disabled state is detected through the native `:disabled` pseudo-class and the `input`'s `disabled` property, not only the prop, so styling stays correct.
- Exception inherited from HTML: controls inside the first `<legend>` of the disabled fieldset remain enabled.
- When the fieldset becomes enabled again, the switch recovers with its state preserved.

### 6.4 Validation

- `required` and off: the input is in `valueMissing` state and the form blocks submission, focusing the first invalid control.
- `required` and on: valid.
- On the `invalid` event: the native bubble is prevented, the error element shows the message (the `error` prop if set, otherwise the browser's `validationMessage`), and `aria-invalid` is set.
- The error clears on the next change that makes the control valid.
- An `error` prop supplied by the consumer (for example server-side) shows regardless of native validity and is applied with `setCustomValidity` so `:invalid` and `checkValidity()` reflect it; it is cleared by passing an empty or absent `error`.
- Disabled controls are barred from constraint validation, as native.
- `form.noValidate` is respected: native blocking does not happen, but a consumer `error` still displays.

## 7. Disabled

- `disabled` prop sets native `disabled`.
- Visuals: reduced contrast track and thumb, `cursor: not-allowed` on the label area, label and description dimmed.
- Not focusable, not clickable, not submitted, no validation.
- The `error` message, if present, still displays.

## 8. Sizes

| Size | Track (w × h) | Thumb | Label text | Hit area |
|------|---------------|-------|------------|----------|
| `sm` | 32 × 18 px | 14 px | small | at least 24 × 24 px |
| `md` | 44 × 24 px | 20 px | base | at least 44 × 44 px |

- Sizes use design tokens; values above are defaults and may be re-themed, but the hit-area minimums must hold.
- The description and error text use the small text token in both sizes and align with the label start (not the track).
- Label and track are vertically centred on the first line of label text.

## 9. Layout and content

- Label, description and error wrap rather than truncate.
- Order: label row, then description, then error.
- Long labels never shrink the track (`flex-shrink: 0`).
- The error is styled with a danger colour plus an icon or text prefix so it is not colour-only.

## 10. Test requirements (acceptance criteria)

Each must be covered by an automated test.

1. Renders a `role="switch"` input with the accessible name from `label`; fails a dev warning when unnamed.
2. Click on label text, track, and `Space` on the focused input each toggle once; `Enter` does not.
3. Controlled mode holds its displayed state until the parent updates; uncontrolled toggles itself.
4. Inside a form with `name="n"` and default value: on submits `n=on`; off submits nothing; custom `value` is used.
5. Form `reset` restores `defaultChecked` in uncontrolled mode.
6. A switch inside `<fieldset disabled>` cannot be focused or toggled, is excluded from `FormData`, and shows disabled styles; one inside the first `<legend>` stays enabled.
7. `required` off: `checkValidity()` is false, submit is blocked, error appears with `aria-invalid="true"` and is referenced by `aria-describedby`; turning it on clears the error.
8. `error` prop shows the message, sets `aria-invalid`, and makes `checkValidity()` false; removing it reverses all three.
9. `aria-describedby` order is description, error, consumer ids, with no duplicates.
10. `disabled` prop: not focusable, not toggleable, not submitted.
11. Both sizes render with distinct dimensions and meet the minimum hit area.
12. Focus ring is visible under keyboard focus and not under mouse click.
13. `prefers-reduced-motion: reduce` removes the transition.
14. RTL mirrors thumb direction.
15. No axe violations in on, off, disabled, required-error and forced-colours states.

## 11. Out of scope for v1

Drag gesture, indeterminate state, `readOnly`, configurable label position, loading state, on/off text inside the track, switch groups.
