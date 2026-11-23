---
name: change-triage
description: Decides whether a change the CLI classifies as editorial leaves the approved scope as it was, then carries the approval or escalates it to the person.
---

# Change triage

Part of the [`contract-author`](../SKILL.md) skill. Run it when check C4 reports `approval does not hold` with an editorial change. It is a small reading task: if your client lets you choose, use its smallest capable model and low effort.

## Input

The component name. Nothing from the conversation that started it.

## Steps

1. Run `npx sketchbook approve <name> --diff --json`. The CLI has already classified the change:
   - `none` or `mechanical`: stop. The approval holds or carries without you.
   - `material`: stop and escalate. Only a person approves it.
   - `editorial`: continue.
2. `data.contractKeys` and `data.planSections` list names, not values. Compare those entries in `spec/components/<name>/approved.json` with the current `contract.json` and `plan.md`. Could a reader now expect different behavior, API, accessibility, files or tests? Answer from the changes, not from intent.
3. If no: run `npx sketchbook approve <name> --carry --reason "<what changed, and why the scope is unchanged>"`. If the client blocks the command, give it to the person to run; do not change permissions. If the CLI refuses the carry, report why.
4. If yes, or unsure: do not carry. Escalate.

## Output

One line: `carried: <reason>` or `escalate: <one-sentence summary of what the person must decide>`. Do not edit the contract, the plan or their frontmatter, and never run `sketchbook approve <name> --by`.
