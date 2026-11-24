---
description: Set up or rebrand the design system (starting point, brand, font, radius, density, design tool, prefix)
argument-hint: "[--start <starter>] [--primary #hex] [--font Name] [--radius sharp|soft|round] [--prefix acme] ..."
---

First run (nothing chosen yet, or no flags): use the `onboarding` skill, which asks who the person is and where they start and runs `sketchbook init --start <starter>` (same as `/start`).

With flags in "$ARGUMENTS": run `sketchbook init $ARGUMENTS --dry-run`, show what would change, and apply only after approval. To rename the element and CSS prefix (`prefix` in `harness.config.json`; tags `<prefix>-button`, variables `--<prefix>-*`), use `--prefix <name>` (lowercase letters and digits). It rewrites sources, contracts, tests, and docs, so suggest committing first. It does not rename semantic token roles.

For a new project, follow onboarding’s optional token naming step and starter handoff even when flags supplied the choices. For an existing project, explain what changed and give the next command. For a contrast failure, name the pair and offer the suggested fix. Run `sketchbook help init` to confirm options.
