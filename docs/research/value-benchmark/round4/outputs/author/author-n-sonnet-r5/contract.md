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

> A toggle for an on/off setting with its label, description and error laid out beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
An independent on/off setting that takes effect at once or is saved with a form. Not for choosing several options to submit later (Checkbox) or exactly one of many (Radio Group).

## 2. Anatomy
`field` (grid) holds `control` (the pill track with the native `<input type="checkbox" role="switch">` and the `thumb`), `label` (+ `required-indicator`), `description` (optional) and `error` (live region).

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
| `required`, `disabled` | boolean | false | native; a disabled fieldset also disables it |
| `size` | `default` \| `sm` | default | track 32px or 24px wide |

## 4. Variant matrix
One dimension: `size` (`default`, `sm`). No other visual variants. States below.

## 5. Roles and color
Off: track fill and border `input`, thumb `background`. On: track fill and border `primary`, thumb `primary-foreground`. Label `foreground`; description `muted-foreground`; error and invalid border `destructive`; focus ring `ring`.

## 6. States
focus-visible (3px ring), checked, invalid, disabled (opacity 0.5, not-allowed cursor).

## 7. Dimensions and layout
Track 32px wide with a 16px thumb (`default`); 24px wide with a 12px thumb (`sm`). The track is the thumb plus the 1px border on each side, fully rounded, shadow-xs. The thumb sits at the start when off and the end when on, mirrored in RTL. 12px gap to the label; 6px between label and description.

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5.

## 9. Accessibility
- Native `<input type="checkbox" role="switch">` with a native `<label for>` in one shadow root. Space toggles; Enter submits the form (SB-0009) and does not toggle.
- On/off is the switch role's state; the label names the setting and never changes with the state.
- Description and error through `aria-describedby`; `aria-invalid` when invalid; the error is a persistent polite live region.
- Off-state border and on-state fill at 3:1 and a solid focus ring (WCAG 1.4.11). The track is under 24px high: the label row and the 12px gap satisfy WCAG 2.5.8.
- State is told by position as well as color (WCAG 1.4.1).

## 10. Usage
### Behavior
`input` and `change` on each toggle, composed. Value is submitted only while on. `form.reset()` restores the `checked` attribute; a `<fieldset disabled>` disables it and the author's `disabled` attribute is untouched; `required` is invalid while off; clicking a `<label for>` toggles it.
### Composition
One per setting. A list of settings goes in a Field set (later).
### Choosing the props
`size="sm"` for dense settings lists. `required` for consent that must be on. `description` for the consequence of turning it on.
### Do / Don't
- Don't use a switch for a choice that is submitted later with other options; use Checkbox.
- Don't change the label with the state.

## Realizations
### Figma
Not started. Registered layers in `spec/api.json`: `switch.content`, `switch.label-text`, `switch.focus-ring`.
### Web
Not started.
### Coverage
None yet.
### Known drift
None.

## Open questions
All answered with the recommendation (no approver in this session); see `openQuestions` in contract.json and `plan.md`.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first (rule test-first). Use `FormAssociated` + `NativeControl`.
