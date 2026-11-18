# Switch: plan

Status: approved under SB-0011 on 2026-11-12. No reviewer was available; every open question was answered with its recommendation and recorded in `contract.json` `openQuestions`.

## Scope
`sb-switch`: one form-associated on/off control with label, description, error, `required` and two sizes (`sm`, `default`). Out of scope: a placement prop or settings-row layout (Q5), on/off text or icons inside the track, a read-only state, a loading state.

## Files
- `src/components/switch/Switch.ts`: `class Switch extends FormAssociated(NativeControl(LitElement))`, registered as `sb-switch`.
- `src/components/switch/Switch.scss`: only `--sb-switch-*` and private `--_*` properties.
- `src/components/switch/Switch.stories.ts`, `src/components/switch/index.ts`.
- `playwright/tests/switch/switch.behavior.spec.ts`.
- Generated, not hand-written: `Switch.styles.ts`, `src/index.ts` (`npm run generate`).
- No new mixin or controller: `src/mixins/form-associated.ts` and `src/mixins/native-control.ts` cover it. The switch is not an option row, so the shared option-row mixin does not apply.

## Tokens
31 component tokens, all aliasing existing semantic tokens (no new semantic token). Dimensions come from `size.switch.width|height(-sm)`, `space.switch.inset` and `size.icon.default|sm` for the thumb (20 = 16 + 2x2; 16 = 12 + 2x2). The thumb travel is `calc()` of those tokens, no literal. `size` sets private `--_track-w`, `--_track-h` and `--_thumb` from the `-sm` tokens on `:host([size="sm"])`.

## Accessibility approach
- Native `<input type="checkbox" role="switch">` with `<label for>` in the shadow root; Space toggles natively; Enter calls `form.requestSubmit()` (SB-0009).
- `aria-describedby` to description and error; `aria-invalid`; the error is a persistent polite live region; `error` sets `customError`.
- Thumb position carries the state besides color; 3:1 for the off track, both thumbs on their tracks, the invalid ring and the focus ring, in light and dark.
- `:host(:disabled)` for the dimmed look; `?disabled=${this.isDisabled}` on the input.
- No transition under `prefers-reduced-motion: reduce`; thumb mirrored with `:dir(rtl)`.

## Test plan (test-first)
Write the stories and the behavior spec from the contract, run `npm run test:component -- tests/switch` and record that every test fails because `sb-switch` is not defined, then implement.

One test each:
1. Props: label is the accessible name; hide-label keeps the name and hides the text; description is the accessible description; value submitted; checked attribute sets the initial state and is not reflected on toggle; required adds the aria-hidden asterisk; disabled cannot toggle; `size="sm"` renders a 24x16 track and 12px thumb, default 32x20 and 16px.
2. Role and state: role `switch`, `aria-checked` follows `checked`; the thumb moves to the end when on.
3. Keyboard: Tab focuses and shows the focus ring; Space toggles; Enter submits the form.
4. Events: `input` and `change` once per toggle, composed; a `change` listener reads the new value from `FormData`.
5. Form: FormData has `name=value` only while on; `form.reset()` restores the attribute default; `<fieldset disabled>` disables without touching the attribute and re-enabling restores it; `required` off is `valueMissing` and blocks submit, on is valid; `error` sets `customError` and `aria-invalid`; `<label for>` toggles it.
6. Invalid: required and off after blur shows the invalid ring and error; the error is announced (live region).
7. axe clean on every story (default, sm, checked, description, error, required, disabled, hide-label).

## Risks
- `:host(:disabled)` from a fieldset needs the mixin's `formDisabledCallback`; the fieldset test guards it.
- The thumb overlaying the input must not take the click: `pointer-events: none` on the thumb.
- `role="switch"` on a checkbox input must not leave `aria-checked="mixed"`: there is no indeterminate prop, so the input's indeterminate stays false.

## Open questions
All answered with the recommendation, 2026-11-12 (details in `contract.json`):
- Q1 Native element: `<input type="checkbox" role="switch">`.
- Q2 Enter submits the form; Space toggles.
- Q3 `checked` is not reflected; the attribute is the reset default.
- Q4 `label` is required; `hide-label` for rows named elsewhere.
- Q5 Switch at the start; no placement prop yet.
- Q6 `required` means it must be on; invalid shows a 2px destructive ring plus the error text.
- Q7 `size` changes the track and thumb only.
- Q8 The thumb animates with the motion tokens, instantly under reduced motion.
