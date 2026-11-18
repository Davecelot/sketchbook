---
description: Roast the current foundations against the standards and accessibility, with evidence, risks and recommendations (read-only)
argument-hint: "[area|all]"
---

Use the `foundations` skill in `roast` mode for "$ARGUMENTS" (default `all`).

1. Launch the brief `.claude/skills/foundations/agents/foundations-critic.md` with the `Agent` tool (general-purpose; prompt = the brief's contents plus its inputs) with no conversation history: pass only the area and today's date. Do not share your own opinion of the foundations with it.
2. When it returns, read `docs/foundations-reviews/<date>.md` and present the top findings: what, evidence, risk, recommendation (a command). Keep accessibility failures apart from taste calls.
3. Change nothing yet. Offer to fix the findings the person accepts with `/foundations <area>`; record disagreements in a proposed decision record.
