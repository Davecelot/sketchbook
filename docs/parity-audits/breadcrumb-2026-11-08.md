# Parity audit: Breadcrumb (2026-11-08)

Reference: `spec/components/breadcrumb/contract.{md,json}`. Implementation: `src/components/breadcrumb/`. Evidence: `npm run check` all pass; `tsc`, `eslint` clean; `playwright tests/breadcrumb` pass (serially; see flake note in the review). Tokens use only `--sb-breadcrumb-*`.

| Aspect | Contract | Realization | |
| --- | --- | --- | --- |
| Seven elements, props `label` (Breadcrumb), `href`, ellipsis `label` (More) | yes | Breadcrumb.ts, BreadcrumbLink.ts, BreadcrumbEllipsis.ts | ✅ |
| nav landmark named by label | yes | Breadcrumb.ts render | ✅ |
| List/item roles on hosts, before first render | yes | connectedCallback in BreadcrumbList.ts, BreadcrumbItem.ts | ✅ |
| Page: span role=link, aria-disabled, aria-current | yes | BreadcrumbPage.ts | ✅ |
| Separator presentation + aria-hidden, default chevron 16px | yes | BreadcrumbSeparator.ts | ✅ |
| Ellipsis label read, icon hidden, 36px | yes | BreadcrumbEllipsis.ts | ✅ |
| Gap 6px, 10px from 640px | token + `@media (min-width: 40em)` | Breadcrumb.scss:19 | ✅ (literal breakpoint, unavoidable in CSS) |
| Focus ring solid, keyboard only | yes | Breadcrumb.scss:55 | ✅ |
| Roles hosted once at connect; later moves | n/a | n/a | ➖ |

## Differences and action plan
1. Hover/focus-ring specs are timing-sensitive: failed 2 of 26 under the default parallel run, pass with `--workers=1` (code-side none; test fix: poll the hover/focus state, wait out the color transition).
2. contract.md `source:` line names the harness ("contract-first standard"); white-label wording (contract).

Verdict: matches contract (spec flake and wording aside).
