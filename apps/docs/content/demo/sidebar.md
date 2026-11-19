---
title: "Sidebar"
description: "A named navigation panel at the start edge of an app or docs layout: a header, groups of links with a group label, the current page marked, and a footer. On wide viewports it can collapse off-canvas; on narrow viewports it becomes a modal drawer opened by a trigger. Eleven custom elements share state through a provider."
---

<!-- Generated from spec/components/sidebar/contract.json by npm run docs:components. Do not edit by hand. -->

Use `<sb-sidebar>` in HTML. [Lifecycle status](/reference/contract-format/#lifecycle-statuses) `stable` · Version `0.1.0`

## Example

Use the toggle beside the menu to change the sidebar. Introduction is marked as the current section.

<div class="live-demo">
<sb-sidebar-provider style="display:flex;min-height:320px;border:1px solid var(--sb-color-border);border-radius:var(--sb-radius-large);overflow:hidden">
  <sb-sidebar label="Documentation">
    <sb-sidebar-header><strong>Sketchbook</strong></sb-sidebar-header>
    <sb-sidebar-content>
      <sb-sidebar-group>
        <sb-sidebar-group-label>Getting started</sb-sidebar-group-label>
        <sb-sidebar-menu>
          <sb-sidebar-menu-item><sb-sidebar-menu-button href="#" active>Introduction</sb-sidebar-menu-button></sb-sidebar-menu-item>
          <sb-sidebar-menu-item><sb-sidebar-menu-button href="#">Installation</sb-sidebar-menu-button></sb-sidebar-menu-item>
        </sb-sidebar-menu>
      </sb-sidebar-group>
      <sb-sidebar-group>
        <sb-sidebar-group-label>Components</sb-sidebar-group-label>
        <sb-sidebar-menu>
          <sb-sidebar-menu-item><sb-sidebar-menu-button href="#">Command</sb-sidebar-menu-button></sb-sidebar-menu-item>
          <sb-sidebar-menu-item><sb-sidebar-menu-button href="#">Dialog</sb-sidebar-menu-button></sb-sidebar-menu-item>
          <sb-sidebar-menu-item><sb-sidebar-menu-button href="#">Sidebar</sb-sidebar-menu-button></sb-sidebar-menu-item>
        </sb-sidebar-menu>
      </sb-sidebar-group>
    </sb-sidebar-content>
  </sb-sidebar>
  <div style="padding:16px">
    <sb-sidebar-trigger></sb-sidebar-trigger>
  </div>
</sb-sidebar-provider>
</div>

```html
<sb-sidebar-provider style="display:flex;min-height:320px;border:1px solid var(--sb-color-border);border-radius:var(--sb-radius-large);overflow:hidden">
  <sb-sidebar label="Documentation">
    <sb-sidebar-header><strong>Sketchbook</strong></sb-sidebar-header>
    <sb-sidebar-content>
      <sb-sidebar-group>
        <sb-sidebar-group-label>Getting started</sb-sidebar-group-label>
        <sb-sidebar-menu>
          <sb-sidebar-menu-item><sb-sidebar-menu-button href="#" active>Introduction</sb-sidebar-menu-button></sb-sidebar-menu-item>
          <sb-sidebar-menu-item><sb-sidebar-menu-button href="#">Installation</sb-sidebar-menu-button></sb-sidebar-menu-item>
        </sb-sidebar-menu>
      </sb-sidebar-group>
      <sb-sidebar-group>
        <sb-sidebar-group-label>Components</sb-sidebar-group-label>
        <sb-sidebar-menu>
          <sb-sidebar-menu-item><sb-sidebar-menu-button href="#">Command</sb-sidebar-menu-button></sb-sidebar-menu-item>
          <sb-sidebar-menu-item><sb-sidebar-menu-button href="#">Dialog</sb-sidebar-menu-button></sb-sidebar-menu-item>
          <sb-sidebar-menu-item><sb-sidebar-menu-button href="#">Sidebar</sb-sidebar-menu-button></sb-sidebar-menu-item>
        </sb-sidebar-menu>
      </sb-sidebar-group>
    </sb-sidebar-content>
  </sb-sidebar>
  <div style="padding:16px">
    <sb-sidebar-trigger></sb-sidebar-trigger>
  </div>
</sb-sidebar-provider>
```

## Properties

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | `Sidebar` | Accessible name of the navigation landmark, and of the drawer on narrow viewports. Give a page's navigations distinct names. |
| `collapsible` | `offcanvas`, `none` | `offcanvas` | Wide viewports only. offcanvas slides the panel out of the layout when the provider is closed; none keeps it always shown and hides the trigger there. Narrow viewports always use the drawer. |

## Parts

### `<sb-sidebar-provider>`

Wraps the sidebar and the main content: lays them out side by side, owns the expanded state and shares it with the sidebar and its trigger.

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `expanded` | boolean | `true` | Wide viewports: whether the panel is shown. Unlike Collapsible's expanded, it defaults to true on purpose: the navigation is visible until someone hides it. The trigger flips it; code can set it too. The narrow-viewport drawer has its own state, which always starts closed. |

| Event | Notes |
| --- | --- |
| `sb-toggle` | Fires on the provider after expanded changes, from the trigger or from code. Named and shaped like Collapsible's and Dialog's sb-toggle on purpose. Read host.expanded. Not fired for the drawer. |

### `<sb-sidebar-menu-button>`

The interactive row of an item: a link when href is set, otherwise a button.

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `href` | text | `` | The address the item links to. Navigation items always set it. javascript:, vbscript: and data: URLs are dropped: the link renders without href and a console warning names it (SB-0115). |
| `active` | boolean | `false` | The current page: aria-current="page" and the filled look. Only one item per sidebar. Ignored without href. |

| Event | Notes |
| --- | --- |
| `click` | Follows the link, or activates the button. |

### `<sb-sidebar-trigger>`

An icon button that toggles the panel on wide viewports and opens the drawer on narrow ones.

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | `Toggle Sidebar` | Accessible name of the button (its only text is an icon). |

| Event | Notes |
| --- | --- |
| `click` | Pointer, Enter or Space; toggles. |

## Keyboard

| Key | Action |
| --- | --- |
| `Tab` | moves through the trigger and the links in document order; inside the open drawer it stays within the drawer |
| `Shift+Tab` | moves backwards; stays within the open drawer |
| `Enter` | follows the focused link; on the trigger, toggles the panel or opens the drawer |
| `Space` | on the trigger, toggles the panel or opens the drawer |
| `Escape` | closes the open drawer and returns focus to the trigger |
| `Control+B / Meta+B` | toggles the sidebar like the trigger (panel on wide viewports unless collapsible=none, drawer on narrow); ignored while typing in a text field or editable region |

## Accessibility

- Role: `navigation (panel); list and listitem (menu); group (group); button with aria-expanded (trigger); modal dialog (drawer, narrow viewports)`
- Native element: `nav, a, button, dialog`
- Accessible name: Landmark and drawer: the label prop. Group: its group label. Menu button: its text. Trigger: its label prop (default "Toggle Sidebar").
