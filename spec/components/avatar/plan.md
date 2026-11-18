# Plan: Avatar (planning gate)

Status: Approved under SB-0011 (owner pre-approval, 2026-11-08).

## Scope
`sb-avatar` (size medium|small|large) with `sb-avatar-image`, `sb-avatar-fallback`, `sb-avatar-badge`, `sb-avatar-group`, `sb-avatar-group-count`. The fallback shows until the image has loaded, and on error.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/avatar/Avatar.stories.ts` |
| 2 | `playwright/tests/avatar/avatar.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/avatar/Avatar.scss` -> `Avatar.styles.ts` (generated, shared) |
| 4 | `context.ts`, `Avatar.ts`, `AvatarImage.ts`, `AvatarFallback.ts`, `AvatarBadge.ts`, `AvatarGroup.ts`, `AvatarGroupCount.ts`, `index.ts` |

## Tokens
`avatar.*` aliases semantic tokens, using the shared `size.media.*`, `space.stack.*`, `border-width.thick`.

## Test plan (test-first)
- Sizes per `size`; reflection.
- Image status: slow load keeps the fallback visible, then swaps; a failing source keeps the fallback; changing `src` returns to the fallback; `data-image-status` follows.
- Accessibility tree: image name from `alt`; hidden parts are absent; fallback `label` gives role img; badge `label` or aria-hidden.
- Badge geometry and ring; icon hidden at sm. Group overlap, ring, count size follows the group.
- Colors in light and dark; axe clean.

## Accessibility deviations from the references
- `label` props for naming initials and the badge (the reference has none).

## Open questions
- Q1 Image/fallback coordination: answered, context.
- Q2 Naming initials and badge: answered, `label` props.
- Q3 Badge sizes: answered, 30% of the avatar.
