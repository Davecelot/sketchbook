---
component: Switch
status: draft
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-12
source: shadcn/ui Switch (look and sizes), WAI-ARIA APG switch pattern (role and keyboard), contract-first standard (contract and build process)
---

# Switch

> A toggle for an on/off setting, with its label, description and error beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
A single on/off setting, typically one that reads as taking effect at once (a preference, a feature flag). Not for a choice recorded only on submit or an agreement (Checkbox), nor for one of several options (Radio Group).

## 2. Anatomy
`field` (grid) holds `control` (the pill track, with the native `<input type="checkbox" role="switch">` covering it and the aria-hidden `thumb`), `label` (+ `required-indicator`), `description` (optional) and `error` (live region).

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name |
| `description` | text | — | help text under the label |
| `error` | text | — | marks the field invalid; sets `customError` |
| `size` | `default` \| `sm` | default | track and thumb size; reflected |
| `name` | text | — | form field name |
| `value` | text | on | submitted while on |
| `checked` | boolean | false | current state; the attribute is the reset default |
| `required` | boolean | false | must be on to submit |
| `disabled` | boolean | false | native; also disabled by a `<fieldset disabled>` ancestor |

Events: `input` (native, composed) and `change` (re-dispatched composed) on each toggle.

## 4. Variant matrix
`size`: `default`, `sm`. No color variants.

## 5. Roles and color
Track off `input`, on `primary`; thumb off `background`, on `primary-foreground` (same tokens in light and dark); label `foreground`; description `muted-foreground`; error and invalid track border `destructive`; focus ring `ring`. On/off is also shown by the thumb position, not by color alone (WCAG 1.4.1).

## 6. States
off, on (track fills, thumb slides to the end edge; start edge in RTL), focus-visible (3px ring, border in `ring`), invalid, disabled (opacity 0.5, not-allowed cursor; styled with `:host(:disabled)`). No hover change.

## 7. Dimensions and layout
| Size | Track | Thumb |
| --- | --- | --- |
| default | 32x20 (`size.switch.width`/`height`) | 16 (`size.icon.default`) |
| sm | 24x16 (`size.switch.width-sm`/`height-sm`) | 12 (`size.icon.sm`) |

Radius pill, 1px border (transparent unless invalid or focused), shadow-xs. The thumb inset is derived from track height minus thumb size, so no literal is needed. 12px gap to the label; 6px between label and description. Thumb movement uses the fast duration and standard easing.

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5. Same in both sizes.

## 9. Accessibility
- Native `<input type="checkbox" role="switch">` with a native `<label for>` in one shadow root: the browser exposes role switch and its on/off state, Space toggles.
- Enter does not toggle (the APG lists it as optional); it submits the form through `form.requestSubmit()`, because the inner input has no form owner (SB-0009).
- Description and error through `aria-describedby`; `aria-invalid` when invalid; the error is a persistent polite live region.
- Form-associated through `FormAssociated` + `NativeControl` (rule form-associated-controls): submits `value` only while on, `form.reset()` restores the `checked` attribute, `<fieldset disabled>` disables without touching the `disabled` attribute, `required` gives `valueMissing` while off, `error` gives `customError`, `<label for="id">` pointing at the host toggles it.
- Track at 3:1 off and on, and a solid focus ring (deviation from the visual reference, WCAG 1.4.11). The sm track relies on the label row and the 12px gap for WCAG 2.5.8.
- The label names the setting and never changes with the state.

## 10. Usage
### Behavior
`input` and `change` on each toggle, composed; a `change` listener reading `FormData` sees the new value. Value is submitted only while on.
### Composition
One switch per setting. A list of settings stacks switches; grouping in a fieldset with a legend comes with Field set (later).
### Choosing the props
`size="sm"` for dense lists and table rows. `description` when the effect needs explaining. `required` rarely: a setting that must be on is usually an agreement, which is a Checkbox.
### Do / Don't
- Don't use a switch for terms or for a choice applied only on submit; use Checkbox.
- Don't label it "On"/"Off" or change the label with the state; name the setting.

## Realizations
### Figma
Not started.
### Web
Not started. Parts planned: `field`, `control`, `input`, `thumb`, `label`, `required-indicator`, `description`, `error`.
### Coverage
None yet.
### Known drift
- API shape: shadcn composes Label and Field parts around Switch; shadow DOM requires them inside
- unchecked track color: shadcn uses bg-input (neutral-200 in light), below 3:1; changed for WCAG 1.4.11
- focus ring: shadcn uses ring/50, below 3:1 (WCAG 1.4.11)
- dark-mode thumb: shadcn switches the off thumb to foreground in dark mode; one token per state keeps the pair at 3:1 in both modes
- track size: shadcn track is 32x18.4 (sm 24x14); the existing semantic sizes leave a 2px inset around the thumb
- label, description, error: shadcn Switch has no label or validation of its own
- checked state: not reflected: the attribute is the default restored by form reset

## Open questions
All answered with the recommendation (no approver available, 2026-11-12); see `openQuestions` in contract.json and plan.md.
- Q1 Native `<input type="checkbox" role="switch">`: yes.
- Q2 Enter toggles: no, Enter submits; Space toggles.
- Q3 `checked` reflected: no.
- Q4 `label` required: yes; no `hide-label` in this version.
- Q5 Sizes: `default` and `sm`, on existing semantic tokens.
- Q6 Label position: after the switch.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first. Use `FormAssociated` + `NativeControl`.
