---
component: Alert
status: stable
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-08
source: visual reference (shadcn/ui Alert), harness process (contract-first standard)
---

# Alert

> A static message box for news people should notice without being interrupted. A family of four elements. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Tell people something important that stays on screen: a result, a warning, an error, with an optional action. Not for transient confirmations (toast) or for blocking decisions (dialog).

## 2. Anatomy
`sb-alert` is the callout. Slots: `icon` (optional, decorative svg) and the default slot with `sb-alert-title`, `sb-alert-description` and an optional `sb-alert-action`.

## 3. Props / API
| Element | Prop | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `sb-alert` | `feedback` | neutral, danger | neutral | colors and live-region role |
| parts | none | | | content only |

## 4. Variant matrix
`feedback`: neutral, danger (2 combinations).

## 5. Roles and color
| Feedback | Background | Text | Description |
| --- | --- | --- | --- |
| neutral | `card`, 1px `border` | `card-foreground` | `muted-foreground` |
| danger | `card`, 1px `border` | `destructive` | `destructive` |

## 6. States
None: the alert is not interactive. An action control inside has its own states.

## 7. Dimensions and layout
Grid with columns icon (16px) / content / action. With no icon the first column is 0 wide and the gap disappears. Padding 12px block, 16px inline; radius `radius.surface` (10px); row gap 2px, column gap 12px. The icon sits 2px lower to align with the title's first line.

## 8. Typography
14px. Title weight 500. Description 14px.

## 9. Accessibility
- Role is decided by `feedback` and set on the host before the first render: `status` (polite) for neutral, `alert` (assertive) for danger. Assertive announcements for neutral information interrupt screen-reader users, so one role for both values is avoided. An explicit `role` attribute on the host is never overwritten.
- Live regions announce changes to a region that exists. To announce a message that appears after load, insert the `sb-alert` first (empty) and add the text next, or rely on `role=alert`, which most assistive technology also announces on insertion. An alert rendered with the page is read in normal order, not announced.
- Color is not the only signal: danger alerts should say what went wrong in the title or description (WCAG 1.4.1).
- `sb-alert-title` is a visual title, not a heading element. Put a real heading inside it when the alert belongs in the document outline.
- Title is not truncated and the description is not tinted at 90% (WCAG 1.4.10, 1.4.3).

## 10. Usage
### Behavior
Static content; the host role updates when `feedback` changes, unless the author set a role.
### Composition
`sb-button` in `sb-alert-action` for "Undo" or "Retry". Icon from the icon library, `slot="icon"`, `aria-hidden="true"`.
### Choosing the props
`danger` for errors that need attention now; `neutral` for information and success.
### Do / Don't
- Do write the title as the outcome ("Upload failed"). Don't rely on the icon or color alone.

## Realizations
### Figma
Drawn in the library: axis Feedback (Neutral, Danger), icon, title and description. Not drawn: the action, and the gap between description paragraphs.
### Web
Complete. `src/components/alert/`: `Alert.ts` (`sb-alert`), `AlertTitle.ts`, `AlertDescription.ts`, `AlertAction.ts`; one shared `Alert.scss`. Slots `icon` and default.
### Coverage
Behavior spec `playwright/tests/alert/alert.behavior.spec.ts`: all four elements registered; neutral is role=status, danger role=alert; empty alert already has its role; adding content keeps it; role set before first render, no flicker; role follows variant; authored role kept; border, radius, padding, grid; icon column geometry with and without icon; action at the end spanning both rows; data-has-icon and data-has-action follow slotted content; variant colors in light and dark; title weight, no truncation; axe clean (all stories).
### Known drift
- Role by feedback (visual reference: always alert).
- No title line-clamp, no /90 description tint (WCAG).
- No tracking-tight (no token).
- Action is a grid column, not absolutely positioned.

## Open questions
None open (Q1, Q2 answered in the contract).

## Spec for agents
Build from contract.json only. CSS uses only `--sb-alert-*` variables (check T4). Tests first.
