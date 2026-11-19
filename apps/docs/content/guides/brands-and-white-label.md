---
title: "Brands and white-label"
description: "Give each brand its own foundations while sharing the same components."
order: 60
---

## Several brands

Give each brand a file at `brands/<name>.brand.json`. The file supplies that brand’s foundation values while the components keep using the same semantic token names.

```terminal
sketchbook brand add acme
sketchbook brand list
sketchbook brand use acme --dry-run
sketchbook brand build
```

- `add` saves the current `brand.config.json` as a brand, or copies another with `--from <brand>`.
- `use` copies a brand into `brand.config.json` and regenerates. It asks for `--yes` when that would overwrite edits saved in no brand file, or clear foundation overrides.
- `build` writes `generated/css/tokens.<brand>.css` for every brand, so one page can load the one it needs.

`sketchbook doctor` lists the brands in the project.

## Keep brand names out of shared code

Check W1 fails when a protected term appears in components, stories, tests or contracts, so a design system built for one client does not leak that client's name into reusable code. Two lists feed it:

| List | Where | Travels with the repo |
| --- | --- | --- |
| Shared terms | `harness.config.json`, `whiteLabel.forbiddenTerms` | Yes |
| Local terms | `.sketchbook-forbidden-terms` (one per line) or `SKETCHBOOK_FORBIDDEN_TERMS` (comma-separated) | No, the file is untracked |

> **Warning** A fresh clone or a new worktree does not have the local file, so W1 passes there with fewer terms. Put terms every contributor must follow in `harness.config.json`, or pass the variable in CI.

W1 also keeps the visual reference named only in a contract's `source:` line and its drift notes; everything else is written in your own words.

## Next steps

- [Checks](/reference/checks/): W1 and the rest of the list.
- [Config files](/reference/config-files/): `harness.config.json` and `brands/`.

Source of truth: `harness/commands/brand.mts`, `harness/checks/w1-white-label.mts`, `harness.config.json`, `docs/cli.md`
