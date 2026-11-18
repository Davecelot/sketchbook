# Accessibility audit: Toggle Group (2026-11-15)

Scope: `spec/components/toggle-group/contract.json`, `src/components/toggle-group/*`, `playwright/tests/toggle-group/*`. Standard: WCAG 2.2 AA, WAI-ARIA APG toolbar and toggle button patterns (items are `aria-pressed` buttons in both types, contract Q1).

## Criteria

| POUR | Criterion | Result | Evidence |
| --- | --- | --- | --- |
| P | 1.4.3 text contrast | Pass | `npm run check` T6 passes for the contract pairs, light and dark |
| P | 1.4.11 focus ring contrast | Pass | Ring `rgb(115,115,115)` on white 4.74:1 (light), `rgb(161,161,161)` on `rgb(10,10,10)` 7.66:1 (dark, `&globals=theme:dark`); measured on default, outline joined, vertical, multiple, variants, with-text, rtl and disabled-item, on pressed and unpressed items |
| P | 1.4.11 / 1.4.1 pressed state | Pass (fixed) | Pressed item has a 1px `on.border` (foreground): `rgb(10,10,10)` on white 19.8:1 (light), `rgb(250,250,250)` on `rgb(10,10,10)` 18.97:1 (dark), on default, outline joined, spacing and vertical; unpressed stays transparent or `rgb(115,115,115)`; screenshots checked |
| P | 1.4.11 outline border | Pass | `outline.border` on background is a T6 pair (`ui`) |
| P | forced-colors, focus | Pass | Focused item gets `outline: 3px solid CanvasText` on every story |
| P | forced-colors, pressed state | Pass (fixed) | Re-probe `forced-colors: active` on `multiple`: pressed items bg `rgba(5,0,73,0.8)` (Highlight) with fg `rgb(255,255,255)` (HighlightText); unpressed transparent with `rgb(0,0,0)`; screenshot confirms |
| P | forced-colors, joined borders | Pass | Probe: every item keeps a 1px `CanvasText` border; shared edge is drawn once (0px inline-start on later items, vertical uses block-start) |
| P | prefers-reduced-motion | Pass | `a11y.respect-reduced-motion` on the transition (source) |
| O | 2.1.1 Tab order, roving stop | Pass | Live: Tab from a button before the group lands on the first pressed item (multiple story: bold), else the first item; Tab again exits to the next button, Shift+Tab returns to the same item; no trap |
| O | Arrows, wrap, Home/End | Pass | Live, default: Right bold, italic, underline, wraps to bold; Left wraps back; End underline, Home bold; Up/Down do nothing in horizontal |
| O | RTL reversal | Pass | `rtl` story: ArrowRight from bold goes to underline, then italic; ArrowLeft goes forward |
| O | Vertical | Pass | Down/Up move and wrap, Left/Right do nothing, Home/End work |
| O | Space / Enter toggle | Pass | Single: Space presses, Enter clears; multiple: Space clears one of the pressed, Enter presses it again; arrows never press |
| O | Disabled items | Pass | `disabled-item` story: arrows and Home/End skip Center; `disabled` and fieldset stories covered by the behavior spec |
| O | 2.4.7 focus visible, all variants | Pass (fixed) | Re-probe: 3px ring on every item of default, outline, spacing, vertical, light `rgb(115,115,115)` and dark `rgb(161,161,161)` |
| O | 2.5.8 target size | Pass | Items measure 32 (sm), 36 (default), 40 (lg) px square or wider |
| U | 3.3.2 labels, 3.2.x predictable | Pass | Group `aria-label` forwarded; icon-only items carry `aria-label` in stories; once-per-element console warning for a missing name; focus never changes selection |
| R | 4.1.2 role, name, state | Pass | CDP `Accessibility.getFullAXTree` on `default`: `group` "Text formatting"; three `button`s "Bold", "Italic", "Underline" with `pressed=false`; pressed flips with value |
| R | ID references across shadow roots | Pass | Only `aria-label` is forwarded (SB-0009) |
| R | axe | Pass | Behavior spec: axe clean on every story |
| R | Behavior spec | Pass | 27/27 passed (`--workers=2`; includes the spacing focus-ring, forced-colors pressed and pressed-border specs) |
| R | `npm run check` | Fail (unrelated) | D1 and D4 fail for input, textarea, input-group (pending Figma round); G1 also fails (1), not from toggle-group files; T6 and all toggle-group checks pass |

## Failures

None open.

### Fixed: pressed state not distinguishable by contrast - was MEDIUM
Location: `src/components/toggle-group/ToggleGroup.scss` pressed rule; token `toggle-group.on.border`
Before: pressed differed only by fill, 1.09:1 against the page in light, 1.30:1 in dark.
After: a pressed item gets a 1px `color.foreground` border, 19.8:1 light and 18.97:1 dark against the page; the pair is in `accessibility.contrast` (T6 passes). Looked at screenshots: in the joined outline group the pressed item's shared edge toward its neighbour stays the neighbour's grey `rgb(115,115,115)` (4.7:1 light, still above 3:1) while the other edges are dark, so it reads as selected; in the spaced group the pressed item is fully outlined; in the default joined group two adjacent pressed items show a 2px divider. Observation only, not a failure.

### Fixed: no focus ring on outline with `spacing` > 0 - was MEDIUM
Location: `src/components/toggle-group/ToggleGroup.scss:169`
Before: focused `box-shadow` on the `spacing` story computed to `rgba(0,0,0,0.05) 0 1px 2px 0` (light and dark), no ring.
After: `[part='button'][data-variant='outline']:not([data-joined]):focus-visible` restates the ring; probe shows `rgb(115,115,115) 0 0 0 3px` light and `rgb(161,161,161) 0 0 0 3px` dark on all three items; spec added and passing.

### Fixed: pressed state invisible in forced colors - was MEDIUM
Location: `src/components/toggle-group/ToggleGroup.scss:109`
Before: pressed and unpressed both computed Canvas bg, CanvasText fg.
After: pressed items compute Highlight bg and border with HighlightText; unpressed unchanged; focused pressed item keeps its outline; spec added and passing.

## Verdict
Verdict: ready
Approved-by: Davecelot (2026-11-16)

All three findings are fixed and verified: spacing focus ring, forced-colors pressed state and the pressed border (27/27 spec; T6 passes). No open findings.
