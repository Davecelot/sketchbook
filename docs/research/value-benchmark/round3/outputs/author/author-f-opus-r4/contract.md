---
component: Switch
status: draft
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-12
source: visual reference (look, sizes and API), WAI-ARIA APG switch pattern (keyboard and ARIA), contract-first standard (contract and build process), the project's Checkbox contract (field layout and form behavior)
---

# Switch

> An on/off switch for a single setting, with its label, description and error beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Turns one setting on or off, such as notifications, dark mode or airplane mode. Its label names the setting. It takes part in a form the way a native control does: it submits a value while on, resets with its form, is disabled by a disabled fieldset, and can be `required`. It is not for a partly-on state (Checkbox with indeterminate), for choosing one of several options (Radio Group), or for choosing several from a list (one Checkbox per option).

## 2. Anatomy
`field` is a grid: the switch in the first column, and the label, description and error in the second.
- `control` stacks three things in one cell: `input`, the native on/off control that receives focus, Space and validation; `track`, the pill-shaped track; and `thumb`, the round thumb inset inside the track.
- `label` (+ `required-indicator`, an aria-hidden asterisk) names the setting. Clicking it toggles the switch.
- `description` (optional) is help text under the label.
- `error` (optional) is a live region whose text appears when the field is invalid.

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name; names the setting and does not change with the state |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text: what turning the setting on does |
| `error` | text | — | marks the field invalid and blocks submission |
| `size` | `default` \| `sm` | default | track and thumb size only (`PROPOSAL`) |
| `name` | text | — | form field name |
| `value` | text | on | submitted only while on |
| `checked` | boolean | false | on/off; the attribute is the reset default |
| `required` | boolean | false | must be on to submit |
| `disabled` | boolean | false | cannot be focused or toggled; not submitted |

Events: `input` and `change` fire once per toggle by the user. Both bubble and cross into the page. Neither fires when `checked` is set in code or by a form reset.

## 4. Variant matrix
One dimension: `size` (`default`, `sm`). The states below apply to both sizes. `PROPOSAL`: the visual reference has the same two sizes; a `lg` size was not added because no use case asks for it.

## 5. Roles and color
| Element | Off | On |
| --- | --- | --- |
| Track | `input` | `primary` |
| Thumb | `background` | `primary-foreground` |

The label uses `foreground`, the description `muted-foreground`, the error text and the invalid track border `destructive`, and the focus ring `ring`.

State is never shown by color alone: the thumb moves from the inline start (off) to the inline end (on). Every pair holds 3:1 in both modes. The lowest pair is the off thumb on the off track, at 4.18:1 in dark mode. `PROPOSAL`: the off thumb uses `background` in dark mode as well. The visual reference uses the foreground color there; the discarded alternative would need a mode-specific component token.

## 6. States
- **Off / on (`checked`):** the track fill changes and the thumb slides to the other end.
- **Focus-visible:** a 3px solid ring around the track.
- **Hover:** pointer cursor only.
- **Invalid:** applies when `error` is set, or when the switch is `required` and still off after blur or a submit attempt. The track gets a destructive border and the error text shows.
- **Disabled:** applies from `disabled` or from a disabled fieldset. The switch is dimmed to 50% opacity, shows a not-allowed cursor, cannot be toggled and is not submitted.

There is no indeterminate and no readonly state (see Q8).

## 7. Dimensions and layout
| Size | Track | Thumb |
| --- | --- | --- |
| `default` | 32×20 | 16px |
| `sm` | 24×16 | 12px |

In both sizes the thumb sits 2px in from every edge of the track.
- The track is a pill with a 1px border (transparent unless invalid) and shadow-xs. The thumb is a circle.
- The label row is 12px from the switch, and the label sits 6px above the description and error. The switch is centered on the label's first line.
- In right-to-left text everything mirrors, including the direction the thumb travels. `PROPOSAL`: the label goes after the switch, the same row layout as Checkbox. A label-before layout is left to composition.
- Motion: the thumb slides and the track color fades over the fast duration with standard easing. With reduced motion requested, the change is instant.

## 8. Typography
The label is 14px, weight 500, line-height 1.43. The description and error are 14px, line-height 1.5. Both sizes use the same text sizes, so a form keeps one text size (`PROPOSAL`).

## 9. Accessibility
- **Role:** a native checkbox input carrying the switch role. Assistive technology announces it as a switch that is on or off, never mixed (APG switch pattern). `PROPOSAL`: the discarded alternative is a button with `aria-checked`, which would need the keyboard, `required` validity and disabled behavior rebuilt by hand (Q1).
- **Name:** the `label`, through a native label in the same root. The label names the setting and never changes with the state (APG). A missing label logs a dev-only warning.
- **Keyboard:** Tab moves focus to and from the switch. Space toggles it. Enter submits the form and does not toggle (Q2). The inner control has no form owner, so the component requests the submission itself (SB-0009).
- **Description and error:** both are in the accessible description. `aria-invalid` is set while invalid, and the error is announced once when it appears (a persistent polite live region). An `error` also sets a custom validity, so the form blocks submission.
- **Required:** uses native required, so an off switch reports a missing value. The asterisk is hidden from assistive technology.
- **Contrast:**
  - The off track (`input`) holds 3:1 against the page; the visual reference's light input color does not (WCAG 1.4.11).
  - The thumb holds at least 3:1 against its track in both states and modes.
  - The focus ring is solid, not translucent.
- **Target size:** the track is 32×20 (`sm` is 24×16). The label is part of the clickable row, and the 12px gap meets the WCAG 2.5.8 spacing exception. With `hide-label`, keep stacked switches at least 24px apart.

## 10. Usage
### Behavior
- A toggle by the user fires `input` and then `change`; read `checked` from the target.
- While on, the form receives `name=value` (value defaults to `on`). While off, the form receives nothing, exactly like a native checkbox (Q4).
- A form reset returns the switch to its `checked` attribute; the property is not reflected (Q3).
- A disabled fieldset disables the switch and leaves its own `disabled` attribute unchanged; re-enabling the fieldset restores it.
- A switch inside a form is submitted with that form. If the setting should take effect immediately instead, the page listens to `change` and applies it; the switch looks and behaves the same either way.

### Composition
- Use one switch per setting.
- In a settings list, give each switch its own `name` and a `description` when the effect needs explaining.
- A group of switches under one heading goes in a Field set (later).
- An outside `<label for>` toggles the switch but does not name it; always set `label`.

### Choosing the props
1. Start with a `label` that names the setting ("Email notifications"), not the state.
2. Add a `description` when the consequence of turning it on is not obvious.
3. Use `size="sm"` for dense rows (tables, compact lists). Use `default` everywhere else.
4. Use `required` only when the form cannot be sent with the setting off, and say what is being turned on in the label.
5. Use `error` for a server-side or cross-field message. The required message comes from the browser.

### Do / Don't
- **Do** use a fixed label naming the setting. **Don't** use a label that changes with the state ("On"/"Off", "Enabled"/"Disabled"). The state is already announced as on/off, so a changing label contradicts it (APG).
- **Don't** use a switch for a partly-on state. A switch has only on and off; use Checkbox with indeterminate.
- **Don't** use a switch to choose one of several options or several from a list. Use Radio Group, or one Checkbox per option.

## Realizations
### Figma
Not realized yet.
### Web
Not started. The planned files are `src/components/switch/Switch.ts`, `Switch.scss`, `Switch.stories.ts` and `index.ts`, plus the generated `Switch.styles.ts`.
- **Mixins:** `FormAssociated(NativeControl(...))`, like Checkbox.
- **Inner control:** `<input type="checkbox" role="switch">`, rendered with `?disabled=${this.isDisabled}`. The dimmed style is `:host(:disabled)`.
- **Parts:** `field`, `control`, `input`, `track`, `thumb`, `label`, `required-indicator`, `description`, `error`. `size` is reflected for styling.
- **Behavior spec:** `playwright/tests/switch/switch.behavior.spec.ts`.
### Coverage
None yet. The planned tests are listed in [plan.md](./plan.md).
### Known drift
- **API shape:** the visual reference composes Field and Label around Switch; shadow DOM requires them inside.
- **Track height:** the visual reference uses an 18.4px track. The `size.switch.*` tokens round it to 20px, which leaves a 2px inset around the 16px thumb.
- **Off track color:** the reference's light input color is below 3:1. This contract uses `input` (3:1) for WCAG 1.4.11.
- **Off thumb in dark mode:** the reference uses the foreground color; this contract uses `background` in every mode.
- **Focus ring:** the reference uses a translucent ring, below 3:1; this contract uses a 3px solid ring.
- **Invalid:** the reference has no switch-specific invalid style; this contract adds a destructive track border and a built-in error.
- **`checked`:** not reflected, because the attribute is the default that form reset restores.

## Open questions
None open. Every question was answered with its recommendation on 2026-11-12, because no owner was available (SB-0101, SB-0011). The answers are listed in `contract.json` → `openQuestions` (Q0–Q10) and in [plan.md](./plan.md), so the owner can revisit them.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first. Use `FormAssociated` + `NativeControl`.
