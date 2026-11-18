# Plan: Switch (planning gate)

Status: **draft, recommendations taken without review**. Nobody was available to approve this plan on 2026-11-12; every open question below was answered with its recommendation and recorded in contract.json `openQuestions` and in SB-0101. Tests and code start only after the owner accepts the plan or changes an answer (planning gate, then test-first). This change writes the specification only; no component code.

## Scope
`sb-switch`: an on/off switch for one setting, form-associated, with label, hide-label, description, error, `size` (`default`, `sm`), `name`, `value`, `checked`, `required`, `disabled`. Out of scope: a label-position prop, an indeterminate state, loading state, on/off icons or text inside the track, a switch group.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` (Default, Checked, Sizes, With description, Required, Error, Disabled, Hidden label, In a form, RTL) |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` |
| 5 | contract.json `realizations.web` (files, parts, coverage), registry status `wip` -> `beta` with evidence |

## Tokens
All 31 `switch.*` component tokens in contract.json alias existing semantic tokens; no new semantic token is needed (`size.switch.*` and `space.switch.inset` already exist). Contrast pairs declared in the contract pass T6 in light and dark.

## Accessibility approach
- `NativeControl(FormAssociated(LitElement))`; `<input type="checkbox" role="switch">` rendered with `?disabled=${this.isDisabled}`, `required`, `aria-describedby=${this.describedBy}`, `aria-invalid`.
- Hooks: `formValue()` returns `value` while checked, else `null`; `formReset()` restores the `checked` attribute default; `formStateRestore(state)` sets checked from the saved state; `validationAnchor()` returns the inner input.
- `syncFormState()` called synchronously in the change handler, so FormData in a `change` listener sees the new value.
- Host clicks from `<label for>` forwarded to the input; Enter calls `form.requestSubmit()` (SB-0009); `error` sets `customError`.
- Track and thumb `aria-hidden`; thumb transform mirrored with `:dir(rtl)`; transition removed under `prefers-reduced-motion: reduce`.

## Test plan (test-first)
One test per item; each must first fail for the right reason (element not defined).
- Name and role: role `switch`, name from `label`; `hide-label` keeps the name; host `aria-label` forwarded; dev warning once with no name.
- State: `aria-checked` false/true follows `checked`; setting `checked` from code fires no events.
- Pointer: clicking the track and clicking the label toggle; disabled does not toggle.
- Keyboard: Tab focuses; Space toggles; Enter submits the form and does not toggle; focus ring only on keyboard focus (3px, ring color).
- Events: one composed `input` and one composed `change` per toggle; FormData in a `change` listener has the new value.
- Sizes: default track 32x20 / thumb 16; sm 24x16 / 12; thumb at the end edge when on, mirrored in RTL.
- Description and error in the accessible description; `aria-invalid` with error; error region is polite live.
- Form: submits `name=value` only while on; custom `value`; nothing without `name`; `form.reset()` restores the attribute default; `<fieldset disabled>` disables (not submitted, not focusable) and re-enabling restores, `disabled` attribute untouched; `required` off → `valueMissing`, `:invalid`, `reportValidity()` focuses; on → valid; `error` → `customError` blocks submit; invalid look after blur when required and off; `<label for>` toggles.
- Reduced motion: no transition with `prefers-reduced-motion: reduce`.
- axe clean on every story (off, on, both sizes, error, disabled, hidden label).

## Accessibility deviations from the references
- Solid 3px focus ring instead of the visual reference's translucent ring (WCAG 1.4.11).
- Off track uses `color.input` (3:1) instead of the reference's light input color (WCAG 1.4.11).
- Enter submits instead of toggling (APG lists Enter as optional; consistent with every other form control here).
- Built-in label, description and error (shadow DOM keeps external Field parts from naming or describing the control).

## Risks
- Screen readers differ in announcing role switch on a checkbox input (some say "on/off", some "checked"); covered by Q7's manual pass.
- `formStateRestore` is hard to test in Playwright beyond a direct call; test the hook directly.

## Open questions (recommendation first)
| Id | Question | Recommendation (taken) |
| --- | --- | --- |
| Q1 | Native input with role=switch, or button with aria-checked? | Native `<input type="checkbox" role="switch">` (native Space, validity, label activation; SB-0007). |
| Q2 | Enter toggles or submits? | Submits the form; Space toggles (SB-0009, matches Checkbox). |
| Q3 | Reflect `checked`? | No; the attribute is the reset default, like Checkbox. |
| Q4 | Canonical names or sibling names? | Sibling names `checked`, `error`, `size` default/sm via registered aliases. |
| Q5 | Label before or after the switch; position prop? | After the switch; no prop (layouts use Item/Field). |
| Q6 | Track 18.4px or 20px? | 20/16px from `size.switch` tokens; logged as drift. |
| Q7 | Manual screen-reader pass | Still open: needed before `stable`, not before building. |
