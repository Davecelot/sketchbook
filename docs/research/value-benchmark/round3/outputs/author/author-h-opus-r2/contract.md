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
Turns one setting on or off (notifications, dark mode, auto-save). It is a form field: its value is submitted, reset and validated with the form like any native control. Not for recording a choice among items or an agreement (Checkbox), for a partial state (Checkbox with indeterminate), or for picking one of several (Radio Group).

## 2. Anatomy
`field` (grid) holds `control` (the pill track, with the native input covering it and the round `thumb` on top), `label` (+ `required-indicator`), `description` (optional) and `error` (live region).

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name; never changes with the state |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the label |
| `error` | text | — | marks the field invalid and blocks submission |
| `name` | text | — | form field name |
| `value` | text | on | submitted while on; nothing while off |
| `checked` | boolean | false | on/off; the attribute is the reset default |
| `required` | boolean | false | must be on to submit |
| `disabled` | boolean | false | not focusable, not submitted |
| `size` | `default` \| `sm` | default | track size |

`PROPOSAL` (taken): `checked` is not reflected, so the attribute stays the default a form reset returns to (the alternative, reflecting it, would lose that default).

## 4. Variant matrix
One dimension: `size` (`default`, `sm`). The label row keeps its text size in both. States below.

## 5. Roles and color
Off track and border `input`; on track and border `primary`; thumb `background` when off, `primary-foreground` when on; label `foreground`; description `muted-foreground`; error text and invalid border `destructive`; focus ring `ring`. The off track is held at 3:1 against the page because it is the only boundary of the control (WCAG 1.4.11). The thumb position, not color alone, tells on from off (WCAG 1.4.1).

## 6. States
- **off / on** (`checked`): the thumb sits at the inline start when off and slides to the inline end when on (mirrored in right-to-left); the track fills with `primary` when on.
- **hover**: no change of look; pointer cursor.
- **focus-visible**: 3px solid ring around the track, on keyboard focus only.
- **invalid**: `error` set, or `required` and off after the person leaves the field or tries to submit; the track border turns `destructive` and the error text shows.
- **disabled**: `disabled`, or inside a disabled fieldset; opacity 0.5, not-allowed cursor, cannot be toggled, not submitted. Re-enabling the fieldset restores it.

## 7. Dimensions and layout
| Size | Track | Thumb | Travel |
| --- | --- | --- | --- |
| default | 32 × 20px | 16px | 12px |
| sm | 24 × 16px | 12px | 8px |

Thumb diameter = track height − 2 × inset (2px); the 1px border sits inside the inset. Track radius pill, shadow-xs. 12px gap to the label; 6px between label and description. The track is centered on the label's first line.

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5.

## 9. Accessibility
- Role `switch`, exposed as on/off. `PROPOSAL` (taken): a native checkbox with the switch role, rather than a button with `aria-checked`, so validity, Space and label activation are native.
- Name from `label`; it does not change with the state (APG). Description and error are in the accessible description; `aria-invalid` when invalid; the error is announced once when it appears.
- Keyboard: Tab moves focus; Space toggles. `PROPOSAL` (taken): Enter submits the form, as native controls and Checkbox do (SB-0009), instead of toggling (the APG lists Enter as optional).
- `required` is native; its asterisk is hidden from assistive technology. `error` blocks form submission.
- Focus ring is 3px solid `ring`, at 3:1 (deviation from the visual reference, WCAG 1.4.11).
- Target size: the track is 20px (16px small) high; the label is part of the clickable row and the 12px gap meets the WCAG 2.5.8 spacing exception.
- Motion: the thumb slide is removed when the person asks for reduced motion.
- A dev-only warning fires once when `label` is empty.

## 10. Usage
### Behavior
Toggling fires `input` and `change`, both crossing the component boundary; a `change` listener reading the form data already sees the new value. The setting's effect is up to the page: apply it at once for a stand-alone setting, or on submit inside a form. While on, `name=value` is submitted; while off, nothing. A form reset returns it to its initial state; a disabled fieldset disables it.
### Composition
One switch per setting. A list of settings stacks switches in a Field group, each with its own label and, where needed, a description. A form that must not be sent without a setting on uses `required` and an error message.
### Choosing the props
- `size="default"` in forms and settings pages; `size="sm"` in dense rows (tables, compact panels, toolbars).
- `description` when the consequence of turning it on is not obvious from the label.
- `required` only when the form cannot be sent with the setting off; the label must state what is being turned on.
- `error` for a server-side or cross-field message; required-but-off is reported natively.
- `hide-label` only when other visible text already names the setting.
### Do / Don't
- Don't change the label with the state ("On"/"Off"): the role already announces it; use a fixed label naming the setting.
- Don't use a switch for a partial or mixed state: it has only on and off; use Checkbox with `indeterminate`.
- Don't use a switch to pick items from a list or to agree to terms: those record a choice; use Checkbox.
- Don't use a switch to choose one option of several; use Radio Group.

## Realizations
### Figma
Not realized yet.
### Web
Not started. Planned: `FormAssociated(NativeControl(LitElement))` with a native `<input type="checkbox" role="switch">` and `<label for>` in one shadow root; parts `field`, `control`, `input`, `thumb`, `label`, `required-indicator`, `description`, `error`; `size` reflected for `:host([size="sm"])`; dimmed with `:host(:disabled)`. See [plan.md](./plan.md).
### Coverage
None yet (test plan in [plan.md](./plan.md)).
### Known drift
- API shape: shadcn composes Label and Field parts around Switch; shadow DOM requires them inside.
- element: shadcn (Radix) uses a button with role=switch; this uses a native checkbox with role=switch.
- Enter key: a button-based switch toggles on Enter; here Enter submits, like Checkbox.
- unchecked track color: shadcn's input color is below 3:1; `color.input` is held at 3:1 (WCAG 1.4.11).
- focus ring: shadcn uses ring/50, below 3:1 (WCAG 1.4.11).
- sizes: shadcn's default track is 32 × 18.4px with a 16px thumb; rounded to the 4px grid (32 × 20).

## Open questions
None open. Q0–Q8 were answered with their recommended option on 2026-11-12, with no reviewer available (see contract.json `openQuestions` and SB-0101).

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first. Use `FormAssociated` + `NativeControl` (rule form-associated-controls).
