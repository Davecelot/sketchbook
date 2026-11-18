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

> A switch for an on/off setting, with its label, description and error laid out beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Turns one setting on or off, such as "Notifications" or "Airplane mode". It is a form control: its state is submitted with the form, restored by form reset, disabled by a disabled group around it, and it can be required.

Not for choosing several items or giving agreement (Checkbox), choosing one of several named options (Radio Group, Toggle Group), or a parent that summarizes child settings (Checkbox with `indeterminate`, because a switch has no partial state).

## 2. Anatomy
- `field` — two columns: the track in the first; label, description and error stacked in the second.
- `track` — pill-shaped, filled with the off or on color. Holds:
  - `input` — the actual control, covering the whole track; it receives focus, Space and validation.
  - `thumb` — the round knob, at the inline start when off and the inline end when on. Its position is the cue for the state that does not rely on color.
- `label` (+ `required-indicator`, an asterisk hidden from assistive technology) — names the switch; clicking it toggles.
- `description` (optional) — help text under the label.
- `error` (optional) — the error message, in a region that announces it when it appears.

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the label |
| `error` | text | — | marks the field invalid and blocks submission |
| `size` | `default` \| `sm` | `default` | track and thumb size only |
| `name` | text | — | form field name |
| `value` | text | on | submitted while on |
| `checked` | boolean | false | on/off; the attribute is the reset default |
| `required` | boolean | false | must be on to submit |
| `disabled` | boolean | false | cannot be focused or toggled; not submitted |

Events: `input` and `change`, once per user toggle, both reaching listeners outside the component. Neither fires when `checked` is set by code or by form reset.

## 4. Variant matrix
One axis, `size`: `default`, `sm`. No emphasis variants. States (below) combine with both sizes.

## 5. Roles and color
- Track off: `input` (the 3:1 control border color, so the off track is visible on the page).
- Track on: `primary`.
- Thumb off: `background`; thumb on: `primary-foreground`. Each is checked against its track for 3:1 in every mode.
- Label `foreground`; description `muted-foreground`; error text and invalid track border `destructive`; focus ring `ring`.

## 6. States
- **off / on** (`checked`) — the track fills with the on color and the thumb slides to the inline end.
- **hover** — no change of its own; the pointer shows the switch and its label are clickable.
- **focus-visible** — keyboard focus only: a solid 3px ring around the track.
- **invalid** — `error` is set, or `required` and off after the person leaves the switch or tries to submit: track border in `destructive`, error message shown and announced.
- **disabled** — `disabled`, or inside a disabled group of fields: dimmed (opacity 0.5), not-allowed cursor, skipped by Tab, not submitted. A disabled group does not change the `disabled` prop, so re-enabling the group restores the switch.

The thumb moves with a short transition (fast duration, standard easing); there is no movement when the person asks for reduced motion.

## 7. Dimensions and layout
| Size | Track | Thumb | Inset |
| --- | --- | --- | --- |
| `default` | 32 × 20 | 16 | 2 |
| `sm` | 24 × 16 | 12 | 2 |

Track fully rounded, 1px border (transparent unless invalid), shadow-xs. 12px gap between the track and the text column; 6px between label and description. The track aligns with the first line of the label. In right-to-left text the "on" end is the left.

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5. The same in both sizes.

## 9. Accessibility
- Role switch on a native checkbox input `PROPOSAL` (SB-0007; the alternative, a button with `aria-checked`, would lose native form behavior). The state is exposed as on/off, never mixed.
- Name from `label`, through a native label in the same scope; an external `<label for>` still activates the switch but does not name it, so `label` stays required. `hide-label` hides it visually only. A dev-only warning fires once when `label` is empty.
- Keyboard: Tab focuses; Space toggles; Enter submits the owning form and does not toggle `PROPOSAL` (the APG allows Enter to toggle; matching a native checkbox and Checkbox keeps implicit submission working, SB-0009).
- Description and error are the switch's accessible description; it is marked invalid while invalid; the error region is persistent and polite, so the message is announced once when it appears.
- `required` is exposed natively; the asterisk is hidden from assistive technology.
- Target size: the 24 × 16 `sm` track relies on the clickable label row and the 12px gap (WCAG 2.5.8 spacing exception).
- Contrast: off and on tracks 3:1 against the page; each thumb 3:1 against its track; focus ring 3:1; text 4.5:1. Thumb position is the non-color cue (WCAG 1.4.1).

## 10. Usage
### Behavior
- A toggle takes effect in the form's value immediately; `change` fires after the value is updated, so a listener reading the form data sees the new state.
- The form receives `name=value` while on and nothing while off `PROPOSAL` (like a native checkbox; submitting "off" was rejected because servers already treat a missing entry as off).
- `form.reset()` restores the state given by the `checked` attribute; the `checked` property is the live state and is not written back to the attribute `PROPOSAL` (as in Checkbox).
- `required` blocks submission while off; `error` blocks it until cleared.
- Saved form state (back/forward navigation, autofill restore) re-applies the saved on/off state.

### Composition
- One switch per setting. A list of settings stacks switches in a field group; give the group a legend when the settings belong together.
- Put the switch in a form when its value is submitted; outside a form it is a plain control whose `change` event the page handles.

### Choosing the props
- `label`: name the setting ("Wi-Fi", "Email me about new comments"), never the action ("Turn on") and never text that changes with the state.
- `description`: when the effect is not obvious from the label, or the setting has a consequence.
- `size`: `default` in forms and settings pages; `sm` in dense rows (tables, compact panels) where the label row still provides the target.
- `required`: only when the setting must be on to continue; prefer Checkbox for agreements.
- `error`: the reason the value was rejected, in plain words.
- `hide-label`: only when visible text next to the switch already names it (a table row header, for example).

### Do / Don't
- Do label the setting, not the action. Don't change the label with the state: the switch already announces on or off.
- Don't use a switch to pick several items or to accept terms; use Checkbox.
- Don't use a switch to choose between two named options (light/dark); "off" doesn't name the other option. Use Radio Group or Toggle Group.
- Don't use a switch as a parent of other settings; it has no partial state. Use Checkbox with `indeterminate`.
- Don't put on/off text or icons inside the track `PROPOSAL`; the thumb position and the role already convey the state.

## Realizations
### Figma
Not realized yet.
### Web
Not started. Planned: `src/components/switch/` extending the shared form-associated and native-control mixins; parts `field`, `track`, `input`, `thumb`, `label`, `required-indicator`, `description`, `error`. Behavior spec `playwright/tests/switch/switch.behavior.spec.ts`. See [plan.md](./plan.md).
### Coverage
None yet; the planned coverage is in [plan.md](./plan.md).
### Known drift
- API shape: the visual reference composes Field and Label around Switch; an outside label cannot name a control inside the component, so they are built in.
- track size: the visual reference uses an 18.4px track height; the semantic token rounds it to 20px.
- dark-mode thumb: the visual reference switches the off thumb to the foreground color in dark mode; one mapping per state keeps the tokens mode-free, and each pair is checked for contrast in every mode.
- focus ring: the visual reference uses ring/50, below 3:1 (WCAG 1.4.11).
- invalid look: the visual reference only tints the ring and has no message.
- checked state: not reflected; the attribute is the default restored by form reset.

## Open questions
Answered with the recommendation (no owner available; SB-0011, SB-0101) — the owner can revisit them:
- Q1 Enter submits the form, does not toggle.
- Q2 Nothing is submitted while off.
- Q3 `checked` is not reflected.
- Q4 Sizes `default` and `sm`.
- Q5 `label` required; no in-track text or icons.

Open:
- Q6 Manual screen-reader pass (VoiceOver + Safari, NVDA + Firefox) before beta.

## Spec for agents
Build from [contract.json](./contract.json) only. CSS uses only `--sb-switch-*` variables (check T4). Tests first. Use `FormAssociated` + `NativeControl`.
