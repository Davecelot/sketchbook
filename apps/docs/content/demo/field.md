---
title: "Field"
description: "Layout and grouping for form controls: a labelled row or column of label, control, description and error, plus sets, groups and dividers."
---

<!-- Generated from spec/components/field/contract.json by npm run docs:components. Do not edit by hand. -->

Tag `<sb-field>` · status `stable` · version `0.1.0`

## Example

<div class="live-demo">
<sb-field style="max-width:320px">
  <sb-field-label>Email</sb-field-label>
  <input type="email" autocomplete="email" />
  <sb-field-description>We only use it to send receipts.</sb-field-description>
</sb-field>
</div>

```html
<sb-field style="max-width:320px">
  <sb-field-label>Email</sb-field-label>
  <input type="email" autocomplete="email" />
  <sb-field-description>We only use it to send receipts.</sb-field-description>
</sb-field>
```

## Properties

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `orientation` | `vertical`, `horizontal` | `vertical` | vertical stacks label, control, description and error; horizontal puts the control and its text side by side (checkbox or switch rows). |
| `validation` | `none`, `error` | `none` | error marks the field as invalid: label turns to the error color, the native control gets aria-invalid, and children receive data-invalid. |

## Parts

### `<sb-field-set>`

A native fieldset with a visible legend that groups related fields into one named group.

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `legend` | text | `` | Visible group name; becomes the accessible name of the group. |

### `<sb-field-label>`

The visible label of a field. Names a native control through aria-labelledby and forwards clicks to it.

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `for` | text |  | Id of the control to focus or activate on click. sb-field fills it in for its native control. |

## Keyboard

| Key | Does |
| --- | --- |
| `Tab` | no stops of its own; moves between the controls inside |

## Accessibility

- Role: `none`
- Native element: `fieldset (sb-field-set only)`
- Accessible name: For a native input, select or textarea inside the field, the field wires aria-labelledby to its sb-field-label and aria-describedby to its sb-field-description and non-empty sb-field-error. sb-input, sb-checkbox and the other DS controls carry their own label, description and error inside their shadow root: they do not need Field for names, because ID references do not cross shadow roots (SB-0009). sb-field-set is a native fieldset named by its legend.
- Form: Layout only. Controls keep their own form behavior.
