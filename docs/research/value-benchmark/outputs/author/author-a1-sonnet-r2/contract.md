---
component: Switch
status: draft
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-12
source: shadcn/ui Switch (UI and API), WAI-ARIA APG switch pattern, harness process
---

# Switch

> A toggle for an on/off setting that takes part in a form like any native field. Typed spec: [contract.json](./contract.json).

## 1. Purpose

A Switch lets a person turn one setting on or off, with the result felt as soon as they flip it (notifications, dark mode, a feature flag). It is a form field: while on it submits its value, a form reset puts it back to where it started, a disabled fieldset disables it, and `required` means it must be on for the form to be valid. It is operable by keyboard alone, has an accessible name, and can carry a description and an error message beside the label. It comes in two sizes.

## 2. Anatomy

- **Control**: the switch itself, the one focusable part. It holds the **track** (the pill whose fill shows on or off) and the **thumb** (the knob that sits at the start when off and the end when on).
- **Content**: a column beside the control with the **label**, an optional **description** under it, and an optional **error message** under that.

The label follows the control. Description and error message are shown only when they have text; the error message only while validation is error.

## 3. Props / API

| Prop | Meaning | Default |
| --- | --- | --- |
| `checked` | On or off. `PROPOSAL` spelling: the native name, registered as an alias of the vocabulary's `selected` (see Q1). | off |
| `label` | The visible text and the accessible name. | none |
| `description` | A hint read with the control. | none |
| `errorMessage` | Why the value is not accepted; shown and read only while `validation` is `error`. | none |
| `validation` | `none` or `error`. Set by the author; never inferred. | `none` |
| `size` | `small` or `medium`. | `medium` |
| `name` | The name the value is submitted under; without it nothing is submitted. | none |
| `value` | What is submitted while on. An off switch submits nothing. | `on` |
| `required` | The switch must be on for the form to be valid. | off |
| `disabled` | Cannot be focused, toggled or submitted. | off |

Event: `change`, when the person toggles it. It fires after the new value is in place, so a listener reads the new state and the form data already updated. Setting the value from code does not fire it.

## 4. Variant matrix

Size (small, medium) × checked (off, on) × validation (none, error) × disabled (no, yes). A disabled switch is never drawn with the error look: a disabled field is not validated.

## 5. Roles and color

- Track off: the form-field border color, so the control's edge meets 3:1 against the surface. Track on: the primary color.
- Thumb off: the page background color, 3:1 against the off track. Thumb on: the primary foreground color, against the on track.
- Label: the foreground color. Description: the muted foreground. Error message and error look: the destructive color.
- Focus ring: the ring color, at the focus ring width and offset.
- Disabled: the whole component at the disabled opacity.

## 6. States

- **Rest**: off track, thumb at the start.
- **Hover**: pointer cursor only. `PROPOSAL`: no color change, since the reference has none.
- **Focus (keyboard)**: the focus ring around the control; not shown for pointer focus.
- **Checked**: on track, thumb at the end, moved with a short transition.
- **Disabled**: dimmed, not focusable, not submitted; also while a disabled ancestor fieldset disables it.
- **Invalid**: the error look on the track and the error message under the label, and the control is marked invalid for assistive technology.

## 7. Dimensions and layout

The control is a pill: width and height per size, from the switch size tokens (medium 32×20, small 24×16), with the thumb inset from the track edge by the switch inset and sized to fill the rest of the height. The control and the content column sit in a row with a gap, aligned at the top, so a multi-line label and description stay beside the control. Label, description and error message stack with a small gap. The click target includes the label.

## 8. Typography

Label: control font size, label weight and line height. Description and error message: caption size and line height; the description is regular weight in the muted color, the error message in the destructive color.

## 9. Accessibility

- Role is **switch**, with the on/off state exposed natively; no ARIA state is layered on top.
- **Name**: the `label` prop. A label connected only through `<label for>` activates the control but does not name it, so `label` stays the name; a missing label warns in the console.
- **Description and error message** are read with the control, after its name. While validation is error the control is marked invalid.
- **Keyboard**: Tab moves focus to or past the switch; Space toggles it; Enter does not toggle and submits the owning form, like a native checkbox (the APG makes Enter optional; Q2).
- **Form**: submits `value` under `name` only while on; form reset restores the initial state; a disabled fieldset disables it and re-enabling restores it without changing the author's `disabled`; `required` with the switch off is invalid, and reporting validity focuses the control; a `<label for>` click toggles it. It is a standalone field: no group exclusivity, no roving focus.
- **Contrast**: text pairs 4.5:1; control edge, fills, thumb and focus ring 3:1 (listed in `accessibility.contrast`).
- **Target size**: at least 24×24 px at both sizes, plus the label.
- Announcements on focus: name, switch, on or off, then description or error. A manual screen-reader pass is required before stable (Q5).

## 10. Usage

### Behavior

Flipping the switch changes the setting as the person does it; nothing waits for a confirm button. Space toggles; clicking the control or its label toggles. The thumb slides between the ends. Programmatic changes to `checked` update the look and the submitted value without firing `change`.

### Composition

A Switch stands alone or as a row in a settings list. Inside a form it needs a `name` to submit. Description and error message are part of the component, not separate neighbors, so they stay tied to the control for assistive technology. It is not a group member and has no group element.

### Choosing the props

- **`size`**: `medium` by default; `small` for dense settings lists.
- **`label`**: always set; keep it the name of the setting, not an instruction ("Notifications", not "Click to turn on").
- **`description`**: when the person needs to know what on means or what it costs.
- **`validation="error"` with `errorMessage`**: when a form refuses the value, for example a required switch left off after a failed submit. Setting only one of them is not enough: the look needs `validation`, the explanation needs `errorMessage`.
- **`required`**: only when the setting must be on (consent to a feature), not for a preference.
- **`value`**: change from `on` only when the receiving system expects another token.

### Do / Don't

- Do: use a Switch for a setting that is on or off and takes effect right away, labeled with the setting's name.
- Do: set `name` in a form, or the value is never submitted.
- Don't: leave the label out. The switch role needs an accessible name, and a visual label elsewhere on the page does not provide one. Alternative: pass `label`.
- Don't: show the error look without an `errorMessage`. The person sees red and cannot tell why. Alternative: set both together.

## Realizations

### Figma
Not realized yet.

### Web
Not started. A form-associated custom element, `sb-switch`, built on the shared form mixin and the native-control mixin, wrapping a native checkbox input with the switch role. The control part is the input; track and thumb are drawn from its checked state. It reflects `checked`, `validation` and `size`, delegates focus to the input, and exposes a `focus-visible` custom state for composing components. Files and spec path are in `contract.json`'s `realizations.web`.

### Coverage
None yet.

### Known drift
None.

## Open questions

All answered in this session with the recommended option (no reviewer available); recorded in `contract.json` and decision SB-0101.

- **Q1** `checked` or `selected`? Answered: `checked`, through the registered alias.
- **Q2** Does Enter toggle? Answered: no; Space toggles, Enter submits the form.
- **Q3** Error look automatic on failed `required`? Answered: no; `validation` is author-controlled.
- **Q4** Label placement or on/off text in the track? Answered: neither in 0.1.0.
- **Q5** Manual screen-reader pass? Answered: required before stable.

## Spec for agents
Build from contract.json only. CSS uses only --sb-switch-* variables (check T4). Tests first (rule test-first).
