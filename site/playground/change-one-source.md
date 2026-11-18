---
title: "Change one source"
description: "Move the controls. Each swatch is a real component token that points at the value you change, so it follows. The preview sets CSS variables in your browser."
order: 10
---

<!-- tokens:preview -->

In a project the same change is one command, and every output follows from it:

```terminal
sketchbook tokens set color.primary "#0F766E" --dry-run
sketchbook tokens diff
sketchbook tokens impact color.primary
```
