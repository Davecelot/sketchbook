# Parity audit: radio-group (2026-11-08)

Reference: spec/components/radio-group/contract.md and contract.json. Implementation: src/components/radio-group/, playwright/tests/radio-group/. Run: `SKETCHBOOK_PORT=6202 npx playwright test tests/radio-group` passed (19 tests (24 per contract.md incl. axe variants)). `npm run check` (T4, T5, T6, C1-C3, R1, G1) passes; tsc and eslint clean.

## Comparison
| Aspect | Contract | Implementation | |
| --- | --- | --- | --- |
| Group form-associated, required, valueMissing | SB-0012 | matches | ✅ |
| Roving tab stop, arrows select, RTL | per contract | matches | ✅ |
| posinset/setsize on items | per contract | matches (DOM attributes) | ✅ |
| Enter submit | SB-0009 item 1 | matches (tested) | ✅ |

## Differences and action plan
1. Resolved: Enter on the focused control submits the enclosing form (SB-0009 item 1; the contract requires it). Proved by the Enter tests in playwright/tests/radio-group/radio-group.behavior.spec.ts, including the disabled case.

## Verdict
matches contract.
