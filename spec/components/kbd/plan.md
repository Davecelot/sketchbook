# Plan: Kbd (planning gate)

Status: Approved under SB-0011 (owner pre-approval, 2026-11-08).

## Scope
`sb-kbd` (a key) and `sb-kbd-group` (a combination), the Kbd and KbdGroup parts. No props. Out of scope: tooltip restyle, platform-specific symbol mapping.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/kbd/Kbd.stories.ts` |
| 2 | `playwright/tests/kbd/kbd.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/kbd/Kbd.scss` -> `Kbd.styles.ts` (generated; shared by both elements) |
| 4 | `src/components/kbd/Kbd.ts`, `KbdGroup.ts`, `index.ts` |

Semantic tokens added: `size.key` (20px), `space.key.padding-x` (4px).

## Test plan (test-first)
- sb-kbd renders a native kbd with the slotted text; 20px high, min 20px wide, grows with long text.
- Colors, font and radius resolve from component tokens; slotted svg is 12px.
- Group is inline-flex with the gap token; contains keys in order.
- Not focusable, no role added; axe clean.

## Accessibility deviations from the references
None. Icon-only keys need an author-provided text alternative (documented).

## Open questions (recommendation first)
Both answered in contract.json: separate `sb-kbd-group` (yes); tooltip restyle (not reproduced).
