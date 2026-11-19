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

   The folder has the same layout as a new project: the engine runs from `node_modules`, and the Claude layer is staged in `move-to-.claude/`. `--no-install` skips `npm install` and the Chromium download.

3. **Open the design-system folder in your agent.** The portable instructions are available immediately. To set up the optional Claude Code layer, follow `move-to-.claude/INSTALL.md`. [Agent compatibility](/concepts/agent-compatibility/).

4. **Start Claude Code in the design-system folder.** It reads `.claude/settings.json`, and so the hooks, only from the folder it starts in. From the app root, `/add-dir <folder>` loads skills and commands but not hooks or settings.

## Repair

From the design-system folder, run `init` again to repair a project. Pass `--with forge` to add the optional skill for writing your own skills.

```terminal
npx sketchbook init
npx sketchbook init --with forge
```

## Check health

`doctor` is read-only. It reports the starter, harness version, components, kits, overrides, design sync, brands, the commit gate, failing checks and the Claude layer.

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
