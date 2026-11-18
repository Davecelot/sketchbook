# Parity audit: native-select (2026-11-08)

Reference: spec/components/native-select/contract.md and contract.json. Implementation: src/components/native-select/, playwright/tests/native-select/. Run: `SKETCHBOOK_PORT=6202 npx playwright test tests/native-select` passed (17 tests). `npm run check` (T4, T5, T6, C1-C3, R1, G1) passes; tsc and eslint clean.

## Comparison
| Aspect | Contract | Implementation | |
| --- | --- | --- | --- |
| Props and attributes | per contract.json | all present with the contract defaults (C3 passes) | ✅ |
| Anatomy and parts | field, label, control, description, error | matches | ✅ |
| Form association | FormAssociated + NativeControl, value, reset, restore, fieldset disabled | matches; tested | ✅ |
| Accessibility | native control, aria-describedby, aria-invalid, live error, hide-label | matches; axe test passes | ✅ |
| Tokens | --sb-<c>-* only, T4/T5 pass | matches | ✅ |
| Light-DOM options mirrored incl. groups, disabled, later changes | per contract | matches (MutationObserver) | ✅ |

## Differences and action plan
None blocking. Enter on a select does not submit natively either, so no gap.

## Verdict
matches contract.
