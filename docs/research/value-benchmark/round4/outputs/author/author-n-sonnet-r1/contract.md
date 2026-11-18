---
component: Switch
status: draft
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-12
source: shadcn/ui Switch (look, sizes), WAI-ARIA APG switch pattern, contract-first standard (contract and build process)
---

# Switch

> A toggle for an on/off setting, with its label, description and error laid out beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
A setting that is on or off ("Airplane mode", "Email notifications"). Not for one of several options (Checkbox, Radio Group) or a button that keeps a pressed look (Toggle).

## 2. Anatomy
`field` (grid) holds `control` (the track with the native `<input type="checkbox" role="switch">` and the `thumb`), `label` (+ `required-indicator`), `description` (optional) and `error` (live region).

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name |
| `description` | text | — | help text under the label |
| `error` | text | — | marks the field invalid |
| `size` | `default` \| `sm` | default | track and thumb size |
| `name` | text | — | form field name |
| `value` | text | on | submitted while on |
| `checked` | boolean | false | current state; the attribute is the reset default |
| `required`, `disabled` | boolean | false | native |

## 4. Variant matrix
One axis, `size`: default and sm. States below.

## 5. Roles and color
Off: track fill `input-background`, border `input`, thumb `input`. On: track fill and border `primary`, thumb `primary-foreground`. Label `foreground`; description `muted-foreground`; error and invalid border `destructive`; focus ring `ring`.

## 6. States
focus-visible (3px ring, border in `ring`), checked, invalid, disabled (opacity 0.5, not-allowed cursor).

## 7. Dimensions and layout
Thumb 16px (default) or 12px (sm). Track height = thumb + 2 × inset, width = 2 × thumb + 2 × inset, inset 1px, fully rounded, shadow-xs. The thumb travels the full free width and is mirrored in rtl. 12px gap to the label; 6px between label and description.

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5. Size does not change the type.

## 9. Accessibility
- Native `<input type="checkbox" role="switch">` with a native `<label for>` in one shadow root. Space toggles; Enter submits the form (implicit submission): the inner control has no form owner in its shadow root, so the component calls `form.requestSubmit()` (SB-0009).
- The switch role announces on/off; no extra live region for the state.
- Description and error through `aria-describedby`; `aria-invalid` when invalid; the error is a persistent polite live region and also sets a `customError` validity.
- Off border and thumb at 3:1 and a solid focus ring (deviation from the visual reference, WCAG 1.4.11). The 18px track relies on the label row and the 12px gap for WCAG 2.5.8.
- Form association (rule form-associated-controls): `FormAssociated` + `NativeControl`. Submits `value` only while on; `form.reset()` restores the `checked` attribute; a disabled `<fieldset>` disables it without changing the `disabled` attribute and re-enabling restores it; `required` gives `valueMissing` while off, mirrored from the inner input; `<label for>` clicks the host and is forwarded to the input. See `accessibility.formAssociation`.

## 10. Usage
### Behavior
`input` and `change` on each toggle, composed. The new value is in `FormData` when `change` fires.
### Composition
One per setting; a list of settings goes in a Field set (later).
### Choosing the props
`size="sm"` for dense settings lists. `required` only when the form cannot go on with the setting off. `description` for the consequence of turning it on.
### Do / Don't
- Do label the setting with what it controls, not with "On/Off".
- Don't use a switch to pick among options; use Checkbox or Radio Group.
- Don't use a switch to submit an agreement; use a required Checkbox.

## Realizations
### Figma
Not started.
### Web
Not started. Parts: `field`, `control`, `input`, `thumb`, `label`, `required-indicator`, `description`, `error`.
### Coverage
None yet.
### Known drift
- API shape: shadcn composes Field parts around Switch; shadow DOM requires them inside
- off track and thumb: shadcn's `bg-input` fill is below 3:1; border and thumb use `input` (WCAG 1.4.11)
- focus ring: shadcn uses ring/50, below 3:1 (WCAG 1.4.11)
- checked state: not reflected: the attribute is the default restored by form reset

## Open questions
All answered with the recommendation (no approver was available, SB-0101); see `openQuestions` in contract.json.
- Q1 `role="switch"` on a checkbox input, not the `switch` attribute.
- Q2 `label` required; no `hide-label`.
- Q3 sizes `default` and `sm`; the track is derived from the thumb token, no new semantic token.
- Q4 `checked` not reflected.
- Q5 submits `value` only while on; `required` means on.
- Q6 `error` blocks submission; Enter submits (SB-0009).
- Q7 no label-position prop.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first (rule test-first). Use `FormAssociated` + `NativeControl`.
