# Parity audit: toggle-group (2026-11-08)

Reference: spec/components/toggle-group/contract.md and contract.json. Implementation: src/components/toggle-group/, playwright/tests/toggle-group/. Run: `SKETCHBOOK_PORT=6202 npx playwright test tests/toggle-group` passed (17 tests (22 per contract.md incl. axe variants)). `npm run check` (T4, T5, T6, C1-C3, R1, G1) passes; tsc and eslint clean.

## Comparison
| Aspect | Contract | Implementation | |
| --- | --- | --- | --- |
| type single/multiple, value, spacing, orientation | per contract | present | ✅ |
| Roving focus, RTL, Home/End, disabled skip | per contract | matches | ✅ |
| Items are aria-pressed buttons (SB-0012) | yes | matches | ✅ |
| Tokens | own vars only | matches | ✅ |

## Differences and action plan
None.

## Verdict
matches contract.
