# Plan: Switch (planning gate)

Status: **approved on recommendation** (2026-11-12). No reviewer was available in the session; every open question took its recommended answer, recorded in `contract.json` `openQuestions` and below. Tests and code start from here (test-first).

## Scope

One element, `sb-switch`: a form-associated on/off control with a built-in label, description and error message, sizes `small` and `medium`. Out of scope: label position, hidden label, indeterminate, read-only, a loading state, an option row (no checkbox/radio option exists yet, so no shared row mixin is introduced).

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` |

Reused, not changed: `src/mixins/form-associated.ts`, `src/mixins/native-control.ts`. No new dependency, no new semantic token (`size.switch.*` and `space.switch.inset` already exist).

## Tokens

32 component tokens under `switch.*` (see `contract.json` `tokens`), each aliasing one semantic token. Colors: `color.input`, `color.primary`, `color.background`, `color.primary-foreground`, `color.destructive`, `color.foreground`, `color.muted-foreground`, `color.ring`. Contrast pairs declared in `accessibility.contrast`; T6 passes in every mode.

## Accessibility approach

Native `<input type=checkbox role=switch>` inside a wrapping `<label>`; name from `label`; `aria-describedby` from the description node and the error node; `aria-invalid` from `validation`. Space toggles, Enter submits (implicit submit from `NativeControl`). Focus ring on the track from the input's `:focus-visible`. Whole row is a 24px-tall target. No thumb transition under reduced motion.

## Test plan (test-first)

Stories: Default, Checked, Small, WithDescription, Error, Disabled, Required, InForm. Behavior spec, one test each, all seen failing before code:

- Props: `checked` default false and toggles the input; `checked` attribute is not rewritten by a toggle; `value` default `on` and custom; `name`; `size` reflects and changes the track size; `label` renders and names the switch; `description` renders; `errorMessage` shown only with `validation="error"`; `validation` reflects.
- States: disabled (not focusable, click does nothing, `:disabled`); checked look; focus-visible ring on keyboard focus only (`:state(focus-visible)`).
- Keyboard: Tab focuses; Space toggles; Enter does not toggle and submits the form; Tab skips a disabled switch.
- Events: one `input` and one `change` per user toggle, both reaching a host listener; none on programmatic `checked` or reset.
- Form: `FormData` has `name=value` only while on, and reflects the new value inside a `change` listener; `form.reset()` restores the `checked` attribute state; `<fieldset disabled>` disables without adding the attribute, and re-enabling restores it; `required` unchecked is `valueMissing` and `checkValidity()` false, on is valid; `reportValidity()` focuses the input; `<label for>` toggles it; `formStateRestore` restores.
- Accessibility: role `switch` with name from `label`; description from `description`; description plus error while `validation="error"`; `aria-invalid` only in error; empty-label console warning; axe clean in default, checked, error and disabled.

Run `npm run test:component -- tests/switch` and record the failures before step 3.

## Accessibility deviations from the references

- Inner element is a checkbox input with `role=switch`, not a button (Q3).
- Enter does not toggle (APG lists it as optional) (Q2).
- Off track and focus ring are darker than the visual reference to meet 3:1.
- Label, description and error are built in rather than composed.

## Risks

- `:state(focus-visible)` is missing in older engines; only the host state is lost (handled by the mixin).
- The description is in the DOM twice (hidden target, aria-hidden copy); a test checks it is read once.
- `validation` and native validity can disagree by design (Q4); documented in the contract's Usage.

## Open questions (recommendation first)

All answered with the recommendation, 2026-11-12:

1. Q1 `checked` (registered alias) over `selected`.
2. Q2 Space toggles; Enter submits the form.
3. Q3 `<input type=checkbox role=switch>`.
4. Q4 `validation` is presentation plus `aria-invalid`; validity only from `required`.
5. Q5 Reset restores the `checked` attribute; the property is not reflected.
6. Q6 Mixin's hidden description node is the describedby target; visible copy aria-hidden.
7. Q7 Sizes `small` and `medium` (default).
8. Q8 Whole row is the 24px target; small track stays 16px.
9. Q9 Thumb animates, except under reduced motion.
10. Q10 No label-position or hidden-label prop.
