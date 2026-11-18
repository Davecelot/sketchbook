# Plan: Switch (planning gate)

Status: **draft**. Specification only; no code written. Tests and code start only after approval (planning gate, then test-first). No approver was available, so every open question below was answered with the recommendation and is listed so it can be revisited.

## Scope
A form-associated on/off switch: label, description, error, sizes `default` and `sm`, submits `value` while on, resets with its form, disabled by a disabled fieldset, validates `required`, keyboard operable (Tab, Space; Enter submits). Out of scope: indeterminate, label position, group layout (Field set), a visual-only variant.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` |

## Test plan (test-first)
- Name and label: label is the accessible name; clicking the label toggles; `hide-label` keeps the name.
- Keyboard: Tab focuses; Space toggles; Enter submits the form and does not toggle; focus ring visible.
- Semantics: `role=switch` with checked state; `aria-describedby` for description and error; `aria-invalid` when invalid.
- Forms: submits `name=value` only while on; custom `value`; reset restores the `checked` attribute default; a disabled fieldset disables it and drops it from the data; disabled is not submitted; `required` gives valueMissing and invalid after blur; `error` blocks submission (customError).
- Events: `input` and `change` composed, once per toggle.
- Visual: both sizes' track and thumb dimensions; thumb at the end when on, mirrored in rtl; disabled dimming.
- axe clean on all stories (both sizes, on/off, invalid, disabled, required).

## Accessibility deviations from the references
- Off track uses a 3:1 border color and the focus ring is solid 3px (visual reference uses a pale track and ring/50; WCAG 1.4.11).
- Enter submits the form rather than toggling (SB-0009).
- Label and description are props, not composed parts (shadow DOM: ids and `label for` do not cross roots).

## Open questions (recommendation first)
All answered with the recommendation; ids match contract.json.
- Q1 Native checkbox with `role=switch`, not a custom ARIA element. Answered: native.
- Q2 Is `label` required? Answered: yes, with `hide-label`.
- Q3 Is `checked` reflected? Answered: no, the attribute is the reset default.
- Q4 Sizes? Answered: `default` and `sm`.
- Q5 Value when off? Answered: nothing submitted, like a native checkbox.
- Q6 Does Enter toggle? Answered: no; Space toggles, Enter submits.
- Q7 Indeterminate or label position? Answered: neither.
