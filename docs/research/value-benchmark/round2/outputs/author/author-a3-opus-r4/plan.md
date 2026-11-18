# Plan: Switch (planning gate)

Status: **approved (self-approved, 2026-11-12)**. No approver was available in the drafting session; every open question took its recommendation, recorded below and in contract.json `openQuestions`. The owner can revisit any answer before implementation. Tests and code follow test-first.

## Scope
`sb-switch`: one on/off setting with label, description, error and two sizes (`default`, `sm`), form-associated (FormData, reset, disabled fieldset, `required`, `<label for>`), keyboard operable (Tab, Space, Enter submits). Out of scope: indeterminate state, thumb icons, label-at-end layout, a switch group.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` |

## Implementation approach
- `class Switch extends FormAssociated(NativeControl(LitElement))` in the order the form-associated rule gives, same as Checkbox. Hooks: `formValue()` returns `value` while checked, else `null`; `formReset()` restores the `checked` attribute; `formStateRestore()` restores checked; `validationAnchor()` is the inner input.
- Inner `<input type="checkbox" role="switch">` with `?disabled=${this.isDisabled}`, `?required`, `.checked`, `aria-describedby=${this.describedBy}`, wired to `syncFocusVisible`/`handleBlur`/`handleChange`; `syncFormState()` runs synchronously in the change handler.
- Host click whose `composedPath()[0]` is the host is forwarded to the input (`<label for>`).
- Enter calls `form.requestSubmit()` (SB-0009), as Checkbox does.
- Dimmed via `:host(:disabled)`; size via `:host([size="sm"])` swapping the private `--_width`/`--_height`/`--_thumb` properties; thumb offset uses `:dir(rtl)`; transitions dropped under `prefers-reduced-motion`.
- Ladder (hammock): Checkbox's label/description/error grid is the same layout. Reuse its structure by copying the small SCSS block; extracting a shared field-row mixin waits until a third control needs it (two callers do not earn the abstraction). Not an option row, so the option-row mixin in the form-associated rule does not apply.

## Tokens
All component tokens alias existing semantic tokens (`size.switch.*`, `size.icon.*`, `color.input`, `color.primary`, `color.primary-foreground`, `color.background`, `radius.pill`, …); no new semantic token. Contrast pairs in the contract pass T6 in every mode.

## Accessibility approach
APG switch pattern on a native checkbox with `role="switch"`; native label in the same root; description and error by `aria-describedby`; persistent polite error region; `aria-invalid`; 3px solid focus ring; 3:1 track and thumb; reduced motion. Deviations from the visual reference are listed in the contract's drift.

## Test plan (test-first)
One Playwright test each, all seen failing before the code exists:
- props: `label` is the accessible name and clicking it toggles; `hide-label` keeps the name; `description` and `error` in the accessible description; `value` custom value submitted; `checked` attribute sets the initial state and is not reflected on toggle; `size` sm vs default track and thumb dimensions; `required` asterisk is aria-hidden; `disabled` cannot toggle.
- role and state: role `switch`, `aria-checked` follows toggles; thumb moves to the end edge when on, mirrored under `dir="rtl"`.
- keyboard: Tab focuses with a visible ring; Space toggles; Enter submits the form and does not toggle.
- events: `input` and `change` composed, once per toggle; a `change` listener reads the new value from `FormData`.
- form: FormData has `name=value` only while on; `form.reset()` restores the attribute default; `<fieldset disabled>` disables without touching the attribute, and re-enable restores it; `required` off is `valueMissing` and blocks submit, invalid after blur; `error` sets customError; `<label for>` activates.
- a11y: `aria-invalid` when invalid; error announced region present; axe clean on all stories.

## Risks
- The transparent input stretched over the track must keep the whole track clickable and the focus ring on the track, not the input box.
- The sm track (16px) is below 24px; it relies on the label row for WCAG 2.5.8. A `hide-label` sm switch loses that; the story notes it.
- Duplicated row SCSS with Checkbox can drift; tracked as a deliberate simplification.

## Accessibility deviations from the references
- Unchecked track `color.input` (3:1) instead of the reference's light gray.
- 3px solid focus ring instead of a translucent ring.
- Enter submits instead of toggling (APG lists Enter as optional).

## Open questions (recommendation first)
All answered with the recommendation, 2026-11-12:
1. Q1 element: native checkbox with `role="switch"` (chosen) vs `<button role="switch">`. Native gives Space, validity and checked state for free.
2. Q2 Enter: submits the form (chosen), consistent with the native control and Checkbox (SB-0009).
3. Q3 sizes: `default` | `sm` (chosen), canonical medium/small, from `size.switch.*`.
4. Q4 `checked` reflected: no (chosen); the attribute is the reset default.
5. Q5 label: required, after the switch in the row (chosen); `hide-label` keeps the name.
6. Q6 indeterminate or thumb icons: neither (chosen, YAGNI).
