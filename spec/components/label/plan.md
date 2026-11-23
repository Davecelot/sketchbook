---
stage: ready
basis: SB-0011
test-first: unverified (pre-record)
approved-by: Davecelot
approved-on: 2026-11-08
approved-contract: sha256:fe7009958f3d7e3cc82414287d269d2edbe5d3881b5e74d4f20e1204beb79ecc
approved-plan: sha256:2647bacb41bb2798ed4789900aabdb4116963aa59356db0da7ae8f0dc699adf5
---

# Plan: Label (planning gate)

Status: Approved under SB-0011 (owner pre-approval, 2026-11-08).

## Scope
`sb-label`: slotted text, `for` and wrapping association, click forwarding, `aria-labelledby` naming on same-tree controls, `disabled`. Out of scope: required indicator, mirroring the control's state, naming controls inside other shadow roots.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/label/Label.stories.ts` |
| 2 | `playwright/tests/label/label.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/label/Label.scss` -> `Label.styles.ts` (generated) |
| 4 | `src/components/label/Label.ts`, `index.ts` |

No new semantic tokens.

## Test plan (test-first)
- Look from tokens (flex, size, weight, line height, color, gap); icon beside text.
- `for` + native checkbox: click toggles it; `for` + native text input: click focuses it; wrapped control works.
- `for` + sb-input (form-associated, shadow input): click focuses the inner input.
- A role-bearing custom host is named by the label and toggled by clicking it.
- Native input gets its accessible name; existing aria-labelledby is kept; cleanup when `for` changes or the label is removed; control that appears after the label.
- Disabled dims and stops forwarding; links inside are not forwarded; not focusable; axe clean.

## Accessibility deviations from the references
The visual reference gets naming from a native label element; sb-label cannot be one, so it names through aria-labelledby (same tree only). Documented in the contract's association rules.

## Open questions (recommendation first)
Both answered in contract.json (behavior-based association; disabled as a prop).
