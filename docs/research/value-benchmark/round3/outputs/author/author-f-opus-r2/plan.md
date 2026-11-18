# Plan: Switch (planning gate)

Status: **ready for implementation, not started**. No approver was available on 2026-11-12. Every open question below was answered with its recommendation, and the answers are recorded in `contract.json` `openQuestions` and in SB-0101 so the owner can revisit them. Tests and code start only after that (planning gate, then test-first). This change writes the specification only.

## Scope
`sb-switch`: one on/off setting with label, description, error and two sizes (`default`, `sm`). It is form-associated from the first implementation (rule form-associated-controls): it submits `value` while on, resets with its form, is disabled by a disabled `<fieldset>`, validates `required` (must be on), and is activated by `<label for>`. Keyboard: Tab and Space. Enter submits the form.

Out of scope: readonly, loading, a mixed state, a label that changes with the state, and a switch group component.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts`: Default, Checked, Small, With description, With error, Required, Disabled, Hidden label, In a form, RTL |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` (barrel regenerated) |
| 5 | `spec/registry.json` and contract status `draft` -> `wip` -> `beta` with `realizations.web` filled (files, parts, coverage) |

## Implementation notes
- `class SbSwitch extends NativeControl(FormAssociated(LitElement))`, the same order as `SbCheckbox`. Implement only `formValue()` (`checked ? value : null`), `formReset()` (`checked = hasAttribute('checked')`), `formStateRestore(state)` (`checked = state != null`) and `validationAnchor()` (the inner input, inherited from NativeControl).
- Render `<input type="checkbox" role="switch" part="input" .checked=${live(this.checked)} ?disabled=${this.isDisabled} ?required=${this.required} aria-describedby=${this.describedBy} aria-invalid=…>` over `<span part="track" aria-hidden="true"><span part="thumb"></span></span>`, with `syncFocusVisible`, `handleBlur`, `handleChange` and `implicitSubmit` wired as Checkbox does. `handleChange` sets `checked` and calls `syncFormState()` synchronously.
- `error` sets `setCustomValidity(error)` on the anchor (customError, SB-0009).
- Styles: only `--sb-switch-*` (T4). `:host([size="sm"])` swaps the width, height and thumb tokens. Thumb travel = width − 2·border − thumb − 2px, via `translateX` mirrored under `:dir(rtl)`. Dim with `:host(:disabled)`, never `:host([disabled])`. Transition off under `prefers-reduced-motion: reduce`.
- The `control` part is `min-block-size: var(--sb-switch-hit-area)` and the input fills it (opacity 0, cursor inherits), so the 24px target holds with `hide-label`.

## Tokens
All alias semantic tokens and are already generated (`--sb-switch-*` in `generated/css/tokens.css`): sizes from `size.switch.*`, thumb from `size.icon.default` / `size.icon.sm`, hit area `size.control.xs`, colors `input`, `primary`, `primary-foreground`, `background`, `destructive`, `ring`, `foreground`, `muted-foreground`. No new semantic tokens. Contrast pairs pass T6 in light and dark.

## Test plan (test-first)
Behavior spec `playwright/tests/switch/switch.behavior.spec.ts`, written first and seen failing:
1. Role `switch` with the label as its accessible name; `aria-checked` false, then true after a toggle.
2. Click on the switch and click on the label toggle it; Space toggles; Enter does not toggle and submits the owning form.
3. Thumb moves to the inline end when on (and to the left under `dir=rtl`); track fill differs between on and off.
4. Keyboard focus shows the 3px ring; a mouse click does not.
5. `input` and `change` are composed and fire once per toggle; FormData read inside `change` already has the new value.
6. FormData: nothing while off; `name=on` while on; a custom `value` is submitted.
7. `form.reset()` restores the authored `checked` attribute (both ways).
8. `<fieldset disabled>` disables it without touching its `disabled` attribute and removes it from FormData; re-enabling restores both.
9. `required` while off: `validity.valueMissing`, `checkValidity()` false, submit blocked, `reportValidity()` focuses it; invalid look after blur; the asterisk is aria-hidden.
10. `error` sets customError, `aria-invalid="true"`, appears in the accessible description, and is announced through the polite live region.
11. `description` is in the accessible description.
12. `hide-label` keeps the accessible name.
13. `<label for>` outside the shadow root toggles it.
14. `disabled` cannot be focused or toggled and is not submitted.
15. Sizes: track 32x20 / thumb 16 for `default`, 24x16 / 12 for `sm`; the hit area is at least 24x24 at both sizes.
16. axe clean on every story.

## Accessibility deviations from the references
Recorded as `realizations.web.drift`: a native checkbox input with role switch instead of a button; a solid 3px focus ring; a 24px minimum hit area; the off track at 3:1 (`input` = neutral-500); the off thumb is `background` in dark mode too; an invalid look of its own.

## Risks
- Older screen readers may announce `role="switch"` on an input as a checkbox. That is an acceptable fallback because the state is still conveyed. Verify with VoiceOver and NVDA before `stable`.
- Aligning a 24px hit area with a 20px label line: center the track on the first line and let the hit area overflow equally. Check this in the stories.
- G1 (generated outputs in sync) could not run in this session: the installed engine is missing `harness/cli/docs.mjs`. Generated outputs were rebuilt with the harness generator. Re-run `npm run check` once the engine is repaired.

## Open questions (recommendation first)
All answered with the recommendation on 2026-11-12 (see contract Q0–Q8):
- Q1 Native element: **`<input type="checkbox" role="switch">`** (alternative: `<button role="switch">` with a hidden input).
- Q2 Enter: **submits the form, does not toggle** (alternative: toggle, which APG lists as optional).
- Q3 `checked` reflected: **no**, the attribute is the reset default.
- Q4 Sizes: **`default` (default) and `sm`**.
- Q5 Label: **required, after the switch**, with `hide-label`.
- Q6 Target size: **24px-minimum hit area** (alternative: rely on the label row, which fails with `hide-label`).
- Q7 `required`: **must be on**, as on a native checkbox.
- Q8 readonly / loading: **out of scope**.
