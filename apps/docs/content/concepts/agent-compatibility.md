---
title: "Agent compatibility"
description: "Portable instructions, client-specific hooks and their current limits."
order: 55
---

Plain `sketchbook init` creates a core-only project. The CLI, contracts, generators, and checks are available with every setup.

## Install a profile

Append `--agent claude` to your [Quickstart](/start/quickstart/) command to stage only Claude Code. Use a comma-separated list to select multiple profiles. In an existing project, preview an addition with `npx sketchbook init --agent codex,trae --dry-run`, then run it without `--dry-run`. Run `npx sketchbook doctor` to inspect your selection and recognized hook registrations.

| `--agent` profile | Project files |
| --- | --- |
| `claude` | `CLAUDE.md` and the staged skills, commands, rules, hooks, and activation guide under `move-to-.claude/` |
| `codex` | Shared guidance, `.agents/skills/sketchbook/SKILL.md`, `.codex/hooks.json`, and `.codex/sketchbook-guard.mjs` |
| `gemini` | Shared guidance, `GEMINI.md`, `.gemini/settings.json`, and `.gemini/sketchbook-guard.mjs` |
| `copilot` | Shared guidance, `.agents/skills/sketchbook/SKILL.md`, `.github/copilot-instructions.md`, `.github/hooks/sketchbook.json`, and `.github/hooks/sketchbook-guard.mjs` |
| `trae` | Shared guidance and `.trae/rules/sketchbook.md` |
| `jetbrains` | Shared guidance and `.aiassistant/rules/sketchbook.md` for AI Assistant chat |
| `generic` | Shared guidance for clients that read `AGENTS.md`, such as Cursor, OpenCode, Windsurf, Kiro, and Antigravity |

Shared guidance consists of `AGENTS.md` and `AGENT-WORKFLOWS.md`. Multiple profiles reuse those files.

## Client and hook coverage

| Client | Project entry point | Hook coverage |
| --- | --- | --- |
| Antigravity IDE | `AGENTS.md` | Shared instructions; open the design-system folder as a workspace and run checks explicitly |
| Claude Code | `CLAUDE.md` and the optional staged `.claude/` layer | Existing skills, rules, commands and hooks after installation |
| OpenCode | `AGENTS.md` | Shared instructions; project configuration must be enabled |
| Cursor | `AGENTS.md` | Selected Claude-format hooks can be imported when enabled; verify your version |
| GitHub Copilot | `.github/copilot-instructions.md` | CLI/cloud adapter for recognized native `create` and `edit` calls when the repository hook and engine are available |
| Gemini CLI | `GEMINI.md` | BeforeTool adapter for `write_file` and `replace`, subject to hook trust and the installed engine |
| Codex | `AGENTS.md` and `.agents/skills/sketchbook/SKILL.md` | Native `apply_patch` guard for generated paths when supported and trusted; other edit paths and decision changes need separate checks |
| Windsurf | `AGENTS.md` | Shared instructions; verify directory scope |
| TRAE | `.trae/rules/sketchbook.md`; `AGENTS.md` when imported | Shared guidance; Chinese-edition documentation requires workspace trust and an AGENTS import setting; verify your edition |
| Kiro | `AGENTS.md` | Shared instructions; run checks explicitly |
| JetBrains | `AGENTS.md` for supported agents; `.aiassistant/rules/sketchbook.md` for AI Assistant chat | Shared guidance; verify the selected agent, workspace and chat rule activation |

In JetBrains AI Assistant chat, check that the Sketchbook project rule is set to **Always** in Settings → Tools → AI Assistant → Rules, and inspect response attachments to confirm it was included. Existing rules are preserved on init and upgrade; set their type in the IDE. See [JetBrains project rules](https://www.jetbrains.com/help/ai-assistant/configure-project-rules.html).

For an adopted app in Antigravity, add the nested design-system folder to the project as a workspace folder. Antigravity's [customization discovery documentation](https://antigravity.google/docs/customization-discovery/) says it does not search below a workspace folder, so opening only the app root does not load the nested instructions or skill. Check the Customizations panel to verify discovery; this setup has not been tested in a live Antigravity session here.

TRAE's [Chinese-edition rules documentation](https://docs.trae.cn/ide_rules) sets a 32 KB combined limit for rules, including `AGENTS.md` and `CLAUDE.md`. Check the team's total rules size and workspace trust if instructions are not applied.

Claude Code 2.1.327 sent the generated `CLAUDE.md` instructions to a local mock API in an isolated project. A separate session exercised the shipped generated-file and decision guards: they blocked generated and settled-decision writes, allowed a source write, and the generated write succeeded when the test hook configuration was removed. This does not verify the entire Claude layer, interactive trust or model adherence.

Hook interfaces and permissions vary. These adapters do not cover shell commands or every edit tool, and file presence does not prove activation. Doctor reports adapter scripts that differ from the current templates so teams can review them. It also flags preserved instruction entry points where references to shared guidance are not detected; equivalent inline instructions may still be present, and a reference does not prove it was loaded. Existing team files are not overwritten by `sketchbook init`; a custom settings file may need a manual merge. In an application with the design system in a subfolder, verify the client's workspace and hook discovery paths. Doctor reports whether the project is nested in a Git repository; verify Copilot hook discovery for the client and workspace.

For an adopted app, open the design-system folder as the agent workspace. In a local Copilot CLI 1.0.103 inspection, the app root did not discover the nested project instructions; the design-system working directory did. In a mock-model session, Copilot CLI 1.0.103 loaded the nested hook when started from the design-system folder; a root-only hook did not load there. Cloud and repository-root sessions need a root hook configuration. The engine package’s `docs/agent-compatibility.md` includes an example root configuration to review and add alongside existing hooks.

In a separate test, Copilot CLI 1.0.103 loaded the documented root hook in a trusted temporary repository using a local mock model. It denied a native create in the nested project's generated directory and a settled-decision edit, while allowing an ordinary source create. Starting from the nested project also delivered its instructions to the mock model and loaded its local hook; removing that hook allowed the create. This does not validate Copilot cloud or model instruction-following.

OpenCode 1.19.6's skill inspector and OpenCode 2.3.2's initialized local API found the shared Sketchbook skill in a local project. A separate OpenCode 2.3.2 session with a local mock provider sent the parent and nested project guidance and shared skill from the nested workspace; the app-root session did not include the nested guidance. Neither inspection establishes that a model followed the instructions.

Codex CLI 0.169.0-alpha.11.1's prompt inspector included both parent and design-system `AGENTS.md` files and the Sketchbook skill when started in a nested design-system workspace. An app-root inspection did not include the nested guidance. This does not verify model behavior or hook activation.

A separate local mock-model test exercised Codex 0.169.0-alpha.11.1's patch guard in a design-system directory nested in a temporary Git repository: the trusted hook blocked a generated-file patch and allowed a source patch; removing the hook allowed the generated patch. The updated integrity-checked launcher also blocked the patch from a subdirectory. It skips modified adapters; existing hook settings are preserved and may need a deliberate update and trust review. Interactive trust and model behavior remain unverified.

Gemini CLI 0.68.0 discovered the shared skill when the temporary workspace was trusted. A separate real CLI session with a loopback mock API blocked generated and settled-decision edits, allowed an ordinary source write, and allowed a generated write when its temporary hook was removed. Interactive hook trust and model behavior remain unverified.

`npx sketchbook audit-page <file.html>` provides the page-outline reminder without Claude. `npx sketchbook audit-decisions --git-ref HEAD` compares settled decisions with a committed baseline; choose a revision that predates the change. These are explicit audits, not automatic edit guards, and the page check is not a full accessibility audit.

The detailed `docs/agent-compatibility.md` in the engine package separates client integrations from candidate model families and records validation gaps. The published evidence to date is from Claude Code; it does not establish equivalent outcomes for other clients or models.

Source of truth: `harness/templates/project/AGENTS.md`, `harness/templates/project/AGENT-WORKFLOWS.md`, `harness/lib/agent-diagnostics.mts`, `docs/agent-compatibility.md`
