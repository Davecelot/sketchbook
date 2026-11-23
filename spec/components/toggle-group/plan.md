---
stage: ready
basis: SB-0011
test-first: unverified (pre-record)
approved-by: Davecelot
approved-on: 2026-11-08
approved-contract: sha256:0ab7bf987a3202e26f236d7f147027bfd8fd00c5b9cb3ef925171318297008c9
approved-plan: sha256:2adc31ed1b74e6dd21e4034cb223900c897c7adb39b2298f61eb00905464dbb1
---

# Plan: Toggle Group (planning gate)

Status: Approved under SB-0011 (owner pre-approval, 2026-11-08).

## Scope
`sb-toggle-group` and `sb-toggle-group-item`: a set of toggle buttons. `selection` single or multiple, `variant`, `size`, `spacing`, `orientation`, `value`, `disabled`, `change`. Roving focus through `src/controllers/roving-focus.ts`. State shared with `@lit/context`; the group writes `data-position` on slotchange.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/toggle-group/ToggleGroup.stories.ts` |
| 2 | `playwright/tests/toggle-group/toggle-group.behavior.spec.ts` (written first, must fail) |
| 3 | `ToggleGroup.scss` -> `ToggleGroup.styles.ts` (generated; one sheet for both elements) |
| 4 | `ToggleGroup.ts`, `ToggleGroupItem.ts`, `context.ts`, `index.ts` |

## Test plan (test-first)
- Group is `role=group` named by aria-label; items are buttons with aria-pressed.
- single: pressing moves the selection, pressing again clears it; multiple: independent. `value` property and attribute; `change` composed, once, `detail.value`; no change for code updates.
- Roving: one tab stop (first pressed, else first enabled), arrows wrap, Home/End, vertical axis, RTL reverses, disabled skipped, arrows never press.
- Group disabled and item disabled; fieldset disabled.
- Layout: joined (spacing 0) shares borders and only outer corners round; spacing > 0 gaps; data-position values; vertical stacks.
- Token colors, focus ring keyboard-only, axe clean.

## Accessibility deviations from the references
- Solid 3px focus ring instead of ring/50.
- Single mode uses aria-pressed, not radio semantics (the visual reference uses radio there): the item can be cleared.

## Open questions (recommendation first)
- Q1 radio vs pressed: pressed. Answered.
- Q2 roving in multiple: yes. Answered.
- Q3 value shape: string[]. Answered.
- Q4 per-item variant/size: no. Answered.
