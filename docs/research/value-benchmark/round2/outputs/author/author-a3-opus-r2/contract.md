---
component: Switch
status: draft
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-12
source: shadcn/ui Switch (UI and API), WAI-ARIA APG Switch pattern (keyboard and ARIA), harness process
---

# Switch

> A two-state control that turns a single setting on or off, with its label, description and error beside it. It takes part in forms like a native control: it submits a value while on, resets with its form, is disabled by a disabled fieldset and validates `required`. Typed spec: [contract.json](./contract.json).

## 1. Purpose

A switch represents a setting that is either on or off, such as notifications, airplane mode or a preference saved with a profile form. It reads as a physical switch: the thumb sits at the start when off and slides to the end when on.

Use it for one independent binary setting. A list of options to pick several from is a set of checkboxes; one choice among several is a radio group; a partial ("some") state is a checkbox with `indeterminate`.

## 2. Anatomy

| Part | Role | Notes |
| --- | --- | --- |
| field | container | Two columns: the switch, then label, description and error stacked. |
| control | container | Holds the track, the thumb and the focusable control; aligned with the first line of the label. |
| input | control | The focusable switch; owns the on/off state, focus, Space and validation. |
| track | other | Pill showing the state by its fill; shows the invalid border. |
| thumb | other | Circle at the start when off, at the end when on (start and end follow the writing direction). |
| label | text | Names the setting; clicking it toggles the switch. |
| required-indicator | text | Asterisk after the label when `required`; hidden from assistive technology (the control is already announced as required). |
| description | text | Optional help under the label, read as the switch's description. |
| error | text | Optional error under the description; announced when it appears. |

## 3. Props / API

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — (required) | Visible name of the setting and the accessible name. It never changes with the state. |
| `description` | text | `""` | Help text under the label. |
| `error` | text | `""` | Error message. Setting it marks the field invalid and blocks form submission. |
| `size` | `default` \| `sm` | `default` | Track and thumb size. Label typography is the same in both. |
| `name` | text | `""` | Form field name. |
| `value` | text | `"on"` | Submitted under `name` while on; nothing is submitted while off. |
| `checked` | boolean | `false` | Current state. The attribute is the initial state that form reset restores; toggling changes the property only. |
| `required` | boolean | `false` | The switch must be on for the form to submit. |
| `disabled` | boolean | `false` | Not focusable, not operable, dimmed, not submitted. |

Events: `input` on each toggle by the person; `change` once the toggle is committed. Neither fires when `checked` is set from code. In a `change` listener the form data already holds the new value.

## 4. Variant matrix

| Dimension | Values |
| --- | --- |
| size | `default` (32 × 20), `sm` (24 × 16) |
| checked | off, on |

Every combination is valid, and each can be invalid and/or disabled.

## 5. Roles and color

| Element | Off | On |
| --- | --- | --- |
| Track fill and border | input color (`color.input`) | primary (`color.primary`) |
| Thumb | background (`color.background`) | primary foreground (`color.primary-foreground`) |
| Track border, invalid | destructive (`color.destructive`) | destructive |
| Label | foreground | foreground |
| Description | muted foreground | muted foreground |
| Error text | destructive | destructive |
| Focus ring | ring color | ring color |

Every pair (track against the page, thumb against its track, texts against the page, ring and invalid border against the page) meets 3:1 for UI and 4.5:1 for text in light and dark. The off track uses the input color (3:1 against the page) so the control's boundary is visible (WCAG 1.4.11). State is never shown by color alone: the thumb position changes too (WCAG 1.4.1).

## 6. States

- **Off / on**: thumb at the start or the end; track fill changes. The thumb slides with a short standard transition; with reduced motion requested it moves without animating.
- **Focus-visible**: on keyboard focus, a 3px solid ring in the ring color around the track. A translucent ring would fall under 3:1.
- **Hover**: no visual change, as in the visual reference; the pointer is the usual one for a control.
- **Invalid**: when `error` is set, or when `required` and off after the person leaves the switch or tries to submit. The track border turns destructive, the error text shows and the switch is exposed as invalid. Not shown on first render, so an untouched form does not open full of errors.
- **Disabled**: own `disabled`, or inside a disabled fieldset. Dimmed to the disabled opacity, cannot be focused or toggled, and is left out of the submitted data. Re-enabling the fieldset restores it without touching the author's `disabled` value.

## 7. Dimensions and layout

- Track: `default` 32 × 20, `sm` 24 × 16; fully rounded.
- Thumb: `default` 16, `sm` 12; inset 2 from the track edge (border included), so it travels width − height.
- The switch and its text column are separated by the field gap (12); label, description and error stack with the small content gap (6).
- The switch aligns with the first line of the label; long labels wrap in their column, never under the switch.
- In right-to-left the switch is at the right, and "on" moves the thumb to the left (the end).
- Target size: the track is under 24 × 24 at `sm`, but the label is part of the clickable row and the 12 gap satisfies the WCAG 2.5.8 spacing exception.

## 8. Typography

| Text | Size | Weight | Line height |
| --- | --- | --- | --- |
| Label | control (14) | label (medium) | control |
| Description | body (14) | body | body |
| Error | body (14) | body | body |

## 9. Accessibility

- **Role**: switch (WAI-ARIA APG Switch pattern), built on the platform's native checkbox so focus, Space, disabled and validation come from the platform. The state is exposed as on/off (checked true/false), never mixed.
- **Name**: the `label` prop, associated with the control in the same scope. An external label pointing at the switch activates it but cannot name it, so `label` stays required. An empty label logs one development warning.
- **Description**: `description` and `error` are the switch's accessible description.
- **Keyboard**:
  | Key | Action |
  | --- | --- |
  | Tab / Shift+Tab | Move focus to and from the switch. |
  | Space | Toggle on/off. |
  | Enter | Submit the form (implicit submission). It does not toggle: the APG lists Enter as optional for switches, and here it behaves as in every other form control (SB-0101). |
- **Invalid**: exposed as invalid while in the invalid state; the error text appears in a polite live region that exists from the start, so it is announced once when it appears.
- **Required**: exposed as required; the visual asterisk is hidden from assistive technology.
- **Forms**: submits `value` under `name` while on; `form.reset()` restores the initial state; a disabled fieldset disables it; `required` reports "value missing" with the platform's message and `reportValidity()` focuses it; `error` makes the form refuse to submit; an external `<label for>` toggles it.
- **Motion**: the thumb transition respects reduced-motion preferences.
- WCAG 2.2: 1.3.1, 1.4.1, 1.4.3, 1.4.11, 2.1.1, 2.4.7, 2.5.8, 3.3.1, 3.3.2, 4.1.2, 4.1.3.

## 10. Usage

### Behavior

- Clicking the track, the thumb or the label toggles the switch; so does Space while it has focus.
- Each toggle by the person fires `input` then `change`. Setting `checked` from code changes the state silently.
- Inside a form it is a field like any other: it submits `name=value` only while on, it returns to its initial state on reset, and `required` keeps the form from submitting until it is on.
- The label names the setting and stays the same when the state changes; the state itself is announced by assistive technology and shown by the thumb position.

### Composition

- Put switches for related settings in a fieldset with a legend, one switch per setting.
- In a settings list, each row is one switch with its label and optional description; use `sm` in dense rows or table cells.
- If the setting applies immediately (outside a form), the page shows its effect right away; inside a form it is saved on submit like the other fields.

### Choosing the props

- **size**: `default` in forms and settings pages; `sm` in dense rows, toolbars or table cells where the default would dominate.
- **description**: when the consequence of turning the setting on is not obvious from the label (for example, "Send me a weekly summary by email").
- **error**: when the server or the page rejects the value; say what to do ("Turn on to accept the terms of service").
- **required**: only when the form cannot be sent with the setting off; pair it with an error message that says why.
- **value**: when the server expects something other than `on` for the on state.

### Do / Don't

| Do | Don't |
| --- | --- |
| Name the setting in the label ("Airplane mode"). | Use a label that changes with the state ("On"/"Off", "Enabled"/"Disabled"): the state is already announced, and a changing name hides what is being turned on. Use a fixed label naming the setting. |
| Use a switch for one binary setting. | Use a switch for a partial or mixed state: a switch is strictly on or off. Use a checkbox with `indeterminate`. |
| Use checkboxes to pick several options from a list. | Use a column of switches as a multi-select: each switch reads as its own setting. Use checkboxes. |
| Use a radio group to pick one of several options. | Use a switch for a choice among more than two options. Use a radio group. |

## Realizations

### Figma

Not realized yet.

### Web

Not started. Planned: `sb-switch`, a Lit element extending `NativeControl(FormAssociated(LitElement))` from `src/mixins/`, like `sb-checkbox`. The inner control is a native `<input type="checkbox" role="switch">` with parts `field`, `control`, `input`, `track`, `thumb`, `label`, `required-indicator`, `description`, `error`. `formValue()` returns `value` while checked, else `null`; `formReset()` restores the `checked` attribute; `formStateRestore()` restores checked; `validationAnchor()` is the inner input. Disabled styling uses `:host(:disabled)`; the inner input renders `?disabled=${this.isDisabled}`. `syncFormState()` runs synchronously in the change handler. A click whose `composedPath()[0]` is the host (from `<label for>`) is forwarded to the input. `size` is reflected; styles use only `--sb-switch-*` variables. Enter calls `form.requestSubmit()` (SB-0009).

### Coverage

None yet. The behavior spec `playwright/tests/switch/switch.behavior.spec.ts` will cover the list in [plan.md](./plan.md).

### Known drift

From the visual reference, all recorded in `contract.json` `realizations.web.drift`: label, description and error are props (not composed parts); the off track uses the 3:1 input color; the dark off thumb uses the background color; sizes rounded to 32 × 20 and 24 × 16; solid 3px focus ring; `checked` not reflected.

## Open questions

All answered on 2026-11-12 with the recommendation (no owner was available; SB-0011 pre-approval). Details in `contract.json` `openQuestions`:

- Q1 `checked` reflected? No; the attribute is the reset default.
- Q2 Label required, hide-label? Required; no `hideLabel` in 0.1.0.
- Q3 Enter toggles or submits? Submits; Space toggles.
- Q4 Sizes? `default` and `sm`.
- Q5 Shared option-row mixin? Not needed; Switch is not an option row.
- Q6 On/off text or icons in the track? No.

## Spec for agents

Build from [contract.json](./contract.json) only. CSS uses only `--sb-switch-*` variables (check T4). Tests first (rule test-first); the form behavior follows the form-associated-controls rule.
