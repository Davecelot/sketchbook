# Plan: Switch (planning gate)

Status: **draft**. Tests and code start only after approval (planning gate, then test-first). No approver was available when this plan was written (2026-11-12): every open question below was answered with its recommendation and recorded in `contract.json` `openQuestions`; the plan itself still awaits the owner's approval before any test or code is written.

## Scope
`sb-switch`: one on/off setting with label, description, error and two sizes (`default`, `sm`), form-associated from the first implementation. Out of scope: label position option, read-only, loading, icons in the thumb, a switch group.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` |

## Tokens
All `switch.*` tokens in the contract alias existing semantic tokens; no new semantic or foundation token. Sizes come from `size.switch.width|height(-sm)` and `space.switch.inset`; thumb from `size.icon.default|sm`. Contrast pairs declared in the contract pass T6 in light and dark.

## Accessibility approach
- `FormAssociated(NativeControl(LitElement))`; inner `<input type="checkbox" role="switch">` with `<label for>` in the shadow root; `delegatesFocus`.
- Space toggles natively; Enter calls `form.requestSubmit()` (SB-0009).
- `aria-describedby` to description and error; `aria-invalid`; polite live region for the error; `error` sets `customError`.
- `?disabled=${this.isDisabled}`; dim with `:host(:disabled)`.
- Thumb transition removed under `prefers-reduced-motion`; thumb mirrored under `:dir(rtl)`; track border visible in forced colors.

## Test plan (test-first)
Stories: Default, Checked, Small, With description, With error, Required, Disabled, Hidden label, In a form.

Behavior spec (Playwright, must fail before the code exists):
1. Role `switch`, named by `label`; label click toggles; `hide-label` keeps the name.
2. Space toggles; Enter submits the form without toggling; Tab order; focus ring visible on keyboard focus only.
3. `aria-checked` follows `checked`; thumb moves to the end when on (and to the start under `dir=rtl`).
4. `input` and `change` fire once per user toggle, composed; not on `checked` set from script or on reset.
5. FormData: `name=value` while on, absent while off, custom `value`; a `change` listener sees the new FormData.
6. `form.reset()` restores the `checked` attribute default.
7. `<fieldset disabled>` disables it (not focusable, not submitted, dimmed) without adding the `disabled` attribute; re-enabling restores it.
8. `required`: `valueMissing` while off, form blocks submit, `reportValidity()` focuses it, asterisk aria-hidden, invalid look after blur.
9. `error`: in the accessible description, `aria-invalid`, `customError`, announced once.
10. `<label for>` outside the component toggles it.
11. `size="sm"` renders a 24x16 track; default 32x20.
12. `disabled` cannot toggle.
13. axe clean on all stories.

## Accessibility deviations from the references
- Unchecked track `color.input` (3:1) instead of the reference's light gray.
- Solid 3px focus ring instead of a translucent one.
- Enter submits instead of toggling (APG lists Enter as optional for switches).

## Risks
- `role="switch"` on a native checkbox: verify the computed role and `aria-checked` in Chromium, Firefox and WebKit.
- A 20px-high track is under 24px; the clickable label row and the 12px gap carry WCAG 2.5.8; a `hide-label` switch needs clear space around it (documented).
- `required` on a switch is unusual; docs steer it to consent-like settings.

## Open questions (recommendation first)
All answered with the recommendation on 2026-11-12 (see contract.json for the full text):
- Q1 Element: `<input type="checkbox" role="switch">` — native validity, label and form behavior; reuses the Checkbox mixins.
- Q2 Enter: submit the form, don't toggle (SB-0009, matches Checkbox).
- Q3 `checked` not reflected; the attribute is the reset default.
- Q4 `required` means must be on.
- Q5 Sizes `default` and `sm` (aliased to medium and small).
- Q6 Label after the switch, no position option (YAGNI).
- Q7 `label` required, with `hide-label`.
- Q8 Thumb `color.background` in every mode.
- Q9 Thumb animates 150ms, no animation under reduced motion.
