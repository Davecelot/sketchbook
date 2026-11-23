---
component: Label
status: stable
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-08
source: visual reference shadcn/ui Label (look, names); WAI-ARIA naming rules; contract-first standard (contract and build process)
---

# Label

> A stand-alone text label for a control. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Name a control that does not carry its own label: a native input, or a custom control whose host holds the role. Controls that render their own label (such as Input) do not need it.

## 2. Anatomy
`sb-label` holds one part, `label`, around the default slot. The slot takes the label text, optionally with an icon, or a control to wrap.

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `for` (property `htmlFor`) | text | — | id of the control, looked up in the label's own tree scope |
| `disabled` | boolean | false | dims the label, stops click forwarding |
| slot | default | — | label text, icon, or a wrapped control |

## 4. Variant matrix
None.

## 5. Roles and color
Text `foreground`. Disabled uses the disabled opacity.

## 6. States
Disabled. Nothing else: the label is not focusable and has no hover or focus styling.

## 7. Dimensions and layout
Flex row, icon and text vertically centred, gap `space.control.gap.default`, line height 1, no text selection.

## 8. Typography
14px (`font.size.control`), weight 500, `font.family.body`.

## 9. Accessibility
How a label reaches its control, and where that stops:
1. Finding the control: the `for` id is looked up in the same document or shadow tree as the label. Without `for`, the first control inside the label is used. A control is a native input, select, textarea, button, or a form-associated custom element.
2. Click: a click on the label focuses the control and, unless it is a text field, clicks it. A disabled label forwards nothing. Clicks on links or buttons inside the label are left alone.
3. Name: the label gets an id if it lacks one and the control gets `aria-labelledby` pointing at it, added to any value the author set and removed when the label is removed, retargeted or the control is replaced. This names native controls and hosts that carry their own role.
4. Shadow DOM limit: ID references do not cross shadow roots (SB-0009). A sb-* control that renders its input in a shadow root is therefore not named by `aria-labelledby` on its host; it is named by its own `label` prop, and `sb-label` adds only the click behavior and the visual label.
5. `ElementInternals.labels` lists native `<label>` elements. `sb-label` is not one, so a form-associated control does not see it in `labels`.
- Required controls: mark them in the label text or with the control's own prop; the label has no indicator.

## 10. Usage
### Behavior
The target control is resolved when the label is clicked, plus once after the first render and whenever `for` changes, so a control that appears later is picked up at the next click.
### Composition
`sb-label for="email"` next to `<input id="email">`; or wrap the control inside `sb-label`.
### Choosing the props
Set `disabled` whenever the control is disabled.
### Do / Don't
- Do keep label and control in the same tree. Don't put a label next to a control that already renders one.

## Realizations
### Figma
Drawn in the library (`sketchbook api figma label`): the label text with a Disabled axis (the label dims, as the styles do; `disabled` is a state of the contract). Not drawn: the gap between the label's own parts.
### Web
Complete. Files: `src/components/label/Label.ts`, `src/components/label/Label.scss`, `src/components/label/Label.styles.ts`, `src/components/label/Label.stories.ts`, `src/components/label/index.ts`. Parts: `label`. Slots: `default`. Spec: `playwright/tests/label/label.behavior.spec.ts`.
### Coverage
- look from tokens; icon beside text
- for + native checkbox toggles and focuses; for + text input focuses; wrapped control activated
- for + sb-input (shadow input) focuses the inner input
- native input named through aria-labelledby; existing value kept; cleanup on retarget and removal; late control
- role-bearing custom host named and activated
- disabled dims and forwards nothing; disabled control and inner links left alone
- not focusable; axe clean
### Known drift
- naming mechanism: aria-labelledby set on a same-tree control; the visual reference renders a native label element; sb-label cannot be one, so ElementInternals.labels does not list it.
- shadow-wrapped controls: named by their own label prop; sb-label forwards clicks only; IDREFs do not cross shadow roots (SB-0009).
- disabled styling: disabled prop; the visual reference dims through peer and group disabled selectors.

## Open questions
- Q1 (answered): behavior-based association with `aria-labelledby` on same-tree controls, as above.
- Q2 (answered): `disabled` is a prop; the label does not mirror the control.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-label-*` variables (check T4). Tests first (rule test-first).
