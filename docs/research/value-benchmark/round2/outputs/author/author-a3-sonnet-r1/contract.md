---
component: Switch
status: draft
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-12
source: shadcn/ui Switch (look and sizes), WAI-ARIA APG switch pattern, contract-first standard (contract and build process)
---

# Switch

> A switch for an on/off setting, with its label, description and error laid out beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
A binary setting, usually one that takes effect at once, or a yes/no preference in a settings form. Not for a choice recorded only on submit, such as agreeing to terms (Checkbox), nor for choosing one option of several (Radio Group).

## 2. Anatomy
`field` (grid) holds `control` (the pill track with the native `<input type="checkbox" role="switch">` and the `thumb`), `label` (+ `required-indicator`), `description` (optional) and `error` (live region).

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the control |
| `error` | text | — | marks the field invalid |
| `size` | medium, small | medium | track and thumb size; `default` and `sm` are registered aliases |
| `name` | text | — | form field name |
| `value` | text | on | submitted while on |
| `checked` | boolean | false | current state; the attribute is the reset default |
| `required` | boolean | false | must be on to submit |
| `disabled` | boolean | false | native; also set by a disabled fieldset |

## 4. Variant matrix
One dimension: `size` (medium, small).

## 5. Roles and color
Off track `input`, on track and border `primary`; thumb `background` when off, `primary-foreground` when on; label `foreground`; description `muted-foreground`; error and invalid border `destructive`; focus ring `ring`.

## 6. States
focus-visible (3px ring, border in `ring`), checked (primary track, thumb at the end, mirrored in rtl), invalid, disabled (opacity, not-allowed cursor).

## 7. Dimensions and layout
Medium: 32x18px track, 16px thumb. Small: 24x14px track, 12px thumb. Fully rounded, shadow-xs. 12px gap to the label; 6px between label and description. Track height is derived from the thumb and border (see Known drift).

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5.

## 9. Accessibility
- Native `<input type="checkbox" role="switch">` with a native `<label for>` in one shadow root. Space toggles; the state is exposed as on/off.
- Form-associated through `FormAssociated` + `NativeControl` (rule form-associated-controls): submits `value` only while on, resets to the `checked` attribute, is disabled by a disabled `<fieldset>` without changing the attribute (`:host(:disabled)`), and `required` gives `valueMissing` while off.
- Enter submits the form (implicit submission): the inner control has no form owner in its shadow root, so the component calls `form.requestSubmit()` (SB-0009). A set `error` also sets a `customError` validity.
- Description and error through `aria-describedby`; `aria-invalid` when invalid; the error is a persistent polite live region.
- Off track at 3:1 and a solid focus ring (deviation from the visual reference, WCAG 1.4.11). The track is under 24px tall and relies on the label row and the 12px gap for WCAG 2.5.8.

## 10. Usage
### Behavior
`input` and `change` on each toggle, composed. Value is submitted only while on.
### Composition
One per setting; a list of them goes in a Field set (later).
### Choosing the props
`size="small"` for dense, secondary settings. `required` only when the setting must be on.
### Do / Don't
- Don't use a switch for a choice that waits for submit; use Checkbox.
- Don't label it with its state ("On"); name the setting.

## Realizations
### Figma
Not drawn yet. Planned axes: Size, Selected, Validation, Disabled and State (Rest, Focus); Label text, Description text, Error text and the Required and Description switches (names registered in `spec/api.json`).
### Web
Not started. Planned `src/components/switch/Switch.ts`; parts `field`, `control`, `input`, `thumb`, `label`, `required-indicator`, `description`, `error`.
### Known drift
- API shape: shadcn composes Field parts around Switch; shadow DOM requires them inside
- off track color: shadcn default bg-input is neutral-200; changed for WCAG 1.4.11
- focus ring: shadcn uses ring/50, below 3:1 (WCAG 1.4.11)
- track height: derived from existing tokens (18px) instead of shadcn's 18.4px

## Open questions
None open. Answered with the recommendation, because nobody was available to approve (SB-0101):
- Q1 native input with `role="switch"`; Q2 `checked` not reflected, no indeterminate; Q3 `label` required; Q4 `size` is medium | small; Q5 `required` means must be on; Q6 track height derived from tokens.
- Q7 plan approval: not given by a person. Implementation waits for confirmation.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first. Use `FormAssociated` + `NativeControl`.
