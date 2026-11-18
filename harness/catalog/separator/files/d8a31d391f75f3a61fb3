# Accessibility audit: Separator (2026-11-15)

Scope: `spec/components/separator/contract.json`, `src/components/separator/*`, `playwright/tests/separator/*`. Standard: WCAG 2.2 AA and the WAI-ARIA `separator` role (static, non-focusable).

## Criteria

| POUR | Criterion | Result | Evidence |
| --- | --- | --- | --- |
| P | 1.4.11 non-text contrast | Not applicable | Contract Q2: decorative divider, no contrast pair; `npm run check` T6 passes |
| P | 1.4.1 color alone | Pass | Line conveys nothing by color |
| P | forced-colors | Pass (fixed) | Re-probe with `forced-colors: active`: `[part=line]` background computes to `rgb(0, 0, 0)` (CanvasText) on all four stories, against Canvas white; `Separator.scss:21-25` has the `forced-colors` rule |
| P | prefers-reduced-motion | Not applicable | No transitions or animation |
| P | 1.3.1 info and relationships | Pass | `decorative=false` exposes `separator` with orientation in the AX tree |
| O | 2.1.1 / 2.4.7 / 2.1.2 keyboard, focus, trap | Not applicable | Static; host `tabIndex` is -1 (probe), no focusable parts, no trap |
| O | 2.5.8 target size | Not applicable | Not interactive |
| U | 3.2.x predictable, 3.3.x errors, labels | Not applicable | No input, no name by design |
| R | 4.1.2 role, name, state | Pass | CDP `Accessibility.getFullAXTree`: default and vertical stories expose no separator; `semantic` exposes `separator` `orientation=horizontal`; `semantic-vertical` exposes `orientation=vertical` |
| R | Role from first render | Pass | `willUpdate` sets role before first render; behavior spec covers it |
| R | ID references across shadow roots | Not applicable | No ID references; role and aria-orientation set on the host |
| R | axe | Pass | Behavior spec: axe clean on all 4 stories |
| R | Behavior spec and `npm run check` | Pass | 14/14 passed (includes new 'stays visible in forced colors'); all checks pass (A1 warn on spec/api.json is unrelated) |
| R | Screen-reader evidence | Pass | AX tree above plus the `__screen-reader__` snapshots (check S1) |

## Failures

None open.

### Fixed: line disappeared in forced-colors mode - was MEDIUM
Location: `src/components/separator/Separator.scss:21`
Before: computed background `rgb(255, 255, 255)` (Canvas) in forced colors, so the line was invisible.
After: `@media (forced-colors: active) { background: CanvasText; }` on `[part='line']`; probe shows `rgb(0, 0, 0)` on default, vertical, semantic and semantic-vertical; behavior spec covers it; `npm run check` passes.

## Verdict
Verdict: ready
Approved-by: Davecelot (2026-11-15)

The forced-colors finding is fixed and verified; semantics, accessibility tree, keyboard exclusion, axe, the behavior spec (14/14) and `npm run check` all pass. No open findings.
