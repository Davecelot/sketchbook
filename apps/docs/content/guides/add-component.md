---
title: "Add a component"
description: "Install a catalog component as shipped or start your own with a contract."
order: 30
---

Start with the catalog if it has what you need. To design a new component or replace the catalog design, run `sketchbook add "<Name>" --blank`, then [write its contract](/concepts/contracts/).

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

You can do this in a core-only project, with any coding agent or without one.

1. Add a `planned` entry to `spec/registry.json` if the name is not already there. Preview with `sketchbook add "<Name>" --blank --dry-run`, then run it without `--dry-run` to create the contract and plan.
2. [Draft the contract](/concepts/contracts/) from your design and applicable accessibility references. Use `spec/api.json` for canonical API names. Run `sketchbook check`.
3. If `features.planningGate` is enabled in `harness.config.json`, complete `spec/components/<name>/plan.md` and request approval before writing tests or implementation. After approval, follow the project's test-first setting.

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
