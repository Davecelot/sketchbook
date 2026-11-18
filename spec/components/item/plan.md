# Plan: Item (planning gate)

Status: Approved under SB-0011 (owner pre-approval, 2026-11-08).

## Scope
`sb-item` (variant, size, href) and ten parts: group, separator, media (variant primary|icon|image), content, title, description, actions, header, footer.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/item/Item.stories.ts` |
| 2 | `playwright/tests/item/item.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/item/Item.scss` -> `Item.styles.ts` (generated, shared) |
| 4 | `Item.ts`, `ItemGroup.ts`, `ItemSeparator.ts`, `ItemMedia.ts`, `ItemContent.ts`, `ItemTitle.ts`, `ItemDescription.ts`, `ItemActions.ts`, `ItemHeader.ts`, `ItemFooter.ts`, `index.ts` |

## Tokens
`item.*` aliases semantic tokens (shared `space.stack.*`, `size.media.*`).

## Test plan (test-first)
- Layout, padding, gap, radius per variant and size; reflection; colors in light and dark.
- `href`: native link with a name, focus ring for keyboard only, hover tint, Enter follows; no link without href.
- Accessibility tree: group is a list whose semantic children are only listitems; standalone item has no role.
- Media frames; media alignment when a description exists; second content does not grow; header and footer span the row.
- Typography; links in the description; axe clean on all stories.

## Accessibility deviations from the references
- Solid 3px focus ring instead of a half-strength one.
- No two-line description clamp.
- Explicit list roles; presentational separator.

## Open questions
- Q1 Link row: answered, `href`.
- Q2 List semantics: answered, host roles.
- Q3 Description clamp: answered, dropped.
- Q4 Second content block: answered, `data-fixed`.
