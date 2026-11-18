# Plan: Switch (planning gate)

Status: **approved 2026-11-12** under SB-0011 (owner pre-approval; nobody was available to review in this session). Every open question was answered with its recommendation, recorded below and in `contract.json` `openQuestions`. Tests and code have not been written: next step is test-first (rule `test-first`).

## Scope

- `sb-switch`: one on/off setting with `label` (required), `description`, `error`, `size` (`default` | `sm`), `name`, `value` (`"on"`), `checked`, `required`, `disabled`.
- Form-associated from the first implementation (rule `form-associated-controls`): FormData, reset, fieldset disabled, `required` validity, `<label for>` activation, `error` as customError, Enter submits.
- Out of scope: `hideLabel`, a `lg` size, on/off text or icons in the track, read-only, an option row (Q2, Q4, Q5, Q6).

## Files (in build order)

| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` (Default, Checked, Sizes, With description, Invalid, Required, Disabled, In a form, RTL) |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` |

Reused, not new: `src/mixins/form-associated.ts`, `src/mixins/native-control.ts` (label forwarding, focus-visible, composed `change`, empty-label warning). No new mixin, controller or dependency.

## Tokens

33 component tokens (`switch.*`) in `contract.json`, all aliasing existing semantic tokens; the semantic layer already has `size.switch.width|height|width-sm|height-sm` and `space.switch.inset`. No new semantic token. Contrast pairs declared in `accessibility.contrast`; T6 passes in light and dark.

## Accessibility approach

- Native `<input type="checkbox" role="switch">` (SB-0007 native first): role switch, state true/false, Space toggles, disabled and validity from the platform.
- Name from `label` through a `<label for>` in the same shadow root; `description` and `error` through `aria-describedby` in the same root (SB-0009: no cross-root ID references).
- `aria-invalid` while invalid; error in a persistent polite live region; asterisk `aria-hidden`.
- 3px solid focus ring (SB-0005); state shown by thumb position as well as color; reduced motion disables the thumb transition.
- Manual screen-reader pass (VoiceOver + Safari, NVDA + Firefox) before `stable`, owned by the a11y-checker brief.

## Test plan (test-first)

One test per item, in `switch.behavior.spec.ts`, using `playwright/helpers/`:

- **Props**: label is the accessible name; description and error are the accessible description; `size="sm"` renders 24 × 16 and default 32 × 20; `value` submitted; `checked` attribute sets the initial state and is not rewritten on toggle; `required` shows the asterisk (aria-hidden) and sets native required; `disabled` cannot toggle or focus.
- **States**: on moves the thumb to the end and changes the track fill; keyboard focus shows the ring, pointer focus does not; invalid after blur when required and off, not on first render; `error` sets `aria-invalid`; RTL mirrors the thumb.
- **Keyboard**: Tab focuses; Space toggles; Enter submits the parent form and does not toggle.
- **Events**: one `input` and one composed `change` per toggle (click, label click, Space); none when `checked` is set from code; a `change` listener reading `FormData` sees the new value.
- **Form**: FormData has `name=value` only while on; custom `value`; `form.reset()` restores the attribute default; `<fieldset disabled>` disables and excludes it, re-enabling restores it and leaves the `disabled` attribute untouched; `required` -> `valueMissing`, `checkValidity()` false, `reportValidity()` focuses it; `error` -> `customError`, submit blocked; `<label for>` pointing at the host toggles it.
- **Accessibility**: role `switch` with `aria-checked` false/true; axe clean on every story; empty label logs one warning.

Run `npm run test:component -- tests/switch` and record that every test fails for the right reason (element not defined) before implementing.

## Accessibility deviations from the references

- Focus ring 3px solid ring color instead of the reference's translucent ring (below 3:1).
- Off track uses `color.input` (3:1) instead of the reference's lighter input color.
- Enter submits instead of toggling (APG lists Enter as optional for switches).

## Risks

- `role="switch"` on a native checkbox: older screen readers announce "checkbox"; acceptable fallback (same state, same keys). Verified in the manual pass.
- The `sm` track is under 24px; relies on the label row and gap for WCAG 2.5.8. A consumer who removes the label from view would lose that; `label` is required and there is no `hideLabel` in 0.1.0.
- Dark off thumb uses `color.background` (4.2:1 on the track) instead of the reference's foreground; recorded as drift.

## Open questions (recommendation first)

All answered 2026-11-12 with the recommendation:

1. Reflect `checked`? **No** (attribute = reset default, like Checkbox). Answered: no.
2. Label required; `hideLabel`? **Required; no `hideLabel` now.** Answered: as recommended.
3. Enter? **Submits the form; Space toggles.** Answered: as recommended (SB-0101).
4. Sizes? **`default` and `sm`.** Answered: as recommended.
5. Shared option-row mixin now? **No**, Switch is not an option row. Answered: no.
6. On/off text or icons in the track? **No.** Answered: no.
