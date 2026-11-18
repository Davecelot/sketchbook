# Plan: Switch (planning gate)

Status: **approved by default** (no approver was available; every open question was answered with the recommended option). Tests and code start from here, test-first.

## Scope
`sb-switch`: an on/off toggle with `label`, `hide-label`, `description`, `error`, `size` (`medium`, `small`), and the form props `name`, `value`, `checked`, `required`, `disabled`. Form-associated from the first version (rule form-associated-controls). Not in scope: indeterminate, label position, a group wrapper.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` |

## Tokens
All `--sb-switch-*`, aliasing semantic tokens only (see contract.json `tokens`). Track and thumb sizes come from the existing `size.switch.*` semantic tokens and `size.icon.*`; no new semantic token is needed. The thumb offset and travel are private `--_*` values computed from the track and thumb sizes.

## Accessibility approach
Native `<input type="checkbox" role="switch">` in the same shadow root as a native `<label for>`; class extends `FormAssociated(NativeControl(LitElement))`. Space toggles natively. Enter submits the form via `requestSubmit()` (SB-0009). Description and error through `aria-describedby`, `aria-invalid`, persistent polite live region for the error. Inner input rendered with `?disabled=${this.isDisabled}`; host styled with `:host(:disabled)`. A `<label for>` click on the host is forwarded to the input. `syncFormState()` is called in the input handler so a `change` listener sees the new `FormData`. The thumb is `aria-hidden`.

## Test plan (test-first)
One test per item in contract.json `realizations.web.coverage`:
- name from `label`; `role=switch`; label click and `<label for>` toggle; hide-label keeps the name
- Space toggles, Enter does not toggle; keyboard-only focus ring, not on pointer focus
- `checked` attribute and property; thumb position and track color change; rtl mirrors the thumb
- `size` medium and small measured track dimensions
- description and error in the accessible description; `aria-invalid`; error live region
- `input` and `change` composed, once per toggle
- form: FormData has `name=value` only while on, custom `value`, `form.reset()` restores the attribute default, `<fieldset disabled>` blocks toggling and submission and re-enable restores it without changing the `disabled` attribute, `required` gives `valueMissing` and `:invalid`, `reportValidity()` focuses the input, `error` gives `customError`, Enter submits, FormData inside a `change` listener
- axe clean on every story (all sizes, states, error, disabled, required)
Then run `npm run test:component -- tests/switch` and confirm each fails for the right reason (element missing) before implementing.

## Accessibility deviations from the references
- Solid 3px focus ring instead of a translucent one (WCAG 1.4.11), as in Checkbox and Input.
- Off track in `input` (3:1 against the page) instead of a pale gray (WCAG 1.4.11).
- Enter submits instead of toggling (APG leaves Enter optional).

## Risks
- Contrast of the off thumb (`background`) against the off track (`input`) must hold 3:1 in light and dark; check T6 covers the pairs in the contract.
- The thumb needs a logical-property transform (`inset-inline-start`) to mirror in rtl without a prop.
- Chrome and Safari disagree on how `role=switch` is exposed on an input in some versions; the test asserts the role through the accessibility tree.

## Open questions (recommendation first)
All answered with the recommendation; see contract.json `openQuestions`.
1. Is `checked` reflected? No (reset default, as Checkbox).
2. Is `label` required? Yes.
3. Native input with `role=switch` or a custom div? Native input.
4. Does Enter toggle? No, it submits the form.
5. Which sizes? `medium` (default) and `small`.
6. Indeterminate state? No.
7. Label-position or direction prop? No.
