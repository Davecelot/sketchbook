# Accessibility audit: Button Group (2026-11-15)

Scope: `spec/components/button-group/contract.json` and `contract.md`, `src/components/button-group/*` (group, separator and text elements), `playwright/tests/button-group/*`. Standard: WCAG 2.2 AA and the WAI-ARIA `group` role (not a roving composite: the contract says buttons stay individual tab stops).

## Criteria

| POUR | Criterion | Result | Evidence |
| --- | --- | --- | --- |
| P | 1.4.11 focus ring contrast | Pass (fixed) | Re-probe on `default` (3 outline buttons): focused `box-shadow` is `rgb(115,115,115) 0 0 0 3px` in light and `rgb(161,161,161) 0 0 0 3px` in dark on every button |
| P | 1.4.11 joined borders | Pass | Outline buttons share one 1px line (behavior spec); text cell border is not a control (contract, Known drift) |
| P | 1.4.1 color alone | Pass | Grouping is by position and border, not color |
| P | forced-colors, buttons and text cell | Pass | `forced-colors: active`, light and dark: button and text-cell borders compute to `rgb(0,0,0)` 1px on Canvas white |
| P | forced-colors, separator | Pass (fixed) | Re-probe `with-separator`, `forced-colors: active`, light and dark: separator background `rgb(0,0,0)` (CanvasText); rule at `ButtonGroup.scss:81-83` |
| P | prefers-reduced-motion | Not applicable | No transitions in this component (Button owns its own) |
| O | 2.1.1 Tab order | Pass | Probe on default, vertical, rtl, with-separator, single: Tab visits each button once in DOM order then leaves; separator and text cell are never tab stops; hosts `tabIndex` -1 |
| O | No roving composite | Pass | ArrowRight on a focused button leaves focus unchanged, as the contract says |
| O | 2.1.2 no trap | Pass | Tab exits after the last button in every story |
| O | 2.4.7 focus visible | Pass (fixed) | See the focus ring row |
| O | 2.4.11 ring not clipped by neighbours | Pass | Focused child host computes `position: relative` (`::slotted(:focus-within)`); filled-button ring paints over the separator and the neighbour in the screenshot |
| O | 2.5.8 target size | Pass | Buttons are 36px high (Button contract); the icon-only button in `with-separator` is the Button's `icon` size |
| O | orientation | Pass | `vertical` flows as a column, positions and rounded corners swap, separator turns horizontal (behavior spec); `data-orientation` kept current |
| U | 3.2.x predictable, labels | Pass | Group never changes what children do; console warning when the host has no `aria-label` (behavior spec) |
| R | 4.1.2 group role and name | Pass | CDP `Accessibility.getFullAXTree`: `group "Message actions"` containing the buttons on all stories with buttons |
| R | Separator hidden | Pass | `[part=separator]` has `aria-hidden="true"`; no `separator` node in the AX tree for `with-separator` |
| R | Text cell | Pass | Plain text, not focusable, not a control; contract Known drift covers its border |
| R | ID references across shadow roots | Pass | Only `aria-label` is forwarded (SB-0009); no ID references |
| R | axe | Pass | Behavior spec: axe clean on default, vertical, with-text, with-separator |
| R | Behavior spec and `npm run check` | Pass | 17/17 passed (includes the new forced-colors separator test); all checks pass (A1 warn on spec/api.json is unrelated) |

## Failures

None open.

### Fixed: outline buttons lost their focus ring inside the group - was HIGH
Location: `src/components/button/Button.scss` (outline variant).
Before: focused outline buttons computed the elevation shadow only (`rgba(0,0,0,0.05) 0 1px 2px`); no ring in the screenshot.
After: outline variant restates the ring on `:focus-visible`; probe shows the 3px ring on all three outline buttons in light and dark; the Button spec now checks every variant.

### Fixed: separator disappeared in forced-colors mode - was MEDIUM
Location: `src/components/button-group/ButtonGroup.scss:81`.
Before: separator background `rgb(255,255,255)` (Canvas), invisible.
After: `rgb(0,0,0)` (CanvasText) in light and dark; new behavior spec 'separator stays visible in forced colors'.

### Fixed: contract coverage count stale - was LOW
`contract.md` Coverage now says 17 tests, matching the run.

## Verdict
Verdict: ready
Approved-by: Davecelot (2026-11-16)

Both accessibility findings are fixed and re-verified; semantics, tab order, hidden separators, orientation, ring raising, axe, the behavior spec (17/17) and `npm run check` all pass. No open findings.
