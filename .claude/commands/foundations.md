---
description: Foundations studio - create, change, import, restart or roast foundations (color, type, spacing, radius, elevation, motion, density, grid, icons, z-index, contrast, naming)
argument-hint: "[area] [guided|preset|expert|import|scratch|roast]"
---

Use the `foundations` skill with "$ARGUMENTS".

- First word, if it is an area (`color`, `typography`, `spacing`, `radius`, `elevation`, `motion`, `density`, `layout-grid`, `icons`, `z-index`, `contrast`, `semantic-naming`, or `all`), limits the session to that area and its reference. No area: ask which one, recommending the first area still on its default preset (`sketchbook status`).
- A mode word (`guided`, `preset`, `expert`, `import`, `scratch`, `roast`) picks the mode. No mode: infer it from the request (the skill's table); for someone new, use `guided`.
- Change foundations only through `brand.config.json` or `sketchbook tokens` (rule `tokens-through-the-harness`), `--dry-run` first.
- End as the skill says: `sketchbook tokens diff`, `sketchbook tokens impact`, `sketchbook check`, the Storybook `Foundations/<Page>`, a proposed decision record, and an offer to sync Figma.
