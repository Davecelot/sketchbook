---
title: "Use in an existing app"
description: "Add the design system to an app repository in its own folder, then repair, check and upgrade it."
order: 40
---

Adopting adds the design system in its own folder, `design-system/` by default, and adds one script to the app's `package.json` that runs its checks.

Pack the engine as shown in the [quickstart](/start/quickstart/) and keep `SKETCHBOOK_TARBALL` set to the tarball's absolute path. Run the following commands from your app directory.

1. **Preview.** Use `--dir` to name another folder.

   ```terminal
   npm exec --yes --package="$SKETCHBOOK_TARBALL" -- sketchbook init --adopt --engine "$SKETCHBOOK_TARBALL" --dry-run
   ```

2. **Run it.** Add a starter if you know it.

   ```terminal
   npm exec --yes --package="$SKETCHBOOK_TARBALL" -- sketchbook init --adopt --start library --engine "$SKETCHBOOK_TARBALL"
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

`upgrade` updates harness-owned files only. Team-owned files are listed and never touched. When the engine runs from `node_modules`, update the package, then run `upgrade` without `--from`. Otherwise point `--from` at a newer Sketchbook folder or git URL. Preview first.

```terminal
npx sketchbook upgrade --dry-run
npx sketchbook upgrade --from ../sketchbook --yes
```

> **Warning** A git URL needs `--yes` because it writes upstream harness code. Review the dry run first.

## Next steps

- [Project CLI](/cli/project/): every option of `init`, `status`, `doctor` and `upgrade`.
- [Claude layer](/concepts/claude-layer/): the staged skills, commands, rules and hooks.

Source of truth: `CLAUDE.md`, `harness/templates/move-to-claude-INSTALL.md`, `.claude/skills/onboarding/SKILL.md`, `docs/cli.md`
