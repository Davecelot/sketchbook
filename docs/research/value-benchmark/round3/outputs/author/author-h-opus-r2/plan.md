# Plan: Switch (planning gate)

Status: **approved (self-approved, 2026-11-12)**. No reviewer was available in the authoring session, so every open question was answered with its recommended option (contract.json `openQuestions` Q0–Q8, decision SB-0101). A person may still reopen any of them before the build starts; tests and code follow the test-first rule.

## Scope
- In: on/off setting with `label`, `hide-label`, `description`, `error`, `name`, `value`, `checked`, `required`, `disabled`, `size` (`default`, `sm`); full form association; Space to toggle, Enter to submit; `input`/`change` events.
- Out (not requested): label-first or space-between layouts, icons or text inside the thumb, a loading state, a read-only state, a Switch group. Revisit when a kit needs one.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` |
| 5 | `spec/registry.json` (status), contract `realizations.web` (files, parts, coverage) |

## Reuse (no new abstractions)
- `FormAssociated(NativeControl(LitElement))` from `src/mixins/`: form value, reset, state restore, validity, `isDisabled`, label/description, `delegatesFocus`, label forwarding, focus-visible sync, composed `change`, empty-label warning. The Switch implements only the four hooks: `formValue()` = `value` while on else `null`; `formReset()` = the `checked` attribute default; `formStateRestore(state)` = checked from the saved state; `validationAnchor()` = the inner input.
- Same field grid, label, description and error markup as Checkbox. The Checkbox layout is not extracted into a shared helper now (two callers, different control parts); revisit with a third.
- Enter-to-submit (SB-0009) exactly as Checkbox does it.

## Tokens
All 31 component tokens alias existing semantic tokens (contract.json `tokens`); none are new. Sizes come from `size.switch.*` and `space.switch.inset`. The thumb diameter and travel are computed in CSS from height, width and inset, so no thumb-size token is needed. Contrast pairs (9) are declared in the contract and pass T6 in light and dark.

## Accessibility approach
- Native `<input type="checkbox" role="switch">` covering the track, `<label for>` in the same shadow root, thumb `aria-hidden`.
- Description and error by `aria-describedby`; `aria-invalid` when invalid; persistent polite live region for the error.
- 3px solid focus ring; off track at 3:1; on/off told by thumb position; reduced-motion removes the slide; thumb mirrored in RTL via logical properties.

## Test plan (test-first)
One Playwright test per item in `playwright/tests/switch/switch.behavior.spec.ts`, each seen failing first:
1. Name: role `switch` named by `label`; label text does not change when toggled; `hide-label` keeps the name.
2. Description and error are the accessible description; `aria-invalid` when `error` set.
3. Click on the track and on the label toggles; `aria-checked` / `checked` follow.
4. Space toggles; Enter does not toggle and submits the enclosing form.
5. Keyboard focus shows the ring; pointer focus does not.
6. `input` and `change` fire once per toggle, composed; a `change` listener reading `FormData` sees the new value.
7. `disabled` cannot toggle or focus and is not submitted.
8. `size="sm"` renders a 24×16 track; default 32×20; thumb moves to the inline end when on (and to the left in `dir="rtl"`).
9. Form: `FormData` has `name=on` only while on; custom `value` submitted; `form.reset()` restores the attribute default (both directions); `<fieldset disabled>` disables without changing the `disabled` attribute, and re-enabling restores it; `required` and off is `valueMissing` and blocks submit, on is valid; `error` sets `customError`; `<label for>` on the host toggles it.
10. Required asterisk is aria-hidden.
11. Reduced motion: no transition on the thumb.
12. axe clean on every story.

Then `npm run check`, `npm run typecheck`, `npm run test:component`; review with review-rangers; a11y-checker's keyboard and screen-reader pass before beta.

## Accessibility deviations from the references
- Native checkbox with role=switch instead of a button (reference): native validity and Space.
- Enter submits instead of toggling (APG: optional): consistent with native controls and Checkbox.
- Off track at 3:1 and a solid 3px focus ring (reference is below 3:1, WCAG 1.4.11).

## Risks
- `role="switch"` on a native checkbox: some screen readers announce "checked" instead of "on"; covered by the manual pass (Q8).
- A 20px (16px small) high track is under 24px; relies on the label row and the spacing exception (WCAG 2.5.8). A `hide-label` switch must keep 24px of clear space around it.
- `required` on a switch is uncommon; the label must say what has to be turned on.

## Open questions (recommendation first)
All answered with the recommendation on 2026-11-12 (no reviewer available):
- Q1 Element: native checkbox with role=switch (vs a button with aria-checked).
- Q2 Enter: submits the form (vs toggling).
- Q3 `checked` not reflected; the attribute is the reset default.
- Q4 `label` required; `hide-label` for visually hidden.
- Q5 Sizes `default` and `sm`, aliased to medium and small.
- Q6 Label after the track only.
- Q7 No icons or text in the thumb or track.
- Q8 Manual screen-reader pass by the a11y-auditor brief at the beta review.
