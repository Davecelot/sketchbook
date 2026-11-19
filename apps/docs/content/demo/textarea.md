---
title: "Textarea"
description: "A multi-line text field with label, description and error built in, taking part in forms."
---

<!-- Generated from spec/components/textarea/contract.json by npm run docs:components. Do not edit by hand. -->

Tag `<sb-textarea>` · status `stable` · version `0.1.0`

## Example

<div class="live-demo">
<div style="max-width:360px">
  <sb-textarea label="Message" placeholder="Write something…"></sb-textarea>
</div>
</div>

```html
<div style="max-width:360px">
  <sb-textarea label="Message" placeholder="Write something…"></sb-textarea>
</div>
```

## Properties

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text |  | Visible label and accessible name. Required: shadow DOM keeps external &lt;label for&gt; from reaching the inner textarea. |
| `hideLabel` | boolean | `false` | Visually hides the label; it stays the accessible name. |
| `description` | text | `` | Help text under the field. |
| `errorMessage` | text | `` | Error message. Setting it marks the field invalid. |
| `name` | text | `` | Form field name. |
| `value` | text | `` | Current text; submitted with the form. |
| `placeholder` | text | `` | Example of the expected input. Never a substitute for the label. |
| `autocomplete` | text | `` | Native autocomplete token (WCAG 1.3.5 for personal data). |
| `required` | boolean | `false` | Native required, plus an aria-hidden asterisk after the label. Explain * once per form. |
| `disabled` | boolean | `false` | Native disabled; dimmed; not submitted. |
| `readOnly` | boolean | `false` | Focusable and submitted; not editable. |
| `minlength` | number |  | Native validation. |
| `maxlength` | number |  | Native validation. |

## Events

| Name | Notes |
| --- | --- |
| `input` | Each edit. Native and composed, so it crosses the shadow boundary. |
| `change` | Value committed (blur). Re-dispatched from the host because native change is not composed. Enter inserts a newline and never changes the commit state. |

## Keyboard

| Key | Does |
| --- | --- |
| `Tab` | move focus in and out |
| `typing` | native multi-line text editing |
| `Enter` | inserts a newline; it never submits the owning form (native textarea behavior) |

## Accessibility

- Role: `textbox (multi-line)`
- Native element: `textarea`
- Accessible name: The label prop, through a native &lt;label for&gt; in the same shadow root.
- Form: ElementInternals: setFormValue on the textarea value, validity mirrored with setValidity (anchored to the inner textarea), formResetCallback restores the default value, disabled fields are not submitted.
