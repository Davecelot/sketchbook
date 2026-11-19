---
title: "Separator"
description: "A thin line that separates content, horizontal or vertical, decorative or announced as a separator."
---

<!-- Generated from spec/components/separator/contract.json by npm run docs:components. Do not edit by hand. -->

Use `<sb-separator>` in HTML. [Lifecycle status](/reference/contract-format/#lifecycle-statuses) `stable` · Version `0.1.0`

## Example

The divider separates the account overview from notification settings.

<div class="live-demo">
<div style="max-width:20rem">
  <div style="font-weight:500">Account settings</div>
  <div style="color:var(--sb-color-muted-foreground)">Manage your profile and preferences.</div>
  <sb-separator style="margin:16px 0"></sb-separator>
  <div>Notifications</div>
</div>
</div>

```html
<div style="max-width:20rem">
  <div style="font-weight:500">Account settings</div>
  <div style="color:var(--sb-color-muted-foreground)">Manage your profile and preferences.</div>
  <sb-separator style="margin:16px 0"></sb-separator>
  <div>Notifications</div>
</div>
```

## Properties

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `orientation` | `horizontal`, `vertical` | `horizontal` | Direction of the line. Horizontal is full width and 1px high; vertical is 1px wide and as high as its container. |
| `decorative` | boolean | `true` | Default true. True removes the separator from the accessibility tree (role none). Set decorative="false" (or the property to false) to expose role separator. Because an attribute cannot default to true in HTML, the value "false" turns it off. |

## Accessibility

- Role: `separator when decorative is false; none when decorative`
- Accessible name: None: a separator is not named.
