---
stage: ready
basis: plan Status line (2026-11-08)
test-first: unverified (pre-record)
approved-by: Davecelot
approved-on: 2026-11-08
approved-contract: sha256:4d1707eb8d44d7e358469d8d94f6f4a2f9bc5a5deb5de1b419770c8bda10fdfd
approved-plan: sha256:79ab916ea2602513251f8f6fbf1f593b80df9a8c01d028173ac969d43926b2e7
---

# Plan: Spinner (planning gate)

Status: **approved 2026-11-08** (full implementation plan approved; Spinner added to the slice, SB-0006).

## Scope
`sb-spinner`: Lucide loader icon, 16px, spinning, `role="status"` with a label; `decorative` mode for use inside Button.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/spinner/Spinner.stories.ts` |
| 2 | `playwright/tests/spinner/spinner.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/spinner/Spinner.scss` -> `Spinner.styles.ts` (generated) |
| 4 | `src/components/spinner/Spinner.ts`, `index.ts` |

## Test plan (test-first)
- Default: role status, accessible name "Loading"; custom label changes the name.
- Decorative: no status role, aria-hidden.
- Size 16px from the token; follows `--sb-spinner-size` overrides.
- Animates; under reduced motion still animates with a longer duration.
- Color follows the parent's `color`.
- axe: no violations.

## Accessibility deviations from the references
None (role=status with a label meets the need).

## Open questions
None open (Q1 answered in the contract).
