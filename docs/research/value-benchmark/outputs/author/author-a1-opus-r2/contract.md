---
component: Switch
status: draft
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-12
source: shadcn/ui Switch (UI and API), WAI-ARIA APG Switch pattern (keyboard and ARIA), harness process
---

# Switch

> A toggle for one on/off setting that takes part in forms like a native checkbox: it submits its value while on, resets with its form, is disabled by a disabled fieldset and validates `required`. Label, optional description and error message, two sizes. Typed spec: [contract.json](./contract.json).

## 1. Purpose

Turn one setting on or off, with the result visible immediately in the control's position. Use it for preferences and settings ("Notifications", "Airplane mode"), standalone or inside a form that is submitted. It has exactly two states; it never shows a mixed state.

## 2. Anatomy

- **root**: a row, control first, then the text column. The whole row is the pointer target, so clicking the label toggles too.
- **control**: the focusable on/off element, exposed as a switch. Drawn as:
  - **track**: a pill whose fill shows the state;
  - **thumb**: a circle inside the track, at the start while off and at the end while on. The position carries the state, so it is never shown by color alone.
- **content**: the text column.
  - **label**: the setting's name, followed by a required mark when `required`.
  - **description** (optional): a hint under the label.
  - **error** (optional): `errorMessage`, shown only while `validation` is `error`.

## 3. Props / API

| Prop | Type | Default | Meaning |
| --- | --- | --- | --- |
| `selected` | boolean | `false` | On or off. The attribute is the initial and reset state; the property is the live state and is not reflected. `PROPOSAL` (Q1, Q2) |
| `label` | text | `""` | Visible name and accessible name. Required; must not change with the state. |
| `description` | text | `""` | Hint under the label, read as the control's description. |
| `errorMessage` | text | `""` | Why the value is not accepted; shown while `validation` is `error`. |
| `validation` | `none` \| `error` | `none` | `error` shows the error look and message, marks the control invalid and makes the field invalid in its form. `PROPOSAL` (Q3) |
| `size` | `small` \| `medium` | `medium` | Track and thumb size. Text does not change size. |
| `disabled` | boolean | `false` | Cannot be focused, toggled or submitted. |
| `required` | boolean | `false` | Must be on for the form to be valid. |
| `name` | text | `""` | Form field name; without it nothing is submitted. |
| `value` | text | `"on"` | Submitted under `name` while on; nothing is submitted while off. |

Events: `change` after every user toggle (not on programmatic changes; the form value is already updated when it fires) and the native `input` just before it. Both bubble out of the component.

## 4. Variant matrix

`size` (small, medium) × `selected` (false, true) × `validation` (none, error) × `disabled` (false, true). Every combination is valid; disabled is drawn at rest only.

## 5. Roles and color

| Element | Off | On |
| --- | --- | --- |
| Track | input color | primary |
| Thumb | background | primary foreground |

- Label in the foreground color, description in the muted foreground, error message and required mark in the destructive color.
- Error look: the track is outlined in the destructive color.
- Focus ring in the ring color.
- Every pair is declared in `accessibility.contrast` and meets 3:1 (track, thumb, ring, outline) or 4.5:1 (text) in every mode.

## 6. States

- **Rest**: off or on as above. No separate hover look; the pointer cursor shows it is interactive. `PROPOSAL`: the reference has no hover change, and a hover tint on a two-color track would compete with the state color.
- **Focus (keyboard)**: a ring around the track; not shown on pointer focus.
- **Selected**: primary track, thumb at the end. The thumb slides between positions with a short transition, which is removed when the user asks for reduced motion.
- **Invalid** (`validation` = `error`): track outline and error message in the destructive color.
- **Disabled**: the whole row dimmed to the disabled opacity, no interaction, not submitted. A disabled fieldset around it has the same effect and lifts it when re-enabled, without changing the `disabled` prop.

## 7. Dimensions and layout

| Size | Track (w × h) | Thumb |
| --- | --- | --- |
| medium | `size.switch.width` × `size.switch.height` (32 × 20) | track height minus twice `space.switch.inset` |
| small | `size.switch.width-sm` × `size.switch.height-sm` (24 × 16) | same rule |

- Track radius is a pill; the thumb is a circle inset by `space.switch.inset`.
- Gap between control and content: `space.control.gap.default`; between label, description and error: `space.stack.xs`.
- The row is at least 24 px high (`size.control.xs`), so both sizes meet the minimum target size. `PROPOSAL` (Q5)
- The control aligns with the first line of the label; long labels wrap in the content column.

## 8. Typography

- Label: body font, body size, label weight, label line height.
- Description and error: body font, body size, regular weight, body line height.
- Size does not change the text.

## 9. Accessibility

- **Role**: switch (an on/off checkbox exposed with the switch role); the browser reports the state as on/off.
- **Name**: the `label` prop. A page label pointing at the component activates it but does not name it, so `label` stays required; an empty label is warned about at runtime.
- **Description**: `description`, then the error message while `validation` is `error`, are read as the control's description. `PROPOSAL` (Q6): description reference rather than the error-message attribute, whose support is uneven.
- **Invalid**: marked invalid for assistive technology while `validation` is `error`.
- **Keyboard** (APG Switch):
  - Space toggles and fires `input` and `change`.
  - Enter submits the owning form, as on a native checkbox; it does not toggle. `PROPOSAL` (Q4): APG lists Enter as optional.
  - Tab / Shift+Tab move focus in and out; the control is one tab stop.
- **Form**: submits `value` under `name` only while on; resets to its initial state; follows a disabled fieldset; `required` gives the native "value missing" while off with the browser's own message; `validation` = `error` gives a custom error with `errorMessage` as message; a page label activates it; restored form state restores `selected`.
- **Target size**: the row is the target, at least 24 × 24.
- **Color**: the thumb position, not just the track color, shows the state.
- **Motion**: the thumb transition is removed under reduced motion.
- WCAG 2.2 AA: 1.3.1, 1.4.1, 1.4.3, 1.4.11, 2.1.1, 2.4.7, 2.5.8, 3.3.1, 3.3.2, 4.1.2.

## 10. Usage

### Behavior

- A switch applies a setting that is on or off. Toggling it fires `change`; when the switch is in a form, the new value is in the form data by then.
- It is off unless `selected` is set. `form.reset()` brings it back to how the page first declared it.
- `required` means "must be on" (an agreement or a mandatory setting); the browser blocks submission and shows its own message until it is on.
- `validation` = `error` is for a value the application rejected; it shows `errorMessage` and blocks submission until the application clears it.

### Composition

- Standalone in a settings list, or inside a form with other fields.
- In a group of related settings, put the switches in a fieldset with a legend; disabling the fieldset disables them all.
- The label sits after the control. `PROPOSAL` (Q7): no label-position or hidden-label option until a use case asks for one.

### Choosing the props

- **label**: name the setting, not its state ("Notifications", not "Turn notifications on").
- **description**: add when the name alone does not explain the effect.
- **name / value**: set `name` whenever the form is submitted; set `value` only when the server expects something other than `on`.
- **required**: only when the form is invalid unless the setting is on.
- **validation / errorMessage**: set both together when the application rejects the value; clear `validation` when the problem is resolved.
- **size**: `medium` by default; `small` in dense places such as table rows or compact settings lists.

### Do / Don't

- Do keep the label fixed. Don't change it with the state ("Notifications on" / "off"): the state is already announced, so the label repeats or contradicts it (APG).
- Do use a checkbox when a mixed or partial state is needed. Don't use a switch for it: a switch has only on and off (APG).
- Do always set `label`. Don't rely on nearby text to name the switch: it is not announced as the control's name (APG).

## Realizations

### Figma

Not realized yet.

### Web

Not started. Planned: `sb-switch`, a form-associated custom element built with the shared form-associated and native-control mixins (`src/mixins/form-associated.ts`, `src/mixins/native-control.ts`) around a native `<input type="checkbox" role="switch">`. Parts: `root`, `control`, `track`, `thumb`, `label`, `description`, `error`. CSS uses only `--sb-switch-*` variables. `validationAnchor()` is the inner input; `validation="error"` sets the input's custom validity to `errorMessage`. Behavior spec: `playwright/tests/switch/switch.behavior.spec.ts`.

### Coverage

None yet.

### Known drift

None. Size names map from the reference (`sm` → `small`, `default` → `medium`).

## Open questions

All answered on 2026-11-12 with the recommended option (no approver was available); see `openQuestions` in contract.json (Q0–Q7).

## Spec for agents

Build from [contract.json](./contract.json) only. CSS uses only `--sb-switch-*` variables (check T4). Tests first (rule test-first).
