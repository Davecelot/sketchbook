---
component: Switch
status: draft
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-12
source: shadcn/ui Switch (UI and API), WAI-ARIA APG Switch pattern (keyboard and ARIA), rule form-associated-controls (form behavior), harness process
---

# Switch

> Draft. Typed spec: [contract.json](./contract.json). Every open question was answered with its recommendation because no reviewer was available; see [Open questions](#open-questions) and SB-0101.

## 1. Purpose

`<sb-switch>` turns one setting on or off. It acts like a native form control: while on, it submits `value` under `name`. It goes back to its default state on `form.reset()`. It is disabled by a `<fieldset disabled>` and fails validation when it is `required` and off. It carries its own label, description and error message, and comes in two sizes.

Use it for an independent on/off setting. For a choice among options use a radio group. For a partial ("mixed") state use a checkbox.

## 2. Anatomy

```
root (grid)
├── track                 part="track"
│   ├── control           part="control"   <input type="checkbox" role="switch">, transparent, ≥ 24×24 hit area
│   └── thumb             part="thumb"     circle; inline-start when off, inline-end when on
└── content (optional)
    ├── label             part="label"     <label> for the control
    │   └── required-mark part="required-mark"  "*", aria-hidden
    ├── description       part="description"
    └── error             part="error"     only while validation="error"
```

## 3. Props / API

| Prop | Attribute | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `checked` | `checked` | boolean | `false` | Live on/off state. The attribute is the **default** state, restored by `form.reset()`. The property does not reflect (native semantics). This is the registered alias of the canonical `selected`. |
| `value` | `value` | string | `"on"` | Submitted while on. Nothing is submitted while off. |
| `name` | `name` | string | `""` | Form field name (FormAssociated). |
| `required` | `required` | boolean | `false` | Must be on to be valid (`valueMissing`). Shows the required mark. |
| `disabled` | `disabled` | boolean | `false` | Not focusable, togglable or submitted. A disabled fieldset has the same effect without changing this attribute. |
| `label` | `label` | string | `""` | Visible label and accessible name (NativeControl). |
| `description` | `description` | string | `""` | Hint under the label, in `aria-describedby` (NativeControl). |
| `errorMessage` | `error-message` | string | `""` | Shown only while `validation="error"`. |
| `validation` | `validation` | `none` \| `error` | `none` | Error look + `aria-invalid` + error message. |
| `size` | `size` | `small` \| `medium` | `medium` | Track 24×16 or 32×20. |

Methods and getters come from the FormAssociated mixin: `form`, `validity`, `validationMessage`, `willValidate`, `checkValidity()`, `reportValidity()`. `click()` and `focus()` come from NativeControl/delegatesFocus.

**Events**

| Event | Bubbles | Composed | When |
| --- | --- | --- | --- |
| `input` | yes | yes | The user toggles it (pointer, label, Space). Native. |
| `change` | yes | yes | After the user toggles it. The form value is already synced. Not fired for property changes or reset. |

No custom events and no slots.

## 4. Variant matrix

| | validation none | validation error |
| --- | --- | --- |
| **medium** | ✓ | ✓ |
| **small** | ✓ | ✓ |

Each cell is drawn × checked (off, on) × disabled (rest only) × focus-visible. Every combination is valid.

## 5. Roles and color

| Element | Off | On | Token |
| --- | --- | --- | --- |
| Track | `color.input` | `color.primary` | `switch.track.background`, `-checked` |
| Thumb | `color.background` | `color.primary-foreground` | `switch.thumb.background`, `-checked` |
| Track border (invalid) | `color.destructive` | `color.destructive` | `switch.track.border-color-invalid` |
| Focus ring | `color.ring` (invalid: `color.destructive`) | same | `switch.focus-ring.color`, `-invalid` |
| Label | `color.foreground` | | `switch.label.color` |
| Required mark | `color.destructive` | | `switch.required-mark.color` |
| Description | `color.muted-foreground` | | `switch.description.color` |
| Error | `color.destructive` | | `switch.error.color` |

Contrast pairs (checked by T6 in every mode): the track off and on against the page (3:1), the thumb against each track (3:1), the focus ring and invalid border against the page (3:1), and the label, description and error text (4.5:1). Off and on differ in thumb position as well as color, so color is not the only cue (1.4.1).

## 6. States

| State | Trigger | Change |
| --- | --- | --- |
| checked | `checked` true | Track takes the on color, thumb moves to inline-end (animated with `switch.motion.*`, none under `prefers-reduced-motion`). |
| focus-visible | `:state(focus-visible)` synced from the input | Ring of `switch.focus-ring.width` around the track. |
| invalid | `validation="error"` | Track border and ring turn destructive. The error message shows. |
| disabled | `:host(:disabled)` (own attribute or fieldset) | `switch.disabled.opacity` on the whole component, `cursor: not-allowed`. |

There is no hover look (the reference has none). The cursor is a pointer over the track and label.

## 7. Dimensions and layout

| | medium (default) | small |
| --- | --- | --- |
| Track | `size.switch.width` × `size.switch.height` (32×20) | `size.switch.width-sm` × `size.switch.height-sm` (24×16) |
| Thumb | track height − 2 × `switch.track.inset` (16) | (12) |
| Hit area | ≥ 24×24 centered on the track | ≥ 24×24 |

- Track: `switch.track.radius` (pill), a `switch.track.border-width` border that is transparent except when invalid, and the `switch.track.shadow` shadow.
- Gap between the track and the content: `switch.gap`. Gap between label, description and error: `switch.content.gap`.
- The track aligns with the first line of the label. The content wraps and the track never shrinks.
- RTL: the thumb's on position is inline-end, so it mirrors.
- Forced colors: the track border is drawn in `CanvasText`, the on track in `Highlight` and the thumb in `ButtonText`, so the state stays visible.

## 8. Typography

| Text | Size | Weight | Line height |
| --- | --- | --- | --- |
| Label | `font.size.control` | `font.weight.label` | `font.line-height.label` |
| Description | `font.size.body` | inherited (body) | `font.line-height.body` |
| Error | `font.size.body` | inherited (body) | `font.line-height.body` |

## 9. Accessibility

- **Role:** `switch`, on a native `<input type="checkbox" role="switch">` inside the shadow root (`delegatesFocus`). The on/off state comes from the native `checked`, so no `aria-checked` is set by hand.
- **Name:** the `label` prop, as a `<label>` for the input. With no visible label, `aria-label` or `aria-labelledby` on the host is forwarded. A console warning fires when there is no name. An outside `<label for>` activates the switch but does not name it.
- **Description:** `aria-describedby` points to the description, and to the error while `validation="error"`.
- **Invalid:** `aria-invalid="true"` while `validation="error"`.
- **Keyboard:** Tab and Shift+Tab move focus (one tab stop, skipped while disabled). Space toggles. Enter does not toggle: the APG makes it optional, and the native input doesn't toggle on Enter.
- **Form association:** `FormAssociated(NativeControl(LitElement))`.
  - `formValue()` is `value` while on and `null` while off.
  - `formReset()` sets `checked` from `hasAttribute('checked')`.
  - `formStateRestore()` restores from a separate on/off marker.
  - `validationAnchor()` is the input, so the browser supplies the `valueMissing` message and `reportValidity()` focuses it.
  - The inner input uses `?disabled=${this.isDisabled}`.
  - `syncFormState()` runs in the input handler before `change` is re-dispatched.
  - A `<label for>` click on the host is forwarded to the input.
- **Target size:** the input overlay is at least 24×24 CSS px in both sizes (2.5.8).
- **Motion:** the thumb slides only without `prefers-reduced-motion: reduce`.
- **Announcements:** on focus, "[label], switch, on/off, [description]". On toggle, the new state is announced from the native change. There is no live region.
- **WCAG 2.2 AA:** 1.3.1, 1.4.1, 1.4.11, 2.1.1, 2.3.3, 2.4.7, 2.5.8, 3.3.1, 3.3.2, 4.1.2.

## 10. Usage

### Behavior
- Toggling changes `checked` right away and fires `input` then `change`. Within a form, the value is sent on submit.
- Setting `checked` from script fires no event (native parity).
- `form.reset()` restores the `checked` attribute state and fires no event.
- In a disabled fieldset the switch is dimmed, skipped by Tab, ignored by clicks and left out of `FormData`. Re-enabling the fieldset restores all of that.

### Composition
- Standalone with its own `label`. Or named from outside with `aria-labelledby` when a layout (a settings row, a card) shows the text elsewhere.
- Inside a field group, give each switch its own label. A group heading is not a substitute for a label.

### Choosing the props
- `size="small"` is for dense lists and tables. `medium` is for everything else.
- Use `required` only when the form can't be submitted with the setting off (for example, accepting terms).
- Set `validation="error"` and `error-message` after a failed submit, not on load.

### Do / Don't
- **Do** name the setting ("Email notifications").
- **Don't** change the label with the state ("On" / "Off"). The state is already announced (APG).
- **Don't** use a switch for a mixed state. Use a checkbox with `indeterminate`.
- **Don't** use several switches for one exclusive choice. Use a radio group.

## Realizations
### Figma
Not started. The design file draws the Size and Validation axes, plus the Selected (from `checked`) and Disabled axes and the Focus state. It uses the layers `switch.content`, `switch.label-text` and `switch.focus-ring` registered in spec/api.json.
### Web
Not started. The behavior spec is `playwright/tests/switch/switch.behavior.spec.ts`, and it is written first (see [plan.md](./plan.md)).
### Coverage
None yet.
### Known drift
These are the deliberate deviations from the visual reference (listed in contract.json `realizations.web.drift`):
- The off track uses this project's darker `color.input`, so it meets 3:1 non-text contrast.
- The focus ring is solid, not half-opacity.
- The hit area is at least 24×24.
- The label, description and error are built in, not composed from separate elements.

## Open questions

No reviewer was available. Each question was answered with its recommendation on 2026-11-12, and a reviewer may reopen any of them.

| Id | Question | Answer (recommended) |
| --- | --- | --- |
| Q0 | Contract drafted from the visual reference and the APG? | Yes. Deviations are listed as drift. |
| Q1 | `checked` or canonical `selected`? | `checked` (registered alias, native and framework parity). |
| Q2 | Does the `checked` attribute reflect? | No. The attribute is the default state and the property is live (native). |
| Q3 | Native input or hand-made role switch? | Native `<input type="checkbox" role="switch">`. `<input switch>` is not used because browser support is partial. |
| Q4 | Does Enter toggle? | No. Space only. |
| Q5 | Is the error look automatic from native validity? | No. The `validation` prop drives the look, and native validity works independently. |
| Q6 | Which sizes, and how is the target size met? | small and medium, with an input overlay of at least 24×24. |
| Q7 | Props or slots for label, description and error? | Text props only. |
| Q8 | What does formStateRestore store? | A separate on/off marker. |

## Spec for agents
Build from contract.json only. CSS uses only --sb-switch-* variables (check T4). Tests first (rule test-first). Extend `FormAssociated(NativeControl(LitElement))` (rule form-associated-controls).
