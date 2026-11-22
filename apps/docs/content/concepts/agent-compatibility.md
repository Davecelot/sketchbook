---
title: "Agent compatibility"
description: "Choose an agent profile and check what your coding tool loads."
order: 55
---

Start with the Sketchbook CLI and checks. No AI model or coding tool is required. Add a profile when you want your tool to load project instructions or run a supported edit guard. Profiles do not select a model or change the core quality checks.

## Install a profile

Add `--agent claude` to the init command in the [Quickstart](/start/quickstart/) to stage the Claude Code integration. For several tools, pass a comma-separated list such as `--agent codex,trae`.

In an existing Sketchbook project, preview the files the profile will add. Run the same command without `--dry-run` when you’re ready.

```terminal
npx sketchbook init --agent codex --dry-run
```

| `--agent` profile | Project files |
| --- | --- |
| `claude` | Shared component skills, `CLAUDE.md`, and native wrappers, commands, rules, hooks and activation guide staged under `move-to-.claude/` |
| `codex` | Shared guidance, `.codex/hooks.json`, and `.codex/sketchbook-guard.mjs` |
| `gemini` | Shared guidance, `GEMINI.md`, `.gemini/settings.json`, and `.gemini/sketchbook-guard.mjs` |
| `copilot` | Shared guidance, `.github/copilot-instructions.md`, `.github/hooks/sketchbook.json`, and `.github/hooks/sketchbook-guard.mjs` |
| `trae` | Shared guidance and `.trae/rules/sketchbook.md` |
| `jetbrains` | Shared guidance and `.aiassistant/rules/sketchbook.md` for AI Assistant chat |
| `generic` | Shared guidance for clients that read `AGENTS.md`, such as Cursor, OpenCode, Windsurf, Kiro, and Antigravity |

Every profile installs the same `contract-author`, `component-builder`, `hammock`, and `review-rangers` workflows. Claude Code also gets the staged native integration. Other profiles add `AGENTS.md`, `AGENT-WORKFLOWS.md`, and the `sketchbook` routing skill. Multiple profiles reuse the shared files. Clients without native skill discovery can read them directly. Use the [harness catalog](/harness/) to install any individual workflow without selecting a profile.

Already set up? After updating the CLI, preview `npx sketchbook init --dry-run`, then run `npx sketchbook init` to add missing files for your selected profiles without replacing existing shared instructions. Use `upgrade` to refresh harness-owned Claude wrappers.

## Client and hook coverage

| Client | Project entry point | Hook coverage |
| --- | --- | --- |
| Antigravity IDE | `AGENTS.md` | Shared instructions; open the design-system folder as a workspace and run checks explicitly |
| Claude Code | `CLAUDE.md` and the optional staged `.claude/` layer | Existing skills, rules, commands and hooks after installation |
| OpenCode | `AGENTS.md` and `.agents/skills/` | Project guidance and skill loading. Enable project configuration. |
| Cursor | `AGENTS.md` | Selected Claude-format hooks can be imported when enabled; verify your version |
| GitHub Copilot | `.github/copilot-instructions.md` and `.agents/skills/` | Tested in Copilot CLI for recognized native `create` and `edit` calls. Cloud discovery and enforcement are not verified. |
| Gemini CLI | `GEMINI.md` | BeforeTool adapter for `write_file` and `replace`, subject to hook trust and the installed engine |
| Codex | `AGENTS.md` and `.agents/skills/sketchbook/SKILL.md` | Native `apply_patch` guard for generated paths when supported and trusted; other edit paths and decision changes need separate checks |
| Windsurf | `AGENTS.md` | Project guidance. Check directory scope. |
| TRAE | `.trae/rules/sketchbook.md`; `AGENTS.md` when imported | Shared guidance; Chinese-edition documentation requires workspace trust and an AGENTS import setting; verify your edition |
| Kiro | `AGENTS.md` | Project guidance |
| JetBrains | `AGENTS.md` for supported agents; `.aiassistant/rules/sketchbook.md` for AI Assistant chat | Project guidance. Check activation in the selected agent or chat. |

## Confirm your client loaded it

1. From your design-system folder, run `npx sketchbook doctor` to inspect the selected profiles, recognized hook registrations, and files that need review.
2. Open the design-system folder as your agent workspace, especially when it lives inside an app. Start a session and use your client’s instructions or hooks view to confirm what it loaded.
3. If you already had client settings, review them for the Sketchbook entries. Init and upgrade preserve existing team files, so you may need to merge the entries yourself.

| If you use | Check this |
| --- | --- |
| Claude Code | Follow [Claude Code activation](/concepts/claude-layer/) after staging the profile. |
| Codex or Gemini CLI | Review your client’s workspace and hook trust settings. |
| Copilot cloud or a repository-root session | Review the repository-root configuration alongside your existing hooks. See the [Copilot root-hook example](https://github.com/Davecelot/sketchbook/blob/main/docs/agent-compatibility.md#copilot-repository-hooks-for-an-adopted-app). |
| JetBrains AI Assistant chat | In **Settings → Tools → AI Assistant → Rules**, set the Sketchbook rule to **Always**. Confirm it appears in the response attachments. |
| Antigravity | Add the nested design-system folder as a workspace folder and check whether its shared instructions loaded. If native skill discovery isn't confirmed for your version, have the agent read the shared `SKILL.md` files directly. |
| TRAE | Check workspace trust and rule import settings for your edition. Enable `.agents/skills/` discovery if required, or have the agent read the files directly. |
| Kiro | The generic profile does not write `.kiro/skills/`. Have the agent read the shared files directly. |

## Run checks directly

Hook coverage depends on the client, trust settings, and edit tool. Shell edits fall outside these adapters. Run `npx sketchbook check` directly for a project check in any client. Use `npx sketchbook audit-page <file.html>` for a quick heading and main-landmark check, or `npx sketchbook audit-decisions --git-ref <revision>` to compare settled decisions with a revision from before the change.

Use the same CLI workflows to [install or design a component](/guides/add-component/) or [change foundations](/guides/foundations/) in any client. `doctor` inspects files and registrations; it cannot tell whether a client loaded them or a model followed them.

## What has been verified

| Evidence | What it establishes |
| --- | --- |
| Core-only workflow tests | Component install, foundation change, and scaffolding up to the planning gate work without an agent profile. |
| Real client tests with local mock responses | Selected behaviors in Claude Code, Codex CLI, Gemini CLI, Copilot CLI, and OpenCode. See the detailed map for which tests verify shared skills, which verify existing client integrations, and which were only run on earlier versions. These do not establish hosted-model behavior, IDE behavior, or Copilot cloud hook discovery. |
| Documentation or configuration inspection | Cursor, Antigravity, Windsurf, Kiro, TRAE, and JetBrains have guidance paths, but end-to-end workflows have not been verified here. |

Read the [agent compatibility map](https://github.com/Davecelot/sketchbook/blob/main/docs/agent-compatibility.md) for client versions, validation results, and steps to repeat the tests.

Source of truth: `harness/templates/project/AGENTS.md`, `harness/templates/project/AGENT-WORKFLOWS.md`, `harness/lib/agent-diagnostics.mts`, `docs/agent-compatibility.md`
