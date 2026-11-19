---
title: "Typography"
description: "Styled text for headings, paragraphs, quotes, lists and inline emphasis, as one element with a kind that picks the native tag."
---

<!-- Generated from spec/components/typography/contract.json by npm run docs:components. Do not edit by hand. -->

Use `<sb-typography>` in HTML. [Lifecycle status](/reference/contract-format/#lifecycle-statuses) `stable` · Version `0.1.0`

## Example

Compare the heading, lead, body, and supporting note in one short passage.

<div class="live-demo">
<div style="max-width:32rem">
  <sb-typography kind="h2">Before you start</sb-typography>
  <sb-typography kind="lead">Give your team a project they can make their own.</sb-typography>
  <sb-typography kind="p">Start with a project name. You can add your team and choose the components you want to share after setup.</sb-typography>
  <sb-typography kind="muted">You can change the name any time.</sb-typography>
</div>
</div>

```html
<div style="max-width:32rem">
  <sb-typography kind="h2">Before you start</sb-typography>
  <sb-typography kind="lead">Give your team a project they can make their own.</sb-typography>
  <sb-typography kind="p">Start with a project name. You can add your team and choose the components you want to share after setup.</sb-typography>
  <sb-typography kind="muted">You can change the name any time.</sb-typography>
</div>
```

## Properties

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `kind` | `h1`, `h2`, `h3`, `h4`, `p`, `blockquote`, `list`, `inline-code`, `lead`, `large`, `small`, `muted` | `p` | Picks the native element and the text style: h1-h4 headings, p, blockquote, list (ul around slotted li), inline-code (code), lead (p), large (div), small (small), muted (p). Heading level follows the kind; there is no separate level prop. |
| `content` | slot |  | Default slot: the text. For kind list, slot li elements. |

## Accessibility

- Role: `Native role of the chosen element: heading (level 1-4) for h1-h4, paragraph for p, lead and muted, blockquote, list with listitem for list, code for inline-code, generic for large and small`
- Native element: `h1, h2, h3, h4, p, blockquote, ul, code, div, small`
- Accessible name: Content. Text elements are not named by an attribute.
