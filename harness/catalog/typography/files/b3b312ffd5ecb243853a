# Parity audit: typography (2026-11-08)

Reference: spec/components/typography/contract.{md,json}. Implementation: src/components/typography/. Evidence: npm run check all pass (T1-T6, C1-C3, R1, G1); playwright tests/typography pass (full group run 160 passed, 1 unrelated Storybook-navigation flake in empty); no literals in the SCSS (T4/T5 pass).

| Aspect | Result | |
| --- | --- | --- |
| Props variant (12 values, default p, reflects) | Typography.ts:43 | ✅ |
| Native element per variant, heading/list/blockquote in AX tree | Typography.ts:24-37; probe: 4 headings, 1 list, 3 listitems, 1 blockquote | ✅ |
| Scale, margins, rule, bar, colors via own tokens | Typography.scss | ✅ |
| Inline variants (inline-code, small) | Typography.scss:11-14 | ✅ |
| Drift list (inline-code radius/padding, no Typeset) | accurate | ✅ |

Verdict: matches contract.
