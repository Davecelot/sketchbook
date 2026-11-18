# Plan: Alert (planning gate)

Status: Approved under SB-0011 (owner pre-approval, 2026-11-08).

## Scope
`sb-alert` plus `sb-alert-title`, `sb-alert-description` and `sb-alert-action`, with feedback neutral and danger, an `icon` slot and an action area. Host role is `status` or `alert` by feedback.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/alert/Alert.stories.ts` |
| 2 | `playwright/tests/alert/alert.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/alert/Alert.scss` -> `Alert.styles.ts` (generated, shared by all parts) |
| 4 | `Alert.ts`, `AlertTitle.ts`, `AlertDescription.ts`, `AlertAction.ts`, `index.ts` |

## Tokens
`alert.*` aliases semantic tokens, including the new `space.stack.*`.

## Test plan (test-first)
- Role: status for neutral, alert for danger; present on an empty alert before content arrives and unchanged when content is added; follows `feedback`; authored role is kept.
- Layout: with an icon the content starts after 16px + 12px; without it, at the padding edge; action at the end.
- Colors per feedback (title and description) in light and dark; border, radius, padding.
- Title weight; no title truncation.
- axe clean on neutral, danger and action stories.

## Accessibility deviations from the references
- Role: `status` for neutral feedback (visual reference: `alert` always).
- No title line-clamp; description in full destructive color (not /90).

## Open questions
- Q1 Role alert vs status: answered, by variant, authored role wins.
- Q2 Title clamp and /90 tint: answered, dropped.
