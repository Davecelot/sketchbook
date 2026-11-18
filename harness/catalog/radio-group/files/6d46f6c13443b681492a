---
component: RadioGroup
status: beta
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-08
source: shadcn/ui (visual reference, names), WAI-ARIA APG radio group, the reference implementation radio-button and radio-group (form association, roving tab stop), contract-first standard (contract and build process)
---

# Radio Group

> Mutually exclusive choices shown all at once: picking one clears the others, and the group is the form field. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Pick exactly one of a few options, all visible. Not for on/off (Checkbox, Switch), not for many options (Native Select), not for optional exclusive views that can be cleared (Toggle Group).

## 2. Anatomy
`sb-radio-group` renders a `group` (`div role="radiogroup"`) around its default slot. Each `sb-radio-group-item` renders a `root` (`<label>`) holding the `control` (native `<input type="radio">`) and the `label` text.

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `name` | text | — | form field name |
| `value` | text | null | selected item's value; the initial attribute is the reset value |
| `required` | boolean | false | valueMissing until one is selected; `aria-required` |
| `disabled` | boolean | false | disables all items; not submitted |
| `orientation` | vertical, horizontal | vertical | layout only |
| events | `change` | — | `detail.value`; only on person input |

`sb-radio-group-item`: `value` (required), `label`, `disabled`.

## 4. Variant matrix
None.

## 5. Roles and color
Control: `input-background` fill, 1px `input` border, `primary` dot, `elevation.xs`. Label: `foreground`.

## 6. States
checked, focus-visible (3px solid `ring`), disabled (opacity 0.5).

## 7. Dimensions and layout
16px circle (`size.icon.default`), dot half its size. Items are a row of control and label, gap 8px. Vertical groups stack with a 12px gap; horizontal groups use 24px.

## 8. Typography
14px (`font.size.control`), weight 500 (`font.weight.label`).

## 9. Accessibility
- A console warning fires once per element when the host has no `aria-label` (a name from an outer legend is not detected).
- Enter submits the form (implicit submission): the inner control has no form owner in its shadow root, so the component calls `form.requestSubmit()` (SB-0009).
- `role="radiogroup"` named by the host `aria-label`, or by a visible legend in a Field Set. `aria-required` when required.
- Items are native radios named by their `label`. Radios in separate shadow roots cannot form a native group, so each is a group of one: the group sets `checked`, the tab stop and `aria-posinset` and `aria-setsize`. The accessibility tree reads a radiogroup of N radios, "1 of N".
- One tab stop, on the selected item, else the first enabled. Arrows (all four, RTL aware) wrap, skip disabled items, and select as they move (selection follows focus). Home and End jump. Space selects.
- Form: the group is the field (`FormAssociated`): `name`/`value`, `form.reset()` restores the initial `value`, `<fieldset disabled>` disables it, `required` gives a localized `valueMissing`, and `reportValidity()` focuses the first enabled radio.
- Focus ring on `:focus-visible`, 3px solid `ring`. The 16px control and its 20px label row are one target; the 12px (vertical) or 24px (horizontal) gap between items satisfies the WCAG 2.5.8 spacing exception.

## 10. Usage
### Behavior
Selecting an item sets `value` and fires `change` once. Clicking the label selects the item. A `<label for>` that points at the group focuses its tab stop.
### Composition
Items are direct children of the group. Put a visible question in a Field Set legend or set `aria-label`.
### Choosing the props
Set `required` only when a choice must be made; preselect with `value` when a sensible default exists.
### Do / Don't
- Do label every item. Don't use a radio group for more than about seven options.

## Realizations
### Figma
Drawn in the library (`sketchbook api figma radio-group`): axes Orientation, State (Rest, Focus) and Disabled, three items with the first selected; the dot is half the control, as in the web component (it has no token of its own). Focus draws the ring on the selected item's control (the tab stop), replacing its border. Disabled dims each item, as the styles do.
### Web
`src/components/radio-group/RadioGroup.ts`, `RadioGroupItem.ts`; parts `group`, `root`, `control`, `label`; slot `default`. Complete.
### Coverage
`playwright/tests/radio-group/radio-group.behavior.spec.ts`: 24 tests (tree, selection, keyboard, RTL, disabled, forms, validity, tokens, axe).
### Known drift
- Native radios are each a group of one; `aria-posinset`/`aria-setsize` restore the set size (Chromium does not expose them in its tree, so the spec checks the attributes).
- `aria-required` on the radiogroup, not `required` on every radio.
- Focus ring solid (WCAG 1.4.11); dark control tint and invalid ring of the visual reference not reproduced.

## Open questions
- Q1 (answered): native inputs, each a group of one, driven by the group.
- Q2 (answered): the group is form-associated, items are not.
- Q3 (answered): group-level valueMissing; `aria-required` on the radiogroup.
- Q4 (answered): `label` prop.
- Q5 (answered): no invalid styling or error prop in this component.

## Spec for agents
Build from contract.json only. CSS uses only --sb-radio-group-* variables (check T4); one stylesheet serves both elements. Tests first (rule test-first).
