---
title: "Accessibility"
description: "See how to check a component’s accessibility from contract through review."
order: 45
---

Start with the component contract. It records the keyboard behavior, names, and states the component needs to meet Sketchbook’s WCAG 2.2 AA target. Automated checks cover part of that work, and reaching `stable` requires a signed accessibility audit. See [Status](/reference/status/) for current audit and lifecycle counts.

## The bar

- **Native first.** Use a native element (`button`, `input`, `dialog`) before ARIA, and add ARIA only where no native element carries the meaning.
- **Contrast per pair.** Each contract declares its color pairs, and check T6 tests them in every mode and brand against the targets in the contrast foundation (`wcag-aa` by default, or `wcag-aaa`). A failing pair reports the nearest passing step. APCA values are shown as information and never fail a check.
- **Keyboard and focus.** A contract states the keys each component binds, and the behavior specs press them.

## How it is checked

| Layer | What it checks | Where |
| --- | --- | --- |
| axe-core | No violations in every component story and behavior spec | Storybook a11y addon and `playwright/helpers/a11y.ts` |
| Behavior specs | Keyboard, focus, states and events in a real browser, across the shadow DOM | `playwright/tests/` |
| Screen-reader views | Roles, names, descriptions, values and announced states, stored as reviewable text | `__screen-reader__/` beside each component's spec |
| Check S1 | Every shipped component has stored views, none with an unnamed control, plus a keyboard view where its keys change what is announced | `sketchbook check` |
| Check T6 | Declared color pairs meet contrast | `sketchbook check` |

The screen-reader views are read from Chrome's computed accessibility tree, so no screen reader needs to be installed and no manual pass is run (SB-0113). A changed view is a review item: read the diff before updating a snapshot.

> **Note** The views are Chromium's tree, not speech. Wording, verbosity, announcement timing and position in a set ("2 of 3") are not checked.

## Review and sign-off

The `a11y-checker` skill audits a component in POUR order (perceivable, operable, understandable, robust), ranks findings by user impact and runs a live keyboard pass for composite widgets. `stable` needs an accessibility audit whose verdict is ready, plus an `Approved-by:` line in the latest `docs/a11y-audits/<name>-*.md` (check R1; the [contract format](/reference/contract-format/) has the full lifecycle).

## Next steps

- [Checks](/concepts/checks/): how a check passes or fails.
- [Contracts](/concepts/contracts/): where the accessibility section of a contract lives.
- [Claude layer](/concepts/claude-layer/): the skills that run these audits.

Source of truth: `playwright/helpers/a11y.ts`, `harness/checks/t6-contrast.mts`, `harness/checks/r1-registry.mts`, `.claude/skills/a11y-checker/SKILL.md`, `spec/decisions/DECISIONS.md` (SB-0029, SB-0113)
