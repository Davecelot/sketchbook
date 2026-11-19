---
title: "Quickstart"
description: "Create a Sketchbook project and run its first checks."
order: 10
---

Use Node 22.18.x or a later Node 22 release, or Node 24 and above. Claude Code setup is optional.

1. **Pack the engine.** Run these commands from your [Sketchbook checkout](https://github.com/Davecelot/sketchbook). If you already have a tarball, set `SKETCHBOOK_TARBALL` to its absolute path and continue with step 2.

   ```terminal
   npm ci
   SKETCHBOOK_TARBALL="$PWD/$(npm pack --silent)"
   ```

2. **Create an empty project folder.** From the checkout, these commands put it next to Sketchbook. If you already have a tarball, use any empty folder. Keep the same terminal session so the tarball path is available.

   ```terminal
   mkdir ../my-design-system
   cd ../my-design-system
   ```

3. **Preview the setup.** `--dry-run` shows what would change and writes nothing.

   ```terminal
   npm exec --yes --package="$SKETCHBOOK_TARBALL" -- sketchbook init --start library --engine "$SKETCHBOOK_TARBALL" --dry-run
   ```

4. **Run init.** It creates the project, installs dependencies and Chromium, and runs the checks. Keep the tarball at that path while the project depends on it.

   ```terminal
   npm exec --yes --package="$SKETCHBOOK_TARBALL" -- sketchbook init --start library --engine "$SKETCHBOOK_TARBALL"
   ```

5. **Look at the project.** `status` is read-only. Open `docs/harness.md` for the initial installation inventory.

   ```terminal
   npx sketchbook status
   ```

6. **Run the checks.** Exit 0 means pass, 1 a failure, 2 a pass with hand edits kept as overrides.

   ```terminal
   npx sketchbook check
   ```

Portable agent instructions in `AGENTS.md` and `AGENT-WORKFLOWS.md` are available immediately. The optional Claude Code layer is staged in `move-to-.claude/`. Run `npx sketchbook doctor` to inspect the current setup. [Agent compatibility](/concepts/agent-compatibility/) · [Claude Code](/concepts/claude-layer/).

## Commands you will use

| Command | What it does |
| --- | --- |
| `npm run check` | Run the standard checks (same as `sketchbook check`) |
| `npm run generate` | Rebuild tokens, styles and the other outputs |
| `npm run storybook` | Generate, then start Storybook |
| `npm run test:install` | Install the Chromium the browser tests use |
| `npm run test:component` | Run the component behavior tests |
| `npm run typecheck` | Type-check sources and stories |

## Starting points

In step 4, pass the starter you need to `--start`.

| Starter | Choose it when |
| --- | --- |
| `blank` | You want to design every component from zero. |
| `foundations` | You want to settle tokens before any component. |
| `library` | You want a working library now and a rebrand later (default). |
| `library+kits` | You need screens fast: all components plus template kits. |
| `pick` | You need a subset: add `--components card,button`. |
| `import` | You already have tokens: add `--from <file>`. |
| `from-codebase` | You already have a product: add `--from "<css glob>"`. |

For example, replace `--start library` with `--start pick --components card,button` to start with two components.

> **Warning** Commit or stash first when you run a starter in an existing project. It can remove components, and git is the undo.

## Next steps

- [How it works](/concepts/how-it-works/)
- [Change your foundations](/guides/foundations/)
- [Add a component](/guides/add-component/)

Source of truth: `harness/starters/*.json`, `docs/cli.md`, `harness/templates/move-to-claude-INSTALL.md`
