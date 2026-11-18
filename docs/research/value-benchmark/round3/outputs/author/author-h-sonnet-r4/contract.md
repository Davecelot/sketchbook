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

> A switch for an on/off setting, with its label, description and error laid out beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
A setting that is on or off and takes effect at once (notifications, dark mode, a feature flag). Not for a yes/no choice that is only recorded on submit (Checkbox), choosing among options (Radio Group) or a pressed-state tool button (Toggle).

## 2. Anatomy
`field` (grid) holds `control` (the track: the native `<input type="checkbox" role="switch">` and the `thumb`), `label` (+ `required-indicator`), `description` (optional) and `error` (live region).

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the label |
| `error` | text | — | marks the field invalid |
| `size` | `default` \| `sm` | default | track 32x20 or 24x16 |
| `name` | text | — | form field name |
| `value` | text | on | submitted while on |
| `checked` | boolean | false | on state; the attribute is the reset default |
| `required` | boolean | false | must be on to submit |
| `disabled` | boolean | false | native; also from a disabled fieldset |

## 4. Variant matrix
`size`: `default`, `sm`. No other visual variants.

## 5. Roles and color
Track `input` when off and `primary` when on; thumb `background`; label `foreground`; description `muted-foreground`; error and invalid border `destructive`; focus ring `ring`.

## 6. States
hover, focus-visible (3px ring), checked (track fills, thumb slides to the end; mirrored in RTL), invalid, disabled (opacity 0.5, not-allowed cursor).

## 7. Dimensions and layout
Track 32x20 (default) or 24x16 (sm), fully rounded, thumb 16px (12px in sm) with a 2px inset, shadow-xs. 12px gap to the label; 6px between label and description. The field row is at least 24px high.

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5.

## 9. Accessibility
- Native `<input type="checkbox" role="switch">` with a native `<label for>` in one shadow root. Space toggles; Enter does not toggle but submits the form (implicit submission, SB-0009).
- On/off is conveyed by the native checked state (exposed as `aria-checked`) and by thumb position, never by color alone.
- Description and error through `aria-describedby`; `aria-invalid` when invalid; the error is a persistent polite live region and sets a `customError` validity.
- Track at 3:1 against the page, thumb at 3:1 against both track fills, and a solid focus ring (deviation from the visual reference, WCAG 1.4.11).
- The track is under 24px high, so the whole field row is the target with a 24px minimum height (WCAG 2.5.8).

## 10. Usage
### Behavior
`input` and `change` on each toggle, composed. The value is submitted only while on. Form reset returns to the `checked` attribute; a disabled fieldset disables and un-submits it, and re-enabling restores it. `required` fails validity (`valueMissing`) while off; the browser's message and `reportValidity()` focus the inner input.
### Composition
One per setting. A list of them goes in a Field set (later).
### Choosing the props
`description` for the consequence of turning it on. `required` only for something that must be enabled to continue. `size="sm"` for dense lists.
### Do / Don't
- Do use it when flipping it acts immediately.
- Don't use it for a choice that waits for a Save button; use Checkbox.
- Don't use vague labels.

## Realizations
### Figma
Not drawn yet.
### Web
Not started. Planned: `src/components/switch/Switch.ts`; parts `field`, `control`, `input`, `thumb`, `label`, `required-indicator`, `description`, `error`.
### Coverage
Not started; the plan's test list is in [plan.md](./plan.md).
### Known drift
- API shape: shadcn composes Field parts around Switch; shadow DOM requires them inside
- track color: shadcn default track is input at low contrast; changed for WCAG 1.4.11
- focus ring: shadcn uses ring/50, below 3:1 (WCAG 1.4.11)
- checked state: not reflected: the attribute is the default restored by form reset

## Open questions
None open. Answered (recommendation taken, SB-0101): Q1 native input with `role="switch"`; Q2 `checked` not reflected; Q3 `label` required; Q4 sizes `default` and `sm`; Q5 Enter submits, does not toggle; Q6 row min height 24px for target size; Q7 no read-only or indeterminate.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first. Use `FormAssociated` + `NativeControl`.
