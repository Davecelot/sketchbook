---
stage: ready
basis: SB-0011
test-first: unverified (pre-record)
approved-by: Davecelot
approved-on: 2026-11-08
approved-contract: sha256:34572b41dd273bf93b2662eba8b7511a9622324a1d6e77f85718a2cf0c4ba483
approved-plan: sha256:7dd1a69fccc23d93c3b3f6254824341c85b7d7492fe628ea7e5ef46a9c5dbbe7
---

# Plan: Native Select (planning gate)

Status: Approved under SB-0011 (owner pre-approval, 2026-11-08).

## Scope
`sb-native-select`: a native `<select>` in the shadow root with the Field layout (label, description, error), sizes default and sm, chevron icon. Options come from plain light-DOM `<option>` and `<optgroup>` children, mirrored by a MutationObserver. Form-associated.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/native-select/NativeSelect.stories.ts` |
| 2 | `playwright/tests/native-select/native-select.behavior.spec.ts` (first, must fail) |
| 3 | `src/components/native-select/NativeSelect.scss` -> `NativeSelect.styles.ts` |
| 4 | `src/components/native-select/NativeSelect.ts`, `index.ts` |

## Test plan
Name and label click focus, options and optgroups mirrored (and updated when children change), default selection rules, change/input composed, typing selects an option, sizes, focus ring, required/error validity, form value, reset, disabled, disabled fieldset, label for, axe.

## Accessibility deviations
- From the visual reference: border 3:1, solid focus ring.

## Open questions (recommendation first)
- Option elements: separate custom elements or plain children? Plain light-DOM children mirrored into the shadow select (recorded in contract Q1).
- Semantic tokens: none added.
