---
component: Switch
status: draft
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-12
source: shadcn/ui Switch (look, sizes), WAI-ARIA APG switch pattern, contract-first standard (contract and build process)
---

# Switch

> A switch for an on/off setting, with its label, description and error laid out beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
An on/off setting that takes effect as soon as it is flipped, or is submitted with a form as a single flag. Not for a choice recorded only on submit or for picking several from a list (Checkbox), a pressed button that shows a mode (Toggle), or choosing one of several (Radio Group).

## 2. Anatomy
`field` holds `control` (the track with the native control and the `thumb`), `label` (+ `required-indicator`), `description` (optional) and `error` (a live region).

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the control |
| `error` | text | — | marks the field invalid and blocks submission |
| `size` | `default` \| `sm` | default | track size |
| `name` | text | — | form field name |
| `value` | text | on | submitted while on |
| `checked` | boolean | false | current state; the attribute is the reset default |
| `required` | boolean | false | must be on to be valid |
| `disabled` | boolean | false | unavailable; dimmed; not submitted |

## 4. Variant matrix
One dimension: `size` (`default`, `sm`). Combined with the states below.

## 5. Roles and color
Off track and border `input`; on track and border `primary`; thumb `background` when off and `primary-foreground` when on; label `foreground`; description `muted-foreground`; error and invalid border `destructive`; focus ring `ring`.

## 6. States
focus-visible (3px ring, border in `ring`), checked, invalid, disabled (opacity 0.5, not-allowed cursor), hover (no visual change).

## 7. Dimensions and layout
`default` track 32x20 with a 16px thumb; `sm` track 24x16 with a 12px thumb. Fully rounded track and thumb, 1px border, shadow-xs. 12px gap to the label; 6px between label and description. The thumb sits at the start when off and the end when on, following the writing direction.

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5.

## 9. Accessibility
- Exposed as a switch with an on/off state; one native control, no custom widget. Space toggles; Enter does not toggle and instead submits the form (implicit submission).
- The label is the accessible name and is required; it is also clickable and activates the switch. A missing label warns in development.
- Description and error are the accessible description; invalid is exposed; the error is a persistent polite live region, announced once when it appears.
- Form behavior: submits `value` under `name` only while on; form reset returns to the default state; a disabled fieldset disables it without changing its own `disabled`; `required` makes it invalid while off; a set `error` blocks submission.
- State is never carried by color or thumb position alone (on/off is in the accessibility tree, and the on track differs in luminance). Track and focus ring at 3:1 or more (WCAG 1.4.11). Target size relies on the label row and the 12px gap for WCAG 2.5.8; `sm` and a hidden label shrink the target and are for rows that have other clickable text.

## 10. Usage
### Behavior
`input` and `change` on each toggle, composed. The new value is visible to a form read in a `change` listener.
### Composition
One per setting; a group of them goes in a Field set (later).
### Choosing the props
`description` for the consequence of turning it on. `required` only for an agreement that must be on. `size="sm"` for dense rows.
### Do / Don't
- Do use a switch for a setting that applies at once.
- Don't use a switch for a choice that waits for a submit button; use Checkbox.
- Don't use vague labels like "Option"; the label states the setting.

## Realizations
### Figma
Not drawn yet. Planned axes: State, Selected, Validation, Disabled and Size; Label text, Description text and Error text and the Required and Description switches. Layers follow the anatomy; `switch.content`, `switch.label-text` and `switch.focus-ring` are already registered in `spec/api.json`.
### Web
Not started. Parts `field`, `control`, `input`, `thumb`, `label`, `required-indicator`, `description`, `error`. Built with the `FormAssociated` and `NativeControl` mixins around a native `<input type="checkbox" role="switch">`. Test spec `playwright/tests/switch/switch.behavior.spec.ts`.
### Coverage
Not started.
### Known drift
None yet.

## Open questions
None open. Answered with the recommended option (no approver in this session, SB-0011):
- Q0: drafted from shadcn/ui and the APG switch pattern.
- Q1: `checked` is not reflected; the attribute is the reset default.
- Q2: `label` is required; `hide-label` keeps it as the name.
- Q3: sizes `default` and `sm`.
- Q4: Enter submits the form and does not toggle.
- Q5: no indeterminate state.
- Q6: `error` marks invalid, sets a custom validity and is announced.
- Q7: a native checkbox with the switch role is the inner control.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first. Extend `FormAssociated` + `NativeControl` and implement the four hooks.
