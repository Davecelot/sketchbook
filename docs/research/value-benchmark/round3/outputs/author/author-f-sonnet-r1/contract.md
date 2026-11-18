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

> A switch for an on/off setting, with its label, description and error beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
A single setting that is on or off, such as a notification or a feature preference. Not for picking several options from a list (Checkbox), exactly one of several (Radio Group), or a button that stays pressed (Toggle).

## 2. Anatomy
`field` (grid) holds `control` (the track with the native `<input type="checkbox" role="switch">` and the `thumb`), `label` (+ `required-indicator`), `description` (optional) and `error` (live region).

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the label |
| `error` | text | — | marks the field invalid and blocks submission |
| `name` | text | — | form field name |
| `value` | text | on | submitted while on |
| `checked` | boolean | false | current state; the attribute is the reset default |
| `size` | `default` \| `sm` | default | track 32×20px or 24×16px |
| `required`, `disabled` | boolean | false | native |

## 4. Variant matrix
Size (default, sm) × state (off, on). Other states below.

## 5. Roles and color
Track off: `input` fill and border; on: `primary` fill and border. Thumb off: `background`; on: `primary-foreground`. Label `foreground`; description `muted-foreground`; error and invalid border `destructive`; focus ring `ring`.

## 6. States
focus-visible (3px ring, border in `ring`), checked (thumb at the end side), invalid, disabled (opacity 0.5, not-allowed cursor, also from a disabled fieldset). The on state is shown by thumb position as well as color (WCAG 1.4.1).

## 7. Dimensions and layout
Default track 32×20px with a 16px thumb; sm track 24×16px with a 12px thumb; fully rounded, 1px border, shadow-xs. 12px gap to the label; 6px between label and description. In RTL the thumb travels the other way.

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5.

## 9. Accessibility
- Native `<input type="checkbox" role="switch">` with a native `<label for>` in one shadow root. Space toggles; Enter does not toggle but submits the form (implicit submission): the inner control has no form owner in its shadow root, so the component calls `form.requestSubmit()` (SB-0009).
- The label names the setting and never changes with the state; the switch role announces on or off.
- Description and error through `aria-describedby`; `aria-invalid` when invalid; the error is a persistent polite live region. An error also sets a `customError` validity so the form blocks submission (SB-0009).
- Track at 3:1 against the page and a solid focus ring (deviation from the visual reference, WCAG 1.4.11). The sm track relies on the label row for WCAG 2.5.8.

## 10. Usage
### Behavior
`input` and `change` on each toggle, composed. The value is submitted only while on. Form reset restores the `checked` attribute; a disabled fieldset disables the switch and re-enabling it restores the author's `disabled`. `required` means the switch must be on.
### Composition
One per setting; a list of settings goes in a Field set (later).
### Choosing the props
`required` only for an agreement that must be on. `description` for what the setting does. `hide-label` only when other visible text names it.
### Do / Don't
- Do name the setting, not the action ("Airplane mode", not "Enable airplane mode").
- Don't use a switch for a choice only recorded on submit; use Checkbox.
- Don't put on/off text in the track.

## Realizations
### Figma
Not started. Planned axes (`sketchbook api figma switch`): State, Size, Selected, Validation and Disabled; Label text, Description text, Error text and the Required and Description switches.
### Web
Not started. Parts: `field`, `control`, `input`, `thumb`, `label`, `required-indicator`, `description`, `error`.
### Coverage
Planned, in `playwright/tests/switch/switch.behavior.spec.ts`:
- label is the name; role is switch; label click toggles
- Space toggles; Enter does not toggle; keyboard focus ring
- size default and sm render the declared track dimensions
- checked moves the thumb and paints differently; thumb mirrors in RTL
- description and error in the accessible description; aria-invalid
- required: native required, aria-hidden asterisk, invalid after blur
- hide-label keeps the name
- input and change composed, once per toggle
- disabled cannot toggle or focus
- form value only while on, custom value, reset to attribute default, validity, disabled fieldset and re-enable, error customError, label for
- Enter submits the form (implicit submission)
- axe clean on all stories
### Known drift
- API shape: shadcn composes Field parts around Switch; shadow DOM requires them inside
- track color: shadcn default is bg-input, a lighter neutral; changed for WCAG 1.4.11
- focus ring: shadcn uses ring/50, below 3:1 (WCAG 1.4.11)
- track size: 32×20 and 24×16 from semantic size tokens; shadcn uses 32×18.4 and 24×14
- checked state: not reflected: the attribute is the default restored by form reset

## Open questions
All answered with the recommendation (no one was available to ask; recorded in SB-0101):
- Q1 Native `input type=checkbox role=switch`, not custom ARIA.
- Q2 `checked` is not reflected; the attribute is the reset default.
- Q3 `label` is required; `hide-label` keeps it as the name.
- Q4 `required` means the switch must be on.
- Q5 Sizes are `default` and `sm`.
- Q6 Enter submits the form and does not toggle.
- Q7 No on/off text in the track.
- Q8 Nothing is submitted while off.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first. Use `FormAssociated` + `NativeControl`.
