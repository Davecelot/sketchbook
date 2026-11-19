---
title: "Item"
description: "A flexible row for a piece of content with optional media, title, description and actions, usable alone, as a link, or in a list (a family of Web Components)."
---

<!-- Generated from spec/components/item/contract.json by npm run docs:components. Do not edit by hand. -->

Use `<sb-item>` in HTML. [Lifecycle status](/reference/contract-format/#lifecycle-statuses) `stable` · Version `0.1.0`

## Example

The Quarterly plan row groups its icon, title, last edit, and Open action so you can scan them together.

<div class="live-demo">
<sb-item style="width:420px">
  <sb-item-media variant="icon">
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /></svg>
  </sb-item-media>
  <sb-item-content>
    <sb-item-title>Quarterly plan</sb-item-title>
    <sb-item-description>Edited yesterday by the planning team.</sb-item-description>
  </sb-item-content>
  <sb-item-actions><sb-button size="small" variant="tertiary">Open</sb-button></sb-item-actions>
</sb-item>
</div>

```html
<sb-item style="width:420px">
  <sb-item-media variant="icon">
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /></svg>
  </sb-item-media>
  <sb-item-content>
    <sb-item-title>Quarterly plan</sb-item-title>
    <sb-item-description>Edited yesterday by the planning team.</sb-item-description>
  </sb-item-content>
  <sb-item-actions><sb-button size="small" variant="tertiary">Open</sb-button></sb-item-actions>
</sb-item>
```

## Properties

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `variant` | `primary`, `tertiary`, `muted` | `primary` | primary: no surface. tertiary: bordered. muted: tinted surface (muted at half strength). |
| `size` | `medium`, `small` | `medium` | medium: 16px padding and gap. small: 12px block padding, 10px gap. |
| `href` | text |  | Renders the whole row as a native link. Without it, or when empty, the row is a plain container. javascript:, vbscript: and data: URLs are dropped: the link renders without href and a console warning names it (SB-0115). |

## Parts

### `<sb-item-media>`

Leading visual: an icon in a bordered tile, an image, or anything else.

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `variant` | `primary`, `icon`, `image` | `primary` | primary: no frame. icon: 32px muted tile with a border and a 16px svg. image: 40px rounded crop. |

## Keyboard

| Key | Action |
| --- | --- |
| `Tab` | focuses an item with href |
| `Enter` | follows the link |

## Accessibility

- Role: `none for a standalone item; listitem when its parent is sb-item-group; link when href is set (native a)`
- Native element: `a`
- Accessible name: The row's text content, for an item with href (the link's name is everything inside it).
