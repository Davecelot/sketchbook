---
stage: ready
basis: plan Status line (2026-11-08)
test-first: unverified (pre-record)
approved-by: Davecelot
approved-on: 2026-11-08
approved-contract: sha256:8a4117d91a05308767df8c1cc65fc4cf2a0eab4c3aa9a85d53386df83d24310a
approved-plan: sha256:df84cd02bb575507cb30d834983db497ee8a075d43fffc039daef3f2910d8c6e
---

# Plan: Input (planning gate)

Status: **approved 2026-11-08** (owner approved both plans; Q4 answered yes, SB-0006). Built test-first; now beta.

## Scope
`sb-input`: a single-line field with the label, description and error built in because shadow DOM keeps an external `<label for>` from reaching the inner input . States focus-visible, invalid, disabled, readonly. Form-associated: value, validity, reset.

Out of scope: Input Group adornments, Textarea, stand-alone Label and Field components.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/input/Input.stories.ts`: default, with description, with error, required, disabled, readonly, hidden label, each type |
| 2 | `playwright/tests/input/input.behavior.spec.ts`: written first, must fail |
| 3 | `src/mixins/native-control.ts`: label/description wiring, change re-dispatch, missing-name warning (`NativeControl`), on top of `form-associated.ts` |
| 4 | `src/components/input/Input.scss` → `Input.styles.ts` (generated) |
| 5 | `src/components/input/Input.ts`, `index.ts` |

## Test plan (test-first)
- Label is the accessible name; clicking it focuses the input; `hide-label` keeps the name.
- Description and error are in the accessible description; `aria-invalid` only when invalid.
- Invalid appears after blur or submit, not on the first keystroke; the error is announced once (live region text changes).
- `input` and `change` reach the host (bubbles, composed); `change` only on commit.
- Forms: value in FormData; required and pattern block submit through validity; reset restores the default; disabled is not submitted.
- Required: native required on the input; asterisk is aria-hidden.
- axe: no violations in each story.

## Accessibility deviations from the references
- From the visual reference: input border 3:1 (neutral-500), solid focus ring.
- From the reference implementation: error announced when it appears.

## Open questions
None. Label placement, required marker and sizes were answered on 2026-11-08 (see contract.json openQuestions).
