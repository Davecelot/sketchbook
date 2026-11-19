---
title: "Overview"
description: "Every harness action is a command: scriptable with --json, and previewable with --dry-run where it changes files."
order: 0
---

The `sketchbook` CLI is the deterministic half of the harness. Run `sketchbook <command>`, or `node harness/cli.mjs <command>`. This section is split by topic and generated from the command modules by `npm run generate`, so it matches the CLI as of the last build.

In a terminal, run `npx sketchbook` without a command to explore the interactive menu. Enter a number to select an item, provide the requested values, and optionally review settings. Where available, examples show what to type. Mutating commands show a preview when supported; type `y` and press Enter to apply, or press Enter to cancel.

Use `sketchbook help <command> --details` for the full command reference. Terminal views may summarize long results; add `--details` to show the full output. For scripts and agents, use `--json` for the structured response.

```terminal
sketchbook help <command>
sketchbook check --json
sketchbook tokens set color.primary "#0F766E" --dry-run
```

<!-- cli:conventions -->

<!-- cli:commands -->
