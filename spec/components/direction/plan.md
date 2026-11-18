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
