# Switch: plan

Status: approved by default on 2026-11-12. No one was available, so every open question took its recommended answer (recorded in `contract.json` `openQuestions`, Q1 to Q7). Implementation has not started.

## Scope

`sb-switch`: an on/off toggle, form-associated, with `label`, `description`, `errorMessage`, `validation`, `size` (small, medium), `required`, `disabled`, `name`, `value`, `selected` and a `change` event. Out of scope: read-only, hidden label, an indeterminate state, a switch group.

## Files

- `src/components/switch/switch.ts` and `switch.scss` (`switch.styles.ts` is generated).
- `src/components/switch/switch.stories.ts`.
- `playwright/tests/switch/switch.behavior.spec.ts`.
- `src/index.ts` is generated.

## Reuse

- `FormAssociated(LitElement)` then `NativeControl(...)`, as the form-associated-controls rule requires. Both live in `src/mixins/`.
- Mixin gap: `describedBy` carries the description only, so the component adds the error id while `validation` is `error`. Do not fork the mixin for one component; extend it in the component first, and move it into the mixin if a second control needs it.

## Tokens

Component tokens are in the contract (`switch.*`) and alias semantic tokens only, including the existing `size.switch.*` and `space.switch.inset`. No new semantic token is needed. `npm run check` (T6) passes the contrast pairs in every mode.

## Accessibility approach

- A native `<input type=checkbox role=switch>` inside the shadow root supplies focus, Space and state.
- Name from `label`; `aria-describedby` for description and, in error, the error message; `aria-invalid` in error.
- Enter submits the form through the mixin's implicit-submit helper.
- Focus ring from `:focus-visible` on the input, drawn outside the track.
- The 24 px target size: pad the small control's hit area.

## Test plan (test-first)

One Playwright test per item, written and seen failing before any code:

- Props: `selected` (reflect, toggles), `value`, `name`, `label` (name and visible text), `description`, `errorMessage` (hidden at `none`, shown at `error`), `validation`, `size` (track dimensions per size), `required`, `disabled`.
- Keyboard: Tab focus, Space flips, Enter does not flip and submits, a disabled switch is skipped.
- Event: `change` fires once per user flip, after `selected` updates, bubbles and composes, and does not fire on a programmatic change or reset.
- Form: `FormData` has `name=value` while on and nothing while off, including inside a `change` listener; `form.reset()` restores the initial state; `<fieldset disabled>` disables and re-enabling restores without touching the `disabled` attribute; `required` is invalid while off and valid when on, and `reportValidity()` focuses it; `<label for>` toggles it.
- Accessibility: role `switch`, checked state, name from `label`, description and error linked, `aria-invalid`, the missing-label warning, and axe clean in light and dark, in every size and validation state.

## Risks

- `:state(focus-visible)` support is partial on older engines; only that state is lost, not the control.
- The 16 px small track is under the 24 px target size, so the hit area padding must be verified in the browser.
- The error id extension above is the one place the mixin does not already cover.

## Open questions

None outstanding. All seven are answered with their recommendation in the contract.
