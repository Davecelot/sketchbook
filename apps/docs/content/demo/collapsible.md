---
title: "Collapsible"
description: "A disclosure that shows or hides one panel of content from a trigger. Three custom elements share state through context."
---

<!-- Generated from spec/components/collapsible/contract.json by npm run docs:components. Do not edit by hand. -->

Tag `<sb-collapsible>` · status `stable` · version `0.1.0`

## Example

<div class="live-demo">
<sb-collapsible style="display:block;width:350px">
  <div style="display:flex;align-items:center;justify-content:space-between;gap:16px">
    <strong>Order details</strong>
    <sb-collapsible-trigger aria-label="Toggle details">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m7 15 5 5 5-5" /><path d="m7 9 5-5 5 5" /></svg>
    </sb-collapsible-trigger>
  </div>
  <sb-collapsible-content>Billing address and delivery notes appear here.</sb-collapsible-content>
</sb-collapsible>
</div>

```html
<sb-collapsible style="display:block;width:350px">
  <div style="display:flex;align-items:center;justify-content:space-between;gap:16px">
    <strong>Order details</strong>
    <sb-collapsible-trigger aria-label="Toggle details">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m7 15 5 5 5-5" /><path d="m7 9 5-5 5 5" /></svg>
    </sb-collapsible-trigger>
  </div>
  <sb-collapsible-content>Billing address and delivery notes appear here.</sb-collapsible-content>
</sb-collapsible>
```

## Properties

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `expanded` | boolean | `false` | Whether the panel is shown. The trigger flips it; code can set it too. |
| `disabled` | boolean | `false` | Disables the trigger. The current state is kept. |

## Events

| Name | Notes |
| --- | --- |
| `sb-toggle` | Fires on the sb-collapsible host after expanded changes, from the trigger or from code (like &lt;details&gt; toggle, but it bubbles; shaped like Dialog's sb-toggle). Read host.expanded for the new state. |

## Parts

### `<sb-collapsible-trigger>`

The control that toggles its collapsible. Renders a native button around its slotted content.

| Event | Notes |
| --- | --- |
| `click` | Pointer, Enter or Space; toggles the collapsible. |

## Keyboard

| Key | Does |
| --- | --- |
| `Enter` | toggle the content |
| `Space` | toggle the content |
| `Tab` | move focus to the trigger and past it; closed content is out of the tab order |

## Accessibility

- Role: `button (the trigger); the content has no role`
- Native element: `button`
- Accessible name: Trigger text. Host aria-label on sb-collapsible-trigger is forwarded to the inner button (ID references do not cross shadow roots, SB-0009).
