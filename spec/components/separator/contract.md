---
component: Separator
status: beta
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-08
source: visual reference shadcn/ui Separator (look, names); WAI-ARIA separator role; contract-first standard (contract and build process)
---

# Separator

> A thin line that separates content. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Divide groups of content visually, in a column (horizontal line) or in a row (vertical line). Not a replacement for a heading.

## 2. Anatomy
`sb-separator` holds one part, `line`, drawn with the border color.

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `orientation` | horizontal, vertical | horizontal | direction of the line |
| `decorative` | boolean | true | true hides it from assistive technology; `decorative="false"` exposes role separator |

## 4. Variant matrix
2 orientations; `decorative` changes semantics only.

## 5. Roles and color
`border` color. No contrast pair: the line is decoration (WCAG 1.4.11 does not apply).

## 6. States
None.

## 7. Dimensions and layout
Horizontal: full width, 1px high (`border-width.default`). Vertical: 1px wide, stretches to the height of its container (needs a flex row or a sized parent). Does not shrink.

## 8. Typography
None.

## 9. Accessibility
- Decorative (default): `role="none"` on the host; nothing is announced.
- `decorative="false"`: `role="separator"`, plus `aria-orientation="vertical"` when vertical (horizontal is implicit).
- A separator is not focusable and has no name. Set before first render.
- HTML attributes cannot default to true: write `decorative="false"` (or set the property to `false`) to turn decoration off.

## 10. Usage
### Behavior
Static.
### Composition
Between sections in a card or menu; vertical between inline items in a toolbar or breadcrumb-like row.
### Choosing the props
Keep it decorative unless the boundary matters for navigation; expose at most a few per view.
### Do / Don't
- Do use a heading to name a section. Don't mark every divider as a separator.

## Realizations
### Figma
Drawn in the library (`sketchbook api figma separator`): axis Orientation. The horizontal line is as wide as the sample (320px), the vertical one 64px high; the color and thickness are the tokens.
### Web
Complete. Files: `src/components/separator/Separator.ts`, `src/components/separator/Separator.scss`, `src/components/separator/Separator.styles.ts`, `src/components/separator/Separator.stories.ts`, `src/components/separator/index.ts`. Parts: `line`. Slots: none. Spec: `playwright/tests/separator/separator.behavior.spec.ts`.
### Coverage
- decorative by default: role none, absent from the accessibility tree
- decorative="false": role separator; aria-orientation only when vertical
- role correct from first render and follows the property
- horizontal 1px high full width; vertical 1px wide stretching a flex row
- color and thickness from tokens; not focusable; axe clean
### Known drift
- decorative default: decorative defaults to true; decorative="false" turns it off; HTML attributes cannot default to true, so the string "false" is the off value (custom converter).

## Open questions
- Q1 (answered): decorative by default.
- Q2 (answered): no contrast pair for the decorative line.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-separator-*` variables (check T4). Tests first (rule test-first).
