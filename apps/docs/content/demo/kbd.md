---
title: "Kbd"
description: "Marks up a key or shortcut people should press, such as Ctrl + K."
---

<!-- Generated from spec/components/kbd/contract.json by npm run docs:components. Do not edit by hand. -->

Use `<sb-kbd>` in HTML. [Lifecycle status](/reference/contract-format/#lifecycle-statuses) `stable` · Version `0.1.0`

## Example

Notice how the key name stands out within the instruction. Use this treatment when you name keys in prose.

<div class="live-demo">
<span>Press <sb-kbd>Esc</sb-kbd> to close.</span>
</div>

```html
<span>Press <sb-kbd>Esc</sb-kbd> to close.</span>
```

## Properties



## Accessibility

- Role: `generic (kbd has no ARIA role); the text is read as is`
- Native element: `kbd`
- Accessible name: Content: the key text. An icon-only key needs a visually hidden or aria-label name from the author.
