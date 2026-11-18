# Plan: Switch (planning gate)

Status: **draft, questions answered without an approver.** No person was available in the session to approve this plan; every open question took its recommendation (recorded in the contract's `openQuestions`). A reviewer should confirm it before tests and code start (planning gate, then test-first).

## Scope

- One element, `<sb-switch>`: on/off setting, form-associated, label, description, error message, sizes `small` and `medium`.
- Out of scope: `hideLabel`, label position, a hover/pressed look, icons in the thumb, a loading state, an indeterminate state.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` |

No new mixin, controller or helper: `FormAssociated` and `NativeControl` cover the form protocol, label forwarding, `click()`, focus delegation, focus-visible state, the composed `change` and the name warning. The component implements the four hooks, the render, and appends the error-message id to `describedBy`.

## Tokens

All 28 component tokens alias existing semantic tokens (`size.switch.*`, `space.switch.inset`, `color.input|primary|primary-foreground|background|foreground|muted-foreground|destructive|ring`, `focus.ring.*`, `opacity.disabled`, `motion.*`, type tokens). No new semantic token. The thumb size is `calc(height - 2 * inset)` on component tokens; the `2` gets a `sketchbook-allow-literal` comment if T5 flags it.

## Accessibility approach

- Native `<input type="checkbox" role="switch">` inside the track, transparent and full-size, so the track is the hit target and the browser owns state, Space, `required` and the validation message.
- Name from a `<label for>` in the shadow root; description and error message through `aria-describedby`; `aria-invalid` while `validation="error"`.
- Thumb and track `aria-hidden`; the thumb moves, so state is not color-only.
- Thumb transition off under `prefers-reduced-motion: reduce`.

## Test plan (test-first)

Behavior spec, one test each, written from the contract and run failing before any code:

- Props: `checked` (attribute sets initial state, property toggles), `value` (default `on`, custom), `name`, `disabled`, `required`, `label`, `description`, `errorMessage` (hidden while `validation="none"`), `validation`, `size` (track box 32×20 vs 24×16).
- States: checked thumb position (start/end, mirrored with `dir="rtl"`), focus-visible ring and `:state(focus-visible)` on keyboard focus only, disabled (not focusable, click does nothing, `:host(:disabled)` dimming), invalid ring.
- Keyboard: Tab focus, Space toggles, Enter submits the form and does not toggle, Tab skips when disabled.
- Events: `change` and `input` reach a host listener on click, label click and Space; `change` listener sees the new value in `FormData`; no event on programmatic change or reset.
- Form: FormData has `name=value` only while on; `form.reset()` restores the `checked` attribute; `<fieldset disabled>` disables without touching the attribute, and re-enabling restores it; `required` + off is `valueMissing`, `checkValidity()` false, `reportValidity()` focuses the switch; `<label for>` outside activates it.
- Accessibility: role `switch` with the label as name, description and error as description, `aria-invalid`, empty-label warning, axe clean in both sizes, on/off, error and disabled.

## Accessibility deviations from the references

- Enter does not toggle (APG: optional). It keeps the native checkbox model shared by every form control here.
- The off track uses `color.input`, darker than the visual reference, so it meets 3:1 against the page (WCAG 1.4.11); this is a semantic-token deviation already recorded on `color.input`.

## Risks

- Small track (24×16) is below 24×24 on its own; the label is what meets 2.5.8. A future `hideLabel` would need a larger hit area.
- `formDisabledCallback` timing is handled by the mixin; the fieldset re-enable test guards it.
- `:state()` is missing in older engines; only the host's focus-visible state is lost there (the inner ring still works).

## Open questions (recommendation first)

All answered with the recommendation on 2026-11-12 (no approver available); see the contract.

1. Q1 Backing element: `<input type="checkbox" role="switch">`. Answered: yes.
2. Q2 Enter toggles? No; Enter submits the form. Answered: no.
3. Q3 `validation="error"` affects form validity? No, presentation only; `required` drives validity. Answered: presentation only.
4. Q4 Reset restores: the `checked` attribute; `checked` not reflected. Answered: attribute.
5. Q5 Sizes: `small` and `medium`, track and thumb only. Answered: yes.
6. Q6 Label after the track, no `hideLabel`. Answered: yes.
