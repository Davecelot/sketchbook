# Parity audit: Scroll Area (2026-11-08)

Reference: `spec/components/scroll-area/contract.{md,json}`. Implementation: `src/components/scroll-area/`. Evidence: `npm run check` all pass; `tsc`, `eslint` clean; `playwright tests/scroll-area` pass (serially; see flake note in the review). Tokens use only `--sb-scroll-area-*`.

| Aspect | Contract | Realization | |
| --- | --- | --- | --- |
| `label`, `sb-scroll-bar orientation` | yes | ScrollArea.ts, ScrollBar.ts | ✅ |
| Scrollable: tabindex 0, region + label; otherwise none | yes | ScrollArea.ts render | ✅ |
| "Overflow re-checked when viewport or content changes size" | yes | ResizeObserver set up only in `firstUpdated` | ❌ |
| Missing label warns once | dev-only | ScrollArea.ts updated() | ⚠️ |
| Thin bar, thumb token, ring | yes | ScrollArea.scss | ✅ |

## Differences and action plan
1. Reparenting breaks the resize check (code, verified by probe). `disconnectedCallback` disconnects the ResizeObserver but `firstUpdated` never runs again, so after the element is moved, a host height change that creates overflow leaves no tabindex or region (fresh element: tabindex 0; reparented: null). A keyboard-inaccessible scroller (WCAG 2.1.1). Fix: observe in `connectedCallback`/`updated` when the viewport exists; add a move test.
2. Warning is not gated as dev-only (contract wording).

Verdict: needs code fix.

Status (2026-11-15): already fixed (f317e16: sizes observed again after a move, with a spec; contract says the warning fires once per element).
