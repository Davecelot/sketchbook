---
stage: ready
basis: plan Status line (2026-11-08)
test-first: unverified (pre-record)
approved-by: Davecelot
approved-on: 2026-11-08
approved-contract: sha256:e7a768926068c6a509809c14a8352188a33fbae0b2015e2e0d76dec3c7bf2477
approved-plan: sha256:429cf2eddc329dda36ff5bdd8192d315134acabad411d052ca543b1b473a7a41
---

# Plan: Button (planning gate)

Status: **approved 2026-11-08** (owner approved both plans; Q4 answered yes, SB-0006). Built test-first; now beta.

## Scope
`sb-button`: 6 variants × 8 sizes (44 valid combinations), states hover, focus-visible, active, disabled, loading; slots default, leading-icon, trailing-icon; form-associated (submit, reset, name/value). Built with the contract-first standard (contract pair, file layout, mixins, behavior spec).

Out of scope: Button Group, Toggle, (Spinner is its own component, used by Button).

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/button/Button.stories.ts`: one story per variant, per size, and per state (generated from the contract) |
| 2 | `playwright/tests/button/button.behavior.spec.ts`: written first, must fail |
| 3 | `src/mixins/form-associated.ts`: ElementInternals base shared with Input (`FormAssociated`) |
| 4 | `src/components/button/Button.scss` → `Button.styles.ts` (generated) |
| 5 | `src/components/button/Button.ts`, `index.ts` |

## Test plan (test-first)
- Renders a native button with the label as its accessible name; icon sizes take `aria-label` from the host; warns once when nameless.
- `variant` and `size` reflect and resolve the right component tokens in light and dark (computed styles).
- Keyboard: Tab focuses, Enter and Space click, focus ring only on keyboard focus.
- Disabled: no click, out of tab order, dimmed. Loading: no click, stays focusable, `aria-busy` and `aria-disabled`, spinner visible, label visible.
- Forms: `type=submit` submits with name/value, `type=reset` resets, default `button` does nothing.
- axe: no violations in each story.

## Accessibility deviations from the references
- From the visual reference: solid 3px focus ring (ring/50 is below 3:1).
- From the reference implementation: loading keeps focus (aria-disabled, not native disabled).

## Open question (recommendation first)
- **Q4. Links that look like buttons** (answered yes): add `href`, rendering a native `<a part="button">` with button styling (recommended), or leave links to a future Link component?
