---
title: "Pagination"
description: "Navigation between pages of a long list: a landmark holding page links, previous and next links, and gaps. Seven custom elements."
---

<!-- Generated from spec/components/pagination/contract.json by npm run docs:components. Do not edit by hand. -->

Use `<sb-pagination>` in HTML. [Lifecycle status](/reference/contract-format/#lifecycle-statuses) `stable` · Version `0.1.0`

## Example

Page 2 is the current page. The surrounding page numbers and arrows show how readers can move through the list.

<div class="live-demo">
<sb-pagination label="pagination">
  <sb-pagination-content>
    <sb-pagination-item><sb-pagination-previous href="#"></sb-pagination-previous></sb-pagination-item>
    <sb-pagination-item><sb-pagination-link href="#">1</sb-pagination-link></sb-pagination-item>
    <sb-pagination-item><sb-pagination-link href="#" active>2</sb-pagination-link></sb-pagination-item>
    <sb-pagination-item><sb-pagination-link href="#">3</sb-pagination-link></sb-pagination-item>
    <sb-pagination-item><sb-pagination-ellipsis></sb-pagination-ellipsis></sb-pagination-item>
    <sb-pagination-item><sb-pagination-next href="#"></sb-pagination-next></sb-pagination-item>
  </sb-pagination-content>
</sb-pagination>
</div>

```html
<sb-pagination label="pagination">
  <sb-pagination-content>
    <sb-pagination-item><sb-pagination-previous href="#"></sb-pagination-previous></sb-pagination-item>
    <sb-pagination-item><sb-pagination-link href="#">1</sb-pagination-link></sb-pagination-item>
    <sb-pagination-item><sb-pagination-link href="#" active>2</sb-pagination-link></sb-pagination-item>
    <sb-pagination-item><sb-pagination-link href="#">3</sb-pagination-link></sb-pagination-item>
    <sb-pagination-item><sb-pagination-ellipsis></sb-pagination-ellipsis></sb-pagination-item>
    <sb-pagination-item><sb-pagination-next href="#"></sb-pagination-next></sb-pagination-item>
  </sb-pagination-content>
</sb-pagination>
```

## Properties

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | `pagination` | Accessible name of the navigation landmark. Translate it for other languages. |

## Parts

### `<sb-pagination-link>`

A link to one page. The current page is filled and marked.

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `href` | text |  | Target of the link. Without it the anchor is not a link. javascript:, vbscript: and data: URLs are dropped: the link renders without href and a console warning names it (SB-0115). |
| `active` | boolean | `false` | The current page: aria-current="page" and the outlined look. |
| `size` | `icon`, `medium` | `icon` | icon is a 36px square for page numbers; medium is padded for words. |

| Event | Notes |
| --- | --- |
| `click` | Follows the link. |

### `<sb-pagination-previous>`

Link to the previous page, with a chevron and text.

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `href` | text |  | Target of the link. javascript:, vbscript: and data: URLs are dropped: the link renders without href and a console warning names it (SB-0115). |
| `label` | text | `` | Accessible name override. Without it the slotted text names the link (so the visible text is always in the name); with no slotted text the name is "Go to previous page". Translate it, keep the visible text inside it. |

| Event | Notes |
| --- | --- |
| `click` | Follows the link. |

### `<sb-pagination-next>`

Link to the next page, with text and a chevron.

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `href` | text |  | Target of the link. javascript:, vbscript: and data: URLs are dropped: the link renders without href and a console warning names it (SB-0115). |
| `label` | text | `` | Accessible name override. Without it the slotted text names the link (so the visible text is always in the name); with no slotted text the name is "Go to next page". Translate it, keep the visible text inside it. |

| Event | Notes |
| --- | --- |
| `click` | Follows the link. |

### `<sb-pagination-ellipsis>`

A gap standing for skipped pages.

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | `More pages` | Visually hidden text. The element is hidden from assistive technology. |

## Keyboard

| Key | Action |
| --- | --- |
| `Tab` | moves through the links in order |
| `Enter` | follows the focused link |

## Accessibility

- Role: `navigation`
- Native element: `nav`
- Accessible name: label prop (default "pagination"). Give each pagination on a page a distinct label.
