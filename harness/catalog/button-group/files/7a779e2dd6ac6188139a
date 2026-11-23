---
component: ButtonGroup
status: stable
version: 0.1.0
platforms: [web, design]
dependsOn: [Button]
last_updated: 2026-11-08
source: shadcn/ui (visual reference, names), WAI-ARIA APG group role, contract-first standard (contract and build process)
---

# Button Group

> Joins related buttons, dividers and text cells into one connected strip. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Show closely related actions as one control: previous and next, a main action with a related menu trigger, a value with a unit. Not a selection control: use Toggle Group for pressed states and Radio Group for a required choice.

## 2. Anatomy
`sb-button-group` renders a `group` (`div role="group"`) around its default slot. Children are `sb-button`, `sb-button-group-separator` (part `separator`) and `sb-button-group-text` (part `text`).

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `orientation` | horizontal, vertical | horizontal | direction of the strip |
| slots | default | — | direct children only |

The group writes `data-position` (first, middle, last, only), `data-orientation` and `data-overlap` on its children whenever the slot changes.

## 4. Variant matrix
None.

## 5. Roles and color
Text cell: `muted` fill, `foreground` text, `border` outline, `elevation.xs`. Separator: `input` color line, one border width thick.

## 6. States
None of its own. Buttons keep hover, focus and disabled.

## 7. Dimensions and layout
Children sit edge to edge. Only the outer corners of the strip keep `radius.control`; inner corners are square, set through `--sb-button-radius` on each button and a matching radius on text cells. Bordered children (tertiary buttons, text cells) overlap their neighbour by one border width so the shared edge is one line, except right after a separator. Right-to-left and vertical strips swap the rounded corners. Text cells are 36px high.

## 8. Typography
Text cells use 14px (`font.size.control`), weight 500.

## 9. Accessibility
- A console warning fires once per element when the host has no `aria-label` (a name from an outer legend is not detected).
- `role="group"` named by the host `aria-label`; name it when the buttons form one control.
- Buttons stay individual tab stops; the group adds no focus handling.
- Separators are decorative and hidden from assistive technology.
- The focused child is raised so its ring is never covered by a neighbour.

## 10. Usage
### Behavior
The group never changes what its children do.
### Composition
Use tertiary buttons for the bordered look. Put a separator between filled buttons.
### Choosing the props
Vertical for toolbars stacked in a narrow column; horizontal otherwise.
### Do / Don't
- Do group only actions that belong together. Don't join unrelated buttons or use the strip for selection.

## Realizations
### Figma
Drawn in the library: axis Orientation, two Button instances and a text segment with the inner corners square. Element set ButtonGroupSeparator: two filled Button instances with the separator line between them. Not drawn: the shared border (the neighbours overlap by one border width in the styles; here they sit side by side) and the text segment's icon.
### Web
`src/components/button-group/ButtonGroup.ts`, `ButtonGroupSeparator.ts`, `ButtonGroupText.ts`; parts `group`, `separator`, `text`; slot `default`. Complete.
### Coverage
`playwright/tests/button-group/button-group.behavior.spec.ts`: 17 tests (group semantics, positions, corners, borders, separator incl. forced colors, text, focus, axe).
### Known drift
- Corners are set through the button's own `--sb-button-radius` token, not child selectors.
- The text cell's border is below 3:1; it is not a control, so 1.4.11 does not apply.

## Open questions
- Q1 (answered): corners are set through `--sb-button-radius` on slotted buttons.
- Q2 (answered): shared borders by negative margin of one border width.
- Q3 (answered): no focus or selection handling.

## Spec for agents
Build from contract.json only. CSS uses only --sb-button-group-* variables (check T4); one stylesheet serves all three elements. Tests first (rule test-first).
