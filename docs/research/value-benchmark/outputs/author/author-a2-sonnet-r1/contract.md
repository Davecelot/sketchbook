---
component: Switch
status: draft
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-12
source: shadcn/ui Switch (UI and API), WAI-ARIA APG Switch pattern, harness process
---

# Switch

Typed spec: [contract.json](./contract.json). Decision: SB-0101.

## 1. Purpose

A toggle for a single on/off setting that takes effect immediately. It is a form control: it submits a value while on, resets with its form, is disabled by a disabled fieldset and validates `required`. Use a checkbox instead when the choice is applied only on submit.

## 2. Anatomy

- root: host layout, control beside a text column.
- control: the focusable `role=switch` element; contains track and thumb.
- track, thumb: the groove and the knob.
- text (optional): label, description, error.

## 3. Props / API

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| selected | boolean | false | On. Alias of checked. |
| value | text | "on" | Submitted under name while on. |
| name | text | "" | Form field name. |
| disabled | boolean | false | Also set by a disabled fieldset. |
| required | boolean | false | Off is invalid. |
| validation | none, error | none | Error look, message, aria-invalid. |
| size | small, medium | medium | |
| label | text | "" | Visible text and accessible name. |
| description | text | "" | Hint under the label. |
| errorMessage | text | "" | Shown only in error. |

Events: `change` (bubbles, not composed) and `input` (bubbles, composed), on user action only.

Form behavior: submits `name=value` only while on and named; reset restores the initial `selected`; a disabled ancestor fieldset disables it without changing its own `disabled`; `required` while off gives `valueMissing`.

## 4. Variant matrix

size (small, medium) x selected (false, true) x validation (none, error). Disabled applies at rest only.

## 5. Roles and color

Off: input-colored thumb on a field-colored track with an input border. On: primary track, primary-foreground thumb. Error: destructive border and message. Label uses foreground, description uses muted-foreground. All values come from the component tokens `--sb-switch-*`.

## 6. States

rest, hover, focus-visible (ring), active, selected, disabled (reduced opacity), invalid.

## 7. Dimensions and layout

Track sizes come from the semantic `size.switch` tokens (medium and small); the thumb is inset by `space.switch.inset`. Control and text sit side by side with the control gap; label, description and error stack with a small gap. The label is part of the click target.

## 8. Typography

Label: body size, label weight. Description: caption size, muted. Error: caption size, destructive.

## 9. Accessibility

- Role `switch` with `aria-checked`, following the APG Switch pattern; named by label, `aria-label` or `aria-labelledby`, with a console warning when none exists.
- Keyboard: Tab and Shift+Tab move focus, Space toggles, Enter does not (left to implicit form submission). Disabled is skipped in the tab order.
- `aria-describedby` links description and, in error, the error message; `aria-invalid` and `aria-required` mirror state.
- Focus ring on `:focus-visible` with 3:1 contrast; ui contrast pairs are declared in the contract for every mode.
- Target at least 24x24 px (WCAG 2.5.8). Under `prefers-reduced-motion` the thumb does not animate.

## 10. Usage
### Behavior
Toggling updates `selected`, then fires `input` and `change`. Setting `selected` from code fires neither.
### Composition
Place inside a form or fieldset; group related switches in a fieldset with a legend.
### Choosing the props
Always give a label. Add a description for consequences. Use `validation="error"` with `errorMessage` for required switches that were left off.
### Do / Don't
- Do use it for settings that apply at once. Don't use it for several exclusive options (use radio) or for choices applied on submit (use checkbox).
- Don't omit the label.

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

All answered with the recommendation (no approver available), 2026-11-12:

- Q1 selected, not checked.
- Q2 sizes small and medium.
- Q3 Enter does not toggle.
- Q4 label, description, errorMessage are text props.
- Q5 submits name=value while on; error look on author-set validation or failed submit.
- Q6 no indeterminate and no readOnly.

## Spec for agents
Build from contract.json only. CSS uses only --sb-switch-* variables (check T4). Tests first (rule test-first).
