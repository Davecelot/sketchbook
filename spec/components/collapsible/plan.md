---
stage: ready
basis: SB-0011
test-first: unverified (pre-record)
approved-by: Davecelot
approved-on: 2026-11-08
approved-contract: sha256:1f5c7a8eb679ff62a4018dcb761d8008f8666110a09d1bc89a85a4a924f4824d
approved-plan: sha256:54ec1d3964cad414e81ca7290987fe518863e56ab8952e228721a8eaa33b8600
---

# Plan: Collapsible (planning gate)

Status: Approved under SB-0011 (owner pre-approval, 2026-11-08).

## Scope
`sb-collapsible`, `sb-collapsible-trigger`, `sb-collapsible-content` following the visual reference. `expanded`, `disabled`, an `sb-toggle` event, a height animation from motion tokens. Out of scope: lazy content, controlled-only mode.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/collapsible/Collapsible.stories.ts` |
| 2 | `playwright/tests/collapsible/collapsible.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/collapsible/Collapsible.scss` -> `Collapsible.styles.ts` (generated, shared by the three elements) |
| 4 | `Collapsible.ts`, `CollapsibleTrigger.ts`, `CollapsibleContent.ts`, `context.ts`, `index.ts` |

## Test plan (test-first)
- Trigger is a native button named by its text; `aria-expanded` follows `expanded`.
- Click, Enter and Space toggle; `sb-toggle` bubbles and is composed; fires for programmatic changes too.
- `disabled`: no toggle, native disabled, dimmed.
- `aria-controls` resolves to the content host (element reflection).
- Closed content: hidden, links inside are out of the tab order.
- Focus ring on keyboard focus only; transition duration from the token; none under reduced motion.
- Icon-only trigger named through forwarded `aria-label`. axe in open and closed states.

## Accessibility deviations from the references
- None beyond the 3px solid focus ring on the trigger.

## Open questions (recommendation first)
- Q1 aria-controls across roots: `ariaControlsElements` on the inner button. Answered: yes.
- Q2 events: `toggle`, bubbles and composed. Answered: yes.
- Q3 content role: none. Answered: none.
