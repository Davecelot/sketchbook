---
component: Switch
status: draft
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-12
source: visual reference (look, sizes and API), WAI-ARIA APG switch pattern, contract-first standard (contract and build process)
---

# Switch

> A toggle for an on/off setting, with its label, description and error beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Turning one setting on or off, such as notifications or a preference. Not for a choice recorded with other choices and confirmed later (Checkbox), nor for one of several options (Radio Group).

## 2. Anatomy
`field` (grid) holds `control` (the pill-shaped track with a transparent native `<input type="checkbox" role="switch">` and the round `thumb`), `label` (+ `required-indicator`), `description` (optional) and `error` (live region).

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the label |
| `error` | text | — | marks the field invalid (customError) |
| `size` | `default` \| `sm` | default | track and thumb size only; reflected |
| `name` | text | — | form field name |
| `value` | text | on | submitted while on |
| `checked` | boolean | false | on/off; the attribute is the reset default |
| `required` | boolean | false | native; must be on to submit |
| `disabled` | boolean | false | native; not submitted |

## 4. Variant matrix
`size`: `default`, `sm`. No visual variants beyond size; states below.

## 5. Roles and color
Track off `input`, on `primary`; thumb off `background`, on `primary-foreground`; label `foreground`; description `muted-foreground`; error text and invalid track border `destructive`; focus ring `ring`.

## 6. States
focus-visible (3px solid ring around the track), checked (track fills, thumb moves to the inline end), invalid (track border and error text in `destructive`), disabled (opacity 0.5, not-allowed cursor; also from a disabled fieldset). No hover look.

## 7. Dimensions and layout
| Size | Track | Thumb | Thumb travel |
| --- | --- | --- | --- |
| default | 32 × 20 | 16 | 12 |
| sm | 24 × 16 | 12 | 8 |

Thumb inset 2px from the track edge, pill radius, 1px border (transparent unless invalid), shadow-xs. 12px gap to the label; 6px between label and description. In RTL the thumb starts at the right and moves left.

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5. The same at both sizes.

## 9. Accessibility
- Native `<input type="checkbox" role="switch">` with a native `<label for>` in one shadow root: the role is switch and on/off comes from the native checked state. Space toggles. No mixed state.
- Enter submits the form (implicit submission): the inner control has no form owner in its shadow root, so the component calls `form.requestSubmit()` (SB-0009). Enter does not toggle.
- Form-associated through `FormAssociated` + `NativeControl`: submits `value` only while on, resets to the `checked` attribute, restores saved state, is disabled by a `<fieldset disabled>` without its own attribute changing, validates `required` (valueMissing) and `error` (customError), and a `<label for>` pointing at the host toggles it.
- Description and error through `aria-describedby`; `aria-invalid` when invalid; the error is a persistent polite live region.
- Off track at 3:1 against the page, thumb at 3:1 against the track in both states, solid focus ring (deviations from the visual reference, WCAG 1.4.11). The sm track (24 × 16) relies on the label row and the 12px gap for WCAG 2.5.8.
- The thumb's slide is removed under `prefers-reduced-motion: reduce`.
- The label names the setting and never changes with the state (APG).

## 10. Usage
### Behavior
`input` and `change` on each toggle by the person, composed; neither fires when `checked` is set from code. The new value is in `FormData` when `change` fires.
### Composition
One per setting; a list of settings goes in a Field set.
### Choosing the props
`size="sm"` for dense lists and table rows. `description` for the consequence of turning it on. `required` only when the form cannot go on without it on.
### Do / Don't
- Do label the setting ("Email notifications"), not the state ("On").
- Don't use a switch for a choice confirmed later alongside other choices; use Checkbox.
- Don't use a row of switches to pick one option; use Radio Group.
- Don't combine `size="sm"` with `hide-label`: the small track then has no label row to meet the target size.

## Realizations
### Figma
Not started.
### Web
Not started. Parts `field`, `control`, `input`, `thumb`, `label`, `required-indicator`, `description`, `error`.
### Coverage
None yet.
### Known drift
- API shape: the reference composes Label and Field parts around Switch; shadow DOM requires them inside
- track color (off): the reference's input color is below 3:1; changed for WCAG 1.4.11
- thumb color in dark mode: the reference uses foreground when off; here one role per state in both modes
- focus ring: the reference's translucent ring is below 3:1 (WCAG 1.4.11)
- sizes: the reference's tracks are 32 × 18.4 and 24 × 14; here rounded to the 4px grid of the semantic tokens
- checked state: not reflected; the attribute is the default restored by form reset

## Open questions
None open. Q1–Q7 were answered in-session with the recommended option (no reviewer available); see `openQuestions` in contract.json and [plan.md](./plan.md).

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first (rule test-first). Use `FormAssociated` + `NativeControl`.
