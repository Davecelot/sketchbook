---
component: Card
status: stable
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-08
source: visual reference (shadcn/ui Card), harness process (contract-first standard)
---

# Card

> A surface that groups related content and actions. A family of seven elements. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Group related content (a summary, a form section, a settings block) on a bordered surface, with an optional header, action and footer. Not for navigation lists (use Item) and not a page layout container.

## 2. Anatomy
`sb-card` is the surface. Its default slot holds `sb-card-header` (with `sb-card-title`, `sb-card-description`, optional `sb-card-action`), `sb-card-content` and `sb-card-footer`. Every part is its own custom element with a default slot.

## 3. Props / API
| Element | Prop | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `sb-card` | `size` | medium, small | medium | 24px or 16px padding and gap |
| other parts | none | | | content only |

`sb-card-header` sets `data-has-action` on itself from `slotchange` when a `sb-card-action` child exists, and lays title and description in the first column and the action in the last, spanning both rows.

## 4. Variant matrix
`size`: medium, small (2 combinations).

## 5. Roles and color
| Part | Color |
| --- | --- |
| card | `card` background, `card-foreground` text, 1px `border` |
| description | `muted-foreground` |

## 6. States
None: the card is not interactive.

## 7. Dimensions and layout
Radius `radius.large` (14px), shadow `elevation.sm`. Vertical padding and gap 24px (16px for `small`); header, content and footer inset by the same amount, read from the card through a private custom property. Header gap 8px.

## 8. Typography
Title 16px, weight 600, line-height 1. Description 14px, muted.

## 9. Accessibility
- No roles or ARIA: a card is a visual grouping, so its content keeps its own semantics. Put a real heading inside `sb-card-title` when the card belongs in the document outline.
- Text contrast: card text and muted description are checked against the card background in both modes.
- Reflows with the container; no fixed widths (WCAG 1.4.10).

## 10. Usage
### Behavior
Static. The action stays at the end of the header whatever the title length.
### Composition
Header with a `sb-button` in `sb-card-action`; form fields in `sb-card-content`; buttons in `sb-card-footer`.
### Choosing the props
Use `size="small"` for dense grids and side panels.
### Do / Don't
- Do keep one clear title per card. Don't nest cards.

## Realizations
### Figma
Drawn in the library: axis Size, with a header (title, description), content and footer as sample text. Not drawn: the header action.
### Web
Complete. `src/components/card/`: `Card.ts` (`sb-card`), `CardHeader.ts`, `CardTitle.ts`, `CardDescription.ts`, `CardAction.ts`, `CardContent.ts`, `CardFooter.ts`; one shared `Card.scss`. No shadow parts: the host is the surface.
### Coverage
Behavior spec `playwright/tests/card/card.behavior.spec.ts`: all seven elements registered; border, radius, padding, gap from tokens; size small tightens padding, gap and part inset; parts outside a card use the default inset; card colors in light and dark; title and description typography; data-has-action set and cleared with slotchange; action at the end spanning both rows; no roles or ARIA on any part; content in reading order; axe clean (default, with action, small, content only).
### Known drift
- Header and footer borders (class hooks in the visual reference) are not in v1.
- Parts read their inset from the card through a private custom property.

## Open questions
None open (Q1, Q2 answered in the contract).

## Spec for agents
Build from contract.json only. CSS uses only `--sb-card-*` variables (check T4). Tests first.
