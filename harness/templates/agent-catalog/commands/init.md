---
description: Set up or rebrand the design system (starting point, brand, font, radius, density, design tool, prefix)
---

First run (nothing chosen yet, or no flags): use the `onboarding` skill, which asks who the person is and where they start and runs `sketchbook init --start <starter>` (same as `/start`).

With flags in "<input>": run `sketchbook init <input> --dry-run`, explain what will change, then run it without `--dry-run`. Only to rename the element/CSS prefix (`prefix` in harness.config.json; tags `<prefix>-button`, variables `--<prefix>-*`) pass `--prefix <name>` (lowercase letters and digits); it rewrites sources, contracts, tests and docs (same as `sketchbook prefix <name>`), so suggest committing first.

For anything beyond a quick rebrand (a type scale, a grid, motion, imported tokens), hand off to the `foundations` skill (`/foundations`). Explain the check results in plain words; for a contrast failure, name the pair and offer the suggested step. Finish with what changed and the next command (`npm run storybook`, the Figma sync (`/sync`), or `/foundations`). Run `sketchbook help init` to confirm options.
