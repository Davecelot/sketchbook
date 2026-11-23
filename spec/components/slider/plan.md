---
stage: ready
basis: SB-0011
test-first: unverified (pre-record)
approved-by: Davecelot
approved-on: 2026-11-08
approved-contract: sha256:910c50ecac03cb2420c8856d431fcdff91a1d47ed0bc04b7ac84ed8ef6ea595e
approved-plan: sha256:60b73e80a44e12d2f598b5ea9d4699646b6c97da1f0d902c97457822809dc743
---

# Plan: Slider (planning gate)

Status: Approved under SB-0011 (owner pre-approval, 2026-11-08).

## Scope
`sb-slider`: native `<input type="range">` per value inside one shadow root, drawn with a custom track and filled range; horizontal and vertical; one or two thumbs; form-associated.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/slider/Slider.stories.ts` |
| 2 | `playwright/tests/slider/slider.behavior.spec.ts` (first, must fail) |
| 3 | `src/components/slider/Slider.scss` -> `Slider.styles.ts` |
| 4 | `src/components/slider/Slider.ts`, `index.ts` |

## Test plan
Name and label click, one slider role per value with distinct names for a range, keyboard (arrows, Home, End, Page keys), vertical (ArrowUp increases, aria-orientation), min/max/step, thumb clamping, track press on a range, filled range geometry, input/change composed, focus ring, form value (one entry per thumb), reset, disabled, disabled fieldset, error validity, axe.

## Accessibility deviations
- Unfilled track below 3:1 (visual choice); thumb and range meet it.
- Solid focus ring.

## Open questions (recommendation first)
- Range as two native inputs, names via aria-label (contract Q1, Q2).
- Semantic tokens added: `size.slider.vertical-length` (64px unit; the control is 3 units) and `size.slider.track` (6px).
