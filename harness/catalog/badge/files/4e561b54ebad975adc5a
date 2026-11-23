---
component: Badge
status: stable
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-08
source: visual reference shadcn/ui Badge (look, names, variants); contract-first standard (contract and build process)
---

# Badge

> A small pill that labels or counts something, optionally a link. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Mark an item with a short status, category or count. Not a control: for actions use Button.

## 2. Anatomy
`badge` (part `badge`) is a `span`, or a native `a` when `href` is set. It holds the default slot: text or a number, optionally with a 12px svg icon.

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `variant` | primary, secondary, destructive, tertiary, ghost, link | primary | look of the pill |
| `href` | text | — | renders a native link; adds hover, focus ring and a 24px minimum height; `javascript:`, `vbscript:` and `data:` URLs are dropped (SB-0115) |
| slot | default | — | short text or number, optional svg icon |

## 4. Variant matrix
6 variants, one dimension. Hover and focus apply to link badges only.

## 5. Roles and color
| Variant | Background | Text | Border |
| --- | --- | --- | --- |
| primary | `primary` | `primary-foreground` | none |
| secondary | `secondary` | `secondary-foreground` | none |
| destructive | `destructive` | `destructive-foreground` | none |
| tertiary | none | `foreground` | `border` |
| ghost | none | `foreground` | none |
| link | none | `primary`, underline on hover | none |

Filled variants darken to 90% on hover of a link badge; tertiary and ghost take `accent` on hover.

## 6. States
Link badges: hover, focus-visible (3px solid ring). Plain badges have no states.

## 7. Dimensions and layout
Inline-flex, pill radius, 1px transparent border (keeps variants the same size), padding 8px × 2px, gap 4px, nowrap, content clipped. About 22px high; a link badge is at least 24px (`badge.link-min-height`).

## 8. Typography
12px (`font.size.caption`), weight 500, line height 1.33.

## 9. Accessibility
- Plain badge: text only, no role, not focusable. Keep the meaning in words; color is never the only signal (1.4.1).
- With `href`: a native link (name from the text, Enter follows it), visible focus ring, 24px minimum target (2.5.8).
- A changing count is not announced; use a status region for live updates.
- All variant text pairs meet 4.5:1 (checked by T6); the destructive background stays full strength in dark mode so white text keeps its contrast.

## 10. Usage
### Behavior
Static; link badges navigate.
### Composition
Beside a heading, in a table cell, in a list item. Icons go inline with the text.
### Choosing the props
`secondary` or `tertiary` for categories, `primary` for counts, `destructive` for failures with explanatory words.
### Do / Don't
- Do keep it to a word or two. Don't use a badge instead of a button.

## Realizations
### Figma
Drawn in the library: axes Variant and State, text properties Label text and the Left icon / Label switches. The border is part of the box (transparent except for tertiary); hover on the filled variants is the fill at 90%. Not drawn: the link underline on hover (Figma shares text decoration across variants), `link-min-height`, and the link underline offset.
### Web
Complete. Files: `src/components/badge/Badge.ts`, `src/components/badge/Badge.scss`, `src/components/badge/Badge.styles.ts`, `src/components/badge/Badge.stories.ts`, `src/components/badge/index.ts`. Parts: `badge`. Slots: `default`. Spec: `playwright/tests/badge/badge.behavior.spec.ts`.
### Coverage
- span by default, native link with href, swaps with href; name from text
- primary, secondary, destructive fill from tokens; tertiary border; ghost and link unfilled
- pill shape, size, padding, gap, 12px icon; all variants the same size
- link badge: hover, keyboard focus ring, 24px minimum height, Enter navigates, host focus delegates
- plain badge: no hover change, not focusable
- axe clean (default, variants, links, icon, count)
### Known drift
- dark destructive background: full destructive color; the visual reference dims it to 60% in dark mode; that would break contrast with white text.
- link badge height: at least 24px for href badges (WCAG 2.5.8); the visual reference is about 22px high.
- focus ring: solid 3px ring; the visual reference uses ring at 50% plus a border color (below 3:1).
- invalid style: not provided; the visual reference styles aria-invalid on a badge, which has no meaning here.

## Open questions
- Q1 (answered): six variants including ghost and link.
- Q2 (answered): `href` renders a native link, 24px minimum height.
- Q3 (answered): dark destructive is not dimmed to 60%.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-badge-*` variables (check T4). Tests first (rule test-first).
