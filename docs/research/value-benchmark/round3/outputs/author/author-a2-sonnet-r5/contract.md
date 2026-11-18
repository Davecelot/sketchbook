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

> A switch for an immediate on/off setting, with its label, description and error laid out beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
A setting that is either on or off and applies at once (notifications, dark mode, a feature flag). Not for a choice recorded on submit or one of several picks (Checkbox), nor for exactly one of many (Radio Group), nor a pressed button (Toggle).

## 2. Anatomy
`field` (grid) holds `control` (the track with the native `<input type="checkbox" role="switch">` and the `thumb`), `label` (+ `required-indicator`), `description` (optional) and `error` (live region).

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the label |
| `error` | text | — | marks the field invalid and blocks submit |
| `size` | `default` \| `sm` | default | track 32x20 or 24x16 px |
| `name` | text | — | form field name |
| `value` | text | on | submitted while on |
| `checked` | boolean | false | on state; the attribute is the reset default |
| `required`, `disabled` | boolean | false | native |

Events: `input` and `change`, composed, once per toggle.

## 4. Variant matrix
`size` (default, sm). No visual variants. States below.

## 5. Roles and color
Off track `input`; on track `primary`; thumb `background`; label `foreground`; description `muted-foreground`; error and invalid border `destructive`; focus ring `ring`.

## 6. States
off, on (checked), focus-visible (3px ring), invalid, disabled (opacity 0.5, not-allowed cursor), hover (no visual change beyond the cursor). The thumb moves from start to end; in rtl it mirrors.

## 7. Dimensions and layout
Default: track 32x20, thumb 16. Small: track 24x16, thumb 12. Pill radius, shadow-xs. 12px gap to the label; 6px between label and description. Thumb travel is the track width minus the thumb and its padding.

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5.

## 9. Accessibility
- Native `<input type="checkbox" role="switch">` with a native `<label for>` in one shadow root: Tab focuses, Space toggles, the on/off state is announced by the role. Enter does not toggle; it submits the form (implicit submission) because the inner control has no form owner in its shadow root, so the component calls `form.requestSubmit()` (SB-0009).
- Description and error through `aria-describedby`; `aria-invalid` when invalid; the error is a persistent polite live region.
- State is not shown by color alone: the thumb position also changes (WCAG 1.4.1). Off track at 3:1 against the background and a solid focus ring (deviation, WCAG 1.4.11). The label row and the 12px gap meet WCAG 2.5.8.
- The label stays fixed; do not flip it with the state.

## 10. Usage
### Behavior
`input` and `change` on each toggle. The value is submitted only while on (nothing when off). Form reset restores the `checked` attribute default. A disabled ancestor fieldset disables it and drops it from submission. `required` means it must be on to submit and shows invalid after blur or a submit attempt; `error` also blocks submission.
### Composition
One per setting; groups of settings go in a Field set (later).
### Choosing the props
`sm` for dense settings lists. `description` for the consequence. `required` only when the setting must be on.
### Do / Don't
- Do name the setting, not the action: "Email notifications".
- Don't use a switch for an agreement or a multi-pick; use Checkbox.
- Don't use a switch for exactly one of several options; use Radio Group.

## Realizations
### Figma
Not started. Planned axes: State, Selected, Size, Validation, Disabled; Label, Description and Error text; Required and Description switches.
### Web
Not started. Planned: `src/components/switch/Switch.ts`; parts `field`, `control`, `input`, `thumb`, `label`, `required-indicator`, `description`, `error`.
### Coverage
None yet. To cover: label is the name; label click and Space toggle, Enter submits and does not toggle; `role=switch` checked state; focus ring; both sizes; description and error in the accessible description; required and invalid after blur; hide-label; input and change composed once per toggle; disabled and disabled fieldset; form value only while on, custom value, reset, validity, error blocks submit; rtl thumb; axe clean.
### Known drift
- API shape: shadcn composes Field parts around Switch; shadow DOM requires them inside
- unchecked track color and focus ring: changed for WCAG 1.4.11
- checked state: not reflected (default restored by reset)
- sizes: rounded to the size scale (32x20, 24x16)

## Open questions
All answered with the recommendation (see contract.json): native checkbox with `role=switch` (Q1); label required (Q2); `checked` not reflected (Q3); sizes default and sm (Q4); nothing submitted when off (Q5); Enter submits, Space toggles (Q6); no indeterminate and no label-position prop (Q7).

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first (rule test-first). Use `FormAssociated` + `NativeControl`, as Checkbox does.
