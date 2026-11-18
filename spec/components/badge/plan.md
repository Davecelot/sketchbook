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
