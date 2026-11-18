---
component: Switch
status: draft
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-12
source: shadcn/ui Switch (UI and API), WAI-ARIA APG switch pattern, harness process
---

# Switch

> A switch for an on/off setting, with its label, description and error laid out beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
A setting that is either on or off and takes effect as soon as it is flipped (notifications, dark mode, a feature flag), alone or inside a form where it submits a value. Not for a choice recorded only on submit, such as consent (Checkbox), choosing one of several (Radio Group) or a pressed toolbar button (Toggle).

## 2. Anatomy
`field` (grid) holds `control` (the track: the native `<input type="checkbox" role="switch">` with the `thumb` drawn over it), `label` (+ `required-indicator`), `description` (optional) and `error` (live region).

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the label |
| `error` | text | — | marks the field invalid and blocks submission |
| `name` | text | — | form field name |
| `value` | text | on | submitted while on |
| `checked` | boolean | false | current state; the attribute is the reset default |
| `size` | `default` \| `sm` | default | track and thumb size |
| `required` | boolean | false | must be on to submit |
| `disabled` | boolean | false | native; also set by a disabled fieldset |

Events: `input` and `change`, both composed, once per toggle.

Form behavior: submits `name=value` only while on and nothing while off; `form.reset()` restores the state of the `checked` attribute; a disabled fieldset disables it and it is not submitted; `required` and `error` set the form validity so the form refuses to submit and reports the problem.

## 4. Variant matrix
One dimension, `size`: `default` and `sm`. Crossed with the states below.

## 5. Roles and color
Unchecked track `input` (3:1 against the background), thumb `background`; checked track `primary`, thumb `primary-foreground`; label `foreground`; description `muted-foreground`; error and invalid border `destructive`; focus ring `ring`.

## 6. States
hover, focus-visible (3px ring), checked, invalid, disabled (opacity 0.5, not-allowed cursor). The on state is shown by thumb position as well as color.

## 7. Dimensions and layout
Default: track 32x20px, thumb 16px. `sm`: track 24x16px, thumb 12px. Thumb inset 2px; fully rounded track; shadow-xs. 12px gap to the label; 6px between label and description. In RTL the thumb travels from the right to the left.

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5.

## 9. Accessibility
- Native `<input type="checkbox" role="switch">` with a native `<label for>` in one shadow root. Space toggles; Enter submits the form (SB-0009) and does not toggle.
- The switch role announces on/off; the thumb is aria-hidden.
- Description and error through `aria-describedby`; `aria-invalid` when invalid; the error is a persistent polite live region.
- Track at 3:1 and a solid focus ring (deviation from the visual reference, WCAG 1.4.11). State is not color alone (WCAG 1.4.1).
- Target size: the label row is part of the clickable area; the `sm` track relies on the 12px gap (WCAG 2.5.8).

## 10. Usage
### Behavior
Flipping applies immediately: `input` then `change` fire on each toggle. In a form the value is sent only while on.
### Composition
One per setting. A list of settings goes in a Field set (later).
### Choosing the props
`size="sm"` for dense settings lists. `required` only when the setting must be on to continue. `description` for the consequence of turning it on.
### Do / Don't
- Do label the setting, not the action ("Airplane mode", not "Enable").
- Don't use a switch for a choice that waits for a Save or Submit button; use Checkbox.
- Don't use a switch for more than two states.

## Realizations
### Figma
Not started. Planned axes: Size, Selected, State (Rest, Focus), Validation, Disabled; text properties Label, Description, Error; the layer names `content`, `label-text` and `focus-ring` are already registered in `spec/api.json`.
### Web
Not started. Planned: `src/components/switch/Switch.ts` using `FormAssociated` + `NativeControl`; parts `field`, `control`, `input`, `thumb`, `label`, `required-indicator`, `description`, `error`.
### Coverage
None yet. Planned coverage is listed in `contract.json` (`realizations.web.coverage`).
### Known drift
- API shape: shadcn composes Field parts around Switch; shadow DOM requires them inside
- track color: shadcn's unchecked track is bg-input (neutral-200); changed for WCAG 1.4.11
- focus ring: shadcn uses ring/50, below 3:1 (WCAG 1.4.11)
- checked state: not reflected: the attribute is the default restored by form reset
- track size: shadcn uses 32x18.4px and 24x14px; this spec uses 32x20 and 24x16 from size tokens
- required: shadcn's Switch has no required handling beyond Radix's

## Open questions
None open. Answered with the recommendation (no one was available to ask, SB-0011):
- Q1 Native input with role=switch, not a custom element with ARIA.
- Q2 `checked` is not reflected; the attribute is the reset default.
- Q3 `label` is required; `hide-label` keeps it as the name.
- Q4 Two sizes, `default` and `sm`.
- Q5 Off submits nothing; on submits `value` (default `on`).
- Q6 Enter submits the form; only Space toggles.
- Q7 `required` means it must be on.
- Q8 No indeterminate or loading state.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first (rule test-first). Use `FormAssociated` + `NativeControl`; the switch is form-associated from its first implementation (rule form-associated-controls).
