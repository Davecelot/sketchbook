---
component: Switch
status: draft
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-12
source: visual reference (look and sizes), WAI-ARIA APG switch pattern, contract-first standard (contract and build process), form-associated-controls rule
---

# Switch

> A toggle for an on/off setting, with its label, description and error beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Turns one setting on or off. Not for a choice confirmed on submit such as agreeing to terms (Checkbox), choosing one of several (Radio Group), or a pressed toolbar button (Toggle).

## 2. Anatomy
`field` (grid) holds `control` (the pill track with the native `<input type="checkbox" role="switch">` over it and the `thumb`), `label` (+ `required-indicator`), `description` (optional) and `error` (live region). The control comes first, the label after it.

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name |
| `description` | text | — | help text under the label |
| `error` | text | — | marks the field invalid (customError) |
| `size` | `default` \| `sm` | `default` | track and thumb size; reflected |
| `name` | text | — | form field name |
| `value` | text | on | submitted while on |
| `checked` | boolean | false | on/off; the attribute is the reset default |
| `required` | boolean | false | must be on to submit |
| `disabled` | boolean | false | native; also from `<fieldset disabled>` |

Events: `input` (native, composed) and `change` (re-dispatched composed) on each toggle.

## 4. Variant matrix
`size`: `default`, `sm`. States below apply to both.

## 5. Roles and color
Off track `input`, on track `primary`; thumb `background` off, `primary-foreground` on; label `foreground`; description `muted-foreground`; error and invalid border `destructive`; focus ring `ring`.

## 6. States
focus-visible (3px ring around the track), checked (thumb at the end, filled track), invalid (track border in `destructive`, error text shown), disabled (opacity 0.5, not-allowed cursor; styled with `:host(:disabled)` so a disabled fieldset dims it too). Hover has no visual change.

## 7. Dimensions and layout
| Size | Track | Thumb |
| --- | --- | --- |
| `default` | 32 × 20px | 16px |
| `sm` | 24 × 16px | 12px |

Pill radius, 1px border in the track color (destructive when invalid), shadow-xs. The thumb sits 2px from the track's outer edge, at the start when off and at the end when on; it mirrors under `:dir(rtl)`. The slide uses the fast standard transition and is off under `prefers-reduced-motion`. 12px gap to the label column; 6px between label, description and error.

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5. Same in both sizes.

## 9. Accessibility
- Native `<input type="checkbox" role="switch">` with a native `<label for>` in one shadow root: role switch, on/off exposed as `aria-checked` by the browser, Space toggles. No mixed state.
- Enter submits the form (implicit submission): the inner control has no form owner in its shadow root, so the component calls `form.requestSubmit()` (SB-0009). Enter does not toggle (SB-0101).
- Description and error through `aria-describedby`; `aria-invalid` when invalid; the error is a persistent polite live region.
- State is shown by thumb position as well as color (WCAG 1.4.1). Off track at 3:1 and a solid focus ring (deviation from the visual reference, WCAG 1.4.11). The `sm` track relies on the label row and the 12px gap for WCAG 2.5.8.

### Form association
Built on `FormAssociated` + `NativeControl` (rule form-associated-controls):
- submits `value` while on, nothing while off; never while disabled;
- `form.reset()` restores the `checked` attribute; form state restore turns it on when the saved state is the value;
- `<fieldset disabled>` disables it without touching its `disabled` attribute, and re-enabling the fieldset restores it;
- `required` mirrors the inner input's `valueMissing` (and its native message); `reportValidity()` focuses the input; `error` adds a `customError`;
- `<label for="…">` pointing at the host toggles it;
- the form value is synced in the change handler, so a `change` listener reading `FormData` sees the new value.

## 10. Usage
### Behavior
The setting takes effect when toggled, or with the rest of the form when it is submitted; either way the switch submits `value` only while on.
### Composition
One per setting. A list of settings goes in a Field group (later); a row with the switch at the end is a layout there, not a prop.
### Choosing the props
`sm` for dense settings lists. `description` for the consequence of turning it on. `required` only when the form cannot be sent with the setting off.
### Do / Don't
- Don't use a switch for an agreement confirmed on submit; use Checkbox.
- Don't change the label with the state ("On"/"Off"); the label names the setting.
- Don't use several switches to pick one option; use Radio Group.

## Realizations
### Figma
Not started. Axes Size, State (Rest, Focus), Selected, Validation and Disabled; Label text, Description text, Error text and the Required and Description switches (`spec/api.json` layers `switch.content`, `switch.label-text`, `switch.focus-ring`).
### Web
Not started. `src/components/switch/Switch.ts`; parts `field`, `control`, `input`, `thumb`, `label`, `required-indicator`, `description`, `error`. Behavior spec `playwright/tests/switch/switch.behavior.spec.ts`.
### Known drift
- API shape: the reference composes Field parts around Switch; shadow DOM requires them inside
- unchecked track: the reference's light input fill is under 3:1; `color.input` is used (WCAG 1.4.11)
- focus ring: the reference uses ring/50, below 3:1 (WCAG 1.4.11)
- track size: the reference is 32 × 18.4 / 24 × 14 with a 1px transparent border; here 32 × 20 / 24 × 16 from `size.switch.*`
- dark-mode thumb: the reference uses the foreground color for the off thumb; here `background` in both modes
- checked state: not reflected; the attribute is the default restored by form reset

## Open questions
None open. Answered with the recommendation (no approver in the session; SB-0011, SB-0101), see `openQuestions` in contract.json:
- Q1 native checkbox with `role="switch"`, not a button;
- Q2 Enter submits, does not toggle;
- Q3 sizes `default` and `sm`, no `lg`;
- Q4 `checked` not reflected;
- Q5 label after the control;
- Q6 no `hide-label` in this version.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first. Use `FormAssociated` + `NativeControl`.
