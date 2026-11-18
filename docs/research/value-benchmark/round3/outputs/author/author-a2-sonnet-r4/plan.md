# Plan: Switch (planning gate)

Status: **draft** (specification complete; no code yet). Tests and code start only after approval (planning gate, then test-first). Under SB-0011 the approval is recorded by that decision rather than per component, and the open questions were answered with the recommendation.

## Scope
`sb-switch`: an on/off setting control, form-associated (submits `value` while on, resets to the `checked` attribute, disabled by a disabled fieldset, validates `required`), keyboard operable and accessible, with `label`, `description`, `error` and sizes `default` and `sm`. Out of scope: a switch group, a loading state, icons inside the thumb, an `lg` size, and a tri-state.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` |

## Test plan (test-first)
- Name and role: role switch, name from `label`, label click toggles, `hide-label` keeps the name.
- Keyboard: Tab reaches it, Space toggles, Enter does not toggle but submits the form, focus ring visible on keyboard focus only.
- State: checked moves the thumb and recolors the track, mirrored under `dir="rtl"`; sizes `default` 32x20 and `sm` 24x16; hit area at least 24px high in both.
- Events: `input` and `change` composed, once per toggle.
- Form: value submitted only while on, custom `value`, nothing when off, reset to the `checked` attribute, disabled and disabled fieldset not submitted, `required` invalid while off and valid when on, `error` gives customError validity and blocks submit.
- Description and error in the accessible description; `aria-invalid`; error announced once.
- axe clean on every story (default, sm, checked, description, error, required, disabled, hide-label).

## Accessibility deviations from the references
- Off track uses `color.input` (3:1) rather than a lighter neutral (WCAG 1.4.11).
- Focus ring is solid 3px in `ring`, not translucent.
- Label, description and error live inside the component (shadow DOM), as in Checkbox (SB-0009: only `aria-label` is forwarded).

## Open questions (recommendation first)
All answered with the recommendation (see contract.json, Q0 to Q7):
1. Native checkbox input with `role="switch"`, not a custom button.
2. Nothing is submitted when off.
3. `checked` is not reflected.
4. `label` is required.
5. Sizes: default and sm.
6. `required` means must be on.
7. Enter submits the form and never toggles.
