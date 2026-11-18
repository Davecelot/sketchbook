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

> A switch for an on/off setting, with its label, description and error laid out beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
A setting that is on or off and takes effect as soon as it is flipped. Not for a choice that is recorded and applied on submit (Checkbox) or for choosing one of several (Radio Group).

## 2. Anatomy
`field` (grid) holds `control` (the track, with the native `<input type="checkbox" role="switch">` and the `thumb`), `label` (+ `required-indicator`), `description` (optional) and `error` (live region).

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the label |
| `error` | text | — | marks the field invalid |
| `size` | `default` \| `sm` | default | 32x20 or 24x16 track |
| `name` | text | — | form field name |
| `value` | text | on | submitted while on |
| `checked` | boolean | false | current state; the attribute is the reset default |
| `required` | boolean | false | must be on to be valid |
| `disabled` | boolean | false | native; a disabled fieldset ancestor has the same effect |

## 4. Variant matrix
`size` (default, sm). States below.

## 5. Roles and color
Track off: background `input-background`, border `input`. On: fill and border `primary`. Thumb `foreground` off, `primary-foreground` on. Label `foreground`; description `muted-foreground`; error and invalid border `destructive`; focus ring `ring`.

## 6. States
focus-visible (3px ring, border in `ring`), checked, invalid, disabled (opacity 0.5, not-allowed cursor).

## 7. Dimensions and layout
Track 32x20 (sm 24x16), fully rounded, 1px border, shadow-xs; thumb inset 2px and moves to the end edge when on (mirrored in RTL). 12px gap to the label; 6px between label and description.

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5.

## 9. Accessibility
- Native `<input type="checkbox" role="switch">` with a native `<label for>` in one shadow root. Space toggles; the state is exposed natively. Enter does not toggle: it submits the form (implicit submission; the inner control has no form owner in its shadow root, SB-0009).
- Description and error through `aria-describedby`; `aria-invalid` when invalid; the error is a persistent polite live region and also a `customError` validity, so the form blocks submission.
- Form association (rule form-associated-controls): `FormAssociated` + `NativeControl`. Submits `value` only while on; `form.reset()` restores the `checked` attribute; `<fieldset disabled>` disables it without changing the `disabled` attribute and re-enabling restores it; `required` gives native `valueMissing`; `<label for>` clicks forward to the inner control.
- On/off is not conveyed by color alone: the thumb position changes. Track border at 3:1 and a solid focus ring (deviation from the visual reference, WCAG 1.4.11). The `sm` track is below 24px tall; the label row and the 12px gap satisfy WCAG 2.5.8.

## 10. Usage
### Behavior
`input` and `change` on each toggle, composed. Value is submitted only while on.
### Composition
One per setting; a list of them goes in a Field set (later).
### Choosing the props
`required` only when the setting must be on to continue. `size="sm"` for dense settings lists.
### Do / Don't
- Don't use a switch for a choice applied on submit; use Checkbox.
- Don't use vague labels.

## Realizations
### Figma
Not started. Axes Size, Selected, Validation and Disabled; Label text, Description text, Error text and the Required and Description switches (names registered in `spec/api.json`).
### Web
Not started.
### Coverage
None yet. Planned in plan.md.
### Known drift
- API shape: shadcn composes Field parts around Switch; shadow DOM requires them inside
- track border color: the reference track is a translucent input color; changed for WCAG 1.4.11
- focus ring: the reference uses ring/50, below 3:1 (WCAG 1.4.11)

## Open questions
None open; all answered with the recommendation on 2026-11-12 (no reviewer available) and listed in contract.json `openQuestions` Q0-Q6.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first (rule test-first). Use `FormAssociated` + `NativeControl`.
