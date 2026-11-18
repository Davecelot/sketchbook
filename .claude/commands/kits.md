---
description: Add, adapt or remove template kits (page templates and blocks built from Sketchbook components)
argument-hint: "[list|add <kit>|adapt <kit>|remove <kit>]"
---

Use the `kits` skill for "$ARGUMENTS" (default: `list`, with a recommendation for what the person is building). Show what will change with `--dry-run` before adding or removing. Adapting a kit follows test-first: its behavior spec changes before its composition. Finish with `sketchbook check`, the kit's story in Storybook (light and dark) and an offer to sync the design file (`/sync`). Run `sketchbook help kits` to confirm options.
