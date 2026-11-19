---
name: sketchbook
description: Work on a Sketchbook design-system project using its component contracts, tokens, CLI and validation workflows. Use when creating or changing its components, foundations, kits, design sync or reviews.
---

# Sketchbook design-system work

Read `AGENT-WORKFLOWS.md` at the project root for the relevant task and the project's `harness.config.json` for enabled workflow gates. Use `npx sketchbook help` for the installed CLI's commands and options. Treat the spec and decisions as the source of truth and validate changes with the checks appropriate to the task.

If the project also includes the Claude Code integration, consult the matching skill or rule in `move-to-.claude/` while staged or `.claude/` once installed, as described in `AGENT-WORKFLOWS.md`. Those files may name Claude-only tools, model aliases, hooks or delegation; apply the underlying workflow using the current agent's available capabilities and permissions. Report any required step that could not be performed.
