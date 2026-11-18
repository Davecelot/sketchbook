---
title: "Dialog"
description: "A modal window over the page: the rest of the page is inert until it closes. Used for a focused task (search, a short form, a confirmation). Eight custom elements share the open state through context."
---

<!-- Generated from spec/components/dialog/contract.json by scripts/docs-components.mjs. Do not edit by hand. -->

Tag `<sb-dialog>` · status `stable` · version `0.1.0`

## Example

<div class="live-demo">
<sb-dialog>
  <sb-dialog-trigger><sb-button variant="tertiary">Edit profile</sb-button></sb-dialog-trigger>
  <sb-dialog-content>
    <sb-dialog-header>
      <sb-dialog-title>Edit profile</sb-dialog-title>
      <sb-dialog-description>Make changes to your profile here. Save when you are done.</sb-dialog-description>
    </sb-dialog-header>
    <sb-dialog-footer>
      <sb-dialog-close><sb-button variant="tertiary">Cancel</sb-button></sb-dialog-close>
      <sb-dialog-close><sb-button>Save changes</sb-button></sb-dialog-close>
    </sb-dialog-footer>
  </sb-dialog-content>
</sb-dialog>
</div>

```html
<sb-dialog>
  <sb-dialog-trigger><sb-button variant="tertiary">Edit profile</sb-button></sb-dialog-trigger>
  <sb-dialog-content>
    <sb-dialog-header>
      <sb-dialog-title>Edit profile</sb-dialog-title>
      <sb-dialog-description>Make changes to your profile here. Save when you are done.</sb-dialog-description>
    </sb-dialog-header>
    <sb-dialog-footer>
      <sb-dialog-close><sb-button variant="tertiary">Cancel</sb-button></sb-dialog-close>
      <sb-dialog-close><sb-button>Save changes</sb-button></sb-dialog-close>
    </sb-dialog-footer>
  </sb-dialog-content>
</sb-dialog>
```

## Properties

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `open` | boolean | `false` | Whether the dialog is showing. The trigger, the close controls, Escape and a backdrop click change it; code can set it too. Set on first render, the dialog opens as soon as it is connected. |

## Events

| Name | Notes |
| --- | --- |
| `sb-toggle` | fires on the sb-dialog host after open changes, from a person or from code (like the native dialog's toggle and Collapsible). Read host.open for the new state. Bubbles and is composed, so a listener on an outer dialog also receives a nested dialog's sb-toggle: check event.target. |
| `sb-cancel` | fires on the sb-dialog host before Escape or a backdrop click closes the dialog (like the native dialog's cancel). preventDefault() keeps it open, for example to confirm discarding unsaved input. Not fired for the close button, sb-dialog-close or code. Bubbles and is composed, so a listener on an outer dialog also receives a nested dialog's sb-cancel: check event.target before calling preventDefault(). |

## Parts

### `<sb-dialog-content>`

The modal surface: a bordered, shadowed panel centered over a dimmed backdrop, with a close button in its top inline-end corner.

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `hideCloseButton` | boolean | `false` | Hides the built-in close button. Named so the attribute is off by default (the visual reference shows the button by default). Keep another visible way to close, such as a Cancel button in sb-dialog-close (APG). |
| `closeLabel` | text | `Close` | Accessible name of the built-in close button. Translate it. |

## Keyboard

| Key | Does |
| --- | --- |
| `Escape` | close the dialog (fires sb-cancel first; a prevented sb-cancel keeps it open); ignored while an input method is composing text |
| `Tab` | move to the next focusable element inside the dialog; from the last it wraps to the first (Shift+Tab from the first wraps to the last); the page behind is inert |
| `Shift+Tab` | move to the previous focusable element inside the dialog |
| `Enter` | on the trigger's control, open the dialog |
| `Space` | on the trigger's control, open the dialog |

## Accessibility

- Role: `dialog (modal)`
- Native element: `dialog`
- Accessible name: the sb-dialog-title text, through an element reference (ID references do not cross shadow roots, SB-0009); with no title, host aria-label on sb-dialog-content is forwarded. The description, when present, is the accessible description.
