---
component: Switch
status: draft
version: 0.1.0
platforms: [web]
dependsOn: []
last_updated: 2026-11-12
source: shadcn/ui Switch docs (UI and API), WAI-ARIA APG Switch pattern (keyboard and ARIA), the project's form-associated-controls rule
---

# Switch

> A toggle for an on/off setting that takes effect as soon as it is flipped. It is a form control: it submits a value while on, resets with its form, is disabled by a disabled fieldset and validates `required`. It has a label, an optional description and error message, and two sizes.

## 1. Purpose

A switch states one setting as on or off, and flipping it is the action: the new state is meant to apply at once. Use it for preferences and modes. A choice that only counts after the form is submitted reads better as a checkbox, and a choice among several options is a radio group.

It behaves like a native form field: it submits under its name while on, goes back to its starting state on form reset, is disabled with its fieldset, validates `required` and is activated by a `<label for>`.

## 2. Anatomy

| Part | Role | Notes |
| --- | --- | --- |
| root | container | The whole switch: control and text column side by side. |
| control | control | The focusable on/off control the person operates. |
| track | container | The pill the thumb slides in; its fill shows on or off. |
| thumb | container | The knob: at the start while off, at the end while on. |
| content | container, optional | One column with the label, description and error beside the control. |
| label | text, optional | Visible name, with a required mark when `required`. |
| description | text, optional | Hint under the label. |
| error | text, optional | Shown only while `validation` is `error`. |

## 3. Props / API

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `selected` | boolean | `false` | On or off. The initial value is what a form reset returns to. |
| `value` | text | `on` | Submitted under `name` while on; nothing while off. `PROPOSAL` |
| `name` | text | none | The name the value is submitted under. |
| `label` | text | none | Visible text and accessible name. A missing label warns. |
| `description` | text | none | Hint read together with the control. |
| `errorMessage` | text | none | Why the value is not accepted; shown and read only while `validation` is `error`. |
| `validation` | `none` \| `error` | `none` | Author-set. `error` shows the error look and message and marks the control invalid. |
| `size` | `small` \| `medium` | `medium` | The control's size step. |
| `required` | boolean | `false` | Must be on for the form to validate. |
| `disabled` | boolean | `false` | Unavailable: not focusable, not toggleable, submits nothing. |

Event: `change`, fired when the person flips the switch, after `selected` has its new value. It is not fired for a programmatic change or a form reset.

## 4. Variant matrix

Dimensions: `size` (small, medium), `selected` (false, true) and `validation` (none, error). Every combination is valid. `disabled` applies on top of any of them.

## 5. Roles and color

- Track: neutral fill while off, the primary fill while on.
- Thumb: the page background while off, the on-primary color while on.
- Label in the foreground color, description muted, error and error outline in the destructive color.
- Keyboard focus shows a ring around the track.
- Disabled dims the whole switch.

## 6. States

| State | Trigger | Look |
| --- | --- | --- |
| rest | No interaction | Neutral track, thumb at the start. |
| hover | Pointer over the control or label | No separate look; the pointer cursor shows it is operable. |
| focus-visible | Keyboard focus | Focus ring. |
| active | Pointer or Space held down | No separate look. |
| selected | `selected` is true | Primary track, thumb at the end. |
| disabled | `disabled`, or a disabled fieldset ancestor | Dimmed; not focusable. |
| invalid | `validation` is `error` | Destructive outline, error message shown. |

## 7. Dimensions and layout

- Medium: 32 by 20 track. Small: 24 by 16 track. The thumb is inset from the track edge by a small fixed amount and fills the rest of the height.
- The control sits at the start of the row; the label column fills the rest, with the description and error stacked under the label.
- The clickable area (control and label) is at least 24 by 24 in both sizes. `PROPOSAL`: the small control is padded to 24 high.

## 8. Typography

Label in the body size at label weight; description in the caption size.

## 9. Accessibility

- Role `switch`; name from `label`. A `<label for>` activates the switch but does not name it.
- Keyboard: Tab moves focus (a disabled switch is skipped); Space flips; Enter does not flip and submits the owning form, as a native checkbox does.
- The description, and the error while `validation` is `error`, are read with the control; the control is marked invalid while in error; `required` is exposed.
- Announcements: name, role and on/off on focus; the new state after each flip.
- Contrast: label, description and error text 4.5:1; track against the page, thumb against track and focus ring 3:1, in every mode (pairs in `contract.json`).
- Form association: submits `value` under `name` only while on; `form.reset()` restores the initial state; a disabled fieldset disables it and re-enabling restores it; `required` makes it invalid while off and `reportValidity()` focuses it; `<label for>` toggles it.
- WCAG: 1.4.3, 1.4.11, 2.1.1, 2.4.7, 2.5.8, 3.3.1, 4.1.2.

## 10. Usage

### Behavior

- Flipping applies the new state immediately; the person does not confirm.
- Space or a click on the control or its label flips it.
- A form reset returns it to its initial state; a disabled fieldset disables it and re-enabling restores the author's own `disabled`.
- With `required`, it is invalid while off. The component does not decide when to show the error: the author sets `validation` to `error` with an `errorMessage` when the form says so.

### Composition

- Standalone, or as a field in a form beside other fields.
- Place a group of switches in a list or settings panel with equal spacing; each is independent.
- Pair it with a description when the effect of turning it on needs a sentence.

### Choosing the props

- `size`: `medium` by default; `small` in dense lists, tables and toolbars.
- `description`: only when the label alone does not explain the consequence.
- `validation` and `errorMessage`: set both together; an error with no message leaves the person without a reason.
- `required`: only when the switch must be on, such as accepting a setting the form depends on.
- `value`: only when the receiving end needs something other than `on`.

### Do / Don't

- Do give every switch a label. Don't leave it out: the control has no name without it. Alternative: always set `label`.
- Do use it for a setting that applies at once. Don't use it for a choice committed on submit, such as agreeing to terms. Alternative: a checkbox.
- Do keep each switch independent. Don't use several to express one choice among options, since a switch cannot make them exclusive. Alternative: a radio group.
- Do pair `validation=error` with an `errorMessage`. Don't signal an error by color alone. Alternative: the message.

## Realizations

### Figma

Not realized yet.

### Web

- Element `sb-switch`, form-associated through the shared form mixin and wrapping a native checkbox with role `switch` through the shared native-control mixin (both in `src/mixins/`).
- Form hooks: `formValue()` returns `value` while selected and `null` otherwise; `formReset()` restores the initial `selected`; `formStateRestore()` restores the saved on/off state; `validationAnchor()` is the inner input, so `required` yields the native value-missing validity and its message.
- The inner input is rendered with `?disabled=${this.isDisabled}`, and the host is dimmed with `:host(:disabled)`, so a disabled fieldset never overwrites `disabled`.
- `syncFormState()` is called in the change handler, before the next render, so a `change` listener reading `FormData` sees the new value.
- The native-control mixin's `describedBy` covers the description only; the implementation extends it with the error id while `validation` is `error`, and sets `aria-invalid`.
- Files: none yet (not started).

### Coverage

None: no implementation.

### Known drift

None.

## Open questions

All answered on 2026-11-12 with the recommended answer, because no one was available to approve; details in `contract.json` `openQuestions`.

- Q1: prop is `selected` (the API vocabulary), not `checked`.
- Q2: `validation` stays author-set; the component does not turn `required` into an error itself.
- Q3: Enter submits the form and does not flip; Space flips.
- Q4: default `value` is `on`. `PROPOSAL`
- Q5: sizes are `small` and `medium`.
- Q6: error is tied to the control through `aria-describedby` plus `aria-invalid`.
- Q7: no read-only or hidden-label mode.

## Spec for agents

The structured spec is `contract.json` in this folder; it is the only copy. Do not restate it here.
