---
stage: ready
basis: SB-0011
test-first: unverified (pre-record)
approved-by: Davecelot
approved-on: 2026-11-08
approved-contract: sha256:30a69763bb3db56640f76a1134263e00324b239cfeb68b07350cdfb584e21ce6
approved-plan: sha256:49aae6b0206a53bee64ea6c0340a7aaf27cbec40625974111611030bdc4a6b5f
---

# Plan: Radio Group (planning gate)

Status: Approved under SB-0011 (owner pre-approval, 2026-11-08).

## Scope
`sb-radio-group` (form-associated: name, value, required, disabled, orientation) and `sb-radio-group-item` (value, label, disabled). Group owns exclusivity, the roving tab stop (`src/controllers/roving-focus.ts`, selection follows focus), posinset/setsize and form validity. State shared with `@lit/context`.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/radio-group/RadioGroup.stories.ts` |
| 2 | `playwright/tests/radio-group/radio-group.behavior.spec.ts` (written first, must fail) |
| 3 | `RadioGroup.scss` -> `RadioGroup.styles.ts` (generated; one sheet for both elements) |
| 4 | `RadioGroup.ts`, `RadioGroupItem.ts`, `context.ts`, `index.ts` |

## Test plan (test-first)
- Accessibility tree: radiogroup with the aria-label, N radios named by label, checked state, posinset/setsize.
- Selection by click, label click and Space; one checked at a time; `change` composed once with `detail.value`; none for code updates.
- Roving: tab stop on selected else first; arrows (four directions) select and wrap; RTL; Home/End; disabled skipped; Tab leaves the group.
- Forms: FormData name/value, nothing when none, `form.reset()` to the initial value, `<fieldset disabled>` and re-enable, `required` valueMissing and message, `reportValidity()` focuses the first radio, `<label for>` activation.
- Disabled group and item; horizontal layout; tokens (dot, border); focus ring keyboard-only; axe.

## Accessibility deviations from the references
- Items are native radios that are each a group of one; aria-posinset/setsize restore the set size (the reference implementation does the same).
- `aria-required` on the radiogroup instead of `required` on every inner radio (a common member-level pattern).
- Solid 3px focus ring instead of the visual reference's translucent ring.

## Open questions (recommendation first)
- Q1 native inputs: yes. Q2 group form-associated: yes. Q3 required: group valueMissing. Q4 label prop. Q5 no invalid styling. All answered.
