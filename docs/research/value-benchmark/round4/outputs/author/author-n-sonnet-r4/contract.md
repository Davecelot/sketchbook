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

> A switch for an on/off setting, with its label, description and error laid out beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
An on/off setting that takes effect at once, which can also be submitted, reset and validated with a form. Not for picking several options or a choice recorded on submit (Checkbox), nor exactly one of several (Radio Group).

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
| `required` | boolean | false | native: must be on |
| `disabled` | boolean | false | native; a disabled fieldset also applies |
| `size` | `default` \| `sm` | default | track 32x20px or 24x16px |

## 4. Variant matrix
One axis: `size` (default, sm). No visual variants. States below.

## 5. Roles and color
Off track `input`; on track `primary`; thumb `background` (off) and `primary-foreground` (on); label `foreground`; description `muted-foreground`; error and invalid border `destructive`; focus ring `ring`.

## 6. States
focus-visible (3px ring), checked (primary track, thumb at the end, mirrored in rtl), invalid, disabled (opacity 0.5, not-allowed cursor). Hover has no token.

## 7. Dimensions and layout
Track 32x20px (sm 24x16px), pill radius, thumb inset by `space.switch.inset`, shadow-xs. 12px gap to the label; 6px between label and description.

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5.

## 9. Accessibility
- Native `<input type="checkbox" role="switch">` with a native `<label for>` in one shadow root. Space toggles. State is exposed as `aria-checked` through the native checked state.
- State is shown by thumb position and fill, not by color alone (WCAG 1.4.1).
- Description and error through `aria-describedby`; `aria-invalid` when invalid; the error is a persistent polite live region and also sets `customError` validity (SB-0009).
- Enter submits the form (implicit submission) through `form.requestSubmit()` (SB-0009); only Space toggles.
- Form association through `FormAssociated` + `NativeControl` (rule form-associated-controls): submits `value` only while on, resets to the `checked` attribute, is disabled by a `<fieldset disabled>` without rewriting the author's attribute, validates `required` as `valueMissing`, and `<label for>` activates it.
- Off track at 3:1 and a solid focus ring (deviations from the visual reference, WCAG 1.4.11). The track is smaller than 24px in `sm`; the label row and the 12px gap satisfy WCAG 2.5.8.

## 10. Usage
### Behavior
`input` and `change` on each toggle, composed. Value is submitted only while on.
### Composition
One per setting; a list of them goes in a Field set (later).
### Choosing the props
`required` only when the setting must be on to proceed (an agreement). `size="sm"` for dense lists. `hide-label` only when other visible text names the switch.
### Do / Don't
- Don't use a switch for a choice that applies only on submit; use Checkbox.
- Don't label it with its state ("On"); label the setting.

## Realizations
### Figma
Not started.
### Web
Not started.
### Coverage
None yet.
### Known drift
- API shape: shadcn composes Field parts around Switch; shadow DOM requires them inside
- focus ring: shadcn uses ring/50, below 3:1 (WCAG 1.4.11)
- off track color: shadcn's is lighter than 3:1 (WCAG 1.4.11)
- checked state: not reflected: the attribute is the default restored by form reset

## Open questions
None open. Answered with the recommendation (nobody was available to approve; SB-0011):
- Q1 Native `<input role="switch">`, not an ARIA div.
- Q2 `checked` is not reflected.
- Q3 `label` is required.
- Q4 No indeterminate state.
- Q5 Sizes `default` and `sm` only.
- Q6 Off submits nothing.
- Q7 Error through an `error` prop with `customError` validity.
- Q8 Space toggles, Enter submits the form.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first. Use `FormAssociated` + `NativeControl`.
