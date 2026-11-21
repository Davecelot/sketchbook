---
name: contract-author
description: >
  Draft, resync, or validate a component contract using the shared Sketchbook
  workflow. Trigger: a missing contract or a changed reference, anatomy,
  variant matrix, accessibility requirement, or API.
metadata:
  author: sketchbook
  version: '1.3.0'
  changelog: Use the shared Agent Skill as the workflow; keep the same contract requirements across clients; retain Claude-specific role briefs here.
  auto-invoke: A component has no contract or an existing contract needs to be updated or validated.
  allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, WebFetch, Agent]
---

# Contract Author

## When to use

Open the [shared contract-author skill](../../../.agents/skills/contract-author/SKILL.md) and follow it. It defines the inputs, deliverables, checks and stopping point.

## Critical patterns

For an authorized delegated run, use the `Agent` tool with the model and tools declared by each brief. Run the [extractor](agents/extractor.md), [drafter](agents/drafter.md), and [validator](agents/validator.md) in sequence, passing each phase's evidence and outputs to the next. Apply the project's configured gate from the shared workflow.

## Decision tree

- Small prose correction: follow the shared skill's direct edit-and-check path.
- Full draft, re-sync or backfill: run the phases above if authorized; otherwise follow the shared workflow directly and disclose the self-check.
- Implementation parity review: use the component-builder skill instead.

## Commands

Use `npm run check` to validate the contract before requesting any required plan approval.

## Resources

- [Shared contract-author skill](../../../.agents/skills/contract-author/SKILL.md)
- [Claude role briefs](agents/)
