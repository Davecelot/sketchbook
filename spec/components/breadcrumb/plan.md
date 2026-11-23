---
stage: ready
basis: SB-0011
test-first: unverified (pre-record)
approved-by: Davecelot
approved-on: 2026-11-08
approved-contract: sha256:4d7828ebced8c66b1eda474d834d15a002767eb08accf963ec2c61373cb0f8b7
approved-plan: sha256:99d7a86f0860260c9393baf3f7e58f0ce93146abd33b0c739dc57db91dcfb1a6
---

# Plan: Breadcrumb (planning gate)

Status: Approved under SB-0011 (owner pre-approval, 2026-11-08).

## Scope
`sb-breadcrumb` plus list, item, link, page, separator and ellipsis. Landmark with a name, list semantics through host roles, current page marked.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/breadcrumb/Breadcrumb.stories.ts` |
| 2 | `playwright/tests/breadcrumb/breadcrumb.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/breadcrumb/Breadcrumb.scss` -> `Breadcrumb.styles.ts` (generated, shared) |
| 4 | `Breadcrumb.ts`, `BreadcrumbList.ts`, `BreadcrumbItem.ts`, `BreadcrumbLink.ts`, `BreadcrumbPage.ts`, `BreadcrumbSeparator.ts`, `BreadcrumbEllipsis.ts`, `index.ts` |

## Tokens
`breadcrumb.*` aliases semantic tokens (`space.stack.*` shared).

## Test plan (test-first)
- Accessibility tree (CDP): one navigation named by `label`; one list whose semantic children are all listitems, one per step; separators absent; current page is a disabled, unfocusable link node marked aria-current=page (the AX tree has no current property).
- Links: role link with href, Tab order, solid focus ring on keyboard focus only, Enter follows the link, hover color.
- Ellipsis label is read; icon hidden.
- Default chevron and a replaced separator.
- Layout: wrapping, gap 6px and 10px from 640px; colors in light and dark; axe clean.

## Accessibility deviations from the references
- Current page is a non-focusable `role=link` with `aria-disabled` and `aria-current=page`; aria-current alone is not exposed on a generic node.
- Ellipsis label is exposed instead of hidden.

## Open questions
- Q1 List semantics across elements: answered, host roles.
- Q2 Current page: answered, disabled link role with aria-current.
- Q3 Ellipsis: answered, label read.
