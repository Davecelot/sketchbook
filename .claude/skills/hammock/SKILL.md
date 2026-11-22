---
name: hammock
description: "Apply a decision ladder before non-trivial changes, review a diff for over-engineering, or audit simplicity debt. Trigger: decision ladder, complexity review, or simplicity audit."
disable-model-invocation: true
metadata:
  author: sketchbook
  version: "1.0.0"
  changelog: Rendered from the shared workflow
  auto-invoke: See description
  allowed-tools: Governed by the client and user
---

# Hammock

## When to use

Use before a non-trivial change, when reviewing complexity, or when logging a deliberate simplification. The workflow is advisory; never edit files merely because an audit reports a smell.

## Critical patterns

Before writing code, read [the decision ladder](assets/DECISION-LADDER.md) and stop at the first step that answers the design question. State what you can reuse and what you’re deliberately not building. Never trade away validation, security, accessibility, or contract requirements.

## Decision tree

- **Lite / full / ultra:** apply the ladder to the proposed work. Full applies it throughout the task. Ultra also questions speculative requirements; it does not override explicit user requirements. Default to full unless the user asks for another mode.
- **Review:** inspect the actual diff, including uncommitted changes when they are in scope. Report avoidable abstractions, duplicated helpers, dead options, and unnecessary dependencies. Name the file, skipped ladder step, and smallest fix. Don’t make review changes without approval.
- **Audit:** run the bundled `scripts/audit-simplicity.sh` with Bash from the design-system root. Treat the script’s findings as leads, not failures.
- **Debt / gain:** use the [debt-log template](assets/DEBT-LOG-TEMPLATE.md) if asked to record a simplification; give a short recap if asked what the work avoided.
- **Off:** skip the ladder, not required checks.

Use the mode requested in the conversation, otherwise read `.sketchbook/hammock.json` if present and use its `defaultMode`. The installed file starts with `null`, which means no project override: use `full` unless the client supplies a legacy default. Installing the Hammock module keeps existing settings and does not activate hooks.

## Commands

From the design-system root, run `bash .agents/skills/hammock/scripts/audit-simplicity.sh` (or run the same script beside the skill if using a native client projection). For changed files relative to the default branch and local edits, add `--diff`.

## Resources

- [Decision ladder](assets/DECISION-LADDER.md)
- [Advisory audit script](scripts/audit-simplicity.sh)
- [Debt log template](assets/DEBT-LOG-TEMPLATE.md)
