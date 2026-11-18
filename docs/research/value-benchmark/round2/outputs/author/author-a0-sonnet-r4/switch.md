# Switch — Specification

Status: Draft v1 · Scope: behavior, API, accessibility, form participation. Implementation is out of scope.

Key words MUST, SHOULD and MAY are used as in RFC 2119.

## 1. Purpose

A Switch toggles a single on/off setting. Unlike a Checkbox it communicates an immediate, binary state ("on"/"off"). It is a form-associated control: it submits a value, resets with its form, is disabled by a disabled ancestor fieldset, and validates `required`.

## 2. Anatomy

- **Control**: the focusable element with `role="switch"`, made of a track and a thumb.
- **Label**: visible text naming the switch (required, see §7).
- **Description** (optional): help text below the label.
- **Error message** (optional): text describing why the value is invalid.

## 3. API

| Prop | Type | Default | Notes |
|---|---|---|---|
| `name` | string | – | Form field name. Without it nothing is submitted. |
| `value` | string | `"on"` | Submitted when on. |
| `checked` | boolean | – | Controlled state. |
| `defaultChecked` | boolean | `false` | Uncontrolled initial state; also the reset state. |
| `onCheckedChange` | `(checked: boolean) => void` | – | Fired on user-initiated change only. |
| `disabled` | boolean | `false` | Own disabled state. |
| `required` | boolean | `false` | Must be on to be valid. |
| `invalid` | boolean | `false` | Externally forced invalid state. |
| `size` | `"sm" \| "md"` | `"md"` | See §9. |
| `label` | content | – | Visible label. |
| `description` | content | – | Help text. |
| `error` | content | – | Error message; shown only while invalid. |
| `form` | string | – | Id of an associated form not being an ancestor. |
| `id` | string | generated | Id of the control. |

Native-compatible pass-through: `autoFocus`, `aria-label`, `aria-labelledby`, `aria-describedby` (merged with, not replacing, internally generated ids).

Controlled vs uncontrolled: if `checked` is provided the component is controlled and never changes its own state; otherwise it is uncontrolled. Switching between modes after mount is unsupported and SHOULD warn in development.

## 4. Behavior

1. Activating the control (click on track, thumb, or label; Space key) toggles the state and fires `onCheckedChange` once with the new value.
2. Enter MUST NOT toggle (matches the ARIA switch pattern and native checkbox behavior). Enter inside a form follows the browser's implicit-submission rules and is not intercepted.
3. When disabled, no interaction toggles it, no event fires, and it is not focusable.
4. Clicking the label toggles and moves focus to the control. Clicking description or error text does not toggle.
5. Controlled: the user action fires `onCheckedChange`, but the displayed state follows `checked`. If the parent does not update it, the state does not change.
6. Programmatic changes (via `checked` prop or form reset) do not fire `onCheckedChange`.

## 5. Form participation

1. **Submission**: when on, and it has a `name` and is not disabled, the entry `name=value` is submitted. When off, nothing is submitted (checkbox semantics).
2. **Reset**: a form `reset` event returns an uncontrolled switch to `defaultChecked`. For a controlled switch the component does not change `checked`; it fires `onCheckedChange(defaultChecked)` if that differs from the current value so the owner can sync. *(Decision D2.)*
3. **Disabled fieldset**: the switch is effectively disabled when its own `disabled` is true OR it is a descendant of a disabled `<fieldset>` (excluding the fieldset's first `<legend>` descendants, per HTML). Effective disabled behaves as §4.3 and is reflected in styling and `aria-disabled`/native `disabled`. Changes to the fieldset's state apply live.
4. **Validation**: if `required` and off, the control is invalid with `valueMissing` validity, blocks form submission via the browser's constraint validation, and reports a validation message. A disabled switch is barred from validation (not validated). An `invalid` prop forces the invalid visual and `aria-invalid` state but does not by itself block native submission unless a custom validity message is set.
5. **Validation messaging**: on a blocked submission the `invalid` event fires, focus moves to the first invalid control (browser default), and the `error` content is shown. If no `error` content is provided, the browser's validation message is used for the native bubble and a default visible message MAY be omitted. *(Decision D4.)*
6. **Form attribute**: `form` associates with a non-ancestor form; submission, reset and validation behave identically.
7. The component MUST expose standard form-control surface where the platform allows: `form`, `name`, `validity`, `validationMessage`, `willValidate`, `checkValidity()`, `reportValidity()`, `setCustomValidity()`.
8. Without JavaScript hydration (server-rendered), the underlying markup SHOULD still submit and reset correctly.

## 6. States

`off`, `on`, each combined with: default, hover, focus-visible, active, disabled, invalid. Required adds no visual state beyond the label indicator (§7.4).

- Focus ring is shown only for keyboard focus (`:focus-visible`) and meets 3:1 contrast against adjacent colors.
- Invalid state: error color on the track border and error message text; not conveyed by color alone (error text plus icon or text prefix).
- Disabled: reduced emphasis, still meets legibility; `cursor: not-allowed` on control and label.
- Reduced motion: thumb transition MUST be disabled under `prefers-reduced-motion: reduce`.
- Forced colors / high contrast: on and off remain distinguishable (thumb position plus system colors, not fill alone).
- RTL: thumb direction mirrors; "on" is at the inline-end.

## 7. Accessibility

1. The control has `role="switch"` and `aria-checked="true|false"` (or a native `<input type="checkbox" role="switch">` whose checked state conveys this; the exposed role and state are what is normative).
2. Accessible name: from the visible `label` (association by `for`/id or wrapping). If no `label` is rendered, the consumer MUST supply `aria-label` or `aria-labelledby`; development builds SHOULD warn when none exists.
3. Description and error text are linked with `aria-describedby`. The error id is included only while the error is displayed. Description comes first, then error.
4. `required` is exposed (`aria-required="true"` or native `required`), and a visual required indicator is shown on the label, with the meaning not conveyed by color alone.
5. Invalid state is exposed with `aria-invalid="true"`. The error message is announced when it appears (e.g. rendered in a `role="alert"` or polite live region), but is not announced on initial render.
6. Disabled is exposed to assistive tech (`disabled` or `aria-disabled="true"`).
7. The state label must not change to say "on"/"off" text on the control itself; the state is announced through `aria-checked`. Optional visible on/off text inside the track is `aria-hidden`.
8. Touch target: the interactive area (including label) is at least 24×24 CSS px (WCAG 2.2 AA); `md` SHOULD reach 44px height of hit area where layout allows.
9. Contrast: track and thumb vs. background at least 3:1 in both states (WCAG 1.4.11); text at least 4.5:1.
10. Zoom/reflow: label and description wrap; no clipping at 200% zoom or 320px width.

### Keyboard

| Key | Behavior |
|---|---|
| Tab / Shift+Tab | Moves focus to / from the switch. Disabled switch is skipped. |
| Space | Toggles. Activation occurs on key up, matching native checkbox. |
| Enter | No toggle (§4.2). |
| Arrow keys | No effect (a switch is not a radio group). |

## 8. Composition

- Works inside a `<fieldset>` with `<legend>` for groups of switches; each switch remains an independent control.
- Label placement: label text sits at the inline-end of the track by default. A `labelPlacement` option is out of scope for v1.
- Description and error render below the label, aligned with label text, not the track.
- Error and description MUST NOT shift the control's position while toggling.

## 9. Sizes

| Size | Track (w×h) | Thumb | Label text |
|---|---|---|---|
| `sm` | 32×18 px | 14 px | small body |
| `md` | 44×24 px | 20 px | body |

Values are guidelines subject to design tokens; the required properties are that `md` ≥ `sm` in every dimension, thumb inset is uniform, and both sizes satisfy §7.8–7.9. Size does not alter behavior.

## 10. Decisions on open questions

Chosen without a reviewer; each is the recommended option.

| # | Question | Decision | Rationale |
|---|---|---|---|
| D1 | Submit value when off? | Nothing submitted | Matches checkbox; servers treat absence as false. A hidden "off" companion value is rejected as it surprises consumers and breaks `FormData` parity. |
| D2 | Reset of a controlled switch? | Component notifies via `onCheckedChange(defaultChecked)`, owner applies | Keeps controlled semantics honest while letting reset work. |
| D3 | Does Enter toggle? | No | ARIA switch pattern lists Space as required; Enter would conflict with implicit submit. |
| D4 | Error text when `required` fails and none supplied? | Use native validation message; visible message optional | Avoids shipping untranslated default strings. |
| D5 | Required semantics for a switch | Must be on | Equals checkbox `required`; useful for consent toggles. |
| D6 | Label required? | Yes, visible label or an aria name | An unnamed switch is inaccessible. |
| D7 | Number of sizes | Two: `sm`, `md` | As requested. |
| D8 | Indeterminate state | Not supported | A switch is binary. |
| D9 | Native element vs custom | Unspecified; only exposed role, state and form behavior are normative | Leaves implementation freedom. |
| D10 | Event semantics | `onCheckedChange` only for user action | Prevents loops in controlled use. |

## 11. Acceptance criteria

Each is testable.

1. Tab reaches the switch; Space toggles it; Enter does not; Arrow keys do nothing.
2. Clicking the label toggles it and focuses the control; clicking description does nothing.
3. A form containing `name="n"` `value="v"` switch yields `n=v` in `FormData` when on and no `n` entry when off.
4. Without `name`, nothing is submitted in either state.
5. After `form.reset()`, an uncontrolled switch matches `defaultChecked` and no `onCheckedChange` fires; a controlled switch triggers `onCheckedChange(defaultChecked)` only if different.
6. A switch inside `<fieldset disabled>` is not focusable, not toggleable and not submitted; enabling the fieldset restores it. A switch in the fieldset's first legend is not disabled.
7. `required` and off: `form.checkValidity()` is false, `validity.valueMissing` is true, submission is blocked. Turning it on makes it valid. A disabled required switch does not block.
8. `aria-describedby` references the description, and the error only while the error is shown; `aria-invalid` and required state are exposed.
9. The accessibility tree reports role `switch` with the correct checked state and name in both sizes.
10. Under `prefers-reduced-motion: reduce` there is no thumb transition; in forced-colors mode on/off remain distinguishable.
11. Controlled with a parent that ignores changes: the visual and `aria-checked` state never change.
12. `sm` and `md` have identical behavior and both meet target-size and contrast requirements.
