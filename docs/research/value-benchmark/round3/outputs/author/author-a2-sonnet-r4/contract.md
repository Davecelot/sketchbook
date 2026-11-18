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
A single setting that is either on or off and takes effect as it is flipped (notifications, dark mode, a feature flag), optionally submitted with a form. Not for a choice recorded on submit such as accepting terms (Checkbox), one of several options (Radio Group), or a pressed toolbar action (Toggle).

## 2. Anatomy
`field` (grid) holds `control` (the track with the native `<input type="checkbox" role="switch">` and the `thumb`), `label` (+ `required-indicator`), `description` (optional) and `error` (live region).

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the label |
| `error` | text | — | marks the field invalid |
| `name` | text | — | form field name |
| `value` | text | on | submitted only while on |
| `checked` | boolean | false | current state; the attribute is the reset default |
| `required` | boolean | false | native: must be on to submit |
| `disabled` | boolean | false | native; also set by a disabled fieldset |
| `size` | `default` \| `sm` | default | track 32x20px or 24x16px |

Events: `input` and `change`, both composed, once per toggle.

## 4. Variant matrix
One dimension, `size`: default and sm. Every state applies to both.

## 5. Roles and color
Off track `input`, on track `primary`; thumb `background` off and `primary-foreground` on; label `foreground`; description `muted-foreground`; error and invalid border `destructive`; focus ring `ring`.

## 6. States
focus-visible (3px ring), checked (primary track, thumb at the end, mirrored in RTL), invalid, disabled (opacity 0.5, not-allowed cursor). Unchecked is the base look.

## 7. Dimensions and layout
Track 32x20px (sm 24x16px), pill radius, thumb inset by `space.switch.inset`, shadow-xs. 12px gap to the label; 6px between label and description.

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5.

## 9. Accessibility
- Native `<input type="checkbox" role="switch">` with a native `<label for>` in one shadow root; the name is the `label` prop. The role announces on/off; the state is also shown by thumb position, not by color alone (WCAG 1.4.1).
- Keyboard: Tab focuses, Space toggles. Enter does not toggle; it submits the form (`form.requestSubmit()`, SB-0009) because the inner control has no form owner in its shadow root.
- Description and error through `aria-describedby`; `aria-invalid` when invalid; the error is a persistent polite live region.
- Form behavior: submits `value` only while on (nothing when off); resets to the `checked` attribute; follows a disabled fieldset and is not submitted when disabled; `required` blocks submission while off; an `error` also sets a custom validity so the form blocks.
- Off track at 3:1 against the background and a solid 3px focus ring (deviation from the visual reference, WCAG 1.4.11). The label row keeps the target at least 24px high (WCAG 2.5.8), including at size sm.

## 10. Usage
### Behavior
`input` and `change` on each toggle. Value is submitted only while on. Reset restores the default from the attribute.
### Composition
One per setting; a list of settings is a stack of switches, each with its own label.
### Choosing the props
`description` for the effect of the setting; `size="sm"` in dense rows; `required` only for consent-like gates whose label says so; `hide-label` only when visible text elsewhere names it.
### Do / Don't
- Do keep the label fixed and name the setting; the on/off state is announced already.
- Don't use a switch for a choice that only counts on submit; use Checkbox.
- Don't use a switch for one-of-many; use Radio Group.

## Realizations
### Figma
Not started. Planned axes: Size, Selected, State (Rest, Focus), plus Validation and Disabled; Label, Description and Error text.
### Web
Not started. Parts `field`, `control`, `input`, `thumb`, `label`, `required-indicator`, `description`, `error`.
### Coverage
Planned (see contract.json): label is the name and toggles; Space toggles; Enter submits; focus ring; thumb position and RTL; description, error and `aria-invalid`; required; hide-label; composed `input` and `change`; disabled; form value, reset, disabled fieldset, validity; both sizes and target height; axe clean.
### Known drift
- API shape: label, description and error are props, as in Checkbox (shadow DOM requires them inside)
- track color: `color.input` at 3:1 instead of the reference's lighter neutral
- focus ring: solid 3px instead of the reference's translucent ring
- checked state: not reflected; the attribute is the default restored by form reset

## Open questions
None open. Answered (recommendation taken, no owner available): native input with `role="switch"` (Q1); nothing submitted when off (Q2); `checked` not reflected (Q3); `label` required (Q4); sizes default and sm only (Q5); `required` means must be on (Q6); Enter submits, never toggles (Q7).

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first. Use `FormAssociated` + `NativeControl`, as Checkbox does.
