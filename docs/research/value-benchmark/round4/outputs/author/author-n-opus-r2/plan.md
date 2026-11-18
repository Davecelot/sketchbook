# Plan: Switch (planning gate)

Status: **approved 2026-11-12, recommendations taken.** No approver was available; the requester asked for every open question to be answered with its recommendation and recorded (contract `openQuestions` Q1–Q9, decision SB-0101). The owner can revisit any of them before implementation starts. Tests and code follow test-first.

## Scope
- `sb-switch`: one on/off control with built-in label, description and error, sizes `default` and `sm`, form-associated from the first implementation (rule form-associated-controls).
- Out of scope: indeterminate, readonly, label-before-switch layout, icons inside the thumb, a switch group element.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` |

`Switch` extends `NativeControl(FormAssociated(LitElement))` and implements only `formValue()`, `formReset()`, `formStateRestore()` and `validationAnchor()`. No new mixin, controller or helper: Checkbox already has every piece (Q1).

## Tokens
All 30 component tokens alias existing semantic tokens (`size.switch.*`, `size.icon.*`, `color.input|primary|background|primary-foreground|destructive|ring`, the field type and spacing tokens). No new semantic token. Contrast pairs declared in the contract pass T6 in light and dark. Forced-colors system colors are the only literals, each with a `sketchbook-allow-literal` reason.

## Accessibility approach
- Native `<input type="checkbox" role="switch">` + native `<label for>` in one shadow root (name, on/off state, Space, label click).
- `aria-describedby` to description and error; `aria-invalid`; persistent polite error region.
- Enter calls `form.requestSubmit()` (SB-0009); `error` sets `customError`.
- 3px solid focus ring; 3:1 track and thumb; forced colors; reduced motion; RTL thumb direction.

## Test plan (test-first)
Stories: Default, Checked, WithDescription, Invalid (error), Required, Disabled, DisabledChecked, Small, HiddenLabel, InForm, InFieldset, RTL.

Behavior spec, one test each, every one seen failing before the code exists:
- Props: `label` is the accessible name; `hide-label` hides it and keeps the name; `description` in the accessible description; `error` shows text, sets `aria-invalid` and the description; `name`/`value` in FormData; `checked` attribute renders on and is not re-written by toggling; `required` shows the aria-hidden asterisk; `disabled` cannot be toggled or focused; `size="sm"` renders a 24x16 track and 12px thumb, default 32x20 and 16px.
- States: focus-visible ring on keyboard focus only; checked fills the track and moves the thumb to the end (start in RTL); invalid border; disabled opacity.
- Keyboard: Tab focuses; Space toggles; Enter submits the form and does not toggle.
- Events: one composed `input` and one composed `change` per toggle (pointer, label click, Space); none on programmatic `checked`.
- Form: FormData has `value` only while on (default `on`, custom value); `form.reset()` restores the attribute default; `<fieldset disabled>` disables and drops it from FormData and re-enabling restores both without changing the `disabled` attribute; `required` off is `valueMissing` and blocks submit, on is valid; `error` blocks submit through `customError`; `<label for>` outside the host toggles it; a `change` listener reading FormData sees the new value.
- Accessibility: role `switch` with `aria-checked` true/false; axe clean on every story; dev warning once on empty label.

## Accessibility deviations from the references
- Solid 3px focus ring instead of ring/50 (WCAG 1.4.11).
- Off track uses `color.input` (3:1) instead of the reference's light track.
- One thumb alias per state across modes (contrast in dark mode).
- Enter submits instead of toggling (APG lists Enter as optional).

## Risks
- Hit area: the track is under 24px high; the label row and gap carry WCAG 2.5.8. A switch with `hide-label` and no neighbouring text loses that; the story and docs warn against it.
- `required` on a switch is unusual; usage steers consent to Checkbox (Q6).
- Thumb travel depends on track width, thumb and border tokens; a density or size change must keep `width - thumb - 2*border` positive (covered by the size test).

## Open questions (recommendation first)
All answered with the recommendation on 2026-11-12 (contract `openQuestions`):
1. Native element: checkbox with `role="switch"` (answered).
2. Enter: submits, does not toggle (answered).
3. `checked` reflected: no (answered).
4. `label` required, `hide-label` available (answered).
5. Sizes: `default` and `sm`, track and thumb only (answered).
6. `required`: must be on (answered).
7. Indeterminate and readonly: not supported (answered).
8. Label position: after the switch only (answered).
9. Forced colors and reduced motion: handled in the SCSS (answered).
