---
title: "Direction"
description: "Sets the reading direction, left-to-right or right-to-left, for everything inside it. Components that depend on direction follow it with no extra wiring."
---

<!-- Generated from spec/components/direction/contract.json by npm run docs:components. Do not edit by hand. -->

Tag `<sb-direction>` · status `stable` · version `0.1.0`

## Example

<div class="live-demo">
<sb-direction dir="rtl">
  <sb-tabs value="one" style="display:block;width:320px">
    <sb-tabs-list aria-label="Sections">
      <sb-tabs-trigger value="one">One</sb-tabs-trigger>
      <sb-tabs-trigger value="two">Two</sb-tabs-trigger>
    </sb-tabs-list>
    <sb-tabs-content value="one">First panel.</sb-tabs-content>
    <sb-tabs-content value="two">Second panel.</sb-tabs-content>
  </sb-tabs>
</sb-direction>
</div>

```html
<sb-direction dir="rtl">
  <sb-tabs value="one" style="display:block;width:320px">
    <sb-tabs-list aria-label="Sections">
      <sb-tabs-trigger value="one">One</sb-tabs-trigger>
      <sb-tabs-trigger value="two">Two</sb-tabs-trigger>
    </sb-tabs-list>
    <sb-tabs-content value="one">First panel.</sb-tabs-content>
    <sb-tabs-content value="two">Second panel.</sb-tabs-content>
  </sb-tabs>
</sb-direction>
```

## Properties

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `dir` | `ltr`, `rtl` | `ltr` | The direction applied to the subtree. It is the native dir attribute, so text, flex rows and logical CSS properties all follow it. |

## Accessibility

- Role: `none (generic wrapper)`
- Accessible name: Not applicable.
