---
title: "Toggle Group"
description: "Related on/off controls in one row: pick exactly one, or turn several on, like text alignment or formatting (Web Components)."
---

<!-- Generated from spec/components/toggle-group/contract.json by npm run docs:components. Do not edit by hand. -->

Tag `<sb-toggle-group>` · status `stable` · version `0.1.0`

## Example

<div class="live-demo">
<sb-toggle-group aria-label="Text formatting" selection="multiple">
  <sb-toggle-group-item value="bold" aria-label="Bold">B</sb-toggle-group-item>
  <sb-toggle-group-item value="italic" aria-label="Italic">I</sb-toggle-group-item>
  <sb-toggle-group-item value="underline" aria-label="Underline">U</sb-toggle-group-item>
</sb-toggle-group>
</div>

```html
<sb-toggle-group aria-label="Text formatting" selection="multiple">
  <sb-toggle-group-item value="bold" aria-label="Bold">B</sb-toggle-group-item>
  <sb-toggle-group-item value="italic" aria-label="Italic">I</sb-toggle-group-item>
  <sb-toggle-group-item value="underline" aria-label="Underline">U</sb-toggle-group-item>
</sb-toggle-group>
```

## Properties

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `selection` | `single`, `multiple` | `single` | single: at most one item is pressed (pressing it again clears it). multiple: any number. |
| `variant` | `ghost`, `tertiary` | `ghost` | Applied to every item. |
| `size` | `medium`, `small`, `large` | `medium` | Applied to every item. |
| `spacing` | number | `0` | Gap between items in 4px units. 0 joins the items into one bar with shared borders. |
| `orientation` | `horizontal`, `vertical` | `horizontal` | Layout and arrow-key axis. |
| `value` | text |  | Values of the pressed items. Property: string[]. Attribute: space-separated values. |
| `disabled` | boolean | `false` | Disables every item. |

## Events

| Name | Notes |
| --- | --- |
| `change` | Fired after a person changes the pressed items. Not fired when value is set from code. |

## Parts

### `<sb-toggle-group-item>`

One toggle button of a sb-toggle-group. Takes variant, size and orientation from the group.

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | text |  | Identifies the item in the group's value. |
| `disabled` | boolean | `false` | Disables this item only; it is skipped by the arrows. |

| Event | Notes |
| --- | --- |
| `click` | Pointer, Enter or Space. Cancelled while disabled. |

## Keyboard

| Key | Does |
| --- | --- |
| `Tab` | enters the group on one item (the first pressed item, else the first enabled one) and leaves it |
| `ArrowRight` | next item (ArrowLeft in RTL), wraps |
| `ArrowLeft` | previous item (ArrowRight in RTL), wraps |
| `ArrowDown` | next item (vertical orientation) |
| `ArrowUp` | previous item (vertical orientation) |
| `Home` | first enabled item |
| `End` | last enabled item |
| `Enter` | toggle the focused item |
| `Space` | toggle the focused item |

## Accessibility

- Role: `group`
- Native element: `button`
- Accessible name: Host aria-label is forwarded to the group; a group of toggles needs a name when its purpose is not clear from the surrounding text. Each item is named by its text or its own aria-label.
- Form: Not a form field. formAssociated only to follow &lt;fieldset disabled&gt;.
