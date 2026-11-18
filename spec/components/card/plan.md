# Plan: Card (planning gate)

Status: Approved under SB-0011 (owner pre-approval, 2026-11-08).

## Scope
`sb-card` and six parts (`sb-card-header`, `-title`, `-description`, `-action`, `-content`, `-footer`) with `size` medium|small. Non-interactive surface.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/card/Card.stories.ts` |
| 2 | `playwright/tests/card/card.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/card/Card.scss` -> `Card.styles.ts` (generated, shared by all parts) |
| 4 | `Card.ts`, `CardHeader.ts`, `CardTitle.ts`, `CardDescription.ts`, `CardAction.ts`, `CardContent.ts`, `CardFooter.ts`, `index.ts` |

## Tokens
Component tokens `card.*` alias semantic tokens. Added semantic tokens: `space.stack.*`, `font.size.heading`, `font.weight.heading`, `font.line-height.heading` (shared with the other Wave 1b components).

## Test plan (test-first)
- Surface: border, radius, padding, gap and colors resolve from tokens in light and dark.
- `size=small` changes padding, gap and the inset of header, content and footer.
- Header: `data-has-action` appears and disappears as an action is added or removed; with an action, the action sits at the end and title and description stay at the start.
- Title and description typography.
- No roles anywhere; all seven tags are registered; axe clean on the default and action stories.

## Accessibility deviations from the references
None.

## Open questions
- Q1 Header action detection: answered, host attribute from `slotchange`.
- Q2 Header and footer borders: answered, out of scope for v1.
