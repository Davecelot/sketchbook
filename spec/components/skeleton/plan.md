---
stage: ready
basis: SB-0011
test-first: unverified (pre-record)
approved-by: Davecelot
approved-on: 2026-11-08
approved-contract: sha256:af829fc50c2fdbe4a9e0ae78141a17744e31001d201f80a1bcb0a0572046ca9c
approved-plan: sha256:dc835b3880d036336cea05a67eb50c1808245b47a84b8e1cb32182a615c97c3b
---

# Plan: Skeleton (planning gate)

Status: Approved under SB-0011 (owner pre-approval, 2026-11-08).

## Scope
`sb-skeleton`: a hidden, pulsing block sized by the author. No props. Out of scope: shimmer variants, built-in text-line or avatar presets.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/skeleton/Skeleton.stories.ts` |
| 2 | `playwright/tests/skeleton/skeleton.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/skeleton/Skeleton.scss` -> `Skeleton.styles.ts` (generated) |
| 4 | `src/components/skeleton/Skeleton.ts`, `index.ts` |

Semantic token added: `opacity.pulse` (0.5).

## Test plan (test-first)
- aria-hidden on the host from first render; absent from the accessibility tree.
- Fill, radius from tokens; radius overridable through `--sb-skeleton-radius`; sized by the author's CSS.
- Pulse animation runs at twice the loop duration; static with reduced motion.
- Not focusable; axe clean.

## Accessibility deviations from the references
Reduced motion stops the pulse (the visual reference keeps pulsing).

## Open questions (recommendation first)
Both answered in contract.json (static under reduced motion; no size props).
