# Accessibility audit: Accordion (2026-11-15)

Scope: `spec/components/accordion/contract.json`, `src/components/accordion/*` (Accordion, AccordionItem, AccordionTrigger, AccordionContent), `playwright/tests/accordion/*`. Standard: WCAG 2.2 AA and the WAI-ARIA APG Accordion pattern. Probed live in Chromium against the Storybook dev server (real key presses, CDP `Accessibility.getFullAXTree`, `emulateMedia`).

## Criteria

| POUR | Criterion | Result | Evidence |
| --- | --- | --- | --- |
| P | 1.4.3 text contrast, light and dark | Pass | Check T6 passes (`accordion.fg` on `color.background`). Computed: light `rgb(10,10,10)` on white, dark `rgb(250,250,250)` on `rgb(10,10,10)` (`&globals=theme:dark`) |
| P | 1.4.11 chevron and focus ring, light and dark | Pass | T6 `ui` pairs pass. Computed chevron and ring: light `#737373` on white (4.7:1), dark `#a1a1a1` on `#0a0a0a` (about 7.9:1) |
| P | 1.4.1 color alone | Pass | Open state also rotates the chevron and sets `aria-expanded`; hover adds underline |
| P | forced-colors | Pass | `forced-colors: active`: chevron computes `rgb(0,0,0)` (ButtonText), focused trigger `outline: 3px solid`, item divider `1px solid rgb(0,0,0)` |
| P | prefers-reduced-motion (2.3.3) | Pass | `reduce`: `transition-duration` is `0s` on the panel grid, the host visibility and the chevron; `no-preference`: `0.2s` |
| P | 1.3.1 heading wrapping a button | Pass | AX tree: `heading level=3` > `button expanded=false/true`; story `DisabledItem` sets `level="2"`; spec covers clamp to 2-6 |
| P | Chevron hidden from AT | Pass | `svg[part=chevron]` has `aria-hidden="true"` (probe); button name is the trigger text only |
| O | 2.1.1 Enter / Space toggle | Pass | Live: Enter opened (`aria-expanded=true`), Space closed it, on the focused trigger |
| O | 2.1.1 Tab order | Pass | Tab from outside: Shipping, Returns, Warranty, then the next control; every trigger stays in the tab order (APG); no trap |
| O | 2.1.1 Arrow, Home, End (bound in contract) | Pass | Live: ArrowDown Shipping to Returns to Warranty and wraps to Shipping; ArrowUp wraps back; End goes to Warranty; Home goes to Shipping |
| O | Single vs multiple, collapsible | Pass | `single`: opening Returns moved value to `item-2` (one open); `multiple`: Shipping and Warranty both open, two regions in AX tree; not collapsible: open trigger `aria-expanded=true aria-disabled=true`, Enter leaves value `item-1` |
| O | 2.4.7 / 2.4.11 focus visible | Pass | Keyboard focus: `:focus-visible`, `box-shadow 3px` in token color (outline none by design, outline in forced colors); ring is on the button, not clipped by item |
| O | 2.5.8 target size | Pass | Trigger button 450 x 52 px |
| O | Disabled item | Pass | Skipped by arrows and Tab (spec); disabled accordion dims every trigger (spec) |
| U | 3.2.x predictable | Pass | Focus and arrows never toggle; only Enter, Space or click toggle |
| R | 4.1.2 name, role, state | Pass | Button name from slotted text, `expanded` state mirrors item; locked trigger `aria-disabled` |
| R | aria-controls / region labelled by trigger across shadow roots (SB-0009) | Pass | `ariaControlsElements` and `ElementInternals.ariaLabelledByElements` (element references, no IDs); AX: `region` named "Shipping" for an open item; renaming the trigger text to "Changed" renamed the region live |
| R | Hidden panels out of the AX tree | Pass | Closed: AX tree has only headings and buttons, no regions; panels are `visibility: hidden` |
| R | axe | Pass | Behavior spec: axe clean on the main stories |
| R | Behavior spec and `npm run check` | Pass | 21/21 passed; all checks pass for accordion (D1/D4 fail only for input, textarea and input-group, pending Figma) |

## Fixed: stale `aria-label` fallback (was low; docs/simplicity-debt.md, parity audit item 3)

Before: `AccordionContent.ts` copied the trigger text into `aria-label` once, only where `ariaLabelledByElements` is missing, so the copy went stale when the trigger text changed. In Chromium the property exists, so the fallback never ran there.
After: a shared `LabelledByController` (`src/controllers/labelled-by.ts`) observes the trigger text and refreshes the copy; an author's `aria-label` wins.
Re-probe in Chromium (trigger renamed after opening):
- Normal path (property present): no `aria-label` attribute written; region name "Shipping" became "Renamed" live.
- Property deleted from `ElementInternals.prototype` before the element is created (`supported: false`): `aria-label` "Shipping" became "Renamed", and the AX region name followed.
Behavior spec now 21/21 (includes 'without element references, the copied region name follows trigger text changes').

## Failures

None.

## Verdict
Verdict: ready
Approved-by: Davecelot (2026-11-16)

Heading, button, `aria-expanded`, `aria-controls` and the labelled region work across shadow roots; Enter, Space, Tab, arrows, Home and End behave as the APG describes (live key presses); single, multiple and collapsible modes behave as contracted; contrast passes in light and dark; focus ring, reduced motion and forced colors are handled; 21/21 behavior specs and `npm run check` pass for accordion. The aria-label fallback staleness is fixed and re-probed on both paths.
