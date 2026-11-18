---
description: Sync variables, styles and docs to the design file (Figma)
argument-hint: "[tokens|verify]"
---

Use the `design-figma` skill for "$ARGUMENTS" (default: tokens). Confirm the configured file key first; if the Figma MCP isn't available, say exactly what the person needs to do and stop. `tokens`: run `sketchbook sync tokens`, then each generated script with `use_figma` in file order, one call at a time, checking each report has no errors; then `sketchbook sync stamp tokens`. `verify`: run the script from `sketchbook sync verify`, save its JSON and ingest it with `sketchbook sync verify --ingest <file>`. End with `sketchbook check` and report what reached the file. See `sketchbook help sync`.
