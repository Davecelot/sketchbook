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

> A switch for an on/off setting, with its label, description and error laid out beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Turns a single setting on or off, usually with an immediate effect (notifications, dark mode, airplane mode). It also takes part in a form like a native checkbox: it submits `value` while on, resets with the form, is disabled by a disabled fieldset and validates `required`. Not for choosing several options or agreeing to terms (Checkbox), choosing one of several (Radio Group) or a pressed toolbar button (Toggle).

## 2. Anatomy
`field` (grid) holds `control` (the pill track with the native `<input type="checkbox" role="switch">` covering it and the `thumb`), `label` (+ `required-indicator`), `description` (optional) and `error` (live region). The thumb is aria-hidden.

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the label |
| `error` | text | — | marks the field invalid (customError) |
| `name` | text | — | form field name |
| `value` | text | on | submitted while on |
| `checked` | boolean | false | on/off; the attribute is the reset default (not reflected) |
| `required` | boolean | false | native; must be on to submit |
| `disabled` | boolean | false | native; dimmed; not submitted |
| `size` | `default` \| `sm` | default | track and thumb size only |

Events: `input` (native, composed) and `change` (re-dispatched composed from the host) once per toggle.

## 4. Variant matrix
`size`: `default`, `sm`. Combined with the states below (off/on, invalid, disabled, focus-visible).

## 5. Roles and color
Off: track `input`, thumb `background`. On: track `primary`, thumb `primary-foreground`. Invalid: track border `destructive`, error text `destructive`. Label `foreground`; description `muted-foreground`; focus ring `ring`. On and off also differ by thumb position, so the state never rests on color alone.

## 6. States
focus-visible (3px solid ring around the track), checked (track fills, thumb slides to the end; mirrored in RTL), invalid (`error` set, or `required` and off after blur or a submit attempt), disabled (`:host(:disabled)`, opacity 0.5, not-allowed cursor; covers a disabled fieldset). Hover changes nothing. The slide and color transition use the fast duration and standard easing and are removed under `prefers-reduced-motion: reduce`.

## 7. Dimensions and layout
Derived from the thumb so both sizes stay proportional (no new token):
- track width = 2 × thumb size; track height = thumb size + 2 × track inset; thumb travel = width − thumb − 2 × inset.
- `default`: thumb 16px → track 32 × 18px. `sm`: thumb 12px → track 24 × 14px. Inset 1px.
- Pill radius on track and thumb; shadow-xs on the track. 12px gap to the label; 6px between label, description and error. The track aligns with the label's first line.

## 8. Typography
Label 14px, weight 500, control line-height; description and error 14px, body line-height. `size` does not change the text.

## 9. Accessibility
- Native `<input type="checkbox" role="switch">` with a native `<label for>` in the same shadow root: role `switch`, state exposed as `aria-checked` by the platform. The label stays constant (no On/Off text).
- Keyboard: Tab focuses; Space toggles (native); Enter submits the form through `form.requestSubmit()` because the inner input has no form owner (SB-0009). Enter does not toggle (optional in the APG; the native checkbox doesn't).
- Description and error through `aria-describedby`; `aria-invalid="true"` when invalid; the error is a persistent polite live region announced once when it appears; `error` sets a customError validity so the form blocks submission.
- Form association (rule `form-associated-controls`): `FormAssociated(NativeControl(LitElement))`. `formValue()` returns `value` while on, else `null`; `formReset()` restores the `checked` attribute; `formStateRestore()` restores `checked`; `validationAnchor()` is the inner input, so `required` gives `valueMissing` and `reportValidity()` focuses it. The inner input renders `?disabled=${isDisabled}`; `syncFormState()` runs in the input handler so `change` listeners see the new `FormData`; a `<label for>` click on the host is forwarded to the input. `label` stays the accessible name because an outside `<label for>` names the host, not the inner control.
- Contrast: off track 3:1 against the background, thumb 3:1 on both tracks, solid 3px ring (deviations from the visual reference, WCAG 1.4.11). Target size: the label row is clickable and the 12px gap meets the WCAG 2.5.8 spacing exception.
- Dev-only console warning, once, when `label` is empty.

## 10. Usage
### Behavior
Toggling fires `input` then `change`. While off nothing is submitted, so the server reads a missing field as off.
### Composition
Stack switches in a Field group for a settings list; each one is its own field with its own `name`.
### Choosing the props
`size="sm"` for dense settings lists. `description` when the consequence of turning it on needs explaining. `required` only when the setting must be on to continue; for agreements prefer Checkbox.
### Do / Don't
- Do label the setting ("Email notifications"), not the state.
- Don't swap the label between "On" and "Off".
- Don't use a switch for picking several options or accepting terms; use Checkbox.
- Don't use a switch for a toolbar's pressed state; use Toggle.

## Realizations
### Figma
Not started. Planned axes: Size, State (Rest, Focus), Selected, Validation, Disabled; Label text, Description text, Error text and the Required and Description switches (layers `switch.content`, `switch.label-text`, `switch.focus-ring` registered in `spec/api.json`).
### Web
Not started. Planned: `src/components/switch/Switch.ts`; parts `field`, `control`, `input`, `thumb`, `label`, `required-indicator`, `description`, `error`.
### Coverage
None yet (see plan.md for the test plan).
### Known drift
- API shape: shadcn composes Field and Label parts around Switch; shadow DOM requires them inside
- focus ring: shadcn uses ring/50, below 3:1 (WCAG 1.4.11)
- unchecked track: shadcn bg-input is neutral-200, below 3:1 (WCAG 1.4.11)
- unchecked thumb in dark mode: shadcn uses foreground; background keeps 3:1 in both modes
- track height: 18px here, 18.4px (1.15rem) in shadcn
- checked state: not reflected; the attribute is the default restored by form reset

## Open questions
All answered with the recommendation (no reviewer available; SB-0011). Details in contract.json `openQuestions`.
- Q1 Native checkbox with `role="switch"`, not a `<button role="switch">`.
- Q2 Enter submits the form, does not toggle.
- Q3 `checked` not reflected; the attribute is the reset default.
- Q4 `size="sm"` keeps the label text size.
- Q5 `label` required; `hide-label` keeps the name.
- Q6 Track size derived from the thumb; no new semantic token.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first. Use `FormAssociated` + `NativeControl`.
