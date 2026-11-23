---
component: Table
status: stable
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-08
source: shadcn/ui (visual reference and names), WAI-ARIA table roles, the reference implementation table (roles on custom elements with CSS table display)
---

# Table

> Rows and columns of data, built from custom elements with table roles. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Present records that share the same fields so people can compare them. Not for page layout.

## 2. Anatomy
`sb-table` > `sb-table-header` / `sb-table-body` / `sb-table-footer` > `sb-table-row` > `sb-table-head` / `sb-table-cell`, plus an optional `sb-table-caption`. None of the elements draws shadow content other than a slot; each host has a table role and a CSS table display value.

## 3. Props / API
| Element | Prop | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `sb-table-row` | `selected` | boolean | false | selected fill and a 3:1 `input` outline, `aria-selected` |

All other elements take only content.

## 4. Variant matrix
None.

## 5. Roles and color
Text `foreground`, dividers `border`, row hover and footer fill `muted` at 50% (derived in CSS), selected row `muted` with a 1px `input` outline (the fill alone is about 1:1, WCAG 1.4.11), caption `muted-foreground`.

## 6. States
Row hover, row selected.

## 7. Dimensions and layout
Full width, collapsed borders. Header cells 40px high with 8px side padding; data cells 8px padding. Caption below the table with a 16px gap. Header rows and body rows have a bottom border; the last body row has none; the footer has a top border.

## 8. Typography
14px body size; heads and the footer in weight 500; heads aligned to the start edge.

## 9. Accessibility
- Roles: table, rowgroup, row, columnheader, cell, caption, set on the hosts. The accessibility tree follows the flat tree, so the roles connect across shadow roots.
- The caption names the table (`ariaLabelledByElements`, falling back to an `aria-label` copy). An author's `aria-label` or `aria-labelledby` wins.
- Selected rows carry `aria-selected="true"`.
- Heads and cells can take another role through the `role` attribute (for example `rowheader`); an author `role` on `sb-table` is kept too.

## 10. Usage
### Behavior
Rows highlight on hover; `selected` marks chosen rows (selection logic belongs to the page).
### Composition
Header rows go in `sb-table-header`, records in `sb-table-body`, totals in `sb-table-footer`.
### Choosing the props
Put the caption first or last in the markup; it always draws below the table.
### Do / Don't
- Do name every table. Do wrap very wide tables in `sb-scroll-area` with a `label` and a horizontal `sb-scroll-bar`: while the table overflows it is a focusable region named by that label, so keyboard users can scroll it (a bare overflow container is not focusable in every browser). The table itself does not scroll.

## Realizations
### Figma
Drawn in the library: one table with header, two body rows (the second selected), footer and caption. Not drawn: row hover.
### Web
Complete. src/components/table/Table.ts, src/components/table/TableHeader.ts, src/components/table/TableBody.ts, src/components/table/TableFooter.ts, src/components/table/TableRow.ts, src/components/table/TableHead.ts, src/components/table/TableCell.ts, src/components/table/TableCaption.ts. Parts: none. Slots: default.
### Coverage
- table, rowgroup, row, columnheader, cell roles
- caption and aria-label name the table
- CSS table display on every host, columns aligned
- head height and cell padding from tokens
- row borders, last body row, footer border and fill
- row hover fill
- selected row fill and aria-selected
- caption below the table in the muted color
- axe clean (three stories)
### Known drift
- horizontal scroll: the visual reference wraps the table in an overflow container; a display: table host cannot be one
- hover and footer fill: same as the reference; light muted is neutral-50 (SB-0004) so the fill is faint
- colspan: custom elements have no colspan or rowspan; use empty cells

## Open questions
All answered; see contract.json.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-table-*` variables (check T4). Tests first (rule test-first).
