---
title: "Native Select"
description: "A native select with label, description and error built in, taking part in forms. Options are plain <option> and <optgroup> children."
---

<!-- Generated from spec/components/native-select/contract.json by npm run docs:components. Do not edit by hand. -->

Tag `<sb-native-select>` · status `stable` · version `0.1.0`

## Example

<div class="live-demo">
<div style="max-width:320px">
  <sb-native-select label="Region">
    <option value="">Choose a region</option>
    <option value="north">North</option>
    <option value="south">South</option>
    <option value="east">East</option>
  </sb-native-select>
</div>
</div>

```html
<div style="max-width:320px">
  <sb-native-select label="Region">
    <option value="">Choose a region</option>
    <option value="north">North</option>
    <option value="south">South</option>
    <option value="east">East</option>
  </sb-native-select>
</div>
```

## Properties

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text |  | Visible label and accessible name. Required: shadow DOM keeps external &lt;label for&gt; from reaching the inner select. |
| `hideLabel` | boolean | `false` | Visually hides the label; it stays the accessible name. |
| `description` | text | `` | Help text under the field. |
| `errorMessage` | text | `` | Error message. Setting it marks the field invalid. |
| `size` | `medium`, `small` | `medium` | Control height: medium 36px, small 32px. |
| `name` | text | `` | Form field name. |
| `value` | text | `` | Value of the selected option; submitted with the form. Without it, the option marked selected (else the first option) is the default restored by form reset. |
| `required` | boolean | `false` | Native required: the selected option must have a non-empty value. Adds an aria-hidden asterisk after the label. |
| `disabled` | boolean | `false` | Native disabled; dimmed; not submitted. |

## Events

| Name | Notes |
| --- | --- |
| `input` | Each selection change. Native and composed, so it crosses the shadow boundary. |
| `change` | Selection committed. Re-dispatched from the host because native change is not composed (NativeControl). |

## Keyboard

| Key | Does |
| --- | --- |
| `Tab` | move focus in and out |
| `Space / Enter / Alt+ArrowDown` | open the native popup (platform behavior) |
| `ArrowUp / ArrowDown` | change or move through options (platform behavior) |
| `typing` | jump to the option starting with the typed text |

## Accessibility

- Role: `combobox (a native single-selection <select>; listbox when size > 1)`
- Native element: `select`
- Accessible name: The label prop, through a native &lt;label for&gt; in the same shadow root.
- Form: ElementInternals: setFormValue(value), validity mirrored from the inner select (required -&gt; valueMissing) with setValidity, formResetCallback restores the default selection, disabled is not submitted.
