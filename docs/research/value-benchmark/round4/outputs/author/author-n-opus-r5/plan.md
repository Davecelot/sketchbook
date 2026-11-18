# Plan: Switch (planning gate)

Status: **answered in-session**. No reviewer was available; every open question below was resolved with its recommended option, as instructed, and recorded in `contract.json` `openQuestions`. Tests and code still start test-first; nothing is implemented yet.

## Scope
- In: `sb-switch`, a form-associated on/off control with label, hide-label, description, error, required, disabled, name, value and two sizes (`default`, `sm`). Built like Checkbox on `FormAssociated` + `NativeControl` (rule form-associated-controls).
- Out: indeterminate/mixed state, icons or text inside the thumb, a loading state, a "switch group" element, Enter-to-toggle.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` |

No new mixin, controller or semantic token: the mixins exist and every component token aliases an existing semantic token (`size.switch.*`, `space.switch.inset`, `size.icon.*`, the color roles).

## Tokens
All in `contract.json` `tokens`, one step to semantic. Size `sm` swaps `switch.track.width-sm`, `switch.track.height-sm` and `switch.thumb.size-sm` into private `--_track-w`, `--_track-h`, `--_thumb`; thumb travel is computed from them and `switch.inset`. Contrast pairs (track vs page, thumb vs track in both states, text, invalid border, ring) are in `accessibility.contrast` and pass check T6.

## Accessibility approach
Native `<input type="checkbox" role="switch">` stretched transparent over the track, native `<label for>` in the shadow root, `aria-describedby` to description and error, `aria-invalid`, polite live error region, solid 3px ring on `:state(focus-visible)`, `:host(:disabled)` dimming, reduced-motion removes the slide, `:dir(rtl)` mirrors the travel.

## Test plan (test-first)
One test each, in `playwright/tests/switch/switch.behavior.spec.ts`, seen failing before the code exists:
- props: label is the accessible name; hide-label keeps the name; description and error in the accessible description; `size` reflects and sets the track to 32×20 / 24×16; `value` default `on` and custom; `checked` property not reflected; `required` asterisk is aria-hidden; `disabled` cannot toggle.
- role and states: role is switch, `checked` exposed as on/off; checked paints the track differently; invalid sets `aria-invalid`; focus ring only on keyboard focus.
- keyboard: Tab focuses; Space toggles; Enter submits the form and does not toggle.
- events: one composed `input` and one composed `change` per toggle; none when set from code; `FormData` already holds the new value inside the `change` listener.
- form: FormData has `name=value` only while on; `form.reset()` restores the attribute default; `<fieldset disabled>` disables and is not submitted, re-enable restores it without the host's `disabled` attribute changing; `required` off is `valueMissing` and blocks submit, on is valid; `error` is customError; `<label for>` on the host toggles it.
- axe clean on every story (both sizes, checked, invalid, disabled).

## Accessibility deviations from the references
- Off track at 3:1 (`color.input`), solid focus ring, thumb roles fixed per state in both modes (all WCAG 1.4.11; listed as drift).
- Enter submits instead of toggling (APG lists Enter as optional for a switch).

## Risks
- Some screen readers announce `role="switch"` on a checkbox as "checkbox"; acceptable fallback, the state is still read. Verify in the a11y pass.
- `aria-required` support on role switch varies; required is enforced natively and the error text carries the message.
- sm track is under 24px tall; relies on the label row for target size, so `hide-label` with `sm` should be avoided (noted in usage).

## Open questions (recommendation first)
All answered with the recommended option on 2026-11-12, no reviewer available:
- Q1 native checkbox + `role="switch"` (chosen) vs `<button role="switch">`.
- Q2 Enter submits, does not toggle (chosen) vs Enter toggles.
- Q3 `checked` not reflected; attribute is the reset default (chosen).
- Q4 `label` required, `hide-label` available (chosen).
- Q5 two sizes `default`/`sm`, track and thumb only (chosen).
- Q6 `required` means must be on (chosen).
- Q7 thumb `background` off / `primary-foreground` on in both modes (chosen) vs the reference's dark-mode foreground thumb.
