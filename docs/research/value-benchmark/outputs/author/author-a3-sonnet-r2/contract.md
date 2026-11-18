---
component: Switch
status: draft
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-12
source: harness process, WAI-ARIA APG switch pattern, spec/api.json
---

# Switch

> A toggle for an on/off setting that takes effect as soon as it is flipped, and that takes part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose

A Switch lets a person turn one setting on or off. Its effect is immediate, which is what separates it from a checkbox, whose choice is usually applied later with the form. It still is a form control: while on it submits a value under its name, it returns to its initial state when the form is reset, it is disabled by a disabled group of fields, and it can be required to be on. It carries a label, an optional description and an optional error message, in two sizes.

## 2. Anatomy

- **root**: the whole control, label column included.
- **control**: the interactive element that holds the switch role, focus and validity.
- **track**: the pill that shows on or off.
- **thumb**: the knob inside the track; start side when off, end side when on.
- **content**: the column beside the control for the texts.
- **label**: the label text.
- **description** (optional): the hint under the label.
- **errorMessage** (optional): the reason the setting is not accepted, under the description.

## 3. Props / API

Names come from the API vocabulary; the typed list is in `contract.json`.

- `label`: visible text and accessible name. `PROPOSAL`: empty is a defect that is warned about, not an error.
- `description`, `errorMessage`: texts under the label.
- `selected`: on or off. The registered name is `selected`; `checked` is not used.
- `validation`: `none` or `error`. Set by the author. `PROPOSAL`: it does not follow the required check by itself (alternative discarded: auto-error, which would flag a fresh form as wrong before any attempt).
- `size`: `small` or `medium` (default).
- `disabled`, `required`, `name`, `value`: form behavior (below). `value` defaults to `on`.

Event: `change`, after the person flips it. It is not fired for changes through the props or by a form reset.

Form behavior:

- While on and named, the form receives `name=value`; while off, nothing.
- A form reset returns the switch to the `selected` it started with.
- A disabled group of fields disables it without changing its own `disabled`; it is skipped by Tab and not submitted.
- `required` makes the switch invalid while off and valid while on; the form's validity reporting focuses it.
- A label element pointing at the switch toggles it.

## 4. Variant matrix

Size (small, medium) by validation (none, error) by selected (false, true). Every combination is valid. Disabled and focus are states over these.

## 5. Roles and color

- Track off: the field-border color; on: the primary color. Thumb: background color off, primary foreground color on.
- Error: the destructive color for the track border and the message.
- Label in the foreground color, description in the muted foreground color.
- Focus ring in the ring color. Disabled dims the whole control with the disabled opacity.
- The off track and the focus ring must be at least 3:1 against the page; pairs are declared in `contract.json`.

## 6. States

Hover, keyboard focus (ring only for keyboard), on, invalid (validation is error), disabled. Disabled has no hover or focus. Motion of the thumb is short and is dropped when the person prefers reduced motion. `PROPOSAL`.

## 7. Dimensions and layout

The control is a pill about twice as wide as it is tall. Small and medium differ in track height; the thumb scales with it. The label column sits beside the control and is top-aligned with it; the description and error message wrap under the label. The pointer target includes the label and is at least 24 by 24 px. `PROPOSAL`: both sizes start from the same control height token until the size foundations offer a smaller step (see Q6).

## 8. Typography

Label in the control label weight and body size; description and error message in the caption size.

## 9. Accessibility

- Role switch, on and off exposed to assistive technology.
- Accessible name from `label`. A label element that points at the switch activates it but does not name it, so `label` stays.
- Space toggles. Tab moves in and out. Enter does not toggle; it submits the form, as a native checkbox does.
- The description, and the error message while `validation` is error, are linked to the control and read with it. While in error the control is marked invalid. The error is not a live announcement (Q5).
- The ring shows for keyboard focus only.
- Pairs at 4.5:1 for texts and 3:1 for the track, thumb edge and ring.
- Disabled is not focusable, as for any native control.

## 10. Usage

### Behavior

Flipping applies the setting right away. The switch shows its state by the thumb position and the track color, never by color alone. The state shown always matches what the form would submit.

### Composition

Stand-alone, or one per row in a settings list, each with its own label. Several switches are independent of each other. Put them in a group of fields with a legend when they belong together.

### Choosing the props

- Use `description` for a consequence or hint, not for the name.
- Use `required` only for an acknowledgement that must be on (accept terms); use `validation=error` with `errorMessage` once the author knows it was missed.
- `size=small` for dense lists and tables; `medium` otherwise.
- Set `name` and `value` whenever the setting is part of a form; leave them out when the change is applied by script on `change`.

### Do / Don't

- Do give every switch a label. Without one it has no accessible name.
- Do use a switch for a setting with an immediate effect. Don't use it for a choice applied only on submit; use a checkbox.
- Don't use switches to pick one of several options; use a radio group, since switches do not exclude each other.
- Don't put the state in the label ("Enable" next to an on switch); the label names the setting.

## Realizations

### Figma
Not started.

### Web
Not started. Planned as a form-associated native-control element (rules: form-associated-controls), with the inner input as validation anchor. The native input carries `role=switch`; the shared native-control mixin's description link must also carry the error message while `validation` is error, and the input gets the invalid mark.

### Coverage
None yet.

### Known drift
None.

## Open questions

All answered in this pass with the recommended answer (nobody was available to approve); see `contract.json` `openQuestions` Q0 to Q6 and `plan.md`.

## Spec for agents
Build from contract.json only. CSS uses only --sb-switch-* variables (check T4). Tests first (rule test-first).
