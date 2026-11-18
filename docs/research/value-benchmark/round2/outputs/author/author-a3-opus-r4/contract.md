---
component: Switch
status: draft
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-12
source: shadcn/ui Switch (UI and API), WAI-ARIA APG switch pattern (keyboard and ARIA), contract-first standard (contract and build process)
---

# Switch

> A switch for an on/off setting, with its label, description and error laid out beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Turns one setting on or off. Not for agreement or picking several options (Checkbox), choosing one of several (Radio Group), or a pressed formatting button (Toggle).

## 2. Anatomy
`field` (grid) holds `control` (the pill track with the native `<input type="checkbox" role="switch">` stretched transparently over it, and the decorative `thumb`), `label` (+ `required-indicator`), `description` (optional) and `error` (live region).

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

Events: `input` (native, composed) and `change` (re-dispatched composed from the host), once per toggle.

## 4. Variant matrix
`size`: `default`, `sm`. No color variants. States below.

## 5. Roles and color
Track off `input`, on `primary`; thumb off `background`, on `primary-foreground`; label `foreground`; description `muted-foreground`; error and invalid track border `destructive`; focus ring `ring`.

## 6. States
focus-visible (3px solid ring around the track), checked (track fills, thumb slides to the end edge, mirrored in RTL), invalid (destructive border on the track, error shown), disabled (opacity 0.5, not-allowed cursor; also from a disabled fieldset). Hover has no visual change.

## 7. Dimensions and layout
| Size | Track | Thumb |
| --- | --- | --- |
| default | 32 x 20px | 16px |
| sm | 24 x 16px | 12px |

Pill radius, 1px border (transparent unless invalid), shadow-xs. Thumb is vertically centered and inset by half the height difference. 12px gap to the label; 6px between label and description. The switch aligns with the label's first line.

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5. Same for both sizes.

## 9. Accessibility
- Native `<input type="checkbox" role="switch">` with a native `<label for>` in one shadow root, so the switch is announced as on/off. Space toggles (native).
- Enter submits the form (implicit submission): the inner control has no form owner in its shadow root, so the component calls `form.requestSubmit()` (SB-0009). Enter does not toggle; the APG lists it as optional.
- Form-associated (`FormAssociated` + `NativeControl`): submits `value` only while on; `form.reset()` restores the `checked` attribute; a `<fieldset disabled>` disables it without touching the `disabled` attribute; `required` sets `valueMissing` while off; `<label for>` on the host toggles it.
- Description and error through `aria-describedby`; `aria-invalid` when invalid; the error is a persistent polite live region.
- Unchecked track at 3:1 against the page and the thumb at 3:1 against the track; solid focus ring (deviations from the visual reference, WCAG 1.4.11). State is shown by thumb position as well as color (1.4.1).
- Transitions are removed under `prefers-reduced-motion: reduce`.
- The sm track is 16px high; the label row and the 12px gap meet the WCAG 2.5.8 spacing exception.

## 10. Usage
### Behavior
Toggles on click (track or label), Space, or a `<label for>` pointing at the host. `input` and `change` on each toggle. Value is submitted only while on.
### Composition
One per setting. A list of settings goes in a Field set (later).
### Choosing the props
`size="sm"` for dense settings lists. `description` when the effect needs explaining. `required` only when the setting must be on to submit.
### Do / Don't
- Do keep the label constant and name the setting; the state is announced by the role.
- Don't use a switch for agreement or consent; use Checkbox.
- Don't use a switch for a pressed formatting state; use Toggle.

## Realizations
### Figma
Not started.
### Web
Not started. Planned: `src/components/switch/Switch.ts`; parts `field`, `control`, `input`, `thumb`, `label`, `required-indicator`, `description`, `error`.
### Coverage
None yet.
### Known drift
- API shape: shadcn composes Field parts around Switch; shadow DOM requires them inside
- unchecked track color: shadcn's bg-input is neutral-200; changed for WCAG 1.4.11
- focus ring: shadcn uses ring/50, below 3:1 (WCAG 1.4.11)
- track height: shadcn uses 1.15rem (18.4px); rounded to the size scale
- checked state: not reflected: the attribute is the default restored by form reset

## Open questions
All answered with the recommendation (no approver available, 2026-11-12); see contract.json `openQuestions` Q0–Q6 and [plan.md](./plan.md).

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first (rule test-first). Use `FormAssociated` + `NativeControl`.
