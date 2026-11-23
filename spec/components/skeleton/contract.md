---
component: Skeleton
status: stable
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-08
source: visual reference shadcn/ui Skeleton (look, names); contract-first standard (contract and build process)
---

# Skeleton

> A pulsing placeholder block for content that is still loading. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Reserve the space of content that will appear, so the layout does not jump. Not a loading announcement: it is hidden from assistive technology.

## 2. Anatomy
`sb-skeleton` holds one part, `block`, the filled shape. It fills the host; the author sizes the host.

## 3. Props / API
No props. Size it with CSS (`width`, `height`, or its cell in a flex or grid layout). Override `--sb-skeleton-radius` for round shapes.

## 4. Variant matrix
None.

## 5. Roles and color
Fill `accent`. No contrast pair: it is hidden, decorative and carries no information.

## 6. States
Pulsing: opacity moves between 1 and `skeleton.pulse-opacity` over twice the loop duration. Under reduced motion the block is static.

## 7. Dimensions and layout
Block display, full width by default, no intrinsic height (a skeleton with no height is invisible). Radius `radius.control`.

## 8. Typography
None.

## 9. Accessibility
- `aria-hidden="true"` on the host, set before first render; not focusable.
- The author announces loading: `aria-busy="true"` on the container, or a status message. Remove the skeletons and the busy flag when content arrives.
- Reduced motion: the pulse stops (animation off), because a placeholder carries no essential state.

## 10. Usage
### Behavior
Pulses until removed.
### Composition
Arrange several to mimic the loading layout: lines, an avatar circle, an image block.
### Choosing the props
There are none; match the size and shape of the content that replaces it.
### Do / Don't
- Do match the final layout. Don't use a skeleton as the only loading signal.

## Realizations
### Figma
Drawn in the library: one block (sample 320 by 64px) with the fill and radius tokens. Not drawn: the pulse (animation, `pulse-opacity`).
### Web
Complete. Files: `src/components/skeleton/Skeleton.ts`, `src/components/skeleton/Skeleton.scss`, `src/components/skeleton/Skeleton.styles.ts`, `src/components/skeleton/Skeleton.stories.ts`, `src/components/skeleton/index.ts`. Parts: `block`. Slots: none. Spec: `playwright/tests/skeleton/skeleton.behavior.spec.ts`.
### Coverage
- aria-hidden from connection, out of the accessibility tree
- sized by the author's CSS
- fill and radius from tokens; radius overridable
- pulse at twice the loop duration; off with reduced motion
- not focusable; axe clean
### Known drift
- reduced motion: pulse stops under prefers-reduced-motion; the visual reference keeps pulsing.
- pulse easing: motion.easing.standard; the visual reference uses a slightly different curve (0.4, 0, 0.6, 1).

## Open questions
- Q1 (answered): the pulse stops under reduced motion.
- Q2 (answered): no size props; sized by CSS.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-skeleton-*` variables (check T4). Tests first (rule test-first).
