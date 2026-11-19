---
title: "Checkbox"
description: "A checkbox with its label, description and error laid out beside it, taking part in forms."
---

<!-- Generated from spec/components/checkbox/contract.json by npm run docs:components. Do not edit by hand. -->

Tag `<sb-checkbox>` · status `stable` · version `0.1.0`

## Example

<div class="live-demo">
<div style="max-width:360px">
  <sb-checkbox label="Send me product updates" description="At most one email a week."></sb-checkbox>
</div>
</div>

```html
<div style="max-width:360px">
  <sb-checkbox label="Send me product updates" description="At most one email a week."></sb-checkbox>
</div>
```

## Properties

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text |  | Visible label next to the box and accessible name. Required: shadow DOM keeps external &lt;label for&gt; from reaching the inner input. |
| `hideLabel` | boolean | `false` | Visually hides the label; it stays the accessible name. Use only when the row has other visible text naming the box. |
| `description` | text | `` | Help text under the label. |
| `errorMessage` | text | `` | Error message. Setting it marks the field invalid. |
| `name` | text | `` | Form field name. |
| `value` | text | `on` | Submitted with the form while checked. |
| `selected` | boolean | `false` | Current state. Not reflected: the attribute is the default restored by form reset. |
| `indeterminate` | boolean | `false` | Mixed state (dash). Cleared by the first user toggle. Not reflected. |
| `required` | boolean | `false` | Native required: must be checked. Adds an aria-hidden asterisk after the label. |
| `disabled` | boolean | `false` | Native disabled; dimmed; not submitted. |

## Events

| Name | Notes |
| --- | --- |
| `input` | Each toggle. Native and composed, so it crosses the shadow boundary. |
| `change` | Toggle committed. Re-dispatched from the host because native change is not composed (NativeControl). |

## Keyboard

| Key | Does |
| --- | --- |
| `Tab` | move focus to and from the checkbox |
| `Space` | toggles checked (native) |
| `Enter` | submits the form (implicit submission; the control has no form owner in its shadow root, SB-0009) |

## Accessibility

- Role: `checkbox`
- Native element: `input type=checkbox`
- Accessible name: The label prop, through a native &lt;label for&gt; in the same shadow root.
- Form: ElementInternals: setFormValue(value) only while checked, validity mirrored from the inner input (required -&gt; valueMissing), formResetCallback restores the default checked state, disabled is not submitted.
