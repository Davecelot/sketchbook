# Parity audit: Collapsible (2026-11-08)

Reference: `spec/components/collapsible/contract.{md,json}`. Implementation: `src/components/collapsible/`. Evidence: `npm run check` all pass; `tsc`, `eslint` clean; `playwright tests/collapsible` pass (serially; see flake note in the review). Tokens use only `--sb-collapsible-*`.

| Aspect | Contract | Realization | |
| --- | --- | --- | --- |
| `open`, `disabled`, `toggle` event (bubbles, composed) | yes | Collapsible.ts | ✅ |
| Native button, `aria-expanded`, forwarded `aria-label` | yes | CollapsibleTrigger.ts | ✅ |
| `aria-controls` via `ariaControlsElements` | yes | CollapsibleTrigger.ts updated() | ⚠️ |
| Closed content hidden (visibility), animation, reduced motion | yes | Collapsible.scss | ✅ |
| Focus ring, disabled opacity, 24px min trigger | yes | Collapsible.scss | ✅ |

## Differences and action plan
1. `aria-controls` target is resolved once in the trigger's `updated()`. If the content is inserted after the trigger rendered (dynamic composition), the reference stays null until something else re-renders the trigger (CollapsibleTrigger.ts). Fix in code: resolve on the collapsible's slotchange or lazily; add a test that inserts content late.
2. Only `aria-label` is forwarded; `aria-labelledby`/`aria-describedby` on the trigger host do nothing (documented SB-0009, mention in contract usage).

Verdict: needs code fix (low severity).

Status (2026-11-15): already fixed (bcf116e: aria-controls re-resolved for late content, with a spec; contract.json accessibleNameSource says only aria-label is forwarded, SB-0009).
