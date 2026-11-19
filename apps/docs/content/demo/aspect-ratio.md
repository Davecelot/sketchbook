---
title: "Aspect Ratio"
description: "A box that keeps a fixed width-to-height ratio for the media or content placed inside it."
---

<!-- Generated from spec/components/aspect-ratio/contract.json by npm run docs:components. Do not edit by hand. -->

Use `<sb-aspect-ratio>` in HTML. [Lifecycle status](/reference/contract-format/#lifecycle-statuses) `stable` · Version `0.1.0`

## Example

The frame keeps the image at 16:9. In the HTML, the ratio belongs to the frame and the image fills it.

<div class="live-demo">
<div style="width:20rem">
  <sb-aspect-ratio ratio="1.7778">
    <img alt="Striped placeholder" style="object-fit:cover;border-radius:var(--sb-radius-surface)" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='90' viewBox='0 0 160 90'%3E%3Crect width='160' height='90' fill='%23888'/%3E%3Cpath d='M0 90 60 30l30 30 20-20 50 50z' fill='%23bbb'/%3E%3C/svg%3E" />
  </sb-aspect-ratio>
</div>
</div>

```html
<div style="width:20rem">
  <sb-aspect-ratio ratio="1.7778">
    <img alt="Striped placeholder" style="object-fit:cover;border-radius:var(--sb-radius-surface)" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='90' viewBox='0 0 160 90'%3E%3Crect width='160' height='90' fill='%23888'/%3E%3Cpath d='M0 90 60 30l30 30 20-20 50 50z' fill='%23bbb'/%3E%3C/svg%3E" />
  </sb-aspect-ratio>
</div>
```

## Properties

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `ratio` | number | `1` | Width divided by height. Accepts a number (1.7778) or a fraction written as 16/9. Invalid or non-positive values fall back to 1. |

## Accessibility

- Role: `none: the box adds no semantics`
- Accessible name: None. The slotted content is named as usual (alt text on an img, title on an iframe).
