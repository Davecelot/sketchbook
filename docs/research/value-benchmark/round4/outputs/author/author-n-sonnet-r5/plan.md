# Plan: Switch (planning gate)

Status: **approved by recommendation**. No approver was available in this session, so every open question below took its recommended answer and is recorded in the contract's `openQuestions`. Tests and code come next (test-first).

## Scope
An on/off toggle: label (required), hide-label, description, error, name, value, checked, required, disabled, size (`default`, `sm`). Form-associated through `FormAssociated` + `NativeControl` over a native `<input type="checkbox" role="switch">`. Out of scope: loading state, icons in the thumb, a group wrapper.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` |

## Tokens
All `switch.*` component tokens alias semantic tokens only (contract.json `tokens`). Track width and thumb size reuse `size.control.sm`, `size.media.sm`, `size.icon.default` and `size.icon.sm`; the track height is the thumb plus the border, computed in CSS from component tokens, so no new semantic token is needed.

## Test plan (test-first)
One test per item, using `playwright/helpers/`:
- Props: label is the accessible name and click target; hide-label keeps the name; description and error reach the accessible description; `size` sets the track width; `checked`, `value`, `name`.
- States: focus ring on keyboard focus; checked paints and moves the thumb (and mirrors in RTL); invalid; disabled dims and cannot toggle.
- Keyboard: Tab focuses; Space toggles; Enter submits the form and does not toggle.
- Events: `input` and `change` composed, once per toggle.
- Form: FormData has `name=value` only while on; `form.reset()` restores the attribute default; `<fieldset disabled>` disables, excludes the value and re-enable restores both without touching the `disabled` attribute; `required` gives `valueMissing` and `:invalid`; `error` gives `customError`; `reportValidity()` focuses the input; `<label for>` activation toggles; change listener sees the new FormData.
- Accessibility: role `switch`, name, description, `aria-invalid`, axe clean on every story.
Each must fail first for the right reason (element missing) and the failure is recorded.

## Accessibility approach and deviations from the references
- Native input with `role="switch"`; no ARIA on the host beyond `aria-label` forwarding (SB-0009).
- Deviation from the visual reference: solid 3px focus ring in `ring` (its translucent ring is below 3:1) and an off track in `input` at 3:1 (WCAG 1.4.11). Listed in drift once built.

## Risks
- The 16px thumb in an 18px track is a small target: relies on the label row and the WCAG 2.5.8 spacing exception.
- `role="switch"` on a checkbox input: support is good in current browsers and screen readers; axe is the check.
- Form-associated shadow input has no form owner: Enter handling follows SB-0009.

## Open questions (recommendation first)
All answered with the recommendation:
- Q1 `checked` not reflected; the attribute is the reset default (as Checkbox).
- Q2 `label` required.
- Q3 Two sizes, `default` and `sm`.
- Q4 Native checkbox with `role="switch"`.
- Q5 Persistent polite error region with `customError` validity.
- Q6 Submits `value` (default `on`) only while on.
