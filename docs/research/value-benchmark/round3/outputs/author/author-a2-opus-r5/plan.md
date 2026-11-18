# Plan: Switch (planning gate)

Status: **approved under SB-0011** (owner pre-approval; no one was available to review this session). Every open question below was answered with its recommendation; the owner can revisit any of them. Tests and code start test-first; this change writes the specification only.

## Scope
- One element, `sb-switch`: an on/off setting with label, description, error, `required`, `disabled`, `name`/`value`/`checked` and two sizes (`default`, `sm`).
- Form-associated from the first implementation (rule form-associated-controls): FormData while on, `form.reset()`, `<fieldset disabled>`, `required` validity, `<label for>` activation, form state restore.
- Out of scope: label position option, `lg` size, read-only, icons inside the thumb, a loading state, an `indeterminate` state (a switch has none).

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` (Default, Checked, Small, With description, With error, Required, Disabled, Disabled checked, Hidden label, In a form, In a disabled fieldset, RTL) |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` (extends `NativeControl(FormAssociated(LitElement))`) |
| 5 | Registry status draft -> wip -> beta, realizations updated, `npm run check` |

## Tokens
All component tokens alias existing semantic tokens; no semantic token is added. Track sizes come from `size.switch.width|height|width-sm|height-sm` and `space.switch.inset` (already in `spec/tokens/semantic/base.tokens.json`, unused until now); thumb from `size.icon.default|sm`; colors from `color.input`, `color.primary`, `color.background`, `color.primary-foreground`, `color.destructive`, `color.ring`. Contrast pairs are declared in the contract and pass check T6 in every mode.

## Accessibility approach
- Native `<input type="checkbox" role="switch">` with a native `<label for>` in the same shadow root (APG Switch pattern).
- Space toggles; Enter submits the form via `form.requestSubmit()` (SB-0009) and does not toggle.
- `aria-describedby` to description and error; `aria-invalid` while invalid; persistent polite live region for the error; `error` sets `customError`.
- 3px solid offset focus ring; 3:1 off track; state shown by thumb position as well as color; reduced motion honored; thumb mirrored in RTL.

## Test plan (test-first)
Behavior spec `playwright/tests/switch/switch.behavior.spec.ts`, all failing before the code exists:
1. Role is `switch`, accessible name is the label; `aria-checked` false then true after toggling.
2. Clicking the track and clicking the label each toggle; `<label for>` pointing at the host toggles and focuses it.
3. Tab focuses it (one tab stop); Space toggles; Enter does not toggle and submits the enclosing form.
4. Focus ring visible on keyboard focus only.
5. `input` and `change` fire once per user toggle, composed; setting `checked` from code fires neither; a `change` listener reading `FormData` sees the new value.
6. FormData: `name=on` while on, absent while off; custom `value` submitted.
7. `form.reset()` restores the `checked` attribute default (both from on and from off).
8. `<fieldset disabled>`: cannot focus or toggle, not submitted, host `disabled` attribute untouched; re-enabling the fieldset restores it.
9. `disabled`: cannot toggle, not submitted, dimmed.
10. `required`: invalid (`valueMissing`) while off, valid when on; `reportValidity()` focuses it; asterisk aria-hidden; invalid look only after interaction or submit attempt.
11. `error`: shown, in the accessible description, `aria-invalid="true"`, blocks submission (`customError`), announced via live region.
12. `description` in the accessible description; `hide-label` keeps the name.
13. Sizes: default track 32×20 / thumb 16px; sm track 24×16 / thumb 12px; thumb at the end edge when on, mirrored under `dir="rtl"`.
14. No transition under `prefers-reduced-motion: reduce`.
15. Empty `label` logs one dev warning.
16. axe clean on every story.
Manual before stable: a screen-reader pass (VoiceOver + Safari, NVDA + Firefox) confirming the on/off announcement, required and the error announcement (a11y-auditor brief).

## Accessibility deviations from the references
- Off track uses `color.input` (3:1) instead of the reference's lighter track (WCAG 1.4.11).
- Focus ring 3px solid and offset instead of a translucent ring (WCAG 1.4.11).
- Enter submits instead of toggling (APG lists Enter-to-toggle as optional).
- Label, description and error are built in (shadow DOM keeps external labels from naming the control).

## Risks
- `role="switch"` on a checkbox input with `required`: some screen readers may not announce "required" for the switch role; covered by the manual pass, with the asterisk and error text as the visible fallback.
- Thumb transform must follow `:dir(rtl)` and both sizes without hard-coded offsets; derive the travel from track width, thumb size and inset tokens.

## Open questions (recommendation first)
All answered with the recommendation on 2026-11-12 (SB-0011), mirrored in `contract.json` `openQuestions`:
- **Q1 Native checkbox with role=switch or a button?** Recommendation and answer: native checkbox with role=switch (browser-provided keyboard, state and validity; reuses the Checkbox mixins).
- **Q2 Does Enter toggle?** Recommendation and answer: no; Space toggles, Enter submits (SB-0009).
- **Q3 Reflect checked?** Recommendation and answer: no; the attribute is the reset default.
- **Q4 Label required, and position?** Recommendation and answer: required, after the track, `hide-label` available, no position prop.
- **Q5 Sizes?** Recommendation and answer: `default` and `sm` on the existing `size.switch.*` tokens; no `lg`.
- **Q6 What does required mean?** Recommendation and answer: must be on (`valueMissing` while off); invalid look after interaction or submit.
- **Q7 Animate the thumb?** Recommendation and answer: yes, fast step, removed under reduced motion.
