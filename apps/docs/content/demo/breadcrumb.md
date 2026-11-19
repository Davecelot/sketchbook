---
title: "Breadcrumb"
description: "A trail of links showing where the current page sits in a hierarchy, built from a navigation landmark and an ordered list (a family of Web Components)."
---

<!-- Generated from spec/components/breadcrumb/contract.json by npm run docs:components. Do not edit by hand. -->

Use `<sb-breadcrumb>` in HTML. [Lifecycle status](/reference/contract-format/#lifecycle-statuses) `stable` · Version `0.1.0`

## Example

Follow the path from Home to Reports. Reports is the current page and appears as text.

<div class="live-demo">
<sb-breadcrumb label="Breadcrumb">
  <sb-breadcrumb-list>
    <sb-breadcrumb-item><sb-breadcrumb-link href="#">Home</sb-breadcrumb-link></sb-breadcrumb-item>
    <sb-breadcrumb-separator></sb-breadcrumb-separator>
    <sb-breadcrumb-item><sb-breadcrumb-link href="#">Library</sb-breadcrumb-link></sb-breadcrumb-item>
    <sb-breadcrumb-separator></sb-breadcrumb-separator>
    <sb-breadcrumb-item><sb-breadcrumb-page>Reports</sb-breadcrumb-page></sb-breadcrumb-item>
  </sb-breadcrumb-list>
</sb-breadcrumb>
</div>

```html
<sb-breadcrumb label="Breadcrumb">
  <sb-breadcrumb-list>
    <sb-breadcrumb-item><sb-breadcrumb-link href="#">Home</sb-breadcrumb-link></sb-breadcrumb-item>
    <sb-breadcrumb-separator></sb-breadcrumb-separator>
    <sb-breadcrumb-item><sb-breadcrumb-link href="#">Library</sb-breadcrumb-link></sb-breadcrumb-item>
    <sb-breadcrumb-separator></sb-breadcrumb-separator>
    <sb-breadcrumb-item><sb-breadcrumb-page>Reports</sb-breadcrumb-page></sb-breadcrumb-item>
  </sb-breadcrumb-list>
</sb-breadcrumb>
```

## Properties

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | `Breadcrumb` | Accessible name of the navigation landmark. Translate it, and make it unique when a page has several navigation landmarks. |

## Parts

### `<sb-breadcrumb-link>`

A link to an ancestor page.

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `href` | text |  | Link address. Without it the element renders an anchor without href, which is not focusable or a link. javascript:, vbscript: and data: URLs are dropped: the link renders without href and a console warning names it (SB-0115). |

### `<sb-breadcrumb-ellipsis>`

Stands for collapsed steps. Announced with a label so the gap is not silent.

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | `More` | Text read in place of the dots. Translate it. |

## Keyboard

| Key | Action |
| --- | --- |
| `Tab` | moves through the links in order |
| `Enter` | follows the focused link |

## Accessibility

- Role: `navigation (landmark) containing a list of listitems`
- Native element: `nav, a`
- Accessible name: label prop as aria-label on the inner nav; link text for links.
