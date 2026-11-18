# Plan: Switch

Status: approved by default. No one was available (2026-11-12); every open question took its recommendation and is recorded in `contract.json` `openQuestions` (Q0–Q6), as SB-0011 does for plans.

## Scope
`sb-switch`: an on/off toggle with `label`, `hide-label`, `description`, `error`, `size` (`default`, `sm`), `name`, `value`, `checked`, `required`, `disabled`. Form-associated from the start (rule form-associated-controls). Out of scope: a design-file realization, a Field set grouping, an indeterminate state.

## Files
- `src/components/switch/Switch.ts`, `Switch.scss`, `Switch.stories.ts`, `index.ts`; `Switch.styles.ts` and `src/index.ts` are generated.
- `playwright/tests/switch/switch.behavior.spec.ts`.
- No new mixin: reuse `FormAssociated` and `NativeControl`.

## Tokens
All in `contract.json` `tokens`, aliasing semantic tokens only. The track and thumb sizes and the inset use the existing `size.switch.*` and `space.switch.inset`. Nothing new is added to the semantic layer.

## Accessibility approach
Native `<input type="checkbox" role="switch">` with native `<label for>` in one shadow root; Space toggles; Enter submits (SB-0009); `aria-describedby` for description and error; `aria-invalid`; persistent polite error region; 3:1 track and solid focus ring. Details in contract section 9.

## Test plan (test-first)
One test per prop, state, key binding, event, form behavior and accessibility rule, listed in `realizations.web.coverage`: name, role, Space, Enter, size dimensions, checked paint, description/error, required, hide-label, composed `input`/`change`, disabled, FormData, `form.reset()`, `<fieldset disabled>` and re-enable, `required` validity, `<label for>`, axe. Confirm each fails for the right reason before implementing.

## Risks
- sm track (16px tall) is below the 24px target size: relies on the label row and gap (WCAG 2.5.8). Verify in the behavior spec.
- Thumb travel and mirroring in right-to-left.
- A `change` listener must see the new FormData: sync form state in the handler, not only after render.

## Open questions
All answered with the recommendation first; see `contract.json` Q0–Q6.
