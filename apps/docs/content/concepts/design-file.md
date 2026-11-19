---
title: "Design file"
description: "The Figma file is an output of the spec, written and read back by sketchbook sync."
order: 60
---

The design file is generated from `spec/`. It is never a source. Do not edit variables, styles or docs in the file by hand: change the spec, then sync. A hand edit shows up as a mismatch in check D1.

[Download the example Figma file](/assets/Sketchbook.fig) and import it into Figma to explore a reference snapshot of one possible Sketchbook output. Sketchbook ships with no file key: start by importing the example, then set your own file as the sync target with `sketchbook swap design figma --file <your file key>`. To sync without committing the key, set the `SKETCHBOOK_FIGMA_FILE` environment variable instead; it takes precedence over `adapters.design.file`.

## What sync writes

With the design adapter set to Figma, `sketchbook sync` writes to the file named in `adapters.design.file` in `harness.config.json`, and nowhere else:

- Variables: collections and modes for Mode, Shape and Density.
- Text and effect styles.
- Documentation pages and library components, drawn from `spec/design-docs.json` and the contracts.

The Guide page is static orientation with no sync date or hash. `sketchbook sync guide` redraws it when pages or theme axes change; it is outside the token stamp and check D1.

The scripts only create and update. They never delete, so removing or renaming something in the file is a separate step you confirm first.

## Requirements

- The Figma MCP with `use_figma` is connected. Without it, the sync stops and tells you what to do.
- The file is on a plan that allows several modes per collection. `Semantic - Shape` has 4 modes and `Semantic - Density` has 3, and Figma's free Starter plan may allow only one mode per collection (not confirmed on an official page; see `docs/research/figma-plans.md`).

## Sync flow

`sync tokens` writes numbered scripts with only what changed since the last stamp. You run each one through `use_figma`, in order, then stamp and read the file back.

```terminal
sketchbook sync tokens
sketchbook sync stamp tokens
sketchbook sync verify
sketchbook sync verify --ingest figma-verify.json
sketchbook sync components <batch>
sketchbook sync progress
```

In Claude Code, `/sync` runs this flow through the `design-figma` skill, and `/sync verify` runs the read-back.

> **Warning** Library scripts carry a checksum and refuse to run if a paste differs by one character. Copy each file exactly. Do not hand the pasting to a sub-agent.

`sketchbook docs <name>` prints the same component doc as tool-neutral text.

## Components and patterns

Storybook is the reference and the design file is an output that must look like it. A component or pattern is not done until `sketchbook sync compare` and a side-by-side look agree with Storybook; a clean read-back alone is not enough.

```terminal
sketchbook sync compare settings --url http://localhost:6006
sketchbook sync compare --ingest generated/design/compare
sketchbook sync stamp note button
```

`compare --ingest` writes `docs/design-docs/parity.md`. When the library cannot match yet, record the gap with `sync stamp note` and fix it in place; stamp `checked` only after the comparison agrees. `sync realize` records each drawn component in its contract, and `sync theme-matrix` draws every theme combination side by side.

## What is checked

- D1: the file is behind the spec, or a value differs.
- D3: token names in the design docs are real.
- D4: the library read-back recorded per contract in `realizations.design`.

## Next steps

- [Design file CLI](/cli/design-file/): every `sync` mode and option.
- [Checks](/concepts/checks/): how D1 fits with the other checks.
- [How it works](/concepts/how-it-works/): where outputs sit in the flow.

Source of truth: `.claude/skills/design-figma/SKILL.md`, `.claude/commands/sync.md`, `harness.config.json`, `spec/design-docs.json`, `docs/cli.md`
