---
component: Switch
status: draft
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-12
source: shadcn/ui Switch (look, sizes and API), WAI-ARIA APG switch pattern (role, keyboard, label), contract-first standard (contract and build process)
---

# Switch

> A switch for an on/off setting, with its label, description and error beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
One setting that is either on or off, such as "Email notifications" or "Airplane mode". It takes part in forms like a native checkbox: it submits its value while on, resets with its form, is disabled by a disabled `<fieldset>` and validates `required`. Not for choosing several options from a list (Checkbox), exactly one of several (Radio Group), or a partial state (Checkbox with `indeterminate`).

## 2. Anatomy
`field` (grid) holds `control` (the hit area, at least 24px high) with the native `<input type="checkbox" role="switch">` laid over the `track` and its `thumb`, then `label` (+ `required-indicator`), `description` (optional) and `error` (live region). Track and thumb are aria-hidden decoration; the input receives focus, clicks and validation.

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name; does not change with the state |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the label |
| `error` | text | — | marks the field invalid (customError) |
| `size` | `default` \| `sm` | `default` | track 32x20 or 24x16, thumb 16 or 12; reflected |
| `name` | text | — | form field name |
| `value` | text | on | submitted while on; nothing submitted while off |
| `checked` | boolean | false | current state; the attribute is the reset default |
| `required` | boolean | false | must be on; aria-hidden asterisk |
| `disabled` | boolean | false | native; also set by a disabled fieldset ancestor |

Events: `input` (native, composed) and `change` (re-dispatched composed from the host), once per toggle. Form API from the mixin: `form`, `validity`, `validationMessage`, `willValidate`, `checkValidity()`, `reportValidity()`, `click()`.

## 4. Variant matrix
| Dimension | Values |
| --- | --- |
| `size` | `default`, `sm` |

States (checked, focus-visible, invalid, disabled) apply to both sizes.

## 5. Roles and color
Off: track and border `input`, thumb `background`. On: track and border `primary`, thumb `primary-foreground`. Label `foreground`; description `muted-foreground`; error text and invalid track border `destructive`; focus ring `ring`. The thumb position shows the state as well as the fill (WCAG 1.4.1). Every pair is declared in `accessibility.contrast` and checked in both modes (T6).

## 6. States
- **checked**: track filled with `primary`, thumb at the inline end (start in RTL), moved with a `motion.duration.fast` transition (none under `prefers-reduced-motion`).
- **focus-visible**: 3px solid ring in `ring` around the track, border in `ring`.
- **invalid**: `error` set, or `required` and off after blur or a submit attempt: track border `destructive`, error text shown.
- **disabled**: `:host(:disabled)` (attribute or disabled fieldset): opacity 0.5 on the control and label, not-allowed cursor, not focusable, not submitted.

## 7. Dimensions and layout
| Size | Track | Thumb | Thumb travel |
| --- | --- | --- | --- |
| `default` | 32 x 20px (`size.switch.width` / `height`) | 16px (`size.icon.default`) | 12px |
| `sm` | 24 x 16px (`size.switch.width-sm` / `height-sm`) | 12px (`size.icon.sm`) | 8px |

Track: pill radius, 1px border, shadow-xs; the thumb sits 1px inside the border. The `control` hit area is at least 24px high (`size.control.xs`) and as wide as the track, with the track centered in it and aligned to the label's first line. 12px gap to the label column; 6px between label, description and error. Logical properties throughout, so the layout and the thumb direction mirror under `:dir(rtl)`.

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5. Both sizes use the same text.

## 9. Accessibility
- Native `<input type="checkbox" role="switch">` with a native `<label for>` in one shadow root (WAI-ARIA APG switch pattern). The role exposes on/off; aria-checked is never mixed.
- Keyboard: Tab focuses, Space toggles. Enter submits the owning form via `form.requestSubmit()` (SB-0009) and does not toggle, the same as Checkbox.
- The label names the setting and never changes with the state; the role announces on/off.
- Description and error through `aria-describedby`; `aria-invalid` when invalid; the error is a persistent polite live region; `error` sets a customError so the form blocks submission.
- Form association (rule form-associated-controls): `NativeControl(FormAssociated(LitElement))`, as Checkbox. `formValue()` is `value` while on, `null` while off. `formReset()` restores the `checked` attribute. `formStateRestore()` restores checked. `validationAnchor()` is the inner input (native `valueMissing` message, `reportValidity()` focuses it). Inner input rendered with `?disabled=${this.isDisabled}`. `<label for>` outside the shadow root clicks the host and is forwarded. `syncFormState()` runs synchronously in the change handler.
- Hit area at least 24x24px at both sizes, even with `hide-label` (WCAG 2.5.8). Off track at 3:1 and a solid focus ring (WCAG 1.4.11).
- Dev-only console warning, once, when `label` is empty.

## 10. Usage
### Behavior
`input` and `change` on each toggle, composed. Value submitted only while on. Reset restores the authored `checked` attribute.
### Composition
Standalone, or several in a settings list inside a form or Field set. Pair with a submit button when the setting is saved with the form; in an instant-apply list, react to `change`.
### Choosing the props
`size="sm"` for dense lists and tables. `description` when the effect needs explaining. `required` only when the form cannot proceed with the setting off (e.g. an acknowledgement); prefer Checkbox for consent text.
### Do / Don't
- Do label the setting ("Wi-Fi"), not the state.
- Don't change the label to "On"/"Off" with the state (APG).
- Don't use a switch for a mixed state; use Checkbox with `indeterminate`.
- Don't use a switch to pick one of several options; use Radio Group.

## Realizations
### Figma
Not started. Expected axes (`sketchbook api figma switch`): Size, State (Rest, Focus), Selected, Validation, Disabled; Label text, Description text, Error text, Required and Description properties; layers `content`, `label-text` and `focus-ring` already registered in `spec/api.json`.
### Web
Not started. Planned files: `src/components/switch/Switch.ts`, `Switch.scss`, `Switch.styles.ts` (generated), `Switch.stories.ts`, `index.ts`; parts `field`, `control`, `input`, `track`, `thumb`, `label`, `required-indicator`, `description`, `error`. Plan: [plan.md](./plan.md).
### Coverage
None yet; the test plan is in [plan.md](./plan.md).
### Known drift
- API shape: the reference composes Label/Field parts around Switch; shadow DOM requires them inside.
- element: native checkbox input with role switch instead of a button with a hidden input.
- focus ring: solid 3px ring instead of a translucent one, below 3:1 (WCAG 1.4.11).
- track size: default track 32x20px instead of 32x18.4px (system `size.switch.*` tokens).
- hit area: control at least 24px high; the reference's target is only the track (WCAG 2.5.8).
- off track color: `input` is neutral-500 (3:1) instead of the reference's neutral-200 (WCAG 1.4.11).
- thumb color in dark mode: off thumb uses `background` in every mode; the reference uses foreground in dark mode.
- checked state: not reflected; the attribute is the reset default.
- invalid look: destructive track border and live error text, which the reference's Switch does not have on its own.

## Open questions
All answered on 2026-11-12 with the recommended option (no approver was available; recorded in SB-0101 so the owner can revisit). Details in `contract.json` `openQuestions`.
- Q0 Drafted with the contract-author workflow: yes (sources from knowledge, not re-fetched).
- Q1 Native element: `<input type="checkbox" role="switch">`.
- Q2 Enter: submits the form, does not toggle.
- Q3 `checked` reflected: no; the attribute is the reset default.
- Q4 Sizes: `default` (default) and `sm`.
- Q5 Label: required, after the switch; `hide-label` available.
- Q6 Target size: 24px-minimum hit area.
- Q7 `required`: must be on.
- Q8 readonly / loading: out of scope.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first (rule test-first). Extend `NativeControl(FormAssociated(LitElement))` per the form-associated-controls rule; implement only `formValue`, `formReset`, `formStateRestore`, `validationAnchor`.
