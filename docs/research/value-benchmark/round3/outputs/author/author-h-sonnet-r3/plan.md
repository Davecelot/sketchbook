# Plan: Switch

Status: approved by default. No approver was available, so every open question took its recommended answer (recorded in the contract's `openQuestions` and in SB-0012).

## Scope
`sb-switch`: on/off toggle, form-associated, with `label`, `hide-label`, `description`, `error`, `name`, `value`, `checked`, `required`, `disabled`, `size` (`default`, `sm`). No Figma realization in this change. No component code yet.

## Files
- `src/components/switch/Switch.ts`, `Switch.scss`, `Switch.stories.ts`, `index.ts` (`Switch.styles.ts` and `src/index.ts` are generated).
- `playwright/tests/switch/switch.behavior.spec.ts`.
- Reuses `src/mixins/form-associated.ts` and `native-control.ts`; no new mixin.

## Tokens
All in `contract.json` `tokens`, aliasing semantic tokens only. Dimensions come from the existing `size.switch.*`, thumb from `size.icon.default` and `size.icon.sm`; no semantic token is added.

## Accessibility approach
Native `<input type="checkbox" role="switch">`; native `<label for>`; `aria-describedby` for description and error; `aria-invalid`; polite live region for the error; 3px solid ring; thumb and track contrast pairs in the contract. Enter submits through `requestSubmit()` (SB-0009).

## Test plan (test-first)
One Playwright test per item, seen failing before the code:
- Props: label as name, hide-label, description, error, size dimensions (32x20, 24x16), required asterisk, value, checked.
- Keyboard: Tab focus ring; Space toggles; Enter submits.
- Events: `input` and `change` composed, once per toggle.
- Form: FormData has the value only while on; custom value; `form.reset()` restores the attribute default; `<fieldset disabled>` blocks toggling and is not submitted, re-enable restores; `required` is `valueMissing` while off; error sets `customError`; `<label for>` toggles.
- Accessibility: role switch, aria-checked, aria-describedby, aria-invalid, RTL thumb, axe clean on every story.

## Risks
- The thumb must be 3:1 against both track colors in light and dark; `spec/tokens/contrast.json` pairs come from the contract.
- Thumb travel and RTL come from the track and thumb tokens, not literals.

## Open questions (all answered with the recommendation)
1. Is `checked` reflected? No, same as Checkbox.
2. Is `label` required? Yes.
3. Native input with `role="switch"` or custom ARIA? Native.
4. Sizes? `default` and `sm`, from `size.switch.*`.
5. Does `required` mean on? Yes.
6. Design file now? No, web only.
