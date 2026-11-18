---
component: Spinner
status: beta
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-08
source: shadcn/ui Spinner (UI and API), harness process (contract-first standard)
---

# Spinner

> A small rotating mark that says work is in progress and its end is unknown. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Show that something is in progress when its duration is unknown. For known progress use Progress; for placeholder layout use Skeleton.

## 2. Anatomy
Two parts: `label` (visually hidden text inside the status, so the live region has content) and `icon`, an inline SVG (Lucide `loader`, ISC license, see THIRD_PARTY_NOTICES.md) stroked in `currentColor`.

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | "Loading" | accessible name |
| `decorative` | boolean | false | hidden from assistive technology |

## 4. Variant matrix
None. Size follows `--sb-spinner-size` (16px by default).

## 5. Roles and color
Inherits `color` from its container (`currentColor`), so it matches the text it sits next to.

## 6. States
Spinning. Under `prefers-reduced-motion: reduce` it keeps spinning at double duration (essential state, WCAG 2.2.2).

## 7. Dimensions and layout
16 × 16px (`size.icon.default`), inline-flex, does not shrink.

## 8. Typography
None.

## 9. Accessibility
- `role="status"` and `aria-label` from `label` are set on the host before the first render; the label is also visually hidden text inside it. Inserted spinners are announced politely (WCAG 4.1.3).
- `decorative` sets `aria-hidden="true"` on the host and drops the role, the label and the label text, for containers that already announce busy (Button sets `aria-busy`).
- Reduced motion: keeps spinning at double duration (essential state, WCAG 2.2.2).

## 10. Usage
### Behavior
Starts spinning when rendered; remove it when loading ends.
### Composition
Inside Button while `loading` (decorative). Next to text in a status line ("Saving…").
### Choosing the props
Set `label` to what is loading ("Loading results"). Use `decorative` only when something else announces the busy state.
### Do / Don't
- Do show one spinner per region. Don't stack several on one screen.

## Realizations
### Figma
Drawn in the library as one component, with no axes and no properties (`sketchbook api figma spinner`).
### Web
Complete. Files: `src/components/spinner/Spinner.ts`, `Spinner.scss`, `Spinner.styles.ts` (generated), `Spinner.stories.ts`, `index.ts`. Parts: `label`, `icon`. Slots: none. Spec: `playwright/tests/spinner/spinner.behavior.spec.ts`.
### Coverage
- role status + default name
- label changes the name
- decorative hides it
- 16px + `--sb-spinner-size` override
- animation + reduced motion
- inherits color
- axe clean
### Known drift
- Size: `spinner.size` token (16px); consumers resize with `--sb-spinner-size`. shadcn resizes with `size-*` utility classes.

## Open questions
- Q1 (answered): keep spinning under `prefers-reduced-motion`? Yes, at double duration.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-spinner-*` variables (check T4). Tests first.
