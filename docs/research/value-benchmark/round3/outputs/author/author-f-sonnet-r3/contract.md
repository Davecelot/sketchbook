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
A setting that is either on or off, such as notifications or a preference. Not for a choice that is only recorded on submit, or for picking several options from a list (Checkbox), nor for choosing one of several (Radio Group).

## 2. Anatomy
`field` (grid) holds `control` (the track with the native `<input type="checkbox" role="switch">` and the `thumb`), `label` (+ `required-indicator`), `description` (optional) and `error` (live region).

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the label |
| `error` | text | — | marks the field invalid |
| `size` | `default` \| `sm` | default | track 32x20px or 24x16px |
| `name` | text | — | form field name |
| `value` | text | on | submitted while on |
| `checked` | boolean | false | current state; the attribute is the reset default |
| `required`, `disabled` | boolean | false | native |

Events: `input` and `change`, both composed.

## 4. Variant matrix
One dimension: `size` (default, sm). States below.

## 5. Roles and color
Off track `input`, on track `primary`; thumb `background` (off) and `primary-foreground` (on); label `foreground`; description `muted-foreground`; error and invalid track border `destructive`; focus ring `ring`.

## 6. States
focus-visible (3px ring), checked (thumb at the logical end), invalid, disabled (opacity 0.5, not-allowed cursor).

## 7. Dimensions and layout
Track 32x20px (default) or 24x16px (sm), pill radius, shadow-xs; thumb inset by `space.switch.inset`. 12px gap to the label; 6px between label and description. In RTL the thumb travels the other way.

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5.

## 9. Accessibility
- Native `<input type="checkbox" role="switch">` with a native `<label for>` in one shadow root. Space toggles; Tab moves focus. State is the native checked state, so no hand-set `aria-checked`.
- Enter submits the form (implicit submission): the inner control has no form owner in its shadow root, so the component calls `form.requestSubmit()` (SB-0009). It does not toggle.
- Description and error through `aria-describedby`; `aria-invalid` when invalid; the error is a persistent polite live region.
- Off track at 3:1 against the background and a solid focus ring (deviation from the visual reference, WCAG 1.4.11). The small track relies on the label row and the 12px gap for WCAG 2.5.8.
- State is not conveyed by color alone: the thumb position changes (WCAG 1.4.1).

## 10. Usage
### Behavior
`input` and `change` on each toggle, composed. Value is submitted only while on. Form reset restores the `checked` attribute; a disabled switch or a disabled fieldset is not submitted and is operable again when re-enabled. `required` means the switch must be on; an `error` blocks submission.
### Composition
One per setting; a group goes in a Field set (later).
### Choosing the props
Use `sm` for dense lists. Use `required` only for a condition that must be on. Label the setting, not the action ("Email notifications", not "Toggle").
### Do / Don't
- Don't use a switch for a choice that is recorded on submit; use Checkbox.
- Don't use vague labels.

## Realizations
### Figma
To be drawn from the contract (`sketchbook api figma switch`): axes Size, Selected, State, Validation and Disabled; Label, Description and Error text and the Required and Description switches. Layers follow the anatomy.
### Web
Planned. `src/components/switch/Switch.ts`; parts `field`, `control`, `input`, `thumb`, `label`, `required-indicator`, `description`, `error`.
### Coverage
- label is the name; role switch; label click toggles
- Space toggles; Enter submits and does not toggle; keyboard focus ring
- checked paints differently; thumb moves, mirrored in RTL
- both sizes
- description and error in the accessible description; aria-invalid
- required: native required, aria-hidden asterisk, invalid after blur
- hide-label keeps the name
- input and change composed, once per toggle
- disabled cannot toggle
- form value only while on, custom value, reset, state restore, validity, disabled fieldset and re-enable, error customError, label for
- axe clean on all stories
### Known drift
- API shape: shadcn composes Field parts around Switch; shadow DOM requires them inside
- track color: changed for WCAG 1.4.11
- focus ring: shadcn uses ring/50, below 3:1 (WCAG 1.4.11)
- checked state: not reflected: the attribute is the default restored by form reset

## Open questions
All answered with the recommended choice on 2026-11-12 (no approver was available); recorded in contract.json and SB-0101.
- Q1 Label, description and error live inside Switch.
- Q2 `label` is required; `hide-label` keeps it as the name.
- Q3 `checked` is not reflected; the attribute is the reset default.
- Q4 Sizes `default` and `sm`.
- Q5 Enter submits the form; only Space toggles.
- Q6 Native checkbox input with `role="switch"`.
- Q7 The thumb mirrors in RTL.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first. Use `FormAssociated` + `NativeControl`.
