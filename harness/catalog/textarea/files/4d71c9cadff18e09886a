---
component: Textarea
status: beta
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-08
source: visual reference (look and sizes), WAI-ARIA APG, contract-first standard (contract and build process)
---

# Textarea

> A multi-line text field with label, description and error built in, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Longer free text: comments, messages, notes. Not for a short single-line value (Input).

## 2. Anatomy
`field` (vertical stack) holds `label` (+ `required-indicator`), `textarea` (native `<textarea>`), `description` (optional), `error` (live region).

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the control |
| `errorMessage` (`error-message`) | text | — | marks the field invalid |
| `name`, `value`, `placeholder`, `autocomplete` | text | — | native |
| `required`, `disabled`, `readOnly` (`readonly`) | boolean | false | native |
| `minlength`, `maxlength` | number | — | native validation |

## 4. Variant matrix
No visual variants. States below.

## 5. Roles and color
Border `input`, background `input-background`, text `foreground`, placeholder `muted-foreground`, label `foreground`, description `muted-foreground`, error and invalid border `destructive`, focus ring `ring`.

## 6. States
focus-visible (3px ring, border in `ring`), invalid (border `destructive`; on keyboard focus a solid 3px `destructive` ring, so focus differs from invalid at rest: WCAG 2.4.7, 1.4.11; the visual reference tints it at 20%), disabled (opacity 0.5, not-allowed cursor), readonly. Invalid appears after blur or a submit attempt, never on the first keystroke.

## 7. Dimensions and layout
Minimum height 64px, padding 12px × 8px, radius 8px, 1px border, shadow-xs. Full width of its container; resizes vertically.

## 8. Typography
Textarea and label 14px; label weight 500, line-height 1; description and error 14px, line-height 1.5.

## 9. Accessibility
- Native `<label for>` and `<textarea>` in one shadow root, because shadow DOM blocks an external label . Description and error are linked with `aria-describedby`; `aria-invalid` when invalid, or when the host carries `aria-invalid="true"` (set by a wrapper such as `sb-input-group`).
- The error is announced once when it appears (persistent `aria-live="polite"` region).
- Required: native `required` plus an `aria-hidden` asterisk; each form explains "* required" once.
- Border at 3:1 and a solid focus ring (deviation from the visual reference, WCAG 1.4.11).
- Enter inserts a newline and never submits the form, like the native control.

## 10. Usage
### Behavior
`input` fires on every edit; `change` on commit (blur), re-dispatched from the host. Form value, validity and reset go through ElementInternals.
### Composition
Inside a form with a submit Button.
### Choosing the props
Use `description` for limits or format; `errorMessage` to say what went wrong and how to fix it.
### Do / Don't
- Don't use the placeholder as the label.
- Don't rely on Enter to submit.

## Realizations
### Figma
Drawn in the library (`sketchbook api figma textarea`): axes State (Rest, Focus), Validation and Disabled; text properties Label, Value, Placeholder, Description and Error, booleans Required, Value, Placeholder and Description. Disabled dims the textarea only, not the label, description or error, as the styles do.
### Web
Complete. `src/components/textarea/Textarea.ts`; parts `field`, `label`, `required-indicator`, `textarea`, `description`, `error`.
### Coverage
- label is the name; label click focuses; min height 64px; vertical resize
- hide-label keeps the name
- description and error in the accessible description; aria-invalid
- native validity after blur, not on first typing
- required: native required, aria-hidden asterisk
- input on edit, change on commit, both composed
- Enter inserts a newline, never submits
- keyboard focus ring
- form value, validity, minlength, reset, disabled, disabled fieldset, error customError, label for
- axe clean on all stories
### Known drift
- API shape: shadcn composes Field parts around Textarea; shadow DOM requires them inside
- border color: shadcn default border-input is neutral-200; changed for WCAG 1.4.11
- focus ring: shadcn uses ring/50, below 3:1 (WCAG 1.4.11)
- auto-grow: shadcn uses field-sizing-content (auto-grow); brief asks for vertical resize

## Open questions
None open.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-textarea-*` variables (check T4). Tests first (rule test-first). Use `FormAssociated` + `NativeControl`; model on Input.
