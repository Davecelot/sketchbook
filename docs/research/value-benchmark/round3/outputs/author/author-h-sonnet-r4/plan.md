# Plan: Switch

Status: approved by default (SB-0101): nobody was available, so every open question took its recommendation. Revisit any answer below by a new decision.

## Scope
`sb-switch`: an on/off form control with `label`, `hide-label`, `description`, `error`, `size` (`default`, `sm`), `name`, `value`, `checked`, `required`, `disabled`. Out of scope: read-only, indeterminate, a switch group, a Field set.

## Files
- `src/components/switch/Switch.ts`, `Switch.scss`, `Switch.stories.ts`, `index.ts`
- `Switch.styles.ts` and `src/index.ts` are generated (`npm run generate`)
- `playwright/tests/switch/switch.behavior.spec.ts`
- Registry entry already added; statuses move `draft` -> `wip` -> `beta` as gates pass.

## Tokens
Component tokens in the contract alias semantic tokens only (one step). Existing `size.switch.*` and `space.switch.inset` supply track size and thumb inset. No new semantic token needed.

## Approach
- `class Switch extends NativeControl(FormAssociated(LitElement))` (rule form-associated-controls). Hooks: `formValue()` returns `value` while checked, else `null`; `formReset()` restores the `checked` attribute; `formStateRestore()` restores on/off; `validationAnchor()` is the inner input.
- Inner `<input type="checkbox" role="switch" ?disabled=${this.isDisabled}>`; thumb drawn with CSS from `:checked`, mirrored under `:dir(rtl)`.
- `syncFormState()` runs synchronously in the input handler so a `change` listener reads the new `FormData`.
- Click on the host from `<label for>` is forwarded to the input (NativeControl).
- `error` sets a `customError` validity (SB-0009); Enter calls `requestSubmit()` via `submitOnEnter`.
- Host styled dimmed with `:host(:disabled)`.

## Accessibility
Native input with `role="switch"` gives name, state, Space and focus. `aria-describedby` to description and error, `aria-invalid` when invalid, polite live region for the error, aria-hidden asterisk and thumb, 3px solid focus ring, 3:1 track and thumb contrast, 24px row height for target size, dev warning on empty label. Respect reduced motion for the thumb transition.

## Test plan (test-first)
Write the story and spec first, run `npm run test:component -- tests/switch`, confirm each test fails because the element is missing, and record that. One test each for:
- label is the accessible name; `role=switch`; `<label for>` click toggles; `hide-label` keeps the name
- Space toggles; Enter does not toggle but submits; Tab focus with visible ring
- `size` default and sm dimensions (32x20, 24x16); row at least 24px high
- `checked` property and attribute; checked paints differently; thumb moves, mirrored in RTL
- `input` and `change` composed, once per toggle
- description and error in the accessible description; `aria-invalid`; error `customError` blocks submit
- `required`: native `required`, valueMissing while off, valid when on, aria-hidden asterisk, invalid after blur
- `disabled` cannot toggle, not submitted
- FormData: `name=value` only while on; custom `value`; none without `name`
- `form.reset()` returns to the `checked` attribute
- `<fieldset disabled>` disables and un-submits; re-enable restores; the `disabled` attribute is untouched
- `formStateRestore` restores on/off
- axe clean on all stories (both sizes, on, off, error, required, disabled)

## Risks
- Track is 20px high, below 24px: relies on the row target (Q6); verify in the spec.
- Native `role="switch"` on a checkbox is exposed differently across screen readers; check in the live keyboard pass.
- Thumb travel must follow `:dir(rtl)`.

## Open questions (all answered with the recommendation; see contract `openQuestions`)
1. Native input vs ARIA-only custom element: native input.
2. `checked` reflected: no.
3. `label` required: yes.
4. Sizes: `default`, `sm`.
5. Enter: submits, does not toggle.
6. Target size: 24px row.
7. Read-only / indeterminate: no.
