# Switch: plan

Status: Approved under SB-0011 (owner pre-approval, 2026-11-08). Questions answered with the recommendation on 2026-11-12; nobody was available to review them, so the owner can revisit them below.

## Scope
`sb-switch`: one on/off setting with label, description and error, sizes `default` and `sm`, form-associated from the start (`.claude/rules/form-associated-controls.md`). Out of scope: state text or icons in the thumb (Q6), a `lg` size (Q3), a switch group element (a Field group holds several).

## Files
- `src/components/switch/Switch.ts`: `class Switch extends NativeControl(FormAssociated(LitElement))`; only the four hooks (`formValue`, `formReset`, `formStateRestore`, `validationAnchor`), the `size` prop and the render.
- `src/components/switch/Switch.scss`: only `--sb-switch-*` and `--_*` variables.
- `src/components/switch/Switch.stories.ts`, `src/components/switch/index.ts`.
- `playwright/tests/switch/switch.behavior.spec.ts`.
- Generated, not hand-written: `Switch.styles.ts`, `src/index.ts`, `generated/**` (`npm run generate`).
- Registry status `draft` -> `wip` when the build starts.

Reuse: the Checkbox layout and the two mixins cover everything but the track, the thumb and `size`. No new mixin or controller (the shared option-row mixin is for checkbox/radio options, which a switch is not).

## Tokens
All in `contract.json` `tokens`, each aliasing one semantic token (check T2). Track and thumb sizes use the existing `size.switch.*`, `size.icon.*` and `space.switch.inset`; colors use `input`, `primary`, `background`, `destructive`, `ring`. No new semantic token is needed.

## Accessibility approach
- Native `<input type="checkbox" role="switch">` with `?disabled=${this.isDisabled}`, `this.describedBy`, `this.renderDescription()` and `syncFocusVisible`/`handleBlur`/`handleChange` wired on it. Checked state is native; no hand-set `aria-checked`.
- Space toggles natively; Enter calls `form.requestSubmit()` (SB-0009).
- `syncFormState()` runs synchronously in the change handler so a `change` listener sees the new `FormData`.
- A click whose `composedPath()[0]` is the host (from `<label for>`) is forwarded to the input.
- `:host(:disabled)` for the dimmed look; the thumb transition is removed under `prefers-reduced-motion`; the thumb mirrors under `:dir(rtl)`.

## Test plan (test-first)
Write the stories and the behavior spec first, run `npm run test:component -- tests/switch` and record that every test fails because `sb-switch` is missing. One test per item:
- Props: label is the name; `hide-label` keeps the name; description and error in the accessible description; `value` custom; `checked` attribute sets the start state; `size` reflects and gives 32x20 / 24x16 tracks.
- States: checked moves the thumb and paints the track; focus-visible ring on keyboard focus only; invalid sets `aria-invalid`; disabled cannot toggle.
- Keyboard: Tab focuses; Space toggles; Enter submits the form and does not toggle.
- Events: `input` and `change` composed, once per toggle; `change` sees the new `FormData`.
- Form: `FormData` has `value` only while on; `form.reset()` restores the attribute default; `<fieldset disabled>` disables, is not submitted, and re-enabling restores it without touching `disabled`; `required` gives `valueMissing` while off and blocks submit; `error` sets `customError`; `<label for>` toggles.
- Accessibility: role `switch` with checked state exposed; error announced (polite live region); axe clean on every story in light and dark.

Then implement until green: `npm run check`, `npm run typecheck`, `npm run test:component`; then review-rangers and the parity audit before `beta`.

## Risks
- Role mapping: `role="switch"` on a native checkbox relies on the browser mapping checked to the switch state; the role test checks it in Chromium.
- Target size: both tracks are under 24px high, so WCAG 2.5.8 rests on the spacing exception and the clickable label row; keep the 12px gap.
- Enter not toggling differs from some switch libraries; it follows native behavior and SB-0009.

## Open questions (answered with the recommendation)
- Q1 Reflect `checked`? No; the attribute is the reset default.
- Q2 Enter toggles or submits? Submits (SB-0009); Space toggles.
- Q3 Sizes? `default` and `sm` (mapped to medium and small); no `lg`.
- Q4 Label required? Yes; `hide-label` keeps it as the name.
- Q5 Meaning of `required`? Must be on (native `valueMissing`); agreements stay in Checkbox.
- Q6 On/Off text or icons? No.
- Q7 Thumb color? One token, `color.background`, 3:1 against both tracks in both modes; recorded as drift.
- Q8 Thumb animation? Short slide with the motion tokens, none under reduced motion.
