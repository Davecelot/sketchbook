---
component: Switch
status: draft
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-12
source: visual reference (look and sizes), WAI-ARIA APG switch pattern, contract-first standard (contract and build process)
---

# Switch

> A toggle for an on/off setting, with its label, description and error laid out beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Turn one setting on or off, such as enabling notifications. Not for picking several options or agreeing to terms (Checkbox), choosing one of several (Radio Group), or a pressed toolbar button (Toggle).

## 2. Anatomy
`field` (grid) holds `track` (the pill with the native `<input type="checkbox" role="switch">` covering it and the round `thumb`), `label` (+ `required-indicator`), `description` (optional) and `error` (live region).

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the label |
| `error` | text | — | marks the field invalid (customError) |
| `name` | text | — | form field name |
| `value` | text | on | submitted while on |
| `checked` | boolean | false | on/off; the attribute is the reset default |
| `size` | `default` \| `sm` | default | track and thumb only |
| `required` | boolean | false | must be on to submit |
| `disabled` | boolean | false | native; a disabled fieldset also disables it |

Form API from the shared mixin: `form`, `validity`, `validationMessage`, `willValidate`, `checkValidity()`, `reportValidity()`, `click()`.

## 4. Variant matrix
`size`: `default`, `sm`. No color variants. States below.

## 5. Roles and color
Track off: fill and border `input`; on: fill and border `primary`. Thumb `background` when off, `primary-foreground` when on. Label `foreground`; description `muted-foreground`; error text and invalid border `destructive`; focus ring `ring`. Every pair is checked per mode (T6), including thumb on track.

## 6. States
focus-visible (3px solid ring around the track), checked (on: filled track, thumb at the end), invalid, disabled (opacity 0.5, not-allowed cursor, styled with `:host(:disabled)` so a disabled fieldset dims it too). Hover has no change, as in the reference.

## 7. Dimensions and layout
| Size | Track | Thumb |
| --- | --- | --- |
| default | 32x20 | 16 |
| sm | 24x16 | 12 |

Thumb inset 2px from the track edge; fully rounded; 1px border; shadow-xs. 12px gap to the label; 6px between label and description. The thumb slides on the inline axis and mirrors in RTL. The track is centered on the label's first line.

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5. Same in both sizes.

## 9. Accessibility
- Native `<input type="checkbox" role="switch">` with a native `<label for>` in one shadow root: the role, on/off (`aria-checked`) and Space come from the platform.
- Space toggles. Enter submits the form (implicit submission): the inner control has no form owner in its shadow root, so the component calls `form.requestSubmit()` (SB-0009). Enter does not toggle (optional in the APG).
- Form-associated (`FormAssociated` + `NativeControl`): submits `value` only while on, resets to the `checked` attribute, restores saved state, is disabled by `<fieldset disabled>` and re-enabled with it, validates `required` (valueMissing) and `error` (customError), and an external `<label for>` toggles it. The external label does not name it; `label` is the name.
- Description and error through `aria-describedby`; `aria-invalid` when invalid; the error is a persistent polite live region.
- State is shown by thumb position as well as color (1.4.1). Track and thumb meet 3:1 (1.4.11); solid focus ring. The label row and 12px gap cover target size (2.5.8). No thumb transition under `prefers-reduced-motion`.
- Dev-only warning once when `label` is empty.

## 10. Usage
### Behavior
`input` and `change` on each user toggle, composed; not on programmatic `checked`. A `change` listener reading `FormData` sees the new value. The setting's effect should apply on toggle; in a form, it is submitted like a checkbox.
### Composition
One per setting. A settings list with the switch at the end of the row is composed with Field or Item.
### Choosing the props
`sm` for dense settings lists. `description` when the consequence needs explaining. `required` only when the setting must be on to continue.
### Do / Don't
- Do name the setting in the label ("Email notifications"); don't use a label that changes with the state ("On"/"Off").
- Don't use a switch for agreeing to terms or picking from a list; use Checkbox.

## Realizations
### Figma
Not started.
### Web
Not started. Planned: `src/components/switch/Switch.ts`; parts `field`, `track`, `input`, `thumb`, `label`, `required-indicator`, `description`, `error`.
### Coverage
None yet.
### Known drift
- API shape: the reference composes Field and Label around Switch; shadow DOM requires them inside
- element: the reference renders a button with role switch; native checkbox with role switch gives form behavior and Space (SB-0007)
- unchecked track color: `input` (3:1) instead of the reference's lighter fill (WCAG 1.4.11)
- focus ring: solid 3px instead of a translucent ring (WCAG 1.4.11)
- dimensions: default track 32x20 instead of 32x18.4, on the 4px grid
- dark-mode thumb: one token per state in every mode; contrast checked per mode
- checked state: not reflected; the attribute is the default restored by form reset

## Open questions
All answered with the recommended option (contract.json `openQuestions` Q0–Q7): native checkbox with role switch; `checked` not reflected; Enter submits, Space toggles; sizes `default` and `sm` change only track and thumb; label after the track; `required` means on; no thumb motion under reduced motion.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first. Use `FormAssociated` + `NativeControl` (rule form-associated-controls).
