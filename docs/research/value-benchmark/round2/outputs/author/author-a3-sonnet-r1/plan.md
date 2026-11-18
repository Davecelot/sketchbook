# Plan: Switch

Status: contract passes `npm run check`. Plan NOT approved by a person (nobody was available); recommendations taken, see SB-0101. Do not start tests or code until someone confirms.

## Scope
`sb-switch`: on/off toggle with `label`, `hide-label`, `description`, `error`, `size` (medium, small), `name`, `value`, `checked`, `required`, `disabled`. Form-associated from the first implementation. Out of scope: indeterminate, a switch group, a Figma drawing (separate step).

## Files
- `src/components/switch/Switch.ts`, `Switch.scss`, `Switch.stories.ts`, `index.ts`; `Switch.styles.ts` and `src/index.ts` are generated.
- `playwright/tests/switch/switch.behavior.spec.ts`.
- No new mixin: extend `FormAssociated(NativeControl(LitElement))` like Checkbox.

## Tokens
All in `contract.json` `tokens`, one step to semantic tokens (`switch.*`). Nothing new in `spec/tokens/semantic`. Medium thumb `size.icon.default`, small `size.icon.sm`; track widths `size.control.sm` and `size.control.xs`.

## Accessibility approach
Native input with `role="switch"` in the same shadow root as a native `<label for>`; the host forwards a click on itself to the input (label for activation). `aria-describedby` to description and error; `aria-invalid`; thumb `aria-hidden`; polite live region for the error; solid 3px focus ring; `:host(:disabled)` for dimming and `isDisabled` on the input.

## Form behavior
Hooks: `formValue()` returns `value` only while on; `formReset()` restores the `checked` attribute; `formStateRestore()` restores `checked`; `validationAnchor()` is the inner input. `syncFormState()` is called in the input handler. Enter calls `form.requestSubmit()` (SB-0009). `error` sets customError validity.

## Test plan (test-first)
One Playwright test each, failing before the code exists:
- props: label is the name, hide-label keeps it, description, error, size (track and thumb dimensions), value, name, checked, required asterisk, disabled.
- keyboard: Tab, Space toggles, Enter submits, focus ring on keyboard focus only.
- events: `input` and `change` composed, once per toggle.
- form: FormData only while on and with custom value, `form.reset()`, `<fieldset disabled>` and re-enable leaves the attribute alone, required validity, error customError, `<label for>` click toggles.
- accessibility: role switch and aria-checked, aria-invalid, description in the accessible description, axe clean on every story.
- contrast: pairs in `accessibility.contrast` via `npm run check`.
Then confirm each fails for the right reason, implement, run `npm run check`, `npm run typecheck`, `npm run test:component -- tests/switch`, then review before `beta`.

## Risks
- Track under 24px tall: relies on the row and gap for WCAG 2.5.8.
- Off-track and thumb contrast depends on `color.input` staying at 3:1 against `color.background`.
- Thumb travel must mirror under `:dir(rtl)`.

## Open questions
All answered with the recommendation first, recorded in `contract.json` `openQuestions` (Q1 to Q7) and in SB-0101.
