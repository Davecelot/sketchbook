# Switch — Component Specification

Status: Draft v1
Keywords "MUST", "SHOULD", "MAY" are used as in RFC 2119.

## 1. Purpose

Switch is a toggle for a single on/off setting. Unlike a checkbox, changing it takes effect immediately in the UI (it represents a state, not a selection to be confirmed). It is a form-associated control: it submits a value, resets with its form, is disabled by an ancestor disabled `<fieldset>`, and participates in constraint validation (`required`).

Non-goals: tri-state/indeterminate, multi-option selection (use Checkbox/Radio Group), and any implementation code in this document.

## 2. Anatomy

- **Root**: wrapper element holding all parts; carries size and state data attributes.
- **Control**: the interactive element exposing `role="switch"` (track + thumb are decorative and `aria-hidden`).
- **Label**: visible text naming the switch.
- **Description** (optional): helper text beneath the label.
- **Error message** (optional): text shown when the switch is invalid.
- **Hidden form input**: the mechanism by which the value is submitted (see 5.1).

## 3. Props / API

| Prop | Type | Default | Description |
|---|---|---|---|
| `checked` | boolean | – | Controlled on-state. |
| `defaultChecked` | boolean | `false` | Uncontrolled initial state; also the value restored on form reset. |
| `onCheckedChange` | `(checked: boolean) => void` | – | Called on user-initiated change only. |
| `name` | string | – | Form field name. Without it nothing is submitted. |
| `value` | string | `"on"` | Value submitted when on. |
| `disabled` | boolean | `false` | Disables the switch. Combined (OR) with a disabled ancestor fieldset. |
| `required` | boolean | `false` | Switch MUST be on for the form to be valid. |
| `invalid` | boolean | `false` | Externally forced invalid state (e.g. server error). |
| `label` | node | – | Visible label (or provide via a Label part). |
| `description` | node | – | Helper text. |
| `error` | node | – | Error message; displayed only while invalid. |
| `size` | `"sm" \| "md"` | `"md"` | Visual size. |
| `id` | string | generated | Id of the control. |
| `form` | string | – | Associates with a form by id outside the DOM ancestry. |
| `aria-label` / `aria-labelledby` | string | – | Name when no visible label is given. |

Controlled and uncontrolled use MUST NOT be mixed; switching modes during the component's lifetime is unsupported and SHOULD warn in development.

## 4. Behavior

### 4.1 Interaction
1. Click/tap on the control or on the label toggles the switch.
2. `Space` toggles when the control is focused. `Enter` does NOT toggle (matches the ARIA switch pattern) and MUST NOT submit the form as a side effect of toggling.
3. Toggling fires `onCheckedChange` once per user action, with the new value, and a bubbling `change`/`input` event.
4. When disabled: no focus via tab-order, no toggling, no events; label click does nothing.
5. Programmatic changes to `checked` do not fire `onCheckedChange`.

### 4.2 Sizes
- `sm` and `md`. Both MUST keep an interactive hit area of at least 24×24 CSS px (WCAG 2.2 SC 2.5.8); `md` SHOULD target 44px-high hit area on touch. Size changes dimensions only, never behavior.

### 4.3 Visual states (exposed as data attributes on Root and Control)
`data-state="checked|unchecked"`, `data-disabled`, `data-invalid`, `data-required`, `data-focus-visible`, `data-size="sm|md"`. State MUST NOT be conveyed by colour alone: the thumb position differs between on and off, and the on state SHOULD show an additional non-colour cue (e.g. icon or contrast-bearing track fill). Focus ring MUST be visible with ≥3:1 contrast and shown for keyboard focus. Motion on the thumb MUST be disabled under `prefers-reduced-motion: reduce`.

## 5. Form participation

### 5.1 Submission
- When `name` is set and the switch is on and not disabled, the form submits `name=value` (default `on`).
- When off or disabled, nothing is submitted for that name (native checkbox semantics).
- Implemented through a form-associated mechanism (native checkbox input visually hidden, or element internals) so `FormData`, `form.elements`, and the `form` attribute work. The hidden mechanism MUST NOT be separately focusable or announced (no duplicate in the accessibility tree).

### 5.2 Reset
- On the owning form's `reset` event, the switch returns to `defaultChecked` (uncontrolled). In controlled mode the component fires `onCheckedChange(defaultChecked)` if different and the parent decides. Validation/error display is cleared on reset.

### 5.3 Disabled fieldset
- A switch inside `<fieldset disabled>` behaves as `disabled` (4.1.4, not submitted), including styling and `aria-disabled`. Re-enabling the fieldset restores the switch's own `disabled` prop result. Exception per HTML: descendants of the fieldset's first `<legend>` are not disabled.

### 5.4 Validation
- With `required`, an off switch is `valueMissing`: `validity.valueMissing === true`, `checkValidity()` false, form submission blocked, `invalid` event fired.
- Validation messages follow the browser default unless `error` is supplied.
- Error display timing: the error appears after a failed submit attempt (an `invalid` event) or when `invalid` is set; it is NOT shown on initial render and NOT on first blur. It clears when the switch becomes valid (turned on) or on form reset.
- Disabled switches are barred from constraint validation (never block submit).
- `setCustomValidity` equivalent: setting `invalid` externally marks `aria-invalid` but does not alter native `validity` unless a custom-validity API is exposed.

## 6. Accessibility

- Control has `role="switch"` with `aria-checked="true|false"` (if a native checkbox input is the control, `role="switch"` is added to it and `aria-checked` is derived from `checked`).
- Accessible name: from the visible Label (via `for`/`aria-labelledby`); else `aria-label`/`aria-labelledby`. A development warning MUST be raised if none is available.
- Description is linked with `aria-describedby`; error message is also in `aria-describedby` while shown, and the control has `aria-invalid="true"`. The error element SHOULD use `role="alert"` or be in a polite live region so it is announced when it appears.
- `required` is exposed via `aria-required="true"` (or native `required`); a visual required indicator, if shown, is not the sole cue.
- Disabled: native `disabled` (or `aria-disabled="true"` with tabindex removed).
- Single tab stop; focus order follows DOM order. State changes are announced by the role itself; no extra live region.
- Text contrast ≥4.5:1; track/thumb boundaries ≥3:1 against adjacent colours (WCAG 1.4.11), in on, off, disabled (disabled exempt from requirement), and error states.
- Supports forced-colors / high-contrast mode: states remain distinguishable using system colours.
- Label text in RTL: layout mirrors; thumb direction follows writing direction.

## 7. Layout

Label and description are placed beside the control (label side configurable via CSS/slot; default control-first then text in inline direction). Description sits below label; error sits below description. Long text wraps without resizing the control. Hit area includes the label.

## 8. Test plan (acceptance criteria)

1. Click on control and on label toggles; Space toggles; Enter does not toggle or submit.
2. Controlled and uncontrolled both work; `onCheckedChange` fires once per user action and never on prop change.
3. `FormData` includes `name=on` only when on; custom `value` honoured; `form` attribute honoured.
4. `form.reset()` restores `defaultChecked` and clears the error.
5. `<fieldset disabled>` blocks toggling, focus, and submission; toggling the fieldset back restores behavior.
6. `required`: off blocks submit and triggers `invalid`; on passes; disabled+required does not block.
7. Error appears only after a failed submit or `invalid`, links via `aria-describedby`, sets `aria-invalid`.
8. Accessibility tree shows exactly one `switch` with correct name, checked, disabled, required, description.
9. Both sizes meet the minimum hit area; reduced motion and forced-colors verified.

## 9. Decisions on open questions

Recorded without stakeholder input; the recommended option was chosen for each.

| # | Question | Decision | Rationale |
|---|---|---|---|
| D1 | Submitted value when on? | `"on"` by default, overridable by `value`; nothing when off | Matches native checkbox, works with existing server handling. |
| D2 | Native checkbox or custom element for form behavior? | Native checkbox input with `role="switch"` as the form mechanism | Gets reset, fieldset-disabled, `required`, `form` attr for free. |
| D3 | Does Enter toggle? | No, Space only | ARIA switch pattern; Enter-submits-form stays native. |
| D4 | When is error shown? | After failed submit/`invalid` or when `invalid` set | Avoids premature errors on first blur. |
| D5 | Controlled reset behavior? | Fire `onCheckedChange(defaultChecked)`; parent owns state | Keeps single source of truth. |
| D6 | Sizes | `sm`, `md` only; default `md` | As requested; keep API minimal. |
| D7 | Indeterminate state | Not supported | Switch is binary. |
| D8 | Label side | Control-first by default; styling concern, not a prop | Avoids API growth. |
| D9 | Spec format | Single Markdown file at `specs/switch.md` | The project has no existing spec format or validator. |
| D10 | Does `required` make sense for a switch? | Yes, as "must be on" (e.g. accept terms) | Explicitly requested; mirrors checkbox. |
