# Switch — Specification

Status: Draft v1 · Scope: behavior, API and accessibility contract. No implementation is included.

The project has no existing spec format or validator (it contains only a `package.json`), so this is a plain Markdown spec. Requirements use RFC 2119 keywords and carry stable IDs (`SW-n`) so tests can reference them.

## 1. Purpose

A Switch toggles a single on/off setting. It is a form control: it submits a value, resets with its form, is disabled by a disabled `<fieldset>`, and takes part in `required` validation. It supports a label, a description, an error message and two sizes.

Use a Switch for settings that take effect as a state ("Notifications: on"). For choosing among options, or for "I agree" confirmations, use a checkbox or radio group instead.

## 2. Anatomy

```
[ track [thumb] ]  Label
                   Description (optional)
                   Error message (optional)
```

1. **Control**: a native `<input type="checkbox" role="switch">`, visually replaced by the track and thumb. The native input stays in the DOM and is the single source of truth.
2. **Track and thumb**: purely visual, `aria-hidden`.
3. **Label**: required text, associated with the input.
4. **Description**: optional help text.
5. **Error message**: optional text shown when the switch is invalid.

## 3. API

| Prop | Type | Default | Notes |
|---|---|---|---|
| `checked` | boolean | – | Controlled state. |
| `defaultChecked` | boolean | `false` | Uncontrolled initial state. Also the state restored on form reset. |
| `onCheckedChange` | `(checked: boolean) => void` | – | Called on each user toggle. |
| `name` | string | – | Form field name. Without it nothing is submitted. |
| `value` | string | `"on"` | Submitted value when on. |
| `disabled` | boolean | `false` | Disables the control. |
| `required` | boolean | `false` | Must be on for the form to be valid. |
| `size` | `"sm" \| "md"` | `"md"` | |
| `label` | node | – | Required. |
| `description` | node | – | Optional. |
| `error` | node | – | Optional. Presence marks the switch invalid. |
| `id` | string | generated | Applied to the input. |
| `form` | string | – | Associates with a form outside the DOM ancestry. |

Other native input attributes (`autoFocus`, `aria-*`, `data-*`, `onFocus`, `onBlur`) pass through to the input. A `ref` reaches the input element.

## 4. Requirements

### 4.1 State
- **SW-1** The Switch MUST be either on or off. It MUST support controlled (`checked`) and uncontrolled (`defaultChecked`) use. Supplying both is a developer error; `checked` wins and a dev-mode warning is logged.
- **SW-2** A user toggle MUST call `onCheckedChange` with the new value. Programmatic changes MUST NOT.
- **SW-3** When controlled, the rendered state MUST follow `checked` only; the Switch MUST NOT flip itself if the parent ignores the change.

### 4.2 Form participation
- **SW-4** When on and `name` is set, the form MUST submit `name=value` (default `on`). When off, or when `name` is absent, nothing is submitted. (Native checkbox semantics.)
- **SW-5** On form reset the Switch MUST return to `defaultChecked` (or the initial `checked` for controlled use, with `onCheckedChange` called if that differs from the current state so the parent can sync).
- **SW-6** A Switch inside a disabled `<fieldset>` MUST behave as disabled: not focusable, not toggleable, not submitted. This MUST hold without the `disabled` prop being set, and the disabled styling MUST follow (`:disabled` state, not the prop).
- **SW-7** With `required`, an off Switch MUST be invalid (`validity.valueMissing`), blocking native form submission and firing `invalid`. `checkValidity()` and `reportValidity()` MUST work on the input. A disabled Switch is exempt.
- **SW-8** `required` MUST be exposed via the native `required` attribute (which maps to `aria-required` for the switch role). The label MUST NOT be altered automatically; a visual required marker is the consumer's concern.
- **SW-9** The `form` prop MUST associate the Switch with a form elsewhere in the document.

### 4.3 Interaction and keyboard
- **SW-10** Click or tap on the track, thumb or label text MUST toggle the Switch. The description and error message sit outside the `<label>` element and MUST NOT toggle it.
- **SW-11** The Switch MUST be a tab stop (`Tab` / `Shift+Tab`), unless disabled.
- **SW-12** `Space` MUST toggle the Switch. `Enter` MUST NOT toggle it (it keeps its native behavior of submitting the form via implicit submission).
- **SW-13** Arrow keys MUST NOT change the state.
- **SW-14** A visible focus indicator MUST appear on keyboard focus (`:focus-visible`) with at least 3:1 contrast against adjacent colors.
- **SW-15** The pointer hit area, including the label, MUST be at least 24×24 CSS px; the track itself MUST be at least 24px tall for `md`.

### 4.4 Accessibility
- **SW-16** The input MUST have `role="switch"` and expose its on/off state via the native `checked` property (reported as `aria-checked`).
- **SW-17** The accessible name MUST come from the `<label>` element tied by `for`/`id` or by wrapping. The Switch MUST warn in dev mode if no label is given.
- **SW-18** When present, the description MUST be referenced by `aria-describedby`. The error message MUST also be referenced by `aria-describedby`, listed after the description.
- **SW-19** When `error` is present the input MUST have `aria-invalid="true"`. The error text MUST NOT rely on color alone: it carries an icon or text and is not just red.
- **SW-20** Error text updates SHOULD be announced: the error container uses `role="alert"` only when the error appears after initial render; errors present on first render are not live.
- **SW-21** State MUST NOT be conveyed by color alone. The on and off positions differ by thumb position, and a high-contrast / forced-colors mode MUST keep both states distinguishable.
- **SW-22** On/off text MUST NOT be added to the label; the role conveys state. Labels SHOULD be neutral ("Notifications"), not state-bearing ("Turn notifications on").
- **SW-23** Motion on the thumb MUST be disabled under `prefers-reduced-motion: reduce`.
- **SW-24** Text and track/thumb contrast MUST meet WCAG 2.2 AA (4.5:1 text, 3:1 for the control boundary against its background in each state).

### 4.5 Error behavior
- **SW-25** `error` is supplied by the consumer. The Switch MUST NOT display the browser's native validation bubble text itself; on an `invalid` event it prevents the default bubble only if `error` is set. Consumers wire the `invalid` event or their own validation into `error`.
- **SW-26** The Switch MUST NOT clear `error` itself. When `error` is removed, `aria-invalid` and the `aria-describedby` reference MUST be removed.
- **SW-27** `error` MUST NOT disable the control.

### 4.6 Disabled
- **SW-28** `disabled` MUST remove the control from tab order and block input. The label and description render dimmed but MUST stay readable (AA contrast is exempt for disabled controls per WCAG, but text SHOULD remain legible).

### 4.7 Sizes
- **SW-29** `size="md"` (default): track 44×24px, thumb 20px. `size="sm"`: track 32×18px, thumb 14px; the label hit area MUST still be at least 24px tall (SW-15). Label typography: `md` 16px, `sm` 14px. Both sizes MUST have identical behavior.
- **SW-30** Layout MUST be RTL-aware: the thumb moves toward the inline-end when on, and the thumb travel flips in `dir="rtl"`.

## 5. States

| State | Visual / semantic |
|---|---|
| off | thumb at inline-start |
| on | thumb at inline-end, accent track |
| hover | track tint (pointer devices only) |
| focus-visible | focus ring |
| disabled | dimmed, no pointer events, not focusable |
| invalid | error text and `aria-invalid`; invalid track outline |
| required | `required` attribute only |

## 6. Acceptance scenarios

1. Given `name="notify"` and on state, submitting the form yields `notify=on`; when off, `notify` is absent. (SW-4)
2. Given `value="yes"`, on state submits `notify=yes`. (SW-4)
3. Toggle on, reset the form: state returns to `defaultChecked`. (SW-5)
4. In `<fieldset disabled>` the switch cannot be focused or toggled and is not submitted, and re-enabling the fieldset restores it. (SW-6)
5. `required` and off: `form.requestSubmit()` is blocked and `invalid` fires; turn on and the submit succeeds. (SW-7)
6. Focus via `Tab`; `Space` toggles; `Enter` does not toggle; arrows do nothing. (SW-11–13)
7. Clicking the label toggles it; clicking the description does not. (SW-10)
8. A screen reader announces "Notifications, switch, off", then description, then error if any. (SW-16–18)
9. With `error`, `aria-invalid="true"` is set and `aria-describedby` lists description then error ids. Without it, neither is present. (SW-18, 19, 26)
10. Controlled with a parent that ignores `onCheckedChange`: the state does not change. (SW-3)
11. Forced-colors mode and reduced-motion: states remain distinguishable and the thumb does not animate. (SW-21, 23)

## 7. Non-goals

- Indeterminate state (a switch is binary).
- Built-in on/off text inside the track.
- Built-in validation messages or validation timing logic.
- A group component (`SwitchGroup`).
- Implementation code.

## 8. Decisions on open questions

No reviewer was available, so each open question was resolved with the recommended option.

| # | Question | Decision | Reason |
|---|---|---|---|
| D1 | Native input or custom `role="switch"` element? | Native `<input type="checkbox" role="switch">`. | Gives form submission, reset, fieldset-disabled and `required` validation for free, consistent across browsers. |
| D2 | Default submitted value? | `"on"`. | Matches native checkbox; `value` can override. |
| D3 | Does an off Switch submit anything? | No. | Native semantics; avoids a hidden-input workaround. Consumers needing `false` add their own hidden field. |
| D4 | Meaning of `required` for a Switch? | Must be on. | Same as a required checkbox; suits "accept terms"-style settings. |
| D5 | Does `Enter` toggle? | No, `Space` only. | WAI-ARIA APG makes Enter optional; native input uses it for implicit submit. |
| D6 | Who produces error text? | The consumer, via `error`. | Keeps the component free of validation timing and i18n logic. |
| D7 | Does the description toggle on click? | No. | Keeps the label as the only text target and avoids accidental toggles. |
| D8 | Sizes? | `sm` and `md` only, `md` default. | As requested. |
| D9 | Controlled and uncontrolled? | Both. | Standard form-control convention. |
| D10 | Label required? | Yes, with a dev-mode warning. | Unlabeled switches are inaccessible. |
