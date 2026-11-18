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

> An on/off switch with its label, description and error laid out beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
A single setting that is on or off and takes effect as it is set. Not for a yes/no choice recorded on submit (Checkbox) or choosing one of several (Radio Group).

## 2. Anatomy
`field` (grid) holds `control` (the track with the native `<input type="checkbox" role="switch">` and the `thumb`), `label` (+ `required-indicator`), `description` (optional) and `error` (live region).

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name |
| `description` | text | — | help text under the label |
| `error` | text | — | marks the field invalid |
| `name` | text | — | form field name |
| `value` | text | on | submitted while on |
| `checked` | boolean | false | on state; the attribute is the reset default |
| `size` | `default` \| `sm` | default | track 32x20px or 24x16px |
| `required` | boolean | false | must be on |
| `disabled` | boolean | false | native; also set by a disabled fieldset |

Events: `input` and `change`, both composed, once per toggle.

## 4. Variant matrix
`size`: default, sm. No other visual variants.

## 5. Roles and color
Off track `input`; on track `primary`, on thumb `primary-foreground`, off thumb `background`; label `foreground`; description `muted-foreground`; error and invalid border `destructive`; focus ring `ring`.

## 6. States
focus-visible (3px ring, border in `ring`), checked (filled track, thumb at the end), invalid, disabled (opacity 0.5, not-allowed cursor). Hover has no token.

## 7. Dimensions and layout
Track 32x20px (default) or 24x16px (sm), fully rounded; thumb 16px or 12px, centered vertically with equal inset at both ends. 12px gap to the label; 6px between label and description. The thumb travel mirrors under `dir="rtl"`.

## 8. Typography
Label 14px, weight 500; description and error 14px, line-height 1.5.

## 9. Accessibility
- Native `<input type="checkbox" role="switch">` with a native `<label for>` in one shadow root. Space toggles; the on/off state is exposed natively.
- Enter submits the form (implicit submission, SB-0009) and does not toggle.
- Description and error through `aria-describedby`; `aria-invalid` when invalid; the error is a persistent polite live region and also sets a `customError` validity.
- The off track is at 3:1 against the background and the focus ring is solid (deviation from the visual reference, WCAG 1.4.11). State is shown by thumb position as well as color (1.4.1).
- The track is under 24px high; the label row and the 12px gap satisfy WCAG 2.5.8.

## 10. Usage
### Behavior
Form-associated through `FormAssociated` + `NativeControl`: the value is submitted only while on; `form.reset()` restores the `checked` attribute; a `<fieldset disabled>` ancestor disables it without touching the `disabled` attribute and re-enabling restores it; `required` makes an off switch `valueMissing`; `<label for>` activates it.
### Composition
One per setting; groups of settings go in a Field set (later).
### Choosing the props
`description` for the consequence of the setting. `size="sm"` for dense rows. `required` only when the setting must be on to continue.
### Do / Don't
- Don't use a switch for a choice that applies on submit; use Checkbox.
- Don't change the label with the state.

## Realizations
### Figma
Not started. Planned axes: Size, State, Selected, Validation, Disabled; Label text, Description text, Error text and the Required and Description properties.
### Web
Not started. Parts `field`, `control`, `input`, `thumb`, `label`, `required-indicator`, `description`, `error`.
### Coverage
None yet; the test plan is in [plan.md](./plan.md).
### Known drift
- API shape: shadcn composes Field parts around Switch; shadow DOM requires them inside
- track color: shadcn default off-track is neutral-200; changed for WCAG 1.4.11
- focus ring: shadcn uses ring/50, below 3:1 (WCAG 1.4.11)
- checked state: not reflected: the attribute is the default restored by form reset
- size: shadcn default is 32x18.4px, sm 24x14px; the semantic size.switch tokens are used

## Open questions
All answered on 2026-11-12 with the recommended option (nobody was available to approve):
- Q1 native checkbox with `role="switch"`, not a custom element.
- Q2 Enter submits the form; it does not toggle.
- Q3 `checked` is not reflected.
- Q4 `label` required; no `hide-label` for now.
- Q5 sizes `default` and `sm`.
- Q6 `required` means the switch must be on.
- Q7 prop names `checked` and `error` (registered aliases of `selected` and `errorMessage`).

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first (rule test-first). Use `FormAssociated` + `NativeControl`.
