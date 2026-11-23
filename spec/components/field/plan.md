---
stage: ready
basis: SB-0011
test-first: unverified (pre-record)
approved-by: Davecelot
approved-on: 2026-11-08
approved-contract: sha256:c5d04161437f307a7f3339940fbba73030efb5be923ae52456ebad23b19c63e2
approved-plan: sha256:0d395792d37ba237c8bfd352396c1a87e19f5dd0df6c568c4136cac20592c7d7
---

# Plan: Field (planning gate)

Status: Approved under SB-0011 (owner pre-approval, 2026-11-08).

## Scope
Nine elements: `sb-field` (orientation, invalid, wiring), `sb-field-set` (native fieldset, legend), `sb-field-group`, `sb-field-label`, `sb-field-description`, `sb-field-error`, `sb-field-separator`, `sb-field-content`, `sb-field-title`. Layout, naming and grouping; no values.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/field/Field.stories.ts` |
| 2 | `playwright/tests/field/field.behavior.spec.ts` (written first, must fail) |
| 3 | `Field.scss` -> `Field.styles.ts` (one sheet, `:host(tag)` rules per element) |
| 4 | one `.ts` per element, `index.ts` |

## Test plan (test-first)
- `sb-field-set`: group named by its legend; no legend element without the prop.
- Wiring: native input named by the label and described by description and error; error text joins the description only when non-empty; `validation="error"` sets `aria-invalid` and the label color; re-wiring after DOM changes; clicking the label focuses the input or toggles a checkbox.
- Error role=alert and hidden while empty; separator lines hidden from the tree, text kept.
- Layout: vertical stacking and token gaps, horizontal row, group gap.
- A DS control with its own label inside a group stays correctly named (no duplicate).
- Token colors; axe clean on every story.

## Accessibility deviations from the references
- The label is not a native `<label>` (a shadow-root label cannot reference a light-DOM control); the field wires `aria-labelledby` instead.
- `sb-field` has no `role="group"`: an unnamed group adds noise; `sb-field-set` is the named group.

## Open questions (recommendation first)
- Q1 when to use Field: native and custom controls, sets, layout; DS controls use their own props. Q2 wiring by the field. Q3 `legend` prop. Q4 no responsive orientation. All answered.
