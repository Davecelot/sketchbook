---
component: Input
status: beta
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-08
source: shadcn/ui Input + Field (UI and API), contract-first standard (contract and build process)
---

# Input

> A single-line text field with its label, description and error built in: label, description and error, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Short free text: names, emails, codes, search terms. Not for multi-line text (Textarea) or choosing from a known list (Native Select, Radio Group).

## 2. Anatomy
`field` (vertical stack, 12px gap) holds `label` (+ `required-indicator`), `input` (native `<input>`), `description` (optional), `error` (live region).

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the field |
| `errorMessage` (`error-message`) | text | — | error message; marks the field invalid |
| `type` | text, email, password, search, tel, url, number | text | |
| `name`, `value`, `placeholder`, `autocomplete` | text | — | native |
| `required`, `disabled`, `readOnly` (`readonly`) | boolean | false | native |
| `minlength`, `maxlength`, `pattern` | number / text | — | native validation |

## 4. Variant matrix
No visual variants (one height). States below.

## 5. Roles and color
Border `input`, background `input-background`, text `foreground`, placeholder `muted-foreground`, label `foreground`, description `muted-foreground`, error and invalid border `destructive`, focus ring `ring`.

## 6. States
focus-visible (3px ring, border in `ring`), invalid (border `destructive`; on keyboard focus a solid 3px `destructive` ring, so focus differs from invalid at rest: WCAG 2.4.7, 1.4.11; the visual reference tints it at 20%), disabled (control only: opacity 0.5, not-allowed cursor; label and description keep full strength), readonly. Invalid appears after blur or a submit attempt, never on the first keystroke.

## 7. Dimensions and layout
Height 36px, padding 12px × 4px, radius 8px, 1px border, shadow-xs. Full width of its container.

## 8. Typography
Input and label 14px; label weight 500, line-height 1; description and error 14px, line-height 1.5.

## 9. Accessibility
- Native `<label for>` and `<input>` in one shadow root, because shadow DOM blocks an external label . Description and error are linked with `aria-describedby` (same root); `aria-invalid="true"` when invalid, or when the host carries `aria-invalid="true"` (set by a wrapper such as `sb-input-group`). Setting `error` also sets a custom validity, so the form blocks submission.
- Form-associated: value, validity (anchored to the inner input), reset and disabled go through ElementInternals. Enter submits the owning form (handled by the component).
- The error is announced once when it appears (persistent `aria-live="polite"` region; deviation from the reference implementation, where it is read only on focus).
- Required: native `required` plus an `aria-hidden` asterisk; each form explains "* required" once.
- Border at 3:1 against the background (deviation from the visual reference's lighter border, WCAG 1.4.11). Set `autocomplete` for personal data (1.3.5).

## 10. Usage
### Behavior
`input` fires on every edit; `change` on commit (blur, Enter), re-dispatched from the host. Form value, validity and reset go through ElementInternals.
### Composition
Inside a form with a submit Button. For prefix or suffix content use Input Group (later).
### Choosing the props
Use `description` to explain format before typing; `errorMessage` to say what went wrong and how to fix it.
### Do / Don't
- Don't use the placeholder as the label.
- Don't show errors while someone is still typing their first attempt.

## Realizations
### Figma
Drawn in the library. Axes, values and property names come from the API vocabulary (`sketchbook api figma input`): State, Validation and Disabled, with Label text, Value text, Placeholder text, Description text, Error text, and the Value, Placeholder, Description and Required switches.
### Web
Complete. Files: `src/components/input/Input.ts`, `Input.scss`, `Input.styles.ts` (generated), `Input.stories.ts`, `index.ts`. Parts: `field`, `label`, `required-indicator`, `input`, `description`, `error`. Slots: none. Spec: `playwright/tests/input/input.behavior.spec.ts`.
### Coverage
- label is the name; label click focuses; 36px
- hide-label keeps the name
- description and error in the accessible description; aria-invalid
- native validity after blur, not on first typing
- required: native required, aria-hidden asterisk
- input on edit, change on commit, both composed
- keyboard focus ring
- form value, validity, reset, disabled excluded
- axe clean on all stories
### Known drift
- API shape: label, description and error are props of Input; shadcn composes Field, FieldLabel, FieldDescription and FieldError around it, and shadow DOM requires them inside.
- Border color: `color.input` is neutral-500 (3:1); shadcn's neutral-200 changed for WCAG 1.4.11.
- Dark background: `color.input-background`; shadcn uses `input/30` in dark.
- Focus ring: solid 3px ring color; shadcn's ring/50 is below 3:1 (WCAG 1.4.11).
- Implicit submission: Enter calls `form.requestSubmit()` without a submitter; native inputs submit with the default button as submitter, so a sb-button submit name/value is not included on Enter.

## Open questions
- Q1 (answered): the label lives inside Input : native `<label for>`, description and error in one shadow root.
- Q2 (answered): required is an aria-hidden asterisk plus native `required`; a one-line "* required" legend per form is documented in Usage.
- Q3 (answered): no sizes; one height (36px).

## Spec for agents
Build from contract.json only. CSS uses only `--sb-input-*` variables (check T4). Tests first (rule test-first). Use the shared form-associated base (`FormAssociated` + `NativeControl` pattern) so Button and later controls share it.
