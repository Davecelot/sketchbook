---
title: "Tabs"
description: "Switches between panels of related content, one visible at a time, with a row or column of tabs. Four custom elements share state through context."
---

<!-- Generated from spec/components/tabs/contract.json by npm run docs:components. Do not edit by hand. -->

Tag `<sb-tabs>` · status `stable` · version `0.1.0`

## Example

<div class="live-demo">
<sb-tabs value="overview" style="display:block;width:400px">
  <sb-tabs-list aria-label="Project sections">
    <sb-tabs-trigger value="overview">Overview</sb-tabs-trigger>
    <sb-tabs-trigger value="activity">Activity</sb-tabs-trigger>
    <sb-tabs-trigger value="settings">Settings</sb-tabs-trigger>
  </sb-tabs-list>
  <sb-tabs-content value="overview"><p>A summary of the project.</p></sb-tabs-content>
  <sb-tabs-content value="activity"><p>Recent changes appear here.</p></sb-tabs-content>
  <sb-tabs-content value="settings"><p>Configuration options.</p></sb-tabs-content>
</sb-tabs>
</div>

```html
<sb-tabs value="overview" style="display:block;width:400px">
  <sb-tabs-list aria-label="Project sections">
    <sb-tabs-trigger value="overview">Overview</sb-tabs-trigger>
    <sb-tabs-trigger value="activity">Activity</sb-tabs-trigger>
    <sb-tabs-trigger value="settings">Settings</sb-tabs-trigger>
  </sb-tabs-list>
  <sb-tabs-content value="overview"><p>A summary of the project.</p></sb-tabs-content>
  <sb-tabs-content value="activity"><p>Recent changes appear here.</p></sb-tabs-content>
  <sb-tabs-content value="settings"><p>Configuration options.</p></sb-tabs-content>
</sb-tabs>
```

## Properties

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | text | `` | Value of the selected tab. When empty, the first enabled tab is selected. |
| `orientation` | `horizontal`, `vertical` | `horizontal` | Direction of the tab list. Vertical lists use Arrow Up and Down. |
| `activation` | `automatic`, `manual` | `automatic` | automatic selects a tab as soon as it takes focus; manual moves focus only, and Enter or Space selects. |

## Events

| Name | Notes |
| --- | --- |
| `change` | Fires on the sb-tabs host after a person selects a different tab. Not fired for changes made from code. A change from a form control inside a panel also bubbles to the host: listen with event.target === host (that one has no detail). |

## Parts

### `<sb-tabs-list>`

The row or column that holds the tabs.

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `variant` | `primary`, `line` | `primary` | primary is a filled track with a raised selected tab; line is transparent with an indicator bar under the selected tab. |

### `<sb-tabs-trigger>`

One tab. Renders a native button with role tab.

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | text | `` | Links the tab to the panel with the same value. Unique within the tabs. |
| `disabled` | boolean | `false` | Not focusable and not selectable. |

| Event | Notes |
| --- | --- |
| `click` | Selects the tab. |

### `<sb-tabs-content>`

The panel of one tab; only the selected panel is displayed.

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | text | `` | The tab value this panel belongs to. |

## Keyboard

| Key | Does |
| --- | --- |
| `Tab` | enters the list on the selected tab, then moves to the selected panel |
| `ArrowRight` | next enabled tab (previous in right-to-left); wraps |
| `ArrowLeft` | previous enabled tab (next in right-to-left); wraps |
| `ArrowDown` | next enabled tab in a vertical list |
| `ArrowUp` | previous enabled tab in a vertical list |
| `Home` | first enabled tab |
| `End` | last enabled tab |
| `Enter` | select the focused tab (manual activation) |
| `Space` | select the focused tab (manual activation) |

## Accessibility

- Role: `tablist, tab and tabpanel`
- Native element: `button`
- Accessible name: Tab text. A panel is named by its tab. Name the tab list with aria-label when the context does not.
