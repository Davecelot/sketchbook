# Plan: Switch (planning gate)

Status: **approved by recommendation, 2026-11-12**. No approver was available in the authoring session; every open question below was answered with its recommendation, recorded here and in `contract.json` (`openQuestions`). A person may still overturn any answer before the build starts; the contract changes first if so. Tests and code start only after this gate (test-first).

## Scope

In: `sb-switch` as described in `contract.json`: on/off state, label, description, error message (`validation` + `errorMessage`), sizes `small`/`medium`, full form association (FormData, reset, fieldset disabled, `required`, `<label for>`, state restore), keyboard (Tab, Space, Enter submits), focus ring, reduced motion, right-to-left.

Out: a thumb icon, a loading state, a read-only state, a hidden label, label-before-control placement. None was asked for; each can be a later contract change.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` |

No new mixin or controller: `FormAssociated` and `NativeControl` already cover form association, label forwarding, focus-visible, the composed `change` and the name warning. The option-row mixin from the form-associated rule does not apply (a switch is not an option row).

## Tokens

All 29 component tokens alias existing semantic tokens (`contract.json` `tokens`); no new semantic token is needed (`size.switch.*` and `space.switch.inset` already exist). The thumb size is derived from track height and inset in CSS, not a literal. Contrast pairs (track vs background, thumb vs track in both states, ring, invalid ring, label, description, error) pass T6 in every mode.

## Accessibility approach

Native `<input type="checkbox" role="switch">` inside the shadow root (native first, then one ARIA role): checked state, `required`, `disabled`, Space and focus come from the platform. Name from the `label` prop; description and error via `aria-describedby`; `aria-invalid` while `validation="error"`. The whole row is the click target so the small size still meets the target size through its label.

## Test plan (test-first)

Behavior spec, one test each, written before code and seen failing (element not defined):

- Props: `checked` default false and toggled by click; `checked` attribute sets the initial state; `label` names the control; `description` is the accessible description; `validation="error"` sets `aria-invalid` and shows `errorMessage`, which joins the description; `errorMessage` hidden while `validation="none"`; `size` small/medium change the track box; `disabled` blocks click and focus; `required` shows the mark (hidden from the accessibility tree); `value` default `on`.
- Keyboard: Tab focuses; Space toggles and fires `input` + `change`; Enter submits the owning form and does not toggle; focus ring visible on keyboard focus only.
- Events: `change` bubbles and is composed; not fired when `checked` is set by code; a `change` listener reading `FormData` sees the new value.
- Form: FormData has `name=value` while on and nothing while off; `form.reset()` restores the initial state; `<fieldset disabled>` disables (not submitted, not focusable) and re-enabling restores it without touching `disabled`; `required` while off gives `valueMissing`, `:invalid` and `checkValidity()` false, and is valid once on; `<label for>` toggles it.
- Accessibility: role `switch` with checked state; empty label warns once; axe passes in rest, checked, disabled, invalid, small.
- Style: thumb transition is off under reduced motion; thumb at the end edge in right-to-left.

Stories: Default, Checked, Sizes, With description, Invalid with error message, Disabled, Required in a form, Disabled fieldset.

## Accessibility deviations from the references

- Off track uses the form-field color (3:1) instead of the reference's lighter input fill, already a system-wide deviation of `color.input` (WCAG 1.4.11).
- Enter submits instead of toggling (APG makes Enter optional; native checkbox behavior).

## Risks

- Small control (24 × 16) is under 24 × 24 alone; mitigated by the required, clickable label. A switch rendered with an empty label fails 2.5.8 as well as 4.1.2, which the runtime warning surfaces.
- `role="switch"` on a checkbox is announced differently across screen readers (some say "toggle button" or "on/off"); Q6 tracks a manual pass.
- `checked` is not reflected, so styling hooks on the host must use a state, not `[checked]`; the attribute keeps native default-value meaning.

## Open questions (recommendation first)

1. **Q1 Name of the on state.** Recommend `checked` via the registered alias of `selected`. **Answered: `checked`.**
2. **Q2 Reset and reflection.** Recommend native semantics: attribute = default, not reflected; reset restores it. **Answered: native semantics.**
3. **Q3 Enter.** Recommend Enter submits the form, Space toggles. **Answered: Enter submits.**
4. **Q4 Error look.** Recommend author-controlled via `validation`; native required validity independent. **Answered: author-controlled.**
5. **Q5 Size and text.** Recommend size changes only track and thumb. **Answered: control only.**
6. **Q6 Screen-reader pass.** Recommend doing it in the beta review with `a11y-checker`. **Open until beta.**
