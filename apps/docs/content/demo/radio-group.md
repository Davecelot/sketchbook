---
title: "Radio Group"
description: "Mutually exclusive choices shown all at once: picking one clears the others, and the group is the form field (Web Components)."
---

<!-- Generated from spec/components/radio-group/contract.json by npm run docs:components. Do not edit by hand. -->

Use `<sb-radio-group>` in HTML. [Lifecycle status](/reference/contract-format/#lifecycle-statuses) `stable` · Version `0.1.0`

## Example

Use the arrow keys to change the spacing choice. Only one option can be selected.

<div class="live-demo">
<sb-radio-group aria-label="Spacing" name="spacing" value="default">
  <sb-radio-group-item value="default" label="Default"></sb-radio-group-item>
  <sb-radio-group-item value="comfortable" label="Comfortable"></sb-radio-group-item>
  <sb-radio-group-item value="compact" label="Compact"></sb-radio-group-item>
</sb-radio-group>
</div>

```html
<sb-radio-group aria-label="Spacing" name="spacing" value="default">
  <sb-radio-group-item value="default" label="Default"></sb-radio-group-item>
  <sb-radio-group-item value="comfortable" label="Comfortable"></sb-radio-group-item>
  <sb-radio-group-item value="compact" label="Compact"></sb-radio-group-item>
</sb-radio-group>
```

## Properties

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `name` | text | `` | Form field name. The group submits the selected item's value under it. |
| `value` | text |  | Value of the selected item; null when none is selected. The initial attribute is the reset value. |
| `required` | boolean | `false` | A selection is required: valueMissing while none is selected; aria-required on the radiogroup. |
| `disabled` | boolean | `false` | Disables every item; the group is not submitted. |
| `orientation` | `vertical`, `horizontal` | `vertical` | Layout only; every arrow key moves in both orientations, as in a native radio group. |

## Events

| Name | Notes |
| --- | --- |
| `change` | Fired once after a person selects an item (click, label, Space or arrow key). Not fired when value is set from code or by form reset. |

## Parts

### `<sb-radio-group-item>`

One radio button of a sb-radio-group, with its label. The group owns its checked state.

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | text |  | Submitted as the group's value when selected. |
| `label` | text | `` | Visible label next to the control; names the radio. |
| `disabled` | boolean | `false` | Disables this item only; it is skipped by the arrows. |

## Keyboard

| Key | Action |
| --- | --- |
| `Tab` | enters the group on the selected item, else the first enabled one; leaves on the next Tab |
| `ArrowDown` | next item and select it (wraps) |
| `ArrowRight` | next item and select it (previous in RTL) |
| `ArrowUp` | previous item and select it (wraps) |
| `ArrowLeft` | previous item and select it (next in RTL) |
| `Home` | first enabled item, selected |
| `End` | last enabled item, selected |
| `Space` | select the focused item |
| `Enter` | submits the form (implicit submission; the control has no form owner in its shadow root, SB-0009) |

## Accessibility

- Role: `radiogroup`
- Native element: `input[type=radio]`
- Accessible name: Host aria-label is forwarded to the radiogroup; otherwise name it with a visible legend in a sb-field-set. Each item is named by its label.
- Form: The group is the form field (FormAssociated mixin): name, value, required, disabled. formValue is the selected value or null; form reset restores the initial value attribute; the validity anchor is the first enabled item's native radio, so reportValidity() focuses it. Items are not form-associated: native radios in separate shadow roots cannot form a native group, so the group owns exclusivity, the tab stop and arrow keys.
