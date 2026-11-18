# Plan: Switch (planning gate)

Status: **draft, awaiting approval**. The contract passes `npm run check`. Tests and code start only after approval (planning gate, then test-first). This session wrote the specification only; nothing below has been built.

## Scope
One form-associated element, `sb-switch`, as specified in [contract.json](./contract.json): label, description, error, sizes `default` and `sm`, name/value submission while on, reset to the `checked` attribute, disabled and disabled-fieldset handling, `required` (must be on) and `error` validity. No new semantic tokens: the component tokens alias the existing `size.switch.*`, `space.switch.inset` and color tokens. No change to `spec/api.json`: `checked`, `error` and `size` (`default`/`sm`) are already registered aliases.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` |

Stories: Default, Checked, WithDescription, Error, Required, Disabled, Small, HiddenLabel, InForm (submit and reset buttons), InDisabledFieldset, RTL.

## Test plan (test-first)
Name and role
- role is `switch`, name is the label; `hide-label` keeps the name; missing label logs one dev warning
- description and error are in the accessible description; `aria-invalid` only when invalid; error region is `aria-live=polite` and present before the text
- thumb is aria-hidden; required asterisk is aria-hidden

Operation
- click on the track toggles; click on the label toggles
- Space toggles; Enter does not toggle and calls `requestSubmit()` on the owning form
- Tab reaches it; disabled is skipped by Tab and ignores click and Space
- `input` and `change` fire once per user toggle, both composed and bubbling; setting `checked` in code fires neither
- keyboard focus shows the ring; mouse focus does not

Form participation
- `FormData` has `name=on` while on, no entry while off; custom `value` is submitted
- form reset restores the `checked` attribute default (both from on and from off)
- `disabled` and a disabled ancestor `<fieldset>` remove it from `FormData`; re-enabling the fieldset restores the author's own `disabled`
- `required` + off: `validity.valueMissing`, `checkValidity()` false, submit blocked; turning it on makes it valid
- `error` set: `validity.customError`, submit blocked; clearing it restores validity
- invalid styling appears after blur or a submit attempt, not on first render

Look
- default track 32×20, thumb 16; sm track 24×16, thumb 12
- thumb at the inline end when on; mirrored under `dir=rtl`
- on and off tracks paint differently; invalid track border uses `--sb-switch-border-invalid`
- no transition under `prefers-reduced-motion: reduce`
- axe clean on all stories, light and dark

## Accessibility deviations from the references
- Off track and border use `color.input` (3:1) instead of the reference's lighter border (WCAG 1.4.11).
- Solid 3px focus ring instead of a translucent one (WCAG 1.4.11).
- Track heights rounded to 20px / 16px so thumb and inset are whole pixels.
- Enter submits the form instead of toggling (SB-0009; APG makes Enter optional).
- Required, invalid state, error message and reset added; the reference has name/value only.

## Open questions (recommendation first)
All taken with the recommendation because no reviewer was available; each is recorded as answered in contract.json so the owner can revisit it.
1. Native checkbox input with `role=switch` — **chosen** (over a custom `<button role=switch>`).
2. Enter submits the form, Space toggles — **chosen** (over Enter toggling).
3. `checked` attribute is the reset default, not reflected — **chosen** (same as Checkbox).
4. Sizes `default` and `sm` from existing tokens — **chosen** (no `lg`: no reference size and no token).
5. Label after the switch — **chosen** (trailing switch deferred).
6. `required` means must be on — **chosen**; usage steers consent to Checkbox.
7. 150ms thumb slide, none under reduced motion — **chosen**.
8. Manual screen-reader pass — **open**, after implementation.
