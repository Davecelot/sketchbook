---
name: sketchbook
description: Work on a Sketchbook design-system project using its component contracts, tokens, CLI and validation workflows. Use when creating or changing its components, foundations, kits, design sync or reviews.
---

# Sketchbook design-system work

Read `AGENT-WORKFLOWS.md` at the project root (or `.agents/sketchbook/rules/AGENT-WORKFLOWS.md` after a selective install) for the relevant task and the project's `harness.config.json` for enabled workflow gates. Use `npx sketchbook help` for the installed CLI's commands and options. Treat the spec and decisions as the source of truth and validate changes with the checks appropriate to the task.

For component contracts or implementation, load the existing `contract-author` or `component-builder` skill. If your client cannot discover skills, read the matching `SKILL.md` under `.agents/skills/` in the project root. Client-specific integrations may add capabilities, but do not replace the shared workflow.
