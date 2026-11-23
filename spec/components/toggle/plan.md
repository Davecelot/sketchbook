---
stage: ready
basis: SB-0011
test-first: unverified (pre-record)
approved-by: Davecelot
approved-on: 2026-11-08
approved-contract: sha256:04ec3ac8855dae6c66bbdeba4453411ac2cba3429466c89af48be9c72cfdcc59
approved-plan: sha256:86ed9e31c9254d8577618b14548a86e884a9727331d15d2b1e16319d33668121
---

# Plan: Toggle (planning gate)

Status: Approved under SB-0011 (owner pre-approval, 2026-11-08).

## Scope
`sb-toggle`: a two-state button. Variants default and outline, sizes default, sm and lg, `selected`, `disabled`. A native `<button aria-pressed>` in the shadow root. Out of scope: form submission (Q1), Toggle Group (its own contract).

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/toggle/Toggle.stories.ts` |
| 2 | `playwright/tests/toggle/toggle.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/toggle/Toggle.scss` -> `Toggle.styles.ts` (generated) |
| 4 | `src/components/toggle/Toggle.ts`, `index.ts` |

## Test plan (test-first)
- Native button with `aria-pressed`, named by label; `aria-label` forwarded for icon-only.
- `selected` reflects; click, Enter and Space flip it and fire a composed `change` once with `detail.selected`; setting the property fires nothing.
- Variant and size tokens resolve (colors, heights, min-width); on state uses `on.bg`.
- Focus ring on keyboard focus only; disabled: no toggle, out of tab order, dimmed; `<fieldset disabled>` disables it.
- axe clean for the variant matrix, pressed and disabled.

## Accessibility deviations from the references
- Solid 3px focus ring instead of the visual reference's translucent ring (WCAG 1.4.11).
- Light `muted` hover text uses the SB-0004 muted tokens (already contrast-fixed).

## Open questions (recommendation first)
- Q1 form association: no, only for `<fieldset disabled>`. Answered.
- Q2 controlled pressed: uncontrolled property plus `change`. Answered.
