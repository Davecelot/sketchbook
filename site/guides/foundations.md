---
title: "Change a foundation"
description: "Change brand color, type, spacing, radius or density, then review the diff and impact."
order: 10
---

`brand.config.json` holds your foundation decisions. Each one is a `preset` from the standards catalog, a `custom` value, or a preset plus small overrides. `spec/tokens/foundation/*` is generated from it. A hand edit there is kept as a flagged override, and `sketchbook check` exits 2 until you resolve it.

1. **List the presets.** Pass a family to see its presets.

   ```terminal
   sketchbook tokens presets
   sketchbook tokens presets spacing
   ```

2. **Preview.** Every mutating command accepts `--dry-run`. It runs the same token checks, so a failing dry run means the real run would be refused.

   ```terminal
   sketchbook tokens preset spacing grid-8 --dry-run
   ```

3. **Apply.** `preset` switches a foundation to a catalog preset. `set` writes one value by dot path.

   ```terminal
   sketchbook tokens preset spacing grid-8
   sketchbook tokens set color.primary "#0F766E"
   ```

   Density takes `compact`, `comfortable` or `spacious`. Radius takes `sharp`, `soft`, `round` or `pill-heavy`.

4. **Review the diff.** It lists CSS custom properties added, removed and changed per mode, against `HEAD`.

   ```terminal
   sketchbook tokens diff
   ```

5. **Check the impact.** It shows what depends on a token: aliases, brand links, contracts, stories and specs.

   ```terminal
   sketchbook tokens impact color.primary
   ```

6. **Run the checks.**

   ```terminal
   sketchbook check
   ```

> **Tip** Each change proposes a decision record in `spec/decisions/DECISIONS.md`. Pass `--no-record` to skip it.

> **Warning** Rename semantic tokens only with `sketchbook tokens rename <old> <new>`. Contracts, stories and specs depend on them.

## What you can set

`sketchbook presets` lists <!-- stat:families --> families; the default preset of each is marked `*`.

| Family | Presets |
| --- | --- |
| `spacing` | grid-4, grid-2, grid-8, grid-10, grid-5 |
| `radius` | soft, sharp, round, pill-heavy |
| `density` | comfortable, compact, spacious |
| `typeScale` | tailwind, and the musical-interval scales (minor second to golden) |
| `weights`, `lineHeight`, `letterSpacing` | standard and one alternative each |
| `neutrals`, `rampMethods` | neutral, slate, gray, zinc, stone; oklch, tailwind-11, radix-12, m3-tonal, contrast-targeted |
| `semanticRoles` | primary, destructive, success, warning, info |
| `contrast` | wcag-aa, wcag-aaa, apca |
| `motion` | tailwind-like (default), material-like, carbon-productive, carbon-expressive, minimal |
| `elevation` | tailwind (default), flat, layered-5 |
| `zIndex` | standard (default), named-layers |
| `opacity`, `borderWidth` | standard |
| `layoutGrid`, `breakpoints` | 12-col, 16-col; tailwind, bootstrap |
| `iconSizes` | standard, carbon-like |

`sketchbook presets <family>` shows the values and where each comes from. The icon set (<!-- stat:icons --> icons) is `spec/icons.json`: `sketchbook icons list`, `add` and `remove` change it, and `sketchbook sync icons` draws it in the design file.

## Use Claude

`/foundations [area] [mode]` opens the `foundations` skill. Modes are `guided`, `preset`, `expert`, `import`, `scratch` and `roast`. `/roast-foundations` critiques the setup and is read-only.

## When a check fails

A color pair that fails contrast (T6) is named with the nearest passing step. For overrides, run `sketchbook tokens overrides list`, move each into `brand.config.json`, then run `sketchbook tokens overrides reset <path>`.

## Next steps

- [Foundations and tokens](/concepts/foundations-and-tokens/): the three token layers.
- [Import tokens](/guides/import-tokens/): bring tokens you already have.
- [Config files](/reference/config-files/): the shape of `brand.config.json`.

Source of truth: `brand.config.json`, `.claude/rules/tokens-through-the-harness.md`, `.claude/skills/foundations/SKILL.md`, `docs/cli.md`, `harness/standards/`
