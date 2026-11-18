# Plan: Switch (planning gate)

Status: **approved** under SB-0011 (owner pre-approval; nobody was available in this session, so every open question was answered with its recommendation, listed below and in the contract's `openQuestions`). Tests and code start with the test-first steps; nothing is implemented yet.

## Scope
`sb-switch`: one on/off setting with label, description, error, `required`, `disabled`, two sizes (`default`, `sm`), form-associated from the first implementation. Out of scope: a mixed state, an `lg` size, icons in the thumb, a group container (Field set covers grouping later).

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` |

Reuse, no new shared code: `FormAssociated` (`src/mixins/form-associated.ts`) and `NativeControl` (`src/mixins/native-control.ts`), like Checkbox. Hooks: `formValue()` returns `value` while checked else `null`; `formReset()` restores the `checked` attribute; `formStateRestore(state)` sets `checked = state !== null`; `validationAnchor()` is the inner input. `syncFormState()` runs in the change handler. Inner input gets `?disabled=${this.isDisabled}` and `required`; host dims with `:host(:disabled)`; a click whose `composedPath()[0]` is the host is forwarded to the input (`<label for>`). Enter calls `form.requestSubmit()` (SB-0009).

## Tokens
All component tokens alias existing semantic tokens; none added. Sizes from `size.switch.*`, thumb from `size.icon.default`/`size.icon.sm`, inset `space.switch.inset`, colors `input`, `primary`, `background`, `primary-foreground`, `destructive`, `ring`. Contrast pairs in the contract pass check T6 in light and dark.

## Accessibility approach
Native `<input type="checkbox" role="switch">` covering the track (whole track is the hit area), label `for` in the same shadow root, `aria-describedby` to description and error, `aria-invalid`, persistent polite error region, `customError` from `error`. Thumb is decorative; position carries state. Reduced motion removes the thumb transition; thumb translation flips under `:dir(rtl)`.

## Test plan (test-first)
One test each, all seen failing first (element not defined) before any code:
- Props: `label` is the accessible name; `hide-label` keeps the name; `description` is the accessible description; `error` sets the description, `aria-invalid` and `customError`; `value` custom submit; `checked` property toggles state and the attribute is the default; `required` asterisk is aria-hidden; `disabled` cannot toggle or focus; `size` default 32x20 / sm 24x16 track.
- States: checked paints the track differently and moves the thumb (and mirrors in RTL); keyboard focus ring visible; invalid track color after blur when required and off; disabled opacity.
- Keyboard: Tab focuses; Space toggles; Enter submits the form and does not toggle.
- Events: `input` and `change` once per user toggle, composed; none when `checked` is set from code; `FormData` read in a `change` listener already has the new value.
- Form: FormData has `name=value` only while on; `form.reset()` restores the default; `<fieldset disabled>` disables without touching `disabled`, re-enable restores; `required` gives `valueMissing` and blocks submit; `<label for>` on the host toggles it.
- Accessibility: role `switch` with checked state; label click toggles; axe clean on every story; reduced motion has no transition.

## Accessibility deviations from the references
- Off track `input` (3:1) instead of the reference's light color; 3px solid focus ring instead of a translucent one (WCAG 1.4.11).
- Enter submits instead of toggling (APG optional binding; consistent with Checkbox and Input).

## Risks
- Forced colors: a filled track with no border disappears; the track needs a transparent border so forced-colors mode draws it. That needs an allow-literal comment (`transparent`) or a semantic transparent token; recommendation: the allow-literal comment, as no other component needs the token yet.
- Native `role="switch"` on a checkbox: older screen readers may announce "checkbox"; acceptable, covered by the manual screen-reader pass before `stable`.
- The `sm` track (16px high) is under 24px; it relies on the label row and the 12px gap (2.5.8 spacing exception), so `hide-label` with `sm` in a dense row needs care (stated in usage).

## Open questions (recommendation first)
All answered with the recommendation on 2026-11-12 (contract `openQuestions` Q1–Q6):
1. Native control: native checkbox with `role="switch"`, not a button with `aria-checked`. Taken.
2. Enter: submits the form, does not toggle. Taken.
3. Sizes: `default` and `sm` only, from `size.switch.*`. Taken.
4. Label: required, after the switch, `hide-label` available. Taken.
5. `checked` not reflected; the attribute is the reset default. Taken.
6. Invalid while on: on track keeps its fill; error text and `aria-invalid` carry the state. Taken.
