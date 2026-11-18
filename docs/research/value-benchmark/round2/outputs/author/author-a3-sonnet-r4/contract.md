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
A single setting that is on or off and reads as taking effect when flipped. Not for a choice that is only recorded until submit (Checkbox) or one option out of several (Radio Group).

## 2. Anatomy
`field` (grid) holds `control` (the track with the native `<input type="checkbox" role="switch">` and the `thumb`), `label` (+ `required-indicator`), `description` (optional) and `error` (live region).

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
| `size` | `default` \| `sm` | default | track 32x20px or 24x16px |
| `required`, `disabled` | boolean | false | native |

## 4. Variant matrix
`size`: default, sm. No other visual variants. States below.

## 5. Roles and color
Track border `input`, off background `input-background`, off thumb `input`; on fill and border `primary`, on thumb `primary-foreground`; label `foreground`; description `muted-foreground`; error and invalid border `destructive`; focus ring `ring`.

## 6. States
focus-visible (3px ring), checked (thumb moves to the end), invalid, disabled (opacity 0.5, not-allowed cursor; also when a `<fieldset disabled>` ancestor disables it).

## 7. Dimensions and layout
Track 32x20px (sm 24x16px), pill radius, 1px border, shadow-xs, thumb inset 2px. 12px gap to the label; 6px between label and description.

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5.

## 9. Accessibility
- Native `<input type="checkbox" role="switch">` with a native `<label for>` in one shadow root. Space toggles; Enter does not toggle but submits the form (implicit submission: the inner control has no form owner in its shadow root, SB-0009). The state is exposed as `aria-checked` through the native checked state.
- Form-associated through `FormAssociated` and `NativeControl` (SB-0101): submits `value` only while on, resets to the `checked` attribute, is disabled by a `<fieldset disabled>`, and `required` makes an off switch invalid (`valueMissing`) through the inner input.
- Description and error through `aria-describedby`; `aria-invalid` when invalid; the error is a persistent polite live region and also sets a `customError` validity so the form blocks submission.
- Track border at 3:1 and a solid focus ring (deviation from the visual reference, WCAG 1.4.11). The label row and its 12px gap satisfy WCAG 2.5.8 for the small track. Off versus on is not told by color alone: the thumb also moves (WCAG 1.4.1).

## 10. Usage
### Behavior
`input` and `change` on each toggle, composed. Value is submitted only while on; `form.reset()` restores the `checked` attribute.
### Composition
One per setting; a list of them goes in a Field set (later).
### Choosing the props
`size="sm"` for dense rows. `required` only when the setting must be on to proceed (for example accepting a policy).
### Do / Don't
- Don't use a switch for a choice that needs a Save or Submit to take effect; use Checkbox.
- Don't use vague labels; the label states the setting, not the action.

## Realizations
### Figma
Not started.
### Web
Not started.
### Coverage
None yet (planned list in contract.json `realizations.web.coverage`).
### Known drift
- Label, description and error are props of Switch; the visual reference composes Field parts around it, and shadow DOM requires them inside.
- Track border at 3:1 (`input` token) instead of the reference's lighter border; solid 3px focus ring instead of a translucent one (WCAG 1.4.11).
- `checked` is not reflected: the attribute is the default restored by form reset.

## Open questions
All answered on 2026-11-12 with the recommended option (no approver was available; see SB-0101 and plan.md).
- Q1 Native input with `role="switch"`, not a custom ARIA host.
- Q2 `checked` is not reflected.
- Q3 `label` required; `hide-label` keeps it as the name.
- Q4 Sizes `default` and `sm`.
- Q5 Enter submits the form and does not toggle.
- Q6 Nothing is submitted while off.

## Spec for agents
Build from contract.json only. CSS uses only --sb-switch-* variables (check T4). Tests first (rule test-first).
