---
title: "Rules"
description: "See which Claude Code rules apply to a task and how their requirements are checked."
order: 40
---

Find the project’s rules in `.claude/rules/`. Four load for every session: `spec-is-source`, `tokens-through-the-harness`, `comment-minimalism`, and `no-ai-attribution`. Rules with `paths:` load when Claude reads a matching file. Use the entries below to see which checks or hooks cover each rule.

## spec-is-source

Change the spec, then rebuild. Never edit `generated/**`, `spec/tokens/foundation/*`, `src/index.ts` or `*.styles.ts` by hand. Component CSS uses only its own `--sb-<component>-*` and private `--_*` properties. Accepted decisions are never edited. Partly automatic: the `guard-decisions` hook and checks T4, T5 and G1.

## tokens-through-the-harness

Change foundations in `brand.config.json` or with `sketchbook tokens set|preset`. Semantic renames go through `sketchbook tokens rename`. Imports are proposals until applied. Checks G1, T7 and exit code 2 catch drift.

## planning-gate

When `features.planningGate` is on, run `npm run check`, write `plan.md`, and stop for approval before writing tests or code. A person records approval with `sketchbook approve <name> --by <name>`. C4 checks whether it still covers the current scope.

## test-first

When `features.testFirst` is on, write the story and behavior spec first. Run `sketchbook evidence red <name>` and check why the tests failed. After implementation, run `sketchbook evidence green <name>` with the same spec and test setup. C5 verifies the records; it cannot tell you whether a test failed for the intended reason.

## contract-first

No component implementation without a `contract.json` that passes `npm run check`. Manual; check C3 catches code with no contract.

## comment-minimalism

Write no comments unless they explain a non-obvious why. Manual, no linter.

## form-associated-controls

A component that stands in for a native form control extends `FormAssociated(LitElement)` from its first version and implements `formValue()`, `formReset()`, `formStateRestore()` and `validationAnchor()`. Manual.

## figma-fidelity

Storybook is the reference; the design file must look like it. A pattern is not drawn until `sketchbook sync compare` and a side-by-side look agree. Manual: `docs/design-docs/parity.md` must show a match before a pattern is stamped `checked`.

## no-ai-attribution

Commits and pull requests carry no AI attribution: no `Co-Authored-By:` trailer for an agent, no "Generated with" line. Partly automatic: the `commit-msg` git hook rejects an AI trailer; pull request text is manual.

> **Note** Rules describe how Claude works in the repo. [Checks](/reference/checks/) verify the repo itself.

## Next steps

- [Claude layer](/concepts/claude-layer/): skills, commands and rules together.
- [Checks reference](/reference/checks/): every deterministic check.

Source of truth: `.claude/rules/spec-is-source.md`, `.claude/rules/tokens-through-the-harness.md`, `.claude/rules/planning-gate.md`, `.claude/rules/test-first.md`, `.claude/rules/contract-first.md`, `.claude/rules/comment-minimalism.md`, `.claude/rules/form-associated-controls.md`, `.claude/rules/figma-fidelity.md`, `.claude/rules/no-ai-attribution.md`
