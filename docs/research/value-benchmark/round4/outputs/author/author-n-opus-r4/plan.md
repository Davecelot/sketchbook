# Plan: Switch (planning gate)

Status: **approved with recommendations** (2026-11-12). No approver was available in this session; every open question below was answered with its recommendation, as SB-0011 allows, and is recorded in `contract.json` `openQuestions`. The owner can revisit any of them.

## Scope
`sb-switch`: one on/off setting with label, description, error, `required`, `disabled`, `name`/`value`, `checked`, and two sizes (`default`, `sm`). Form-associated from the first implementation (rule `form-associated-controls`). Out of scope: indeterminate (the switch role has no mixed state), on/off text inside the track, label placement prop, read-only.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` |

No new mixin or controller: `FormAssociated` (`src/mixins/form-associated.ts`) and `NativeControl` (`src/mixins/native-control.ts`) cover the protocol. The class extends `NativeControl(FormAssociated(LitElement))`, as Checkbox does, and implements only `formValue()`, `formReset()`, `formStateRestore()` and `validationAnchor()`.

## Tokens
All component tokens alias existing semantic tokens (contract `tokens`); no new semantic token. Sizes come from `size.switch.*` and `size.icon.default|sm`; colors from `input`, `primary`, `primary-foreground`, `background`, `destructive`, `ring`. Contrast pairs are in the contract and pass check T6 in light and dark.

## Accessibility approach
- Native `<input type="checkbox" role="switch">`, named by `<label for>` in the shadow root; `aria-describedby` to description and error; `aria-invalid`; error in a persistent polite live region.
- Space toggles (native). Enter calls `form.requestSubmit()` (SB-0009) and does not toggle.
- Solid focus ring; off track at 3:1; thumb position conveys state, not color alone; transitions off under reduced motion; mirrored under RTL.

## Test plan (test-first)
Behavior spec, one test each, seen failing before the code:
1. `label` is the accessible name; role is `switch`; clicking the label toggles.
2. `hide-label` keeps the name.
3. `description` and `error` are in the accessible description; `error` sets `aria-invalid` and `customError`.
4. `checked` property and attribute; attribute is not reflected on toggle.
5. `size`: default track 32×20 / thumb 16; `sm` 24×16 / 12.
6. Space toggles; Enter submits the form and does not toggle; Tab focus shows the ring (`:state(focus-visible)`).
7. `input` and `change` composed, once per user toggle; none when `checked` is set from code; `FormData` inside a `change` listener sees the new value.
8. `disabled` cannot toggle, not focusable, not submitted.
9. FormData: `name=value` only while on; custom `value`.
10. `form.reset()` restores the `checked` attribute default.
11. `<fieldset disabled>` disables without touching the `disabled` attribute; re-enabling restores it.
12. `required`: `valueMissing` while off, valid while on; aria-hidden asterisk; invalid look after blur.
13. `<label for>` on the host toggles it.
14. Thumb mirrors under `dir="rtl"`.
15. axe clean on every story.

Stories: Default, Checked, With description, With error, Required, Disabled, Small, In a form.

## Accessibility deviations from the references
- Solid focus ring instead of a translucent one (WCAG 1.4.11).
- Off track on `color.input` (3:1) instead of a light gray (WCAG 1.4.11).
- Native checkbox with `role="switch"` instead of a button (native validity and keyboard).
- Enter submits rather than toggles (APG lists Enter as optional).

All recorded in `realizations.web.drift`.

## Risks
- Some screen readers announce `required` on a switch inconsistently; the visible asterisk plus the error text cover it.
- The input is stretched over the track and transparent; the hit area must match the track in both sizes (covered by test 5 and the label-click test).

## Open questions (recommendation first)
| # | Question | Answer (recommended, chosen) |
| --- | --- | --- |
| Q1 | Native input or button? | Native `<input type="checkbox" role="switch">` (SB-0007 native-first). |
| Q2 | Does Enter toggle? | No: Enter submits, like the native checkbox and Checkbox (SB-0009). Space toggles. |
| Q3 | Reflect `checked`? | No: the attribute is the reset default. |
| Q4 | Sizes? | `default` 32×20/16 and `sm` 24×16/12; label typography unchanged. |
| Q5 | `label` required? | Yes; `hide-label` keeps the name. |
| Q6 | Label before or after? | After the track; no placement prop (YAGNI). |
