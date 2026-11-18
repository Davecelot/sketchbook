---
component: ToggleGroup
status: beta
version: 0.1.0
platforms: [web, design]
dependsOn: [Toggle]
last_updated: 2026-11-08
source: shadcn/ui (visual reference, names), WAI-ARIA APG toolbar and toggle button patterns, contract-first standard (contract and build process)
---

# Toggle Group

> Related on/off controls in one row: pick exactly one, or turn several on, like text alignment or formatting. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Related on/off options shown together (bold, italic, underline) or a small set of views where one can be active or none. Not for a required one-of-many choice in a form: use Radio Group.

## 2. Anatomy
`sb-toggle-group` renders a `group` (`div role="group"`, part `group`) around its default slot. Each `sb-toggle-group-item` renders a native `<button aria-pressed>` (part `button`) around its default slot.

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `selection` | single, multiple | single | single: at most one pressed, pressing it again clears it |
| `variant` | ghost, tertiary | ghost | applied to every item |
| `size` | medium, small, large | medium | applied to every item |
| `spacing` | number | 0 | gap in 4px units; 0 joins the items |
| `orientation` | horizontal, vertical | horizontal | layout and arrow axis |
| `value` | string[] (attribute: space-separated) | none | values of the pressed items |
| `disabled` | boolean | false | disables all items |
| events | `change` | — | `detail.value`; only on person input |

`sb-toggle-group-item`: `value` (required), `disabled`; slot default; sets `data-pressed` and reads variant, size and orientation from the group (`@lit/context`). The group writes `data-position`.

## 4. Variant matrix
2 variants × 3 sizes = 6 combinations, each in both selections and orientations.

## 5. Roles and color
Same as Toggle: off transparent on `foreground`; hover `muted` / `muted-foreground`; on `accent` / `accent-foreground` plus a 1px `foreground` border, which carries the pressed state at 3:1 (the fill alone is about 1.1:1, WCAG 1.4.11); tertiary adds a 1px `input` border (hover `accent`). A joined tertiary group carries the `elevation.xs` shadow once on the group and shares borders between items.

## 6. States
hover, pressed, focus-visible (3px solid `ring`, the focused item paints above neighbours), disabled (opacity 0.5).

## 7. Dimensions and layout
Item sizes as Toggle (32 / 36 / 40px, min-width equal to height). Joined groups (`spacing` 0): only the outer corners are rounded, adjacent borders collapse. `spacing` > 0: separate items, each fully rounded.

## 8. Typography
14px (`font.size.control`), weight 500, line-height 20px.

## 9. Accessibility
- A console warning fires once per element when the host has no `aria-label` (a name from an outer legend is not detected).
- `role="group"` named by the host `aria-label` (forwarded).
- Items are native buttons with `aria-pressed` in both types. Decision (Q1): single mode is not a radiogroup, because the pressed item can be cleared by pressing it again; Radio Group is the required-choice pattern.
- One tab stop (roving tabindex, `src/controllers/roving-focus.ts`): Tab enters on the first pressed item, else the first enabled one. Arrows move focus (wrap, RTL aware, vertical uses Up/Down), Home and End jump; Enter and Space toggle. Arrows never press an item.
- Disabled items are skipped and unfocusable. Follows `<fieldset disabled>`.
- Focus ring solid 3px (the reference's translucent ring is below 3:1). Target size at least 32px.

## 10. Usage
### Behavior
Pressing an item updates `value` and fires `change` with `detail.value`. In single mode pressing another item moves the selection; pressing the pressed one clears it.
### Composition
Items are direct children of the group. Name the group with `aria-label`; icon-only items need their own `aria-label`.
### Choosing the props
`multiple` for independent options; `single` for exclusive but optional views; `tertiary` with `spacing` 0 for a segmented look.
### Do / Don't
- Do name every icon-only item. Don't use it for a required choice that is submitted with a form.

## Realizations
### Figma
Drawn in the library (`sketchbook api figma toggle-group`): axes Variant, Size, Orientation and Disabled; three instances of the Toggle component, the first selected, joined as in the default (`spacing` 0): no gap, and only the outer corners round. The `spacing` prop and a gap between items are not drawn, nor the shared border of the tertiary look (each item keeps its own border). A vertical group is drawn at the sample width. Single or multiple selection changes behavior, not looks, so it is not drawn.
### Web
`src/components/toggle-group/ToggleGroup.ts`, `ToggleGroupItem.ts`; parts `group`, `button`; slot `default`. Complete.
### Coverage
`playwright/tests/toggle-group/toggle-group.behavior.spec.ts`: 22 tests (semantics, both selections, value, roving focus, RTL, vertical, disabled, layout, tokens, axe).
### Known drift
- Single mode uses aria-pressed, not radio semantics (Q1).
- Focus ring solid instead of ring/50 (WCAG 1.4.11).
- Variant and size are group-level only.
- The focused item is `position: relative` so its ring paints above neighbours.

## Open questions
- Q1 (answered): `aria-pressed` buttons in both types, not radio semantics.
- Q2 (answered): roving focus in both types; selection never follows focus.
- Q3 (answered): `value` is `string[]`; the attribute is space-separated.
- Q4 (answered): variant and size are group-level only.

## Spec for agents
Build from contract.json only. CSS uses only --sb-toggle-group-* variables (check T4); one stylesheet serves both elements, with `:host(sb-toggle-group-item)` rules for the item. Tests first (rule test-first).
