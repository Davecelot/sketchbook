---
title: "Input"
description: "A single-line text field with its label, description and error built in, taking part in forms."
---

<!-- Generated from spec/components/input/contract.json by scripts/docs-components.mjs. Do not edit by hand. -->

Tag `<sb-input>` · status `stable` · version `0.1.0`

## Example

<div class="live-demo">
<div style="max-width:320px">
  <sb-input label="Email" type="email" placeholder="name@example.com" autocomplete="email" description="We only use it to send receipts."></sb-input>
</div>
</div>

```html
<div style="max-width:320px">
  <sb-input label="Email" type="email" placeholder="name@example.com" autocomplete="email" description="We only use it to send receipts."></sb-input>
</div>
```

## Properties

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text |  | Visible label and accessible name. Required: shadow DOM keeps an external &lt;label for&gt; from reaching the inner input. |
| `hideLabel` | boolean | `false` | Visually hides the label; it stays the accessible name. |
| `description` | text | `` | Help text under the field. |
| `errorMessage` | text | `` | Error message. Setting it marks the field invalid. |
| `type` | `text`, `email`, `password`, `search`, `tel`, `url`, `number` | `text` | Native input type. |
| `name` | text | `` | Form field name. |
| `value` | text | `` | Current value; submitted with the form. |
| `placeholder` | text | `` | Example of the expected input. Never a substitute for the label. |
| `autocomplete` | text | `` | Native autocomplete token (WCAG 1.3.5 for personal data). |
| `required` | boolean | `false` | Native required, plus an aria-hidden asterisk after the label. Explain * once per form. |
| `disabled` | boolean | `false` | Native disabled; dimmed; not submitted. |
| `readOnly` | boolean | `false` | Focusable and submitted; not editable. |
| `minlength` | number |  | Native validation. |
| `maxlength` | number |  | Native validation. |
| `pattern` | text | `` | Native validation. |

## Events

| Name | Notes |
| --- | --- |
| `input` | Each edit. Native and composed, so it crosses the shadow boundary. |
| `change` | Value committed (blur or Enter). Re-dispatched from the host because native change is not composed (NativeControl mixin). |

## Keyboard

| Key | Does |
| --- | --- |
| `Tab` | move focus in and out |
| `typing` | native text editing |
| `Enter` | submits the owning form (handled by the component: the inner input has no form owner) |

## Accessibility

- Role: `textbox (searchbox for type=search)`
- Native element: `input`
- Accessible name: The label prop, through a native &lt;label for&gt; in the same shadow root.
- Form: ElementInternals: setFormValue on input, validity mirrored with setValidity (anchored to the inner input), formResetCallback restores the default value, disabled fields are not submitted.
