---
title: "Spinner"
description: "A small rotating mark that says work is in progress and its end is unknown."
---

<!-- Generated from spec/components/spinner/contract.json by npm run docs:components. Do not edit by hand. -->

Use `<sb-spinner>` in HTML. [Lifecycle status](/reference/contract-format/#lifecycle-statuses) `stable` · Version `0.1.0`

## Example

The spinner shows that work is still in progress. Its label tells assistive technology what the indicator means.

<div class="live-demo">
<sb-spinner label="Loading"></sb-spinner>
</div>

```html
<sb-spinner label="Loading"></sb-spinner>
```

## Properties

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | `Loading` | Accessible name announced by the status role. Change it to say what is loading. |
| `decorative` | boolean | `false` | Hides the spinner from assistive technology. Use it when the container already announces busy (e.g. a loading Button). |

## Accessibility

- Role: `status`
- Accessible name: The label prop as aria-label on the host (default "Loading").
