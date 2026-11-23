---
stage: ready
basis: SB-0011
test-first: unverified (pre-record)
approved-by: Davecelot
approved-on: 2026-11-08
approved-contract: sha256:425f09786bef2577d46c88a027b4b7e67f6762e495bf8102b25c2ba998dd3034
approved-plan: sha256:7fd719e5c85cfa06ec51d954543deac8b5ce5b11f549763322d86c0fab8526ad
---

# Plan: Pagination (planning gate)

Status: Approved under SB-0011 (owner pre-approval, 2026-11-08).

## Scope
Seven elements: `sb-pagination`, `-content`, `-item`, `-link`, `-previous`, `-next`, `-ellipsis`. Out of scope: computing page ranges, page-size selectors, disabled previous and next.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/pagination/Pagination.stories.ts` |
| 2 | `playwright/tests/pagination/pagination.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/pagination/Pagination.scss` -> `Pagination.styles.ts` (generated, shared) |
| 4 | one `.ts` per element, `index.ts` |

## Test plan (test-first)
- Navigation landmark name; list and list items; links with hrefs.
- `active` sets aria-current and the outlined look; previous and next names and visible text; ellipsis hidden from assistive technology.
- Sizes, hover colors from tokens, keyboard order and Enter, keyboard-only focus ring, forwarded aria-label, mirrored chevrons in right-to-left, axe.

## Accessibility deviations from the references
- 3px solid focus ring; the ellipsis words are hidden from assistive technology, as in the reference.

## Open questions (recommendation first)
All three answered with the recommendation: own anchor instead of sb-button; ellipsis aria-hidden; roles on the hosts.
