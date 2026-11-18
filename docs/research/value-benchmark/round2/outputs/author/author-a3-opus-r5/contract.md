---
component: Switch
status: draft
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-12
source: visual reference (look, sizes and API names), WAI-ARIA APG switch pattern (role and keyboard), contract-first standard (contract and build process)
---

# Switch

> A switch that turns a setting on or off, with its label, description and error laid out beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
An on/off setting, such as enabling notifications. Not for picking items from a list or giving consent (Checkbox), choosing one of several (Radio Group), or a pressed toolbar button (Toggle).

## 2. Anatomy
`field` (grid) holds `control` (the pill-shaped track, with the native `<input type="checkbox" role="switch">` covering it and the aria-hidden `thumb`), `label` (+ `required-indicator`), `description` (optional) and `error` (live region).

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the label |
| `error` | text | — | marks the field invalid (customError) |
| `size` | `default` \| `sm` | default | track 32×20 or 24×16 |
| `name` | text | — | form field name |
| `value` | text | on | submitted while on |
| `checked` | boolean | false | current state; the attribute is the reset default |
| `required` | boolean | false | must be on; aria-hidden asterisk |
| `disabled` | boolean | false | native; a disabled fieldset also disables it |

Events: `input` (native, composed) and `change` (re-dispatched composed from the host), once per toggle.

## 4. Variant matrix
`size`: default, sm. States below.

## 5. Roles and color
Track off `input`, on `primary`; thumb off `background`, on `primary-foreground`; label `foreground`; description `muted-foreground`; error and invalid track border `destructive`; focus ring `ring`.

## 6. States
focus-visible (3px ring around the track), checked (track fills, thumb slides to the end), invalid (destructive border, `aria-invalid`, error text), disabled (opacity 0.5, not-allowed cursor; styled with `:host(:disabled)` so a disabled fieldset dims it too).

## 7. Dimensions and layout
| Size | Track | Thumb | Inset |
| --- | --- | --- | --- |
| default | 32×20 | 16 | 2px |
| sm | 24×16 | 12 | 2px |

Pill radius, 1px border (transparent unless invalid), shadow-xs. Thumb at the inline start when off, inline end when on (mirrors in RTL). 12px gap to the label; 6px between label and description.

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5.

## 9. Accessibility
- APG switch pattern on a native `<input type="checkbox" role="switch">` with a native `<label for>` in one shadow root. The browser exposes on/off from `checked`. Space toggles.
- Enter submits the form (implicit submission) and does not toggle: the inner control has no form owner in its shadow root, so the component calls `form.requestSubmit()` (SB-0009).
- Form-associated through `FormAssociated` + `NativeControl` (rule form-associated-controls): submits `value` only while on, resets to the `checked` attribute, restores saved state, mirrors the inner input's validity (`required` → `valueMissing`), is disabled by `<fieldset disabled>` without touching its own attribute, and `<label for>` on the host toggles it. `change` listeners see the new value in `FormData`.
- Description and error through `aria-describedby`; `aria-invalid` when invalid; the error is a persistent polite live region and sets `customError`, so the form blocks submission.
- The state is shown by the thumb position, not color alone (1.4.1). Track off (`input`) and on (`primary`) are 3:1 against the background, the thumb 3:1 against its track, and the focus ring is solid (deviations from the visual reference, WCAG 1.4.11).
- The track (sm 24×16) relies on the clickable label row and the 12px gap for WCAG 2.5.8.
- No thumb transition under `prefers-reduced-motion: reduce`.

## 10. Usage
### Behavior
The setting changes on toggle; `input` and `change` fire once each, composed. The value is submitted only while on.
### Composition
One per setting. A settings list with the switch at the row end composes it in Item; a group of switches goes in a Field set (later).
### Choosing the props
`size="sm"` for dense lists and tables. `required` only when the setting must be on to continue. `description` when the consequence of turning it on is not obvious.
### Do / Don't
- Do label the setting ("Notifications"), not the state ("On"/"Off").
- Don't use a switch for consent or for selecting items; use Checkbox.
- Don't use a switch for a toolbar button that stays pressed; use Toggle.

## Realizations
### Figma
Not started. Axes Size, State, Selected, Validation and Disabled; Label text, Description text, Error text and the Required and Description switches.
### Web
Not started. Planned in [plan.md](./plan.md); parts `field`, `control`, `input`, `thumb`, `label`, `required-indicator`, `description`, `error`.
### Coverage
None yet; the test plan is in [plan.md](./plan.md).
### Known drift
- API shape: the visual reference composes Field and Label around Switch; shadow DOM requires them inside
- unchecked track: the visual reference's `input` (neutral-200) is below 3:1; `color.input` is neutral-500 (WCAG 1.4.11)
- focus ring: the visual reference uses ring/50, below 3:1 (WCAG 1.4.11)
- dark-mode thumb: the visual reference uses foreground for the unchecked thumb in dark; this uses `background` in every mode (still above 3:1)
- track height: 20px on the grid instead of 18.4px
- checked state: not reflected; the attribute is the default restored by form reset

## Open questions
None open. No approver was available on 2026-11-12; each was answered with its recommendation (contract.json `openQuestions`, SB-0101, SB-0011):
- Q1 Native `<input type="checkbox" role="switch">`, not a button with `aria-checked`.
- Q2 Enter submits the form; only Space toggles.
- Q3 `checked` is not reflected.
- Q4 `label` is required; `hide-label` keeps it as the name.
- Q5 Sizes `default` and `sm` only.
- Q6 Track first, label after; no label-position prop.
- Q7 Invalid: destructive track border, `aria-invalid`, error text.
- Q8 Thumb slides; no transition under reduced motion.
- Q9 No new shared row mixin; reuse `FormAssociated` + `NativeControl`.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first (rule test-first). Use `FormAssociated` + `NativeControl`.
