---
title: "Claude Code"
description: "Set up Claude Code to use your project’s workflows and edit guards."
order: 50
---

Choose the Claude Code profile when you want Claude to work from your project’s component, token, and design-file workflows. Follow [Install it](#install-it) to activate the profile.

- **Slash commands** start a workflow. The available commands include `/start`, `/init`, `/tour`, `/foundations`, `/import-tokens`, `/roast-foundations`, `/kits`, `/add`, `/check`, `/explain`, `/sync`, `/swap`. They live in `.claude/commands/`.
- **Skills** hold the procedure for one kind of task, in `.claude/skills/<skill>/`.
- **Briefs** describe roles for subagents and live with the relevant skill in `.claude/skills/<skill>/agents/`.
- **Rules** describe project requirements such as contract-first and test-first. Rules with `paths:` load for matching files.
- **Hooks** in `.claude/settings.json` run scripts on events. Two guards block Claude's edits to generated outputs and to accepted decision records. The hammock hooks inject the decision ladder once per session, track the mode, and audit component edits; they advise and never block an edit (see [Hooks and modes](#hooks-and-modes)). Each hook is TypeScript compiled to `.mjs` and runs through `.claude/hooks/run.mjs`; in a fresh clone of Sketchbook the first hook builds them once. If a guard's script is missing, the guard blocks the edit and names the fix.

## Skills

- `onboarding`: choose a starting point
- `foundations`: create, change, import or roast foundations
- `contract-author`: draft a component contract
- `component-builder`: build from a contract, test-first
- `kits`: add template kits
- `design-figma`: sync to the Figma file
- `a11y-checker`: check WCAG 2.2 AA
- `playwright-worker`: test in a real browser
- `review-rangers`: multi-perspective review
- `web-components-best-practices`: write native Web Components
- `hammock`: think before coding, review for extra complexity
- `security-guardian`: advisory checks for secrets, `npm audit`, lockfile integrity and sensitive files; reports GO or REVIEW NEEDED and never blocks
- `forge-me-a-skill`: write a skill that follows the repo standard. Optional: `sketchbook init --with forge`

## Hooks and modes

| Event | Hook | Effect |
| --- | --- | --- |
| SessionStart, UserPromptSubmit, SubagentStart | hammock | Injects the ladder card once, tracks the mode, briefs subagents |
| PreToolUse (Edit, Write, MultiEdit) | `guard-generated`, `guard-decisions` | Block edits to generated files and accepted decisions, and name the source to change |
| PreToolUse (Edit, Write, MultiEdit) | hammock gate | Marks a component edit as owing an audit; never blocks |
| PostToolUse | hammock audit | Runs the audit right after the edit |
| PostToolUse (Edit, Write, MultiEdit) | `page-outline` | A written `.html` page that uses `sb-*` elements needs an `<h1>` and a `<main>`; on a miss it tells the agent the fix (SB-0117). A static check, not axe |
| Stop | hammock stop gate | Safety net if an audit is still owed |

Hammock mode is `lite`, `full` (default), `ultra` or `off`. Switch it with `/hammock <mode>`; `off` skips the ladder, and non-negotiables such as accessibility and the contract still apply.

## Install it

Run `sketchbook init --agent claude` when creating a project or from an existing Sketchbook project. The command stages the layer in `move-to-.claude/` for activation. Open Claude Code in the design-system folder and ask it to install the staged files.

```text
Install the Claude layer from move-to-.claude/ (follow move-to-.claude/INSTALL.md).
```

Claude copies the files, merges the hook settings, runs `check --only H1` and `doctor`, then deletes `move-to-.claude/`. Check H1 verifies that every skill, brief and command loads, and that what the layer puts in context in every session stays within its byte budget (`harness.config.json` `contextBudget`, SB-0114).

> **Warning** Claude Code reads settings and hooks only from the folder where a session starts. If the design system is a folder inside an app, start Claude Code in that folder.

## Next steps

- [Rules reference](/reference/rules/)
- [Adopt in an app](/guides/adopt-in-app/)
- [Checks](/concepts/checks/)

Source of truth: `CLAUDE.md`, `.claude/settings.json`, `.claude/rules/`, `.claude/commands/`, `.claude/skills/*/SKILL.md`, `harness/checks/h1-claude-layer.mts`
