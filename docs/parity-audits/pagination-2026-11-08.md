# Parity audit: Pagination (2026-11-08)

Reference: `spec/components/pagination/contract.{md,json}`. Implementation: `src/components/pagination/`. Evidence: `npm run check` all pass; `tsc`, `eslint` clean; `playwright tests/pagination` pass (serially; see flake note in the review). Tokens use only `--sb-pagination-*`.

| Aspect | Contract | Realization | |
| --- | --- | --- | --- |
| nav landmark, list, listitem roles, `label` | yes | Pagination.ts, PaginationContent.ts, PaginationItem.ts | ✅ |
| Link `href`, `active` (aria-current), `size` | yes | PaginationLink.ts | ✅ |
| Previous/next names include visible word, rtl mirror | yes | PaginationPrevious.ts, PaginationNext.ts, Pagination.scss:94 | ⚠️ |
| Ellipsis aria-hidden, text kept | yes | PaginationEllipsis.ts | ✅ |
| 36px sizes, tokens, ring | yes | Pagination.scss | ✅ |

## Differences and action plan
1. Previous/Next: visible text is slottable but the accessible name is the `label` prop; translating the slot without `label` breaks label-in-name (WCAG 2.5.3). Contract documents "translate label values", so this is a usage hazard: consider deriving the name from the slot or warn.
2. Content and Item overwrite `role` unconditionally while other families only set it when absent (PaginationContent.ts, PaginationItem.ts). Make consistent.
3. Link without `href` renders `<a>` with no target (not focusable); contract says give every link an href; no guard or test.
4. Tab/Enter spec read `box-shadow` without polling and failed once under parallel load.

Verdict: matches contract (low-severity hardening).
