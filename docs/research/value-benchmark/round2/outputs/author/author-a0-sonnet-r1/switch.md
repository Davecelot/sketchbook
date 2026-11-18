# Switch — Component Specification

Status: Draft v1 · Scope: specification only (no implementation)

The project contains no existing spec format, conventions or validation tooling (only an empty `package.json`), so this is a plain Markdown spec with numbered, testable requirements. Keywords MUST / SHOULD / MAY follow RFC 2119.

## 1. Purpose

A Switch toggles a single on/off setting whose effect is conceptually immediate (e.g. "Enable notifications"). It is a form control: it submits a value, resets with its form, honours a disabled `<fieldset>`, and supports `required` validation. It is not for choosing among options (use Radio/Select) or for "agree to terms" semantics (use Checkbox), though `required` is supported for consent-style cases.

## 2. Anatomy

```
[ track[ thumb ] ]  Label
                    Description
                    Error message
```

- **Root**: wrapper element that lays out the parts.
- **Input**: a native `<input type="checkbox" role="switch">`, visually replaced by the track/thumb but remaining in the accessibility tree and tab order. Using the native input provides form participation, validation, reset, fieldset-disabled and keyboard behaviour for free (see decision D1).
- **Track / Thumb**: purely decorative (`aria-hidden`); thumb position and track colour reflect state.
- **Label**: required text (see 6.1). **Description**: optional help text. **Error message**: optional, shown when invalid.

## 3. Props / API

| Prop | Type | Default | Notes |
|---|---|---|---|
| `checked` | boolean | – | Controlled state. |
| `defaultChecked` | boolean | `false` | Uncontrolled initial state; also the value restored on form reset. |
| `onCheckedChange` | `(checked: boolean) => void` | – | Fired on user toggle only, not on programmatic reset. |
| `name` | string | – | Form field name. Without it, nothing is submitted. |
| `value` | string | `"on"` | Submitted value when on. |
| `disabled` | boolean | `false` | Disables interaction and submission. |
| `required` | boolean | `false` | Must be on to be valid. |
| `label` | ReactNode / slot | – | Visible label. |
| `description` | ReactNode / slot | – | Help text. |
| `error` | string / ReactNode | – | Error message; presence marks the switch invalid. |
| `size` | `"sm" \| "md"` | `"md"` | Two sizes. |
| `id` | string | generated | Applied to the input. |
| `form` | string | – | Associates with a form by id (native behaviour). |
| `aria-label` / `aria-labelledby` | string | – | Alternative to `label` (see 6.1). |
| remaining attributes | – | – | Forwarded to the input; `ref` targets the input. |

Framework-neutral: type notation is illustrative; the binding (React, Web Component, etc.) is chosen at implementation time.

## 4. States

States: off, on, hover, focus-visible, active (pressed), disabled (off / on), invalid, required. Combinations MUST all render distinctly and legibly. State MUST NOT be conveyed by colour alone: the thumb position (left = off, right = on, mirrored in RTL) is the primary cue. In forced-colors / high-contrast mode, the track and thumb MUST remain distinguishable using system colours, and the focus ring MUST remain visible.

## 5. Behaviour

### 5.1 Interaction
1. Clicking the track, thumb, label or description-label area toggles the switch (label is associated via `for`/wrapping).
2. Clicking disabled switch does nothing.
3. Controlled mode: the component MUST NOT change its own state; it only calls `onCheckedChange`, and renders whatever `checked` says. Uncontrolled mode manages its own state.
4. Switching is instantaneous in effect; the transition animation (thumb slide, ≤200 ms) MUST be disabled under `prefers-reduced-motion: reduce`.

### 5.2 Keyboard
| Key | Behaviour |
|---|---|
| `Tab` / `Shift+Tab` | Moves focus to/from the switch; a disabled switch is skipped. |
| `Space` | Toggles (on keyup, native checkbox behaviour). |
| `Enter` | Does not toggle; MUST keep native behaviour (implicit form submission). See D3. |

No arrow-key handling. Focus MUST show a visible focus ring (`:focus-visible`) with ≥3:1 contrast against adjacent colours, and MUST NOT be clipped.

### 5.3 Form participation
1. **Submit value**: when on and `name` is set and not disabled, the form data contains `name=value` (default `"on"`). When off, nothing is submitted (native checkbox semantics; see D2).
2. **Reset**: on the form's `reset` event the switch returns to `defaultChecked` (uncontrolled) — or, for controlled use, the initial `checked` attribute state of the input — and the invalid/error state derived from validation is cleared. `onCheckedChange` is not fired by reset in uncontrolled mode; controlled consumers listen to the form's `reset` event themselves. Visual state MUST update.
3. **Disabled fieldset**: a switch inside `<fieldset disabled>` MUST behave as disabled (not focusable, not toggleable, not submitted, disabled styling), and recover when the fieldset is re-enabled. This follows from using the native input; the visual styling MUST be driven by `:disabled` (not only by the `disabled` prop) so inherited disabling is styled.
4. **Required validation**: with `required`, an off switch is invalid (`validity.valueMissing`) and blocks form submission via native constraint validation; the browser's validation bubble appears and focus moves to the switch. `aria-required` MUST NOT be added redundantly where the native `required` attribute is present.
5. **Custom errors**: `error` MUST call `setCustomValidity(message)` on the input (cleared when `error` is removed) so that the form's `checkValidity()` agrees with the visual state. Validation timing: native on submit; the `error` prop lets the consumer show errors at any time.
6. Programmatic API: `form.reset()`, `checkValidity()`, `reportValidity()`, `FormData`, `form.elements[name]` all work as for a native checkbox.
7. `readOnly` is NOT supported (checkboxes have no native readOnly) — see D4.

## 6. Accessibility

1. **Name**: the switch MUST have an accessible name from the visible `label`, or from `aria-label` / `aria-labelledby`. If none is provided the implementation MUST warn in development.
2. **Role**: `role="switch"` on the native checkbox input; checked state exposed through native `checked` (maps to `aria-checked`). Screen readers announce "<name>, switch, on/off".
3. **Description**: description text is linked via `aria-describedby`. When an error is shown, the error id is also included in `aria-describedby` (error first, then description).
4. **Invalid**: when `error` is present, `aria-invalid="true"` is set on the input. The error text MUST be rendered in an element that is announced when it appears (`role="alert"` is not used; a polite live region (`aria-live="polite"`) is, see D5), and MUST include a non-colour cue (an icon or text prefix is acceptable; the message itself is text).
5. **Disabled**: use native `disabled`, not just `aria-disabled` (see D6).
6. **Contrast**: text ≥4.5:1; the track and thumb boundaries and focus ring ≥3:1 against their backgrounds in both on and off states and in disabled state where reasonable (disabled is exempt from WCAG contrast but SHOULD stay discernible).
7. **Target size**: the interactive area (input plus label) MUST be at least 24×24 CSS px (WCAG 2.2 AA 2.5.8); SHOULD be ≥44 px high on touch devices for `md` via the label hit area.
8. **Text resize / zoom**: layout MUST reflow to 200% text size without loss; long labels wrap and do not overlap the track.
9. The native input is visually hidden by sizing it to overlay the track with `opacity: 0` (not `display: none`, not `visibility: hidden`) so it stays focusable and in the accessibility tree.

## 7. Sizes

| Size | Track (w × h) | Thumb | Label font | Gap |
|---|---|---|---|---|
| `sm` | 32 × 18 px | 14 px | 14 px | 8 px |
| `md` (default) | 44 × 24 px | 20 px | 16 px | 12 px |

Thumb inset 2 px. Exact values are design tokens and MAY be adjusted by the design system, but the two-size ratio, thumb inset and ≥24 px hit area (6.7) MUST hold. Description and error use a font one step smaller than the label. Colours come from theme tokens (on, off, disabled, error, focus ring); no hard-coded colours.

## 8. Layout and content

- Label, description and error are stacked in a text column to the end of the track (start side in RTL: track on the inline-start side). Placing the label before the track is out of scope (D7).
- The error and description are aligned with the label text, not the track.
- Layout MUST NOT shift when an error appears beyond adding the error line itself.
- Label and description are inert text; links inside a description are discouraged because clicking them would toggle the switch unless the click is prevented — implementations MUST NOT let a click on interactive content inside the description toggle the switch.

## 9. Acceptance criteria (test checklist)

1. Renders a native checkbox with `role="switch"`, labelled by `label`.
2. Click on the label, track and input toggles; `Space` toggles; `Enter` does not.
3. Disabled: not focusable via Tab, click ignored, absent from `FormData`.
4. `<fieldset disabled>` disables it, and re-enabling restores it, without changing the `disabled` prop.
5. `FormData` has `name=on` when on, the custom `value` when set, and no entry when off.
6. `form.reset()` restores `defaultChecked` and the visuals; the error state from validation is cleared.
7. `required` + off: `form.checkValidity()` is false, submit is blocked; turning on makes it valid.
8. `error` sets `aria-invalid`, `setCustomValidity`, and is referenced by `aria-describedby`; removing it clears all three.
9. `description` is referenced by `aria-describedby`.
10. Controlled: state follows `checked` only; the user toggle calls `onCheckedChange` with the requested value.
11. Both sizes render at the specified dimensions; the hit area ≥24 px.
12. Focus ring is visible on keyboard focus and not on mouse click; reduced motion removes the transition; forced-colors mode keeps state visible; RTL mirrors thumb movement.
13. Automated accessibility scan (e.g. axe) reports no violations for every state × size combination.

## 10. Out of scope

Indeterminate state, loading/pending state, icons inside the thumb, label-before-track placement, switch groups (a future SwitchGroup/Fieldset may wrap several), async confirmation, and any implementation code.

## 11. Decisions on open questions

Nobody was available to answer questions, so the recommended option was chosen for each. Revisit by amending this section.

| # | Question | Decision | Rationale |
|---|---|---|---|
| D1 | Native input vs custom `div role="switch"` plus hidden input? | Native `input type=checkbox role=switch`. | Free form participation, reset, validation, fieldset-disabled, keyboard and accessibility semantics; fewer bugs. |
| D2 | Submit `"off"` value when unchecked? | No; submit nothing when off. | Matches native checkboxes and consumer expectations; a hidden-input fallback can be added by the consumer. |
| D3 | Should `Enter` toggle? | No. | ARIA switch pattern specifies Space (Enter optional); Enter submitting the form is the native expectation. |
| D4 | Support `readOnly`? | No. | No native equivalent; faking it with `aria-readonly` is unreliable for switch role. Use `disabled`. |
| D5 | Error announcement via `role="alert"` or polite live region? | Polite live region plus `aria-describedby`. | Avoids interrupting users; the error is still read when the switch is focused. |
| D6 | `disabled` vs `aria-disabled` (keeping focusability)? | Native `disabled`. | Required for fieldset-disabled to work uniformly and for exclusion from submission. |
| D7 | Label placement options? | Label after the track only (mirrored in RTL). | Simplest consistent layout; add a `labelPosition` prop later if needed. |
| D8 | Validation timing for `required`? | Native, on submit only; the consumer controls earlier display via `error`. | Avoids showing errors on an untouched control. |
| D9 | Spec format? | Single Markdown file at `specs/switch.md`. | The project has no existing spec format or validator to follow. |
