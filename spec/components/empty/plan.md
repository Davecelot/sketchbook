---
stage: ready
basis: SB-0011
test-first: unverified (pre-record)
approved-by: Davecelot
approved-on: 2026-11-08
approved-contract: sha256:af20472141c0abd8d89644dc5e8e2e8452bbdb3ec74ce1d44a3353759e140057
approved-plan: sha256:e46f17708d1394fe3231c16ca255411f8c89821c2b664ec3e8986e3b1c3501b6
---

# Plan: Empty (planning gate)

Status: Approved under SB-0011 (owner pre-approval, 2026-11-08).

## Scope
`sb-empty` with `sb-empty-header`, `sb-empty-media` (variant primary|icon), `sb-empty-title`, `sb-empty-description`, `sb-empty-content`. Non-interactive layout.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/empty/Empty.stories.ts` |
| 2 | `playwright/tests/empty/empty.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/empty/Empty.scss` -> `Empty.styles.ts` (generated, shared by all parts) |
| 4 | `Empty.ts`, `EmptyHeader.ts`, `EmptyMedia.ts`, `EmptyTitle.ts`, `EmptyDescription.ts`, `EmptyContent.ts`, `index.ts` |

## Tokens
`empty.*` aliases semantic tokens. Added semantic token: `space.inset.spacious` (48px), with the shared `space.stack.*`, `size.media.*`, `size.icon.xl` and `font.*.heading-lg`.

## Test plan (test-first)
- Layout: centered column, padding 24px and 48px from 768px, gap, header and content max width.
- Media: icon variant is a 40px muted rounded square with a 24px svg; default has no box; `variant` reflects.
- Typography and colors in light and dark; description links underlined, primary on hover.
- No roles; axe clean on all stories.

## Accessibility deviations from the references
None. Description links stay underlined.

## Open questions
- Q1 Border: answered, none built in.
- Q2 Responsive padding: answered, media query at 48em.
