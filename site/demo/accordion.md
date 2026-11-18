---
title: "Accordion"
description: "Sections behind headings: people open only the parts they need, which keeps long pages short. Four custom elements share state through context."
---

<!-- Generated from spec/components/accordion/contract.json by scripts/docs-components.mjs. Do not edit by hand. -->

Tag `<sb-accordion>` · status `stable` · version `0.1.0`

## Example

<div class="live-demo">
<sb-accordion selection="single" collapsible style="display:block;width:450px">
  <sb-accordion-item value="item-1">
    <sb-accordion-trigger>Shipping</sb-accordion-trigger>
    <sb-accordion-content>Orders ship within two days.</sb-accordion-content>
  </sb-accordion-item>
  <sb-accordion-item value="item-2">
    <sb-accordion-trigger>Returns</sb-accordion-trigger>
    <sb-accordion-content>Returns are accepted for a month.</sb-accordion-content>
  </sb-accordion-item>
  <sb-accordion-item value="item-3">
    <sb-accordion-trigger>Warranty</sb-accordion-trigger>
    <sb-accordion-content>Coverage lasts one year.</sb-accordion-content>
  </sb-accordion-item>
</sb-accordion>
</div>

```html
<sb-accordion selection="single" collapsible style="display:block;width:450px">
  <sb-accordion-item value="item-1">
    <sb-accordion-trigger>Shipping</sb-accordion-trigger>
    <sb-accordion-content>Orders ship within two days.</sb-accordion-content>
  </sb-accordion-item>
  <sb-accordion-item value="item-2">
    <sb-accordion-trigger>Returns</sb-accordion-trigger>
    <sb-accordion-content>Returns are accepted for a month.</sb-accordion-content>
  </sb-accordion-item>
  <sb-accordion-item value="item-3">
    <sb-accordion-trigger>Warranty</sb-accordion-trigger>
    <sb-accordion-content>Coverage lasts one year.</sb-accordion-content>
  </sb-accordion-item>
</sb-accordion>
```

## Properties

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `selection` | `single`, `multiple` | `single` | single opens one item at a time; multiple lets any number be open. |
| `collapsible` | boolean | `false` | With selection=single, lets the open item be closed. Without it the open item's trigger is aria-disabled so one item always stays open. Ignored for multiple. |
| `value` | text | `` | The open item value. With selection=multiple, a space-separated list of item values. Updated when a person opens or closes an item. |
| `disabled` | boolean | `false` | Disables every item. |

## Events

| Name | Notes |
| --- | --- |
| `change` | Fires on the sb-accordion host after a person opens or closes an item. detail.value lists the open item values. Not fired for changes made from code. A change from a form control inside the content also bubbles to the host: listen with event.target === host (that one has no detail). |

## Parts

### `<sb-accordion-item>`

One collapsible section: a trigger and its content, with a bottom border.

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | text | `` | Identifies the item in the accordion value. Must be unique within the accordion. |
| `disabled` | boolean | `false` | Disables this item's trigger. |

### `<sb-accordion-trigger>`

The heading and button that toggles its item, with a chevron.

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `level` | number | `3` | Heading level of the wrapper (aria-level), 2 to 6. Pick the level that fits the page outline. |

| Event | Notes |
| --- | --- |
| `click` | Toggles the item. |

## Keyboard

| Key | Does |
| --- | --- |
| `Enter` | toggle the focused item |
| `Space` | toggle the focused item |
| `ArrowDown` | focus the next enabled trigger, wrapping to the first |
| `ArrowUp` | focus the previous enabled trigger, wrapping to the last |
| `Home` | focus the first enabled trigger |
| `End` | focus the last enabled trigger |
| `Tab` | every enabled trigger stays in the tab order |

## Accessibility

- Role: `heading + button per item; region per open panel`
- Native element: `button`
- Accessible name: Trigger text. The panel is named by its trigger.
