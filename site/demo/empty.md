---
title: "Empty"
description: "A placeholder for a view with nothing to show yet: optional media, title, description and actions (a family of Web Components)."
---

<!-- Generated from spec/components/empty/contract.json by scripts/docs-components.mjs. Do not edit by hand. -->

Tag `<sb-empty>` · status `stable` · version `0.1.0`

## Example

<div class="live-demo">
<sb-empty>
  <sb-empty-header>
    <sb-empty-media variant="icon">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 10.5 8 13l2 2.5" /><path d="m14 10.5 2 2.5-2 2.5" /><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z" /></svg>
    </sb-empty-media>
    <sb-empty-title>No reports yet</sb-empty-title>
    <sb-empty-description>Reports you create will be listed here. Create the first one to begin.</sb-empty-description>
  </sb-empty-header>
  <sb-empty-content>
    <sb-button>Create report</sb-button>
    <sb-button variant="tertiary">Import report</sb-button>
  </sb-empty-content>
</sb-empty>
</div>

```html
<sb-empty>
  <sb-empty-header>
    <sb-empty-media variant="icon">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 10.5 8 13l2 2.5" /><path d="m14 10.5 2 2.5-2 2.5" /><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z" /></svg>
    </sb-empty-media>
    <sb-empty-title>No reports yet</sb-empty-title>
    <sb-empty-description>Reports you create will be listed here. Create the first one to begin.</sb-empty-description>
  </sb-empty-header>
  <sb-empty-content>
    <sb-button>Create report</sb-button>
    <sb-button variant="tertiary">Import report</sb-button>
  </sb-empty-content>
</sb-empty>
```

## Properties



## Parts

### `<sb-empty-media>`

The illustration or icon above the title. The icon variant puts it in a 40px muted rounded square.

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `variant` | `primary`, `icon` | `primary` | primary: no box, the media is shown as is. icon: 40px muted square, 24px svg. |

## Accessibility

- Role: `none (generic container)`
- Accessible name: None. The title is a visual heading; use a real heading element inside sb-empty-title when it belongs in the document outline.
