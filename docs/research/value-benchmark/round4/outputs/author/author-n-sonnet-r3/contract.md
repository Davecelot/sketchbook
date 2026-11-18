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
A setting that is either on or off (notifications, dark mode), where the state itself is the point. Not for an independent choice recorded on submit or one of several options (Checkbox), nor for choosing exactly one (Radio Group).

## 2. Anatomy
`field` (grid) holds `control` (the track with the native `<input type="checkbox" role="switch">` and the `thumb`), `label` (+ `required-indicator`), `description` (optional) and `error` (live region).

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the label |
| `error` | text | — | marks the field invalid |
| `size` | `medium` \| `small` | medium | size vocabulary |
| `name` | text | — | form field name |
| `value` | text | on | submitted while on |
| `checked` | boolean | false | current state; the attribute is the reset default |
| `required`, `disabled` | boolean | false | native |

## 4. Variant matrix
One axis: `size`. Medium track 32x20, small track 24x16. Everything else is state.

## 5. Roles and color
Track off `input`, on `primary`; thumb off `background`, on `primary-foreground`; label `foreground`; description `muted-foreground`; error and invalid border `destructive`; focus ring `ring`.

## 6. States
focus-visible (3px ring), checked (fill and thumb position), invalid, disabled (opacity 0.5, not-allowed cursor, also under a disabled fieldset).

## 7. Dimensions and layout
Track radius pill, 1px border, shadow-xs. The thumb is 16px (12px small), inset evenly in the track and travelling along the inline axis (mirrored in rtl). 12px gap to the label; 6px between label and description.

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5.

## 9. Accessibility
- Native `<input type="checkbox" role="switch">` with a native `<label for>` in one shadow root. Space toggles; the state is announced as on/off.
- Enter does not toggle: it submits the form (implicit submission, SB-0009), as in Checkbox. The APG leaves Enter optional.
- Description and error through `aria-describedby`; `aria-invalid` when invalid; the error is a persistent polite live region.
- State is carried by thumb position as well as color (WCAG 1.4.1). Track and focus ring at 3:1 against the page (WCAG 1.4.11). The label row is the pointer target (WCAG 2.5.8).
- Form: form-associated through `FormAssociated` + `NativeControl`. Submits `value` only while on; `form.reset()` restores the `checked` attribute; a disabled fieldset disables it without touching the attribute; `required` and off is `valueMissing`; `error` sets a custom validity.

## 10. Usage
### Behavior
`input` and `change` on each toggle, composed; `change` fires with the new value already readable from `FormData`.
### Composition
One per setting; several go in a Field set (later), each with its own label.
### Choosing the props
`description` when the consequence needs saying. `size="small"` for dense settings rows. `required` only for a setting that must be on before submit.
### Do / Don't
- Do label the setting, not the action.
- Don't use a switch for a choice that only applies on submit; use Checkbox.

## Realizations
### Figma
Not started. Planned axes: Size, Selected, Validation, Disabled, plus State (Rest, Focus); Label text, Description text, Error text and the Required and Description switches.
### Web
Not started. Parts `field`, `control`, `input`, `thumb`, `label`, `required-indicator`, `description`, `error`.
### Coverage
Listed in contract.json `realizations.web.coverage`; none implemented yet.
### Known drift
- API shape: Field parts are inside the component (shadow DOM)
- focus ring: solid 3px ring, since a half-transparent ring is below 3:1
- off track: neutral-500 instead of a pale gray, for WCAG 1.4.11
- checked state: not reflected; the attribute is the reset default

## Open questions
None open. Answered with the recommended option (no approver in this session), recorded in contract.json and plan.md:
- Q1 `checked` is not reflected (as Checkbox).
- Q2 `label` is required.
- Q3 native `input` with `role="switch"`.
- Q4 Enter submits the form, does not toggle.
- Q5 sizes `medium` (default) and `small`.
- Q6 no indeterminate state.
- Q7 no label-position or direction prop.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first (rule test-first). Use `FormAssociated` + `NativeControl`.
