---
title: "Harness catalog"
description: "Install the recommended agent workflows or pick the skills and project guidance you need."
order: 10
---

The Sketchbook harness reads your design-system sources, generates outputs, and runs checks. Its agent catalog gives your coding tool workflows for those tasks. You can browse and install them without choosing a model or running `sketchbook init` first. Some skills still need a Sketchbook project or tools such as Git and Bash to run.

Start with the `recommended` bundle if you want to draft, build, and review components:

<!-- harness:recommended -->

If you only need one workflow, [find a skill by task](/harness/skills/). If you want your coding tool to discover skills or run supported hooks, [choose an agent profile](/concepts/agent-compatibility/) instead. The Claude profile also needs [Claude Code activation](/concepts/claude-layer/#install-it).

## Browse in a terminal

If Sketchbook isn’t installed in your project, use `npm exec --package=@usesketchbook/cli -- sketchbook` in place of `npx sketchbook` in the commands on this page.

1. From the folder where you want the files, run `npx sketchbook harness` in a terminal.
2. Choose **Install recommended** to preview the four skills, or **Customize installation** to pick items. In the checklist, use **↑ / ↓** to move, **Space** to select, and **Enter** to preview. Typing filters the list without clearing your selections. Press **Esc** to clear the filter or go back.
3. Review the destination, changes, and any conflicts. **Back** is selected by default. To install, use **Tab** to select the install action, then press **Enter**. If the plan changes, review and confirm the new preview. The result lists the files written.

## Use explicit commands

Explicit subcommands don’t prompt.

1. Run `npx sketchbook harness list` to find an item ID. Add `--details` to include integration references or `--json` for the machine-readable catalog.
2. Run `npx sketchbook harness show hammock` to inspect the skill’s files and dependencies.
3. Run `npx sketchbook harness add hammock --dry-run` to see what would change. Replace `hammock` with `recommended` to preview the bundle.
4. If the preview looks right, run the same command without `--dry-run`. Check the reported paths to verify what was written.

## What gets installed

- **Skills** go under `.agents/skills/`, with their briefs, scripts, and supporting files. A skill can add missing project settings without replacing your settings. On `harness show` and `harness add`, `--agent` changes the client guidance, not the files installed.
- **Rules and named workflows** go under `.agents/sketchbook/`. Ask your client to read them or use them directly. They don’t run automatically, and installing a review brief doesn’t grant permission to delegate.
- **Integration references** go under `docs/sketchbook-harness/`. They’re examples, not active hook registrations.

The installer can refresh an exact copy from a known earlier release. If a conflicting file is in the way, it stops before writing anything. It doesn’t change tool permissions or settings in your home directory.

In a Sketchbook project, run `npx sketchbook doctor` to check which files are present. Then check in your coding tool that it loaded the skill. If your tool doesn’t discover skills automatically, open the installed `SKILL.md` directly.

### Hammock configuration

Installing `hammock` adds `.sketchbook/hammock.json` if it’s missing. The shipped `defaultMode` is `null`: Claude Code hooks use existing environment or user defaults, and Hammock falls back to `full` if no preference is set. Set `defaultMode` to `off`, `lite`, `full`, or `ultra` for this project. A mode you request in the conversation applies to that run.

To run the audit yourself, you need Bash and Git. From the design-system root, run `bash .agents/skills/hammock/scripts/audit-simplicity.sh`. Add `--diff` to audit changed component files.

### Updating an existing installation

After updating the CLI, run `npx sketchbook upgrade --dry-run` to preview updates to a Sketchbook project. Review which files would change before running it without `--dry-run`. Customized instructions, hooks, and settings stay in place. If you installed individual catalog items, preview their updates with `npx sketchbook harness add <item> --dry-run` instead.

## Catalog items

- [Skills](/harness/skills/) — Find a workflow for the task you’re working on.
- [Harness reference](/harness/reference/) — Look up IDs for project guidance and integration examples.
