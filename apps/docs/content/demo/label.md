---
title: "Label"
description: "A stand-alone text label for a control: it forwards clicks to the control and, where the platform allows, names it."
---

<!-- Generated from spec/components/label/contract.json by npm run docs:components. Do not edit by hand. -->

Use `<sb-label>` in HTML. [Lifecycle status](/reference/contract-format/#lifecycle-statuses) `stable` · Version `0.1.0`

## Example

Select Email to focus the input. The label’s `for` value matches the input’s `id`.

<div class="live-demo">
<div style="display:grid;gap:8px;max-width:320px">
  <sb-label for="docs-email">Email</sb-label>
  <input id="docs-email" type="email" />
</div>
</div>

```html
<div style="display:grid;gap:8px;max-width:320px">
  <sb-label for="docs-email">Email</sb-label>
  <input id="docs-email" type="email" />
</div>
```

## Properties

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `htmlFor` | text | `` | The id of the control to label, looked up in the same document or shadow tree as the label. Without it, the first control inside the label is used. |
| `disabled` | boolean | `false` | Dims the label and stops it forwarding clicks. Set it when the labelled control is disabled; the label does not read the control's state. |

## Accessibility

- Role: `none on the host: the name is delivered to the control, not announced as a role`
- Accessible name: The label's text content names the control through aria-labelledby, set on the control (see association rules).
