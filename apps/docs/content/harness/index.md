---
title: "Harness catalog"
description: "Install Sketchbook’s portable skills, rules, review briefs, and project settings without choosing a model."
order: 10
---

Pick an individual workflow or install the `recommended` bundle. You can browse or add items in a project that hasn’t run `sketchbook init`. Some workflows still need a Sketchbook design-system project, Git, or Bash to run their checks.

## Browse in a terminal

Run `npx sketchbook` and choose **Harness** from the first menu, or use `npx sketchbook harness` directly. **Install recommended** previews the default set without asking you to pick items. **Customize installation** opens a checklist where each row identifies its type before its name.

In the checklist, move with **↑ / ↓**, select with **Space**, and preview with **Enter**. Type to filter; **Esc** clears the filter or goes back. Selected items stay checked even when hidden by a filter. In the preview, use **Tab** to choose the install action, then press **Enter**. Back is the default. If the install plan changes, you’ll see a fresh preview and must confirm again. Integration references are not in the checklist; use `harness list --details` to find them.

## Use explicit commands

```terminal
npx sketchbook harness list
npx sketchbook harness show hammock
npx sketchbook harness add hammock --dry-run
npx sketchbook harness add hammock
```

`list` prints a compact index. Add `--details` to include integration references or `--json` for the full machine-readable catalog. Explicit subcommands never prompt.

If you don’t have Sketchbook installed, run the same commands with `npm exec --package=@usesketchbook/cli -- sketchbook` instead of `npx sketchbook`.

## What gets installed

- **Skills are complete modules.** The workflow and its briefs, scripts, and resources go under `.agents/skills/`; the module supplies any project settings it needs without overwriting yours. `--agent` changes the activation guidance, not the workflow.
- **Rules and named workflows** go under `.agents/sketchbook/`. Ask your client to read them or use them directly. Rules don’t become automatic merely because they’re on disk. Review briefs work for people or authorized delegates; installing one doesn’t grant permissions.
- **Client integration references** go under `docs/sketchbook-harness/`. These examples are for inspection, not active hook registrations. If you want native automation, follow the instructions for your client’s profile.
- **Existing files** are kept unless they exactly match a known, unedited earlier release. Preview with `--dry-run`. Conflicts block selective installs before any writes; no command changes tool permissions or home-directory configuration. Run `sketchbook doctor` in a Sketchbook project to see what’s on disk, not whether a client loaded it.

Plain `init` remains core-only. `init --agent <profile>` installs the same recommended workflows for every profile, plus client guidance. Claude Code keeps its [staged native integration](/concepts/claude-layer/), including the same Hammock workflow with automatic reminders and audits after activation. Review Rangers can use independent delegates when the client and user allow them; otherwise it reports a single-reviewer advisory.

### Hammock configuration

Install `hammock` to get `.sketchbook/hammock.json` if it is missing. The shipped `defaultMode` is `null`: Claude Code hooks keep using existing environment or user defaults, and Hammock falls back to `full` when no preference is set. Set `defaultMode` to `off`, `lite`, `full`, or `ultra` to override it for this project. A mode requested in the conversation applies to that run. To run the audit yourself, use `bash .agents/skills/hammock/scripts/audit-simplicity.sh` from the design-system root; add `--diff` for changed component files.

Older config and brief IDs still work with `harness show`, which points to the owning module. Passing those IDs alone to `harness add` is refused so scripts don’t unexpectedly install a larger module.

### Updating an existing installation

Preview `sketchbook upgrade --dry-run` after updating the CLI. Exact matches to the old shipped files can be refreshed; customized instructions, hooks, and settings stay in place. Compare preserved files with the canonical catalog before adopting the new version. For a selective installation, use `sketchbook harness add <item> --dry-run` instead.

## Catalog items

<!-- harness:catalog -->
