---
component: Toggle
status: stable
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-08
source: shadcn/ui (visual reference, names), WAI-ARIA APG toggle button, contract-first standard (contract and build process)
---

# Toggle

> A pressable control that stays on or off until pressed again, for one setting such as bold. Typed spec: [contract.json](./contract.json).

## 1. Purpose
An option that is on or off and takes effect immediately (bold, italic, show grid). Not for a setting that is saved with a form: use Switch or Checkbox. For a set of related toggles use Toggle Group.

## 2. Anatomy
`button` (native `<button>`, part `button`) holds the default slot: text, an icon, or both.

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `variant` | ghost, tertiary | ghost | tertiary adds border and shadow |
| `size` | medium, small, large | medium | 36 / 32 / 40px high |
| `selected` | boolean | false | on state; reflected as `aria-pressed` |
| `disabled` | boolean | false | native disabled |
| slots | default | — | |
| events | `change` | — | `detail.selected`; only on person input |

## 4. Variant matrix
2 variants × 3 sizes = 6 combinations.

## 5. Roles and color
| State | Background | Text |
| --- | --- | --- |
| off | transparent | `foreground` |
| hover (off) | `muted` | `muted-foreground` |
| on | `accent`, plus a 1px `foreground` border (the fill alone is about 1.1:1; the border carries the state at 3:1, WCAG 1.4.11) | `accent-foreground` |
| tertiary | adds 1px `input` border and shadow-xs; hover uses `accent` / `accent-foreground` | |

## 6. States
hover, pressed (on), focus-visible (3px solid `ring`), disabled (opacity 0.5).

## 7. Dimensions and layout
Heights 32 / 36 / 40px (`size.control.*`), min-width equal to the height. Padding-x 6 / 8 / 10px. Gap 8px. Icons 16px. Radius `radius.control`.

## 8. Typography
14px (`font.size.control`), weight 500, line-height 20px.

## 9. Accessibility
- Native `<button aria-pressed>`: the APG toggle button. The label stays the same in both states.
- Name from the label text; host `aria-label` is forwarded; `aria-labelledby` and `aria-describedby` are not (ID references do not cross shadow roots, SB-0009).
- Icon-only toggles need `aria-label`; a dev-only warning appears once otherwise.
- Focus ring on `:focus-visible`, 3px, solid `ring` (the reference's translucent ring is below 3:1).
- Target size at least 32px (WCAG 2.5.8). Follows `<fieldset disabled>`.

## 10. Usage
### Behavior
Click, Enter or Space flips `selected` and fires `change` with `detail.selected`. Setting `selected` from code does not fire `change`.
### Composition
Group related toggles in Toggle Group. Toolbars may hold several toggles.
### Choosing the props
`ghost` for toolbars and dense UI; `tertiary` when the toggle needs a visible boundary at rest.
### Do / Don't
- Do name icon-only toggles with `aria-label`. Don't change the label when the state changes.
- Do use it for immediate effects. Don't use it for a value that waits for a Save button.

## Realizations
### Figma
Drawn in the library (`sketchbook api figma toggle`): axes Variant (Ghost, Tertiary), Size, State (Rest, Hover, Focus), Selected and Disabled, with a Label text property.
### Web
`src/components/toggle/Toggle.ts`, part `button`, slot `default`. Complete.
### Coverage
`playwright/tests/toggle/toggle.behavior.spec.ts`: 17 tests (props, events, tokens, keyboard, focus ring, disabled, fieldset, name, axe).
### Known drift
- Focus ring solid instead of ring/50 (WCAG 1.4.11).
- Light `muted` is neutral-50 (SB-0004), so the hover fill is subtle.

## Open questions
- Q1 (answered): not a form field; follows `<fieldset disabled>` only.
- Q2 (answered): uncontrolled `selected` plus a `change` event.

## Spec for agents
Build from contract.json only. CSS uses only --sb-toggle-* variables (check T4). Tests first (rule test-first).
