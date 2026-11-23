---
component: Pagination
status: stable
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-08
source: shadcn/ui (visual reference and names), WAI-ARIA APG landmark and list patterns
---

# Pagination

> Navigation between pages of a long list. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Move between numbered pages of results that live at their own addresses. It is navigation (links), not a widget that changes content in place.

## 2. Anatomy
`sb-pagination` (native `nav`, part `nav`) > `sb-pagination-content` (list) > `sb-pagination-item` (list item) > one of `sb-pagination-link` (part `link`), `sb-pagination-previous`, `sb-pagination-next` (parts `link`, `icon`, `text`) or `sb-pagination-ellipsis` (parts `icon`, `text`).

## 3. Props / API
| Element | Prop | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `sb-pagination` | `label` | text | pagination | landmark name |
| `sb-pagination-link` | `href` | text | none | target; `javascript:`, `vbscript:` and `data:` URLs are dropped (SB-0115) |
| `sb-pagination-link` | `active` | boolean | false | current page |
| `sb-pagination-link` | `size` | icon, medium | icon | square or padded |
| `sb-pagination-previous`, `-next` | `href`, `label` | text | none, "" | without `label` the slotted text names the link; with no text, "Go to previous page" / "Go to next page"; `javascript:`, `vbscript:` and `data:` URLs are dropped (SB-0115) |
| `sb-pagination-ellipsis` | `label` | text | More pages | visually hidden |

## 4. Variant matrix
None; the current page is a state (`active`).

## 5. Roles and color
Links are transparent with `foreground` text; hover uses `accent` / `accent-foreground`; the current page has a `background` fill, a `border` outline and a small shadow.

## 6. States
hover, active (current page), focus-visible (3px solid ring).

## 7. Dimensions and layout
36px square number links, 36px high previous and next with 10px side padding and a 4px gap, 4px between items, radius `radius.control`. Content is a centered flex row.

## 8. Typography
14px, weight 500, control type tokens.

## 9. Accessibility
- Native `nav` with an accessible name; list and list item roles on the hosts.
- The current page link has `aria-current="page"`.
- Previous and next are named by their slotted text when `label` is not set, so the visible text is always inside the name (WCAG 2.5.3). With no slotted text they show "Previous" / "Next" and are named "Go to previous page" / "Go to next page". An explicit `label` overrides the name; keep the visible text inside it. The content and item hosts keep an author `role`.
- The ellipsis is `aria-hidden`, and so is a `sb-pagination-item` that holds only an ellipsis, so the list announces no empty item.
- Chevrons mirror in right-to-left.

## 10. Usage
### Behavior
Every link navigates through its `href`. Mark exactly one link `active`.
### Composition
Previous, numbered links, ellipsis where pages are skipped, next. Leave out previous or next at the ends.
### Choosing the props
Translate `label` values for the page language. Use `size="medium"` for a word link such as "First".
### Do / Don't
- Do give every link an `href` (a link without one is not focusable and is not a link; it warns once in the console). Do not use it for in-place tab switching.

## Realizations
### Figma
Drawn in the library: previous, three pages (the first current), the collapsed-pages box and next. Not drawn: link hover and focus.
### Web
Complete. src/components/pagination/Pagination.ts, src/components/pagination/PaginationContent.ts, src/components/pagination/PaginationItem.ts, src/components/pagination/PaginationLink.ts, src/components/pagination/PaginationPrevious.ts, src/components/pagination/PaginationNext.ts, src/components/pagination/PaginationEllipsis.ts. Parts: nav, link, icon, text.
### Coverage
- navigation landmark, list, listitems; label renames the landmark
- native links with href
- active: aria-current and outlined look from tokens
- previous and next names, visible text, translated labels
- ellipsis aria-hidden, text kept, absent from the accessibility tree
- sizes 36px
- hover tokens
- Tab order, Enter, keyboard-only ring
- forwarded aria-label
- chevrons mirror in rtl
- axe clean
### Known drift
- link implementation: the visual reference composes its Button; sb-button cannot forward aria-current to its inner link
- active outline: the visual reference uses the border color, which is below 3:1 (WCAG 1.4.11)
- focus ring: the visual reference uses a translucent ring
- active link hover: same as the reference

## Open questions
All answered; see contract.json.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-pagination-*` variables (check T4). Tests first (rule test-first).
