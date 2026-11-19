---
title: "Checks"
description: "Deterministic tests that reject a bad state, and the gates that order the work."
order: 40
---

A check is a plain script that runs without AI and reads your spec, tokens or code. It passes or reports errors with a suggested fix. Together the checks keep sources, outputs and records in agreement. The full list is in the [check list](/reference/checks/).

## Run the checks

<!-- illustration: gate | Every check runs; the exit code says whether the sources and outputs agree. -->

```terminal
sketchbook check
sketchbook check --json
```

`--json` prints one JSON envelope for agents and CI. `--only <ids>` runs a subset and `--fix` rebuilds generated outputs first.

| Code | Meaning |
| --- | --- |
| 0 | Pass |
| 1 | At least one check failed |
| 2 | Pass, with flagged hand edits to generated tokens (overrides) |

## Git gates

When the folder is its own git repository, `sketchbook init` points `core.hooksPath` at `.githooks/` (elsewhere it warns). `pre-commit` runs `sketchbook check` and blocks the commit when any check fails (exit 1); exit 2, a pass with flagged overrides, is allowed. `pre-push` runs the same checks again, so a commit made with `--no-verify`, a merge or a rebase is still checked. In the Sketchbook source repo, `pre-push` also runs `check --maintainer`. `sketchbook doctor` reports whether the gate is active.

## Gates

Two gates apply to a new component. Both are set in `harness.config.json` and written as rules in `.claude/rules/`, so the Claude layer and review enforce them, not a check.

The planning gate (`features.planningGate`) puts the contract and `plan.md` first, then stops for approval before any code.

Test-first (`features.testFirst`) writes tests from the contract and sees them fail before the code exists.

> **Note** Both gates are walked through in [Contracts](/concepts/contracts/).

## Decision records

`spec/decisions/DECISIONS.md` records design-system decisions as `SB-NNNN` entries, and check X1 verifies they are complete. An accepted decision is read-only: add a new entry that supersedes it.

## Next steps

- [Check list](/reference/checks/)
- [Rules](/reference/rules/)
- [Claude layer](/concepts/claude-layer/)

Source of truth: `harness/checks/run.mts`, `harness/checks/*.mts`, `harness.config.json`, `spec/decisions/DECISIONS.md`, `harness/checks/x1-decisions.mts`, `.claude/hooks/guard-decisions.mts`
