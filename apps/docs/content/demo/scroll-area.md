---
title: "Scroll Area"
description: "A region that scrolls its content natively, with themed thin scrollbars and keyboard access when there is something to scroll to."
---

<!-- Generated from spec/components/scroll-area/contract.json by npm run docs:components. Do not edit by hand. -->

Tag `<sb-scroll-area>` · status `stable` · version `0.1.0`

## Example

<div class="live-demo">
<sb-scroll-area label="Release notes" style="display:block;height:200px;width:240px">
  <div style="padding:8px 0">Entry 1</div>
  <div style="padding:8px 0">Entry 2</div>
  <div style="padding:8px 0">Entry 3</div>
  <div style="padding:8px 0">Entry 4</div>
  <div style="padding:8px 0">Entry 5</div>
  <div style="padding:8px 0">Entry 6</div>
  <div style="padding:8px 0">Entry 7</div>
  <div style="padding:8px 0">Entry 8</div>
  <div style="padding:8px 0">Entry 9</div>
  <div style="padding:8px 0">Entry 10</div>
</sb-scroll-area>
</div>

```html
<sb-scroll-area label="Release notes" style="display:block;height:200px;width:240px">
  <div style="padding:8px 0">Entry 1</div>
  <div style="padding:8px 0">Entry 2</div>
  <div style="padding:8px 0">Entry 3</div>
  <div style="padding:8px 0">Entry 4</div>
  <div style="padding:8px 0">Entry 5</div>
  <div style="padding:8px 0">Entry 6</div>
  <div style="padding:8px 0">Entry 7</div>
  <div style="padding:8px 0">Entry 8</div>
  <div style="padding:8px 0">Entry 9</div>
  <div style="padding:8px 0">Entry 10</div>
</sb-scroll-area>
```

## Properties

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | `` | Accessible name of the scrollable region. Required for a good experience: it names the focus stop that keyboard users land on. |

## Parts

### `<sb-scroll-bar>`

Declares which axis the scroll area scrolls on. The scrollbar itself is native; this element only switches the axis on.

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `orientation` | `vertical`, `horizontal` | `vertical` | The axis to enable. A scroll area with no sb-scroll-bar scrolls vertically; with some, it scrolls on exactly the axes they name. |

## Keyboard

| Key | Does |
| --- | --- |
| `Tab` | focus the viewport while it can scroll |
| `ArrowUp` | scroll up (native) |
| `ArrowDown` | scroll down (native) |
| `ArrowLeft` | scroll left (native) |
| `ArrowRight` | scroll right (native) |
| `PageUp` | scroll one page up (native) |
| `PageDown` | scroll one page down (native) |
| `Home` | scroll to the start (native) |
| `End` | scroll to the end (native) |

## Accessibility

- Role: `region while scrollable, otherwise none`
- Accessible name: label prop. Without a label the viewport stays focusable but is not exposed as a region, and a console warning fires once per element.
