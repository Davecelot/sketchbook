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

> A toggle for an on/off setting, with its label, description and error beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Turns a single setting on or off: notifications, dark mode, auto-save. It is a form control: it submits a value while on, resets with its form, is disabled by a disabled field set and can be `required`. Not for agreeing to terms or picking several items from a list (Checkbox), choosing one of several options (Radio Group), a pressed formatting button (Toggle), or running a one-off action (Button).

## 2. Anatomy
`field` (grid) holds `control` and, beside it, `label` (+ `required-indicator`), `description` (optional) and `error` (live region). `control` holds the `input` (the real switch, transparent, covering the track so the whole track is the hit area) and the decorative `track`, which holds the `thumb`.

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name; names the setting |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the label |
| `error` | text | — | error message; marks the switch invalid and blocks submission |
| `name` | text | — | form field name |
| `value` | text | on | submitted while on; nothing is submitted while off |
| `checked` | boolean | false | on/off; the attribute is the default restored by form reset |
| `required` | boolean | false | must be on to submit |
| `disabled` | boolean | false | cannot be toggled, focused or submitted |
| `size` | `default` \| `sm` | default | track 32×20 / 24×16 |

## 4. Variant matrix
One dimension, `size`: `default` and `sm`. No color variants. Every state below applies to both sizes.

## 5. Roles and color
Off: track `input`, thumb `background`. On: track `primary`, thumb `primary-foreground`. Label `foreground`; description `muted-foreground`; error text and invalid track border `destructive`; focus ring `ring`. The thumb's position, not only the color, tells on from off (1.4.1).

## 6. States
- **off / on (`checked`)**: the thumb sits at the start edge when off and slides to the end edge when on; the track fills with the primary color.
- **focus-visible**: 3px solid ring around the track, on keyboard focus only.
- **hover**: no change in look (the cursor shows it is clickable).
- **invalid**: when `error` is set, or when `required` and still off after blur or a submit attempt: destructive track border, error text, marked invalid.
- **disabled**: dimmed to the disabled opacity with a not-allowed cursor; cannot be toggled or focused. A disabled field set around it does the same without changing its own `disabled` prop, and re-enabling the field set restores it.
- Motion: the thumb slides over the fast duration; with reduced motion requested it jumps (2.3.3).

## 7. Dimensions and layout
| | track | thumb | inset |
| --- | --- | --- | --- |
| `default` | 32×20px | 16px | 2px |
| `sm` | 24×16px | 12px | 2px |

Track fully rounded with a 1px border (same color as the track, destructive when invalid) and shadow-xs. 12px gap between the switch and the label column; 6px between label and description. The switch aligns with the label's first line. Right-to-left mirrors the layout and the thumb's travel.

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5. Same in both sizes.

## 9. Accessibility
- **Role and state.** A native checkbox carrying the switch role (`PROPOSAL`, Q1; a button with a hand-kept checked state was discarded because the native control brings Space, checked state, `required` validation and the browser's messages). The screen reader announces "switch, on/off" and announces the new state on each toggle.
- **Name.** The `label` prop, through a label element in the same scope as the control. Clicking the label toggles. An external label pointing at the component also toggles it but cannot name it, which is why `label` is required. An empty label logs a dev-only warning. The label names the setting and never changes with the state.
- **Keyboard.** Tab moves focus to and from it. Space toggles. Enter submits the form, like every other form control in the library (`PROPOSAL`, Q2, SB-0009, SB-0101; toggling on Enter, which the APG lists as optional, was discarded for consistency with the native checkbox).
- **Description and error.** Both are in the accessible description; invalid marks the control invalid; the error region is a persistent polite live region, so the message is announced once when it appears. `error` also makes the form refuse to submit.
- **Required.** Native `required`: the form will not submit while the switch is off, and the browser gives the message. The visible asterisk is hidden from assistive technology (the required state is announced instead).
- **Contrast.** Off track 3:1 against the page, thumb 3:1 against its track in both states, solid 3px focus ring (deviations from the visual reference, WCAG 1.4.11).
- **Target size.** Default track 32×20px; `sm` is 24px wide. The label is part of the clickable row and the spacing exception of WCAG 2.5.8 covers the height.
- **Track and thumb are decorative**; the state lives on the control.

## 10. Usage
### Behavior
- The change takes effect as a setting: in a settings form it is saved with the form; outside a form the page applies it at once on `change`.
- `input` and `change` fire on each user toggle and cross the component boundary. Setting `checked` from code fires neither.
- Form participation: `value` (default `on`) is submitted under `name` while on; nothing while off (`PROPOSAL`, Q3; an "off value" prop was discarded because servers already read a missing field as off). Form reset restores the initial state given by the `checked` attribute (`PROPOSAL`, Q4). The browser restores the saved state on back/forward navigation. Disabled switches are not submitted.
- Validation: `required` means "must be on". It shows as invalid only after blur or a submit attempt, not on first render.
### Composition
- One switch per setting, each with its own `name`. A list of settings goes in a Field group (or a Field set with a legend naming the group).
- In a settings row where the label sits at the start and the switch at the end, put it in an Item and give the switch `hide-label` only if the row's visible title is the same text (`PROPOSAL`, Q8: no label-position prop).
### Choosing the props
- `size`: `default` everywhere; `sm` only in dense rows (tables, compact settings lists), keeping at least 24px between neighbouring switches.
- `description`: when the effect is not obvious from the label ("Sends a weekly summary to your email").
- `required`: rare for a switch; only when the setting truly must be on to continue, and always with an `error` or description saying why. For agreements use Checkbox.
- `error`: when the server or the page rejects the value.
### Do / Don't
- Do name the setting ("Email notifications"); don't name the action ("Turn on notifications") or change the label to "On"/"Off": the switch already announces its state and a changing label makes the name unstable.
- Don't use a switch for accepting terms or giving consent: that is a choice recorded with the form; use Checkbox.
- Don't use a switch to choose one of several options: it has exactly two states; use Radio Group.
- Don't use a switch to trigger a one-off action (send, delete): it holds a state, an action is a command; use Button.
- Don't use a switch as a pressed formatting button (bold, italic): that is announced as pressed, not on/off; use Toggle.

## Realizations
### Figma
Not realized yet. Expected axes: Size (Default, Small), State (Rest, Focus), Selected, Validation, Disabled; Label text, Description text and Error text; Required and Description switches.
### Web
Not started. Planned: `src/components/switch/Switch.ts` extending `FormAssociated(NativeControl(LitElement))` (`src/mixins/form-associated.ts`, `src/mixins/native-control.ts`); parts `field`, `control`, `input`, `track`, `thumb`, `label`, `required-indicator`, `description`, `error`; checked look through the inner input's `:checked`, dimmed host through `:host(:disabled)`, focus ring through `:state(focus-visible)`; `prefers-reduced-motion` removes the thumb transition; `:dir(rtl)` mirrors the thumb's travel. Behavior spec: `playwright/tests/switch/switch.behavior.spec.ts`.
### Coverage
None yet; see `plan.md` for the test plan.
### Known drift
- API shape: shadcn composes Field and Label parts around Switch; shadow DOM requires them inside
- off track color: shadcn's bg-input (neutral-200) is below 3:1; changed for WCAG 1.4.11
- focus ring: shadcn uses ring/50, below 3:1 (WCAG 1.4.11)
- size: shadcn default is 32×18.4px; rounded to 32×20 on the 4px grid
- dark-mode thumb: shadcn uses foreground for the off thumb in dark mode; here background in every mode
- invalid look: shadcn shows invalid only through the surrounding Field; here a destructive track border
- checked state: not reflected; the attribute is the default restored by form reset

## Open questions
Q0–Q8 are answered with their recommendation (nobody was available to approve; SB-0011, SB-0101) and listed in `contract.json`. Open:
- Q9: manual screen-reader pass (VoiceOver, NVDA) of the on/off announcement, before beta.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first. Use `FormAssociated` + `NativeControl`.
