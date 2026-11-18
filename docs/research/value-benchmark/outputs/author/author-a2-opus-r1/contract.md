---
component: Switch
status: draft
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-12
source: shadcn/ui Switch (UI and API), WAI-ARIA APG Switch pattern (keyboard and ARIA), rule form-associated-controls (forms), harness process
---

# Switch

> A toggle for one on/off setting that is also a real form field: it submits a value while on, resets with its form, is disabled by a disabled fieldset and validates `required`. It carries its own label, an optional description and an error message, in two sizes. Typed spec: [contract.json](./contract.json).

## 1. Purpose

A switch turns a single setting on or off, and the change reads as taking effect immediately (notifications, dark mode, auto-save). It is the visual form of a binary setting; it is not a choice among options and not an agreement.

Because settings are often edited in forms, the switch behaves like a native form field: it contributes `value` under `name` while on and nothing while off, returns to its default state when its form is reset, cannot be used or submitted while it or an enclosing fieldset is disabled, and makes its form invalid while `required` and off.

## 2. Anatomy

| Part | Role | Notes |
| --- | --- | --- |
| root | container | Lays out the control row and the text under it. The whole row, label included, toggles on press. |
| control | control | The focusable element with the switch role; holds track and thumb and owns the state, name, description and validity. |
| track | other | Pill-shaped bar: primary fill while on, input fill while off. |
| thumb | other | Circle at the start while off, at the end while on; mirrored in right-to-left. |
| label | text | Visible label after the track in reading order; names the switch (`label`). |
| description | text, optional | Muted hint under the label (`description`). |
| error | text, optional | Error text under the description, only while `validation` is `error` and `errorMessage` is set. |

```
[ (●)━━━ ]  Label
            Description
            Error message
```

## 3. Props / API

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `checked` | boolean | `false` | On or off. The attribute is the default state (used at start and on reset); the property is the live state and is not reflected. `PROPOSAL` (Q4). |
| `name` | text | `""` | Name the value is submitted under; no name, nothing submitted. |
| `value` | text | `"on"` | Submitted while on; nothing is submitted while off. |
| `label` | text | `""` (required) | Visible label and accessible name. Missing label warns once. |
| `description` | text | `""` | Hint under the label, announced as the description. |
| `errorMessage` | text | `""` | Shown and announced only while `validation` is `error`. |
| `validation` | `none` \| `error` | `none` | Error look, error text, invalid for assistive technology. Does not block submit by itself. `PROPOSAL` (Q2). |
| `size` | `small` \| `medium` | `medium` | Track and thumb size. Canonical size names rather than the reference's sm/default. `PROPOSAL` (Q3). |
| `disabled` | boolean | `false` | Not focusable, not pressable, not submitted. An enclosing disabled fieldset has the same effect without changing this prop. |
| `required` | boolean | `false` | Must be on for the form to be valid. |

Events: `change` (after each user toggle, once state and form value are updated) and `input` (just before `change`). Neither fires for a programmatic change of `checked` or for a form reset. No custom events.

Methods and read-only properties a form field offers: `form`, `validity`, `validationMessage`, `willValidate`, `checkValidity()`, `reportValidity()`, `click()` (toggles unless disabled), `focus()`.

## 4. Variant matrix

| | validation `none` | validation `error` |
| --- | --- | --- |
| size `medium` | default | error border + error text |
| size `small` | compact | compact, error border + error text |

Each cell exists off and on (`checked`), enabled and disabled. No excluded combinations.

## 5. Roles and color

| Element | Off | On | Error |
| --- | --- | --- | --- |
| Track fill | input | primary | unchanged |
| Track border | input | primary | destructive |
| Thumb | background | primary-foreground | unchanged |
| Label | foreground | foreground | foreground |
| Description | muted-foreground | muted-foreground | muted-foreground |
| Error text | — | — | destructive |
| Focus ring | ring | ring | ring |

Color is never the only signal: the thumb position shows on/off, and the error has text. Every pair is declared for contrast (track against page and thumb against track at 3:1, text at 4.5:1) in both modes.

## 6. States

- **Rest**: off or on, as above.
- **Hover**: no visual change (as in the reference); the pointer cursor shows the row is pressable.
- **Focus (keyboard)**: a ring around the track; not drawn for pointer focus.
- **Checked**: track fills with primary, thumb slides to the end. The slide animates briefly and is instant when the person prefers reduced motion.
- **Disabled**: whole row dimmed to the disabled opacity, skipped by Tab, ignores presses, not submitted. Applies equally when an enclosing fieldset is disabled.
- **Invalid** (`validation` error): track border in destructive, error text shown and announced.
- **Required and off**: invalid for the form (value missing); the browser's message is shown when the form is submitted or validity is reported, and focus moves to the switch. No error look until the author sets `validation` (`PROPOSAL`, Q2).

## 7. Dimensions and layout

| | medium | small |
| --- | --- | --- |
| Track | 32 × 20 (`size.switch.width/height`) | 24 × 16 (`size.switch.width-sm/height-sm`) |
| Thumb | track height minus twice the inset | same rule |
| Thumb inset | `space.switch.inset` | same |

- Track and thumb are fully rounded (`radius.pill`); the track has a hairline border (`border-width.default`) and the extra-small elevation.
- Gap between track and label: `space.control.gap.default`; between label, description and error: `space.stack.xs`.
- The track aligns with the first line of the label; long labels wrap, the track stays at the top.
- The row is inline: it takes the width of its content.

## 8. Typography

| Text | Size | Weight | Line height | Color |
| --- | --- | --- | --- | --- |
| Label | `font.size.body` | `font.weight.label` | `font.line-height.label` | foreground |
| Description | `font.size.body` | body | `font.line-height.body` | muted-foreground |
| Error | `font.size.body` | body | `font.line-height.body` | destructive |

Both sizes keep the same text size; only the track shrinks.

## 9. Accessibility

- **Role**: `switch`, built on a native checkbox so the browser provides activation, required validity and messages. State is exposed as on/off (checked true or false, never mixed).
- **Name**: `label`, rendered visibly and associated with the control. An external label pointing at the switch activates it but cannot name it, so `label` stays required; a missing label warns once.
- **Description**: `description` and, while `validation` is error, `errorMessage` are announced as the description.
- **Invalid**: exposed as invalid while `validation` is error. `required` is exposed as required.
- **Keyboard** (APG switch pattern):
  - Tab / Shift+Tab: one tab stop; disabled switches are skipped.
  - Space: toggles; fires `input` then `change`.
  - Enter: does not toggle; submits the owning form like a native checkbox (`PROPOSAL`, Q1; the APG lists Enter as optional, and keeping native behavior keeps implicit submission consistent across this library's controls).
- **Focus**: visible ring on keyboard focus only (2.4.7).
- **Target size**: the pressable area is the whole row with its label, so even the small track meets 24 × 24 (2.5.8).
- **Motion**: the thumb slide is removed under reduced motion (2.3.3).
- **Forms**: submits `value` under `name` while on; reset restores the default (`checked` attribute); disabled fieldset disables it; `required` and off is value-missing, with the browser's message, and reporting validity focuses it; saved form state is restored on navigation back; an external label activates it.
- **Manual pass** still owed: screen reader announcements (Q6).

## 10. Usage

### Behavior

- Pressing anywhere on the row (track, thumb, label, description) toggles the switch; Space toggles it from the keyboard.
- The change is the user's: `input` and `change` fire only for user toggles, never for a programmatic `checked` change or a form reset.
- While on, the switch submits `value` under `name`; while off it submits nothing. A switch without a `name` is never submitted.
- Form reset returns the switch to its `checked` attribute; it does not fire `change`.
- Disabled (directly or through a disabled fieldset): not focusable, not pressable, not submitted. Re-enabling the fieldset restores it without touching the author's `disabled`.
- `required` and off makes the form invalid; turning it on clears it.
- `validation="error"` shows `errorMessage` and the error look; the author clears it when the problem is fixed.

### Composition

- Stand-alone in a form or settings list; each switch has its own label.
- Group related switches under a fieldset with a legend; disabling the fieldset disables them all.
- The label, description and error are part of the switch: do not wrap it in a separate label or add separate hint text for the same purpose.
- An external label pointing at the switch is allowed for layouts that need it; it activates the switch but the `label` prop still names it.

### Choosing the props

- **size**: `medium` by default; `small` for dense layouts (table rows, compact settings lists). Mix sizes only across clearly separate areas.
- **label**: names the setting ("Email notifications"), never the state or the action ("On", "Turn on").
- **description**: one short sentence of consequence or context; omit when the label is enough.
- **validation / errorMessage**: set together when a server or cross-field rule rejects the setting; say how to fix it.
- **required**: only when the form cannot be sent with the setting off. If it is an agreement (terms), prefer a Checkbox.
- **value**: only when the receiver expects something other than `on`.

### Do / Don't

- **Do** use a switch for an immediate on/off setting. **Don't** use it for a choice confirmed by a Submit or Save press, or to select items: people expect a switch to act at once. Use a Checkbox.
- **Do** keep the label fixed. **Don't** change the label with the state ("On"/"Off"): the state is announced separately, so a changing label is redundant or contradictory.
- **Do** always set `label`. **Don't** ship an unnamed switch: assistive technology announces a nameless control and sighted people cannot tell what it controls.
- **Don't** use a switch when a third, mixed state is needed: a switch has only on and off. Use a Checkbox with its indeterminate state.

## Realizations

### Figma
Not realized yet.

### Web
Not started. Planned as a form-associated Lit element on the shared `FormAssociated` and `NativeControl` mixins (rule form-associated-controls), rendering `<input type="checkbox" role="switch">` with `?disabled=${this.isDisabled}`, `aria-describedby` from the description and error, and `aria-invalid` while `validation` is error. Parts: `root`, `control`, `track`, `thumb`, `label`, `description`, `error`; no slots. Dimmed with `:host(:disabled)`; keyboard focus exposed as `:state(focus-visible)`. CSS uses only `--sb-switch-*` variables. Files and the behavior spec are listed in `contract.json` `realizations.web`.

### Coverage
None yet. The behavior spec will cover: Space toggle and events, Enter submits without toggling, FormData on/off and custom value, `form.reset()`, `<fieldset disabled>` and re-enable, `required` validity and `reportValidity()` focus, `<label for>` activation, description and error wiring, sizes, reduced motion, contrast.

### Known drift
From the visual reference: size names (sm/default → small/medium), track sizes rounded to the size scale, full-strength focus ring instead of half alpha, error shown as border plus text, label/description/error built in rather than composed. Details in `contract.json` `realizations.web.drift`.

## Open questions

Answered with the recommended option in an unattended session (no reviewer available), recorded in `contract.json` `openQuestions` and in SB-0101:

- Q1 Enter: submits the form, does not toggle.
- Q2 `validation` error: look and invalid state only; `required` alone drives native validity.
- Q3 Sizes: canonical `small` / `medium`.
- Q4 Reset: returns to the `checked` attribute.
- Q5 Label: built in, after the track.

Still open:

- Q6 Manual screen-reader pass (VoiceOver + Safari, NVDA + Firefox/Chrome) before `stable`.

## Spec for agents
Build from contract.json only. CSS uses only --sb-switch-* variables (check T4). Tests first (rule test-first).
