---
component: Switch
status: draft
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-12
source: shadcn/ui Switch (UI and API), WAI-ARIA APG Switch pattern, harness process
---

# Switch

> A two-state control that turns one setting on or off, effective as soon as it changes. It carries its own label, description and error message, comes in two sizes, and takes part in a form like a native checkbox. Typed spec: [contract.json](./contract.json).

## 1. Purpose

A switch says "this setting is on now". Use it for a single on/off choice whose effect is immediate (notifications, airplane mode) or for a yes/no field submitted with a form. It is not for choosing between several options (radio group), for a choice that only applies after a Save button with many other fields where a checkbox reads better, or for triggering an action (button).

## 2. Anatomy

```
root (row, whole row is the click target)
├── control (focusable, owns the state)
│   └── track (pill; on/off color)
│       └── thumb (knob; start = off, end = on)
└── content (text column)
    ├── label (+ required mark, optional)
    ├── description (optional)
    └── error (optional, only while validation = error)
```

The thumb moves toward the end edge in the reading direction, so it mirrors in right-to-left layouts.

## 3. Props / API

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `checked` | boolean | `false` | On/off. Alias of the canonical `selected` (`PROPOSAL`, Q1). The initial value is also what a form reset returns to (Q2). |
| `label` | text | `""` | Required. Visible text and accessible name; clicking it toggles. |
| `description` | text | `""` | Hint under the label, read as the description. |
| `validation` | `none` \| `error` | `none` | `PROPOSAL` (Q4): set by the author; shows the error look and message and marks the control invalid. |
| `errorMessage` | text | `""` | Shown and read only while `validation` is `error`. |
| `size` | `small` \| `medium` | `medium` | Changes only the track and thumb (Q5). Reference `default`/`sm`. |
| `disabled` | boolean | `false` | Not focusable, not toggled, not submitted. A disabled fieldset has the same effect without changing the prop. |
| `required` | boolean | `false` | Must be on for the form to be valid. Shows a required mark. |
| `name` | text | `""` | Name the value is submitted under. |
| `value` | text | `"on"` | Submitted while on; nothing while off. |

Events: `change` and `input`, both bubbling out of the component, fired only by a user toggle (pointer, label, Space), never when `checked` is set by code. When `change` fires, the form data already holds the new value.

## 4. Variant matrix

`size` (small, medium) × `checked` (false, true) × `validation` (none, error) × `disabled` (false, true). No excluded combinations: a disabled switch can still show a server-side error, and every size takes every state.

## 5. Roles and color

| Element | Off | On |
| --- | --- | --- |
| Track | input color (the form-field border color, 3:1 on the background) | primary |
| Thumb | background | primary foreground |

The off track uses the form-field color rather than a lighter fill so the control's boundary meets 3:1 against the page (WCAG 1.4.11). On/off is never conveyed by color alone: the thumb position changes too (1.4.1). The error look outlines the track in the danger color and shows the error text in the danger color. Label in foreground, description in muted foreground.

## 6. States

| State | Trigger | Look |
| --- | --- | --- |
| rest | off, enabled | off track, thumb at start |
| checked | `checked` true | on track, thumb at end; the thumb slides with a short standard-easing transition, none when the person prefers reduced motion |
| focus-visible | keyboard focus | ring outside the track in the ring color |
| disabled | `disabled` or disabled fieldset | whole row at the disabled opacity, no pointer response |
| invalid | `validation` = error | track outlined in the danger color, error message shown |

No separate hover look, as in the reference: the cursor is the only hover feedback.

## 7. Dimensions and layout

| | medium | small |
| --- | --- | --- |
| Track | switch width × height (32 × 20) | switch small width × height (24 × 16) |
| Thumb | track height minus twice the switch inset | same rule |

Track and thumb are fully rounded; the track has the extra-small elevation. The control sits beside the content column with the control gap; label, description and error stack with the extra-small stack gap. The control is top-aligned with the first line of the label so long descriptions don't move it.

## 8. Typography

- Label: body family, control size, label weight and line height.
- Description and error: body size and line height; description in muted foreground, error in danger color.

The text is the same in both sizes (Q5).

## 9. Accessibility

- **Role**: switch (APG Switch pattern), exposing on/off as checked true/false.
- **Name**: the label. An empty label warns once at runtime. The required mark is hidden from assistive technology because the required state is announced on its own.
- **Description**: the description and, while invalid, the error message.
- **Invalid**: marked invalid while `validation` is `error`.
- **Keyboard**: Tab focuses (one stop); Space toggles; Enter submits the owning form like a native checkbox and does not toggle (`PROPOSAL`, Q3; the APG makes Enter optional).
- **Target**: the whole row, label included. The small control alone (24 × 16) is under the 24 × 24 minimum (WCAG 2.5.8); the required label keeps the target large enough.
- **Focus**: a visible ring on keyboard focus, 3:1 against the background.
- **Form**: behaves like a native checkbox in a form: submits `value` under `name` while on, reverts on form reset, disabled by a disabled fieldset, `required` gives the browser's own "value missing" message and invalid state, a label pointing at it toggles it, and saved form state is restored on navigation.
- **Contrast pairs**: listed in `contract.json` (`accessibility.contrast`), checked in every mode.
- WCAG 2.2: 1.3.1, 1.4.1, 1.4.3, 1.4.11, 2.1.1, 2.4.7, 2.5.8, 3.3.1, 3.3.2, 4.1.2.

## 10. Usage

### Behavior

- Toggling takes effect at once: apply the setting on `change`, without a confirm button.
- Setting `checked` from code changes the look but fires no event, so syncing state from a store can't loop.
- In a form it submits `value` (default `on`) under `name` only while on, like a checkbox.
- A form reset returns it to its initial state; a disabled fieldset disables it and re-enabling the fieldset restores it.
- `required` blocks submission while off with the browser's message; the visual error look is shown only when the author sets `validation` to `error`, so a person never sees an error before acting.

### Composition

- Stand-alone, or stacked in a list of settings; each switch carries its own label and description.
- Inside a form field group, the group's legend names the set; each switch still needs its own label.
- In a table or dense settings list, use `small` and keep the label.

### Choosing the props

1. `label`: name the setting in its on sense ("Email notifications", not "Disable emails").
2. `description`: add one sentence when the effect isn't obvious from the label.
3. `size`: `medium` by default; `small` only in dense rows (lists, tables).
4. `name`/`value`: only when the switch is submitted with a form.
5. `required`: only when the form can't proceed while off; pair it with `errorMessage` and set `validation` to `error` after a failed submit.

### Do / Don't

- Do label the on state; the switch shows on/off, so a negative label makes "on" mean "off".
- Do apply the change immediately; if the choice only applies on Save among many fields, a checkbox reads better.
- Don't use a switch to choose between two unrelated options (e.g. "List / Grid"); use a radio group or toggle group, because a switch only says on or off.
- Don't hide the label to save room; the label is the name and part of the target. Use `small` instead.
- Don't show the error look before the person has interacted; set `validation` after a submit attempt.

## Realizations

### Figma

Not realized yet.

### Web

- `sb-switch`, a form-associated custom element built on the shared `FormAssociated` and `NativeControl` mixins (`src/mixins/`): `FormAssociated(LitElement)` -> `NativeControl(...)` -> `Switch`.
- Shadow root (delegates focus) renders `<input type="checkbox" role="switch">` with `?disabled=${this.isDisabled}`, `?required`, `aria-describedby` from `describedBy` (plus the error id while invalid) and `aria-invalid` while `validation="error"`; the input is visually replaced by the track/thumb parts.
- Hooks: `formValue()` = `checked ? value : null`; `formReset()` = `checked = this.hasAttribute('checked')`; `formStateRestore(state)` = `checked = state !== null`; `validationAnchor()` = the inner input (mixin default).
- `syncFormState()` runs synchronously in the change handler before the composed `change` re-dispatch.
- Parts: `root`, `control`, `track`, `thumb`, `label`, `description`, `error`. No slots: label, description and error are props.
- Styles: only `--sb-switch-*` variables; dimmed with `:host(:disabled)`; thumb transition removed under `prefers-reduced-motion: reduce`; right-to-left via logical properties.

### Coverage

None yet. Behavior spec: `playwright/tests/switch/switch.behavior.spec.ts` (see plan.md).

### Known drift

None.

## Open questions

Answered on 2026-11-12 with the recommendation (no approver available in the session): Q1 `checked` name, Q2 native reset semantics, Q3 Enter submits, Q4 author-controlled error look, Q5 size changes only the control. Open: Q6, a manual screen-reader pass during the beta review. Details in `contract.json` (`openQuestions`) and plan.md.

## Spec for agents

Build from contract.json only. CSS uses only --sb-switch-* variables (check T4). Tests first (rule test-first).
