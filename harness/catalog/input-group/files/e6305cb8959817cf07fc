# Parity audit: input-group (2026-11-08)

Reference: spec/components/input-group/contract.md and contract.json. Implementation: src/components/input-group/, playwright/tests/input-group/. Run: `SKETCHBOOK_PORT=6202 npx playwright test tests/input-group` passed (13 tests (20 per contract.md incl. axe variants)). `npm run check` (T4, T5, T6, C1-C3, R1, G1) passes; tsc and eslint clean.

## Comparison
| Aspect | Contract | Implementation | |
| --- | --- | --- | --- |
| Shell, addons, align, block stacking | per contract | matches | ✅ |
| Focus ring via focusin/focusout | per contract | matches | ✅ |
| invalid sets aria-invalid on native control only | per contract | matches | ✅ |
| Group button submit/reset | per contract | matches (reset verified by probe) | ✅ |
| Control selector | sb-input, input, textarea | sb-textarea not recognized (focus ring, addon click focus) | ⚠️ |

## Differences and action plan
1. A slotted sb-textarea gets no shell focus ring and no addon click-to-focus. Contract lists only sb-input, input and textarea, so this is a contract gap, not a defect; either add sb-textarea to the contract's exclusions or to the selector (InputGroup.ts:52, InputGroupAddon.ts:20).

## Verdict
matches contract; one contract gap.
