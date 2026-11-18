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
