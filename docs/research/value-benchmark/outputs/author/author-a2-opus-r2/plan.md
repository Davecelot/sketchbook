# Plan: Switch (planning gate)

Status: **draft — recommendations adopted by default.** No reviewer was available in the authoring session (2026-11-12), so each open question below was answered with its recommendation and recorded in contract.json `openQuestions` and in SB-0101 (status proposed). A person still has to approve this plan before tests and code start (planning gate, then test-first). Any answer can be reopened.

## Scope

- `<sb-switch>`: a form-associated on/off control built on a native `<input type="checkbox" role="switch">`.
- Props: `checked`, `value`, `name`, `required`, `disabled`, `label`, `description`, `errorMessage` (`error-message`), `validation` (`none`, `error`), `size` (`small`, `medium`).
- Events: native `input`, and `change` re-dispatched composed.
- Out of scope:
  - slots for rich label content (Q7)
  - a read-only mode
  - an indeterminate state (a switch has no mixed value)
  - icons in the thumb
  - a loading state

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` |

Shared code that is reused, not changed: `src/mixins/form-associated.ts` and `src/mixins/native-control.ts`. If either is not in the project yet, it comes in from the harness template first (the form-associated-controls rule).

## Tokens

There are 33 component tokens (`switch.*` in contract.json). Each one aliases an existing semantic token, so no new semantic or foundation tokens are needed.
- Sizes come from the existing `size.switch.*` and `space.switch.inset`.
- Thumb size is derived in CSS: track height − 2 × inset.
- Contrast is verified by T6 for 10 pairs in light and dark. The tightest are the off track and the description at 4.74:1 (light).

## Accessibility approach

- A native checkbox input with `role="switch"` supplies the role, on/off state, Space key, label activation, `required` validity and message, and disabled behavior.
- The NativeControl mixin supplies:
  - label and description wiring
  - aria-label forwarding
  - the `:state(focus-visible)` sync
  - the composed `change`
  - the missing-name warning
- The component adds:
  - `aria-invalid`, and the error id in `aria-describedby`
  - the aria-hidden required mark
  - the ≥ 24×24 input overlay
  - the reduced-motion guard
  - forced-colors styles

## Test plan (test-first)

One Playwright test per item. Each one is seen failing before any implementation exists.

1. **Render and props:** default off, `size` (small, medium) reflected, `checked` property toggles the look, `label`, `description`, `error-message` shown only with `validation="error"`.
2. **Role and name:** the input has role switch, and its name comes from `label` or from `aria-label` on the host. The missing-name warning fires.
3. **State exposure:** the accessibility tree shows checked=true/false after each toggle.
4. **Pointer:** a click on the track toggles, a click on the label toggles, and a click on the description does not.
5. **Keyboard:**
   - Tab focuses the switch and shows focus-visible.
   - Space toggles.
   - Enter does not toggle.
   - Tab skips a disabled switch.
6. **Events:**
   - Toggling fires `input` then `change`, both bubbling and composed.
   - The `change` listener reads the new value from `FormData`.
   - Setting `checked` from script fires no event.
   - `form.reset()` fires no event.
7. **FormData:**
   - When on with a name, `name=value` is submitted, and the default value is `on`.
   - When off, nothing is submitted.
   - Without a name, nothing is submitted.
8. **Reset:** `form.reset()` restores the `checked` attribute state, both from on to off and from off to on.
9. **Fieldset:**
   - `<fieldset disabled>` makes the switch not focusable and not submitted, and matches `:disabled`.
   - The `disabled` attribute is not written.
   - Re-enabling the fieldset restores focus, clicks and submission.
10. **Required:**
    - Required and off: `checkValidity()` is false, `validity.valueMissing` is true and `:invalid` matches.
    - `reportValidity()` focuses the input.
    - Turning it on makes it valid.
    - The required mark is aria-hidden.
11. **`<label for>`:** an outside label click toggles the switch.
12. **Invalid:** `validation="error"` sets `aria-invalid="true"`, and the error id is in `aria-describedby`.
13. **Describedby:** the description id is in `aria-describedby`, and missing parts leave no dangling ids.
14. **Target size:** the input's bounding box is at least 24×24 in both sizes.
15. **Reduced motion:** with `prefers-reduced-motion: reduce`, the thumb has no transition.
16. **RTL:** in `dir="rtl"`, an on thumb sits at the left.
17. **axe:** no violations in every story (sizes × validation × checked × disabled).

## Accessibility deviations from the references

- The visual reference's off track is too pale for 3:1. This project uses its darker `color.input`.
- Its focus ring is half-opacity. Ours is solid.
- Its hit area is only the track. Ours is at least 24×24.
- The APG allows Enter to toggle. We keep the native behavior, where Enter does not toggle.

## Risks

- **Overlay vs. label click:** an extended input overlay could cover the start of the label text. Clip the overlay to the track's column, and give a small switch enough space through the 24px row minimum.
- **Mixin availability:** `src/mixins/form-associated.ts` is present, but `src/mixins/native-control.ts` is not (checked 2026-11-12). Add it before step 4 as its own reviewed change (the shared mixin from the harness template), not inside Switch.ts. Without it, Switch would have to re-implement label forwarding, focus-visible and the composed `change`.
- **`checked` reflection:** frameworks that set the attribute expect it to be live. This is documented as native semantics (Q2), and the stories show the property binding.

## Open questions (recommendation first)

All of these were answered with the recommendation on 2026-11-12 because no reviewer was available. The same answers are recorded in contract.json and SB-0101.

- **Q1:** Use `checked`, the registered alias, rather than `selected`. **Adopted.**
- **Q2:** The `checked` attribute is the default state and does not reflect (native). **Adopted.**
- **Q3:** Use a native `<input type="checkbox" role="switch">`, not `<input switch>` or a hand-made role. **Adopted.**
- **Q4:** Space toggles and Enter does not. **Adopted.**
- **Q5:** The `validation` prop drives the error look, and native validity is independent. **Adopted.**
- **Q6:** The sizes are small and medium, with a ≥ 24×24 overlay. **Adopted.**
- **Q7:** Label, description and error are text props, with no slots. **Adopted.**
- **Q8:** formStateRestore uses a separate on/off marker. **Adopted.**
