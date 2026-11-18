---
component: Switch
status: draft
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-12
source: visual reference (look and sizes), WAI-ARIA APG switch pattern (role and keyboard), contract-first standard and the form-associated-controls rule (form behavior)
---

# Switch

> An on/off switch for a single setting, with its label, description and error beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Turns one setting on or off. It takes part in forms like a native checkbox: it submits its `value` while on, resets with its form, is disabled by a disabled `<fieldset>`, and validates `required` (must be on). Not for a partial state (Checkbox with `indeterminate`), for picking one of several options (Radio Group), or for a pressed tool button (Toggle).

## 2. Anatomy
`field` (grid) holds `track` (the pill holding the native `<input type="checkbox" role="switch">`, transparent and covering the track, and the decorative `thumb`), `label` (+ `required-indicator`), `description` (optional) and `error` (live region).

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name; names the setting and never changes with the state |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the label |
| `error` | text | — | marks the field invalid (customError) |
| `size` | `default` \| `sm` | default | track 32x20 / 24x16; reflected |
| `name` | text | — | form field name |
| `value` | text | on | submitted while on |
| `checked` | boolean | false | on/off; the attribute is the reset default (not reflected) |
| `required` | boolean | false | native; must be on; aria-hidden asterisk |
| `disabled` | boolean | false | native; not focusable, not submitted |

Events: `input` (native, composed) and `change` (re-dispatched composed from the host), once per user toggle; not fired for script changes or form reset.

## 4. Variant matrix
One dimension: `size` = `default`, `sm`. No excluded combinations. States below combine with both sizes.

## 5. Roles and color
Track off `input` (3:1 on the background), on `primary`; thumb `background` in both states and every mode; label `foreground`; description `muted-foreground`; error text and invalid track border `destructive`; focus ring `ring`.

## 6. States
hover (no change), focus-visible (3px solid ring around the track), checked (track `primary`, thumb at the end), invalid (track border and error text in `destructive`), disabled (opacity 0.5, not-allowed cursor; `:host(:disabled)` so a disabled fieldset dims it too).

## 7. Dimensions and layout
| Size | Track | Thumb | Inset |
| --- | --- | --- | --- |
| default | 32 x 20 | 16 | 2 |
| sm | 24 x 16 | 12 | 2 |

Track and thumb fully rounded; track shadow-xs; 1px border, transparent unless invalid (visible in forced-colors mode). Thumb travels `width - thumb - 2 * inset`, mirrored under `:dir(rtl)`; a 150ms transform transition, none under `prefers-reduced-motion`. 12px gap to the label; 6px between label, description and error. The track is centered on the label's first line.

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5. Size does not change the text.

## 9. Accessibility
- Native `<input type="checkbox" role="switch">` with a native `<label for>` in one shadow root. The browser exposes `aria-checked` true/false; never mixed.
- Keyboard: Tab moves focus; Space toggles; Enter submits the form via `form.requestSubmit()` and does not toggle (SB-0009).
- Description and error through `aria-describedby`; `aria-invalid` when invalid; the error is a persistent polite live region, announced once.
- State shown by thumb position as well as track color (WCAG 1.4.1). Track at 3:1, thumb at 3:1 on both track colors, solid focus ring (deviation from the visual reference, WCAG 1.4.11).
- Track 32x20 (sm 24x16) relies on the label row and the 12px gap for WCAG 2.5.8.
- Dev-only warning, once, when `label` is empty. Only `aria-label` is forwarded from the host.

### Form association
Built on `FormAssociated` + `NativeControl` (rule form-associated-controls):
- `formValue()`: `value` while on, `null` while off.
- `formReset()`: `checked` back to the `checked` attribute.
- `formStateRestore(state)`: restores `checked`.
- `validationAnchor()`: the inner input (`required` -> `valueMissing`; `error` -> `customError`), so `reportValidity()` focuses it and the browser supplies the message.
- `?disabled=${this.isDisabled}` on the input, so `<fieldset disabled>` disables it without touching the author's attribute; re-enabling the fieldset restores it.
- `<label for="the-switch-id">` outside the component toggles it (click forwarded from the host).
- `syncFormState()` runs in the input handler, so a `change` listener reading `FormData` sees the new value.

## 10. Usage
### Behavior
`input` and `change` on each user toggle, composed. Value submitted only while on. Form reset restores the default; a disabled fieldset disables it.
### Composition
One per setting; a list of settings goes in a Field set (later). Label names the setting ("Email notifications"), not the state.
### Choosing the props
`sm` in dense lists and table rows; `default` elsewhere. `required` only for consent-like settings that must be on. `description` for the consequence of turning it on.
### Do / Don't
- Don't change the label with the state; the role announces on/off.
- Don't use a switch for a mixed state; use Checkbox.
- Don't use a switch to pick one of several options; use Radio Group.

## Realizations
### Figma
Not started. Expected axes (`sketchbook api figma switch`): Size, State (Rest, Focus), Selected, Validation, Disabled; Label, Description and Error text; Required and Description switches.
### Web
Not started. Planned files: `src/components/switch/Switch.ts`, `Switch.scss`, `Switch.styles.ts` (generated), `Switch.stories.ts`, `index.ts`; parts `field`, `track`, `input`, `thumb`, `label`, `required-indicator`, `description`, `error`.
### Coverage
None yet (planned in [plan.md](./plan.md)).
### Known drift
- API shape: the reference composes Field and Label around Switch; shadow DOM requires them inside.
- Track size: 32x20 / 24x16 from the project's size tokens; the reference is 32x18.4 / 24x14.
- Unchecked track color: neutral-500 for 3:1 (WCAG 1.4.11); the reference is neutral-200.
- Focus ring: 3px solid; the reference's translucent ring is below 3:1.
- Thumb color in dark mode: `background` in every mode; the reference uses foreground/primary-foreground in dark.
- Checked state: not reflected; the attribute is the reset default.

## Open questions
All answered on 2026-11-12 with the recommendation (no approver was available in the session; recorded so the owner can revisit). Details in contract.json `openQuestions`.
- Q0 Sources: APG switch pattern, the visual reference, the form-associated-controls rule.
- Q1 Element: `<input type="checkbox" role="switch">`.
- Q2 Enter: submits the form, does not toggle.
- Q3 `checked`: not reflected.
- Q4 `required`: must be on.
- Q5 Sizes: `default` and `sm`.
- Q6 Label after the switch, no position option.
- Q7 `label` required, with `hide-label`.
- Q8 Thumb `color.background` in every mode.
- Q9 Thumb animates, none under reduced motion.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first (rule test-first). Use `FormAssociated` + `NativeControl`.
