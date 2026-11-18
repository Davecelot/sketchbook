# Plan: Switch

Status: approved by default under the no-approver rule of this session; every open question took its recommendation (see SB-0101). Revisit by superseding that decision.

## Scope
`sb-switch`: an on/off toggle with label, description, error and sizes `default`/`sm`. Form-associated (value, reset, disabled fieldset, required). No implementation is part of this change.

## Files
`src/components/switch/{Switch.ts, Switch.scss, Switch.styles.ts, Switch.stories.ts, index.ts}`; `playwright/tests/switch/switch.behavior.spec.ts`; registry status moves from planned once built.

## Tokens
All in `contract.json` as `switch.*`, aliasing semantic tokens only (`size.switch.*`, `space.switch.inset`, color, radius, focus, opacity, motion).

## Accessibility approach
Native checkbox with `role="switch"`, native label in one shadow root, `aria-describedby`, `aria-invalid`, persistent live region for the error, 3:1 off track and solid focus ring, RTL-aware thumb.

## Test plan (test-first)
Behavior spec covering the contract's `realizations.web.coverage`: keyboard (Space toggles, Enter submits), FormData, `form.reset()`, `<fieldset disabled>` and re-enable, `required` validity, `<label for>`, both sizes, axe on every story. Seen failing before the code.

## Risks
Thumb travel in RTL; sm track (24x16) target size, relying on the label row; Enter-submits differs from some switch implementations.

## Open questions (all answered with the recommendation)
1. Label, description, error inside Switch: yes.
2. `label` required: yes.
3. `checked` reflected: no.
4. Sizes: `default` and `sm`.
5. Enter: submits, does not toggle.
6. Native input with `role="switch"`: yes.
7. RTL thumb mirrors: yes.
