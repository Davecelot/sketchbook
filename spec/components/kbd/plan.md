---
stage: ready
basis: SB-0011
test-first: unverified (pre-record)
approved-by: Davecelot
approved-on: 2026-11-08
approved-contract: sha256:01956ae55ad46c810b3ee37ebc1c1ff3fbe43ceb7193c76eed8592d2ec2e3db2
approved-plan: sha256:eec45a6e2d62ef2689fff88c8f9a7b8daa9d63ac9e034c2e15a72712d95c0eac
---

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
