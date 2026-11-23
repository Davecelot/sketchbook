---
stage: ready
basis: SB-0011
test-first: unverified (pre-record)
approved-by: Davecelot
approved-on: 2026-11-08
approved-contract: sha256:c01f97ae609cca53bf9f75ce58fa50bf6a8805a9210c872dd67e5ab688e8bfb4
approved-plan: sha256:3eb7ded7b25b04a0c9a025a6d5228b313bcdb6b78a8a98041599011517955188
---

# Plan: Checkbox (planning gate)

Status: Approved under SB-0011 (owner pre-approval, 2026-11-08).

## Scope
`sb-checkbox`: native checkbox in the shadow root with the Field horizontal layout (box, label, description, error). Form-associated. checked, indeterminate, disabled, required, value, error.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/checkbox/Checkbox.stories.ts` |
| 2 | `playwright/tests/checkbox/checkbox.behavior.spec.ts` (first, must fail) |
| 3 | `src/components/checkbox/Checkbox.scss` -> `Checkbox.styles.ts` |
| 4 | `src/components/checkbox/Checkbox.ts`, `index.ts` |

## Test plan
Name and label click, Space toggles, indeterminate (mixed, cleared on toggle), required/error validity, input and change composed, focus ring, form value (only while checked, custom value), reset to the attribute default, disabled, disabled fieldset, label for, axe.

## Accessibility deviations
- From the visual reference: border 3:1, solid focus ring.

## Open questions (recommendation first)
- Is `selected` reflected? No: the attribute stays the reset default.
- Semantic token added: `radius.xsmall` (4px in the default brand), aliasing the foundation `radius.xs` so it follows radius.style.
