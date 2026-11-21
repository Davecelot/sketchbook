---
title: "Checks"
description: "Check that your sources and outputs agree, and find out what to fix when they don’t."
order: 40
---

Run a check when you want to verify your spec, tokens, or code. Checks run the same way with or without an agent. A failure points to the source of the problem and suggests a fix. See the [check list](/reference/checks/) for everything Sketchbook checks.

## Run the checks

<!-- illustration: gate | The exit code tells you whether to continue, fix a failure, or review a kept override. -->

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

Planning and test-first are enabled by default and configurable in `harness.config.json`. Follow the enabled gates regardless of client or model. These are workflow requirements: a passing CLI check does not prove that someone approved a plan or saw a test fail before implementation.

The planning gate (`features.planningGate`) puts the contract and `plan.md` first, then stops for approval before writing tests or implementation.

Test-first (`features.testFirst`) writes tests from the contract and sees them fail before the code exists.

> **Note** Both gates are walked through in [Contracts](/concepts/contracts/).

## Decision records

`spec/decisions/DECISIONS.md` records design-system decisions as `SB-NNNN` entries, and check X1 verifies they are complete. An accepted decision is read-only: add a new entry that supersedes it.

## Next steps

- [Check list](/reference/checks/)
- [Rules](/reference/rules/)
- [Claude layer](/concepts/claude-layer/)

Source of truth: `harness/checks/run.mts`, `harness/checks/*.mts`, `harness.config.json`, `spec/decisions/DECISIONS.md`, `harness/checks/x1-decisions.mts`, `.claude/hooks/guard-decisions.mts`
