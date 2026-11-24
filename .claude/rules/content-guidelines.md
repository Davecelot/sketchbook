---
paths:
  - "README.md"
  - "apps/docs/content/**/*.md"
  - "docs/**/*.md"
  - "harness/templates/project/docs/**/*.md"
  - "harness/templates/agent-catalog/**/*.md"
  - "harness/cli/**/*.mts"
  - "harness/commands/**/*.mts"
  - "harness/starters/*.json"
---

# Rule: content guidelines

Before writing docs, agent guidance, or user-facing CLI copy, read `docs/content-guidelines.md` in the Sketchbook source checkout. If your project doesn't have it, use the [Sketchbook content guidelines](https://github.com/Davecelot/sketchbook/blob/main/docs/content-guidelines.md).

Lead with the reader’s goal or the command result. Name the next action, what it changes, and how to verify it. Use the exact names and commands from the source. For terminal copy, preserve the JSON output contract and verify the message in a terminal, without color, and in a pipe. Edit the wording where it is defined, then regenerate any published copies.

The source checkout’s pre-commit hook reminds contributors to review this guidance. It does not judge writing quality or block a commit on copy.
