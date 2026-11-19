---
title: "Quickstart"
description: "Set up your first design system and confirm the project passes its checks."
order: 10
---

Have Node.js 26.13.1 LTS and npm 12.2.3 ready. If you use an older LTS line, use Node.js 24.22.3 or 22.23.5, or a newer security patch on that line.

These steps use [the published CLI](https://www.npmjs.com/package/@usesketchbook/cli) and start you with a working component library. If you already have an app, follow [Use in an existing app](/guides/adopt-in-app/).

1. **Create an empty project folder.**

   ```terminal
   mkdir my-design-system
   cd my-design-system
   ```

2. **Preview the setup.** `--dry-run` shows what would change in the project.

   ```terminal
   npm exec --yes --package=@usesketchbook/cli -- sketchbook init --start library --dry-run
   ```

3. **Set up the project.** Init creates the source files, installs the project’s dependencies and Chromium, and runs the project checks.

   ```terminal
   npm exec --yes --package=@usesketchbook/cli -- sketchbook init --start library
   ```

4. **See what you installed.** Run `status` from the project folder for an overview. Open `docs/harness.md` for the list of installed files.

   ```terminal
   npx sketchbook status
   ```

5. **Check the project.** Look for exit code 0 on a fresh setup. If a check fails, read its suggested fix. [See what each exit code means](/concepts/checks/#run-the-checks).

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
