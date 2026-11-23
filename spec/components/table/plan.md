---
stage: ready
basis: SB-0011
test-first: unverified (pre-record)
approved-by: Davecelot
approved-on: 2026-11-08
approved-contract: sha256:e88439441cf3015eb617bee455e4ad7a006de4f8de507cbc6d00c80c6e1ff737
approved-plan: sha256:69b24df0500cf030d0f051aff751d99c06a5db02820ebffffde5e528e5051548
---

# Plan: Table (planning gate)

Status: Approved under SB-0011 (owner pre-approval, 2026-11-08).

## Scope
Eight elements: `sb-table`, `-header`, `-body`, `-footer`, `-row` (selected), `-head`, `-cell`, `-caption`. ARIA roles on hosts plus CSS table display. Out of scope: sorting, selection logic, horizontal scrolling, sticky headers.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/table/Table.stories.ts` |
| 2 | `playwright/tests/table/table.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/table/Table.scss` -> `Table.styles.ts` (generated, shared) |
| 4 | one `.ts` per element, `index.ts` |

## Test plan (test-first)
- Roles in the accessibility tree; table name from the caption, or from aria-label.
- CSS table display on every host; columns align across rows; head height and cell padding from tokens.
- Row borders, last body row, footer fill and border; hover and selected fills; aria-selected.
- Caption below the table in muted color; axe.

## Accessibility deviations from the references
- The reference table scrolls horizontally in a wrapper; this one does not (documented, use a scroll area).

## Open questions (recommendation first)
All three answered with the recommendation: roles on hosts; caption naming through element references with an aria-label fallback; no own scrolling.
