---
component: Switch
status: draft
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-12
source: shadcn/ui Switch (UI and API), WAI-ARIA APG Switch pattern (keyboard and roles), harness process
---

# Switch

> Typed spec: [contract.json](./contract.json). Decision: SB-0101.

## 1. Purpose

A toggle for one on/off setting that is part of a form. It behaves like a native checkbox for the browser: it submits `value` under `name` while on, resets with its form, follows a `<fieldset disabled>`, validates `required`, and is activated by `<label for>`. It carries its own label, description and error message, and comes in two sizes.

Use a Switch for a setting that reads as on/off (enable notifications). Use a checkbox for agreeing to or picking items in a list.

## 2. Anatomy

```
root <label part=root>
├── input   <input type=checkbox role=switch part=input>   visually hidden over the track
├── track   part=track (aria-hidden)
│   └── thumb   part=thumb
└── text    part=text (only when there is text)
    ├── label        part=label
    ├── description  part=description (visible copy, aria-hidden)
    └── error        part=error (only while validation=error and errorMessage set)
```

The root is a `<label>`, so a click anywhere on the row toggles. The mixin's hidden description node sits next to it as the `aria-describedby` target.

## 3. Props / API

| Prop | Attribute | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `checked` | `checked` | boolean | `false` | Live state, not reflected. The attribute is the default that `form.reset()` restores. |
| `value` | `value` | string | `"on"` | Submitted while checked. |
| `name` | `name` | string | `""` | Submission name (mixin). |
| `disabled` | `disabled` | boolean | `false` | Mixin. A disabled fieldset has the same effect without changing the attribute. |
| `required` | `required` | boolean | `false` | Must be on for the form to be valid (`valueMissing`). |
| `label` | `label` | string | `""` | Visible text and accessible name. Required. |
| `description` | `description` | string | `""` | Hint under the label, read as the description. |
| `errorMessage` | `error-message` | string | `""` | Shown and read only while `validation="error"`. |
| `validation` | `validation` | `none` \| `error` | `none` | Error look and `aria-invalid`; does not change form validity. |
| `size` | `size` | `small` \| `medium` | `medium` | Track and thumb size. |

Events: `input` (native, composed) then `change` (re-dispatched composed by the host) on every user toggle. Neither fires for a programmatic `checked` change or a reset.

Methods and getters from the mixins: `form`, `validity`, `validationMessage`, `willValidate`, `checkValidity()`, `reportValidity()`, `click()`.

## 4. Variant matrix

`size` (small, medium) × `checked` (false, true) × `validation` (none, error) × `disabled` (false, true). No excluded combinations. Disabled is drawn at rest only.

## 5. Roles and color

| Element | Off | On |
| --- | --- | --- |
| Track | `switch.track.background` → `color.input` | `switch.track.background-checked` → `color.primary` |
| Thumb | `switch.thumb.background` → `color.background` | `switch.thumb.background-checked` → `color.primary-foreground` |
| Track border, error | `switch.track.border-color-invalid` → `color.destructive` | same |
| Label / description / error | `color.foreground` / `color.muted-foreground` / `color.destructive` | same |

The track border is always drawn at `switch.track.border-width` in the track's own fill color, and turns destructive while `validation="error"`, so the error look does not move the thumb. State is never told by color alone: the thumb position carries it (WCAG 1.4.1).

## 6. States

| State | Trigger | Look |
| --- | --- | --- |
| rest | default | off track, thumb at inline start |
| hover | pointer over the row | no change; pointer cursor |
| focus-visible | keyboard focus on the input (host `:state(focus-visible)`) | ring `switch.focus-ring.*` around the track |
| checked | `checked` | on colors, thumb at inline end (mirrored in RTL) |
| disabled | `disabled` or fieldset (`:host(:disabled)`) | whole row at `switch.root.disabled-opacity`; not-allowed cursor |
| invalid | `validation="error"` | destructive track border; error message shown |

A `required`, unchecked switch matches `:invalid` natively; the error look is the author's choice through `validation` (Q4).

## 7. Dimensions and layout

| | medium | small |
| --- | --- | --- |
| Track | 32 × 20 (`switch.track.width`/`height`) | 24 × 16 (`-small`) |
| Thumb | 16 (`switch.thumb.size`) | 12 (`switch.thumb.size-small`) |
| Thumb inset from the track's outer edge | 2 (`switch.track.inset`) | 2 |

Track radius `switch.track.radius` (pill); the thumb is round. The border is inside the track box. Row: track then text, gap `switch.root.gap`, items aligned to the start (top) so the track lines up with the first line of the label; row min height `switch.root.min-height` (24) so the whole row meets the 24px target. Label, description and error stack with `switch.text.gap`. The host is `inline-flex`.

The thumb moves with `transform` over `switch.thumb.transition-duration` / `switch.thumb.transition-easing`; no transition under `prefers-reduced-motion: reduce`.

## 8. Typography

| Text | Size | Weight | Line height | Color |
| --- | --- | --- | --- | --- |
| Label | `switch.label.font-size` (body) | `switch.label.font-weight` (label) | `switch.label.line-height` | `switch.label.color` |
| Description | `switch.description.font-size` | inherits regular | `switch.description.line-height` | `switch.description.color` |
| Error | `switch.description.font-size` | regular | `switch.description.line-height` | `switch.error.color` |

All text uses `switch.text.font-family`. Size does not change the text.

## 9. Accessibility

- **Role:** `<input type="checkbox" role="switch">`; the on/off state is native, never a hand-set `aria-checked` (APG Switch pattern).
- **Name:** the `label` prop, as the text of the wrapping `<label>`. A `<label for>` pointing at the host activates it (the host forwards the click) but does not name it; `label` stays required, with a console warning when empty.
- **Description:** `aria-describedby` = the description node, then the error node while `validation="error"` and `errorMessage` is set.
- **Invalid:** `aria-invalid="true"` on the input while `validation="error"`.
- **Keyboard:** Tab / Shift+Tab move focus (one tab stop, skipped when disabled). Space toggles. Enter does not toggle; it submits the owning form, as a native checkbox does.
- **Focus:** visible ring around the track, 3:1 against the background, from `:focus-visible` on the input.
- **Target size:** the whole row is the target and is at least 24px tall, so the small track passes WCAG 2.5.8.
- **Motion:** thumb transition removed under reduced motion (WCAG 2.3.3).
- **Contrast pairs** (checked by T6): off track and on track against the background (ui), thumb against each track (ui), focus ring (ui), label, description and error text against the background (text).
- **Form association:** `FormAssociated(NativeControl(LitElement))`.
  - `formValue()`: `value` while checked, else `null`.
  - `formReset()`: `checked = hasAttribute('checked')`, no events.
  - `formStateRestore(state)`: `checked = state === value`.
  - `validationAnchor()`: the inner input, rendered `?required=${required}` and `?disabled=${isDisabled}`, with no `name`.
  - The change handler sets `checked`, calls `syncFormState()`, then re-dispatches `change`, so a `change` listener reading `FormData` sees the new value.

## 10. Usage

### Behavior
A click on the track, the label or a `<label for>` toggles; so does Space. Each user toggle fires `input` then `change`. Setting `checked` in code fires nothing.

### Composition
Put switches inside a `<form>` (or with `form` association) with a `name`. In a settings list, stack switches; each keeps its own label and description.

### Choosing the props
- `size="small"` for dense lists; `medium` everywhere else.
- `required` only when the form cannot be sent with the setting off; pair it with `validation="error"` and an `errorMessage` once the author's own validation timing decides to show it.
- `value` only when the server expects something other than `on`.

### Do / Don't
- Do give every switch a `label` that names the setting, not the action ("Email notifications", not "Turn on").
- Do use a switch for settings that apply as part of the form.
- Don't set `role` or `aria-checked` on the host.
- Don't use a switch for a choice between two named options; use a radio group.

## Realizations
### Figma
Not started.
### Web
Not started. Built with `FormAssociated` and `NativeControl` (`src/mixins/`).
### Coverage
None yet. Behavior spec: `playwright/tests/switch/switch.behavior.spec.ts`.
### Known drift
Listed in `contract.json` (`realizations.web.drift`): whole-pixel track sizes, darker off track, built-in text, full-strength focus ring, native checkbox element.

## Open questions

All answered on 2026-11-12 with the recommended option (no reviewer available in the session); details in `contract.json` `openQuestions`.

| Id | Question | Answer |
| --- | --- | --- |
| Q1 | `checked` or canonical `selected`? | `checked` (registered alias, native name). |
| Q2 | Does Enter toggle? | No; Space toggles, Enter submits the form. |
| Q3 | Inner element? | `<input type=checkbox role=switch>`. |
| Q4 | Does `validation` change validity? | No; validity comes from `required` only. |
| Q5 | What does reset restore? | The `checked` attribute; property not reflected. |
| Q6 | Visible description vs the mixin's hidden node? | Hidden node is the describedby target; visible copy aria-hidden. |
| Q7 | Which sizes? | `small`, `medium` (default). |
| Q8 | Small track under 24px? | The whole row is the 24px target. |
| Q9 | Animate the thumb? | Yes, except under reduced motion. |
| Q10 | Label position / hidden label? | Not added. |

## Spec for agents
Build from contract.json only. CSS uses only --sb-switch-* variables (check T4). Tests first (rule test-first).
