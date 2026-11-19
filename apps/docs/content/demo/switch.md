---
title: "Switch"
description: "A switch: a native checkbox exposed as role=\"switch\", with label, description and error laid out beside it, taking part in forms."
---

<!-- Generated from spec/components/switch/contract.json by npm run docs:components. Do not edit by hand. -->

Use `<sb-switch>` in HTML. [Lifecycle status](/reference/contract-format/#lifecycle-statuses) `stable` · Version `0.1.0`

## Example

Turn Offline mode on or off. The description explains what enabling it does.

<div class="live-demo">
<div style="max-width:360px">
  <sb-switch label="Offline mode" description="Keep your work available without a connection."></sb-switch>
</div>
</div>

```html
<div style="max-width:360px">
  <sb-switch label="Offline mode" description="Keep your work available without a connection."></sb-switch>
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
| `selected` | boolean | `false` | On/off state. Not reflected: the attribute is the default restored by form reset. |
| `required` | boolean | `false` | Native required: must be checked. Adds an aria-hidden asterisk after the label. |
| `disabled` | boolean | `false` | Native disabled; dimmed; not submitted. |
| `size` | `medium`, `small` | `medium` | Track and thumb size. medium 32x20, small 24x16. |

## Events

| Name | Notes |
| --- | --- |
| `input` | Each toggle. Native and composed, so it crosses the shadow boundary. |
| `change` | Toggle committed. Re-dispatched from the host because native change is not composed (NativeControl). |

## Keyboard

| Key | Action |
| --- | --- |
| `Tab` | move focus to and from the switch |
| `Space` | toggles on/off (native) |
| `Enter` | submits the form (implicit submission; the control has no form owner in its shadow root, SB-0009) |

## Accessibility

- Role: `switch`
- Native element: `input type=checkbox role=switch`
- Accessible name: The label prop, through a native &lt;label for&gt; in the same shadow root.
- Form: ElementInternals: setFormValue(value) only while on, validity mirrored from the inner input (required -&gt; valueMissing), formResetCallback restores the default state, disabled is not submitted.
