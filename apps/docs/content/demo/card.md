---
title: "Card"
description: "A surface that groups related content and actions: header, title, description, action, content and footer (a family of Web Components)."
---

<!-- Generated from spec/components/card/contract.json by npm run docs:components. Do not edit by hand. -->

Tag `<sb-card>` · status `stable` · version `0.1.0`

## Example

<div class="live-demo">
<sb-card style="width:360px">
  <sb-card-header>
    <sb-card-title>Weekly summary</sb-card-title>
    <sb-card-description>Activity from the last seven days.</sb-card-description>
  </sb-card-header>
  <sb-card-content>Totals and trends appear here.</sb-card-content>
  <sb-card-footer><sb-button>View report</sb-button></sb-card-footer>
</sb-card>
</div>

```html
<sb-card style="width:360px">
  <sb-card-header>
    <sb-card-title>Weekly summary</sb-card-title>
    <sb-card-description>Activity from the last seven days.</sb-card-description>
  </sb-card-header>
  <sb-card-content>Totals and trends appear here.</sb-card-content>
  <sb-card-footer><sb-button>View report</sb-button></sb-card-footer>
</sb-card>
```

## Properties

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `size` | `medium`, `small` | `medium` | medium: 24px padding and gap. small: 16px. |

## Accessibility

- Role: `none (generic container)`
- Accessible name: None. Card has no role, so it is not a landmark or a named region; the title is a visual heading. For a heading in the document outline, put a real heading element inside sb-card-title.
