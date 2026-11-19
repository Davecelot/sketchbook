---
title: "Foundations and tokens"
description: "See how a brand value reaches a component through three token layers."
order: 20
---

Set your brand’s color, type, spacing, or other foundations in `brand.config.json`. Choose a preset from `harness/standards/` or supply custom values. Sketchbook generates the foundation tokens from those choices.

```terminal
sketchbook presets
sketchbook tokens preset spacing grid-8 --dry-run
sketchbook tokens set color.primary "#0F766E"
sketchbook tokens diff
```

Use `--dry-run` first, then end with `sketchbook tokens diff`, `sketchbook tokens impact` and `sketchbook check`. The `foundations` skill drives the same commands in Claude Code.

## Three layers

Start at the component and follow the aliases to find the value you want to change.

<!-- illustration: layers | The component token uses a semantic role. That role points to a foundation value. -->

Each layer may reference only the layer directly below it.

| Layer | Holds | May reference |
| --- | --- | --- |
| Foundation | Literal values, generated from `brand.config.json` | Nothing |
| Semantic | Meaning, such as a primary color, per mode | Foundation |
| Component | `--sb-<component>-*` values, declared in the contract | Semantic |

Check T2 enforces this. A component token that aliases a foundation token fails; use a semantic token in between.

> **Note** Component CSS may use only its own component tokens and private `--_*` properties. Need another value? Add a component token to the contract first.

## Semantic tokens

The files in `spec/tokens/semantic/` are yours. Change values freely, or use `sketchbook tokens add` and `sketchbook tokens remove`. `spec/tokens/brand-links.json` declares which tokens follow the brand; to unlink one, remove its link instead of overwriting its value.

> **Note** Semantic tokens are an interface: `spec/tokens/interface.json` lists what contracts, stories, specs and `.storybook` depend on, and check T7 guards it. Rename with `sketchbook tokens rename <old> <new>`, and run `sketchbook tokens impact <token>` first to see what depends on it.

## Overrides

A hand edit to a foundation token is kept, but recorded in `spec/tokens/overrides.json` and flagged, and `sketchbook check` exits 2. Resolve it into `brand.config.json`, then reset it.

```terminal
sketchbook tokens overrides list
sketchbook tokens overrides reset <path>
```

## Themes

Three independent axes change the look from the same tokens. Any combination is valid, which gives 2 × 4 × 3 = 24.

| Axis | What changes | Values |
| --- | --- | --- |
| Mode | Color roles | light, dark (`brand.config.json` `modes`) |
| Shape | The radius scale | sharp, soft (default), round, pill-heavy |
| Density | The control sizes and paddings | compact, comfortable (default), spacious |

`spec/tokens/brand-links.json` says which semantic tokens follow the brand, grouped by foundation (density, radius, motion, elevation, icons, z); `docs/design-docs/themes.md` maps them to axes. Density changes components only; Shape and Mode also reach the page chrome. The [design file](/concepts/design-file/) turns each axis into a variable collection with one mode per value.

## Next steps

- [Foundations guide](/guides/foundations/)
- [Import tokens](/guides/import-tokens/)
- [Contracts](/concepts/contracts/)

Source of truth: `brand.config.json`, `harness/standards/`, `harness/checks/t2-aliases.mts`, `harness/checks/t7-interface.mts`, `spec/tokens/interface.json`, `spec/tokens/brand-links.json`, `.claude/rules/tokens-through-the-harness.md`, `.claude/rules/spec-is-source.md`
