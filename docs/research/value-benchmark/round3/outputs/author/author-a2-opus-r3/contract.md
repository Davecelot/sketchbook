---
component: Switch
status: draft
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-12
source: visual reference (look and sizes), WAI-ARIA APG switch pattern (keyboard and roles), contract-first standard (contract and build process)
---

# Switch

> A switch that turns one setting on or off, with its label, description and error laid out beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Turns a single setting on or off, such as a preference in a settings form. It reads as "this is on now" or "this is off now". It is not for agreeing to something (Checkbox), choosing several items from a list (Checkbox), choosing between two named options (Radio Group or Toggle Group), or a pressed button in a toolbar (Toggle).

It is a form control: inside a form it submits its value while on, goes back to its initial state when the form resets, is disabled by a disabled fieldset around it, and can be `required` (must be on).

## 2. Anatomy
- `field`: the row. The switch is in the first column; label, description and error are stacked in the second.
- `control`: the track, a pill sized by `size`.
  - `input`: the native control with the switch role. It covers the track and receives focus, Space and validation.
  - `thumb`: the round knob. It sits at the inline start when off and at the inline end when on.
- `label`: names the setting. Clicking it toggles the switch.
  - `required-indicator` (optional, when `required`): an asterisk, hidden from assistive technology because the control already announces "required".
- `description` (optional): help text under the label.
- `error`: a region that is always present and announces its text when it appears.

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name; names the setting, not the state |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the label |
| `error` | text | — | error message; marks the switch invalid and blocks submission |
| `name` | text | — | form field name; nothing is submitted without it |
| `value` | text | on | submitted under `name` while on |
| `checked` | boolean | false | on state; the attribute is the initial state that form reset restores (`PROPOSAL`, not reflected, as Checkbox) |
| `required` | boolean | false | must be on to submit; adds the asterisk |
| `disabled` | boolean | false | cannot be toggled or focused; not submitted |
| `size` | `default` \| `sm` | default | track 32x20 or 24x16 |

Events: `input` and `change` on each user toggle, both bubbling and crossing the component boundary. `change` fires after the form value is updated. Setting `checked` in code fires neither.

## 4. Variant matrix
`size` (`default`, `sm`) x `checked` (off, on). No emphasis variants: one look, so a switch always reads as a switch. States below apply to every cell.

## 5. Roles and color
- Track off: `input` (the form-field border color, 3:1 against the background); thumb off: `background`.
- Track on: `primary`; thumb on: `primary-foreground`.
- Thumb against its track meets 3:1 in both states and every mode, and so does each track against the page, because the thumb's position and the track's fill are what tell on from off.
- Label `foreground`; description `muted-foreground`; error text and invalid track border `destructive`; focus ring `ring`.
- Color is never the only cue: the thumb's position changes too (WCAG 1.4.1).

## 6. States
- **off / on** (`checked`): the track fills and the thumb slides to the inline end.
- **focus-visible**: a solid 3px ring in `ring` around the track, on keyboard focus only. A translucent ring would fall under 3:1.
- **invalid**: when `error` is set, or when `required` and off after the user leaves the switch or tries to submit. The track gets a `destructive` border and the error text shows.
- **disabled**: when `disabled`, or inside a disabled fieldset. Dimmed (disabled opacity), not-allowed cursor. Cannot be focused, toggled or submitted. A disabled fieldset never changes the switch's own `disabled` setting, so re-enabling the fieldset brings the switch back as it was.
- No hover or pressed look, and no indeterminate state: a setting is either on or off.

## 7. Dimensions and layout
- `default`: track 32x20, thumb 16. `sm`: track 24x16, thumb 12. The thumb is the track height minus twice the 2px inset. Its travel is the track width minus the thumb minus twice the inset.
- Track and thumb are fully rounded. The thumb has the smallest shadow. A 1px border sits inside the track: it is the track color normally and `destructive` when invalid, so it does not change the thumb size.
- 12px between the switch and the label column; 6px between label, description and error.
- The switch is centered on the label's first line, so a label that wraps does not move it.
- In right-to-left layouts "inline start" is the right: the thumb sits on the right when off and moves left when on.
- The thumb slides with the fast standard motion. With reduced motion it moves at once.

## 8. Typography
Label 14px, label weight (500), control line-height. Description and error 14px, body line-height. Same as Checkbox, so mixed forms line up.

## 9. Accessibility
- **Role**: `switch`, on a native checkbox (WAI-ARIA APG switch pattern; see Q1). Its state is exposed as on/off (`aria-checked` true/false) and is never mixed.
- **Name**: the `label`, through a native label tied to the inner control. The label does not change with the state, because the role announces on/off.
- **Description**: description and error are the switch's accessible description. `aria-invalid` is set while invalid. The error region is polite and always present, so the message is announced once when it appears.
- **Keyboard**:
  - Tab / Shift+Tab move focus to and from the switch. A disabled switch is skipped.
  - Space toggles it.
  - Enter submits the form, like a native checkbox and like Checkbox (`PROPOSAL`, Q2). The APG lists Enter-toggles as optional. It is not adopted, so Enter means the same thing across a form.
- **Form**: submits `value` under `name` only while on. Form reset restores the initial state. Required and off is "value missing", so the browser blocks submission and shows its own message. `error` blocks submission as a custom validity error. A label elsewhere on the page that points at the switch activates it.
- **Target size**: the label row is part of the click target, so the target meets WCAG 2.5.8. With `hide-label`, the `sm` switch (16px high) needs 24px of clear space around it to use the 2.5.8 spacing exception.
- **Contrast**: track off (3:1, a deviation from the visual reference), track on, thumb on each track, invalid border, focus ring (all UI, 3:1); label, description, error (text, 4.5:1). Declared in `contract.json` and checked in every mode.
- **Motion**: honors reduced motion (WCAG 2.3.3).
- A missing label gives a one-time warning in development.

## 10. Usage
### Behavior
- Use a switch for a setting that is on or off. Inside a form it is sent with the form like any other field. On its own it can apply as soon as it changes: listen to `change`.
- If turning a setting on takes time or can fail, keep the switch in its new position while the work runs. If the work fails, set it back and show the reason in `error`. Don't disable the switch while waiting: a disabled control drops keyboard focus.
- The value is only sent while the switch is on. To send an explicit "off", the receiving end must treat a missing field as off. This is how native checkboxes work too.
- `required` means "must be on". It is rare for a setting. Use it only when the form really cannot continue with the setting off, and say so in the label or the description.

### Composition
- Put one switch per setting, each with its own label. A group of related settings goes under a heading or in a field set with a legend.
- For a settings list where the label is at the start and the switch at the end, put the switch in an Item row. Use `hide-label` with the same text as the row title, so the switch keeps its name.
- Don't nest interactive content in the label or the description.

### Choosing the props
- `size`: use `default` in forms and settings pages. Use `sm` for dense rows, tables and compact panels. Use one size throughout a list.
- `description`: use it when turning the setting on has a consequence the label can't say in a few words ("Sends a weekly summary to your email").
- `error`: use it for a server-side or cross-field rejection. Write how to fix it, not just that something went wrong.
- `hide-label`: use it only when other visible text right beside the switch names the same setting.
- `value`: leave it as `on` unless the receiving end expects another value.

### Do / Don't
- Do label the setting ("Airplane mode"). Don't use a label that flips with the state ("On" / "Off"): the role already announces the state, and a changing name confuses screen-reader users.
- Don't use a switch to agree to terms or confirm something the form submits later. Use Checkbox: a switch reads as a setting that is on right now.
- Don't use switches to pick several items from a list. Use Checkbox, one per option.
- Don't use a switch for two named options that aren't on and off ("Daily" / "Weekly"). Use Radio Group or Toggle Group.
- Don't use a switch as a pressed/unpressed toolbar button (bold, mute). Use Toggle.
- Don't make a switch read-only by disabling it if its state must still be read and focused. Show the state as text instead: a disabled switch is skipped by the keyboard.

## Realizations
### Figma
Not realized yet.
### Web
Not started. Planned in `src/components/switch/Switch.ts` on `FormAssociated` + `NativeControl` (rule form-associated-controls), with `<input type="checkbox" role="switch">` in the shadow root. Parts: `field`, `control`, `input`, `thumb`, `label`, `required-indicator`, `description`, `error`. The disabled look uses `:host(:disabled)`, so a disabled fieldset dims it too. Enter calls `form.requestSubmit()` (SB-0009). The behavior spec is `playwright/tests/switch/switch.behavior.spec.ts`.
### Coverage
None yet. Planned in [plan.md](./plan.md).
### Known drift
- API shape: shadcn composes Field and Label parts around Switch; shadow DOM requires them inside (as Checkbox).
- Unchecked track color: shadcn uses bg-input (neutral-200), below 3:1; changed to `color.input` for WCAG 1.4.11.
- Focus ring: shadcn uses ring/50, below 3:1 (WCAG 1.4.11).
- Sizes: shadcn is 32x18.4 / 24x14; rounded to 32x20 / 24x16 on the 4px grid (existing `size.switch` tokens), same thumb sizes.
- Dark thumb: shadcn paints the unchecked thumb `foreground` in dark mode; here one color per state in every mode.
- Checked state: not reflected; the attribute is the default restored by form reset.

## Open questions
Q0–Q6 were answered with the recommended option (session without an approver; recorded in SB-0101 and in `contract.json`):
- Q1: a native checkbox with the switch role, not a button with `aria-checked`. Recommended.
- Q2: Enter submits and Space toggles. Recommended.
- Q3: `checked` is not reflected. Recommended.
- Q4: sizes `default` and `sm`, no `lg`. Recommended.
- Q5: the label goes after the switch. A label-first row is composed with Item. Recommended.
- Q6: `label` is required. Recommended.

Still open:
- Q7: a manual screen-reader pass (VoiceOver, NVDA) of the on/off announcement and the error live region. This needs a person with those tools.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first. Use `FormAssociated` + `NativeControl`.
