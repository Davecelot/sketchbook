---
component: Switch
status: stable
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-08
source: visual reference (look and sizes), WAI-ARIA APG, contract-first standard (contract and build process)
---

# Switch

> A switch: a native checkbox exposed as role="switch", with label, description and error laid out beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
A setting that is on or off and usually applies at once (notifications, dark mode). Not for choosing several options to submit together (Checkbox) or one of many (Radio Group).

## 2. Anatomy
`field` (grid) holds `control` (the track: native `<input type="checkbox" role="switch">` plus the `thumb`), `label` (+ `required-indicator`), `description` (optional), `error` (live region).

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the control |
| `errorMessage` (`error-message`) | text | — | marks the field invalid |
| `size` | medium, small | medium | track and thumb size |
| `name` | text | — | form field name |
| `value` | text | on | submitted while on |
| `selected` | boolean | false | on/off; the attribute is the reset default |
| `required`, `disabled` | boolean | false | native |

## 4. Variant matrix
`size`: medium (32×20 track, 16px thumb), small (24×16 track, 12px thumb).

## 5. Roles and color
Track off `input`, on `primary`; thumb off `background`, on `primary-foreground`; label `foreground`; description `muted-foreground`; error and invalid border `destructive`; focus ring `ring`.

## 6. States
focus-visible (3px ring), checked, invalid (border `destructive`; a solid 3px `destructive` ring on keyboard focus), disabled (opacity 0.5, not-allowed cursor). The thumb slides over the fast motion duration, off under reduced motion.

## 7. Dimensions and layout
Track 32×20 (small 24×16), pill radius, shadow-xs, 2px thumb inset. 12px gap to the label.

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5.

## 9. Accessibility
- Enter submits the form (implicit submission): the inner control has no form owner in its shadow root, so the component calls `form.requestSubmit()` (SB-0009).
- Native `<input type="checkbox" role="switch">` with a native `<label for>` in one shadow root; Space toggles; checked is the on state, with no `aria-checked`.
- State is never conveyed by color alone: the thumb position changes too (WCAG 1.4.1).
- Track at 3:1 against the background and a solid focus ring (deviation from the visual reference, WCAG 1.4.11). Track and thumb sizes snap to the foundation scale (20 and 16 px high instead of 18.4 and 14).

## 10. Usage
### Behavior
`input` and `change` on each toggle, composed. Value is submitted only while on.
### Composition
Settings lists, one switch per row; inside a form it behaves like a checkbox.
### Choosing the props
`small` for dense settings lists.
### Do / Don't
- Don't use a switch for something that needs a Save to take effect; use Checkbox.
- Don't label it with a verb that flips meaning when on.

## Realizations
### Figma
Drawn in the library (`sketchbook api figma switch`): axes Size, State, Selected, Validation and Disabled; `control` wraps the `input` track, whose thumb sits at the start and moves to the end when selected; text properties as Checkbox. Disabled dims the track, thumb and label, not the description or error. Not drawn: the track is not centered on the label's first line.
### Web
Complete. `src/components/switch/Switch.ts`; parts `field`, `control`, `input`, `thumb`, `label`, `required-indicator`, `description`, `error`.
### Coverage
- role switch named by label; label click toggles; native checkbox, no aria-checked
- Space toggles; thumb moves; keyboard focus ring
- medium 32x20 / 16px thumb and small 24x16 / 12px thumb; on uses primary track
- description and error in the accessible description; aria-invalid
- required: native required, aria-hidden asterisk, invalid after blur
- hide-label keeps the name
- input and change composed, once per toggle
- disabled cannot toggle
- form value only while on, custom value, reset to attribute default, validity, disabled fieldset, error customError, label for
- axe clean on all stories
### Known drift
- API shape: shadcn composes Field parts around Switch; shadow DOM requires them inside
- track color: shadcn uses input (neutral-200); changed for WCAG 1.4.11
- focus ring: shadcn uses ring/50, below 3:1 (WCAG 1.4.11)
- size: shadcn uses 32x18.4 (sm 24x14); the foundation scale has no such steps
- dark thumb: shadcn uses foreground for the unchecked thumb in dark mode

## Open questions
None open.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first. Use `FormAssociated` + `NativeControl`.
