---
title: "How it works"
description: "Edit a source, rebuild the outputs, run the checks."
order: 10
---

The harness is the code in `harness/` that turns a few source files into outputs and checks that the two still agree.

## The loop

<!-- illustration: loop | Edit the sources, rebuild the outputs, check. A failed check sends you back to the sources. -->

1. **Edit a source of truth.** Change a brand setting, a semantic token, a contract or a decision.
2. **Rebuild.** Generators write the foundation tokens, CSS and component styles.
3. **Run the checks.** `sketchbook check` verifies the sources are valid and the outputs match them.
4. **Pass the gates.** A new component stops at the planning gate and is built test-first.
5. **Read the outputs.** Storybook, the design file and the docs show the result.

```terminal
sketchbook tokens set color.primary "#0F766E"
sketchbook check
```

## What you edit

| You edit | It controls | Generated (never edit) |
| --- | --- | --- |
| `brand.config.json` | every foundation, as a preset or your own values | `spec/tokens/foundation/*` |
| `spec/tokens/semantic/*.tokens.json` | what each color or size means, per mode | `generated/**` |
| `spec/components/<name>/contract.json` and `contract.md` | a component's API, tokens and accessibility | `src/components/*/*.styles.ts`, `src/index.ts` |
| `spec/decisions/DECISIONS.md` | why things are the way they are | |

> **Note** Change the source, not the output. A hook blocks Claude's edits to generated files and names the source to change. A hand edit to a foundation token is the one exception: it is kept as a flagged override (`sketchbook check` exits 2). Any other generated file is overwritten by the next rebuild.

The harness has four parts: generators, deterministic checks (plain code, each can fail), gates for new components, and the `sketchbook` CLI that wraps them.

## Outputs

- **Tokens and CSS:** `spec/tokens/foundation/*`, `generated/**` and component styles.
- **Component library:** built from the contracts, shown in [the demo](/demo/). It is one output, and you can edit or replace it.
- **Storybook:** the preview and the reference for how a component looks.
- **Design file:** variables, styles and components synced to Figma with `sketchbook sync`.
- **Kits:** whole pages and blocks in `src/patterns/<kit>/`, built only from system components.
- **Docs:** `sketchbook docs <component>` prints a tool-neutral document.

The contracts, tokens and checks work the same whichever components you keep.

## Adapters

`harness.config.json` names the tool behind each output: `components` (lit), `tokens` (style-dictionary), `preview` (storybook), `tests` (playwright) and `design` (figma). The spec does not change when a tool does. `sketchbook swap tokens plain` or `sketchbook swap design none` replaces an adapter, rebuilds and checks.

## Next steps

- [Foundations and tokens](/concepts/foundations-and-tokens/)
- [Contracts](/concepts/contracts/)
- [Checks](/concepts/checks/)

Source of truth: `CLAUDE.md`, `harness.config.json`, `harness/checks/run.mts`, `.claude/rules/spec-is-source.md`, `src/patterns/`
