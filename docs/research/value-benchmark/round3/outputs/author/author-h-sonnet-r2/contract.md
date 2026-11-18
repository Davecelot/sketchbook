---
component: Switch
status: draft
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-12
source: shadcn/ui Switch (look and sizes), WAI-ARIA APG switch pattern, Checkbox contract (form association), contract-first standard
---

# Switch

> A switch for an on/off setting, with its label, description and error laid out beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
A single setting that is either on or off and reads as taking effect at once (notifications, dark mode). Not for a yes/no recorded on submit (Checkbox), a button that stays pressed (Toggle) or choosing one of several (Radio Group).

## 2. Anatomy
`field` (grid) holds `control` (the track: the native `<input type="checkbox" role="switch">` with the `thumb` over it), `label` (+ `required-indicator`), `description` (optional) and `error` (live region).

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the label |
| `error` | text | — | marks the field invalid |
| `size` | `default` \| `sm` | default | 32x20px or 24x16px track |
| `name` | text | — | form field name |
| `value` | text | on | submitted while on |
| `checked` | boolean | false | current state; the attribute is the reset default |
| `required`, `disabled` | boolean | false | native |

## 4. Variant matrix
One dimension: `size` (`default`, `sm`). No excluded combinations.

## 5. Roles and color
Track `input` when off, `primary` when on; thumb `background` when off, `primary-foreground` when on; label `foreground`; description `muted-foreground`; error and invalid outline `destructive`; focus ring `ring`.

## 6. States
focus-visible (3px ring), checked (primary track, thumb at the end), invalid, disabled (opacity 0.5, not-allowed cursor; also when a `<fieldset disabled>` ancestor applies).

## 7. Dimensions and layout
Default track 32x20px, `sm` 24x16px, pill radius, shadow-xs. The thumb is the track height minus twice the 2px inset (16px, 12px) and travels the track width minus the track height; it follows the inline direction in RTL. 12px gap to the label; 6px between label and description.

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5.

## 9. Accessibility
- Native `<input type="checkbox" role="switch">` with a native `<label for>` in one shadow root. Space toggles; on/off is exposed through the native checked state.
- Enter submits the form (implicit submission): the inner control has no form owner in its shadow root, so the component calls `form.requestSubmit()` (SB-0009).
- Description and error through `aria-describedby`; `aria-invalid` when invalid; the error is a persistent polite live region and sets a `customError` validity so the form blocks submission.
- State is not carried by color alone: the thumb position changes. Track at 3:1 against the background and a solid focus ring (WCAG 1.4.11). The track is under 24px tall, so it relies on the label row and the 12px gap for WCAG 2.5.8.
- Form association: `FormAssociated` + `NativeControl`. Submits `value` only while on; `form.reset()` restores the `checked` attribute; `<fieldset disabled>` disables without touching the `disabled` attribute; `required` means must be on.

## 10. Usage
### Behavior
`input` and `change` on each toggle, composed. Value is submitted only while on.
### Composition
One per setting; a list of them goes in a Field set (later).
### Choosing the props
`size="sm"` for dense settings lists. `required` only when the form cannot proceed with the setting off, with a label that says what is being turned on.
### Do / Don't
- Don't use a switch for a choice that waits for a submit button; use Checkbox.
- Don't use vague labels.

## Realizations
### Figma
Not started. Axes will be Size, Selected, Validation and Disabled plus State (Rest, Focus); layers follow the anatomy and the `switch.*` layer names registered in `spec/api.json`.
### Web
Not started. `src/components/switch/Switch.ts`; parts `field`, `control`, `input`, `thumb`, `label`, `required-indicator`, `description`, `error`.
### Coverage
None yet (tests come first, see plan.md).
### Known drift
- API shape: shadcn composes Field parts around Switch; shadow DOM requires them inside
- track color: shadcn default unchecked track is input (neutral-200); changed for WCAG 1.4.11
- focus ring: shadcn uses ring/50, below 3:1 (WCAG 1.4.11)
- checked state: not reflected: the attribute is the default restored by form reset

## Open questions
None open. No approver was available (2026-11-12), so each took its recommendation; all are recorded as answered in contract.json (Q1 native input with role=switch, Q2 checked not reflected, Q3 label required, Q4 sizes `default` and `sm`, Q5 `error` prop, Q6 required means on, Q7 two thumb tokens).

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first. Use `FormAssociated` + `NativeControl`.
