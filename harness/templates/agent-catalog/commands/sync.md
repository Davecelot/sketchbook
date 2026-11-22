---
description: Sync variables, styles and docs to the design file (Figma)
---

Use the `design-figma` skill for "<input>" (default: tokens). Confirm the configured file key first (`SKETCHBOOK_FIGMA_FILE` or `adapters.design.file`); with none, relay the example-file steps `sketchbook sync` prints and stop. If the Figma MCP isn't available, say exactly what the person needs to do and stop. `tokens`: run `sketchbook sync tokens`, then each generated script with `use_figma` in file order, one call at a time, checking each report has no errors; then `sketchbook sync stamp tokens`. `verify`: run the script from `sketchbook sync verify`, save its JSON and ingest it with `sketchbook sync verify --ingest <file>`. End with `sketchbook check` and report what reached the file. See `sketchbook help sync`.
