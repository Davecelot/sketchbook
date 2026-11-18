---
component: Switch
status: draft
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-12
source: visual reference (look and sizes), WAI-ARIA APG (switch pattern), contract-first standard (contract and build process)
---

# Switch

> A switch for an on/off setting, with its label, description and error laid out beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
A setting with two states that takes effect as soon as it is flipped (notifications on, dark mode). Not for an answer recorded and submitted later, such as accepting terms (Checkbox), choosing one of several (Radio Group), or a pressed-state button in a toolbar (Toggle).

## 2. Anatomy
`field` (grid) holds `control` (the track, a native `<input type="checkbox" role="switch">`, and the decorative `thumb`), `label` (+ `required-indicator`), `description` (optional) and `error` (live region).

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the label |
| `error` | text | — | marks the field invalid |
| `name` | text | — | form field name |
| `value` | text | on | submitted while on |
| `checked` | boolean | false | current state; the attribute is the reset default |
| `size` | `default` \| `sm` | default | track size |
| `required`, `disabled` | boolean | false | native |

Events: `input` (native, composed) and `change` (composed) on each toggle.

Form behavior (FormAssociated mixin, `.claude/rules/form-associated-controls.md`): submits `name=value` only while on; `form.reset()` restores the `checked` attribute; a disabled `<fieldset>` disables it without touching the `disabled` attribute; `required` and not on is `valueMissing`; `error` is a `customError`; `<label for>` activates it.

## 4. Variant matrix
`size` (default, sm) × checked (off, on). Invalid and disabled apply to every cell.

## 5. Roles and color
Track `input` when off, `primary` when on; thumb `background` when off, `primary-foreground` when on; label `foreground`; description `muted-foreground`; error and invalid border `destructive`; focus ring `ring`.

## 6. States
focus-visible (3px solid ring), checked (filled track, thumb at the end edge), invalid, disabled (opacity 0.5, not-allowed cursor).

## 7. Dimensions and layout
Track 32×20px (default) or 24×16px (sm), pill radius, thumb inset from the track edge by `space.switch.inset`, shadow-xs. The switch sits in the first column, the label, description and error in the second; the thumb mirrors in right-to-left.

## 8. Typography
Label 14px, weight 500, control line-height; description and error 14px, body line-height.

## 9. Accessibility
- Native `<input type="checkbox" role="switch">` with a native `<label for>` in one shadow root; the thumb is `aria-hidden`.
- Space toggles. Enter does not toggle: it submits the form (implicit submission; the inner control has no form owner, SB-0009).
- Description and error through `aria-describedby`; `aria-invalid` when invalid; the error is a persistent polite live region.
- State is shown by thumb position as well as color (WCAG 1.4.1). Track and thumb meet 3:1 against their neighbors (1.4.11); the focus ring is solid.
- The sm track is below 24px: the label row and the gap satisfy WCAG 2.5.8.

## 10. Usage
### Behavior
`input` and `change` on each toggle, composed. The value is submitted only while on.
### Composition
One per setting, in a list or a Field row.
### Choosing the props
`required` only when the setting must be on to continue, with a label that says so. `size="sm"` for dense settings lists. `hide-label` only when other visible text names the switch.
### Do / Don't
- Don't use a switch for a choice that waits for a Save or Submit; use Checkbox.
- Don't use on/off text inside the switch; put the meaning in the label.
- Don't use a vague label like "Setting".

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
All answered (recorded in contract.json and SB-0101):
- Q1 native checkbox input with `role="switch"`, not a custom button.
- Q2 Enter submits the form, it does not toggle.
- Q3 `label` is required; `hide-label` keeps it as the name.
- Q4 `checked` is not reflected; the attribute is the reset default.
- Q5 sizes `default` and `sm`.
- Q6 the error sets a `customError`; the label sits after the switch.
- Q7 no on/off text or icons.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first (rule test-first). Use `FormAssociated` + `NativeControl`.
