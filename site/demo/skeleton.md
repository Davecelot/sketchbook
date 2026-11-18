---
title: "Skeleton"
description: "A pulsing placeholder block that holds the space of content that is still loading."
---

<!-- Generated from spec/components/skeleton/contract.json by scripts/docs-components.mjs. Do not edit by hand. -->

Tag `<sb-skeleton>` · status `stable` · version `0.1.0`

## Example

<div class="live-demo">
<div style="display:flex;align-items:center;gap:16px">
  <sb-skeleton style="width:3rem;height:3rem;--sb-skeleton-radius:var(--sb-radius-full)"></sb-skeleton>
  <div style="display:grid;gap:8px">
    <sb-skeleton style="width:16rem;height:1rem"></sb-skeleton>
    <sb-skeleton style="width:12rem;height:1rem"></sb-skeleton>
  </div>
</div>
</div>

```html
<div style="display:flex;align-items:center;gap:16px">
  <sb-skeleton style="width:3rem;height:3rem;--sb-skeleton-radius:var(--sb-radius-full)"></sb-skeleton>
  <div style="display:grid;gap:8px">
    <sb-skeleton style="width:16rem;height:1rem"></sb-skeleton>
    <sb-skeleton style="width:12rem;height:1rem"></sb-skeleton>
  </div>
</div>
```

## Properties



## Accessibility

- Role: `none: hidden from assistive technology (aria-hidden)`
- Accessible name: None. The loading state is announced by the author on the container (aria-busy, or a visible or live status).
