---
title: "Use in an existing app"
description: "Add the design system to an app repository in its own folder, then repair, check and upgrade it."
order: 40
---

Adopting adds the design system in its own folder, `design-system/` by default, and adds one script to the app's `package.json` that runs its checks.

Run the following commands from your app directory. npm fetches `@usesketchbook/cli`, and `init` adds it as a dev dependency of the design-system project.

1. **Preview.** Use `--dir` to name another folder.

   ```terminal
   npm exec --yes --package=@usesketchbook/cli -- sketchbook init --adopt --start library --dry-run
   ```

2. **Run it.** Replace `library` in both commands if you want a different [starter](/start/quickstart/#starting-points).

   ```terminal
   npm exec --yes --package=@usesketchbook/cli -- sketchbook init --adopt --start library
   ```

   The command creates a core-only project. Append `--agent trae` to select TRAE or use a comma-separated list to set up several clients. See [available profiles and their files](/concepts/agent-compatibility/#install-a-profile). `--no-install` skips dependency and Chromium setup.

3. **Open the design-system folder in your agent.** For Claude Code, add `--agent claude` during adoption and follow the [activation steps](/concepts/claude-layer/) from that folder. Client setup files live inside the design-system folder.

## Repair

From the design-system folder, run `init` again to restore files for the selected profiles. Use `--agent` to add a profile or `--with forge` to set up Claude and the optional skill for writing your own skills.

```terminal
npx sketchbook init
npx sketchbook init --agent codex --dry-run
npx sketchbook init --with forge
```

## Check health

`doctor` is read-only. It reports the starter, harness version, components, kits, overrides, design sync, brands, the commit gate, failing checks and the selected agent integrations.

```terminal
npx sketchbook doctor
```

## Upgrade

From the design-system folder, install the intended CLI release and preview the changes to harness-owned files.

```terminal
npm install --save-dev @usesketchbook/cli@latest
npx sketchbook upgrade --dry-run
```

Review the preview, then apply the changes.

```terminal
npx sketchbook upgrade --yes
```

Replace `latest` with a version number to select a specific release. The install command also replaces an existing `file:` dependency on a local tarball. `upgrade` reads from the installed CLI and reports which team-owned files it leaves in your project. For upgrades directly from a Sketchbook checkout or Git URL, see [`upgrade` in the CLI reference](/cli/project/#upgrade).

## Next steps

- [Project CLI](/cli/project/): every option of `init`, `status`, `doctor` and `upgrade`.
- [Claude layer](/concepts/claude-layer/): the staged skills, commands, rules and hooks.

Source of truth: `CLAUDE.md`, `harness/templates/move-to-claude-INSTALL.md`, `.claude/skills/onboarding/SKILL.md`, `docs/cli.md`
