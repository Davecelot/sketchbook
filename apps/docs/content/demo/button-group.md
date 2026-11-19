---
title: "Button Group"
description: "Joins related buttons, with optional dividers and text labels, into one connected strip."
---

<!-- Generated from spec/components/button-group/contract.json by npm run docs:components. Do not edit by hand. -->

Use `<sb-button-group>` in HTML. [Lifecycle status](/reference/contract-format/#lifecycle-statuses) `stable` · Version `0.1.0`

## Example

Archive, Report, and Snooze act on the same message. The group keeps those actions together.

<div class="live-demo">
<sb-button-group aria-label="Message actions">
  <sb-button variant="tertiary">Archive</sb-button>
  <sb-button variant="tertiary">Report</sb-button>
  <sb-button variant="tertiary">Snooze</sb-button>
</sb-button-group>
</div>

```html
<sb-button-group aria-label="Message actions">
  <sb-button variant="tertiary">Archive</sb-button>
  <sb-button variant="tertiary">Report</sb-button>
  <sb-button variant="tertiary">Snooze</sb-button>
</sb-button-group>
```

## Properties

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `orientation` | `horizontal`, `vertical` | `horizontal` | Direction of the strip. Vertical stacks the children and joins their top and bottom edges. |

## Keyboard

| Key | Action |
| --- | --- |
| `Tab` | each button is its own tab stop; the group adds none |

## Accessibility

- Role: `group`
- Native element: `div`
- Accessible name: Host aria-label is forwarded to the group. Name it when the buttons together express one control (for example a split button) and the surrounding text does not.
- Form: Layout only. Buttons inside keep their own behavior.
