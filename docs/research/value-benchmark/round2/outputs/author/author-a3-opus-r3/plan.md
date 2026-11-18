# Plan: Switch (planning gate)

Status: **complete, recommended answers taken** (2026-11-12). No approver was available in the authoring session; every open question took its recommended answer, recorded in `contract.json` `openQuestions` and below, and SB-0101 stays `proposed` until a person accepts it. A reviewer may reopen any answer before the build starts.

## Scope
`sb-switch`: one on/off setting with label, description, error, `size` (`default`, `sm`), form association (FormData, reset, disabled fieldset, `required`, `<label for>`). Out of scope: a label that changes with the state, an `lg` size, icons in the thumb, a read-only state, a switch group.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` |

`Switch.ts` extends `FormAssociated(NativeControl(LitElement))` and implements only `formValue`, `formReset`, `formStateRestore`, `validationAnchor`, as Checkbox does. No new mixin, controller or dependency: it is a single control, not an option row, so the option-row mixin the form rule mentions does not apply.

## Tokens
All component tokens alias existing semantic tokens (`size.switch.*`, `size.icon.default|sm`, `space.switch.inset`, `color.input|primary|primary-foreground|background|destructive|ring`, …). No new semantic token. Contrast pairs declared in the contract pass T6 in light and dark.

## Accessibility approach
Native `<input type="checkbox" role="switch">` + native `<label for>` in the shadow root; Space toggles (native), Enter submits (SB-0009); `aria-describedby` to description and error; `aria-invalid`; error in a persistent polite live region; 3px solid focus ring; off track at 3:1; thumb motion off under reduced motion; thumb at the inline end (RTL).

## Test plan (test-first)
One test each, all seen failing before the implementation:
- **Props:** `label` names the switch (role switch); `hide-label` keeps the name; `description` is the accessible description; `error` adds to the description, sets `aria-invalid`, `customError`; `size` default 32x20 and sm 24x16 track; `value` custom value submitted; `checked` starts on (`aria-checked=true`); `required` shows the aria-hidden asterisk; `disabled` cannot toggle and is dimmed.
- **Keyboard:** Tab focuses with a visible ring; Space toggles; Enter submits the form and does not toggle; disabled is skipped by Tab.
- **Pointer:** click on the track toggles; click on the label toggles.
- **Events:** `input` and `change` composed, once per toggle; `change` listener sees the new FormData.
- **Form:** FormData has `name=value` only while on; `form.reset()` restores the `checked` attribute; `<fieldset disabled>` disables (not submitted, `:disabled`), re-enabling restores it, the author's `disabled` attribute untouched; `required` off is `valueMissing` and blocks submit, on is valid; `reportValidity()` focuses it; `<label for>` outside toggles.
- **Accessibility:** role switch with `aria-checked` true/false; thumb at the inline end when on in RTL; axe clean on every story.

## Accessibility deviations from the references
- Off track `color.input` (3:1) instead of the reference's lighter input color (WCAG 1.4.11).
- Solid 3px focus ring instead of a translucent one (WCAG 1.4.11).
- Enter does not toggle (APG lists it as optional); it submits, as on every form control here.

## Risks
- `role="switch"` on a checkbox input: some older screen readers announce "checkbox". Accepted; the native input gives validation and label activation that a button would need rebuilt.
- `required` on a switch is unusual; supported because forms ask for it, and the usage guidance says to explain why.

## Open questions (recommendation first; all answered with the recommendation)
1. Native checkbox input with `role="switch"` (recommended, chosen) or a `<button role="switch">`.
2. Enter submits, does not toggle (recommended, chosen) or Enter toggles.
3. `checked` not reflected, the attribute is the reset default (recommended, chosen).
4. `label` required (recommended, chosen), `hide-label` for visually hidden.
5. Off submits nothing (recommended, chosen) or submits an off value.
6. Sizes `default` and `sm` only (recommended, chosen); no `lg` until asked.
7. No thumb animation under reduced motion (recommended, chosen).
