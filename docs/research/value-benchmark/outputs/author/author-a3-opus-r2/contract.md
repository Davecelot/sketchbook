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

> Draft, every open question answered. Typed spec: [contract.json](./contract.json).

## 1. Purpose

`<sb-switch>` turns one setting on or off. It is a form control: it submits `value` under `name` while on, goes back to its default with `form.reset()`, is disabled by a `<fieldset disabled>` ancestor, and makes its form invalid while `required` and off. It has a visible label, an optional description, an optional error message, and two sizes.

Use it for a setting that reads as on/off. Use Checkbox for agreeing to something in a list of options or for a mixed state, and Radio Group or Toggle Group for a choice between named options.

## 2. Anatomy

```
sb-switch (root, host)
├── track            pill; fill shows the state; carries the focus and error rings
│   ├── control      <input type="checkbox" role="switch">, transparent, covers the track
│   └── thumb        round knob, start = off, end = on (mirrored in RTL); aria-hidden
└── text column
    ├── label        <label for="control">: the accessible name; click toggles
    ├── description  optional, under the label
    └── error-message optional, under the description, only while validation="error"
```

Every element above is exposed as a `part` with the same name.

## 3. Props / API

| Prop | Attribute | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `checked` | `checked` | boolean | `false` | On/off. Attribute = default state (what reset restores), property = current state; not reflected. Alias of `selected` in the API vocabulary. |
| `value` | `value` | string | `"on"` | Submitted while on; nothing while off. |
| `name` | `name` | string | `""` | From the FormAssociated mixin. |
| `disabled` | `disabled` | boolean | `false` | Also disabled by `<fieldset disabled>` without the attribute being changed. |
| `required` | `required` | boolean | `false` | Must be on for the form to be valid. |
| `label` | `label` | string | `""` | Visible label and accessible name. Required; empty logs a warning. |
| `description` | `description` | string | `""` | Hint under the label; the accessible description. |
| `errorMessage` | `error-message` | string | `""` | Shown only while `validation="error"`. |
| `validation` | `validation` | `none` \| `error` | `none` | Error look + `aria-invalid`. Presentation only, see Q3. |
| `size` | `size` | `small` \| `medium` | `medium` | Track and thumb only. |

Methods and getters from the mixins: `form`, `validity`, `validationMessage`, `willValidate`, `checkValidity()`, `reportValidity()`, `click()`.

### Events

| Event | Bubbles | Composed | When |
| --- | --- | --- | --- |
| `change` | yes | yes | After a user toggle (click, label click, Space). FormData already holds the new value. |
| `input` | yes | yes | Native, same triggers as `change`. |

Neither fires for a programmatic `checked` change or for `form.reset()`.

## 4. Variant matrix

`size` (small, medium) × `checked` (false, true) × `validation` (none, error) × `disabled` (false, true). No excluded combinations. Design file: Disabled drawn at rest only.

## 5. Roles and color

| Element | Off | On |
| --- | --- | --- |
| Track | `--sb-switch-track-off` → `color.input` | `--sb-switch-track-on` → `color.primary` |
| Thumb | `--sb-switch-thumb-off` → `color.background` | `--sb-switch-thumb-on` → `color.primary-foreground` |

Label `color.foreground`, description `color.muted-foreground`, error message and error ring `color.destructive`, focus ring `color.ring`. State is never shown by color alone: the thumb also moves.

Contrast pairs (checked by T6 in every mode): track-off and track-on against the page (ui), thumb against each track (ui), focus ring against the page (ui), label, description and error text against the page (text).

## 6. States

| State | Trigger | Look |
| --- | --- | --- |
| rest | default | off colors |
| checked | `checked` | on colors; thumb slides to the end over `motion-duration` / `motion-easing`, no transition under `prefers-reduced-motion: reduce` |
| focus-visible | keyboard focus | `focus-ring-width` ring in `focus-ring-color` around the track, offset `focus-ring-offset`; host gets `:state(focus-visible)` |
| disabled | `disabled` or disabled fieldset | whole component at `disabled-opacity`, `cursor: not-allowed`; styled with `:host(:disabled)` |
| invalid | `validation="error"` | `error-ring-width` ring in `error-color` around the track; error message shown. The focus ring replaces it while focused. |

No hover or pressed look.

## 7. Dimensions and layout

| | medium | small |
| --- | --- | --- |
| Track | `width` × `height` (32 × 20) | `width-small` × `height-small` (24 × 16) |
| Thumb | track height − 2 × `inset` (16) | (12) |

- Track corner `radius` (pill); thumb inset `inset` from the track edge on every side.
- Track and text column in a row, gap `gap`; track aligned to the first line of the label.
- Label, description and error message stacked with `text-gap`.
- The thumb size is derived in CSS from the height and inset tokens, so it has no token of its own.

## 8. Typography

All text in `font-family`. Label: `label-font-size`, `label-font-weight`, `label-line-height`, `label-color`. Description and error message: `description-font-size`, `description-line-height`; colors `description-color` and `error-color`. Text does not change with `size`.

## 9. Accessibility

- **Element:** native `<input type="checkbox" role="switch">` (Q1). The browser exposes role switch and the on/off state; `aria-checked` is not set by hand.
- **Name:** the `label` prop, rendered as `<label for>` on the inner input. An outside `<label for>` pointing at the host activates the switch (the host forwards the click) but does not name it.
- **Description:** `aria-describedby` on the input lists the description and, while `validation="error"`, the error message. `aria-invalid="true"` while `validation="error"`.
- **Keyboard:** Tab / Shift+Tab move focus (one tab stop, skipped while disabled). Space toggles. Enter submits the owning form and does not toggle (Q2).
- **Focus:** delegated to the input (`delegatesFocus`); visible ring on `:focus-visible` only.
- **Target size:** the label is part of the target, which meets WCAG 2.5.8 for both sizes; the small track alone (24 × 16) would not.
- **Form association:** `FormAssociated(NativeControl(LitElement))` (rule form-associated-controls).
  - `formValue()`: `value` while checked, else `null`.
  - `formReset()`: `checked = hasAttribute('checked')` (Q4).
  - `formStateRestore(state)`: `checked = state !== null`.
  - `validationAnchor()`: the inner input (NativeControl default), rendered with `?required=${this.required}` and `?disabled=${this.isDisabled}`, so `valueMissing` and its browser message are mirrored on the host and `reportValidity()` focuses it.
  - The change handler sets `checked` from the input, calls `syncFormState()`, then re-dispatches `change`.
- **WCAG:** 1.3.1, 1.4.1, 1.4.3, 1.4.11, 2.1.1, 2.4.7, 2.5.8, 3.3.1, 3.3.2, 4.1.2.

## 10. Usage

### Behavior

A switch takes effect as a value: in a form it is submitted with the form; outside a form the app listens to `change`. The label names the setting and does not change with the state.

### Composition

```html
<form>
  <sb-switch name="notifications" label="Email notifications" checked></sb-switch>
  <sb-switch name="airplane" label="Airplane mode" description="Turns off all wireless connections."></sb-switch>
  <sb-switch name="terms" label="Accept the terms" required></sb-switch>
</form>
```

### Choosing the props

- `size="small"` in dense settings lists and tables; `medium` everywhere else.
- `validation="error"` + `error-message` for an error the app decides (for example, from the server). For "must be on", use `required` and let the browser validate.

### Do / Don't

- Do name the setting in the label ("Email notifications").
- Don't change the label to "On"/"Off" with the state; the state is already announced.
- Don't use a switch for two named options (light/dark) or a mixed state; use Radio Group, Toggle Group or Checkbox.

## Realizations

### Figma
Not started.
### Web
Not started. Behavior spec: `playwright/tests/switch/switch.behavior.spec.ts`.
### Coverage
None yet.
### Known drift
None.

## Open questions

All answered on 2026-11-12 with the recommendation, because no approver was available in the session; a reviewer may reopen any of them.

- **Q1** Backing element: `<input type="checkbox" role="switch">`, not `<button role="switch">`, for native state, `required` and validation messages, and to reuse NativeControl.
- **Q2** Enter does not toggle (APG lists it as optional); it submits the form, as on a native checkbox.
- **Q3** `validation="error"` is presentation only; form validity comes from `required`.
- **Q4** `form.reset()` restores the `checked` attribute; `checked` does not reflect.
- **Q5** Sizes `small` and `medium`; only track and thumb change.
- **Q6** Label after the track, fixed; no `hideLabel` until asked for.

## Spec for agents
Build from contract.json only. CSS uses only --sb-switch-* variables (check T4). Tests first (rule test-first).
