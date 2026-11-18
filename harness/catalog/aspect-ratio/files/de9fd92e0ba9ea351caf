# Parity audit: aspect-ratio (2026-11-08)

Reference: spec/components/aspect-ratio/contract.{md,json}. Implementation: src/components/aspect-ratio/. Evidence: npm run check all pass (T1-T6, C1-C3, R1, G1); playwright tests/aspect-ratio pass (full group run 160 passed, 1 unrelated Storybook-navigation flake in empty); no literals in the SCSS (T4/T5 pass).

| Aspect | Result | |
| --- | --- | --- |
| ratio number or a/b, invalid -> 1 | AspectRatio.ts:10-20 | ✅ |
| Frame full width, slotted child fills | AspectRatio.scss | ✅ |
| Not reflected | not required | ➖ |

Verdict: matches contract.
