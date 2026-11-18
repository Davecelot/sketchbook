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

> An on/off switch for a setting, with its label, description and error laid out beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Turns one setting on or off. Not for choosing several options or accepting an agreement (Checkbox), nor for a pressed button such as bold in a toolbar (Toggle).

## 2. Anatomy
`field` (grid) holds `track` (the pill, with the native `<input type="checkbox" role="switch">` stretched over it and the `thumb`), `label` (+ `required-indicator`), `description` (optional) and `error` (live region).

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the label |
| `error` | text | — | marks the field invalid (customError) |
| `name` | text | — | form field name |
| `value` | text | on | submitted while on |
| `checked` | boolean | false | on; the attribute is the reset default |
| `required` | boolean | false | must be on (native valueMissing) |
| `disabled` | boolean | false | native; a disabled fieldset disables it too |
| `size` | `sm` \| `default` | default | track and thumb only |

## 4. Variant matrix
`size`: `sm`, `default`. States below.

## 5. Roles and color
Track off `input`, on `primary`; thumb off `background`, on `primary-foreground`; label `foreground`; description `muted-foreground`; error and invalid ring `destructive`; focus ring `ring`.

## 6. States
focus-visible (3px ring around the track), checked (thumb at the end, track filled), invalid (2px destructive ring, error text; the focus ring wins while focused), disabled (opacity 0.5, not-allowed cursor, styled with `:host(:disabled)` so a disabled fieldset dims it). No hover change.

## 7. Dimensions and layout
| Size | Track | Thumb | Inset |
| --- | --- | --- | --- |
| default | 32x20 | 16 | 2 |
| sm | 24x16 | 12 | 2 |

Pill radius, shadow-xs on the track. The thumb travels the track width minus the thumb and both insets, computed from the tokens; mirrored in RTL. 12px gap to the label; 6px between label and description.

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5. Same in both sizes.

## 9. Accessibility
- Native `<input type="checkbox" role="switch">` with a native `<label for>` in one shadow root (SB-0007). The browser exposes on/off as `aria-checked`. Space toggles.
- Enter submits the form (implicit submission): the inner control has no form owner in its shadow root, so the component calls `form.requestSubmit()` (SB-0009).
- Description and error through `aria-describedby`; `aria-invalid` when invalid; the error is a persistent polite live region.
- On/off is shown by the thumb position as well as the color (WCAG 1.4.1). The off track is `input` (3:1 against the page) and the focus ring is solid (deviations from the visual reference, WCAG 1.4.11).
- The label row and the 12px gap satisfy WCAG 2.5.8 for both sizes. With `hide-label` the author must leave room around an `sm` switch.
- No thumb transition under `prefers-reduced-motion: reduce`.

### Form association
Built on `FormAssociated(NativeControl(LitElement))` (rule form-associated-controls):
- `formValue()`: `value` while on, `null` while off.
- `formReset()`: `checked` back to the `checked` attribute.
- `formStateRestore(state)`: `checked` from the restored state.
- `validationAnchor()`: the inner input. `required` gives `valueMissing` with the browser's message; `reportValidity()` focuses the switch.
- The inner input renders `?disabled=${this.isDisabled}`, so a `<fieldset disabled>` ancestor disables it without changing the author's `disabled` attribute; re-enabling the fieldset restores it.
- `syncFormState()` runs in the change handler, so a `change` listener reading `FormData` sees the new value.
- A `<label for>` that points at the host forwards the click to the inner input (activation only; the `label` prop stays the name).

## 10. Usage
### Behavior
`input` and `change` on each toggle, composed. The value is submitted only while on.
### Composition
One per setting. A list of settings stacks switches; a settings row with the switch at the end waits for a layout component (Q5).
### Choosing the props
`size="sm"` for dense lists. `description` when turning it on has a consequence. `required` only when the form cannot proceed without the setting on.
### Do / Don't
- Name the setting, not the state ("Airplane mode", not "On").
- Don't use a switch for a list of choices or an agreement; use Checkbox.
- Don't use a switch for a pressed button; use Toggle.

## Realizations
### Figma
Not started. Axes from the contract: Size, State (Rest, Focus), Selected, Validation and Disabled; Label text, Description text, Error text and the Required and Description switches.
### Web
Not started. Planned: `src/components/switch/Switch.ts`; parts `field`, `track`, `input`, `thumb`, `label`, `required-indicator`, `description`, `error`. Behavior spec `playwright/tests/switch/switch.behavior.spec.ts`.
### Coverage
None yet (see plan.md test plan).
### Known drift
- API shape: shadcn composes Field parts around Switch; shadow DOM requires them inside
- unchecked track color: shadcn uses bg-input (neutral-200), below 3:1 (WCAG 1.4.11)
- focus ring: shadcn uses ring/50, below 3:1 (WCAG 1.4.11)
- thumb color in dark mode: shadcn uses foreground for the off thumb; one mode-aware alias keeps 3:1 in both modes
- track size: shadcn's default track is 32x18.4; 20px keeps a whole-pixel 2px inset
- checked state: not reflected; the attribute is the default restored by form reset

## Open questions
All answered with the recommendation (SB-0011; no reviewer was available on 2026-11-12). See `openQuestions` in contract.json:
- Q1 native checkbox with role=switch · Q2 Enter submits, Space toggles · Q3 checked not reflected · Q4 label required · Q5 switch first, no placement prop · Q6 required means on; destructive ring · Q7 size changes track and thumb only · Q8 thumb animates, not under reduced motion.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first. Use `FormAssociated` + `NativeControl`.
