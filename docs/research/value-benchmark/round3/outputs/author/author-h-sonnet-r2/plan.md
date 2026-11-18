# Plan: Switch

Status: approved by SB-0011 (owner pre-approval; no approver was available on 2026-11-12). Each open question took its recommendation and is recorded as answered in `contract.json`.

## Scope
`sb-switch`: an on/off setting, form-associated, with `label`, `hide-label`, `description`, `error`, `size` (`default`, `sm`), `name`, `value`, `checked`, `required`, `disabled`. Not in scope: a switch group, a Field set wrapper, custom thumb icons.

## Files
- `src/components/switch/Switch.ts`, `Switch.scss`, `Switch.stories.ts`, `index.ts`
- `Switch.styles.ts` and `src/index.ts` are generated (`npm run generate`), never edited
- `playwright/tests/switch/switch.behavior.spec.ts`
- Figma/design realization after the web one is green

## Tokens
All in `contract.json` `tokens`, aliasing semantic tokens only: sizes from the existing `size.switch.*` and `space.switch.inset`, colors `input`, `primary`, `primary-foreground`, `background`, `destructive`, `ring`, shared typography, `opacity.disabled`, motion. No new semantic token needed. The thumb diameter and travel are computed in the SCSS from the width, height and inset component tokens.

## Accessibility approach
Native `<input type="checkbox" role="switch">` and a native `<label for>` in one shadow root, extending `FormAssociated(NativeControl(LitElement))`. Hooks: `formValue()` returns `value` while on, else `null`; `formReset()` restores the `checked` attribute; `formStateRestore()` restores `checked`; `validationAnchor()` is the inner input. Inner input gets `?disabled=${this.isDisabled}`; style with `:host(:disabled)`. Enter calls `form.requestSubmit()` (SB-0009). `syncFormState()` runs synchronously in the input handler. The error sets a `customError` validity.

## Test plan (test-first)
Write the story and `switch.behavior.spec.ts` from the contract, run `npm run test:component -- tests/switch`, confirm every test fails for the right reason (element missing), and record that. Then implement. One test per:
- props: label (name), hide-label keeps name, description, error, size (default 32x20, sm 24x16), name, value, checked, required (asterisk aria-hidden), disabled
- role `switch`; aria-checked follows state; thumb moves; `aria-describedby` and `aria-invalid`
- keyboard: Tab focus ring, Space toggles, Enter submits the form
- events: `input` and `change` composed, once per toggle; a `change` listener reading FormData sees the new value
- form: FormData has `value` only while on; custom value; `form.reset()` restores the attribute default; `<fieldset disabled>` and re-enable without changing the `disabled` attribute; `required` invalid while off and valid when on; `error` customError blocks submit; `<label for>` toggles
- axe clean on all stories (both sizes, on, off, invalid, disabled, required)

## Risks
- Track is under 24px tall: WCAG 2.5.8 relies on the label row and gap, as Checkbox does.
- RTL: the thumb must travel in the inline direction (`:dir(rtl)`).
- Dark mode: `color.input` as the off track must hold 3:1; the contrast pairs in the contract run in every mode.

## Open questions
All answered (see `contract.json` Q0–Q7). Recommendations taken: native input with role=switch; `checked` not reflected; `label` required; sizes `default` and `sm`; `error` prop; `required` means on; separate thumb tokens for off and on.
