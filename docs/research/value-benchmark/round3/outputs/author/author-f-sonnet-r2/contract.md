---
component: Switch
status: draft
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-12
source: visual reference (look and sizes), WAI-ARIA APG switch pattern, the Checkbox contract (form pattern), contract-first standard
---

# Switch

> A toggle for an on/off setting, with its label, description and error laid out beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
A setting that is either on or off and is understood to apply as soon as it is flipped (notifications, dark mode, airplane mode), including one submitted with a form. Not for a choice recorded only on submit, such as accepting terms (Checkbox), a pressed-state button (Toggle) or choosing one of several (Radio Group).

## 2. Anatomy
`field` (grid) holds `control` (the track, with the native `<input type="checkbox" role="switch">` laid over it and the `thumb`), `label` (+ `required-indicator`), `description` (optional) and `error` (live region).

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the label |
| `error` | text | — | marks the field invalid and blocks submission |
| `size` | `default` \| `sm` | default | track and thumb size |
| `name` | text | — | form field name |
| `value` | text | on | submitted while on |
| `checked` | boolean | false | current state; the attribute is the reset default |
| `required` | boolean | false | must be on to submit |
| `disabled` | boolean | false | native; also applied by a disabled fieldset |

## 4. Variant matrix
One dimension, `size`: `default` and `sm`. No other visual variants. States below.

## 5. Roles and color
Off track `input`; on track `primary`; thumb `background` (off) and `primary-foreground` (on); label `foreground`; description `muted-foreground`; error and invalid outline `destructive`; focus ring `ring`.

## 6. States
hover (enabled only), focus-visible (3px solid ring around the track), checked (primary track, thumb at the end edge), invalid, disabled (opacity 0.5, not-allowed cursor). State is shown by thumb position as well as color.

## 7. Dimensions and layout
`default`: track 32x20px, thumb 16px. `sm`: track 24x16px, thumb 12px. The thumb sits 2px inside the track and slides with `motion.duration.fast`. 12px gap between track and label, 6px between label and description. In right-to-left layouts the thumb mirrors (`:dir(rtl)`).

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5.

## 9. Accessibility
- Native `<input type="checkbox" role="switch">` with a native `<label for>` in one shadow root. Space toggles; the state is exposed as on/off by the switch role.
- Enter submits the form (implicit submission) and does not toggle: the inner control has no form owner in its shadow root, so the component calls `form.requestSubmit()` (SB-0009).
- Description and error through `aria-describedby`; `aria-invalid` when invalid; the error is a persistent polite live region. An `error` also sets a customError validity so the form blocks submission (SB-0009).
- Only `aria-label` is forwarded from the host; `aria-labelledby` and `aria-describedby` are not (SB-0009), which is why `label` is required.
- Track and ring contrast at 3:1 and a solid focus ring (WCAG 1.4.11); the thumb is decoration, `aria-hidden`.
- The `sm` track is under 24px tall; it relies on the label row being part of the click target and on the 12px gap (WCAG 2.5.8).

## 10. Usage
### Behavior
`input` and `change` on each toggle, composed, once per toggle. Read the new state from `checked` on the host.
### Forms
Form-associated through `FormAssociated`: the `value` (default `on`) is submitted under `name` only while on, nothing while off. Form reset restores the `checked` attribute default. A disabled ancestor fieldset disables the switch and it is then not submitted. `required` makes an off switch invalid (valueMissing); the message anchors on the input. An `error` blocks submission until cleared.
### Composition
One per setting; stack them in a Field set (later). Don't put On/Off text in the label.
### Choosing the props
`description` for the consequence of turning it on. `required` only when the setting must be on. `hide-label` only when other visible text names the switch.
### Do / Don't
- Do name the setting in the label ("Airplane mode"), not the state.
- Don't use a switch for a choice that only counts on submit; use Checkbox.
- Don't use it for a pressed-state toolbar button; use Toggle.

## Realizations
### Figma
Planned. Axes State, Selected, Size, Validation and Disabled; Label text, Description text and Error text and the Required and Description switches. Layers follow the anatomy (`control` holds the track and thumb; label, description and error share one column beside it, registered in `spec/api.json` layers).
### Web
Not started. Planned `src/components/switch/Switch.ts`; parts `field`, `control`, `input`, `thumb`, `label`, `required-indicator`, `description`, `error`.
### Coverage (planned behavior spec, written first)
- role switch; label is the name; label click toggles
- Space toggles; Enter does not toggle but submits the form; keyboard focus ring
- checked paints differently and the thumb moves to the end edge; mirrored under rtl
- sizes default and sm: track and thumb dimensions
- description and error in the accessible description; aria-invalid
- required: native required, aria-hidden asterisk, invalid after blur or a submit attempt
- hide-label keeps the name
- input and change composed, once per toggle
- disabled cannot toggle or take focus
- form value only while on, custom value, reset to the checked attribute default, validity (valueMissing), disabled fieldset, error customError, label for, state restore
- axe clean on all stories
### Known drift
- API shape: shadcn composes Field parts around a Radix Switch; shadow DOM requires them inside
- element: shadcn renders a Radix button with role=switch; a native input gives form participation and validation (SB-0007)
- unchecked track color: shadcn default is neutral-200; changed for WCAG 1.4.11
- focus ring: shadcn uses ring/50, below 3:1 (WCAG 1.4.11)
- checked state: not reflected; the attribute is the default restored by form reset

## Open questions
None open. Q0-Q9 were answered with the recommendation (no one was available to ask) and recorded in SB-0101: native input with role=switch (Q1), sizes default and sm (Q2), label required (Q3), `checked` not reflected (Q4), Enter submits (Q5), nothing submitted while off (Q6), no text or icons in the track (Q7), thumb mirrors in rtl (Q8), no indeterminate or loading state (Q9).

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first. Use `FormAssociated` + `NativeControl`.
