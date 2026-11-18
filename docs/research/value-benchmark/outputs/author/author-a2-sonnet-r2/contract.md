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

> Typed spec: [contract.json](./contract.json). Decision: SB-0101. Plan: [plan.md](./plan.md).

## 1. Purpose

A toggle for an on/off setting that applies as soon as it changes (notifications, offline mode). It is a form control: it submits a value while on, returns to its initial state when the form resets, is disabled by a disabled fieldset and validates `required`. It has a label, an optional description, an error message and two sizes.

Not for choices committed only on submit or several independent options (use Checkbox), nor for picking one of several (use Radio Group).

## 2. Anatomy

| Part | Role | Notes |
| --- | --- | --- |
| root | container | Layout box: control beside content. The whole root is the click target. |
| control | control | Native `input type=checkbox` with `role=switch`; holds focus, validity and the name. |
| track | container | Pill; filled when on. |
| thumb | other | Circle at the start when off, at the end when on; mirrors in right-to-left. |
| content | container, optional | Column with label, description, error. Absent when none is set. |
| label | text, optional | Label text plus a required mark while required. |
| description | text, optional | Hint text. |
| error | text, optional | Error message, in a polite live region. |

Content: `label` and `description` come from the prop by default, or from a slot for rich text.

## 3. Props / API

| Prop | Type | Default | Meaning |
| --- | --- | --- | --- |
| `selected` | boolean (reflects) | false | On or off. The attribute at first render is the form-reset default. |
| `value` | text | `on` | Submitted under `name` while on. Nothing is submitted while off. |
| `name` | text | empty | Submission name. Without it nothing is submitted. |
| `size` | `small` \| `medium` | `medium` | Size step. |
| `disabled` | boolean | false | Unavailable, not focusable, not submitted. |
| `required` | boolean | false | Must be on for the form to be valid. |
| `validation` | `none` \| `error` | `none` | Author-set. `error` shows the error look and message and sets `aria-invalid`. |
| `label` | text | empty | Visible text and accessible name. |
| `description` | text | empty | Hint read with the control. |
| `errorMessage` | text | empty | Shown only while `validation` is `error`. |
| `hideLabel` | boolean | false | Label stays the accessible name but is not shown. |

Events: `input` then `change`, once per user toggle, with `selected` already updated. Neither fires for code changes or a form reset.

Form behavior:

- Submission: `name=value` while on, nothing while off.
- Reset: returns `selected` to the attribute as authored at first render, without events.
- Disabled fieldset: disables the switch without changing the `disabled` prop; re-enabling the fieldset restores it.
- Required: on is valid; off while required gives `validity.valueMissing`, anchored on the inner input so it can be focused and reported.
- State restore: sets `selected` from the saved form state.

## 4. Variant matrix

Size (small, medium) by selected (off, on). Disabled, error and focus layer over every cell and are drawn as states.

## 5. Roles and color

| Role | Token |
| --- | --- |
| Track, off | `color.input` |
| Track, on | `color.primary` |
| Thumb | `color.background` |
| Focus ring | `color.ring` |
| Error border and message | `color.destructive` |
| Description | `color.muted-foreground` |
| Label | `color.foreground` |

On/off is never shown by color alone: the thumb also moves.

## 6. States

Rest, hover (enabled only), focus-visible (ring), active (thumb stretches slightly), checked, disabled (reduced opacity, not focusable), invalid (error border and message).

## 7. Dimensions and layout

Medium track `size.switch.width` by `size.switch.height` (32 by 20); small `width-sm` by `height-sm` (24 by 16). The thumb sits `space.switch.inset` from the track edge. Content column sits after the control with `space.field.gap`, aligned to the first line of the label. The track is a full pill. Motion uses `motion.duration.fast` and is removed under reduced motion.

## 8. Typography

Label uses the control label weight and size; description uses the caption size in muted text; the error uses the caption size in the destructive color. Sizes do not change the text.

## 9. Accessibility

- Role `switch` on the native input; Space toggles; Enter does not (it keeps implicit form submission); Tab and Shift+Tab move focus, a disabled switch is skipped.
- Accessible name: label, else slotted label, else `aria-label` / `aria-labelledby` forwarded from the host; a console warning when there is none.
- `aria-describedby` names the description, and the error while shown; `aria-invalid` while `validation` is error; `aria-required` while required; disabled uses the native attribute.
- The error text is a polite live region.
- Pointer target is the whole root, at least 24 by 24 CSS pixels in both sizes (WCAG 2.5.8). Focus ring at least 3:1, never clipped.
- Contrast pairs are declared in the contract and checked in every mode (WCAG 1.4.3, 1.4.11).

## 10. Usage
### Behavior
Toggling takes effect immediately in the UI; the host decides when to persist. The component never sets `validation` itself: listen for the form's `invalid` event or validate on submit, then set `validation` and `errorMessage`.
### Composition
Standalone, or inside a field or form. Place one per setting; group related switches under a labeled group, not by sharing a name.
### Choosing the props
Always give `label`. Use `hideLabel` only where the context shows the name. Use `small` in dense lists.
### Do / Don't
- Do phrase the label as the setting ("Email notifications"), not the action.
- Do use a switch for immediate effects, a checkbox for submit-later choices.
- Don't use a switch to choose among options or without any name.
- Don't indicate state by color only.

## Realizations
### Figma
Not started.
### Web
Not started.
### Coverage
None yet.
### Known drift
None.

## Open questions

All answered with the recommendation (no one was available to approve; recorded in contract.json and SB-0101):

- Q1 On/off prop name: `selected`, the canonical name (not the alias `checked`).
- Q2 Auto-setting `validation` on unmet required: no, author-controlled; validity is always exposed.
- Q3 Sizes: `small` and `medium`, default `medium`.
- Q4 Form reset target: the initial `selected` attribute; no events.
- Q5 Enter toggles: no, Space only.
- Q6 Layout: content column after the control in reading direction, as Checkbox.
- Q7 Events: `input` and `change` only.

## Spec for agents
Build from contract.json only. CSS uses only --sb-switch-* variables (check T4). Tests first (rule test-first). Use the shared form-associated mixin; the inner native input is the validation anchor.
