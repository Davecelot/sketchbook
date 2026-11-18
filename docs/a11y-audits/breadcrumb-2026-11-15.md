# Accessibility audit: Breadcrumb (2026-11-15)

Scope: `spec/components/breadcrumb/contract.json`, `src/components/breadcrumb/*` (seven elements), `playwright/tests/breadcrumb/*`. Standard: WCAG 2.2 AA and the WAI-ARIA APG breadcrumb pattern.

## Criteria

| POUR | Criterion | Result | Evidence |
| --- | --- | --- | --- |
| P | 1.4.3 text contrast, light | Pass | Probe on the default story: link and separator `rgb(115,115,115)` on `rgb(255,255,255)` = 4.74:1; current page `rgb(10,10,10)` = 19.80:1; hover `rgb(10,10,10)`. T6 passes |
| P | 1.4.3 text contrast, dark (`&globals=theme:dark`) | Pass | Link `rgb(161,161,161)` on `rgb(10,10,10)` = 7.66:1; current page `rgb(250,250,250)` = 18.97:1; hover `rgb(250,250,250)` |
| P | 1.4.11 focus ring contrast | Pass | Ring is `box-shadow 0 0 0 3px` in `color.ring`: 4.74:1 light, 7.66:1 dark (measured after the 150ms transition settled) |
| P | 1.4.1 color alone | Pass (advisory) | Links have no underline and differ from the current page by color only (4.18:1 light, 2.48:1 dark between link and page text). The trail is a standalone navigation list, not links inside a block of text, and position (last, not a link, `aria-current`) carries the meaning; see Low finding |
| P | forced-colors | Pass | Probe with `forced-colors: active`: link `rgb(0,0,159)` (LinkText), focus ring `3px solid rgb(0,0,0)` (CanvasText outline from the `focus-ring` mixin), chevron and ellipsis dots stroke `rgb(0,0,0)`, current page `rgb(0,0,0)` on Canvas white |
| P | prefers-reduced-motion | Pass | `transition-duration` computes to `0s` with `reducedMotion: reduce` |
| P | 1.3.2 meaningful sequence, RTL | Pass (fixed) | `dir=rtl`: items and separators lay out right to left; default chevron now computes `matrix(-1,0,0,1,0,0)`; see Fixed |
| O | 2.1.1 / 2.4.3 keyboard, tab order | Pass | CDP tree: links Home and Archive are focusable; Tab visits only the links, in DOM order; current page and ellipsis are not focusable (tabIndex -1 on ellipsis); no trap |
| O | 2.4.7 focus visible | Pass | Solid ring on `:focus-visible` only (spec 'shows a solid focus ring for keyboard focus only'); forced-colors outline above |
| O | 2.5.8 target size (minimum) | Pass (exception) | Link box 38.25x17px, below 24x24, but spacing exception: adjacent targets are 6px gap plus a 16px separator apart, so a 24px circle on each target does not overlap another target. Ellipsis box is 36x36 and not a target here |
| U | 3.2.x predictable, 3.3.x errors | Not applicable | No input or state change; links navigate, page and separators do nothing |
| U | 3.1.2 language of the landmark name | Pass | `label` prop (default Breadcrumb) is the consumer's to localise; contract says so |
| R | Navigation landmark and name | Pass | CDP: `navigation "Breadcrumb"`; spec asserts the label renaming |
| R | Ordered list structure | Pass | CDP: `list` with one `listitem` per step (4 in with-ellipsis); host roles `list`/`listitem` set in `connectedCallback`, before first render (spec). A visible ordered list is `role=list` rather than `ol`, which exposes the same semantics; the item count excludes separators |
| R | Current page | Pass | `span role=link aria-disabled=true aria-current=page`, no href, no tabindex; AX tree exposes `link "Annual report" disabled`, not focusable. `aria-current` is verified from the DOM because Chromium's CDP tree has no `current` property (spec comment) |
| R | Separators hidden from AT | Pass | Host `role=presentation` and `aria-hidden=true`; absent from the CDP tree on default, with-ellipsis and custom-separator stories |
| R | Ellipsis named | Pass | Dots `aria-hidden`; `label` ("More") is read as text in the tree; static text, not a control, matches the contract |
| R | ID references across shadow roots | Not applicable | None; `aria-label` is on the inner `nav` |
| R | axe | Pass | Behavior spec: axe clean on all stories |
| R | Behavior spec, flake check | Pass | `tests/breadcrumb --repeat-each=10` (150 runs, parallel): 150 passed, 0 failed. The hover/focus flake noted in `docs/parity-audits/breadcrumb-2026-11-08.md` did not recur |
| R | `npm run check` | Pass for this component | Fails only G1 (toggle catalog manifest, not this component) and D1/D4 for input, textarea, input-group (known, pending Figma round); nothing for breadcrumb |
| R | Screen-reader evidence | Pass | AX tree above plus the `__screen-reader__` snapshots (check S1) |

## Failures

None open besides the advisory below.

### Fixed: separator chevron did not mirror in RTL - was LOW
Location: `src/components/breadcrumb/Breadcrumb.scss:40`
Before: in `dir=rtl` the default chevron computed `transform: none` and pointed right while the trail flows right to left.
After: `:host(sb-breadcrumb-separator) svg:dir(rtl) { transform: scaleX(-1); }`; re-probe computes `matrix(-1, 0, 0, 1, 0, 0)`; new spec 'the default chevron separator mirrors in right-to-left' passes (tests/breadcrumb 16/16). Slotted custom content is left to the author.

### Low: link affordance is color only, and hover adds no non-color change
Location: `src/components/breadcrumb/Breadcrumb.scss:53-61`
Criterion: 1.4.1 (advisory). Links have `text-decoration: none`; in dark mode the link is 2.48:1 against the current page text, so the distinction is subtle. Not a failure: the links are a standalone navigation list, not inline in text, and the position, separators and `aria-current` convey structure.
Fix (optional): underline on hover and focus, or an underline at rest, using a component token; or leave as designed and record it in `docs/simplicity-debt.md`.

## Verdict
Verdict: ready
Approved-by: Davecelot (2026-11-16)

Semantics, accessibility tree, keyboard, focus ring (4.74:1 and 7.66:1), contrast in both themes, forced colors, reduced motion, axe and the behavior spec (150/150 over 10 parallel repeats, no flake) all pass. The RTL chevron finding is fixed and verified (spec 16/16); only the advisory color-only link note remains and does not block stable.
