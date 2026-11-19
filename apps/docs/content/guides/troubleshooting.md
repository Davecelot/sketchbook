---
title: "Troubleshooting"
description: "Find the next step when a check fails, a commit stops, or an agent misses project guidance."
order: 60
---

Run `sketchbook doctor` to see what Sketchbook finds in your project. Then run `sketchbook check`. Find the check ID in the output and use the suggested fix or the matching section below.

## A check fails (exit 1)

Read the line under the failing id. It names the file and the command to run. `sketchbook check --verbose` lists every check, and `--only T6` runs one. Two failures have the same fix every time:

- **G1** (generated files differ from a fresh rebuild): change the source (`brand.config.json`, a semantic token file or a contract), then run `npm run generate`. Never edit the output. `sketchbook check --fix` rebuilds generated outputs first and is the only automatic fix.
- **O1** (outputs built from older foundations or contracts): run `sketchbook propagate`. In the Sketchbook source repo, `sketchbook propagate --maintainer` also rebuilds Storybook and the docs site.

## Check exits 2

Not a failure: the check passed, but a foundation token was edited by hand and is kept as an override. `sketchbook tokens overrides list` shows each one. Move the value into `brand.config.json`, then `sketchbook tokens overrides reset <path>`, or keep the override and record why.

## A color pair fails contrast (T6)

The failure names the pair, the mode and the nearest passing step. Change the semantic token to that step, or change the foundation preset. APCA values are shown for information and never fail a check.

## A commit is blocked

`pre-commit` runs `sketchbook check` and blocks on exit 1; exit 2 is allowed. `pre-push` runs the checks again, so `--no-verify` only delays the failure. `sketchbook doctor` shows whether the gate is active. It is set only when the folder is its own git repository; inside an app's repository the harness leaves that repository's hooks alone and tells you the line to add (see [Use in an existing app](/guides/adopt-in-app/)).

## Agent instructions are missing

Run `npx sketchbook doctor` from the design-system folder to see the selected profiles. Use `npx sketchbook init --dry-run` to preview repairs for a selected profile, or `npx sketchbook init --agent trae --dry-run` to preview adding a profile. If a path is blocked, review the existing file or symlink before retrying. See [agent compatibility](/concepts/agent-compatibility/#install-a-profile) for the files each profile uses.

## Claude ignores the rules, skills or hooks

Claude Code reads `.claude/` only from the folder where the session starts. If the design system lives in a subfolder of an app, start Claude Code in that folder. If Claude is unselected, run `npx sketchbook init --agent claude`. If `sketchbook doctor` says the Claude layer is staged, not installed (check H1 warns too), open Claude Code there and ask it to install the layer from `move-to-.claude/`; its `INSTALL.md` is written for Claude.

## H1 warns about the context budget

The always-on Claude layer (CLAUDE.md, rules without `paths:`, skill and command descriptions, hook output) has a byte budget in `harness.config.json` (`contextBudget.alwaysOnBytes`). H1 warns at 90% and fails over 100%; `sketchbook doctor` shows the current use. To get under it: give a task-specific rule a `paths:` list, shorten a description or CLAUDE.md, make a rarely used skill slash-only, or inject less from a hook. A hook of your own still adds context but is not counted, so leave headroom. The budget is yours to raise; measure the effect first with `docs/research/value-benchmark/scripts/fixed-context.mjs` (see [Evidence](/reference/evidence/)).

## A1 warns about names

A1 fails on a prop, event or state name that is not registered in `spec/api.json`. It only **warns** when a component keeps its code name for something the vocabulary spells differently (an alias, such as `readonly` for `readOnly`). The warning stays until that component's API is migrated. `sketchbook api list` shows every name as canonical, alias or extension; see [API vocabulary](/concepts/api-vocabulary/).

## W1 fails, or does not catch a name

W1 guards brand and product names that must never appear in components, stories, tests or contracts. Names come from `whiteLabel.forbiddenTerms` in `harness.config.json`, plus a local `.sketchbook-forbidden-terms` file (one per line, untracked) and the `SKETCHBOOK_FORBIDDEN_TERMS` environment variable (comma-separated). Because the file is untracked, a fresh clone, a worktree or CI does not see it: pass the variable there, or W1 passes without checking those names.

## `init` refuses a folder

`sketchbook init` in a folder that already has files and no `harness.config.json` writes nothing. Use `--dir <folder>` or `--adopt` to build the design system in its own folder (default `design-system/`) inside the repository.

## `init` cannot find the package

Check which registry npm uses for the scope and which version it can resolve.

```terminal
npm config get @usesketchbook:registry
npm config get registry
npm view @usesketchbook/cli version
```

If the scoped registry is `undefined`, npm uses the default registry shown by the second command. For a 404, check that this registry can serve the public package and that the requested version exists. Compare with the [npm package listing](https://www.npmjs.com/package/@usesketchbook/cli).

For a local or unreleased build, pass `--engine <npm spec>` to `init` to choose the new project's engine dependency. Use `--no-install` to create the project and defer `npm install` and the Chromium download. See the [CLI reference](/cli/project/#init).

## The design file sync stops

The sync needs the Figma MCP connected, with `use_figma` available, and the file named in `harness.config.json`. Without them it stops and says what is missing. Check D1 reports when the design file is behind the spec. See [Design file](/concepts/design-file/).
