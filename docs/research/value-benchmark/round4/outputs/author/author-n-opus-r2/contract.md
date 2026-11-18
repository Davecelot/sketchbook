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

> A switch for an on/off setting, with its label, description and error laid out beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Turns one setting on or off. Not for picking options from a list or giving consent (Checkbox), choosing one of several (Radio Group), or a pressed toolbar button (Toggle).

## 2. Anatomy
`field` (grid) holds `control` (the pill track with the native `<input type="checkbox" role="switch">` over it and the aria-hidden `thumb`), `label` (+ `required-indicator`), `description` (optional) and `error` (live region).

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the label |
| `error` | text | — | marks the field invalid (customError) |
| `name` | text | — | form field name |
| `value` | text | on | submitted while on |
| `checked` | boolean | false | on/off; the attribute is the reset default |
| `required` | boolean | false | must be on |
| `disabled` | boolean | false | native; also set by a disabled fieldset |
| `size` | `default` \| `sm` | default | track and thumb size only |

No `indeterminate` (role switch has no mixed state) and no `readonly` (Q7).

## 4. Variant matrix
`size`: `default`, `sm`. Every state applies to both sizes.

## 5. Roles and color
Track off `input`, on `primary`; thumb off `background`, on `primary-foreground`; label `foreground`; description `muted-foreground`; error text and invalid track border `destructive`; focus ring `ring`. Track border is transparent outside the invalid state.

## 6. States
focus-visible (3px ring around the track), checked (track fills, thumb slides to the end), invalid (destructive border, error shown), disabled (opacity 0.5, not-allowed cursor, label dimmed too). Hover has no look change.

## 7. Dimensions and layout
| Size | Track | Thumb |
| --- | --- | --- |
| default | 32 x 20 (`size.switch.width/height`) | 16 (`size.icon.default`) |
| sm | 24 x 16 (`size.switch.width-sm/height-sm`) | 12 (`size.icon.sm`) |

Track: pill radius, 1px border, shadow-xs; the thumb sits inside the border and travels track width minus thumb minus both borders. 12px gap to the label; 6px between label, description and error. The switch is vertically centered on the label's first line. In RTL the off thumb sits at the right (`:dir(rtl)`).

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5. Unchanged by `size`.

## 9. Accessibility
- Native `<input type="checkbox" role="switch">` with a native `<label for>` in one shadow root: the switch role announces on/off; Space toggles; clicking the label toggles.
- Enter submits the form and does not toggle: the inner control has no form owner in its shadow root, so the component calls `form.requestSubmit()` (SB-0009, Q2).
- Description and error through `aria-describedby`; `aria-invalid` when invalid; the error is a persistent polite live region.
- Form association (rule form-associated-controls): `FormAssociated` + `NativeControl`. Submits `value` only while on; `form.reset()` restores the `checked` attribute default; a `<fieldset disabled>` disables it without touching `disabled` and it is not submitted; `required` gives the native `valueMissing` while off; `error` sets `customError`; `<label for>` on the host toggles it; the form value is synced in the change handler so a `change` listener reading `FormData` sees the new state.
- Track off at 3:1 against the page, thumb at 3:1 against the track in both states, solid focus ring (deviations from the visual reference, WCAG 1.4.11).
- Forced colors: the track border shows in `CanvasText` and the on track and thumb use `Highlight`, so on and off stay distinct (Q9).
- `prefers-reduced-motion`: the thumb moves without a transition (Q9).
- The 32x20 track relies on the label row and the 12px gap for WCAG 2.5.8.

## 10. Usage
### Behavior
`input` and `change` on each toggle, composed. The effect of a switch is expected right away in settings; in a form it is submitted like a checkbox.
### Composition
One switch per setting. A list of settings goes in a Field group or Item rows.
### Choosing the props
`size="sm"` for dense lists and table rows. `description` when turning it on has consequences. `required` only when the form cannot be sent with the setting off; explain why in `error`.
### Do / Don't
- Do label the setting ("Email notifications"), not the state.
- Don't change the label between "On" and "Off".
- Don't use a switch for consent or for picking options; use Checkbox.

## Realizations
### Figma
Not started.
### Web
Not started. Planned parts `field`, `control`, `input`, `thumb`, `label`, `required-indicator`, `description`, `error`.
### Coverage
None yet. Test plan in [plan.md](./plan.md).
### Known drift
- API shape: the visual reference composes Field and Label parts around Switch; shadow DOM requires them inside
- focus ring: the reference's ring/50 is below 3:1 (WCAG 1.4.11)
- unchecked track: the reference's light track is below 3:1; uses `input` (WCAG 1.4.11)
- thumb in dark mode: one alias per token (background off, primary-foreground on) instead of the reference's foreground off
- track height: 20px and 16px from the size scale instead of 18.4px and 14px
- checked state: not reflected; the attribute is the default restored by form reset

## Open questions
All answered on 2026-11-12 with the recommendation, since no approver was available (details in contract.json `openQuestions`):
- Q1 native checkbox with `role="switch"`, not a button.
- Q2 Enter submits the form; Space toggles.
- Q3 `checked` not reflected.
- Q4 `label` required; `hide-label` available.
- Q5 sizes `default` and `sm` change track and thumb only.
- Q6 `required` means must be on.
- Q7 no indeterminate, no readonly.
- Q8 label after the switch only.
- Q9 forced colors and reduced motion handled as above.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first. Use `FormAssociated` + `NativeControl`.
