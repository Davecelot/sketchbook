# Plan: Switch (planning gate)

Status: **draft, not approved**. No approver was available when this was written, so the open questions below were answered with the recommendation (the SB-0011 convention). Tests and code start only after the owner accepts the plan or revisits an answer.

## Scope
Specification only: contract.json, contract.md, this plan and decision SB-0101. No component code yet.

The Switch is a form-associated on/off control (native `<input type="checkbox" role="switch">` in the shadow root, `FormAssociated` + `NativeControl` mixins) with label, description, error and two sizes (default, sm). In scope: form value, reset, disabled fieldset, `required` validity, keyboard, accessibility. Out of scope: indeterminate or loading states, an lg size, group/list layout (Field).

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` |

## Test plan (test-first)
Stories: default, checked, with description, error, required, disabled, in a disabled fieldset, hide-label, sm, rtl, in a form.
Behavior spec (see `realizations.web.coverage`):
- role switch, label is the name, `aria-checked` follows state, label click toggles
- Space toggles; Enter submits and does not toggle; keyboard focus ring visible
- `input` and `change` composed, once per toggle; none when `checked` is set from code
- FormData has `name=value` only while on; custom value; reset restores the attribute default; state restore
- `required` off: invalid (`valueMissing`), submit blocked, aria-hidden asterisk; on: valid
- `error` sets custom validity and `aria-invalid`; error in the accessible description
- disabled and disabled fieldset: cannot toggle, not submitted; re-enabling the fieldset restores it
- sizes measure 32x20 and 24x16; thumb moves to the other end under rtl
- axe clean on every story, light and dark; contrast pairs from the contract (check T6)

## Accessibility deviations from the references
- Track uses `color.input` (3:1) and the focus ring is solid, not translucent (WCAG 1.4.11).
- The sm track (24x16) is under 24px; accepted via the WCAG 2.5.8 spacing exception.
- Label is required (ID references do not cross the shadow root, SB-0009); the error is announced when it appears.
- Enter submits rather than toggles (SB-0009).

## Open questions (recommendation first; all answered with the recommendation)
1. Native input with `role="switch"` vs custom element + ARIA: native input. Revisit only if styling needs it.
2. `checked` reflected? No; the attribute is the reset default (as Checkbox).
3. `label` required? Yes; `hide-label` keeps it as the name.
4. Sizes? default and sm; no lg.
5. Enter toggles? No; it submits.
6. sm below 24px? Accepted via the spacing exception.
7. Value when off? Nothing is submitted.
8. Indeterminate or loading? No.

Registry: `Switch` is `draft`; it moves to `beta` only with evidence (stories, passing behavior spec, a11y audit).
