---
component: Switch
status: draft
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-12
source: shadcn/ui Switch (look, sizes and API), WAI-ARIA APG switch pattern (role and keyboard), contract-first standard (contract and build process)
---

# Switch

> A switch for an on/off setting, with its label, description and error laid out beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Turn a single setting on or off, such as "Email notifications". The label names the setting and never changes with the state. Not for choosing several options or agreeing to terms (Checkbox), nor for a pressed toolbar button (Toggle).

## 2. Anatomy
`field` (grid) holds `control` (the pill track), with the native `<input type="checkbox" role="switch">` laid transparently over it and the `thumb` circle inside, then `label` (+ `required-indicator`), `description` (optional) and `error` (live region).

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the label |
| `error` | text | — | marks the field invalid (customError) |
| `size` | `default` \| `sm` | default | track 32x20 / 24x16px |
| `name` | text | — | form field name |
| `value` | text | on | submitted while on |
| `checked` | boolean | false | on state; the attribute is the reset default |
| `required` | boolean | false | must be on; aria-hidden asterisk |
| `disabled` | boolean | false | native; also from a disabled fieldset |

## 4. Variant matrix
`size` (default, sm) x `checked` (false, true). States below.

## 5. Roles and color
Track off `input`, on `primary`; thumb off `background`, on `primary-foreground`; label `foreground`; description `muted-foreground`; error text and invalid track border `destructive`; focus ring `ring`.

## 6. States
focus-visible (3px solid ring around the track), checked (track filled, thumb at the inline end), invalid (destructive track border, error text), disabled (opacity 0.5, not-allowed cursor; `:host(:disabled)` so a disabled fieldset dims it too). No hover change.

## 7. Dimensions and layout
| Size | Track | Thumb | Inset |
| --- | --- | --- | --- |
| default | 32x20px | 16px | 2px |
| sm | 24x16px | 12px | 2px |

Track and thumb fully rounded, 1px border (transparent unless invalid), shadow-xs. The thumb slides by `width - thumb - 2 * inset` toward the inline end, so it mirrors in RTL; 150ms standard easing, instant under `prefers-reduced-motion: reduce`. 12px gap to the label; 6px between label and description. The switch aligns with the label's first line.

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5. The same for both sizes.

## 9. Accessibility
- Native `<input type="checkbox" role="switch">` with a native `<label for>` in one shadow root: role switch, `aria-checked` true/false from the native state, never mixed. Space toggles; clicking the track or the label toggles.
- Enter submits the form (implicit submission, SB-0009) and does not toggle.
- Description and error through `aria-describedby`; `aria-invalid` when invalid; the error is a persistent polite live region.
- Off track in `input` (3:1) and a solid focus ring: deviations from the visual reference for WCAG 1.4.11. The thumb meets 3:1 against its track in both states and modes.
- The 32x20px track relies on the label row and the 12px gap for WCAG 2.5.8; `sm` (24x16px) too.
- The state is not conveyed by color alone: the thumb position changes with it (WCAG 1.4.1).

### Form association
Extends `FormAssociated(NativeControl(LitElement))`, like Checkbox.
- `formValue()`: `value` while on, `null` while off (nothing submitted).
- `formReset()`: `checked` back to the `checked` attribute.
- `formStateRestore(state)`: on when the restored state equals `value`.
- `validationAnchor()`: the inner input. `required` and off gives `valueMissing`; `error` gives `customError`; `reportValidity()` focuses the switch and shows the browser message.
- Disabled (its own attribute or a `<fieldset disabled>` ancestor) is not submitted and not validated; the inner input uses `isDisabled`, and the author's `disabled` attribute is never rewritten.
- `<label for="id">` outside the component clicks the host, which forwards to the inner input. It activates the switch but does not name it; `label` does.
- `syncFormState()` runs in the change handler, so a `change` listener reading `FormData` sees the new value.

## 10. Usage
### Behavior
`input` and `change` on each toggle, composed. The value is submitted only while on.
### Composition
One per setting; a list of settings stacks them in a Field group.
### Choosing the props
`sm` for dense settings lists. `required` only when the form cannot be sent with the setting off (rare; say why in `description`).
### Do / Don't
- Do keep the label constant; the role carries on/off.
- Don't use a switch to pick several options or accept terms; use Checkbox.
- Don't use a switch for a toolbar state; use Toggle.

## Realizations
### Figma
Not started. Axes Size, Selected, Validation and Disabled; Label text, Description text, Error text and the Required and Description switches (layers registered in `spec/api.json`).
### Web
Not started. `src/components/switch/Switch.ts`; parts `field`, `control`, `input`, `thumb`, `label`, `required-indicator`, `description`, `error`.
### Coverage
None yet; the test plan is in [plan.md](./plan.md).
### Known drift
- API shape: shadcn composes Field parts around Switch; shadow DOM requires them inside
- unchecked track color: shadcn uses bg-input (neutral-200), below 3:1 (WCAG 1.4.11)
- focus ring: shadcn uses ring/50, below 3:1 (WCAG 1.4.11)
- track height: shadcn's 18.4px default track is 20px here (size.switch.height)
- dark unchecked thumb: shadcn uses foreground; here background in both modes
- checked state: not reflected: the attribute is the default restored by form reset

## Open questions
None open. Answered (recommended option chosen, 2026-11-12, no approver available):
- Q1 native checkbox input with `role="switch"`, not a button.
- Q2 Enter submits, does not toggle.
- Q3 `checked` not reflected.
- Q4 `label` required.
- Q5 off submits nothing.
- Q6 sizes `default` and `sm` only.
- Q7 no thumb animation under reduced motion.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first (rule test-first). Use `FormAssociated` + `NativeControl` (rule form-associated-controls).
