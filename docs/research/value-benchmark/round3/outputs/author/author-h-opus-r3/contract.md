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

> An on/off switch for a setting, with its label, description and error laid out beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Turns one setting on or off. Not for recording an agreement or picking several options (Checkbox), or choosing exactly one (Radio Group).

## 2. Anatomy
`field` (grid) holds `control` (the track: the native `<input type="checkbox" role="switch">` drawn as a pill, with the `thumb` over it), `label` (+ `required-indicator`), `description` (optional) and `error` (live region).

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name; never changes with the state |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the label |
| `error` | text | — | marks the field invalid (customError) |
| `name` | text | — | form field name |
| `value` | text | on | submitted while on |
| `checked` | boolean | false | current state; the attribute is the reset default |
| `size` | `default` \| `sm` | default | track and thumb size, reflected |
| `required`, `disabled` | boolean | false | native |

## 4. Variant matrix
`size`: `default`, `sm`. States below.

## 5. Roles and color
Track off: fill and border `input`; on: fill and border `primary`. Thumb `background` in both states and modes. Label `foreground`; description `muted-foreground`; error and invalid border `destructive`; focus ring `ring`.

## 6. States
focus-visible (3px ring), checked (primary track, thumb at the end), invalid, disabled (opacity 0.5, not-allowed cursor; also under `<fieldset disabled>`, styled with `:host(:disabled)`).

## 7. Dimensions and layout
| Size | Track | Thumb |
| --- | --- | --- |
| default | 32 x 20px | 16px |
| sm | 24 x 16px | 12px |

Pill radius, 1px border, shadow-xs, 2px inset between thumb and track. 12px gap to the label; 6px between label and description. The thumb mirrors under `rtl`.

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5. Same at both sizes.

## 9. Accessibility
- Native `<input type="checkbox" role="switch">` with a native `<label for>` in one shadow root. The on/off state comes from the native checked state; `aria-checked` is never set by hand.
- Space toggles. Enter submits the form (implicit submission): the inner control has no form owner in its shadow root, so the component calls `form.requestSubmit()` (SB-0009). Enter does not toggle.
- Description and error through `aria-describedby`; `aria-invalid` when invalid; the error is a persistent polite live region.
- State is shown by the thumb position, not by color alone (WCAG 1.4.1). Track and thumb at 3:1 in both states and modes; solid focus ring (deviation from the visual reference, WCAG 1.4.11).
- The tracks are under 24px high; they rely on the label row and the 12px gap for WCAG 2.5.8.
- The thumb slide is removed under `prefers-reduced-motion: reduce`.
- Form association: `FormAssociated` + `NativeControl` mixins. Submits `value` only while on; `form.reset()` restores the `checked` attribute; `<fieldset disabled>` disables without touching the `disabled` attribute; `required` gives `valueMissing` while off; `<label for>` on the host toggles it.

## 10. Usage
### Behavior
`input` and `change` on each toggle, composed; a `change` listener reading `FormData` sees the new value. Value is submitted only while on.
### Composition
One per setting; a list of settings goes in a Field group.
### Choosing the props
`size="sm"` for dense settings lists. `description` for a consequence worth stating. `required` only when the setting must be on to continue.
### Do / Don't
- Don't change the label to "On"/"Off"; name the setting.
- Don't use a switch for an agreement; use Checkbox.
- Don't use vague labels.

## Realizations
### Figma
Not started. Axes Size, State (Rest, Focus), Selected, Validation and Disabled; Label text, Description text, Error text and the Required and Description switches.
### Web
Not started. `src/components/switch/Switch.ts`; parts `field`, `control`, `input`, `thumb`, `label`, `required-indicator`, `description`, `error`.
### Known drift
- API shape: shadcn composes Field and Label parts around Switch; shadow DOM requires them inside
- thumb color: one token (`background`) instead of shadcn's per-mode dark colors
- track height: 20px instead of shadcn's 1.15rem
- focus ring: shadcn uses ring/50, below 3:1 (WCAG 1.4.11)
- checked state: not reflected: the attribute is the default restored by form reset

## Open questions
None open. Q0 to Q8 answered with the recommendation (SB-0011); see contract.json and [plan.md](./plan.md).

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first. Use `FormAssociated` + `NativeControl`.
