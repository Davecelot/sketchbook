# Plan: Switch (planning gate)

Status: **approved by default**. No reviewer was available; every open question took its recommendation (SB-0101). Tests and code start next, test-first.

## Scope
`sb-switch`: an on/off setting that takes part in forms (submit, reset, disabled fieldset, `required`), with `label`, `hide-label`, `description`, `error` and `size` (default, sm). Out of scope: a switch group, a custom thumb icon, a loading state.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` |

## Tokens
All `switch.*` tokens are in `contract.json` and alias existing semantic tokens only (`size.switch.*` already exist). No new semantic token.

## Test plan (test-first)
One test per item; each must fail first for the right reason (element missing), and the failure is recorded.
- Props: `label` is the accessible name; `hide-label` keeps it; `description` and `error` in the accessible description; `size` sm changes the track to 24x16; `name`, `value`, `checked`, `required`, `disabled` reflect or apply as the contract says.
- Keyboard: Tab focuses; Space toggles; Enter submits the form; focus ring visible on keyboard focus only.
- Events: `input` and `change` composed, once per toggle; no `change` when `checked` is set from code.
- Form: `FormData` has `name=value` only while checked and a custom `value`; `form.reset()` restores the attribute default; `<fieldset disabled>` disables and is not submitted, re-enabling restores it; `required` gives `valueMissing` and `:invalid`; `error` gives `customError` and blocks submit; `<label for>` activates the host.
- Accessibility: role `switch`, `aria-checked` state through `checked`, `aria-invalid`, name present, axe clean on every story (both sizes, checked, disabled, error, required).
- Direction: thumb end position mirrors in rtl.

## Accessibility deviations from the references
Off-track border at 3:1 (`color.input`) and a solid 3px ring, instead of the reference's faint track and translucent ring (WCAG 1.4.11). Enter submits the form (SB-0009). Record both as drift when built.

## Risks
- Thumb on a native input: the input must cover the track so the whole track is the click and focus target.
- `sm` track (16px high) is below 24px: needs the label row as the target, and a check that WCAG 2.5.8 spacing holds.
- Contrast of the thumb against the off track in dark mode; checked by `contrast` pairs in the contract.

## Open questions (recommendation first)
All answered with the recommendation; see `contract.json` `openQuestions` Q0 to Q6 and SB-0101.
