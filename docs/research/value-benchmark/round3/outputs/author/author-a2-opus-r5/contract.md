---
component: Switch
status: draft
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-12
source: visual reference (look and sizes), WAI-ARIA APG Switch pattern (keyboard and roles), contract-first standard (contract and build process)
---

# Switch

> An on/off switch for a setting, with its label, description and error laid out beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Turns one setting on or off, such as a notification preference or a feature flag in a settings form. It is a form field: it submits a value while on, returns to its default when its form resets, is unavailable inside a disabled group of fields, and can be required to be on.

Not for agreeing to something that is only recorded on submit, or for picking several options from a list (Checkbox); not for choosing exactly one of several options (Radio Group); not for a pressed/unpressed toolbar button (Toggle).

## 2. Anatomy
`field` (two-column grid) holds:
- `control`: the native control and its visuals. `input` is the focusable native control; `track` is the pill-shaped background and `thumb` the round knob inside it. Track and thumb are decoration; the control carries the meaning.
- `label` (+ `required-indicator`, an asterisk shown when required), `description` (optional) and `error` (a live region that shows text while invalid), stacked in the second column.

The label sits after the track, as in the visual reference. `PROPOSAL`: no label-position option; a settings row with the switch at the far end is composed from a row layout instead.

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name; names the setting, never changes with the state |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the label, read as the description |
| `error` | text | — | error message; marks the field invalid and blocks submission |
| `size` | `default` \| `sm` | `default` | track and thumb size |
| `name` | text | — | form field name |
| `value` | text | `on` | submitted while on; nothing is submitted while off |
| `checked` | boolean | false | on/off; the attribute is the default that reset restores, the property is the live state |
| `required` | boolean | false | must be on for the form to be valid |
| `disabled` | boolean | false | cannot be focused or toggled; not submitted |

Events: `input` and `change` on each user toggle, both crossing the component boundary. Changing `checked` from code fires neither.

## 4. Variant matrix
| | off | on |
| --- | --- | --- |
| `default` | 32×20 track, 16px thumb at start | same, thumb at end, on color |
| `sm` | 24×16 track, 12px thumb at start | same, thumb at end, on color |

Every combination is valid. Validation (error) and disabled apply on top of any cell.

## 5. Roles and color
- Track off: `input` (the form-field border color, 3:1 against the background). Track on: `primary`.
- Thumb off: `background`; thumb on: `primary-foreground`. Both meet 3:1 against their track in every mode.
- Label `foreground`; description `muted-foreground`; error text and invalid track border `destructive`; focus ring `ring`.
- The state is never shown by color alone: the thumb position changes too (WCAG 1.4.1).

## 6. States
- **hover**: no visual change beyond the pointer cursor; the label is part of the target.
- **focus-visible**: 3px solid ring in `ring`, offset from the track so it stays visible against the on color.
- **checked (on)**: on track color; thumb slides to the end edge.
- **invalid**: when `error` is set, or when required and off after the user has interacted with it or tried to submit. Track gets a `destructive` border; the error text shows. Not shown on first render for an untouched required switch.
- **disabled**: dimmed (disabled opacity) track, thumb and label; not-allowed cursor; cannot be focused or toggled; not submitted; not validated. A disabled fieldset around it has the same effect without changing its own `disabled` value, and re-enabling the fieldset restores it.

## 7. Dimensions and layout
- `default`: track 32×20, thumb 16px. `sm`: track 24×16, thumb 12px. Thumb inset 2px from the track edge, fully round track and thumb, small shadow on the thumb.
- 12px gap between the control and the label column; 6px between label and description/error.
- The control is centered on the first line of the label.
- In right-to-left layouts the thumb's on position is the left edge (mirrored).

## 8. Typography
Label 14px, weight 500, control line height; description and error 14px, body line height. Size does not change the text.

## 9. Accessibility
- **Role**: the APG Switch pattern built on a native checkbox exposed as `switch`, so assistive technology announces "on"/"off". The state is never mixed. `PROPOSAL`: native checkbox with the switch role, rather than a button with a checked attribute, because the browser then provides Space, the checked state, required validity and the validation message.
- **Name and description**: the `label` prop names it, through a label in the same component; description and error are its accessible description. A dev-only warning fires once when `label` is empty.
- **Keyboard**: Tab / Shift+Tab move to and from it (one tab stop). Space toggles. Enter submits the form and does not toggle (`PROPOSAL`: the APG allows Enter to toggle as an option; declined so Enter means "submit" on every form control in the library, as on a native checkbox).
- **Focus**: visible 3px solid ring on keyboard focus; offset from the track (deviation from the visual reference's translucent ring, which falls under 3:1, WCAG 1.4.11).
- **Validation**: invalid is exposed as invalid; the error text is announced once when it appears (polite live region); `error` also blocks submission. The required asterisk is hidden from assistive technology; required is exposed natively.
- **Contrast**: off track at 3:1 against the background (deviation from the visual reference's lighter track, WCAG 1.4.11); thumb at 3:1 against its track in both states; text at 4.5:1.
- **Target size**: the track plus the label row and the 12px gap satisfy WCAG 2.5.8 at both sizes.
- **Motion**: the thumb slide and color change last a fast motion step and are removed when the user prefers reduced motion.
- **Label wording**: the label names the setting and stays fixed; it is never rewritten to "On"/"Off" or "Turn on"/"Turn off".

## 10. Usage
### Behavior
- Toggling takes effect in the form state immediately: `input` then `change` fire, and a `change` listener reading the form's data already sees the new value.
- Submitted as `name=value` while on, nothing while off. Form reset returns it to its `checked` attribute. Browser form-state restore (back/forward) re-applies the saved state.
- Clicking the label, or an external label pointing at the component, toggles it.
- `required` means it must be on.

### Composition
- One switch per setting. A list of settings is a stack of switches, or rows built with the row layout component, each with its own label.
- In a group of related settings, wrap them in a fieldset so one `disabled` turns them all off.
- Put longer explanations in `description`, not in the label.

### Choosing the props
- `size="default"`: everywhere by default, including settings forms.
- `size="sm"`: dense rows such as table cells or compact settings lists, where the label text is also small or hidden.
- `description`: when turning the setting on has a consequence the user should know (cost, visibility, data sharing).
- `required`: only when the form truly cannot proceed with the setting off; the label must say what is being enabled.
- `error`: a server-side or cross-field message; leave it empty for plain required validation, which the browser explains.
- `hide-label`: only when visible text in the same row already names the setting.
- `checked` attribute: the initial and reset state.

### Do / Don't
- Do label the setting ("Email notifications"). Don't use an action or a state-dependent label ("Turn on" / "Turn off"): the switch already announces on/off, and a changing label confuses voice-control users.
- Don't use a switch for agreeing to terms or for a choice recorded only on submit; use Checkbox.
- Don't use a row of switches to pick one of several options; use Radio Group.
- Don't use a switch for a partial or mixed state; use Checkbox with indeterminate.
- Don't use a switch for a pressed toolbar button such as bold or a view mode; use Toggle.

## Realizations
### Figma
Not realized yet.
### Web
Not started. Planned: a Lit element extending `NativeControl(FormAssociated(LitElement))`, rendering `<input type="checkbox" role="switch">` with parts `field`, `control`, `input`, `track`, `thumb`, `label`, `required-indicator`, `description`, `error`. `formValue()` returns `value` while checked, else `null`; `formReset()` restores the `checked` attribute; `validationAnchor()` is the inner input; `?disabled=${this.isDisabled}`; the dimmed look uses `:host(:disabled)`; thumb movement mirrored with `:dir(rtl)`; transitions removed under `prefers-reduced-motion`. Behavior spec: `playwright/tests/switch/switch.behavior.spec.ts`.
### Coverage
None yet (see plan.md for the test plan).
### Known drift
- API shape: the visual reference composes Label and Field parts around Switch; shadow DOM requires them inside the component.
- unchecked track color: `color.input` (3:1) instead of the reference's lighter track (WCAG 1.4.11).
- focus ring: 3px solid, offset, instead of the reference's translucent ring (WCAG 1.4.11).
- track size: 32×20 / 24×16 on the 4px size scale instead of 32×18.4 / 24×14.
- dark-mode thumb: one semantic token per role in every mode instead of a dark-only foreground thumb.
- checked state: not reflected; the attribute is the reset default.
- invalid look: destructive track border plus error text instead of a translucent destructive ring.

## Open questions
None open. Decisions taken with the recommended answer (owner pre-approval, SB-0011) are recorded as answered in `contract.json` `openQuestions` (Q1–Q7) and in `plan.md`.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first. Use `FormAssociated` + `NativeControl`.
