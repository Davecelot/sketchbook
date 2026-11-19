---
title: "Input Group"
description: "One bordered shell around a text input or textarea with addons (icons, text, buttons) before, after, above or below it."
---

<!-- Generated from spec/components/input-group/contract.json by npm run docs:components. Do not edit by hand. -->

Use `<sb-input-group>` in HTML. [Lifecycle status](/reference/contract-format/#lifecycle-statuses) `stable` · Version `0.1.0`

## Example

The search icon sits in an add-on next to the input. The input keeps Search as its accessible name without showing a separate label.

<div class="live-demo">
<sb-input-group style="max-width:24rem">
  <sb-input hide-label label="Search" placeholder="Search..."></sb-input>
  <sb-input-group-addon>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
  </sb-input-group-addon>
</sb-input-group>
</div>

```html
<sb-input-group style="max-width:24rem">
  <sb-input hide-label label="Search" placeholder="Search..."></sb-input>
  <sb-input-group-addon>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
  </sb-input-group-addon>
</sb-input-group>
```

## Properties

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `validation` | `none`, `error` | `none` | error draws the whole shell in the error color and sets aria-invalid="true" on the slotted control (a native input or textarea directly; a sb-input or sb-textarea on its host, which passes it to its inner control). Also give the error message outside the shell (sb-field-error). |

## Parts

### `<sb-input-group-addon>`

A strip of content (icon, text or buttons) placed before, after, above or below the control inside the shell.

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `align` | `inline-start`, `inline-end`, `block-start`, `block-end` | `inline-start` | Where the addon sits. A block-* addon turns the shell into a column. |

### `<sb-input-group-button>`

A compact sb-button for use inside an addon. An icon-only one needs aria-label.

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `variant` | `ghost`, `primary`, `tertiary`, `secondary` | `ghost` | Passed to the inner sb-button. |
| `size` | `tiny`, `small`, `icon-tiny`, `icon-small` | `tiny` | Passed to the inner sb-button; icon sizes are square. |
| `type` | `button`, `submit`, `reset` | `button` | Submit and reset are done by the group button itself (it is form-associated for that), because the inner sb-button sits in a shadow root outside the page's form. name and value are not supported. |
| `disabled` | boolean | `false` | Passed to the inner sb-button. |

| Event | Notes |
| --- | --- |
| `click` | From the inner button; cancelled while disabled. |

## Keyboard

| Key | Action |
| --- | --- |
| `Tab` | control, then each addon button in DOM order |
| `Enter` | in a text input, submits through the control; on an addon button, activates it |

## Accessibility

- Role: `group`
- Native element: `input, textarea`
- Accessible name: The control keeps its own name: sb-input needs label (use hide-label), a native control needs aria-label or an external label. The shell exposes role=group named by the host aria-label only when one is set. Icon-only sb-input-group-button children need aria-label.
- Form: The slotted control is the form field; the shell adds none.
