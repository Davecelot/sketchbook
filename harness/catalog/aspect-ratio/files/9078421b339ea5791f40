# Accessibility audit: Aspect Ratio (2026-11-15)

Scope: `spec/components/aspect-ratio/contract.json`, `src/components/aspect-ratio/*`, `playwright/tests/aspect-ratio/*`. Standard: WCAG 2.2 AA; no APG pattern (static, non-semantic layout box).

## Criteria

| POUR | Criterion | Result | Evidence |
| --- | --- | --- | --- |
| P | 1.4.11 non-text contrast, 1.4.3 text contrast | Not applicable | Contract declares no contrast pairs and no tokens; the component draws nothing; `npm run check` T6 passes |
| P | 1.4.1 color alone | Not applicable | No color used |
| P | 1.1.1 text alternative | Pass | The slotted `img` keeps its own name: AX tree exposes `image: Striped placeholder`; the box adds no name of its own |
| P | 1.4.4 / 1.4.10 resize and reflow | Pass | Size is `width: 100%` plus `aspect-ratio`, relative to the container (`AspectRatio.scss:11-14`); no fixed px |
| P | forced-colors | Not applicable | No borders, fills or indicators; nothing to lose |
| P | prefers-reduced-motion | Not applicable | No transitions or animation |
| O | 2.1.1 / 2.4.7 / 2.1.2 keyboard, focus, trap | Not applicable | Static; probe: host `role` null, host and `[part=frame]` `tabIndex` -1; behavior spec: first Tab leaves focus on body (no focus stop, no trap) |
| O | 2.5.8 target size | Not applicable | Not interactive (contract: "Not interactive") |
| U | 3.2.x predictable, 3.3.x errors, labels | Not applicable | No input, no name by design |
| R | 4.1.2 role, name, state | Pass | CDP `Accessibility.getFullAXTree` on default and tall-content: no role added by the host or frame (generic only); the child keeps its role and name |
| R | ID references across shadow roots | Not applicable | No ID references or ARIA attributes |
| R | axe | Pass | Behavior spec: axe clean on all 4 stories (default, square, fraction, tall-content) |
| R | Behavior spec and `npm run check` | Pass | 12/12 passed; all checks pass (A1 warn on spec/api.json is unrelated) |
| R | Screen-reader evidence | Pass | AX tree above plus the `__screen-reader__` snapshots (check S1) |

## Failures

None open.

## Verdict
Verdict: ready
Approved-by: Davecelot (2026-11-15)

The box adds no role, no name and no focus stop; the slotted child keeps its semantics (AX tree), sizing is relative, axe, the behavior spec (12/12) and `npm run check` all pass. No open findings.
