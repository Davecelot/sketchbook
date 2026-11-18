---
title: "Badge"
description: "A small pill that labels or counts something, optionally a link."
---

<!-- Generated from spec/components/badge/contract.json by scripts/docs-components.mjs. Do not edit by hand. -->

Tag `<sb-badge>` · status `stable` · version `0.1.0`

## Example

<div class="live-demo">
<div style="display:flex;gap:8px;flex-wrap:wrap">
  <sb-badge>Primary</sb-badge>
  <sb-badge variant="secondary">Secondary</sb-badge>
  <sb-badge variant="destructive">Destructive</sb-badge>
  <sb-badge variant="tertiary">Tertiary</sb-badge>
</div>
</div>

```html
<div style="display:flex;gap:8px;flex-wrap:wrap">
  <sb-badge>Primary</sb-badge>
  <sb-badge variant="secondary">Secondary</sb-badge>
  <sb-badge variant="destructive">Destructive</sb-badge>
  <sb-badge variant="tertiary">Tertiary</sb-badge>
</div>
```

## Properties

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `variant` | `primary`, `secondary`, `destructive`, `tertiary`, `ghost`, `link` | `primary` | Look of the pill. primary is filled with the primary color; secondary and destructive are filled; tertiary has a border; ghost and link have no fill. |
| `href` | text |  | Renders the pill as a native link (a). Gains hover and a focus ring, and a 24px minimum height for the target size rule. javascript:, vbscript: and data: URLs are dropped: the link renders without href and a console warning names it (SB-0115). |
| `label` | slot |  | Default slot: the text or number, optionally with a small svg icon. |

## Keyboard

| Key | Does |
| --- | --- |
| `Tab` | focuses a link badge |
| `Enter` | follows the link |

## Accessibility

- Role: `none for a plain badge (text); link for a badge with href`
- Native element: `span, or a when href is set`
- Accessible name: Its text content.
