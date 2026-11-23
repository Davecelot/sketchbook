---
title: "Evidence"
description: "See what Sketchbook’s tests and studies found, how they were run, and what you can conclude from them."
order: 50
---

Use the studies below to see where Sketchbook helped in a measured task and where the evidence is still limited. For current component maturity and check counts, see [Status](/reference/status/). To install the published package, follow the [Quickstart](/start/quickstart/).

## What works, and is shown

- **Project files helped Claude follow the design system.** In November 2026, 9 of 10 runs with project files alone produced a valid Switch contract, compared with 0 of 10 from an empty folder. The files-only condition also produced a page using Sketchbook components in 9 of 10 runs. [Benchmark summary](https://github.com/Davecelot/sketchbook/blob/main/docs/research/value-benchmark/SUMMARY.md)
- **The packaged project passed an installation walkthrough.** The November 11, 2026 retest exercised project creation and adoption, checks, builds, and component tests. It was a sandboxed walkthrough, with one Claude setup step simulated. [Installation retest](https://github.com/Davecelot/sketchbook/tree/main/docs/research/cli-distribution-retest-2)
- **A page-outline reminder helped in one task.** On November 15, 2026, 10 of 10 generated settings pages had a level-one heading and main landmark after a Claude hook added a reminder. In the prior round, none of the 10 pages had a level-one heading. The hook checks those two structural features. [Round 7 report](https://github.com/Davecelot/sketchbook/blob/main/docs/research/value-benchmark/ROUND7.md)
- **v0.6.0 recorded approval and test-first evidence in an installed project.** On November 23, 2026, the CLI rejected a stale approval and advanced a Button fixture to `ready` after a real Chromium run failed before the change and passed afterward. The same report separates the published package checks from later, unpublished Claude smoke tests. [v0.6.0 verification](https://github.com/Davecelot/sketchbook/blob/main/docs/research/v0.6.0-verification.md)

## Then and now

These are comparisons between dated runs. Use them to understand the changes tested in each study.

| Measure | Earlier run | Later run | Record |
| --- | --- | --- | --- |
| Opus cost for the seeded review, compared with files and CLI alone | 83% higher with the original Claude layer | 13% higher with the lighter layer | [November 14 benchmark](https://github.com/Davecelot/sketchbook/blob/main/docs/research/value-benchmark/ROUND5.md) |
| Non-zero exits in the installation walkthrough | 26 of 66, including intentional refusals | 2 of 38, both intentional refusals | [November 11 baseline](https://github.com/Davecelot/sketchbook/tree/main/docs/research/cli-distribution-baseline) and [second retest](https://github.com/Davecelot/sketchbook/tree/main/docs/research/cli-distribution-retest-2) |

## Found, fixed, better

- **Adopting an app could overwrite its entry point.** The November 11 baseline reproduced the overwrite. The follow-up verified that init refused the populated folder and adoption used a separate design-system folder. [Baseline report](https://github.com/Davecelot/sketchbook/blob/main/docs/research/cli-distribution-baseline/README.md)
- **The review scorer missed valid findings expressed in new ways.** The November 14 report explains how the scorer was recalibrated against labeled evidence and gives corrected results. [Round 5 report](https://github.com/Davecelot/sketchbook/blob/main/docs/research/value-benchmark/ROUND5.md#qa-depth-the-first-reading-was-the-scorer)
- **Docs counts and references drifted.** Status now reads its counts from the repository at build time. Tests check that the reference lists real checks and rules and that internal links resolve. [Docs reference tests](https://github.com/Davecelot/sketchbook/blob/main/harness/test/docs-reference.test.mts)

## Still open, and what we plan next

The benchmark covers one component, one page, and one seeded review. The tested conditions used small samples, and Sketchbook’s own scripts scored the results. Broader claims about other tasks or design systems need more evidence. [Benchmark limits](https://github.com/Davecelot/sketchbook/blob/main/docs/research/value-benchmark/SUMMARY.md)

The component tests include Chromium accessibility-tree snapshots. These record the exposed roles, names, and states. Spoken wording and timing need testing with a screen reader. See the [accessibility guide](/concepts/accessibility/) for what the browser tests cover.

## Value benchmark

The November 12–15, 2026 study ran headless Claude Code sessions to write a Switch contract, build a settings page, or find defects in a seeded review. The numbers below come from the contract and page tasks in rounds 3 and 5, with 10 runs per condition. Costs in the reports are from the Claude Code CLI.

| Outcome | Empty folder | Files | Files + CLI | Files + Claude layer | All three |
| --- | --- | --- | --- | --- | --- |
| Valid contract | 0/10 | 9/10 | 10/10 | 10/10 | 10/10 |
| Used Sketchbook components | 0/10 | 9/10 | 10/10 | 10/10 | 10/10 |
| Runs with an axe finding | 0/10 | 1/10 | 5/10 | 6/10 | 4/10 |

Some conditions reuse earlier runs from a different batch and engine build. The empty-folder runs used a different implementation, so their axe counts describe those pages and should be read alongside the component-use results. Read the reports for scorer revisions, raw rows, and reproduction steps. [Benchmark reports and data](https://github.com/Davecelot/sketchbook/tree/main/docs/research/value-benchmark)

## CLI distribution

The November 11, 2026 study tried installing or running the package in an empty folder, an existing app, and a checkout. In the second retest, the project’s harness self-test recorded 168 passes and 40 skips, and 100 component behavior tests passed. For current install and upgrade steps, use the [Quickstart](/start/quickstart/) and [adoption guide](/guides/adopt-in-app/#upgrade). [Second retest report and logs](https://github.com/Davecelot/sketchbook/tree/main/docs/research/cli-distribution-retest-2)

## Component parity audits

A parity audit compares a component’s code and tests with its contract. The original 38 audits recorded 24 matches, 11 code fixes, and 3 contract-only updates. Read the dated notes in each audit to see what changed after the initial verdict. See [Status](/reference/status/) for current lifecycle counts. [Component parity audits](https://github.com/Davecelot/sketchbook/tree/main/docs/parity-audits)

## Reviews and spikes

- [November 8, 2026 repository review](https://github.com/Davecelot/sketchbook/blob/main/docs/reviews/2026-11-08-full-house.md) records the blockers found and the fixes checked in later rounds.
- [Docs generator prototype](https://github.com/Davecelot/sketchbook/blob/main/docs/research/docmd-spike.md) records the accessibility findings that shaped the site’s generator.
- [Research notes](https://github.com/Davecelot/sketchbook/tree/main/docs/research) cover foundation standards, starting points, and tools, with sources and limits for each study.

## Gates that run on every change

Run [`sketchbook check`](/concepts/checks/) to verify the project’s sources and outputs. Read the [contributor guide](https://github.com/Davecelot/sketchbook/blob/main/CONTRIBUTING.md#verify-a-change) for the repository’s maintainer checks and pre-merge workflow.
