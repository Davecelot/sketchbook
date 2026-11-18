---
component: Switch
status: draft
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-12
source: shadcn/ui Switch (UI and API), WAI-ARIA APG Switch pattern, harness process
---

# Switch

> A toggle for an on/off setting that takes effect immediately. It acts as a form field: it submits a value while on, returns to its initial state when the form resets, is disabled by a disabled fieldset and validates `required`. Typed spec: [contract.json](./contract.json).

## 1. Purpose

A Switch lets a person turn one setting on or off. The change applies as soon as it is made, which is what separates it from a checkbox, whose choice is confirmed later. It carries a label that names the setting, an optional description that explains the effect, and an optional error message for a value that is not accepted. It comes in two sizes for roomy and dense settings lists.

## 2. Anatomy

- **Control**: the operable element and focus target; carries the switch role.
- **Track**: the pill showing on or off by its fill.
- **Thumb**: the circle at the start when off, at the end when on.
- **Text** (optional): stacks the label, the description and the error message beside the control.
- **Label**, **Description**, **Error** (optional): the name, the hint, and the reason a value is not accepted.

## 3. Props / API

Typed list: `contract.json` `props`.

- `checked`: on or off. Default off. Its initial value is the state a form reset returns to.
- `name`, `value`: what is submitted. `value` defaults to `on` and is submitted only while the switch is on; nothing is submitted while off or without a `name`.
- `disabled`: unavailable, not focusable, not submitted. A disabled fieldset around the switch has the same effect without changing `disabled`.
- `required`: the switch must be on for the form to be valid.
- `label`, `description`, `errorMessage`: the texts. `label` is also the accessible name.
- `validation`: `none` or `error`. Set by the author.
- `size`: `small` or `medium`. Default `medium`.

Event: `change`, fired after the person toggles it.

## 4. Variant matrix

Size (`small`, `medium`) by on/off by validation (`none`, `error`). Every combination exists. Disabled and focus apply on top of any of them.

## 5. Roles and color

- Off: a neutral track (the input color) with a thumb in the background color.
- On: a primary track with a thumb in the primary-foreground color.
- Focus: a ring in the ring color around the track.
- Error: the destructive color on the track border and the error text.
- Label in the foreground color, description in the muted foreground color.

Component tokens alias semantic tokens only (`contract.json` `tokens`).

## 6. States

- **Focus-visible**: a ring around the track, for keyboard focus only.
- **Checked**: the on look.
- **Disabled**: dimmed; cannot be focused or toggled.
- **Invalid**: the error look and the error message, while `validation` is `error`.

Hover and pressed have no separate look in this version.

## 7. Dimensions and layout

The control sits at the start of a row with the text block after it, vertically aligned with the first line of text. The track is wider than tall; the thumb fills the track height less a small inset. `small` uses a smaller track and thumb. The operable area is at least 24 by 24 px in both sizes, and the whole row, text included, toggles the switch.

## 8. Typography

The label uses the body family and size at label weight; the description and the error use the caption size. The text does not change with `size`.

## 9. Accessibility

- Role switch, with the on state exposed to assistive technology. Built on a native checkbox control so the browser provides the state, Space activation and the required constraint.
- Name: the `label` prop. A visible label outside the component that points at the switch with `for` activates it but does not name it, so `label` is always given; a missing one logs a warning.
- Description and error message are read with the control. The control is marked invalid while `validation` is `error`.
- Keyboard: Tab and Shift+Tab move focus (a disabled switch is skipped); Space toggles; Enter does not toggle but submits the form, as a native checkbox does.
- The switch role does not support a required property, so `required` is enforced by the form and not announced as a role property.
- Form behavior: submits `value` under `name` while on; resets with the form; a disabled fieldset disables it and re-enabling restores it without touching the author's `disabled`; `required` makes an off switch report a missing value and `reportValidity()` focuses it; a label pointing at it with `for` toggles it.
- Contrast: text 4.5:1 for label, description and error; 3:1 for track, thumb and focus ring (WCAG 1.4.11), in every mode. Pairs are in `contract.json`.
- Target size at least 24 by 24 px.

## 10. Usage

### Behavior

Toggling applies the change at once and fires `change`. Changing `checked` from code does not fire `change`. A form reset restores the initial `checked`. `validation` and `errorMessage` are controlled by the author: a `required` switch left off makes the form invalid, but the error look appears only when `validation` is `error`.

### Composition

A Switch stands alone or in a list of settings, one per row. Group related switches under a shared heading. The label sits after the control. It is not used to choose between exclusive options.

### Choosing the props

- **size**: `medium` for normal settings pages and forms; `small` for dense lists, tables and toolbars.
- **description**: when the label alone does not say what turning it on does.
- **required**: when the setting must be on to continue. Pair with `validation` `error` and `errorMessage` to say why it is not accepted.
- **name** and **value**: set `name` whenever the switch belongs to a form; change `value` only when the receiving side expects something other than `on`.

### Do / Don't

- Do use it for a setting whose change applies immediately. Don't use it for a choice confirmed with a submit button, such as accepting terms: use a Checkbox, because a switch promises an immediate effect.
- Do always give a `label`. Don't leave the name to nearby text: the nearby text does not name the control, so it is announced unnamed.
- Do use independent switches for independent settings. Don't use a row of switches for one-of-many: use a radio group, or a toggle group for a segmented choice.

## Realizations

### Figma
Not realized yet.

### Web
Not started. Planned as a Lit element `sb-switch` extending the shared form-associated and native-control mixins, wrapping a native checkbox input with role switch; the track and thumb are decorative and hidden from assistive technology. The error message is wired to the control's description. Behavior spec: `playwright/tests/switch/switch.behavior.spec.ts`.

### Coverage
None yet.

### Known drift
None. The prop `checked` is the registered alias of `selected`.

## Open questions

Answered with the recommended choice (no reviewer was available); details in `contract.json`.

- **Q1** Error look from `required` validity alone? No: `validation` only (`PROPOSAL`; the alternative was showing the browser message on submit).
- **Q2** Does Enter toggle? No: Space toggles, Enter submits the form (`PROPOSAL`; the APG makes Enter optional).
- **Q3** `selected` or `checked`? `checked`, the registered alias (`PROPOSAL`).
- **Q4** `hideLabel`, read-only, indeterminate, label position? Not included.
- **Q5** Hover and pressed looks? Not included.
- **Q6** (open) Manual VoiceOver and NVDA pass to confirm the description and error are read with the switch, before the status moves to stable.

## Spec for agents
Build from contract.json only. CSS uses only --sb-switch-* variables (check T4). Tests first (rule test-first).
