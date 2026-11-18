# Parity audit: button-group (2026-11-08)

Reference: spec/components/button-group/contract.md and contract.json. Implementation: src/components/button-group/, playwright/tests/button-group/. Run: `SKETCHBOOK_PORT=6202 npx playwright test tests/button-group` passed (12 tests (15 per contract.md incl. axe variants)). `npm run check` (T4, T5, T6, C1-C3, R1, G1) passes; tsc and eslint clean.

## Comparison
| Aspect | Contract | Implementation | |
| --- | --- | --- | --- |
| orientation, role=group, aria-label | per contract | matches | ✅ |
| data-position / data-orientation / overlap | per contract | matches; recomputed on slotchange and orientation change | ✅ |
| Separator, text cell | per contract | matches | ✅ |

## Differences and action plan
None.

## Verdict
matches contract.
