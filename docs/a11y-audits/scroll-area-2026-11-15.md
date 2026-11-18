# Accessibility audit: Scroll Area (2026-11-15)

Scope: `spec/components/scroll-area/contract.json`, `src/components/scroll-area/*`, `playwright/tests/scroll-area/*`. Standard: WCAG 2.2 AA; no APG composite pattern (a native scroll container made focusable, exposed as a named `region` while it overflows). The parity audit of 2026-11-08 (reparenting broke the resize check, WCAG 2.1.1) was re-probed: fixed in f317e16 and covered by the spec 'overflow is still detected after the element is moved in the DOM'.

## Criteria

| POUR | Criterion | Result | Evidence |
| --- | --- | --- | --- |
| P | 1.4.11 thumb contrast, light | Pass | `scrollbar-color` computes `rgb(115, 115, 115)` on Canvas `rgb(255, 255, 255)`: 4.74:1 |
| P | 1.4.11 thumb contrast, dark (`&globals=theme:dark`) | Pass | thumb `rgb(115, 115, 115)` on `rgb(10, 10, 10)`: 4.18:1 |
| P | 1.4.11 focus ring | Pass | Ring token `#737373` on white 4.74:1 (light), `#a1a1a1` on `rgb(10, 10, 10)` (dark) well above 3:1; ring is visible in the keyboard-focus screenshot |
| P | 1.4.1 color alone | Not applicable | Scrollbar is native; nothing conveyed by color |
| P | forced-colors | Pass | `forced-colors: active`: `scrollbar-color` computes `auto` (system colors), `scrollbar-width` thin; focus ring becomes `3px solid rgb(0, 0, 0)` (CanvasText) via `_a11y.scss` mixin. Headless Chromium draws overlay scrollbars, so the painted bar itself could not be seen; the native bar uses system colors under `auto` |
| P | prefers-reduced-motion | Pass | `scroll-behavior: auto`, no transition or animation; scrolling is native |
| P | 1.4.10 reflow (320 CSS px) | Pass | default, horizontal and both-axes stories at 320px: document scrollWidth 320 = clientWidth; horizontal overflow is contained inside the region (2.1.1-reachable by keyboard) |
| O | 2.1.1 keyboard, scrollable content with no focusable children | Pass | Tab lands on the viewport (`tabindex=0`, focused confirmed) in default, horizontal and both-axes; `nothing-to-scroll` has no tabindex and no region |
| O | Arrow, Page, Home, End scroll | Pass | default: ArrowDown scrollTop 40, PageDown 215, End 910, Home 0, ArrowUp 0; horizontal: ArrowRight scrollLeft 40, ArrowLeft 0; both-axes: both axes move, ArrowRight 40, ArrowDown 40 |
| O | 2.4.7 / 2.4.11 focus visible | Pass | `:focus-visible` box-shadow ring, `outline` in forced colors; ring is on the viewport and not clipped (screenshot) |
| O | 2.1.2 no trap | Pass | Native scroller; Tab leaves it |
| O | 2.5.8 target size | Not applicable | Scrollbar is the browser's (contract: thin); content scrollable by wheel, keys and touch, no pointer-only target |
| U | 3.2.x, 3.3.x | Not applicable | No input or errors; missing label warns once in the console (behavior spec) |
| R | 4.1.2 role, name | Pass | CDP AX tree: one `region` named "Release notes" per scrollable story; no region on `nothing-to-scroll` |
| R | Overflow re-check after move, resize, content change | Pass | Behavior specs ('re-checked when content grows or shrinks', 'still detected after the element is moved') |
| R | ID references across shadow roots | Not applicable | `aria-label` is set directly on the inner viewport from `label` |
| R | axe | Pass | Behavior spec axe test passes |
| R | Behavior spec | Pass | `SKETCHBOOK_PORT=6117 playwright test tests/scroll-area`: 11/11 passed |
| R | `npm run check` | Pass for this component | Only G1 (catalog files of components being fixed concurrently), D1 and D4 (input, textarea, input-group) fail; T6, S1, A-checks for scroll-area pass |
| R | Screen-reader evidence | Pass | AX tree above plus `__screen-reader__/scroll-area-focused.txt` (check S1) |

## Failures

None.

Note (not a failure): an unlabeled scrollable area stays focusable but is not a region (contract-defined) and warns once in dev; callers must pass `label`.

## Verdict
Verdict: ready
Approved-by: Davecelot (2026-11-16)

Keyboard access (focusable region with native arrow, Page, Home and End scrolling on all three axis stories), role and name, thumb and ring contrast in light and dark, forced colors, reduced motion and 320px reflow all pass; the parity audit's reparenting defect is fixed and tested. No open findings.
