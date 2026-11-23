---
component: AspectRatio
status: stable
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-08
source: visual reference shadcn/ui Aspect Ratio (names, behavior); contract-first standard (contract and build process)
---

# Aspect Ratio

> A box that keeps a fixed width-to-height ratio. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Keep media or other content in a stable shape while its container changes width, and reserve the space before the media loads (no layout shift).

## 2. Anatomy
`sb-aspect-ratio` holds one part, `frame`, which owns the ratio. The default slot takes one child that is stretched to fill the frame.

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `ratio` | number | 1 | width / height; also accepts `16/9`; invalid values fall back to 1 |
| slot | default | — | one child (img, video, iframe) |

## 4. Variant matrix
None.

## 5. Roles and color
None: the component draws nothing.

## 6. States
None.

## 7. Dimensions and layout
Block display, full width of its container. The height follows the width and the ratio. The slotted child is absolutely stretched to the frame, so content larger than the frame does not change the box; it is clipped only if the author sets `overflow` or `object-fit`.

## 8. Typography
None.

## 9. Accessibility
- No role, no ARIA, not focusable. The child keeps its own name (img `alt`, iframe `title`).
- Zoom and reflow work because the size is relative (1.4.4, 1.4.10).

## 10. Usage
### Behavior
The ratio is applied on every change of `ratio`.
### Composition
Wrap one image, video or embed. Set `object-fit: cover` on the child to crop, or `contain` to letterbox.
### Choosing the props
Common ratios: 1 (square), 4/3, 16/9, 21/9.
### Do / Don't
- Do give the media a text alternative. Don't put several children in the box.

## Realizations
### Figma
Drawn in the library: one frame at the default ratio (1) and the sample width. It has no look of its own: no tokens, no fill.
### Web
Complete. Files: `src/components/aspect-ratio/AspectRatio.ts`, `src/components/aspect-ratio/AspectRatio.scss`, `src/components/aspect-ratio/AspectRatio.styles.ts`, `src/components/aspect-ratio/AspectRatio.stories.ts`, `src/components/aspect-ratio/index.ts`. Parts: `frame`. Slots: `default`. Spec: `playwright/tests/aspect-ratio/aspect-ratio.behavior.spec.ts`.
### Coverage
- square by default; numeric, fraction and changing ratio
- invalid ratios fall back to 1
- slotted child fills the box; tall content does not stretch it
- no role or focus stop; child keeps its name; axe clean
### Known drift
- ratio syntax: number or a/b fraction in the attribute; the visual reference takes a number only.

## Open questions
- Q1 (answered): `ratio` is a number or an `a/b` fraction.
- Q2 (answered): the child fills the box; the author picks `object-fit`.

## Spec for agents
Build from contract.json only. The component has no tokens, so its CSS uses no component variables. Tests first (rule test-first).
