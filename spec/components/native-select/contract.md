---
component: NativeSelect
status: beta
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-08
source: visual reference (look and sizes), WAI-ARIA APG, contract-first standard (contract and build process)
---

# Native Select

> A native select with label, description and error built in, taking part in forms. Options are plain <option> and <optgroup> children. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Choose one value from a known list, with the platform's own picker (good on mobile and in long forms). Not for options with rich content (a custom Select, later) or two to four choices that should all be visible (Radio Group).

## 2. Anatomy
`field` (vertical stack) holds `label` (+ `required-indicator`), `control` (the native `select` and the chevron `icon`), `description` (optional), `error` (live region).

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the control |
| `errorMessage` (`error-message`) | text | — | marks the field invalid |
| `size` | medium, small | medium | 36px or 32px high |
| `name` | text | — | form field name |
| `value` | text | — | selected option's value; default is the `selected` option, else the first |
| `required`, `disabled` | boolean | false | native |

Content: plain `<option>` and `<optgroup label>` children of `<sb-native-select>` (a disabled option or group works as in HTML). They are mirrored into the shadow select and stay unrendered themselves.

## 4. Variant matrix
`size`: medium, small.

## 5. Roles and color
Border `input`, background `input-background`, text `foreground`, chevron `muted-foreground`, option list `popover` / `popover-foreground`, label `foreground`, description `muted-foreground`, error and invalid border `destructive`, focus ring `ring`.

## 6. States
focus-visible (3px ring, border in `ring`), invalid (border `destructive`; on keyboard focus a solid 3px `destructive` ring, so focus differs from invalid at rest: WCAG 2.4.7, 1.4.11; the visual reference tints it at 20%), disabled (opacity 0.5, not-allowed cursor).

## 7. Dimensions and layout
Height 36px (small 32px), padding 12px × 4px, room on the right for the 16px chevron, radius 8px, 1px border, shadow-xs. Full width of its container.

## 8. Typography
Select and label 14px; label weight 500, line-height 1; description and error 14px, line-height 1.5.

## 9. Accessibility
- Native `<select>` and `<label for>` in one shadow root, so the platform keeps its keyboard and screen-reader behavior; nothing is re-implemented.
- Description and error through `aria-describedby`; `aria-invalid` when invalid; the error is a persistent polite live region. The chevron is `aria-hidden`.
- Border at 3:1 and a solid focus ring (deviation from the visual reference, WCAG 1.4.11).
- `required` needs a first `<option value="">` prompt to be meaningful, as in HTML.

## 10. Usage
### Behavior
`input` and `change` fire on selection, composed. The form value is the selected option's value; reset restores the default selection.
### Composition
Inside a form. Children can change after load; the shadow select follows.
### Choosing the props
`size="small"` for dense toolbars and tables. `description` for what the choice affects.
### Do / Don't
- Don't give a prompt option a real value.
- Don't use it for two or three choices.

## Realizations
### Figma
Drawn in the library (`sketchbook api figma native-select`): axes Size, State (Rest, Focus), Validation and Disabled; text properties Label, Description and Error, booleans Required and Description. The select shows a fixed "Select an option" text and the chevron. Disabled dims the select only, not the label, description or error. The select binds the block padding. Not drawn: the popup's option colors, which the browser draws (`realizations.design`).
### Web
Complete. `src/components/native-select/NativeSelect.ts`; parts `field`, `label`, `required-indicator`, `control`, `select`, `icon`, `description`, `error`.
### Coverage
- label is the name; label click focuses; 36px and small 32px
- light-DOM options, optgroups and disabled mirrored, and updated when children change
- selection updates value; input and change composed once
- typing selects the matching option
- value prop and default selection
- keyboard focus ring
- hide-label keeps the name; chevron aria-hidden, no pointer events
- description and error in the accessible description; aria-invalid
- required: native required, aria-hidden asterisk, invalid after blur
- form value, selected default, validity, reset, disabled, disabled fieldset, error customError, label for
- axe clean on all stories
### Known drift
- API shape: the visual reference composes Field parts around its select; shadow DOM requires them inside
- option elements: the visual reference ships option wrapper components; native children are mirrored instead (contract Q1)
- border color: the visual reference uses neutral-200; changed for WCAG 1.4.11
- focus ring: the visual reference uses ring/50, below 3:1 (WCAG 1.4.11)

## Open questions
None open.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-native-select-*` variables (check T4). Tests first. Use `FormAssociated` + `NativeControl`; model on Input.
