---
title: "Quickstart"
description: "Create a Sketchbook project and run its first checks."
order: 10
---

You need Node.js and npm. Claude Code is optional.

1. **Create an empty folder.**

   ```terminal
   mkdir my-design-system
   cd my-design-system
   ```

2. **Preview the setup.** `--dry-run` shows what would change and writes nothing.

   ```terminal
   npx sketchbook init --start library --dry-run
   ```

3. **Run init.** It creates a project that depends on the Sketchbook package, stages the Claude layer in `move-to-.claude/` and runs the checks.

   ```terminal
   npx sketchbook init --start library
   ```

4. **Look at the project.** `status` is read-only.

   ```terminal
   npx sketchbook status
   ```

5. **Run the checks.** Exit 0 means pass, 1 a failure, 2 a pass with hand edits kept as overrides.

   ```terminal
   npx sketchbook check
   ```

Claude Code protects `.claude/`, so ask Claude to install the staged layer. See [Claude Code](/concepts/claude-layer/).

> **Note** Before the package is published, pass `--engine <spec>` with a tarball or git URL. Add `--no-install` to skip `npm install` and the Chromium download.

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

Pass the starter you need to `--start`.

| Starter | Choose it when |
| --- | --- |
| `blank` | You want to design every component from zero. |
| `foundations` | You want to settle tokens before any component. |
| `library` | You want a working library now and a rebrand later (default). |
| `library+kits` | You need screens fast: all components plus template kits. |
| `pick` | You need a subset: add `--components card,button`. |
| `import` | You already have tokens: add `--from <file>`. |
| `from-codebase` | You already have a product: add `--from "<css glob>"`. |

```terminal
npx sketchbook init --start pick --components card,button
```

> **Warning** Commit or stash first when you run a starter in an existing project. It can remove components, and git is the undo.

## Next steps

- [How it works](/concepts/how-it-works/)
- [Change your foundations](/guides/foundations/)
- [Add a component](/guides/add-component/)

Source of truth: `harness/starters/*.json`, `docs/cli.md`, `harness/templates/move-to-claude-INSTALL.md`
