---
title: "Slider"
description: "A slider for picking a number, or a range with two thumbs, built on native range inputs, with label, description and error built in, taking part in forms."
---

<!-- Generated from spec/components/slider/contract.json by npm run docs:components. Do not edit by hand. -->

Use `<sb-slider>` in HTML. [Lifecycle status](/reference/contract-format/#lifecycle-statuses) `stable` · Version `0.1.0`

## Example

Focus Volume and use the arrow keys to change its value. The example starts at 40.

<div class="live-demo">
<div style="max-width:320px">
  <sb-slider label="Volume" value="40"></sb-slider>
</div>
</div>

```html
<div style="max-width:320px">
  <sb-slider label="Volume" value="40"></sb-slider>
</div>
```

## Properties

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text |  | Visible label and accessible name. With two values each thumb is named "&lt;label&gt; minimum" and "&lt;label&gt; maximum". |
| `hideLabel` | boolean | `false` | Visually hides the label; it stays the accessible name. |
| `description` | text | `` | Help text under the field. |
| `errorMessage` | text | `` | Error message. Setting it marks the field invalid. |
| `name` | text | `` | Form field name. A range submits one entry per thumb under this name. |
| `value` | text | `` | Current values as numbers separated by commas: "40" for one thumb, "20,80" for a range. One thumb per number. Empty means the minimum. Not reflected: the attribute is the default restored by form reset. |
| `min` | number | `0` | Lowest value. |
| `max` | number | `100` | Highest value. |
| `step` | number | `1` | Increment for keys and snapping. |
| `orientation` | `horizontal`, `vertical` | `horizontal` | Direction of the track. Vertical grows upward. |
| `required` | boolean | `false` | Accepted for form-associated parity; a slider always has a value, so it never blocks submission and shows no asterisk. |
| `disabled` | boolean | `false` | Native disabled; dimmed; not submitted. |

## Events

| Name | Notes |
| --- | --- |
| `input` | While a thumb moves. Native and composed; a press on the track of a range emits an equivalent event from the host. |
| `change` | Value committed (key press, release). Re-dispatched from the host because native change is not composed (NativeControl). |

## Keyboard

| Key | Action |
| --- | --- |
| `Tab` | move between thumbs and out |
| `ArrowRight / ArrowUp` | increase by step |
| `ArrowLeft / ArrowDown` | decrease by step |
| `PageUp / PageDown` | larger increase or decrease (native) |
| `Home / End` | jump to the minimum or maximum |
| `Enter` | submits the form (implicit submission; the control has no form owner in its shadow root, SB-0009) |

## Accessibility

- Role: `slider (one per thumb)`
- Native element: `input type=range`
- Accessible name: The label prop through a native &lt;label for&gt; on the first thumb; with a range each thumb also gets an aria-label ("&lt;label&gt; minimum", "&lt;label&gt; maximum").
- Form: ElementInternals: setFormValue with the value, or one entry per thumb for a range; the inner input anchors validity (errorMessage sets customError); formResetCallback restores the default values; disabled is not submitted.
