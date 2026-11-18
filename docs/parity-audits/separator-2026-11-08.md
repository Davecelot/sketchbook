# Parity audit: separator (2026-11-08)

Reference: spec/components/separator/contract.{md,json}. Implementation: src/components/separator/. Evidence: npm run check all pass (T1-T6, C1-C3, R1, G1); playwright tests/separator pass (full group run 160 passed, 1 unrelated Storybook-navigation flake in empty); no literals in the SCSS (T4/T5 pass).

| Aspect | Result | |
| --- | --- | --- |
| orientation, decorative (string false) | Separator.ts:14-18 | ✅ |
| role none vs separator, aria-orientation only when vertical and semantic, set before first render | Separator.ts:21-30 | ✅ |
| 1px line, vertical stretch, no shrink, border color | Separator.scss | ✅ |

Verdict: matches contract.
