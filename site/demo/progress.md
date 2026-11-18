---
title: "Progress"
description: "A horizontal bar that shows how far a task has come, or that it is still working when the amount is not known."
---

<!-- Generated from spec/components/progress/contract.json by scripts/docs-components.mjs. Do not edit by hand. -->

Tag `<sb-progress>` · status `stable` · version `0.1.0`

## Example

<div class="live-demo">
<sb-progress value="60" label="Upload progress" style="display:block;width:320px"></sb-progress>
</div>

```html
<sb-progress value="60" label="Upload progress" style="display:block;width:320px"></sb-progress>
```

## Properties

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | number |  | Current amount, from 0 to max. Values outside the range are clamped. When absent the bar is indeterminate. An empty value attribute is the same as no value (indeterminate). |
| `max` | number | `100` | The amount that means done. Must be greater than 0. |
| `label` | text | `` | Accessible name of the bar, not drawn. Alternatively use aria-label or aria-labelledby on the host. |

## Accessibility

- Role: `progressbar`
- Accessible name: label prop, else aria-label or aria-labelledby on the host. The host carries the role, so aria-labelledby resolves in the page.
