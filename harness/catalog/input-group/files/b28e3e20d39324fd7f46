---
component: InputGroup
status: beta
version: 0.1.0
platforms: [web, design]
dependsOn: [Button, Input]
last_updated: 2026-11-08
source: shadcn/ui (visual reference, names), WAI-ARIA APG, contract-first standard (contract and build process)
---

# Input Group

> One bordered shell around a text control with addons. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Attach small pieces to a text input or textarea: a leading icon, a currency symbol, a unit, a copy or clear button, a toolbar under a textarea. The shell carries the border, the focus ring and the invalid color for the whole assembly. Not for several independent controls: use Button Group.

## 2. Anatomy
| Element | Part |
| --- | --- |
| `sb-input-group` | `group` |
| `sb-input-group-addon` | `addon` |
| `sb-input-group-text` | `text` |
| `sb-input-group-button` | `button` (a `sb-button`) |

The control is a slotted `sb-input` or `sb-textarea` (with `hide-label`), a native `<input>`, or a native `<textarea>`. A slotted `sb-textarea` keeps its own vertical resize handle.

## 3. Props / API
| Element | Prop | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `sb-input-group` | `validation` | `none` \| `error` | `none` | `error`: error color on the shell; `aria-invalid` on the slotted control |
| `sb-input-group-addon` | `align` | inline-start, inline-end, block-start, block-end | inline-start | position; block-* makes the shell a column |
| `sb-input-group-button` | `variant` | ghost, primary, tertiary, secondary | ghost | passed to `sb-button` |
| `sb-input-group-button` | `size` | tiny, small, icon-tiny, icon-small | tiny | passed to `sb-button` |
| `sb-input-group-button` | `type` | button, submit, reset | button | submit and reset are done by the group button (form-associated); `name` and `value` unsupported |
| `sb-input-group-button` | `disabled` | boolean | false | passed to `sb-button` |

## 4. Variant matrix
None.

## 5. Roles and color
Shell: `input-background` fill, 1px `input` border, `elevation.xs`. Addon and text: `muted-foreground`. Control text: `foreground`. Invalid: `destructive` border. Focus: `ring` border plus a 3px ring.

## 6. States
focus-within (control only), invalid.

## 7. Dimensions and layout
36px high, `radius.control`. Inline addons sit beside the control and are ordered by `align`; block addons stack above or below it and the shell grows. A slotted `sb-input` has its own border, background, shadow, radius and ring switched off through its tokens, so only the shell draws them. Addon padding is 12px sideways; block addons have 12px at the open end.

## 8. Typography
14px (`font.size.control`), addon weight 500.

## 9. Accessibility
- The control keeps its accessible name: `label` with `hide-label` on `sb-input`, or `aria-label` on a native control.
- The shell has `role="group"` only when the host has `aria-label`; an unnamed group would add noise.
- The inner button is named by the slotted text (kept current when the text changes, also in place) unless the host has an `aria-label`.
- Icon-only `sb-input-group-button` needs `aria-label`; it is forwarded to the inner button (sb-button warns in development when missing).
- One focus ring for the shell while the control is focused. `:has()` cannot see into shadow trees, so the shell listens to `focusin` and `focusout` on its control and sets `data-focused`. Addon buttons keep their own ring.
- Clicking addon text or icons moves focus to the control.
- `validation="error"` sets `aria-invalid="true"` on the slotted control: a native one directly, a `sb-input` or `sb-textarea` on its host, which passes it to its inner control. Explain the error in text (an external `sb-field-error`), not only by color.
- Native placeholders keep the browser color (`::slotted` cannot style `::placeholder`).

## 10. Usage
### Behavior
Focus moves from the control to addon buttons with Tab. The shell never changes the control's value or events.
### Composition
Use `sb-input-group-text` for symbols and units, `sb-input-group-button` for actions. Put the visible label outside the group (for example with `sb-field-label`).
### Choosing the props
`align="inline-end"` for actions, `inline-start` for icons and prefixes, `block-end` for textarea toolbars.
### Do / Don't
- Do name icon-only buttons. Don't put more than one control in a group.

## Realizations
### Figma
Drawn in the library (`sketchbook api figma input-group`): axes State (Rest, Focus) and Validation; a full-width shell with no padding of its own, one inline-start addon (its start padding, block padding and gap, holding an icon) and the input filling the rest with its own padding, as the styles lay them out. Not drawn: addons at the end, above or below (`block-padding`), addon text and buttons.
### Web
`src/components/input-group/`: `InputGroup.ts`, `InputGroupAddon.ts`, `InputGroupText.ts`, `InputGroupButton.ts` and one stylesheet. Complete.
### Coverage
`playwright/tests/input-group/input-group.behavior.spec.ts`: 20 tests (shell, addons, focus, invalid, click handling, button, tokens, axe).
### Known drift
- Native placeholders keep the browser color.
- The invalid focus ring is solid `destructive` (the visual reference tints it at 20%), so focus on an invalid group differs from invalid at rest (WCAG 2.4.7, 1.4.11).
- Group button submit and reset are handled by the element itself; no `name` and `value`.
- No shell-level disabled. A disabled slotted native input or textarea is dimmed (`opacity.disabled`, not-allowed cursor) so it does not look editable; `sb-input` and `sb-textarea` dim themselves.

## Open questions
- Q1 (answered): slotted `sb-input` is neutralized through its own tokens.
- Q2 (answered): focus via `focusin`/`focusout`, invalid via a prop.
- Q3 (answered): no shell-level disabled.
- Q4 (answered): native placeholder keeps the browser color.

## Spec for agents
Build from contract.json only. CSS uses only --sb-input-group-* variables (check T4); one stylesheet serves all four elements. Tests first (rule test-first).
