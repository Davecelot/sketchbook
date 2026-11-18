---
title: "Evidence"
description: "What we measured, what went wrong, how we fixed it, what is better now and what is still open, with the raw data behind each claim."
order: 50
---

Every claim here points to raw data in the repository. Last verified against that data on 2026-11-15. Where a published number could not be reproduced, this page says so.

> **Note** All scorers are our own scripts, with no human raters and no independent judge. Costs are the figures the Claude Code CLI reports, not invoiced spend. Nothing here compares Sketchbook with another design system.

The page follows one path: what works and is shown, what was wrong when we looked, what we did about it, what is better now, and what is still open.

## What works, and is shown

- **It makes Claude's output conform.** With the project's files, an agent builds pages from `sb-*` components and tokens and writes schema-valid specs: a valid contract in 0 of 10 runs from an empty folder, 9 to 10 of 10 with the files.
- **The CLI makes authoring cheaper and more regular.** 21% (Sonnet) and 32% (Opus) cheaper than files alone, and the same eight files every run.
- **The checks can fail.** There are <!-- stat:checks --> registered checks, including one maintainer-only check. The commit hook runs the standard checks, and `harness/test/checks.test.mts` shows checks rejecting broken fixtures (36 of its 54 cases are titled "rejects").
- **Accessibility is tested in a real browser.** axe-core runs in 48 of the 53 Playwright specs and fails on any violation, and 17 specs store a screen-reader view read from Chromium's accessibility tree.
- **A new project installs and runs from the package alone.** After the second retest: self-test 168 pass, 0 fail, 40 skipped, and 100 behavior tests pass inside a created project.
- **We publish our own mistakes.** Each study below lists its limits, and the sections after it list what we got wrong.

## Then and now

Measured changes, each with its source in the sections below.

| Measure | Then | Now | Source |
| --- | --- | --- | --- |
| Claude layer cost per task, over files plus CLI | +18% to +88% (QA on Opus +83%) | Every cell within +50%; worst is Sonnet UI +19%; Opus QA +13% | Value benchmark, rounds 3 and 5 |
| Always-on Claude context (check H1) | about 58 KB | 13.9 KB, with a 16,000-byte budget that H1 enforces | SB-0114, `ROUND5.md` |
| Always-on rule text | 16.6 KB | 2.9 KB | `ROUND5.md` |
| CLI install, empty folder and app (non-zero exits) | 26 of 66 commands | 2 of 38 (both intentional refusals) | CLI distribution, baseline and retest 2 |
| Package contents | 6 files, crashed on every command | 815 files, every command runs from the tarball | Retest 1, F1 and F2 |
| Harness tests passing | 144 (2026-11-09, review) | 238 (2026-11-15) | Full-house review, `npm run test:harness` |
| Checks | 22 | <!-- stat:checks --> | `harness/checks/run.mts` |

## Found, fixed, better

Each row is a problem we found ourselves, what we changed, and the evidence that the change worked.

| What was wrong | What we did | Result |
| --- | --- | --- |
| The Claude layer cost up to +88% per task and bought no measured gain outside QA depth. | SB-0114: hooks inject a short card once, task rules load by `paths:`, descriptions capped, a byte budget enforced by check H1. | Round 5: all cells within +50%; valid contracts still 10 of 10; QA depth held. |
| The npm package crashed on every command (F1, F2). | Shipped the engine, catalog, templates and Claude layer; run-time imports became dependencies. | Every command runs from the tarball (retest 1: 162 pass, 0 fail). |
| `init` overwrote an app's `src/index.ts` (F17, data loss). | `init` refuses a folder with files; `--dir` and `--adopt` build in a subfolder. | Retest 1: the refusal is verified. Retest 2: adopt keeps every other byte of the app's `package.json` (test B14). |
| Retest run 1 found five more: a commit hook that was not executable while `doctor` said the gate was active, an import Node refused, a reformatted `package.json`, and others. | Fixed in commit `7f17007`; `doctor` now calls the gate active only when the hook can run. | Retest 2 re-ran everything: 36 of 38 rows exit 0. |
| `remove`, `kits remove`, token staging and `upgrade` could delete or overwrite a team's work (full-house review). | SB-0059 to SB-0072: confirmation guards, atomic installs, snapshot staging, upgrade never takes ownership from upstream. | Each path has a test that fails on the old code (S22 to S33). |
| The Data Table kit failed WCAG 1.4.10 Reflow at 320 px. | SB-0069: one shrinkable grid column. | Its spec now checks every state at 320 px. |
| Shadow-DOM controls broke three contract promises while every test passed: Enter did not submit, errors did not block submission, `aria-labelledby` did not resolve. | SB-0009: controls submit themselves, an error sets a validity, only `aria-label` is forwarded. | Tests now cover all three. |
| Manual screen-reader passes were owed for Command, Dialog and Sidebar and would not be run by hand. | SB-0113: stored views of Chromium's accessibility tree and check S1. | 17 specs store views; a changed view is a review item. Not speech output. |
| Our QA scorer missed valid evidence phrased in new ways, so round 5 first read QA depth as falling from 5.0 to 4.5. | Recalibrated against labelled report lines (`qa/evidence-calibration.json`); the scorer now refuses to run if its pattern disagrees with them. | The fall was the scorer's: current scorer reads 5.6 (Sonnet) and 6.2 (Opus). |
| Published benchmark text contradicted its own data: no axe findings "in every arm" against a table showing 4 to 6 of 10, a CLI-call table that cannot be rebuilt, a stale commit, "22 checks". | Corrected in `SUMMARY.md`, `ROUND3.md`, `ROUND4.md` and the README; the unreproducible table is labelled as such. | Reports now match the raw rows. |
| Our docs made 17 claims that were wrong or overstated, and the check list had drifted (22 against 25). | A truth pass over every handwritten page; tests fail when the check list or rules page names something that does not exist or an internal link breaks; counts come from the repository at build time ([status](/reference/status/)). | Drift of that kind now fails a test. |
| The off-the-shelf docs tool failed axe on its own search button on every page. | Replaced by our generator (`scripts/docs-site.mts`). | The spike note reports axe clean on 7 pages; that run was the author's and was not repeated here. |
| Full-house warnings left open: the Data Table `/` shortcut worked anywhere on the page (WCAG 2.1.4), filter results were silent (4.1.3), and Onboarding and Foundations pages overflowed at 320 px. | The shortcut listens only inside the data table page; a `role="status"` line reads "Showing 2 of 6 customers"; grid columns may shrink (PR #26). | New 320 px tests cover every Foundations page and Onboarding state; they found six Foundations pages overflowing, not five, and 9 tests failed before the fix. |
| 14 parity audits said "needs code fix" or "needs contract update" and did not record whether the fixes landed. | A dated status line under each verdict, checked against the code (PR #22). | 12 audits resolved (10 were already fixed; Button and Command contract texts corrected here). Input is partly resolved and Accordion is open; both are listed above. |
| This page said Enter does nothing on checkbox, radio-group, slider and switch. The claim was stale: SB-0009 fixed it and each spec already tested it. | Added the missing case: Enter on a disabled control does not submit (PR #23); corrected the four audits. | The new tests fail when the disabled guard is removed. |
| `doctor` exited 0 while checks failed (F24); F23 and the `tokens import` half of F24 were listed open after they were fixed. | `doctor` returns the same exit code as `check`, with test S19b (PR #21); the retest notes updated. | S19b failed before the fix. |
| Pages built with the design system failed axe `page-has-heading-one`: the page title went in `sb-card-title`, which is not a heading. Guidance in the card contract did not help (round 6: 0 of 10 Sonnet pages clean; 7 of 10 sessions read the guidance), and no session ran `sketchbook check`. | SB-0117: a hook checks every HTML page Claude writes with `sb-*` components for a level-1 heading and a `<main>`, and reports a miss in the same turn (PR #29). | Round 7: 10 of 10 pages axe-clean, at $0.20 per run against $0.21; 7 transcripts show the hook prompting the fix. A static check, not axe. |
| No component was `stable` and gate R1 had never run. | Separator: first accessibility audit (`Verdict: ready`, a forced-colors fix), signed and promoted (PRs #24, #28). The catalog ships the audits again for stable components, and R1 matches `<name>-<date>` exactly, so `button-group-*` audits no longer count for `button`. | R1 rejects Separator without `Approved-by:` and passes with it, in this repository and in installed projects. |
| SB-0097 to SB-0099 stayed `proposed` after the code landed. | SB-0097 and SB-0099 accepted, SB-0098 superseded by SB-0099 (PR #25). | Check X1 and the template's reference test pass. |

## Still open, and what we plan next

These are known and not fixed. The next steps are proposals, not commitments.

| Open item | Evidence | Proposed next step |
| --- | --- | --- |
| The harness still costs about 15% to 19% more on Sonnet authoring and UI. | Round 5. | Rerun the benchmark after any large change to the Claude layer (SB-0114 asks for it). |
| Two parity-audit items are still open: Accordion's `aria-label` fallback goes stale when the trigger text changes (only where `ariaLabelledByElements` is missing), and Input's contract does not declare that `label`, `description` and `name` reflect. | Status lines in `docs/parity-audits/accordion-*.md` and `input-*.md`; Accordion is in `docs/simplicity-debt.md`. | Input: change the contract together with a design-file sync (checks D1 and D4 require it). Accordion: revisit when the browser floor changes. |
| Promoting a component costs more than the gate asks: a status-only contract change needs a design-file round trip, because the design hash covers `status`, and D1's fix text names `sync components <name>` although that command takes a batch id. | PR #28. | Leave `status` out of the design hash; correct D1's fix text. |
| Only Separator is `stable`; every other component is `beta`. | [Status](/reference/status/). | Audit the next components the same way. |
| The package is not published, so `init` needs `--engine`; this is deliberate until the harness improves further. Schemas still sit in team-owned `spec/` (F10); hook scope at an app root is unverified. | Retest 1 and 2. | Publish when ready, then re-run the sandbox. |
| One component, one page and one seeded review; small samples; no comparison with another design system. | Value benchmark limits. | Run the same suite on one or two other setups. |
| The CLI-lowers-QA reading of round 3 (3.1 against 3.8) does not hold on the current scorer, where both are 4.6; round 5 Opus QA was extended from 5 to 10 runs after the first reading (+24% became +13%). | `ROUND5.md`. | Label both in future reports (done here); decide the sample size before the run. |
| Not covered at all: Firefox and Safari, real screen-reader speech, other components and pages. | Screen-reader views are Chromium's tree only (SB-0113). | None planned. |

## Value benchmark

**Question:** do the project files, the CLI and the Claude layer (CLAUDE.md, rules, skills, hooks) each pay for themselves? Each run is a real headless Claude Code session (2.1.322) on Sonnet 5.5 and Opus 5.5 at medium effort, in an isolated folder. Tasks: write a Switch contract with Switch removed from the catalog, build a settings page, review a page with six planted defects.

| Round | Date | Question | Runs | API cost |
| --- | --- | --- | --- | --- |
| Pilot | 2026-11-12 | Does anything pay for itself? (2 runs per cell) | 32 | $21.33 |
| 2 | 2026-11-12 | Library starter, nothing vs everything, QA and consistency (5 per cell) | 60 | $25.95 |
| 3 | 2026-11-12 | Files vs CLI vs harness, separated (10 per arm) | 90 | $56.71 |
| 4 | 2026-11-12 | Does naming the CLI in the prompt change its use? | 30 | $18.50 |
| 5 | 2026-11-14 | Does a lighter Claude layer (SB-0114) keep quality and cut cost? | 40 | $18.49 |
| 6 | 2026-11-15 | Does the card heading guidance close `page-has-heading-one`? (UI, Sonnet, A3) | 10 | $2.07 |
| 7 | 2026-11-15 | Does the page-outline hook (SB-0117) close it? (UI, Sonnet, A3) | 10 | $1.98 |

Raw rows: `docs/research/value-benchmark/results.tsv` and `round2` to `round7/results.tsv`; reports `README.md`, `ROUND2.md` to `ROUND7.md`, `SUMMARY.md`. Costs and counts above were recomputed from the rows.

**Results (rounds 3 and 5, 10 runs per arm unless noted):**

| | Empty folder | Files | Files + CLI | Files + harness | All three |
| --- | --- | --- | --- | --- | --- |
| Valid contract | 0/10 | 9/10 | 10/10 | 10/10 | 10/10 |
| Page built from `sb-*` components | 0/10 | 9/10 | 10/10 | 10/10 | 10/10 |
| Runs with an axe finding | 0/10 | 1/10 | 5/10 | 6/10 | 4/10 |

- **Files do most of the work.** They account for nearly all the conformance, at 1.4 to 6 times the cost of an empty folder.
- **The harness adds QA depth.** Before round 5 it cost 66% to 68% more in QA; see [Then and now](#then-and-now) for the cost after SB-0114.
- **Naming the CLI in the prompt changed nothing** once the harness was installed.

**Limits.** One component, one page and one seeded review. Small samples (n = 2, 5 or 10). Rounds 2 and 3 reuse arms from a different batch and engine build. The scorers changed after the first results. Fixed-context token counts (18.4k and 35.1k in the pilot; 36,118 and 39,868 in round 5) are not stored as raw output. Outside studies the reports cite (an ETH Zurich benchmark, a vendor claim, a practitioner test) were read through secondary write-ups, and the reports say so.

Reproduce with the scripts in `docs/research/value-benchmark/scripts/` (`setup-arms.sh`, `run.sh`, `collect.mjs`, `aggregate.mjs`, `score-*.mjs`).

## CLI distribution

**Question:** what happens when someone installs the harness from the CLI in an empty folder, an existing app or a clone? A sandboxed walkthrough, not a statistical study. Raw logs and `results.tsv` in `docs/research/cli-distribution-baseline`, `-retest` and `-retest-2`.

| Pass | Date | Result |
| --- | --- | --- |
| Baseline | 2026-11-11 | 66 commands, 40 exit 0, 26 non-zero (some intentional). Blockers: F1, F2, F17. |
| Retest 1 | 2026-11-11 | Fixes verified; the harness's own tests ran in a created project: 162 pass, 0 fail, 34 skipped. |
| Retest 2 | 2026-11-11 | 38 rows, 2 non-zero (both intentional refusals). Self-test 168 pass, 0 fail, 40 skipped; 100 behavior tests pass. |

One step of the Claude-layer install was simulated after the session's safety policy refused a permission skip. SB-0097 to SB-0099 record the design.

## Component parity audits

**Question:** does each component match its contract? 38 audits, one per component, in `docs/parity-audits/`. Method: a read-only comparison of the code and behavior spec against the component's own contract (which was drafted from shadcn/ui), running its Playwright spec and a subset of `npm run check`. Two audits (`command`, `dialog`) did not re-run the tests.

- **Marks across all audits:** 210 pass, 41 warn, 7 fail. There is no numeric score and no sign-off field.
- **Verdicts:** 24 match the contract, 11 need a code fix, 3 need a contract update only. A dated status line under each verdict says whether the fix landed: 2 items are still open (see [Still open](#still-open-and-what-we-plan-next)).
- **Status:** Separator is `stable`; the other components are `beta`. The live counts are on the [status page](/reference/status/).

## Reviews and spikes

| Study | Result |
| --- | --- |
| Full-house review, 2026-11-08 (`docs/reviews/`): five lenses and a safety guard, three rounds | Seven blockers found and fixed (see [Found, fixed, better](#found-fixed-better)); warnings left open at the time are in [Still open](#still-open-and-what-we-plan-next). |
| Docs generator spike (`docs/research/docmd-spike.md`) | Off-the-shelf docs tool rejected on axe; replaced by our generator. |
| Standards research (`docs/research/foundations-standards.md`, `starting-points.md`, `tools.md`, `figma-plans.md`) | Sources listed per claim; unverified cells marked. Nothing in `tools.md` was run hands-on. Figma plan limits changed in 2024 to 2025 and need rechecking. |
| Simplicity debt (`docs/simplicity-debt.md`) | 12 deliberate shortcuts, each with a revisit trigger. |

## Gates that run on every change

- **<!-- stat:checks --> checks** (`sketchbook check`). See the [check list](/reference/checks/).
- **Accessibility in the browser:** axe-core in 48 of the 53 Playwright specs (tags `wcag2a` to `wcag22aa` and best-practice), and 17 specs with a stored screen-reader view. That is not speech output: wording and timing are not checked (SB-0113).
- **Local gates** (no hosted CI, SB-0120): every push runs the checks, the maintainer checks, harness tests, typecheck and lint (`.githooks/pre-push`). Before a merge, `npm run verify` runs `npm run check`, harness tests, typecheck, a diff proving generated files are current, lint, the production audit at high (`scripts/audit.mts`: `npm audit --omit=dev`, minus the advisories accepted there until a fix ships), then the static Storybook and the component specs (Playwright retries once). It runs on the local Node and OS only.
- **Docs guards:** tests fail when the check list or rules page names something that does not exist, or when an internal link or anchor in `site/` does not resolve.
- **Context budget:** the always-on Claude layer is capped at 16,000 bytes and check H1 warns at 90%.
- **Not in the local gates:** the value benchmark (manual, costs API spend), the CLI distribution sandboxes and the docs site build.
