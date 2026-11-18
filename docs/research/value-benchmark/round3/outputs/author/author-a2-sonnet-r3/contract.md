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
A setting that is either on or off, usually taking effect as soon as it changes, and whose value can be submitted with a form. Not for a choice recorded and applied later (Checkbox), choosing one of several (Radio Group) or a pressed-look toolbar button (Toggle).

## 2. Anatomy
`field` (grid) holds `control` (the track: the native `<input type="checkbox" role="switch">` and the `thumb`), `label` (+ `required-indicator`), `description` (optional) and `error` (live region).

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
| `size` | `default` \| `sm` | default | 32x20 or 24x16 track |
| `required`, `disabled` | boolean | false | native; `required` means must be on |

Events: `input` and `change`, composed, once per toggle.

## 4. Variant matrix
Size: `default`, `sm`. Each is drawn off and on.

## 5. Roles and color
Off track `input`; on track `primary`; thumb `background`; label `foreground`; description `muted-foreground`; error and invalid border `destructive`; focus ring `ring`.

## 6. States
hover, focus-visible (3px solid ring), checked (primary track, thumb at the end), invalid, disabled (opacity 0.5, not-allowed cursor, not submitted).

## 7. Dimensions and layout
Track 32x20 (`sm` 24x16), pill radius, 2px inset around the thumb. 12px gap to the label; 6px between label and description. The thumb mirrors in right-to-left.

## 8. Typography
Label 14px, weight 500; description and error 14px, body line-height.

## 9. Accessibility
- Native input with `role="switch"` and a native `<label for>` in one shadow root: name, on/off state and Space come from the platform.
- Space toggles. Enter submits the form (implicit submission; the inner control has no form owner in its shadow root, SB-0009). The APG makes Enter-to-toggle optional; it is not done.
- Description and error through `aria-describedby`; `aria-invalid` when invalid; the error is a persistent polite live region and also sets a custom validity so the form blocks submission.
- State is not conveyed by color alone: the thumb moves.
- Off track at 3:1 and a solid focus ring (deviations, WCAG 1.4.11). The `sm` track is under 24px; the label row and gap satisfy WCAG 2.5.8.
- Form: submits `name=value` only while on; reset restores the `checked` attribute; a disabled ancestor fieldset disables it; `required` is invalid while off.

## 10. Usage
### Behavior
Toggles on click of the track or label and on Space. Takes effect at once unless the host form says otherwise.
### Composition
One per setting. Groups of settings belong in a Field set (later).
### Choosing the props
Keep the label stable and name the setting ("Airplane mode"), not the action. Use `description` for what on means. `required` only for must-accept settings.
### Do / Don't
- Do use it for immediate settings.
- Don't use it for a choice that waits for Save; use Checkbox.
- Don't flip the label with the state.

## Realizations
### Figma
Not started. Planned axes: State, Selected, Size, Validation, Disabled; Label, Description and Error text; Required and Description switches.
### Web
Not started. Parts `field`, `control`, `input`, `thumb`, `label`, `required-indicator`, `description`, `error`.
### Coverage
None yet (planned in [plan.md](./plan.md)).
### Known drift
- API shape: shadcn composes Field parts around Switch; shadow DOM requires them inside
- off track color: shadcn default off track is neutral-200; changed for WCAG 1.4.11
- focus ring: shadcn uses ring/50, below 3:1 (WCAG 1.4.11)
- checked state: not reflected: the attribute is the default restored by form reset

## Open questions
All answered with the recommendation (SB-0101):
- Q1 Native input with `role="switch"`.
- Q2 `checked` is not reflected.
- Q3 `label` is required.
- Q4 Enter submits; it does not toggle.
- Q5 Sizes `default` and `sm`.
- Q6 `required` means must be on.
- Q7 No icons or text in the track.
- Q8 Off track uses `color.input` (3:1).

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first. Use `FormAssociated` + `NativeControl`.
