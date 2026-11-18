# Accessibility audit: Direction (2026-11-15)

Scope: `spec/components/direction/contract.json`, `src/components/direction/*`, `playwright/tests/direction/*`. Standard: WCAG 2.2 AA (1.3.2, 3.1.2 per contract) and the platform `dir` attribute; no APG pattern (non-interactive wrapper, `display: contents`).

## Criteria

| POUR | Criterion | Result | Evidence |
| --- | --- | --- | --- |
| P | 1.4.11 non-text contrast, 1.4.3 text contrast | Not applicable | Contract `contrast: []`, no tokens, no visual output; `npm run check` T6 passes |
| P | 1.4.1 color alone | Not applicable | No visual output |
| P | forced-colors, prefers-reduced-motion | Not applicable | `Direction.scss` has only `display: contents` and `[hidden]`; no color, no motion |
| P | 1.3.2 meaningful sequence | Pass | `dir` reflects to the native attribute; computed `direction` follows on all three stories (default `ltr:ltr`, right-to-left `rtl:rtl`, nested `rtl:rtl` then `ltr:ltr`); spec covers live change and nested override |
| O | 2.1.1 / 2.1.2 keyboard, trap | Pass | Host `tabIndex` is -1, no focusable parts; tabs roving focus inside it reverses under rtl and flips back (spec, real key presses, 3 tabs, both starting directions) |
| O | 2.4.7 focus visible | Not applicable | Not focusable; descendants own their rings |
| O | 2.5.8 target size | Not applicable | Not interactive |
| U | 3.1.2 language of parts | Not applicable | Component sets direction only; contract Do/Don't tells consumers to keep `lang` in step (not a component concern per a11y-checker skill) |
| U | 3.2.x, 3.3.x | Not applicable | No input, no name by design |
| R | 4.1.2 role, name, state | Pass | CDP `Accessibility.getFullAXTree`: host has no role or aria attributes (only `dir`), is not in the tree as a landmark or widget; descendants (`tablist "Sections"`, `tab` x3, `tabpanel`, `navigation "pagination"`) are exposed unchanged |
| R | ID references across shadow roots | Not applicable | None; shadow content is a single slot |
| R | axe | Pass | Behavior spec: axe clean on default, right-to-left, nested |
| R | Behavior spec and `npm run check` | Pass | 9/9 passed; all checks pass (A1 warn on spec/api.json is unrelated) |
| R | Screen-reader evidence | Pass | AX tree above plus `__screen-reader__` snapshots (check S1) |

## Failures

None.

## Verdict
Verdict: ready
Approved-by: Davecelot (2026-11-15)

Non-interactive, role-less wrapper: `dir` reaches the subtree (computed direction, nested override, live change), roving focus in Tabs follows it with real key presses, the accessibility tree is unchanged by the wrapper, axe is clean on all three stories, the behavior spec (9/9) and `npm run check` pass. No open findings.
