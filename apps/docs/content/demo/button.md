---
title: "Button"
description: "The control people press to do one thing now: run an action, submit or reset its form, or, with href, open a link styled as a button."
---

<!-- Generated from spec/components/button/contract.json by npm run docs:components. Do not edit by hand. -->

Use `<sb-button>` in HTML. [Lifecycle status](/reference/contract-format/#lifecycle-statuses) `stable` · Version `0.1.0`

## Example

Compare how the variants draw attention. Save changes is the primary action, while Delete uses the destructive variant to signal its consequence.

<div class="live-demo">
<div style="display:flex;gap:8px;flex-wrap:wrap">
  <sb-button>Save changes</sb-button>
  <sb-button variant="secondary">Secondary</sb-button>
  <sb-button variant="tertiary">Tertiary</sb-button>
  <sb-button variant="ghost">Ghost</sb-button>
  <sb-button variant="destructive">Delete</sb-button>
</div>
</div>

```html
<div style="display:flex;gap:8px;flex-wrap:wrap">
  <sb-button>Save changes</sb-button>
  <sb-button variant="secondary">Secondary</sb-button>
  <sb-button variant="tertiary">Tertiary</sb-button>
  <sb-button variant="ghost">Ghost</sb-button>
  <sb-button variant="destructive">Delete</sb-button>
</div>
```

## Properties

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `variant` | `primary`, `destructive`, `tertiary`, `secondary`, `ghost`, `link` | `primary` | Emphasis level. One primary per view. |
| `size` | `medium`, `tiny`, `small`, `large`, `icon`, `icon-tiny`, `icon-small`, `icon-large` | `medium` | 24/32/36/40px high (tiny/small/medium/large); icon sizes are square and need aria-label. |
| `type` | `button`, `submit`, `reset` | `button` | Form behavior. Defaults to button so it never submits by accident. |
| `disabled` | boolean | `false` | Native disabled: dimmed, not interactive, out of the tab order. With href, the link loses its href. Wins over loading. |
| `loading` | boolean | `false` | Harness addition: spinner before the label, dimmed; stays focusable with aria-busy and aria-disabled. |
| `name` | text |  | Submitted with the form when type is submit. |
| `value` | text |  | Submitted with name when type is submit. |
| `label` | slot |  | Default slot: visible text and accessible name. |
| `leadingIcon` | instanceSwap |  | Optional leading icon (16px), decorative. |
| `trailingIcon` | instanceSwap |  | Optional trailing icon (16px), decorative. |
| `href` | text |  | Renders a native link styled as a button. type, name and value are ignored; disabled removes the href. javascript:, vbscript: and data: URLs are dropped: the link renders without href and a console warning names it (SB-0115). |

## Events

| Name | Notes |
| --- | --- |
| `click` | Pointer, Enter or Space. Cancelled while disabled or loading. |

## Keyboard

| Key | Action |
| --- | --- |
| `Enter` | activate |
| `Space` | activate |
| `Tab` | move focus in and out, also while loading |

## Accessibility

- Role: `button`
- Native element: `button`
- Accessible name: Default slot text. Host aria-label is forwarded to the inner control. aria-labelledby and aria-describedby are not forwarded: ID references do not resolve across shadow roots (SB-0009).
- Form: ElementInternals: submit calls form.requestSubmit(), reset calls form.reset(); name and value are submitted.
