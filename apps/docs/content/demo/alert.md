---
title: "Alert"
description: "A static message box for news people should notice without being interrupted: optional icon, title, description and action (a family of Web Components)."
---

<!-- Generated from spec/components/alert/contract.json by npm run docs:components. Do not edit by hand. -->

Tag `<sb-alert>` · status `stable` · version `0.1.0`

## Example

<div class="live-demo">
<sb-alert style="width:420px">
  <svg slot="icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
  <sb-alert-title>Update available</sb-alert-title>
  <sb-alert-description>A newer version is ready to install.</sb-alert-description>
</sb-alert>
</div>

```html
<sb-alert style="width:420px">
  <svg slot="icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
  <sb-alert-title>Update available</sb-alert-title>
  <sb-alert-description>A newer version is ready to install.</sb-alert-description>
</sb-alert>
```

## Properties

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `feedback` | `neutral`, `danger` | `neutral` | neutral: card colors, announced politely (role=status). danger: error colors, announced assertively (role=alert). |

## Accessibility

- Role: `status (feedback=neutral) or alert (feedback=danger); an explicit role attribute on the host wins`
- Accessible name: None needed: the content is the message.
