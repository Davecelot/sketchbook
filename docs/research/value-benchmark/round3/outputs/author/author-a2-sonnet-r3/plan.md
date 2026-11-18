# Plan: Switch (planning gate)

Status: **approved by SB-0011 (owner pre-approval; nobody was available in this session)**. Tests and code start next, tests first (test-first).

## Scope
A form-associated `sb-switch` (native `input[role=switch]` in shadow DOM) with label, hide-label, description, error, name, value, checked, size (default, sm), required, disabled. In scope: contract, stories, behavior spec, styles, element, Figma realization. Out of scope: switch groups (Field set), on/off icons or text in the track, an indeterminate state.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` |

## Test plan (test-first)
- Name and role: role `switch`; label is the name; label click toggles; hide-label keeps the name.
- Keyboard: Tab focuses; Space toggles; Enter does not toggle but submits the form; focus ring visible on keyboard focus only.
- State: aria-checked follows checked; thumb position differs off/on and mirrors in RTL; both sizes measure 32x20 and 24x16.
- Events: `input` and `change` composed, once per toggle; none when disabled.
- Form: submits `name=value` only while on; custom value; reset restores the `checked` attribute; disabled and disabled-fieldset not submitted and not toggleable; `required` off is invalid (valueMissing), on is valid; error sets customError and blocks submit.
- Description and error in the accessible description; aria-invalid; error announced once.
- axe clean on all stories (both sizes, on/off, invalid, disabled, required).

## Accessibility deviations from the references
- Off track uses `color.input` for 3:1 (WCAG 1.4.11).
- Solid 3px focus ring instead of a translucent one.
- Enter submits the form rather than toggling (APG leaves Enter optional).
- `aria-labelledby`/`aria-describedby` are not forwarded across the shadow root (SB-0009); label, description and error live inside.

## Open questions (recommendation first)
All answered with the recommendation (SB-0101, SB-0011); revisit any of them in the contract:
- Q1 Native input with `role="switch"` rather than a custom button. Answered: native.
- Q2 `checked` reflected? Answered: no.
- Q3 `label` required? Answered: yes.
- Q4 Enter toggles? Answered: no, it submits.
- Q5 Sizes? Answered: default and sm.
- Q6 `required` semantics? Answered: must be on.
- Q7 Icons or text in the track? Answered: none.
- Q8 Off-track color? Answered: `color.input`.
