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
A setting that is either on or off and that reads as taking effect as it is flipped (notifications, dark mode, a feature flag). Not for a choice recorded only on submit, such as agreeing to terms (Checkbox), nor for choosing one option of several (Radio Group).

## 2. Anatomy
`field` (grid) holds `control` (the track with the native `<input type="checkbox" role="switch">` and the `thumb`), `label` (+ `required-indicator`), `description` (optional) and `error` (live region).

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the label |
| `error` | text | — | marks the field invalid |
| `name` | text | — | form field name |
| `value` | text | on | submitted while on |
| `checked` | boolean | false | current state; the attribute is the reset default |
| `size` | `default` \| `sm` | default | 32x20px or 24x16px track |
| `required`, `disabled` | boolean | false | native |

## 4. Variant matrix
Two sizes, `default` and `sm`. Each has off and on, with the states below.

## 5. Roles and color
Off: track background `input-background`, border `input`, thumb `foreground`. On: track fill `primary`, thumb `primary-foreground`. Label `foreground`; description `muted-foreground`; error and invalid border `destructive`; focus ring `ring`.

## 6. States
focus-visible (3px ring, border in `ring`), checked (fill and thumb moved to the end edge), invalid, disabled (opacity 0.5, not-allowed cursor).

## 7. Dimensions and layout
Track 32x20px (`sm` 24x16px), fully rounded, 1px border, shadow-xs. Thumb fills the track height less the 2px inset on each side (16px, `sm` 12px) and travels the remaining width. Under `rtl` the thumb starts at the right and travels left. 12px gap to the label; 6px between label and description. Motion uses the fast duration and the standard easing.

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5.

## 9. Accessibility
- Native `<input type="checkbox" role="switch">` with a native `<label for>` in one shadow root: announced as a switch with its on/off state. Space toggles; Enter does not toggle.
- Enter submits the form (implicit submission): the inner control has no form owner in its shadow root, so the component calls `form.requestSubmit()` (SB-0009).
- Description and error through `aria-describedby`; `aria-invalid` when invalid; the error is a persistent polite live region.
- The state is shown by the thumb position as well as color (WCAG 1.4.1). Border at 3:1 and a solid focus ring (deviation from the visual reference, WCAG 1.4.11).
- The track is under 24px high: WCAG 2.5.8 relies on the label row being part of the click target and the 12px gap.
- Form: value submitted only while on; reset restores the `checked` attribute; a disabled ancestor fieldset disables it; `required` is invalid while off.

## 10. Usage
### Behavior
`input` and `change` on each toggle, composed. Nothing is submitted while off. The component does not apply the setting itself; the page reacts to `change`.
### Composition
One per setting; a list of settings goes in a Field set (later).
### Choosing the props
Always give a fixed label that names the setting, never one that flips with the state. `description` for the consequence. `sm` for dense rows. `required` only for a setting that must be on to continue.
### Do / Don't
- Don't use a switch for a choice recorded only on submit; use Checkbox.
- Don't use a switch to run an action; use Button.
- Don't change the label when the state changes.

## Realizations
### Figma
Planned: axes Size, State, Selected, Validation and Disabled; Label text, Description text, Error text and the Required and Description switches.
### Web
Planned. `src/components/switch/Switch.ts`; parts `field`, `control`, `input`, `thumb`, `label`, `required-indicator`, `description`, `error`.
### Coverage
- label is the name; role is switch; label click toggles
- Space toggles; Enter submits and does not toggle; keyboard focus ring
- checked paints differently and the thumb moves; sm dimensions; rtl mirrors
- description and error in the accessible description; aria-invalid
- required: native required, aria-hidden asterisk, invalid after blur
- hide-label keeps the name
- input and change composed, once per toggle
- disabled cannot toggle
- form value only while on, custom value, reset to attribute default, validity, disabled fieldset, error customError, label for
- axe clean on all stories
### Known drift
- API shape: shadcn composes Field parts around Switch; shadow DOM requires them inside
- border color: shadcn default border-input is neutral-200; changed for WCAG 1.4.11
- focus ring: shadcn uses ring/50, below 3:1 (WCAG 1.4.11)
- checked state: not reflected: the attribute is the default restored by form reset

## Open questions
All answered with the recommended choice (no one was available); see SB-0101.
- Q0 Drafted from the visual reference, APG switch pattern and the Checkbox contract: yes.
- Q1 Role: native checkbox input with `role="switch"`.
- Q2 `checked` reflected: no, the attribute is the reset default.
- Q3 `label` required: yes; `hide-label` keeps it as the name.
- Q4 Sizes: `default` (32x20px) and `sm` (24x16px).
- Q5 Enter: submits the form; only Space toggles.
- Q6 `required`: must be on, native semantics.
- Q7 Indeterminate or read-only: no.
- Q8 Submission: `value` (default `on`) only while on; reset restores the attribute state.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first. Use `FormAssociated` + `NativeControl`.
