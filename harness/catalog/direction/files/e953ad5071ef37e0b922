# Parity audit: Direction (2026-11-08)

Reference: `spec/components/direction/contract.{md,json}`. Implementation: `src/components/direction/`. Evidence: check passes; `playwright tests/direction` pass.

| Aspect | Contract | Realization | |
| --- | --- | --- | --- |
| `dir` ltr/rtl reflects native `dir` | yes | Direction.ts | ✅ |
| `display: contents`, slot only | yes | Direction.scss | ✅ |
| Nested override, live change | yes | spec | ✅ |
| Default | ltr | `dir` defaults to `ltr` and reflects, so a bare `<sb-direction>` inside an rtl page forces ltr | ⚠️ |
| `auto` | not offered | not accepted by the type though native `dir` allows it | ➖ |

## Differences and action plan
1. A `sb-direction` without `dir` imposes ltr on its subtree, which overrides an inherited rtl. Matches the contract default but is a trap; consider documenting it in contract usage.

Verdict: matches contract.
