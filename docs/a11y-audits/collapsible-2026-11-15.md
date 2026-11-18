# Accessibility audit: Collapsible (2026-11-15)

Scope: `spec/components/collapsible/contract.json`, `src/components/collapsible/*`, `playwright/tests/collapsible/*`. Standard: WCAG 2.2 AA and the WAI-ARIA APG disclosure pattern (native `<button>` in the trigger's shadow root, `aria-expanded`, content hidden by `visibility`).

## Criteria

| POUR | Criterion | Result | Evidence |
| --- | --- | --- | --- |
| P | 1.4.11 focus ring contrast | Pass | Probe of the Open story after Tab: ring `rgb(115,115,115)` on `rgb(255,255,255)` is 4.74:1 (light); `rgb(161,161,161)` on `rgb(10,10,10)` is 7.66:1 (dark, `&globals=theme:dark`); contract pair `collapsible.focus-ring.color` / `color.background` is in T6, which passes |
| P | 1.4.3 text contrast | Pass | Host foreground `rgb(10,10,10)` on white 19.80:1; `rgb(250,250,250)` on `rgb(10,10,10)` 18.97:1 |
| P | 1.4.1 color alone | Pass | State is carried by `aria-expanded` and the visible panel; the disabled state is also native `disabled` |
| P | forced-colors | Pass | `forced-colors: active`: focus ring is `outline: solid 3px` CanvasText (box-shadow `none`); text computes to CanvasText on Canvas; `Collapsible.scss` has the `focus-ring` forced-colors rule |
| P | prefers-reduced-motion (2.3.3) | Pass | With `reducedMotion: reduce` the content `transition-duration` computes to `0s` (0.2s otherwise); behavior spec covers it |
| O | 2.1.1 keyboard (Enter, Space) | Pass | Real presses on the Default story: Tab focuses the trigger, Enter opens (`open=true`, `aria-expanded=true`, focus stays on the trigger), Space closes |
| O | 2.4.7 focus visible | Pass | `:focus-visible` matches after Tab; 3px ring from `--sb-collapsible-focus-ring-*`; the spec checks it shows for keyboard focus only |
| O | 2.1.2 no keyboard trap | Pass | Tab leaves the trigger; open: trigger, link "More about this order", then the document; closed: one stop |
| O | Closed content out of tab order and AX tree | Pass | Closed: `[part=content]` is `visibility: hidden`; Tab visits only the trigger and AX tree has no link or items; open: the link is in the tab order and the AX tree |
| O | Disabled | Pass | Native `disabled`: AX `disabled=true`, Tab skips it, a forced click leaves `open=false`, opacity from `--sb-collapsible-disabled-opacity` |
| O | 2.5.8 target size | Pass | Trigger button measures 24x24 (icon) and 124x24 (text trigger); `--sb-collapsible-trigger-min-size` is `size.control.xs` |
| U | 3.2.x predictable | Pass | Focus and hover do nothing; only an explicit activation toggles; `toggle` event fires after the change |
| U | Accessible name | Pass | CDP AX: icon trigger is `button "Toggle details"` (forwarded `aria-label`); text trigger is `button "Show more options"`; the `<svg>` is `aria-hidden` |
| R | 4.1.2 role, name, state | Pass | `button` with `expanded=false` closed and `expanded=true` open; `disabled=true` on the Disabled story; the content host has no role by design |
| R | aria-controls across shadow roots (SB-0009) | Pass (documented limit) | The inner button's `ariaControlsElements` has 1 element (content host, light DOM) and no ID attribute is used. Chromium's AX tree does not list a `controls` relation (the plain content host has no accessibility node), as `contract.json` accessibility.aria already states; `aria-expanded` carries the state, so nothing is lost for users |
| R | aria-controls with late content | Pass | Parity item 1 (2026-11-08) is fixed (bcf116e): `RelinkController` re-resolves on child changes; spec 'content added after the trigger is wired' passes |
| R | aria-labelledby / aria-describedby on the trigger | Pass (documented) | Only `aria-label` is forwarded (parity item 2); `contract.json` accessibleNameSource and `CollapsibleTrigger.ts:10` say so (SB-0009) |
| R | axe | Pass | Behavior spec: no violations, closed or open |
| R | Behavior spec and `npm run check` | Pass | `tests/collapsible` 14/14 passed; the only failing checks are D1 and D4 for input, textarea and input-group (known, pending the Figma round); no check names Collapsible |
| R | Screen-reader evidence | Pass | AX tree above plus the `__screen-reader__` snapshot (check S1) |

## Failures

None open.

Observations, not failures:
- `ariaControlsElements` is not surfaced as a `controls` relation in Chromium's AX tree; recorded in the contract, no user-visible effect with `aria-expanded` present.
- `<strong>` in the story header has no name in the AX tree (story markup, not component code).

## Verdict
Verdict: ready
Approved-by: Davecelot (2026-11-16)

Semantics (native button, `aria-expanded`, forwarded `aria-label`), real Enter and Space toggling, hidden content absent from the tab order and AX tree, disabled, 24px target, focus ring in light, dark and forced colors, reduced motion, axe and the 14/14 behavior spec all pass. The earlier parity items are fixed. No open findings.
