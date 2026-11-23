---
stage: ready
basis: SB-0011
test-first: unverified (pre-record)
approved-by: Davecelot
approved-on: 2026-11-08
approved-contract: sha256:3b3180bfc924d7f5da0e82a950ed7abd283b79d2937271aa43a2f43c2df01622
approved-plan: sha256:8fda9858ae481986c745a133a47bd5e465d471a3e778f7622452200a47b2b889
---

# Plan: Textarea (planning gate)

Status: Approved under SB-0011 (owner pre-approval, 2026-11-08).

## Scope
`sb-textarea`, a multi-line field with the label layout built in (label, description, error), modeled on Input. Form-associated: value, validity, reset, disabled fieldset. Min height 64px, vertical resize. Out of scope: auto-grow (field-sizing), character counter.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/textarea/Textarea.stories.ts` |
| 2 | `playwright/tests/textarea/textarea.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/textarea/Textarea.scss` -> `Textarea.styles.ts` (generated) |
| 4 | `src/components/textarea/Textarea.ts`, `index.ts` |

## Test plan (test-first)
- Label names the field; clicking it focuses the textarea; min height 64px; vertical resize.
- hide-label keeps the name; description and error are the accessible description; aria-invalid.
- Native validity after blur, not while typing; required asterisk is aria-hidden.
- input/change reach the host (bubbles, composed).
- Enter inserts a newline and does not submit.
- Focus ring on keyboard focus.
- Forms: value, required validity, minlength, reset, disabled, disabled fieldset and re-enable, error customError.
- axe on all stories.

## Accessibility deviations from the references
- From the visual reference: border 3:1, solid focus ring.

## Open questions (recommendation first)
- Does Enter submit? No: native textarea inserts a newline; no implicit submission.
- Auto-grow? No: vertical resize per brief.
- Semantic tokens: added `size.control.textarea-min` (64px) and `space.control.padding-y.textarea` (8px).
