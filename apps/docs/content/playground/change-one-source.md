---
title: "Change one source"
description: "See how changing a shared token updates the components that use it."
order: 10
---

Change color, radius, density, spacing, or typography, then explore the components in the Demo tab to see the effects. Your choices stay in this browser across Demo pages until you select **Reset**. They don't change your project or the Docs tab.

<!-- tokens:preview -->

To preview a color change in your own project, run the command below with `--dry-run`. Use `tokens impact` to see which tokens depend on that color.

```terminal
sketchbook tokens set color.primary "#0F766E" --dry-run
sketchbook tokens impact color.primary
```
