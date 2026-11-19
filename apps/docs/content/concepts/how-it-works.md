---
title: "How it works"
description: "Follow a change from the file you edit to the outputs you use."
order: 10
---

Your team edits the spec and brand settings. The harness reads those files, rebuilds the outputs, and checks that they agree. You can see the same source change in the library, preview, or design file.

## The loop

When a check fails, follow the loop back to the file that owns the change.

<!-- illustration: loop | The check closes the loop and shows you where to return when a change needs work. -->

1. **Edit the source.** Change a brand setting, a semantic token, a contract or a decision.
2. **Rebuild.** Generators write the foundation tokens, CSS and component styles.
3. **Run the checks.** `sketchbook check` verifies the sources are valid and the outputs match them.
4. **Pass the gates.** A new component stops at the planning gate and is built test-first.
5. **Read the outputs.** Storybook, the design file and the docs show the result.

```terminal
sketchbook tokens set color.primary "#0F766E"
sketchbook check
```

## What you edit

| You edit | It controls | Sketchbook generates |
| --- | --- | --- |
| `brand.config.json` | every foundation, as a preset or your own values | `spec/tokens/foundation/*` |
| `spec/tokens/semantic/*.tokens.json` | what each color or size means, per mode | `generated/**` |
| `spec/components/<name>/contract.json` and `contract.md` | a component's API, tokens and accessibility | `src/components/*/*.styles.ts`, `src/index.ts` |
| `spec/decisions/DECISIONS.md` | why things are the way they are | |

> **Note** Rebuild after changing the source. The next rebuild replaces edits to generated files. Sketchbook keeps hand edits to foundation tokens as flagged overrides and reports them with exit code 2. If you enabled the Claude Code edit guard, a blocked edit names the source to change.

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
