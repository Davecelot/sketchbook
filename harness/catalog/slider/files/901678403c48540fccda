---
component: Slider
status: stable
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-08
source: visual reference (look and sizes), WAI-ARIA APG slider and multi-thumb slider, contract-first standard (contract and build process)
---

# Slider

> A slider for picking a number, or a range with two thumbs, built on native range inputs, with label, description and error built in, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Choose a value where position matters more than the exact digit (volume, a rough budget), or a lower and upper bound. Not for precise numbers (Input type number) or a few discrete choices (Radio Group).

## 2. Anatomy
`field` holds `label`, `control` (the `track` with its filled `range`, and one native-range `thumb` per value), `description` (optional) and `error` (live region).

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the control |
| `errorMessage` (`error-message`) | text | — | marks the field invalid |
| `name` | text | — | form field name; a range submits one entry per thumb |
| `value` | text | — | comma-separated numbers, one thumb each: `40` or `20,80`; the attribute is the reset default |
| `min`, `max`, `step` | number | 0, 100, 1 | bounds and increment |
| `orientation` | horizontal, vertical | horizontal | direction of the track |
| `required` | boolean | false | accepted for parity; never blocks submission |
| `disabled` | boolean | false | native |

## 4. Variant matrix
`orientation`: horizontal, vertical.

## 5. Roles and color
Track `input` (the 3:1 form-field color; the visual reference uses `muted`), range `primary`, thumb fill `background` with a `primary` border, label `foreground`, description `muted-foreground`, error and invalid thumb border `destructive`, focus ring `ring`.

## 6. States
focus-visible (3px ring around the thumb), invalid (thumb border `destructive`), disabled (opacity 0.5, not-allowed cursor).

## 7. Dimensions and layout
Track 6px thick with a pill radius; thumb 16px with a 1px border and a small shadow. Horizontal fills the container; vertical is 192px long.

## 8. Typography
Label 14px, weight 500, line-height 1; description and error 14px, line-height 1.5.

## 9. Accessibility
- Enter submits the form (implicit submission): the inner control has no form owner in its shadow root, so the component calls `form.requestSubmit()` (SB-0009).
- Each thumb is a native range input, so role, value, bounds and keys come from the platform. With two thumbs they are named "label minimum" and "label maximum"; the lower thumb cannot pass the upper.
- Keys: arrows change by `step`, Page keys by a larger step, Home and End jump to the ends. No drag is required (WCAG 2.5.7).
- Description and error through `aria-describedby`; the error is a persistent polite live region.
- The unfilled track meets 3:1 against the page through `input` (the visual reference track is lighter; logged as drift). The thumb and filled range meet 3:1 too. Focus ring is solid, not translucent.

## 10. Usage
### Behavior
`input` fires while moving, `change` on commit. Pressing the track moves the nearest thumb. A range submits one entry per thumb.
### Composition
Show the current value in the label or beside the control; pair with a number Input when exactness matters.
### Choosing the props
Set `step` to a meaningful increment; two numbers in `value` make a range.
### Do / Don't
- Don't use a slider for exact amounts.
- Don't hide the current value.

## Realizations
### Figma
Drawn in the library (`sketchbook api figma slider`): axes Orientation, State (Rest, Focus), Validation and Disabled; one thumb at the middle of the track with the range filled before it; the `Range` property shows a second thumb and moves the fill between the two (the thumb part repeats per value, `spec/api.json` parts). Text properties Label, Description and Error and the Description switch; no Required, since a slider never shows an asterisk. Disabled dims the control (track and thumbs) only, as the styles do. The 24px press area (`target-size`) and the value inside the track are not drawn.
### Web
Complete. `src/components/slider/Slider.ts`; parts `field`, `label`, `control`, `track`, `range`, `thumb`, `description`, `error`.
### Coverage
- one slider per value named by the label; label click focuses; a range has distinct minimum and maximum names
- arrow, Home, End and Page keys; min, max and step bounds; thumbs cannot cross
- track press moves the thumb (native for one, nearest for a range)
- filled range geometry for one and two thumbs; 6px track, 24px press area
- vertical: ArrowUp increases, aria-orientation, 192px long
- keyboard focus ring visible
- hide-label, description and error in the accessible description, aria-invalid
- input and change reach the host
- form entries per thumb, reset, disabled, disabled fieldset, error customError, label for
- axe clean on all stories
### Known drift
- API shape: the visual reference takes a value array and composes Field parts; attributes need a string form and shadow DOM needs the label inside
- track contrast: the visual reference track (muted) is below 3:1 against the page; accepted because the thumb (primary border) and the filled range meet 3:1 and carry the value; no pair declared
- focus ring: the visual reference uses ring/50 plus a hover ring, below 3:1 (WCAG 1.4.11); no hover ring
- vertical length: the visual reference uses 176px; the foundation scale has no such step
- thumb stacking: when both thumbs sit at the maximum the upper input is on top and the lower thumb is moved by keyboard or by pressing the track

## Open questions
None open.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-slider-*` variables (check T4). Tests first. Use `FormAssociated` + `NativeControl`.
