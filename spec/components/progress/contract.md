---
component: Progress
status: stable
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-08
source: shadcn/ui (visual reference and names), WAI-ARIA progressbar role, host-role approach
---

# Progress

> A bar that shows how far a task has come, or that work is under way. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Report the advance of a task that runs for a noticeable time. When the amount is unknown, omit `value`. Do not use it for choices between values (that is a meter) or for waits too short to notice.

## 2. Anatomy
`track` (part, rounded and clipped) holds `indicator` (part, the fill). The host carries `role="progressbar"`.

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | number | none | 0 to `max`, clamped; absent means indeterminate |
| `max` | number | 100 | the amount that means done |
| `label` | text | "" | accessible name only; not drawn |

## 4. Variant matrix
None.

## 5. Roles and color
Indicator `primary`; the track is `primary` at 20% opacity, derived in CSS from the track token.

## 6. States
determinate (fill eases to the value), indeterminate (a segment slides along the track; static under reduced motion).

## 7. Dimensions and layout
Block-level, full width of its container, height 8px, fully rounded.

## 8. Typography
None.

## 9. Accessibility
- Host `role="progressbar"`, `aria-valuemin="0"`, `aria-valuemax`, and `aria-valuenow` (omitted while indeterminate).
- Forced colors: the track is outlined and the fill drawn in `Highlight`, so the bar stays visible.
- Name from `label`, or `aria-label`/`aria-labelledby` on the host (the role is on the host, so IDs in the page resolve). A console warning fires once per element when nameless. Clearing `label` removes the `aria-label` it set. An empty `value` attribute is indeterminate, not 0.
- The animation respects `prefers-reduced-motion`.

## 10. Usage
### Behavior
Update `value` as work advances; the fill eases between values.
### Composition
Put visible text (a title, a percentage) beside the bar and point `aria-labelledby` at it, or set `label`.
### Choosing the props
Set `max` to the real total (for example a file count) instead of converting to percent.
### Do / Don't
- Do give every bar a name. Do not leave a fixed value on a bar that is not advancing.

## Realizations
### Figma
Drawn in the library: axis Indeterminate. The track is tinted to 20% of its color (a layer); the fill is a sample 50% wide (40% when indeterminate, where the styles slide it). Not drawn: the slide animation (`loop-duration`).
### Web
Complete. src/components/progress/Progress.ts. Parts: track, indicator.
### Coverage
- progressbar role, name from label, valuemin/max/now
- max scales the fill
- value updates fill and aria-valuenow
- clamping
- indeterminate: no valuenow, animated, static under reduced motion
- aria-label and aria-labelledby name the bar
- one-time missing-name warning
- size, radius, colors from tokens
- axe clean (five stories)
### Known drift
- indeterminate: the visual reference has no indeterminate state; the reference implementation's progress bar is determinate only
- fill motion: the reference animates a translateX; width is used so the fill measures directly

## Open questions
All answered; see contract.json.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-progress-*` variables (check T4). Tests first (rule test-first).
