# Full-house review · Sketchbook round · 2026-11-08 → 2026-11-09

Review-rangers (`.claude/skills/review-rangers`) over everything changed since `f0eeefb` (rename to Sketchbook, foundations engine and presets, token CLI, starters, catalog, kits, brands, upgrade, Storybook Foundations pages, Penpot scripts, Claude layer). Five independent lenses plus a safety guard, then three remediation rounds (the skill's maximum).

## Verdicts by round

| Round | Committee (5 lenses) | Safety guard | Tier |
| --- | --- | --- | --- |
| 1 | Security, Accessibility, Testability, Architecture, Maintainability: all "risk" | blocker (data loss) | LOW |
| 2 (re-review of Mender 1) | Architecture: risk (new blocker N1) | blocker (new blocker NEW-1) | LOW |
| 3 (re-review of Mender round 2) | — | pass (all round-2 findings closed by real repros; 144/144 harness tests in a fresh clone) | HIGH for the blockers; warnings below remain open |

## Blockers and what happened

| Id | Lens | Finding | Fixed by | Record |
| --- | --- | --- | --- | --- |
| SG-1 | Safety | `remove` deleted team-made or customized components without confirmation | Mender 1 (`--yes` guard, honest restore message) | SB-0059, SB-0060 |
| SG-2 | Safety | `kits remove` deleted an edited kit | Mender 1 | SB-0059, SB-0060 |
| A1 | Architecture | Harness tests read team files, so applying any starter broke them | Mender 3 (reference project from harness-owned files) | SB-0068 |
| A2 | Architecture | After `tokens rename`, catalog installs failed and left half installs | Mender 1 + 2 (renames log, staged installs) | SB-0060, SB-0066 |
| A11Y-1 | Accessibility | Data Table kit failed WCAG 1.4.10 Reflow at 320px | Owner-approved fix, test-first | SB-0069 |
| NEW-1 | Safety (round 2) | Token staging reverted or deleted files saved mid-command | Mender round 2 (snapshot staging, conflict refusal, rollback) | SB-0070, SB-0072 |
| N1 | Architecture (round 2) | `upgrade` installed the upstream manifest, so a second upgrade could overwrite team files | Mender round 2 (never take ownership from upstream; never-write list) | SB-0070, SB-0072 |

Warnings fixed alongside: path traversal and blob hashes in catalog installs (S2), upgrade ownership and git URL handling (S1), CSS-variable collisions, dry runs that approved what real runs rejected, stale-link and override handling, G1 completeness, reserved generator names, prototype keys in dot paths, contrast links that fell back silently, `brand use` validation and unsaved edits, `prefix` refusing words already in use, catalog freshness in team repos, init refusing before writing.

## Open (not fixed in this round)

Accessibility warnings: Onboarding kit and five Foundations pages overflow at 320px; Data Table `/` shortcut (2.1.4) and unannounced filter results (4.1.3); Settings "saved" status inserted with its content; docs-article table-of-contents targets under 24px; success/warning/info not guaranteed as text colours; small text from the golden/perfect-fifth type scales is only a warning.

Maintainability and docs: `explain --sb-…` rejected as an option; six rebuild sequences (now fewer, still not one `rebuildAll`); the from-codebase proposal can't be applied by `tokens import apply`; token-mapper output has no consumer; component-builder skill still points plans at the one-off SB-0011 pre-approval; stale "built in parallel" wording and superseded decisions not marked; duplicated import/audit heuristics.

Architecture: Penpot shape marker ignores a renamed prefix; design commands bind to Penpot directly (no adapter interface); `blank` and `foundations` starters are the same; kit index is harness-owned but describes team kits; token import maps to literal shadcn names; Penpot boards cover 5 of 12 foundation families; upgrade has no base version for conflict detection.

Round 3 warnings (no work lost): `init` with brand options plus a starter whose own input fails (`--from` missing) writes the brand before failing (F-1); a save landing in the milliseconds between the conflict check and copy-back can still be overwritten (F-2).

Testability: `brand build` and overrides across brands; idempotent no-op runs; weak error messages in `tokens import`; several G1 rejection paths without a test.

These are listed again in the owner summary with a proposed order.

## Follow-up (2026-11-15)

Fixed, each with a Playwright test that failed first:

- Data Table `/` shortcut (WCAG 2.1.4): the listener moved from the document to the page's `main`, so it works only while focus is inside the page (`playwright/tests/patterns/data-table.behavior.spec.ts`).
- Data Table filter results (WCAG 4.1.3): a polite `role="status"` line announces "Showing 2 of 6 customers" when the filter changes.
- Reflow at 320px (WCAG 1.4.10): the Onboarding kit (role choice now wraps) and six Foundations pages (Color, Spacing, Motion, Density, Layout grid, Z-index) no longer scroll sideways; every Foundations page and Onboarding state now has a 320px test.
