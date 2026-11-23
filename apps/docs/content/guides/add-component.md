---
title: "Add a component"
description: "Install a catalog component as shipped or start your own with a contract."
order: 30
---

Start with the catalog if it has what you need. To design a new component, [register it and preview a blank scaffold](#design-a-new-component) before writing its contract.

## Install from the catalog

1. **See what is available.** `list` is read-only.

   ```terminal
   sketchbook list --available
   ```

2. **Preview.** The dry run shows what `add` installs: contract, code, stories, specs and any dependencies.

   ```terminal
   sketchbook add button --dry-run
   ```

3. **Install.** Dependencies come first, and `add` ends by running the checks that cover a component (C1, C2, C3, P1, R1, T2, T4). Multi-word names need no quotes.

   ```terminal
   sketchbook add button
   sketchbook add Button Group
   ```

4. **Confirm.**

   ```terminal
   sketchbook list --installed
   ```

In Claude Code, `/add <Component Name>` runs the dry run, shows the result, then installs.

## Design a new component

You can do this with or without an agent profile. Run `sketchbook help approve` and `sketchbook help evidence` to check that your installed CLI supports the records below.

1. Check whether an existing component covers the behavior. If you need a new one, add a `planned` entry to `spec/registry.json` if it’s missing. Use the registry’s display name: preview with `sketchbook add "Status Dot" --blank --dry-run`, then run without `--dry-run` to create the contract and plan. Registering a component does not approve it.
2. [Draft the contract](/concepts/contracts/) from your design and applicable accessibility references. Use `spec/api.json` for canonical API names. Run `sketchbook check`.
3. If `features.planningGate` is on, complete `spec/components/<name>/plan.md`. Before writing tests or implementation, have the approving person run `sketchbook approve <name> --by <name>`. C4 verifies that the approval still covers the current scope.
4. If `features.testFirst` is on, write the story and behavior spec and run `sketchbook evidence red <name>`. Check that the tests fail for the behavior you haven’t implemented yet. A missing browser or server records nothing.
5. Implement the component. With test-first on, run `sketchbook evidence green <name>` with the same spec and test setup. If you need to change the suite, record red again against the pre-change code. After review, run `sketchbook evidence ready <name>` to confirm that your passing run is still current and the component checks pass.

## Remove a component

`remove` refuses while another component or a kit needs it, and refuses a team-made or customized component without `--yes`. Otherwise it removes the files, sets the registry status to `planned` and rebuilds.

```terminal
sketchbook remove spinner --dry-run
sketchbook remove spinner
```

> **Warning** A team-made component cannot be restored from the catalog. Commit before you pass `--yes`.

## Kits

Kits are whole pages and blocks built only from components and semantic tokens. `sketchbook kits add sign-in` brings the kit and its components; `sketchbook kits list` lists them; `kits remove` asks for `--yes` when you edited one. `/kits` in Claude Code adds or adapts them, test-first. Check K1 keeps the catalog in step with `src/patterns/`.

| Kit | What it is |
| --- | --- |
| `sign-in` | Sign-in and sign-up pages |
| `settings` | A preferences page: tabs, each a card-wrapped form |
| `data-table` | A list page: search, filter, selectable table, pagination, empty and loading states |
| `dashboard` | An overview page: stat cards, chart, recent activity |
| `profile` | An account page |
| `docs-article` | A long-form documentation page |
| `onboarding` | First-run screens |
| `form-states` | Every form control in its default, disabled, invalid and read-only states |

Once added, a kit is team-owned: edit it freely.

## Next steps

- [Contracts](/concepts/contracts/): what a component spec holds.
- [Components CLI](/cli/components/): every option of `add`, `remove`, `list` and `kits`.

Source of truth: `.claude/commands/add.md`, `.claude/skills/kits/SKILL.md`, `docs/cli.md`
