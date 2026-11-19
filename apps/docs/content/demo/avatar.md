---
title: "Avatar"
description: "A circular picture or initials that represent a person or entity, with an optional status badge and an overlapping group (a family of Web Components)."
---

<!-- Generated from spec/components/avatar/contract.json by npm run docs:components. Do not edit by hand. -->

Use `<sb-avatar>` in HTML. [Lifecycle status](/reference/contract-format/#lifecycle-statuses) `stable` · Version `0.1.0`

## Example

The example supplies an image and the initials AE as a fallback. In your own markup, use initials that still identify the person if their image fails to load.

<div class="live-demo">
<sb-avatar>
  <sb-avatar-image src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='64' height='64' fill='%23888'/><circle cx='32' cy='26' r='12' fill='%23ddd'/><rect x='12' y='42' width='40' height='30' rx='14' fill='%23ddd'/></svg>" alt="Ada Example"></sb-avatar-image>
  <sb-avatar-fallback label="Ada Example">AE</sb-avatar-fallback>
</sb-avatar>
</div>

```html
<sb-avatar>
  <sb-avatar-image src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='64' height='64' fill='%23888'/><circle cx='32' cy='26' r='12' fill='%23ddd'/><rect x='12' y='42' width='40' height='30' rx='14' fill='%23ddd'/></svg>" alt="Ada Example"></sb-avatar-image>
  <sb-avatar-fallback label="Ada Example">AE</sb-avatar-fallback>
</sb-avatar>
```

## Properties

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `size` | `medium`, `small`, `large` | `medium` | Diameter from the media size tokens: 32px, 24px or 40px. |

## Parts

### `<sb-avatar-image>`

The picture. It stays hidden until it has loaded, and reports success or failure to the surrounding avatar.

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `src` | text |  | Image address. Changing it starts a new load and brings the fallback back until it finishes. |
| `alt` | text | `` | Text alternative. Empty means the image is decorative, which suits an avatar whose name is written next to it. |

### `<sb-avatar-fallback>`

Shown while there is no loaded image: initials, an icon or any short content, on a muted disc.

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text |  | Accessible name for initials or an icon. When set the fallback is exposed as an image with this name. |

### `<sb-avatar-badge>`

A small status dot at the bottom end of the avatar, optionally holding an icon (hidden at size small).

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text |  | Says what the badge means (for example Online). Without it the badge is decorative and hidden from assistive technology. |

### `<sb-avatar-group-count>`

A disc, sized like the group's avatars, showing how many more there are.

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text |  | Accessible name for the count or an icon (for example 3 more members). When set the count is exposed as an image with this name. |

## Accessibility

- Role: `none (generic); the image has role img from the native img element`
- Accessible name: alt on sb-avatar-image; label on sb-avatar-fallback and sb-avatar-group-count (role img); label on sb-avatar-badge. Without a label, plain text inside the fallback or count is read as text.
