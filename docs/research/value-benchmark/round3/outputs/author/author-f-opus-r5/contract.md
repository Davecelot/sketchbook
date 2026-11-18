---
component: Switch
status: draft
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-12
source: visual reference (look, sizes and API), WAI-ARIA APG switch pattern, contract-first standard (contract and build process), form-associated-controls rule
---

# Switch

> An on/off switch for a setting, with its label, description and error laid out beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Turns one setting on or off, such as "Email notifications" or "Airplane mode". The switch is a form field: it submits a value while on, returns to its default when its form resets, is unavailable inside a disabled group of fields, and can be required to be on.

Not for: a choice recorded for later or an agreement (Checkbox), choosing one of several options (Radio Group), a partial or mixed state (Checkbox with indeterminate), or a pressed button in a toolbar (Toggle).

## 2. Anatomy
`field` (grid) holds `control` and, beside it, `label` (+ `required-indicator`), `description` (optional) and `error` (live region). `control` holds the native `input` (a checkbox with the switch role, which receives focus and keys) under a pill-shaped `track` with a round `thumb`. The thumb sits at the inline start when off and at the inline end when on. Track and thumb are decorative; the input carries the semantics.

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the label |
| `error` | text | — | marks the field invalid and blocks submission |
| `size` | `default` \| `sm` | `default` | track and thumb size only |
| `name` | text | — | form field name |
| `value` | text | `on` | submitted while on |
| `checked` | boolean | false | on/off; the attribute is the reset default |
| `required` | boolean | false | must be on to submit |
| `disabled` | boolean | false | cannot be focused or toggled; not submitted |

Events: `input` and `change` on each user toggle, both crossing the component boundary. Setting `checked` from code or resetting the form fires neither.

## 4. Variant matrix
`size` (default, sm) × checked (off, on) × disabled; invalid is a state (section 6) shown on any of them. No color variants: the on fill is always the primary color, so every switch in a product reads the same.

## 5. Roles and color
Off track `input`; on track `primary`. Thumb `background` when off, `primary-foreground` when on, with an xs shadow. Label `foreground`; description `muted-foreground`; error text and invalid outline `destructive`; focus ring `ring`. The thumb's position, not only the fill color, shows the state (WCAG 1.4.1).

## 6. States
- **off / on**: the thumb slides to the inline end and the track fills with primary.
- **hover**: no change of look (the row is the target; the cursor shows it is clickable).
- **focus-visible**: 3px solid ring around the track, offset from it so it reads against both fills.
- **invalid**: `error` set, or `required` and off after the person turned it off, left it, or tried to submit. The track gets a destructive outline and the error text shows.
- **disabled**: opacity 0.5, not-allowed cursor, skipped by Tab. A disabled group of fields around the switch has the same effect without changing its `disabled` prop.
- Motion: the thumb slides in a fast standard transition; with reduced motion it moves without animating (WCAG 2.3.3).

## 7. Dimensions and layout
| Size | Track | Thumb | Inset |
| --- | --- | --- | --- |
| default | 32 × 20 | 16 | 2 |
| sm | 24 × 16 | 12 | 2 |

Track and thumb fully rounded. 12px gap between the switch and the label; 6px between label, description and error. The switch is centered on the label's first line. Label, description and error keep their size in both switch sizes. In right-to-left text the thumb travels right to left (on = inline end).

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5.

## 9. Accessibility
- Role `switch` on a native checkbox, named by its own label through a native label association; on/off is exposed by the role as checked true/false. `PROPOSAL` (SB-0101): native checkbox rather than a button with the switch role, because native validity, label activation and Space come for free.
- Keyboard: Tab focuses; Space toggles; Enter submits the form (implicit submission, SB-0009) and does not toggle. `PROPOSAL` (SB-0101): the APG lists Enter-to-toggle as optional; submitting keeps Switch consistent with Checkbox and native fields.
- The label is required and does not change with the state; the role already announces on/off. `hide-label` keeps it as the name when other visible text names the row.
- Description and error are the accessible description; `aria-invalid` while invalid; the error is a persistent polite live region, announced once when it appears; `error` also sets a custom validity so the form does not submit.
- `required` is native (valueMissing while off); the asterisk is hidden from assistive technology.
- Off track `input` meets 3:1 against the page, the on thumb meets 3:1 against the primary track, and the focus ring is solid (deviation from the visual reference, WCAG 1.4.11).
- Target size: the 20px (sm 16px) track is below 24px, so the label is part of the clickable row and the 12px gap keeps other targets clear (WCAG 2.5.8 spacing exception).

## 10. Usage
### Behavior
- Turning the switch on or off is the setting's new value. In a form, it is submitted with the form; outside a form, the app applies it on `change`.
- While on, the form submits `value` (default `on`) under `name`; while off, it submits nothing, like a native checkbox. `PROPOSAL` (SB-0101): an "off value" prop was rejected, since a missing field already means off.
- Form reset returns the switch to its default (the `checked` attribute it started with), without firing `change`. Restored form state (back/forward navigation, autofill) sets `checked`.
- A disabled switch, or one inside a disabled group of fields, cannot be focused or toggled and is not submitted; re-enabling the group brings it back with its value.
- `required` blocks submission while the switch is off and shows the invalid state.
- A label elsewhere on the page that points at the switch toggles it when clicked, but the switch's own `label` stays its name.

### Composition
One switch per setting. Several switches go in a field set with a legend naming the group (later), each on its own row. A switch's label and description sit beside it; don't wrap it in a separate label.

### Choosing the props
- **size**: `default` for standalone settings and settings forms; `sm` for dense lists, table rows and toolbars where rows are short.
- **description**: when the consequence of the setting needs a sentence ("Get an email for every new comment.").
- **error**: when the server rejected the setting; say why and what to do.
- **required**: rarely; only when the form truly cannot go on until the setting is on, with a label stating what turning it on means. For agreeing to terms, use a checkbox.
- **hide-label**: only when visible text in the same row already names the setting (a settings table with a name column).

### Do / Don't
- Do name the setting in the label ("Email notifications"); don't name the state ("On") or change the label with the state — the role already announces on/off.
- Don't use a switch for a choice that only takes effect after a separate confirm, or for agreeing to terms; use Checkbox.
- Don't use several switches to choose one of several options; use Radio Group.
- Don't use a switch for a partial or mixed state; it has only on and off. Use Checkbox with indeterminate.
- Don't use a switch as a toolbar button that turns formatting on and off; use Toggle.

## Realizations
### Figma
Not realized yet.
### Web
Not started. Planned files `src/components/switch/Switch.ts` (+ `.scss`, `.styles.ts`, `.stories.ts`, `index.ts`); parts `field`, `control`, `input`, `track`, `thumb`, `label`, `required-indicator`, `description`, `error`. Extends `FormAssociated(NativeControl(LitElement))` per the form-associated-controls rule; the inner `<input type="checkbox" role="switch">` is rendered with `?disabled=${this.isDisabled}` and styled dimmed with `:host(:disabled)`. Thumb direction flips with `:dir(rtl)`; the transition is removed under `prefers-reduced-motion: reduce`; in forced-colors mode the track keeps a visible border and the thumb uses `CanvasText`/`Highlight`. CSS uses only `--sb-switch-*` variables. Behavior spec `playwright/tests/switch/switch.behavior.spec.ts`.
### Coverage
None yet (see plan.md for the test plan).
### Known drift
- API shape: shadcn composes Label and Field parts around Switch; shadow DOM requires them inside
- focus ring: shadcn uses ring/50, below 3:1 (WCAG 1.4.11)
- track height: shadcn uses a 1.15rem track with a 1px transparent border; rounded to the 20px size token
- thumb on dark: shadcn switches the off thumb to foreground in dark mode; one rule per state keeps the contrast pairs declarable
- label, description, error, required: not part of the shadcn Switch
- checked state: not reflected: the attribute is the default restored by form reset

## Open questions
- Q7: manual screen-reader pass (VoiceOver, NVDA) of the on/off announcement and the error live region — recommendation: run it during the a11y audit before beta.

Answered (SB-0101, under SB-0011): Q1 native checkbox with the switch role; Q2 off submits nothing; Q3 Enter submits, Space toggles; Q4 checked not reflected; Q5 label required, after the switch; Q6 sizes default and sm.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first. Use `FormAssociated` + `NativeControl`.
