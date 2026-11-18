---
component: Avatar
status: beta
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-08
source: visual reference (shadcn/ui Avatar), harness process (contract-first standard)
---

# Avatar

> A circular picture or initials that stand for a person or entity. A family of six elements. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Identify who or what something belongs to (an author, an assignee, an account) in a small, recognizable shape. Not for large profile imagery or decorative photos.

## 2. Anatomy
`sb-avatar` is the disc. Inside: `sb-avatar-image`, `sb-avatar-fallback` and an optional `sb-avatar-badge`. `sb-avatar-group` overlaps several avatars and can end with `sb-avatar-group-count`.

## 3. Props / API
| Element | Prop | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `sb-avatar` | `size` | medium, small, large | medium | 32, 24, 40px |
| `sb-avatar-image` | `src`, `alt` | text | none, empty | empty `alt` is decorative |
| `sb-avatar-fallback` | `label` | text | none | names initials or an icon |
| `sb-avatar-badge` | `label` | text | none | without it the badge is decorative |
| `sb-avatar-group-count` | `label` | text | none | names the count or an icon |

The avatar shares the image status with its children through a context and reflects it in `data-image-status` (idle, loaded, error).

## 4. Variant matrix
`size`: medium, small, large (3 combinations).

## 5. Roles and color
Fallback and group count: `foreground` on `border` gray (SB-0087: `muted` reads as transparent on light surfaces and on muted panels). Badge: `primary-foreground` on `primary`. Rings around badge and grouped avatars use the page `background`.

## 6. States
Image loading or failed: fallback visible, image hidden. Image loaded: image visible, fallback hidden. A new `src` returns to loading.

## 7. Dimensions and layout
Diameters come from the media size tokens. The badge is 30% of the avatar diameter at the bottom end, with a ring; its icon is hidden at `small`. Grouped avatars overlap by 8px and carry a 2px ring. The group count matches the group's size and uses the icon size tokens for svg content.

## 8. Typography
Fallback text 14px (12px at `small`).

## 9. Accessibility
- The image is a native `img`; use `alt` with the person's name when no name is shown next to the avatar, and leave it empty otherwise.
- Initials are announced as letters; set `label` on the fallback to give the avatar a proper name. The hidden image or fallback is removed from the accessibility tree.
- A badge that carries meaning needs a `label`; otherwise it is hidden from assistive technology. Never rely on its color alone.
- For a group, set `role="group"` and an `aria-label` on `sb-avatar-group`. Name the count with its `label` ("3 more members"); an icon-only count needs one. An `aria-label` on the count is ignored because it has no role.

## 10. Usage
### Behavior
The fallback shows until the image has loaded and again if loading fails or `src` changes.
### Composition
Put the avatar inside a button or link to make it actionable. Pair a group with a count for the remainder.
### Choosing the props
`small` in dense lists, `large` in headers.
### Do / Don't
- Do always include a fallback. Don't convey presence by color alone.

## Realizations
### Figma
Drawn in the library: axis Size, the fallback surface with sample initials. Not drawn: the image, the badge, the group with its overlap and ring, and the group count (separate elements).
### Web
Complete. `src/components/avatar/`: `Avatar.ts` (`sb-avatar`, context provider), `AvatarImage.ts`, `AvatarFallback.ts`, `AvatarBadge.ts`, `AvatarGroup.ts`, `AvatarGroupCount.ts`, `context.ts`; one shared `Avatar.scss`. Part `image` (in `sb-avatar-image`).
### Coverage
Behavior spec `playwright/tests/avatar/avatar.behavior.spec.ts`: all six elements registered; 32/24/40px circles; size reflects; image shown and fallback hidden once loaded; slow image keeps the fallback until it loads; failed image and src change back to a bad source keep or restore the fallback; fallback-only colors and size; image alt is the accessible name; hidden parts out of the tree; fallback label: role img, name set before first render; no role without label; badge geometry (30%, bottom end, ring), icon hidden at sm; badge label or aria-hidden; group overlap and ring; group count follows the largest avatar size, icon size; count colors, authored group role and name kept; count label: role img, name set before first render; badge, fallback and count stay visible in forced colors (outline, badge fill); axe clean (all stories).
### Known drift
- Badge size is 30% of the avatar and its icon 80% of the badge: fixed proportions (unitless ratios), not tokens.
- A `sb-avatar-image` with an empty `alt` uses the sibling `sb-avatar-fallback` label as the image name, so the avatar stays named once the image loads.
- `label` props name initials, the badge and the group count.
- The host does not clip its content.

## Open questions
None open (Q1 to Q3 answered in the contract).

## Spec for agents
Build from contract.json only. CSS uses only `--sb-avatar-*` variables (check T4). Tests first.
