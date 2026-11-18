---
component: Switch
status: draft
version: 0.1.0
platforms: [web]
dependsOn: []
last_updated: 2026-11-12
source: visual reference (look and sizes), WAI-ARIA APG switch pattern, Checkbox contract (form-control template), contract-first standard
---

# Switch

> A toggle for an on/off setting, with its label, description and error laid out beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
A single setting that is on or off and reads as taking effect as soon as it is flipped. Not for a choice recorded on submit or several options from a list (Checkbox), nor for exactly one of several (Radio Group).

## 2. Anatomy
`field` (grid) holds `control` (the track, with the native switch input and the `thumb`), `label` (+ `required-indicator`), `description` (optional) and `error` (live region).

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the label |
| `error` | text | — | marks the field invalid |
| `size` | `default` \| `sm` | default | track and thumb size |
| `name` | text | — | form field name |
| `value` | text | on | submitted while on |
| `checked` | boolean | false | current state; the attribute is the reset default |
| `required`, `disabled` | boolean | false | native |

## 4. Variant matrix
`size` (default, sm) × on/off. No other visual variants.

## 5. Roles and color
Off track `input`; on track `primary`; thumb `background` off and `primary-foreground` on; label `foreground`; description `muted-foreground`; error and invalid border `destructive`; focus ring `ring`.

## 6. States
focus-visible (3px ring), checked (filled track, thumb at the end), invalid, disabled (opacity 0.5, not-allowed cursor). Hover has no visual change. On/off is told by thumb position as well as color.

## 7. Dimensions and layout
Default track 32×20, sm 24×16; pill radius; thumb inset by the switch inset on every side and the same height as the track's inner height; shadow-xs. 12px gap to the label; 6px between label and description. In right-to-left the thumb starts and ends on the mirrored sides.

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5.

## 9. Accessibility
- Native checkbox input with the switch role, and a native `<label for>`, in one shadow root. The browser exposes the on/off state; nothing is faked with ARIA on a generic element.
- Space toggles. Enter submits the form (implicit submission; the inner control has no form owner in its shadow root, SB-0009). The APG leaves Enter optional for a switch.
- Description and error through `aria-describedby`; `aria-invalid` when invalid; the error is a persistent polite live region and also sets a custom validity so the form blocks submission.
- The label is a required prop because an external `<label for>` names the host, not the inner control. A missing label warns in development.
- Track at 3:1 against the page and a solid focus ring (deviation from the visual reference, WCAG 1.4.11). The sm track is shorter than 24px, so it relies on the clickable label row and the gap for WCAG 2.5.8.
- Disabled is never submitted and cannot be focused or toggled; a disabled fieldset ancestor disables it without changing its own `disabled`.

## 10. Usage
### Behavior
`input` and `change` on each toggle, composed. The value is submitted only while on; a form reset restores the initial state; a disabled fieldset disables it and re-enabling restores it; `required` makes off invalid.
### Composition
One per setting; a list of them goes in a Field set (later). Description and error are part of the component, not siblings.
### Choosing the props
`size` sm for dense settings rows; default elsewhere. `required` only when the form cannot proceed with the setting off, with a label that states what is turned on. `hide-label` only when other visible text names the switch.
### Do / Don't
- Don't use a switch for a choice that only counts once the form is submitted; use Checkbox.
- Don't use one to pick between several options; use Radio Group.
- Don't change the label with the state ("Enable" / "Disable"); name the setting.
- Don't use vague labels.

## Realizations
### Figma
Not realized yet; web only. The layer names already registered in `spec/api.json` (`switch.content`, `switch.label-text`, `switch.focus-ring`) are for when it is.
### Web
Not started. Planned files: `src/components/switch/Switch.ts`; parts `field`, `control`, `input`, `thumb`, `label`, `required-indicator`, `description`, `error`. Extends `FormAssociated` then `NativeControl` (SB-0101); hooks `formValue` (`value` while on, else null), `formReset`, `formStateRestore`, `validationAnchor` (the inner input). Renders the input with `?disabled=${this.isDisabled}`, styles a dimmed host with `:host(:disabled)`, forwards a host-targeted label click, calls `syncFormState()` in the input handler.
### Coverage
- label is the name; label click toggles; role switch with aria-checked
- Space toggles; Enter submits and does not toggle; keyboard focus ring
- size default and sm dimensions; checked moves the thumb and paints differently
- description and error in the accessible description; aria-invalid
- required: native required, aria-hidden asterisk, invalid after blur
- hide-label keeps the name
- input and change composed, once per toggle; change listener sees the new FormData
- disabled cannot toggle
- form value only while on, custom value, reset to attribute default, validity, disabled fieldset and re-enable, error customError, label for
- axe clean on all stories
### Known drift
- API shape: shadcn composes Field parts around Switch; shadow DOM requires them inside
- track color: shadcn default is neutral-200; changed for WCAG 1.4.11
- focus ring: shadcn uses ring/50, below 3:1 (WCAG 1.4.11)
- checked state: not reflected: the attribute is the default restored by form reset

## Open questions
None open. Answered with the recommendation (no one was available to confirm; revisit freely):
- Q1 `checked` is not reflected, as Checkbox.
- Q2 `label` is required.
- Q3 sizes are `default` and `sm`.
- Q4 Enter submits the form; Space is the only toggle key.
- Q5 the thumb is a part over a native input with the switch role.
- Q6 no design-file realization for now.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first. Use `FormAssociated` + `NativeControl`.
