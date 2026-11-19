---
title: "Quickstart"
description: "Create a Sketchbook project and run its first checks."
order: 10
---

Use Node.js 26.13.1 LTS and npm 12.2.3. For older LTS lines, use Node.js 24.22.3 or 22.23.5, or a newer security patch on the same line.

The CLI is published as [`@usesketchbook/cli` on npm](https://www.npmjs.com/package/@usesketchbook/cli). For a project inside an existing app, follow [Use in an existing app](/guides/adopt-in-app/).

1. **Create an empty project folder.**

   ```terminal
   mkdir my-design-system
   cd my-design-system
   ```

2. **Preview the setup.** `--dry-run` shows what would change in the project.

   ```terminal
   npm exec --yes --package=@usesketchbook/cli -- sketchbook init --start library --dry-run
   ```

3. **Run init.** It creates and checks the project, adds `@usesketchbook/cli` to `devDependencies`, and installs dependencies and Chromium for the browser tests.

   ```terminal
   npm exec --yes --package=@usesketchbook/cli -- sketchbook init --start library
   ```

4. **Look at the project.** Run `npx sketchbook` commands from this folder to use the installed CLI. Open `docs/harness.md` for the initial installation inventory.

   ```terminal
   npx sketchbook status
   ```

5. **Run the checks.** Exit 0 means pass, 1 a failure, 2 a pass with hand edits kept as overrides.

   ```terminal
   npx sketchbook check
   ```

## Choose agent integrations

The commands above create a core-only project. To set up Claude Code during install, append `--agent claude` to both `init` commands. To add it later, run `npx sketchbook init --agent claude` from the project and follow [Claude Code activation](/concepts/claude-layer/). For multiple clients, pass a comma-separated list such as `--agent codex,trae`.

See [available profiles and their files](/concepts/agent-compatibility/#install-a-profile). Run `npx sketchbook doctor` to inspect your project's setup.

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

In both `init` commands, pass the starter you need to `--start`.

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
- [Upgrade the CLI and harness](/guides/adopt-in-app/#upgrade)

Source of truth: `harness/starters/*.json`, `docs/cli.md`, `harness/templates/move-to-claude-INSTALL.md`
