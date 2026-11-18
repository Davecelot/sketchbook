# Plan: Switch (planning gate)

Status: **draft, awaiting human approval**. No approver was available in the session that wrote this, so every open question below was answered with its recommendation and recorded in the contract's `openQuestions` and in SB-0101 (still `proposed`). Tests and code start only after a person approves this plan or changes an answer (planning gate, then test-first).

## Scope
`sb-switch`: an on/off setting with label, description, error message and sizes `default` and `sm`. Form-associated from the first implementation (`FormAssociated` + `NativeControl`): submits `value` while on, resets with its form, is disabled by a disabled `<fieldset>`, validates `required` (must be on). Keyboard: Tab, Space, Enter (implicit submit).

Out of scope (not requested): `hide-label`, label-position prop, indeterminate, icons in the thumb, a group wrapper.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` |

Reuse: `src/mixins/form-associated.ts`, `src/mixins/native-control.ts`; Checkbox is the model for the field grid and error live region. No new mixin or shared file.

## Tokens
All in `contract.json` `tokens`, aliasing semantic tokens only; no new semantic token. The track is derived in CSS from `--sb-switch-thumb-size` and `--sb-switch-inset` (height = thumb + 2 × inset, width = 2 × thumb + 2 × inset); `size="sm"` swaps in `--sb-switch-sm-thumb-size`. Contrast pairs are listed in `accessibility.contrast`.

## Accessibility approach
- Native `<input type="checkbox" role="switch">` plus native `<label for>` in one shadow root; `label` is required as the accessible name.
- `aria-describedby` to description and error; `aria-invalid`; persistent polite live region for the error; `error` also sets `customError` validity; Enter calls `form.requestSubmit()` (SB-0009).
- Inner input `?disabled=${this.isDisabled}`; host styled with `:host(:disabled)`.
- Thumb is `aria-hidden` and decorative; state is carried by the input.

## Test plan (test-first)
Playwright behavior spec from the contract, one test per item:
- Props: `label` is the name and a click on it toggles; `description` and `error` in the accessible description; `size` default 16px and sm 12px thumb, track derived; `name`/`value` submitted; `checked` attribute default; `required` asterisk (aria-hidden); `disabled` cannot toggle.
- Keyboard: Tab focuses and shows the ring; Space toggles; Enter submits the form.
- Events: `input` and `change` composed, once per toggle; a `change` listener reads the new `FormData`.
- Form: FormData has `value` only while on; custom `value`; `form.reset()` restores the attribute default; `<fieldset disabled>` disables and re-enable restores, without touching the `disabled` attribute; `required` off gives `valueMissing` and `:invalid`, on clears it; `error` gives `customError`; `<label for>` activates the host; saved-state restore.
- Accessibility: role switch and `aria-checked`; accessible name; `aria-invalid`; missing-label dev warning; axe clean on all stories (default, sm, checked, description, error, required, disabled, in rtl).

Step 3 of test-first: run `npm run test:component -- tests/switch` and record that each new test fails for the right reason (element missing) before writing code.

## Accessibility deviations from the references
- Off track border and thumb use `color.input` (3:1), where the reference fills the off track with a lighter input color (WCAG 1.4.11).
- Solid 3px focus ring, where the reference uses a translucent ring (below 3:1).
- The 18px default track is under 24px; WCAG 2.5.8 is met through the clickable label row and the 12px spacing, as for Checkbox.

## Risks
- Track and thumb geometry computed from two tokens: verify the thumb travel in rtl and at `sm`.
- `role="switch"` on a checkbox input: a screen reader pass is part of the review before `beta`.
- Inner input has no form owner (SB-0009): Enter and `required` validity depend on the mixin; covered by the form tests.

## Open questions (recommendation first)
All answered with the recommendation; see contract.json `openQuestions` for the text.
- **Q1** `role="switch"` on a checkbox input vs the `switch` attribute: role (works everywhere).
- **Q2** `label` required, `hide-label` omitted until a use case exists.
- **Q3** Sizes `default` and `sm` (registered aliases of medium and small); no new semantic token.
- **Q4** `checked` not reflected; the attribute is the reset default.
- **Q5** Submits `value` only while on; `required` means on.
- **Q6** `error` blocks submission; Enter submits.
- **Q7** No label-position prop.
