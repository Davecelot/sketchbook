---
component: Switch
status: draft
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-12
source: visual reference Switch (look, sizes default and sm), WAI-ARIA APG switch pattern (keyboard and ARIA), Checkbox contract (field and form API), contract-first standard (contract and build process)
---

# Switch

> An on/off switch for one setting, with its label, description and error laid out beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Turns one setting on or off, such as "Email notifications" or "Airplane mode". It is a form field: its state is submitted with the form, reset with it, disabled by a disabled fieldset and validated with `required`.

Not for: agreeing to terms or picking several options from a list (Checkbox: a choice to record, not a setting); picking exactly one of several options (Radio Group); a pressed formatting button such as bold that submits nothing (Toggle).

## 2. Anatomy
`field` (grid) holds `control` (the switch) in the first column and `label` (+ `required-indicator`), `description` (optional) and `error` (live region) in the second. `control` holds the focusable `input` (the on/off control with the switch role) and the decorative `track`, which holds the `thumb`.

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name; names the setting, never the state |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the label |
| `error` | text | — | marks the field invalid and blocks submission |
| `size` | `default` \| `sm` | `default` | track 32x20 or 24x16 |
| `name` | text | — | form field name |
| `value` | text | `on` | submitted while on |
| `checked` | boolean | false | current state; the attribute is the reset default |
| `required` | boolean | false | must be on to submit |
| `disabled` | boolean | false | not focusable, not submitted |

Events: `input` and `change` once per toggle by the person (never when `checked` is set from code); both cross the component boundary. Read the new state from `checked`.

`PROPOSAL`: names follow the sibling Checkbox (`checked`, `error`, `size` default/sm), registered as aliases of the canonical `selected`, `errorMessage` and `size` small/medium; the canonical spelling now was discarded so the two controls don't diverge before they migrate together (Q4).

## 4. Variant matrix
One dimension: `size` (`default`, `sm`). Each size is drawn off and on (`checked`), and in the states below.

## 5. Roles and color
Track off: `input` (3:1 against the page); track on: `primary`. Thumb off: `background`; thumb on: `primary-foreground` (3:1 against `primary`). Label `foreground`; description `muted-foreground`; error text and invalid track border `destructive`; focus ring `ring`. The state is never shown by color alone: the thumb moves from the start edge (off) to the end edge (on).

## 6. States
- **off / on** (`checked`): track fill and thumb position change together; the thumb slides in 150ms with the standard easing, and without motion when the person asks for reduced motion.
- **hover**: pointer cursor over the switch and its label; no color change.
- **focus-visible**: keyboard focus only; 3px solid ring around the track.
- **invalid**: `error` set, or `required` and off after the person leaves it or tries to submit; destructive track border and the error text.
- **disabled**: `disabled`, or inside a disabled fieldset; switch and label at 50% opacity, not-allowed cursor, not focusable, cannot be toggled, not submitted.

## 7. Dimensions and layout
| Size | Track | Thumb | Inset |
| --- | --- | --- | --- |
| `default` | 32x20 | 16 | 2 |
| `sm` | 24x16 | 12 | 2 |

Track fully rounded with a 1px transparent border (destructive when invalid) and shadow-xs. 12px gap between switch and label column; 6px between label and description/error. The switch aligns with the label's first line. In right-to-left the switch stays first (on the right) and the thumb moves right-to-left when turned on.

`PROPOSAL`: track heights 20/16px come from the existing `size.switch` tokens instead of the visual reference's 18.4/14px, so the 16/12px thumb sits on the 2px inset without fractional pixels (Q6).

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5. Size does not change the text.

## 9. Accessibility
- Role `switch` (APG switch pattern) on a native checkbox control, so the on/off state, Space, `required` validity and label activation are native. `PROPOSAL`: native input with the switch role, discarding a button with `aria-checked` that would re-implement all of that (Q1).
- Keyboard: Tab / Shift+Tab move focus; **Space** toggles; **Enter** submits the owning form like any native form control and does not toggle (APG lists Enter as optional). `PROPOSAL` (Q2).
- Name: the `label` (same root as the control, so clicking it toggles). The label names the setting and never changes with the state; the role announces on/off. Host `aria-label` is forwarded; `aria-labelledby`/`aria-describedby` are not, because ID references do not cross the shadow boundary (SB-0009). A dev-only warning fires once when there is no name.
- Description and error are the control's accessible description; `aria-invalid` when invalid; the error is a persistent polite live region, announced once when it appears.
- `required`: native required, so an off switch makes the form invalid with the browser's message and `reportValidity()` focuses it; the asterisk is hidden from assistive technology.
- Contrast: off track 3:1 and on track 3:1 against the page, on thumb 3:1 against the on track, 3px solid focus ring (deviation from the visual reference's translucent ring and light input color, WCAG 1.4.11).
- Target size: the label row is part of the target, and the 12px gap meets the WCAG 2.5.8 spacing exception; avoid `sm` with `hide-label`.
- Motion: the thumb slide is skipped under reduced-motion preferences.

### Form participation
- Submits `name=value` only while on; nothing while off, without a `name`, or while disabled.
- `form.reset()` restores the default state (the `checked` attribute) and clears the user-invalid look.
- A disabled fieldset ancestor disables it without changing its own `disabled` attribute; re-enabling the fieldset restores it.
- `required` and off → `valueMissing`; `error` set → `customError`; both block submission and match `:invalid`.
- Browser form-state restore (back/forward navigation, autofill) restores on/off.
- A `<label for>` pointing at the switch toggles it, but does not name it; keep `label`.

## 10. Usage
### Behavior
A switch is a setting, not a question: its label says what is on when it is on ("Email notifications"), never "On"/"Off" or "Turn on…". It fires `input` and `change` on each toggle by the person, and `change` listeners already see the new value in the form's data. It submits its value only while on, so a server reads "missing" as off.

Inside a form, the toggle takes effect when the form is saved. Outside one, an app may apply it at once on `change`; then show the result (or an error) without moving focus.

### Composition
- One switch per setting. A list of settings is a stack of switches, each with its own label and, where needed, description; group them under a heading or a fieldset legend that names the group.
- For a settings row with the label at the start and the switch at the end, lay it out with Item or Field around a `hide-label` switch whose visible row text names it, or keep the default layout. There is no label-position prop (`PROPOSAL`, Q5).
- In a table row or toolbar, use `size="sm"` with a visible label where space allows.

### Choosing the props
- **`size`**: `default` in forms and settings pages; `sm` in dense lists, tables and toolbars, never as the only target without a visible label.
- **`description`**: when the consequence of turning it on is not obvious from the label (cost, who sees it, what else changes).
- **`required`**: only when the form cannot be submitted with the setting off; state what is enabled in the label. Agreements ("I accept the terms") are a Checkbox.
- **`error`**: for a reason from outside the control (the server refused the setting); clear it when the person changes the value.
- **`checked`** attribute: the initial and reset state; set the property to change the current state from code (no events fire).
- **`hide-label`**: only when other visible text in the same row names the setting.

### Do / Don't
- Don't change the label with the state ("On"/"Off"): the role already announces it and a changing label reads as a second state. Use a fixed label naming the setting.
- Don't use a switch to agree to terms or to select among options: it reads as a setting. Use Checkbox.
- Don't use several switches for mutually exclusive options: nothing turns the others off. Use Radio Group.
- Don't use Toggle (a pressed button) for a setting saved with a form: it submits nothing. Use Switch.

## Realizations
### Figma
Not realized yet.
### Web
Not started. Planned: a Lit element extending `NativeControl(FormAssociated(LitElement))`, rendering `<input type="checkbox" role="switch">` in the shadow root with parts `field`, `control`, `input`, `track`, `thumb`, `label`, `required-indicator`, `description`, `error`; `size` reflected and styled with `:host([size="sm"])`; disabled styled with `:host(:disabled)`; reduced motion through `prefers-reduced-motion`. See [plan.md](./plan.md).
### Coverage
None yet; the planned tests are in [plan.md](./plan.md).
### Known drift
- API shape: the visual reference composes Field and Label parts around Switch; shadow DOM requires them inside.
- focus ring: the visual reference uses ring/50, below 3:1 (WCAG 1.4.11).
- unchecked track: the visual reference's input color is below 3:1 (WCAG 1.4.11).
- track height: 20/16px instead of 18.4/14px, on the spacing grid.
- invalid state: the visual reference has no built-in error.
- checked state: not reflected; the attribute is the default restored by form reset.

## Open questions
- Q7: a manual screen-reader pass (VoiceOver, NVDA) of the on/off announcement and the error live region is needed before `stable`.

Q0–Q6 were answered with the recommendation (no reviewer available, 2026-11-12) and are listed in contract.json and plan.md so the owner can revisit them.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first (rule test-first). Use `FormAssociated` + `NativeControl` (rule form-associated-controls).
