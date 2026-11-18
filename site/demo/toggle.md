---
title: "Toggle"
description: "A pressable control that stays on or off until pressed again, for one setting such as bold (Web Component)."
---

<!-- Generated from spec/components/toggle/contract.json by scripts/docs-components.mjs. Do not edit by hand. -->

Tag `<sb-toggle>` · status `stable` · version `0.1.0`

## Example

<div class="live-demo">
<sb-toggle>Bold</sb-toggle>
</div>

```html
<sb-toggle>Bold</sb-toggle>
```

## Properties

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `variant` | `ghost`, `tertiary` | `ghost` | Variants: tertiary adds a border and a shadow. |
| `size` | `medium`, `small`, `large` | `medium` | Sizes: 32/36/40px high, at least as wide as high. |
| `selected` | boolean | `false` | On state. Toggled by click, Enter or Space; reflected as aria-pressed on the inner button. |
| `disabled` | boolean | `false` | Native disabled: dimmed, not interactive, out of the tab order. |

## Events

| Name | Notes |
| --- | --- |
| `change` | Fired after a person toggles it. Not fired when the selected property is set from code. |
| `click` | Pointer, Enter or Space. Cancelled while disabled. |

## Keyboard

| Key | Does |
| --- | --- |
| `Enter` | toggle |
| `Space` | toggle |
| `Tab` | move focus in and out |

## Accessibility

- Role: `button`
- Native element: `button`
- Accessible name: Default slot text. Host aria-label is forwarded to the inner button. aria-labelledby and aria-describedby are not forwarded: ID references do not resolve across shadow roots (SB-0009).
- Form: A toggle is an action button with state, not a form field: it submits nothing. It is formAssociated only to follow &lt;fieldset disabled&gt;.
