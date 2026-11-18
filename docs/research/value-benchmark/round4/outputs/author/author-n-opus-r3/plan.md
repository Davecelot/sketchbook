# Plan: Switch (planning gate)

Status: **approved under SB-0011** (no reviewer was available on 2026-11-12; every open question below was taken with its recommendation and can be revisited). Tests and code are not part of this change; they start with the component-builder skill.

## Scope
`sb-switch`: one element, a native `<input type="checkbox" role="switch">` styled as a track and thumb, with label, description, error, `required`, `disabled`, `name`/`value`/`checked` and two sizes (`default`, `sm`). Form-associated from the first implementation. Out of scope: read-only, a loading state, On/Off text in the track, icons in the thumb, Enter toggling.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` |

No new mixin, controller or dependency: `FormAssociated` (`src/mixins/form-associated.ts`) and `NativeControl` (`src/mixins/native-control.ts`) already cover the protocol, the label forwarding, `delegatesFocus`, focus-visible and the composed `change`. The component implements only `formValue`, `formReset`, `formStateRestore` and `validationAnchor`.

## Tokens
All 26 component tokens alias existing semantic tokens (contract.json `tokens`); no semantic token added. Track width, height and thumb travel are computed in CSS from `--sb-switch-thumb-size(-sm)` and `--sb-switch-track-inset` (Q6). Contrast pairs declared in the contract pass T6 in light and dark.

## Accessibility approach
- Native checkbox + `role="switch"`: Space, checked state, `required`/`valueMissing`, `:disabled` and label activation come from the platform (SB-0007).
- Name from the `label` prop through `<label for>` in the shadow root; description and error by `aria-describedby`; `aria-invalid`; polite live error region.
- Enter calls `form.requestSubmit()` (SB-0009).
- 3px solid ring; state shown by thumb position and color; reduced motion removes the transition.

## Test plan (test-first)
Stories: Default, Checked, Small, WithDescription, Invalid (error), Required, Disabled, DisabledChecked, HiddenLabel, InForm. Behavior spec, one test each, all seen failing before code:
- Props: `label` names the switch (role `switch`); `hide-label` keeps the name; `description` in the accessible description; `size="sm"` renders a 24×14 track and default 32×18; `checked` attribute sets initial on; `value` default `on` and custom value; `disabled` cannot toggle.
- States: on paints the primary track and moves the thumb; focus-visible ring on keyboard focus only; invalid sets `aria-invalid` and the error border; disabled dims via `:host(:disabled)`.
- Keyboard: Tab focuses; Space toggles; Enter submits the enclosing form and does not toggle.
- Events: `input` and `change` once per toggle, composed, observed on the host.
- Form: FormData has `name=value` only while on (read inside a `change` listener too); `form.reset()` restores the attribute default; `<fieldset disabled>` disables and removes it from FormData without setting the attribute, and re-enabling restores it; `required` + off is `valueMissing`, `:invalid`, blocks submit and `reportValidity()` focuses the input; `error` sets customError; `<label for>` on the host toggles it.
- Accessibility: name, description, `aria-checked` true/false, invalid, label click toggles, axe clean on every story; reduced motion has no transition.

## Accessibility deviations from the references
- Unchecked track uses `color.input` (3:1) instead of the reference's light gray (WCAG 1.4.11).
- Solid 3px focus ring instead of the reference's translucent ring.
- Unchecked thumb is `color.background` in dark mode too, not foreground.
- Label, description and error are built in (shadow DOM), like Checkbox and Input.

## Risks
- `role="switch"` on a native checkbox: some older screen readers announce "checkbox"; current Chromium, Firefox and WebKit map it to switch. Covered by an accessible-role assertion.
- Thumb travel depends on the CSS calc staying in sync with the inset token; covered by the size test.
- RTL: thumb travel must mirror (`:dir(rtl)`), checked in a story.

## Open questions (recommendation first)
All answered with the recommendation, recorded in contract.json `openQuestions`:
1. Native checkbox with `role="switch"` (recommended, chosen) vs a `<button role="switch">`.
2. Enter submits the form, does not toggle (recommended, chosen).
3. `checked` not reflected (recommended, chosen).
4. `size="sm"` keeps the label size (recommended, chosen).
5. `label` required (recommended, chosen).
6. Track size derived from the thumb, no new semantic token (recommended, chosen).
