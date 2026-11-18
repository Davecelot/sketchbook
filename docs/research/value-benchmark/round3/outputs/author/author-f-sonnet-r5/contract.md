---
component: Switch
status: draft
version: 0.1.0
platforms: [web]
dependsOn: []
last_updated: 2026-11-12
source: visual reference (look and sizes), WAI-ARIA APG switch pattern, contract-first standard (contract and build process)
---

# Switch

> A toggle for an on/off setting, with its label, description and error laid out beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
A setting that is either on or off (notifications, dark mode, "auto-save"). Not for a choice recorded on submit among other options (Checkbox), nor for choosing one of several (Radio Group), nor for an action (Button).

## 2. Anatomy
`field` (grid) holds `control` (the track, with the native `<input type="checkbox" role="switch">` and the `thumb`), `label` (+ `required-indicator`), `description` (optional) and `error` (live region).

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the label |
| `error` | text | — | marks the field invalid and blocks submit |
| `size` | `default` \| `sm` | default | track 32x20px or 24x16px |
| `name` | text | — | form field name |
| `value` | text | on | submitted while on |
| `checked` | boolean | false | current state; the attribute is the reset default |
| `required` | boolean | false | must be on to submit |
| `disabled` | boolean | false | native; also from a disabled fieldset |

## 4. Variant matrix
One axis: `size` (default, sm). No excluded combinations. States are listed below.

## 5. Roles and color
Off track `input` (3:1), off thumb `background`; on track `primary`, on thumb `primary-foreground`; label `foreground`; description `muted-foreground`; error and invalid border `destructive`; focus ring `ring`.

## 6. States
focus-visible (3px solid ring), checked (on; off is the base look), invalid, disabled (opacity 0.5, not-allowed cursor). Hover has no token change.

## 7. Dimensions and layout
Default track 32x20px, thumb 16px; sm track 24x16px, thumb 12px. Pill radius, 1px border, shadow-xs. 12px gap to the label; 6px between label and description. The thumb moves from the start to the end edge and mirrors in RTL; the move uses the fast duration and standard easing.

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5.

## 9. Accessibility
- Native `<input type="checkbox" role="switch">` with a native `<label for>` in one shadow root. Space toggles; Enter does not toggle but submits the form (implicit submission): the inner control has no form owner in its shadow root, so the component calls `form.requestSubmit()` (SB-0009).
- State is conveyed by the switch role (on/off) and by thumb position, never by color alone (1.4.1). Off track at 3:1 against the background and a solid focus ring (1.4.11).
- Description and error through `aria-describedby`; `aria-invalid` when invalid; the error is a persistent polite live region. An error also sets a `customError` validity so the form blocks submission.
- The track is smaller than 24px high; the label row is clickable and the 12px gap satisfies WCAG 2.5.8.
- Contrast pairs for label, description, error, both track states, thumb on track, invalid border and focus ring are declared in contract.json and checked by T6.

## 10. Usage
### Behavior
`input` and `change` on each toggle, composed. The value is submitted only while on. Form reset restores the state of the `checked` attribute. A disabled ancestor fieldset disables the switch and it is not submitted. `required` blocks submit while off (valueMissing).
### Composition
One per setting; a list of settings goes in a Field set (later).
### Choosing the props
Fixed label that names the setting ("Airplane mode"), never "Enable/Disable". `required` only for must-accept settings. `sm` for dense settings lists.
### Do / Don't
- Do use a switch when the setting takes effect as it flips.
- Don't use a switch to choose one of several options; use Radio Group.
- Don't change the label with the state.

## Realizations
### Web
Not started. Expected files `src/components/switch/Switch.ts`, `Switch.scss`, `Switch.styles.ts`, `Switch.stories.ts`, `index.ts`; parts `field`, `control`, `input`, `thumb`, `label`, `required-indicator`, `description`, `error`. No code is written by this spec.
### Coverage (to be tested first)
- label is the name; label click toggles; role switch with correct on/off state
- Space toggles; Enter submits and does not toggle; keyboard focus ring
- both sizes at the declared dimensions; thumb position differs between on and off, also in RTL
- description and error in the accessible description; aria-invalid
- required: native required, aria-hidden asterisk, invalid when off after blur or submit
- hide-label keeps the name
- input and change composed, once per toggle
- disabled cannot toggle; a disabled fieldset disables it
- form value only while on, custom value, reset to the attribute default, validity, error customError
- axe clean on all stories
### Known drift
None yet; one expected deviation from the visual reference, recorded in Q7: the off track uses `input` for 3:1 instead of a translucent fill.

## Open questions
All answered with the recommended choice (no reviewer was available), dated 2026-11-12; revisit by changing the contract.
- **Q0** Content drafted from APG switch and the Checkbox contract. Answered: yes.
- **Q1** Native input with `role=switch` or custom element? Answered: native input (SB-0007, native elements first).
- **Q2** Is `checked` reflected? Answered: no; the attribute is the reset default, as in Checkbox.
- **Q3** Is `label` required? Answered: yes; `hide-label` keeps it as the name.
- **Q4** What does `required` mean? Answered: must be on to submit.
- **Q5** Enter toggles or submits? Answered: submits (SB-0009); only Space toggles.
- **Q6** Which sizes? Answered: `default` 32x20px and `sm` 24x16px, from the existing `size.switch.*` tokens.
- **Q7** Off state at 3:1 and not by color alone? Answered: off track in `color.input`, plus thumb position.
- **Q8** Loading or indeterminate state? Answered: no.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first. Use `FormAssociated` + `NativeControl`, as Checkbox does.
