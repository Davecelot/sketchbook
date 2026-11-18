# Parity audit: Accordion (2026-11-08)

Reference: `spec/components/accordion/contract.{md,json}`. Implementation: `src/components/accordion/`. Evidence: `npm run check` all pass; `tsc`, `eslint` clean; `playwright tests/accordion` pass (serially; see flake note in the review). Tokens use only `--sb-accordion-*`.

| Aspect | Contract | Realization | |
| --- | --- | --- | --- |
| `type`, `collapsible`, `value`, `disabled`, `value-change` | yes | Accordion.ts | ✅ |
| Item `value`, `disabled`; trigger `level` 2 to 6 | level 2 to 6 | AccordionTrigger.ts: any number accepted | ⚠️ |
| Heading around native button, aria-expanded, aria-controls | yes | AccordionTrigger.ts | ✅ |
| Region named by trigger | yes (internals + aria-label fallback) | AccordionContent.ts | ⚠️ |
| Arrow/Home/End, tab order intact | yes | Accordion.ts #onKeydown | ✅ |
| Locked single: aria-disabled | yes | AccordionTrigger.ts | ✅ |
| `value` space-separated | yes | Accordion.ts #values | ⚠️ |

## Differences and action plan
1. `level` is not clamped or validated to 2..6 (code): out-of-range `aria-level` is emitted.
2. Item values containing whitespace silently split and never match (code or contract: document "no spaces").
3. aria-label fallback copy of the trigger text is written once in `updated()` and goes stale if the trigger text changes (AccordionContent.ts); only matters where `ariaLabelledByElements` is unsupported.
4. `aria-controls` resolved at trigger `updated()` only (same late-insertion gap as Collapsible).

Verdict: needs code fix (low severity).

Status (2026-11-15): open: item 3, the `aria-label` fallback copy of the trigger text goes stale when that text changes (only where `ariaLabelledByElements` is missing; see docs/simplicity-debt.md). Items 1, 2 and 4 already fixed (664ef39: level clamped to 2-6, whitespace warning; bcf116e: references re-resolved).
