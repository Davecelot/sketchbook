# Plan: Tabs (planning gate)

Status: Approved under SB-0011 (owner pre-approval, 2026-11-08).

## Scope
`sb-tabs`, `-list` (variant primary|line), `-trigger`, `-content`: value, orientation, automatic and manual activation, roving focus, `change`. Out of scope: scrolling overflow, closable tabs.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/tabs/Tabs.stories.ts` |
| 2 | `playwright/tests/tabs/tabs.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/tabs/Tabs.scss` -> `Tabs.styles.ts` (generated, shared) |
| 4 | `Tabs.ts`, `TabsList.ts`, `TabsTrigger.ts`, `TabsContent.ts`, `context.ts`, `index.ts` |

## Test plan (test-first)
- Roles tablist, tab, tabpanel; names; only the selected panel displayed.
- Initial selection from `value` or first enabled; click selects; `change` detail, bubbles, composed, not for code changes.
- Keyboard: one tab stop, arrows wrap, Home/End, disabled skipped, Tab reaches the panel; manual activation; vertical orientation; right-to-left reverses.
- `aria-controls` and the panel name in the accessibility tree.
- Variants from tokens; focus ring keyboard-only; disabled; axe.

## Accessibility deviations from the references
- 3px solid focus ring; inactive tab text uses `muted-foreground` in both modes (documented drift).

## Open questions (recommendation first)
All four answered with the recommendation: tabindex on the trigger host; element references across roots with an aria-label fallback; manual activation as a prop; `value-change` event name.
