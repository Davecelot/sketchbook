# Plan: Scroll Area (planning gate)

Status: Approved under SB-0011 (owner pre-approval, 2026-11-08).

## Scope
`sb-scroll-area` (label) and `sb-scroll-bar` (orientation, axis marker). Native overflow, themed thin scrollbars, keyboard access while scrollable. Out of scope: custom-drawn scrollbars, scroll-linked events, hover-only scrollbars.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/scroll-area/ScrollArea.stories.ts` |
| 2 | `playwright/tests/scroll-area/scroll-area.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/scroll-area/ScrollArea.scss` -> `ScrollArea.styles.ts` (generated) |
| 4 | `ScrollArea.ts`, `ScrollBar.ts`, `index.ts` |

## Test plan (test-first)
- Native vertical scrolling; horizontal only with a horizontal sb-scroll-bar.
- Scrollable: tabindex 0, region named by label; not scrollable: neither.
- Keyboard scrolling with arrows after Tab; keyboard-only focus ring.
- Scrollbar styling from tokens; overflow re-checked when content grows; one-time missing-label warning; axe.

## Accessibility deviations from the references
- The reference draws its own scrollbar parts and has no keyboard stop; this uses native scrollbars and adds the focus stop. Thumb uses `input` for 3:1.

## Open questions (recommendation first)
All three answered with the recommendation: native scrollbars with an axis marker element; focus stop and region while overflowing; `input` thumb color.
