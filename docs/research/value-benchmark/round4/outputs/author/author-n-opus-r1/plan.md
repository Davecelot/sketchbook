# Plan: Switch (planning gate)

Status: **approved with recommendations** (2026-11-12). No approver was available; every open question was answered with its recommendation, recorded below and in `contract.json` `openQuestions` (as SB-0011 allows). Tests and code follow test-first.

## Scope
`sb-switch`: one on/off setting with label, description, error, `size` (`default`, `sm`), form association (`name`, `value`, `checked`, `required`, `disabled`). Out of scope: `hide-label`, a label-at-start layout, a loading state, Figma drawing.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` |

`Switch` extends `NativeControl(FormAssociated(LitElement))` and implements only `formValue`, `formReset`, `formStateRestore`, `validationAnchor`. No new mixin, controller or dependency: Checkbox already proves the pattern.

## Tokens
Component tokens in the contract alias semantic tokens only; none new. Sizes reuse `size.switch.*` and `size.icon.default|sm`. Thumb inset and travel are `calc()` from the size tokens, so no literals.

## Accessibility approach
Native checkbox with `role="switch"`, native `<label for>` in the same root, `aria-describedby` to description and error, `aria-invalid`, polite error region, solid 3px focus ring, thumb aria-hidden, RTL mirrors thumb travel. Deviations from the visual reference are the drift entries in the contract (track and ring contrast, dark thumb, track height).

## Test plan (test-first)
One test per item, run with `npm run test:component -- tests/switch`, seen failing before code:
- Props: label is the accessible name; description and error in the accessible description; `size` reflects and changes the track (32x20 vs 24x16); `value` default `on` and custom; `checked` property vs attribute default.
- States: on paints the track differently and moves the thumb; focus-visible ring on keyboard focus only; invalid after `error` and after blur when required and off; disabled cannot toggle and is dimmed.
- Keyboard: Tab focuses; Space toggles; Enter submits the form and does not toggle.
- Events: `input` and `change` composed, once per toggle; `FormData` in a `change` listener holds the new value.
- Form: FormData has `value` only while on; `form.reset()` restores the attribute default; `<fieldset disabled>` disables, re-enable restores, author `disabled` attribute untouched; `required` -> `valueMissing` and blocks submit; `error` -> `customError`; `<label for>` on the host toggles.
- Accessibility: role switch with checked state; required asterisk aria-hidden; empty-label console warning; axe clean on every story; RTL thumb position.

## Risks
- Some screen readers announce `role=switch` on a checkbox as "checkbox" in older versions; acceptable fallback (state still announced).
- Thumb travel must use logical direction (`:dir(rtl)`), or RTL shows the wrong state.

## Open questions (recommendation first)
- Q1 Native input or ARIA on a custom element? **Native `<input type="checkbox" role="switch">`** (SB-0007). Answered.
- Q2 Enter toggles? **No; Enter submits, Space toggles** (SB-0009, matches Checkbox). Answered.
- Q3 Reflect `checked`? **No**; the attribute is the reset default. Answered.
- Q4 `label` required, `hide-label`? **Required; no `hide-label` yet** (not requested). Answered.
- Q5 Sizes? **`default` and `sm`** on existing semantic tokens. Answered.
- Q6 Label position? **After the switch**, mirrored in RTL. Answered.
