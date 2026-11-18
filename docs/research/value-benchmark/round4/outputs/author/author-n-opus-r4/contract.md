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

> An on/off toggle for a setting, with its label, description and error laid out beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
A single setting that is either on or off. Not for picking several items from a list or giving consent (Checkbox), nor for choosing one of several options (Radio Group).

## 2. Anatomy
`field` (grid) holds `control` (the pill track, with the native `<input type="checkbox" role="switch">` stretched over it and the `thumb`), `label` (+ `required-indicator`), `description` (optional) and `error` (live region).

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the label |
| `error` | text | — | marks the field invalid (customError) |
| `name` | text | — | form field name |
| `value` | text | on | submitted while on |
| `checked` | boolean | false | on state; the attribute is the reset default |
| `size` | `default` \| `sm` | default | track and thumb size |
| `required`, `disabled` | boolean | false | native |

## 4. Variant matrix
`size`: `default`, `sm`. No other visual variants. States below.

## 5. Roles and color
Off track `input`; on track `primary`. Thumb `background` when off, `primary-foreground` when on. Label `foreground`; description `muted-foreground`; error and invalid track border `destructive`; focus ring `ring`.

## 6. States
focus-visible (solid ring around the track), checked (track fill and thumb at the inline end), invalid (track border and error text in `destructive`), disabled (opacity 0.5, not-allowed cursor; also under a disabled fieldset). Hover has no look of its own.

## 7. Dimensions and layout
| Size | Track | Thumb |
| --- | --- | --- |
| default | 32 × 20 | 16 |
| sm | 24 × 16 | 12 |

Track radius pill, 1px border (transparent unless invalid), shadow-xs. The thumb sits 1px inside the border and travels the track width minus its own size; the direction flips under `dir="rtl"`. 12px gap to the label; 6px between label and description.

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5. Unchanged by `size`.

## 9. Accessibility
- Native `<input type="checkbox" role="switch">` with a native `<label for>` in one shadow root; the browser exposes the on/off state.
- Space toggles. Enter submits the form and does not toggle: the inner control has no form owner in its shadow root, so the component calls `form.requestSubmit()` (SB-0009).
- Description and error through `aria-describedby`; `aria-invalid` when invalid; the error is a persistent polite live region.
- The label stays constant; the state is never only a color (the thumb moves).
- Off track at 3:1 against the background and a solid focus ring (deviation from the visual reference, WCAG 1.4.11). The small track relies on the label row and the 12px gap for WCAG 2.5.8.
- Transitions are removed under `prefers-reduced-motion: reduce`.

### Form association
`FormAssociated` + `NativeControl` mixins. Submits `value` only while on; `form.reset()` restores the `checked` attribute; `<fieldset disabled>` disables it (rendered from `isDisabled`, author attribute untouched) and it is not submitted; `required` gives `valueMissing` while off; `error` gives `customError`; `<label for>` on the host toggles it.

## 10. Usage
### Behavior
`input` and `change` on each user toggle, composed; `change` fires after the form value is synced. Setting `checked` from code fires nothing.
### Composition
One per setting; a list of settings goes in a Field set.
### Choosing the props
`sm` for dense lists and table rows. `description` when the effect needs explaining. `required` only when the setting must be on to continue.
### Do / Don't
- Don't change the label with the state ("On"/"Off"); name the setting.
- Don't use a switch for consent or multi-selection; use Checkbox.

## Realizations
### Figma
Not started. Axes Size, State (Rest, Focus), Selected, Validation and Disabled; Label text, Description text, Error text and the Required and Description switches. Layers registered in `spec/api.json`: `switch.content`, `switch.label-text`, `switch.focus-ring`.
### Web
Not started. `src/components/switch/Switch.ts`; parts `field`, `control`, `input`, `thumb`, `label`, `required-indicator`, `description`, `error`.
### Known drift
- API shape: the reference composes Field parts around Switch; shadow DOM requires them inside
- focus ring: the reference uses a translucent ring, below 3:1 (WCAG 1.4.11)
- unchecked track: the reference's off track is below 3:1 (WCAG 1.4.11)
- native element: the reference renders a button; here a native checkbox with role switch
- checked state: not reflected: the attribute is the default restored by form reset

## Open questions
None open. Answered with the recommendation (no approver available, 2026-11-12); see `openQuestions` in contract.json and [plan.md](./plan.md).

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first. Use `FormAssociated` + `NativeControl`.
