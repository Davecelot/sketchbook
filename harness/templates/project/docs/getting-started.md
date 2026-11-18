# Getting started

This walkthrough assumes no design-system background.

## 1. What you are editing
| You edit | It controls | Never edit (generated) |
| --- | --- | --- |
| `brand.config.json` | every foundation (color, type, spacing, radius, density, motion …), as a preset or your own values | `spec/tokens/foundation/*` |
| `spec/tokens/semantic/*.tokens.json` | what each color or size means, per light/dark mode | `generated/**` |
| `spec/components/<name>/contract.json` + `contract.md` | a component's API, tokens, accessibility, docs | `src/components/*/*.styles.ts`, `src/index.ts` |
| `spec/decisions/DECISIONS.md` | why things are the way they are | |

## 2. Pick a starting point
Sketchbook is a first draft: start from wherever you are, and edit or redo the default. In Claude Code, `/start` asks who you are and recommends one; or run it yourself:

| Starter | For |
| --- | --- |
| `library` (default) | A working component library now, rebranded later |
| `library+kits` | The library plus page templates (sign-in, settings, data table, dashboard …) |
| `pick` | Only some components (and what they depend on) |
| `foundations` | Foundations first, components later |
| `blank` | Everything from zero, one component at a time |
| `import` | Your existing tokens (DTCG / Tokens Studio, CSS variables) |
| `from-codebase` | An existing product's CSS |

```sh
npx sketchbook init --start library --dry-run
npx sketchbook init --start library
```

## 3. Make the foundations yours (the Foundations studio)
`/foundations` in Claude Code walks through color, typography, spacing, radius, density, elevation, motion, layout grid, icons and z-index. Modes: `guided` (one question at a time, each with a recommendation), `preset` (pick a standard from the catalog), `expert` (your own values), `import` (bring tokens), `scratch` (start the foundations from zero; components keep working), `roast` (a fresh-eyes critique against the standards). `/roast-foundations` and `/import-tokens <file>` are shortcuts. Without Claude:
```sh
npx sketchbook tokens presets spacing
npx sketchbook tokens preset spacing grid-8 --dry-run
npx sketchbook tokens set color.primary "#0F766E"
npx sketchbook tokens diff
```
Every change regenerates the foundation layer (color ramps in OKLCH, type and spacing scales), rebuilds `generated/css/tokens.css` and runs the checks. If a color pair fails contrast, the check names the pair and the nearest passing step. Run `npx sketchbook help tokens` for every option.

## 4. Look at it
`npm run storybook`, then switch Mode in the toolbar. `Foundations/*` pages show each foundation; each component's page shows its contract summary, controls and every state.

## 5. Trace any value
```sh
node harness/cli.mjs explain --sb-button-default-bg
node harness/cli.mjs explain sb-input
node harness/cli.mjs explain SB-0009
```

## 6. Add or change a component
`npx sketchbook add <name>` installs a reference component from the catalog; `/kits` adds page templates. To design a new one: `/add <Name>` in Claude Code; the flow for a new component is always: contract → `npm run check` → plan → tests written first and seen failing → code → green → review → `beta`.

## 7. Keep the design file in step
Figma: open the file named in `harness.config.json`, connect the Figma MCP, then `/sync`. `npm run check` (D1) tells you when the design file is behind the spec.

## 8. Swap a piece
`node harness/cli.mjs swap tokens plain` (no Style Dictionary), `node harness/cli.mjs swap design none` (no design file). The spec doesn't change.
