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

> An on/off switch with its label, description and error laid out beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
A binary setting that is on or off, applied at once or saved with a form. Not for picking several options or giving consent (Checkbox), choosing one of many (Radio Group) or a pressed-state toolbar button (Toggle).

## 2. Anatomy
`field` (grid) holds `control` (the track, with the native `<input type="checkbox" role="switch">` and the `thumb`), `label` (+ `required-indicator`), `description` (optional) and `error` (live region).

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the label |
| `error` | text | — | marks the field invalid; blocks submit |
| `size` | `default` \| `sm` | default | 32x20 or 24x16 track |
| `name` | text | — | form field name |
| `value` | text | on | submitted while on |
| `checked` | boolean | false | current state; the attribute is the reset default |
| `required`, `disabled` | boolean | false | native |

Events: `input` (native, composed) and `change` (re-dispatched, composed) on each toggle.

## 4. Variant matrix
`size`: default, sm. States are listed below; they are not variants.

## 5. Roles and color
Track off `input`; on `primary`; thumb `background` (off) and `primary-foreground` (on); label `foreground`; description `muted-foreground`; error and invalid border `destructive`; focus ring `ring`.

## 6. States
focus-visible (3px solid ring), checked (fill plus thumb position, never color alone), invalid, disabled (opacity 0.5, not-allowed cursor, not submitted). Hover changes nothing that carries meaning.

## 7. Dimensions and layout
Track 32x20 (default) or 24x16 (sm), fully rounded, thumb inset 2px. 12px gap to the label; 6px between label and description. The thumb moves toward the inline end and mirrors under rtl. Motion uses the fast duration and standard easing and is removed under `prefers-reduced-motion`.

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5.

## 9. Accessibility
- Native `<input type="checkbox" role="switch">` with a native `<label for>` in one shadow root; `aria-checked` follows the native state. The label names the setting, never the state.
- Keyboard: Tab focuses; Space toggles. Enter does not toggle; it submits the form (implicit submission), because the inner control has no form owner in its shadow root (SB-0009).
- Description and error through `aria-describedby`; `aria-invalid` when invalid; the error is a persistent polite live region.
- Forms: submits `value` only while on (nothing when off); form reset restores the `checked` attribute default; a disabled fieldset disables it (and re-enabling restores it) without overwriting the `disabled` attribute; `required` fails validity while off (`valueMissing`) with an aria-hidden asterisk; `error` sets a custom validity so the form blocks submission; state restore on navigation.
- Contrast: track and thumb at 3:1 (WCAG 1.4.11) and a solid focus ring. The sm track is under 24px and relies on the WCAG 2.5.8 spacing exception.

## 10. Usage
### Behavior
`input` and `change` fire once per toggle, composed. Only the user toggles it; setting `checked` from code fires no events.
### Composition
One per setting. A list of settings goes in a Field set (later).
### Choosing the props
`size="sm"` for dense lists. `required` only when the setting must be on to continue. `hide-label` only when other visible text names it.
### Do / Don't
- Do label the setting ("Notifications"), not the state ("On").
- Don't use a switch to pick among options or accept terms; use Checkbox.
- Don't add a loading or indeterminate state; a switch is binary.

## Realizations
### Figma
Not started.
### Web
Not started. Planned parts: `field`, `control`, `input`, `thumb`, `label`, `required-indicator`, `description`, `error`.
### Coverage
None yet (planned in contract.json).
### Known drift
- API shape: label, description and error are props; shadow DOM requires them inside.
- track color: neutral-500 instead of the reference's neutral-200, for WCAG 1.4.11.
- focus ring: 3px solid ring color instead of a translucent ring, for WCAG 1.4.11.
- checked state: not reflected; the attribute is the default restored by form reset.

## Open questions
All answered with the recommendation (no approver available); see contract.json Q0 to Q8 and SB-0101.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first. Use `FormAssociated` + `NativeControl`.
