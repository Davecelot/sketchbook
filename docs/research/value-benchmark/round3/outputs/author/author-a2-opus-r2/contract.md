---
component: Switch
status: draft
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-12
source: shadcn/ui Switch (look, sizes and API), WAI-ARIA APG Switch pattern (keyboard and role), contract-first standard (contract and build process)
---

# Switch

> An on/off switch for a single setting, with its label, description and error laid out beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Turns one setting on or off, such as "Email notifications" or "Airplane mode". It is a form field: it submits a value while on, resets with its form, follows a disabled fieldset and can be required. Not for choosing between two named options (Radio Group, Toggle Group), picking items from a list or agreeing to terms (Checkbox), or triggering an action (Button).

## 2. Anatomy
`field` (grid) holds `control` (the pill-shaped track, with the native control stretched over it and the round `thumb` inside), `label` (+ `required-indicator`), `description` (optional) and `error` (live region). The thumb sits at the inline start when off and slides to the inline end when on; in right-to-left text it mirrors.

`PROPOSAL`: the switch comes first and the label after it, in the same grid as Checkbox, so the two controls line up in one form; a trailing switch at the end of a settings row was discarded for now (it can come later as a layout option or through Item).

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the label |
| `error` | text | — | marks the field invalid and blocks submission |
| `size` | `default` \| `sm` | default | track and thumb size |
| `name` | text | — | form field name |
| `value` | text | on | submitted while the switch is on |
| `checked` | boolean | false | on/off; the attribute is the default restored by reset (`PROPOSAL`, as in Checkbox, rather than reflecting the live state) |
| `required` | boolean | false | must be on to submit |
| `disabled` | boolean | false | cannot be toggled or focused, not submitted |

## 4. Variant matrix
One dimension, `size`: `default`, `sm`. Both sizes combine with every state below. The label, description and error text keep their size in both.

## 5. Roles and color
Track off: fill and border `input` (3:1 against the page), thumb `background`. Track on: fill and border `primary`, thumb `primary-foreground`. Label `foreground`; description `muted-foreground`; error text and invalid track border `destructive`; focus ring `ring`. On and off differ by thumb position as well as color, so the state never depends on color alone.

## 6. States
- **off / on** (`checked`): thumb at the start / end, track `input` / `primary`.
- **hover**: no change of look; the pointer shows the row is clickable.
- **focus-visible**: 3px solid ring around the track, only on keyboard focus.
- **invalid**: `error` set, or `required` and off after the user leaves the field or tries to submit. The track border turns `destructive` and the error text shows.
- **disabled**: `disabled`, or inside a disabled fieldset. The switch and its label are dimmed to 50% and show a not-allowed cursor; the description and error stay readable.

## 7. Dimensions and layout
| Size | Track | Thumb | Inset |
| --- | --- | --- | --- |
| default | 32 × 20 | 16 | 2 |
| sm | 24 × 16 | 12 | 2 |

Track fully rounded with a 1px border and an extra-small shadow; thumb fully rounded. 12px gap between switch and label; 6px between label and description. The track is centered on the label's first line. The thumb slides in 150ms with the standard easing, and does not animate when the user asks for reduced motion.

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5. Same in both sizes.

## 9. Accessibility
- Exposed as a **switch** (the APG Switch pattern) with an on/off state, built on a native checkbox control so Space, label click, required and disabled come from the platform. `PROPOSAL`: native control with the switch role, rather than a custom button with aria-checked, which would need all of that rebuilt.
- **Keyboard**: Tab / Shift+Tab move focus to and from it (skipped while disabled); Space toggles; Enter submits the owning form and does not toggle. `PROPOSAL`: the APG makes Enter optional for switches; Enter submits here so that it behaves the same on every field of a form (SB-0009).
- **Name**: the `label`, always present (also when visually hidden). A missing label logs a development warning.
- **Description**: description and error text are the control's accessible description; `aria-invalid` when invalid; the error is announced once when it appears.
- **State text**: the label names the setting and never changes with the state; the track carries no on/off text. The role announces on/off.
- **Form validation**: `required` makes an off switch invalid (value missing); `error` makes it invalid (custom error) so the form blocks submission.
- **Contrast**: off track at 3:1 against the page, thumb at 3:1 against both tracks, solid 3px focus ring (deviations from the visual reference, WCAG 1.4.11).
- **Target size**: the 20px-high track relies on the clickable label beside it and the 12px gap (WCAG 2.5.8 spacing exception). With `hide-label`, keep 24px of clear space around the track.
- **Motion**: the thumb slide is disabled under reduced motion (WCAG 2.3.3).
- **Change of context**: toggling never submits the form or moves focus by itself (WCAG 3.2.2).

## 10. Usage
### Behavior
- The user toggles with a click or tap on the track or the label, or Space when focused. Each user toggle fires `input` and `change`; setting `checked` in code fires neither.
- While on, the form submits `name=value` (`value` defaults to `on`); while off, nothing is submitted, exactly like a checkbox. The server should treat a missing field as off.
- Form reset puts the switch back to its default state: on if the `checked` attribute was present, else off. Back/forward navigation restores the last state.
- A disabled switch, or one inside a disabled fieldset, cannot be focused or toggled, is not submitted and is not validated. Re-enabling the fieldset restores the switch's own `disabled` setting.
- A required switch that is off is invalid: the form does not submit, and the error state shows after the user leaves the field or tries to submit. Supply an `error` text that says why it must be on.
- In a form with a Save button, the setting takes effect on submit. Outside a form (an instant preference), the page applies it on `change`; then show the result right away and don't ask for a separate confirmation.

### Composition
- One switch per setting. Group related switches under a heading or in a Field set (later), each with its own label.
- In a settings card or list, use Item or Card around the switch; the label stays on the switch, not in a separate element, because the switch's name must live inside it.
- Don't nest interactive elements in the label or description.

### Choosing the props
- **`label`**: name the setting in a few words, as a noun or a short phrase ("Email notifications", "Dark mode"), not a question and not the current state.
- **`description`**: add when the effect isn't obvious from the label ("Get an email when someone mentions you").
- **`size`**: `default` in forms and settings pages; `sm` in dense places such as table rows, toolbars or compact lists. Don't mix sizes in one group.
- **`hide-label`**: only when the row already shows the setting's name (a table row, a card title); the label is still required.
- **`required`**: rare. Only when the form cannot be sent with the setting off; for consent or agreement use a required Checkbox instead.
- **`error`**: set by the page after server validation, or to explain a required switch.
- **`value`**: set when the server expects a specific value (`true`, `1`, `yes`).

### Do / Don't
- Do use a fixed label that names the setting. Don't use labels that change with the state ("Enabled" / "Disabled") or put on/off text in the track: the role already announces the state and a changing name is confusing.
- Don't use a switch to choose between two named options (Monthly / Yearly): it is unclear which side is on. Use Radio Group or Toggle Group.
- Don't use switches to pick items from a list: that's a choice recorded on submit. Use one Checkbox per item.
- Don't use a switch for accepting terms or consent: agreement is a choice, not a setting. Use a required Checkbox.
- Don't use a switch to trigger an action (send, delete, refresh): it has a lasting state and an action doesn't. Use Button, or Toggle for a pressed state in a toolbar.
- Don't toggle other parts of the page so far that focus or context jumps; keep the effect where the user can see it.

## Realizations
### Figma
Not realized yet.
### Web
Not started. Planned: one form-associated custom element (`FormAssociated` + `NativeControl` mixins, rule form-associated-controls); shadow DOM with parts `field`, `control`, `input`, `thumb`, `label`, `required-indicator`, `description`, `error`; inner `<input type="checkbox" role="switch">` with a native `<label for>` in the same root; `size` reflected; thumb position from `:checked` and `:dir(rtl)`; transition removed under `prefers-reduced-motion`. Styles use only `--sb-switch-*` variables.
### Coverage
None yet. The behavior spec `playwright/tests/switch/switch.behavior.spec.ts` is written first and must fail; its cases are listed in [plan.md](./plan.md).
### Known drift
- API shape: shadcn composes Field and Label parts around Switch; shadow DOM requires them inside
- unchecked track and border: shadcn uses input (neutral-200), below 3:1; changed for WCAG 1.4.11
- focus ring: shadcn uses ring/50, below 3:1 (WCAG 1.4.11)
- track height: shadcn uses 18.4px (1.15rem) and 14px; rounded to the size scale so thumb and inset are whole pixels
- form participation: shadcn's Switch only mirrors a hidden input for name/value; required, reset and error are added here
- invalid state: not drawn by shadcn's Switch (it has aria-invalid styling only through Field)
- checked state: not reflected: the attribute is the default restored by form reset

## Open questions
Answered with the recommended option (no reviewer available, SB-0011) and recorded in contract.json `openQuestions` Q1–Q7: native control with the switch role; Enter submits, Space toggles; `checked` attribute is the reset default; sizes `default` / `sm`; label after the switch; `required` supported (means "must be on"); thumb slides, no motion under reduced motion.

Still open:
- Q8: manual screen-reader pass (VoiceOver, NVDA) of the on/off announcement and the required state, once built.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first (rule test-first). Use `FormAssociated` + `NativeControl`.
