---
title: "Change one source"
description: "See how changing a shared token updates the components that use it."
order: 10
---

Choose a primary color and watch the swatches update together. Then move the radius slider and compare the corners. These are real component tokens. The controls change CSS variables in your browser, and **Reset** brings the preview back to its starting values.

<!-- tokens:preview -->

To preview a color change in your own project, run the command below with `--dry-run`. Use `tokens impact` to see which tokens depend on that color.

```terminal
sketchbook tokens set color.primary "#0F766E" --dry-run
sketchbook tokens impact color.primary
```
