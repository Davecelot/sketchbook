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

Planning and test-first are enabled by default and configurable in `harness.config.json`. The same CLI records and checks apply with any client or without an agent.

The planning gate (`features.planningGate`) puts the contract and `plan.md` first. A person runs `sketchbook approve <name> --by <name>` before tests or implementation. C4 checks that the recorded approval still covers the contract and plan. With `approval.requireRecord`, locally designed or customized components need a plan; unchanged catalog installs do not.

If C4 reports that approval no longer holds, run `sketchbook approve <name> --diff`. Recorded token renames and prefix changes keep the approval. Material changes need a new approval. When `approval.triage` is on, a wording-only change can carry the existing approval with `--carry --reason`.

Run `sketchbook approve --review` to see the reason and before-and-after changes for each pending carry, even after it was committed. A person confirms them with `sketchbook approve --review --by <name>`. If any carry no longer matches the current scope, nothing in the batch is confirmed. If an older carry has no saved changes, review it in Git and have a person approve the current scope with `sketchbook approve <component> --by <name>`.

Test-first (`features.testFirst`) uses `sketchbook evidence red` and `green` to record runs of the same behavior spec and test setup before and after implementing the change. C5 checks the records, and `sketchbook evidence ready` also requires a green run that matches the current inputs. Older plans marked `test-first: unverified (pre-record)` do not attest to the order of the original work. The records do not authenticate the person or judge whether a test failed for the intended reason.

> **Note** Both gates are walked through in [Contracts](/concepts/contracts/).

## Decision records

`spec/decisions/DECISIONS.md` records design-system decisions as `SB-NNNN` entries, and check X1 verifies they are complete. An accepted decision is read-only: add a new entry that supersedes it.

## Next steps

- [Check list](/reference/checks/)
- [Rules](/reference/rules/)
- [Claude layer](/concepts/claude-layer/)

Source of truth: `harness/checks/run.mts`, `harness/checks/*.mts`, `harness.config.json`, `spec/decisions/DECISIONS.md`, `harness/checks/x1-decisions.mts`, `.claude/hooks/guard-decisions.mts`
