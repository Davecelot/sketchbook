---
component: Field
status: stable
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-08
source: shadcn/ui (visual reference, names), WAI-ARIA APG, HTML fieldset and legend, contract-first standard (contract and build process)
---

# Field

> Layout and grouping for form controls. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Compose a form from parts: a label, a control, helper text and an error in one block; related fields in a named set; blocks separated by a divider. The family only arranges and names things; it never holds a value.

## 2. Anatomy
| Element | Role | Part |
| --- | --- | --- |
| `sb-field` | one labelled block | `field` |
| `sb-field-label` | visible label | `label` |
| `sb-field-description` | helper text | `description` |
| `sb-field-error` | error text, `role="alert"` | `error` |
| `sb-field-title` | heading text that is not a label | `title` |
| `sb-field-content` | column that keeps label and description together | `content` |
| `sb-field-group` | stack of fields | `group` |
| `sb-field-set` | native fieldset with a legend | `fieldset`, `legend` |
| `sb-field-separator` | divider with optional text | `separator`, `line`, `text` |

## 3. Props / API
| Element | Prop | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `sb-field` | `orientation` | vertical, horizontal | vertical | horizontal places control and text side by side |
| `sb-field` | `validation` | `none` \| `error` | `none` | `error`: error color on the label, `aria-invalid` on the native control |
| `sb-field-set` | `legend` | text | — | visible group name |
| `sb-field-label` | `for` | text | — | id of the control to focus on click; filled in by `sb-field` |

All other elements take only their default slot.

## 4. Variant matrix
`orientation` has two values.

## 5. Roles and color
Label and title use `foreground`; the label turns `destructive` when invalid. Description uses `muted-foreground`. Error uses `destructive`. Separator lines use `border`; separator text sits on `background` in `muted-foreground`.

## 6. States
invalid. Controls own their other states.

## 7. Dimensions and layout
Field: 12px between label, control and text (6px inside `sb-field-content`). Group: 24px between fields. Set: 24px between its children; the legend has 12px below it. Horizontal fields align items to the start and let `sb-field-content` fill the remaining width.

## 8. Typography
Label, title and legend: 14px, weight 500. Description and error: 14px (`font.size.body`), error weight 500.

## 9. Accessibility
- `sb-field-set` is a native fieldset: a group named by its legend, and described by a `sb-field-description` placed directly in it (an element reference from the shadow fieldset to the light-DOM text). A set without a legend warns once in the console.
- For a native input, select or textarea inside `sb-field`, the field gives the label and the control ids, sets `aria-labelledby` (label), `aria-describedby` (description, then the error when it has text) and `aria-invalid`, and re-wires when the DOM changes. It merges only the ids it owns, so ids the author put in `aria-labelledby` or `aria-describedby` stay, and it removes `aria-invalid` only when it set it. Clicking the label focuses the control, or toggles a checkbox or radio. The label's text is read from the light DOM, so the ID reference stays inside one tree.
- ID references do not cross shadow roots (SB-0009). DS controls (`sb-input`, `sb-checkbox`, ...) therefore carry their own label, description and error; do not wrap them in a field just to label them.
- `sb-field-error` is `role="alert"`, so new text is announced; it is hidden while empty.
- Separator lines are hidden from assistive technology; its text remains readable.
- Text pairs meet 4.5:1 in light and dark (check T6).

## 10. Usage
### Behavior
`sb-field` re-wires on child changes; it adds its own ids to `aria-labelledby` and `aria-describedby` on its first native control, and `aria-invalid`, without removing what the author set.
### Composition
Which one to use:
- DS control (`sb-input`, `sb-checkbox`, ...): set its `label`, `description` and `errorMessage` props. No Field needed; use `sb-field-group` for spacing between them.
- Native control or a custom control without its own label: wrap it in `sb-field` with `sb-field-label`.
- Several related controls (radios, checkboxes): `sb-field-set` with a `legend`, containing `sb-field` children.
- Checkbox or switch rows: `sb-field orientation="horizontal"` with `sb-field-content` around label and description.
### Choosing the props
Set `validation="error"` together with a `sb-field-error` that says what to fix.
### Do / Don't
- Do give every set a legend. Don't put two controls in one `sb-field`.

## Realizations
### Figma
Drawn in the library (`sketchbook api figma field`): axes Orientation and Validation; label, description and error text only. The control slot is not drawn: a field is layout, and its content is placed by the person using it. Element sets (spec/api.json `sets`): FieldSet (legend and two Field instances, the set gap and legend margin), FieldGroup (two Field instances, the group gap), FieldSeparator (lines and an optional text, the Label boolean) and FieldTitle. What is not drawn and why: `realizations.design`.
### Web
`src/components/field/`: `Field.ts` plus one file per element (`FieldSet`, `FieldGroup`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldSeparator`, `FieldContent`, `FieldTitle`) and one shared stylesheet. Complete.
### Coverage
`playwright/tests/field/field.behavior.spec.ts`: 20 tests (set semantics, wiring, invalid, label click, error live region, separator, layout, tokens, axe).
### Known drift
- The label is not a native `<label>`; the field wires `aria-labelledby` instead.
- No `role="group"` on `sb-field`; `sb-field-set` is the named group.
- Legend is a prop; no responsive orientation yet.

## Open questions
- Q1 (answered): Field for native controls, sets, groups and layout; DS controls use their own props.
- Q2 (answered): `sb-field` wires `aria-labelledby`, `aria-describedby` and `aria-invalid`.
- Q3 (answered): `legend` prop on `sb-field-set`.
- Q4 (answered): no responsive orientation yet.

## Spec for agents
Build from contract.json only. CSS uses only --sb-field-* variables (check T4); one stylesheet serves all nine elements. Tests first (rule test-first).
