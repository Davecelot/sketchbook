---
component: Switch
status: draft
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-12
source: visual reference (look and sizes), WAI-ARIA APG switch pattern, contract-first standard (contract and build process)
---

# Switch

> An on/off switch for a setting, with its label, description and error beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
A single setting that is either on or off, such as a preference. It behaves like a form field: it submits a value while on, returns to its default when its form resets, is disabled by a disabled group of fields, and can be required to be on. Not for picking several items or agreeing to terms (Checkbox), for one of more than two options (Radio Group), or for a pressed toolbar button (Toggle).

## 2. Anatomy
`field` (two columns) holds `control` (the pill-shaped track with the native control and the round `thumb`), then `label` (+ `required-indicator`), `description` (optional) and `error` (live region) in the second column. The thumb sits at the start edge when off and the end edge when on, so position carries the state as well as color.

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name; names the setting, never the state |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the label, read as the description |
| `error` | text | — | marks the field invalid and blocks submission |
| `name` | text | — | form field name |
| `value` | text | on | submitted while on; nothing submitted while off |
| `checked` | boolean | false | on/off; the attribute is the reset default |
| `required` | boolean | false | must be on to submit |
| `disabled` | boolean | false | cannot be focused or toggled; not submitted |
| `size` | `default` \| `sm` | default | track 32x20 or 24x16 |

`PROPOSAL`: `checked` is not reflected, because the attribute is the default restored by reset (as Checkbox); reflecting it would lose the default.

## 4. Variant matrix
One dimension, `size`: `default`, `sm`. All states apply to both sizes.

## 5. Roles and color
Off track `input`; on track `primary`. Thumb `background` when off, `primary-foreground` when on. Label `foreground`; description `muted-foreground`; error text and invalid off track `destructive`; focus ring `ring`. The off track uses `input` (3:1 against the background) so the switch is visible when off (WCAG 1.4.11).

## 6. States
- **checked**: track fills, thumb slides to the end edge (start edge in right-to-left). Without motion when reduced motion is requested.
- **focus-visible**: 3px solid ring around the track.
- **invalid**: `error` set, or `required` and off after blur or a submit attempt. The off track turns `destructive`; `PROPOSAL`: an on track keeps its fill so on/off stays legible, and the error text and invalid state carry the message (rather than recoloring the on track too).
- **disabled**: by `disabled` or a disabled group of fields; dimmed (opacity 0.5), not-allowed cursor, skipped by Tab, not submitted.
No hover look.

## 7. Dimensions and layout
| Size | Track | Thumb | Inset |
| --- | --- | --- | --- |
| default | 32x20 | 16 | 2 |
| sm | 24x16 | 12 | 2 |
Track fully rounded with shadow-xs; thumb round. 12px gap between switch and label; 6px between label and description. The switch aligns to the label's first line. `PROPOSAL`: heights are 20 and 16 to stay on the spacing grid, instead of the reference's 18.4 and 14.

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5. The `size` prop changes only the switch, not the text.

## 9. Accessibility
- Role `switch`, checked state exposed as on/off. `PROPOSAL`: a native checkbox with the switch role, not a button with a custom checked state, because the native control brings Space, required validation, the validation message and reset semantics.
- Name from `label`, through a label in the same scope as the control; `hide-label` keeps it. A dev-only warning fires once when the label is empty. An external label pointing at the switch toggles it but does not name it, so `label` stays required.
- Description and error are the accessible description; invalid is exposed; the error region is persistent and polite, announced once when its text appears.
- Keyboard: Tab / Shift+Tab move focus; Space toggles. `PROPOSAL`: Enter submits the form (implicit submission, as Checkbox and Input) and does not toggle; the APG lists Enter as optional, and toggling would break submitting a settings form from the keyboard.
- No mixed state: a switch is only on or off.
- Required: must be on; the asterisk is hidden from assistive technology since the required state is exposed.
- Target size: the track plus the clickable label row; the 12px gap meets WCAG 2.5.8's spacing exception for `sm`.
- Contrast: off and on tracks 3:1 against the background; thumb 3:1 against its track; text 4.5:1 (all pairs in contract.json, verified by the contrast check).
- Motion: the thumb transition is removed under reduced motion (WCAG 2.3.3).

## 10. Usage
### Behavior
Toggling by pointer, Space, or a click on the label fires `input` then `change`, both crossing the component boundary; setting `checked` from code fires neither. When `change` fires, the form value is already updated. While on, the form receives `name=value`; while off, nothing. Form reset returns it to its default state; a disabled group of fields disables it and enabling the group restores it, without changing the author's `disabled`.
### Composition
One switch per setting. A list of settings stacks switches, each with its own label; a group heading goes in a Field set (later). The switch takes no children: label, description and error are props.
### Choosing the props
- `size="sm"` for dense lists (table rows, compact panels); `default` elsewhere.
- `description` when the effect needs explaining ("Uses more battery").
- `error` when a server or validation rejects the setting, with the reason.
- `required` only when the form cannot be sent with the setting off; the label states the condition.
- `hide-label` only when other visible text in the row already names the setting.
### Do / Don't
- Don't use a switch to choose several items or to agree to terms; it reads as a setting with an immediate effect. Use Checkbox.
- Don't use a switch for one of more than two options; it has exactly two states. Use Radio Group.
- Don't change the label with the state ("On"/"Off") or name the action ("Turn on"); the role already announces on/off and a changing name is read as a different control. Name the setting ("Airplane mode").
- Don't use a switch for a toolbar button that stays pressed (bold, mute). Use Toggle.

## Realizations
### Figma
Not realized yet. Axes from the API vocabulary: Size (Medium, Small), Selected, Validation, Disabled, State (Rest, Focus).
### Web
Not started. Lit element `sb-switch` extending `NativeControl(FormAssociated(LitElement))`; native `<input type="checkbox" role="switch">` in the shadow root; parts `field`, `control`, `input`, `thumb`, `label`, `required-indicator`, `description`, `error`. CSS uses only `--sb-switch-*` variables. Plan: [plan.md](./plan.md).
### Coverage
None yet; the behavior spec is listed in plan.md.
### Known drift
- API shape: the reference composes field parts around the switch; shadow DOM requires them inside.
- Off track color: `input` (3:1) instead of the reference's light border color (WCAG 1.4.11).
- Focus ring: 3px solid instead of a translucent ring (WCAG 1.4.11).
- Track height: 20 / 16 instead of 18.4 / 14.
- Checked state: not reflected; the attribute is the reset default.

## Open questions
None open. Q1–Q6 in contract.json were answered with the recommendation (SB-0011, SB-0101) and can be revisited by the owner.

## Spec for agents
Build from [contract.json](./contract.json) only. Tests first. Use `FormAssociated` + `NativeControl` (rule form-associated-controls).
