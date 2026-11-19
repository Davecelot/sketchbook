---
title: "Overview"
description: "Every harness action is a command: scriptable with --json, and previewable with --dry-run where it changes files."
order: 0
---

The `sketchbook` CLI is the deterministic half of the harness. Run `sketchbook <command>`, or `node harness/cli.mjs <command>`. This section is split by topic and generated from the command modules by `npm run generate`, so it matches the CLI as of the last build.

```terminal
sketchbook help <command>
sketchbook check --json
sketchbook tokens set color.primary "#0F766E" --dry-run
```

<!-- cli:conventions -->

<!-- cli:commands -->
