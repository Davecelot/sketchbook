---
component: Empty
status: beta
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-08
source: visual reference (shadcn/ui Empty), harness process (contract-first standard)
---

# Empty

> A placeholder for a view with nothing to show. A family of six elements. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Explain an empty list, table, search or inbox, and offer the next step. Not for errors (use Alert) or loading (use Skeleton or Spinner).

## 2. Anatomy
`sb-empty` is a centered column. It holds `sb-empty-header` (with `sb-empty-media`, `sb-empty-title`, `sb-empty-description`) and `sb-empty-content` (actions).

## 3. Props / API
| Element | Prop | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `sb-empty-media` | `variant` | primary, icon | primary | icon: 40px muted rounded square with a 24px svg |
| other elements | none | | | content only |

## 4. Variant matrix
`sb-empty-media` `variant`: primary, icon.

## 5. Roles and color
Title uses the inherited text color. Description `muted-foreground`; links inside it are underlined and turn `primary` on hover. Icon media: `foreground` on `muted`.

## 6. States
None, apart from link hover and focus inside the description or content.

## 7. Dimensions and layout
Padding 24px, 48px from 768px wide; gap 24px; radius `radius.surface`. Header and content are at most 48 characters wide, centered, gap 8px (header) and 16px (content). Media sits 8px above the title. No border by default; style the host to add one.

## 8. Typography
Title 18px, weight 500. Description and content 14px. Text is centered and balanced.

## 9. Accessibility
- No roles: the content keeps its own semantics. Use a real heading element in `sb-empty-title` when it belongs in the outline.
- Decorative media is `aria-hidden` (author's responsibility; stories show it).
- Description links are underlined: color is not the only cue (WCAG 1.4.1).
- Reflows: widths are maximums, so narrow containers wrap (WCAG 1.4.10).

## 10. Usage
### Behavior
Static.
### Composition
Icon media + title + description, then one primary `sb-button` and an optional link in `sb-empty-content`.
### Choosing the props
`variant="icon"` for a quiet icon tile; the primary variant for illustrations, images or avatar groups.
### Do / Don't
- Do say what to do next. Don't leave people at a dead end.

## Realizations
### Figma
Drawn in the library: media icon box, title, description and content as samples. Not drawn: the larger padding from a wide viewport (`padding-lg`) and the description link states.
### Web
Complete. `src/components/empty/`: `Empty.ts` (`sb-empty`), `EmptyHeader.ts`, `EmptyMedia.ts`, `EmptyTitle.ts`, `EmptyDescription.ts`, `EmptyContent.ts`; one shared `Empty.scss`.
### Coverage
Behavior spec `playwright/tests/empty/empty.behavior.spec.ts`: all six elements registered; centered column, gap, padding 24px / 48px from 768px, radius; balanced text; header and content max 48ch, centered, gaps; icon media: 40px muted rounded square, 24px svg; primary media has no box; variant reflects and updates; title and description typography and colors in light and dark; description links underlined, primary on hover; no roles or ARIA; axe clean (all stories).
### Known drift
- Description line-height 1.5 (visual reference 1.625).
- No tracking-tight (no token).
- Max width is 48ch (reference: 24rem).
- No built-in border.

## Open questions
None open (Q1, Q2 answered in the contract).

## Spec for agents
Build from contract.json only. CSS uses only `--sb-empty-*` variables (check T4). Tests first.
