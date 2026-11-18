---
component: Breadcrumb
status: beta
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-08
source: visual reference (shadcn/ui Breadcrumb), WAI-ARIA APG breadcrumb pattern, harness process (contract-first standard)
---

# Breadcrumb

> A trail of links from the top of a hierarchy to the current page. A family of seven elements. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Show where the current page sits and let people jump to an ancestor. Not a replacement for primary navigation, and not a history of visited pages.

## 2. Anatomy
`sb-breadcrumb` holds a native `nav` landmark. Inside, `sb-breadcrumb-list` holds `sb-breadcrumb-item` elements and `sb-breadcrumb-separator` marks between them. An item contains a `sb-breadcrumb-link`, the `sb-breadcrumb-page` for the current page, or a `sb-breadcrumb-ellipsis`.

## 3. Props / API
| Element | Prop | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `sb-breadcrumb` | `label` | text | Breadcrumb | name of the landmark |
| `sb-breadcrumb-link` | `href` | text | none | link address; `javascript:`, `vbscript:` and `data:` URLs are dropped (SB-0115) |
| `sb-breadcrumb-ellipsis` | `label` | text | More | read in place of the dots |
| other elements | none | | | content only |

## 4. Variant matrix
None.

## 5. Roles and color
Links and separators use `muted-foreground`; hover turns a link `foreground`. The current page is `foreground`.

## 6. States
Link: hover, focus-visible (solid ring). Current page: not interactive.

## 7. Dimensions and layout
Flex row that wraps; gap 6px, 10px from 640px wide. Separator icon 16px. Ellipsis box is the default control height (36px) with a 16px icon. Text 14px.

## 8. Typography
Body family, 14px, regular weight.

## 9. Accessibility
- Landmark: a native `nav` named by `label`.
- List semantics cannot rely on `ol` and `li`, because the list, items and their content are different custom elements. The list host has `role="list"` and each item host `role="listitem"`; the spec checks the resulting accessibility tree.
- The current page is a span with `role="link"`, `aria-disabled="true"` and `aria-current="page"`. The role is needed because the accessibility tree drops `aria-current` from a generic node (verified). It has no href and is not focusable.
- Separators are `role="presentation"` and `aria-hidden`, so a screen reader counts only the steps.
- The ellipsis keeps a readable label rather than being hidden.
- Links show a solid focus ring on keyboard focus only.

## 10. Usage
### Behavior
Links navigate; the current page and separators do nothing.
### Composition
Link, separator, link, separator, page. Put an ellipsis item (usually followed by a menu in a later component) in place of middle steps on deep trails.
### Choosing the props
Set `label` for the page language. Replace the chevron with a slash by slotting text into the separator.
### Do / Don't
- Do keep the current page last and unlinked. Don't repeat the same landmark name twice on a page.

## Realizations
### Figma
Drawn in the library: one trail (link, separator, collapsed crumbs, separator, current page). Not drawn: link hover and focus, and the wider gap from a wide viewport.
### Web
Complete. `src/components/breadcrumb/`: `Breadcrumb.ts` (`sb-breadcrumb`), `BreadcrumbList.ts`, `BreadcrumbItem.ts`, `BreadcrumbLink.ts`, `BreadcrumbPage.ts`, `BreadcrumbSeparator.ts`, `BreadcrumbEllipsis.ts`; one shared `Breadcrumb.scss`. Parts `nav`, `link`, `page`, `icon`, `label`.
### Coverage
Behavior spec `playwright/tests/breadcrumb/breadcrumb.behavior.spec.ts`: all seven elements registered; navigation landmark named by label; accessibility tree: one list whose semantic children are exactly the steps; separators presentation and aria-hidden, absent from the tree; list and item roles set before first render, no flicker; current page: disabled, unfocusable link node with aria-current=page; links with href, tab order, Enter follows; solid focus ring on keyboard focus only; link, page and hover colors in light and dark; ellipsis label read, icon hidden, 36px box; default 16px chevron and replaced separator; wrapping, gap 6px and 10px from 640px; axe clean (all stories).
### Known drift
- List and item semantics through host roles.
- Separator icon 16px.
- Ellipsis label is read.
- Current page as disabled link role (kept; aria-current on a generic span is not exposed).

## Open questions
None open (Q1 to Q3 answered in the contract).

## Spec for agents
Build from contract.json only. CSS uses only `--sb-breadcrumb-*` variables (check T4). Tests first.
