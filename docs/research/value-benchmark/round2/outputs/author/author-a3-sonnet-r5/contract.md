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
A setting that is on or off and takes effect right away (notifications, dark mode). Not for a choice recorded on submit (Checkbox), nor for choosing one of several (Radio Group).

## 2. Anatomy
`field` (grid) holds `control` (the track, with the native `<input type="checkbox" role="switch">` covering it and the `thumb` over it), `label` (+ `required-indicator`), `description` (optional) and `error` (live region).

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the label |
| `error` | text | — | marks the field invalid |
| `size` | `default` \| `sm` | default | track 32x20 or 24x16 |
| `name` | text | — | form field name |
| `value` | text | on | submitted while checked |
| `checked` | boolean | false | current state; the attribute is the reset default |
| `required`, `disabled` | boolean | false | native |

## 4. Variant matrix
One dimension: `size` (default, sm). Same states in both.

## 5. Roles and color
Off track: background `input-background`, border `input`. On track: fill and border `primary`. Thumb `foreground` when off, `primary-foreground` when on. Label `foreground`; description `muted-foreground`; error and invalid border `destructive`; focus ring `ring`.

## 6. States
focus-visible (3px ring), checked (thumb at the end, mirrored in rtl), invalid, disabled (opacity 0.5, not-allowed cursor, also from a disabled fieldset).

## 7. Dimensions and layout
Track 32x20 (default) or 24x16 (sm), fully rounded, 1px border, shadow-xs. Thumb 16px (default) or 12px (sm). Gap to the label from `space.field.gap`; label to description from `space.control.gap.sm`.

## 8. Typography
Label 14px, weight 500; description and error 14px.

## 9. Accessibility
- Native `<input type="checkbox" role="switch">` with a native `<label for>` in one shadow root. Space toggles; the on/off state is exposed through `checked`.
- Form-associated through `FormAssociated` + `NativeControl` (rule form-associated-controls): submits `value` only while checked, resets to the `checked` attribute, is disabled by a `<fieldset disabled>`, and `required` gives `valueMissing`. A `<label for>` on the host activates it.
- Enter submits the form (implicit submission): the inner control has no form owner in its shadow root, so the component calls `form.requestSubmit()` (SB-0009).
- Description and error through `aria-describedby`; `aria-invalid` when invalid; the error is a persistent polite live region and also sets a `customError` validity (SB-0009).
- Off-track border at 3:1 and a solid focus ring (WCAG 1.4.11). The `sm` track relies on the label row and the gap for WCAG 2.5.8.

## 10. Usage
### Behavior
`input` and `change` on each toggle, composed. `change` is not fired when `checked` is set from code. Value is submitted only while checked.
### Composition
One per setting; several go in a Field set (later).
### Choosing the props
`required` only when the setting must be on to continue. `size="sm"` for dense settings lists. `error` states what to fix.
### Do / Don't
- Don't use a switch for a choice that only counts on submit; use Checkbox.
- Don't use vague labels.

## Realizations
### Figma
Not started.
### Web
Not started.
### Coverage
None yet.
### Known drift
None yet (expected: off-track border color and focus ring, see Q5).

## Open questions
All answered with the recommendation (no reviewer available); revisit in `contract.json` `openQuestions`.
- Q1 Native checkbox with `role="switch"` (not a custom role element).
- Q2 `checked` not reflected; the attribute is the reset default.
- Q3 `label` required; `hide-label` keeps the name.
- Q4 Sizes `default` and `sm` from the existing `size.switch.*` tokens.
- Q5 Off track meets 3:1 through `color.input` and a solid ring.
- Q6 No new semantic tokens.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first. Use `FormAssociated` + `NativeControl`.
