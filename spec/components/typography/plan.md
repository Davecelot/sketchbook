---
stage: ready
basis: SB-0011
test-first: unverified (pre-record)
approved-by: Davecelot
approved-on: 2026-11-08
approved-contract: sha256:ff6559cb1140c660db8ca90b7cb4853c5fdf3e472ab010ccc6ec441355ee4e65
approved-plan: sha256:d17e6013b6f80f09221e3900aa4cfda37afcadcf18c6691499bc506826bb45b6
---

# Plan: Typography (planning gate)

Status: Approved under SB-0011 (owner pre-approval, 2026-11-08).

## Scope
`sb-typography`: one element with a `kind` (h1, h2, h3, h4, p, blockquote, list, inline-code, lead, large, small, muted) that renders the matching native element in its shadow root. Inline kinds (`inline-code`, `small`) are inline-level.

Out of scope: the Typeset prose system, tables (see Table), heading level override.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/typography/Typography.stories.ts` |
| 2 | `playwright/tests/typography/typography.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/typography/Typography.scss` -> `Typography.styles.ts` (generated) |
| 4 | `src/components/typography/Typography.ts`, `index.ts` |

Tokens: component tokens in the contract alias semantic tokens. Added semantic tokens (base.tokens.json): `font.size.{heading-1..4,prose,lead,large}`, `font.weight.{heading,display}`, `font.line-height.{heading-1..4,lead,large,prose}`, `space.prose.*`, `border-width.quote`.

## Test plan (test-first)
- Each kind renders its native element (heading levels, p, blockquote, ul, code, div, small) with part `text`.
- Default kind is `p`; `kind` reflects; changing it swaps the element.
- Per-kind size, weight, line height from component tokens (computed style equals the token).
- Inline-code and small are inline; others block. Top margin only when not first child.
- h2 bottom rule, blockquote left bar and italic, inline-code mono on muted background, lead and muted color.
- list: slotted `li` are list items of the list (accessibility tree), disc markers.
- Not focusable. axe clean on the overview story.

## Accessibility deviations from the references
None needed. Contrast pairs recorded in the contract.

## Open questions (recommendation first)
- Q1 one element with `variant` (answered: yes). Q2 heading `level` prop (answered: no). Q3 which reference scale (answered: the classic one). Recorded in contract.json.

## Known drift (to log in realizations)
- h1 weight bold (700): the foundation scale has no extrabold (800).
- No tight tracking (-0.025em): no letter-spacing tokens exist; a literal would add a T5 warning that the harness T5 test counts.
- inline-code radius 6px (`radius.small`); the visual reference uses 4px.
- inline-code padding 4px / 6px instead of 3.2px / 4.8px.
