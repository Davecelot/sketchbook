# Plan: Switch (planning gate)

Status: **approved** by SB-0011 (owner pre-approved the planning gate; no reviewer was available, so every open question below was taken with its recommendation). Tests and code start from this plan (planning gate, then test-first). No component code is written in this step.

## Scope
A form-associated on/off switch with label, description, error and two sizes (`default`, `sm`). Native `<input type="checkbox" role="switch">` styled as a track with a decorative thumb. Participates in forms: submits `name=value` only while on, resets to the `checked` attribute, follows a disabled fieldset, validates `required` (must be on) and `error` (customError). Out of scope: indeterminate, loading, a Field set wrapper, a switch group.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` |

## Test plan (test-first)
Stories: default, checked, sm, required, with description, with error, disabled, disabled checked, in a form, in a disabled fieldset, RTL.
Behavior spec (Playwright):
- role is switch; accessible name is the label; label click toggles; hide-label keeps the name
- Space toggles, Enter does not toggle but submits the form; Tab reaches it; focus ring visible on keyboard focus only
- `input` and `change` composed, once per toggle; none when disabled
- track and thumb sizes for `default` and `sm`; thumb moves on toggle, mirrored in RTL
- description and error in the accessible description; `aria-invalid`; error announced via the live region
- form: FormData has `name=value` only while on; custom `value`; reset restores the attribute default; `required` off -> invalid (valueMissing) and submit blocked; `error` -> customError; disabled fieldset disables and excludes it
- axe clean on every story

## Accessibility deviations from the references
- Solid 3px focus ring instead of ring/50 (WCAG 1.4.11).
- Unchecked track uses `color.input` (3:1) instead of the reference's pale track (WCAG 1.4.11).
- Enter submits the form (SB-0009), while the APG leaves Enter optional for switch.
- `aria-labelledby` and `aria-describedby` are not forwarded from the host (SB-0009); label, description and error are props.

## Open questions (recommendation first)
All answered with the recommendation; recorded in `contract.json` and SB-0101.
1. Native input with `role="switch"` or custom ARIA element? **Native** (SB-0007).
2. Reflect `checked`? **No**; the attribute is the reset default, like Checkbox.
3. Is `label` required? **Yes**, with `hide-label`.
4. Sizes? **`default` and `sm`.**
5. What does off submit? **Nothing**, like a native checkbox.
6. Enter? **Submits the form**; only Space toggles.
7. Meaning of `required`? **Must be on.**
8. Indeterminate or loading? **No.**
