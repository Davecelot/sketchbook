---
component: Checkbox
status: beta
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-08
source: visual reference (look and sizes), WAI-ARIA APG, contract-first standard (contract and build process)
---

# Checkbox

> A checkbox with its label, description and error laid out beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
An independent yes/no choice, or picking several options from a list. Not for choosing exactly one (Radio Group) or an immediate on/off setting (Switch).

## 2. Anatomy
`field` (grid) holds `control` (the 16px box with the native `<input type="checkbox">` and the check and dash icons), `label` (+ `required-indicator`), `description` (optional) and `error` (live region).

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the control |
| `errorMessage` (`error-message`) | text | — | marks the field invalid |
| `name` | text | — | form field name |
| `value` | text | on | submitted while checked |
| `selected` | boolean | false | current state; the attribute is the reset default |
| `indeterminate` | boolean | false | mixed state; cleared by the first toggle |
| `required`, `disabled` | boolean | false | native |

## 4. Variant matrix
No visual variants. States below.

## 5. Roles and color
Box border `input`, background `input-background`; checked fill and border `primary`, icon `primary-foreground`; label `foreground`; description `muted-foreground`; error and invalid border `destructive`; focus ring `ring`.

## 6. States
focus-visible (3px ring, border in `ring`), checked, indeterminate, invalid (border `destructive`; a solid 3px `destructive` ring on keyboard focus), disabled (opacity 0.5, not-allowed cursor).

## 7. Dimensions and layout
Box 16px, radius 4px, 1px border, shadow-xs. 12px gap to the label; 6px between label and description.

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5.

## 9. Accessibility
- Enter submits the form (implicit submission): the inner control has no form owner in its shadow root, so the component calls `form.requestSubmit()` (SB-0009).
- Native `<input type="checkbox">` with a native `<label for>` in one shadow root. Space toggles. Indeterminate is exposed natively as mixed.
- Description and error through `aria-describedby`; `aria-invalid` when invalid; the error is a persistent polite live region.
- Border at 3:1 and a solid focus ring (deviation from the visual reference, WCAG 1.4.11). The 16px box relies on the label row and the 12px gap for WCAG 2.5.8.

## 10. Usage
### Behavior
`input` and `change` on each toggle, composed. Value is submitted only while checked.
### Composition
One per option; a group of them goes in a Field set (later).
### Choosing the props
`indeterminate` only for a parent summarizing children. `required` for agreements.
### Do / Don't
- Don't use a checkbox for an immediate setting; use Switch.
- Don't use vague labels.

## Realizations
### Figma
Drawn in the library (`sketchbook api figma checkbox`): axes State, Selected, Indeterminate, Validation and Disabled; Label text, Description text, Error text and the Required and Description switches. The layers follow the anatomy: `control` wraps the `input` box, which holds the check (selected) or minus (indeterminate) icon, sized to the box; the label, description and error share a column beside it (registered in `spec/api.json` layers). Disabled dims the box and the label, not the description or error, as the styles do. Not drawn: the box is not centered on the label's first line.
### Web
Complete. `src/components/checkbox/Checkbox.ts`; parts `field`, `control`, `input`, `label`, `required-indicator`, `description`, `error`.
### Coverage
- label is the name; label click toggles; box 16px beside the label
- Space toggles; keyboard focus ring
- indeterminate is mixed and cleared by the first toggle; checked paints differently
- description and error in the accessible description; aria-invalid
- required: native required, aria-hidden asterisk, invalid after blur
- hide-label keeps the name
- input and change composed, once per toggle
- disabled cannot toggle
- form value only while checked, custom value, reset to attribute default, validity, disabled fieldset, error customError, label for
- axe clean on all stories
### Known drift
- API shape: shadcn composes Field parts around Checkbox; shadow DOM requires them inside
- border color: shadcn default border-input is neutral-200; changed for WCAG 1.4.11
- focus ring: shadcn uses ring/50, below 3:1 (WCAG 1.4.11)
- checked state: not reflected: the attribute is the default restored by form reset

## Open questions
None open.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-checkbox-*` variables (check T4). Tests first. Use `FormAssociated` + `NativeControl`.
