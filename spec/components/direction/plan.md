---
stage: ready
basis: SB-0011
test-first: unverified (pre-record)
approved-by: Davecelot
approved-on: 2026-11-08
approved-contract: sha256:381ecd81c6f65a1784af497044e9446328e1f026021ce933d89ad8b071eac90e
approved-plan: sha256:26ba16df495d10008609e6d48b42caf5b8e64d8f7b75845c4a1491009d700344
---

# Plan: Direction (planning gate)

Status: Approved under SB-0011 (owner pre-approval, 2026-11-08).

## Scope
`sb-direction` with a `dir` prop that sets the native `dir` attribute on its host, `display: contents`. Proof that Tabs and Pagination follow it. Out of scope: a direction context, `lang`.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/direction/Direction.stories.ts` |
| 2 | `playwright/tests/direction/direction.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/direction/Direction.scss` -> `Direction.styles.ts` (generated) |
| 4 | `src/components/direction/Direction.ts`, `index.ts` |

## Test plan (test-first)
- `dir` reflects and the subtree's computed direction follows; live changes; nesting; no box.
- Roving focus in sb-tabs reverses under rtl and flips back; Pagination chevrons mirror; axe.

## Accessibility deviations from the references
None.

## Open questions (recommendation first)
Both answered with the recommendation: `display: contents`; direction read from the platform.
