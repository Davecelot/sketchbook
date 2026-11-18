# Accessibility audit: Pagination (2026-11-15)

Scope: `spec/components/pagination/contract.json`, `src/components/pagination/*` (Pagination, Content, Item, Link, Previous, Next, Ellipsis), `playwright/tests/pagination/*`. Standard: WCAG 2.2 AA, WAI-ARIA landmark and list patterns. Probes: Chromium via CDP `Accessibility.getFullAXTree` and computed styles on the live `default` and `translated-labels` stories, light and dark (`&globals=theme:dark`), `forcedColors: active`.

## Criteria

| POUR | Criterion | Result | Evidence |
| --- | --- | --- | --- |
| P | 1.4.3 text contrast, light and dark | Pass | Link text `rgb(10,10,10)` on white and `rgb(250,250,250)` on `rgb(10,10,10)`; hover `rgb(23,23,23)` on `rgb(245,245,245)` and `rgb(250,250,250)` on `rgb(38,38,38)`; `check` T6 passes |
| P | 1.4.11 focus ring | Pass | Ring `rgb(115,115,115)` on white (about 4.7:1), `rgb(161,161,161)` on `rgb(10,10,10)` (about 7.5:1) |
| P | 1.4.11 current-page outline | Pass | Border `rgb(115,115,115)` on white (about 4.7:1) and on `rgb(10,10,10)` (about 4:1) |
| P | 1.4.1 / 1.4.11 current page in forced colors | Pass (fixed) | Re-probe: current page computes `color` white on a `Highlight` fill and border, the other links stay outlined `rgb(0,0,159)`; screenshot shows page 2 filled and readable |
| P | prefers-reduced-motion | Pass | `respect-reduced-motion` mixin on the link transition |
| P | forced-colors focus | Pass | `outline: 3px solid` on the focused link (`FORCEDFOCUS` probe) |
| O | 2.1.1 / 2.4.3 Tab order | Pass | Tab visits previous, 1, 2, 3, next in DOM order, then leaves the component; no trap; Enter follows the href (spec) |
| O | 2.4.7 focus visible on every variant | Pass | Polled computed `box-shadow` is `0 0 0 3px <ring>` on previous, plain link, current-page link and next, in light and dark; `:host([active]) [part=link]:focus-visible` (`Pagination.scss:74-86`) restores the ring after the active shadow, so no variant rule overrides it |
| O | 2.5.8 target size | Pass | Links 36x36, previous 99x36, next 73x36 (translated: 95x36, 104x36, 39x36) |
| U | 3.2.x / 3.3.x | Not applicable | Links only, no input |
| U | 2.5.3 label in name | Pass | Previous/Next without `label` and with slotted "Anterior": no aria-label, the slot text names the link; slot emptied at runtime reverts to "Go to previous page"; translated story names ("Ir a la página anterior", "Ir a la página siguiente") contain the visible word |
| R | 4.1.2 landmark and name | Pass | AX: `navigation "pagination"`; with `label="paginación"`: `navigation "paginación"` |
| R | 1.3.1 list structure | Pass (fixed) | AX: `list` with five `listitem` for five links; the item holding only the ellipsis is `aria-hidden` |
| R | Current page | Pass | `aria-current="page"` on the inner `a` of the `active` link; `active` link also exposed as `link "2"` |
| R | Prev/Next names | Pass | `link "Go to previous page"`, `link "Go to next page"` |
| R | Disabled at the ends | Not applicable | No disabled state by contract: previous or next is left out at the ends (contract.md section 10); nothing focusable and inert remains |
| R | Ellipsis | Pass | Host `aria-hidden="true"`, absent from the AX tree |
| R | Author `role` on Content/Item | Pass (fixed since parity audit) | `role="presentation"` and `role="none"` on content and item survive; spec covers it |
| R | Link without `href` | Pass (fixed) | Console warning "has no href, so it is not a link. Set href." per element; none when href is set |
| R | ID references across shadow roots | Not applicable | Only `aria-label` is forwarded; no ID references |
| R | axe | Pass | Behavior spec axe test clean |
| R | Behavior spec and `check` | Pass | 18/18 passed (`--workers=2`, includes the forced-colors, missing-href and ellipsis-item specs); `check` fails only D1/D4 for input, textarea, input-group (known, pending Figma round) |
| R | Parity-audit hardening items | Pass | Item 1 (label in name): fixed, slot-derived name; item 2 (role overwrite): fixed; item 3 (no href): fixed (warning); item 4 (shadow polling): fixed, the spec polls and uses reduced motion |

## Failures

None open.

### Fixed: current page indistinguishable in forced colors - was MEDIUM
Location: `src/components/pagination/Pagination.scss:81`
Before: links 1, 2 (current) and 3 all computed `rgb(0,0,159)` text and border, 1px; the current page differed only by a Canvas fill, so it looked identical.
After: `@media (forced-colors: active)` on `:host([active]) [part='link']` sets `forced-color-adjust: none`, `Highlight` border and fill, `HighlightText`; probe shows page 2 `rgb(255,255,255)` on a Highlight fill while 1 and 3 stay outlined; screenshot confirms; the new spec passed after being seen failing; tests/pagination 16/16.

### Fixed: link without `href` is silently inert - was LOW
Location: `src/components/pagination/PaginationLink.ts`
Before: no feedback; the `<a>` had no href, was skipped by Tab and had no link role.
After: probe logs `<sb-pagination-link> has no href, so it is not a link. Set href.` for each href-less link (two links, two warnings, once per element) and nothing for a link with href; spec 'warns once when a link has no href' passes.

### Fixed: ellipsis leaves an empty list item - was LOW
Location: `src/components/pagination/PaginationItem.ts`
Before: six `listitem` for five links.
After: AX tree has 5 `listitem` and 5 `link`; the item holding only the ellipsis has `aria-hidden="true"`, the others none; replacing its child with a link removes the attribute and putting the ellipsis back sets it; spec passes.

## Verdict
Verdict: ready
Approved-by: Davecelot (2026-11-16)

All findings are fixed and re-probed in the browser (forced-colors fill, missing-href warning, five list items), tests/pagination 18/18, `check` fails only the known D1/D4. No open findings.
