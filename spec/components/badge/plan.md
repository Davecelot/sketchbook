---
stage: ready
basis: SB-0011
test-first: unverified (pre-record)
approved-by: Davecelot
approved-on: 2026-11-08
approved-contract: sha256:66fc2a3f8609b6ed6fe468b60f5f6f9c4f8e03e86bcfa7eee068fbbbe48e537e
approved-plan: sha256:b067742fa4c1df90c6b56b4a916be27bf5619f5b0aae91a27fce64241d6bc8de
---

# Plan: Badge (planning gate)

Status: Approved under SB-0011 (owner pre-approval, 2026-11-08).

## Scope
`sb-badge`: six variants, optional `href` (native link), inline svg icons. Out of scope: dismissible badges, counts that announce changes, an invalid-state style.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/badge/Badge.stories.ts` |
| 2 | `playwright/tests/badge/badge.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/badge/Badge.scss` -> `Badge.styles.ts` (generated) |
| 4 | `src/components/badge/Badge.ts`, `index.ts` |

Semantic tokens added: `space.badge.padding-y`, `font.line-height.caption`.

## Test plan (test-first)
- Span by default, native link with `href`; name from text; variant reflects; swapping `href` swaps the element.
- Per-variant colors and border from tokens; pill shape, size, padding, gap, icon size.
- Link badge: hover change, keyboard focus ring, 24px minimum height, Enter navigates, host focus delegates.
- Plain badge: not focusable, no hover change.
- axe clean (variants, link variants, icon).

## Accessibility deviations from the references
Link badge minimum height 24px (2.5.8); solid focus ring (1.4.11); destructive not dimmed in dark mode (1.4.3).

## Open questions (recommendation first)
All three answered in contract.json (six variants; href; dark destructive).
