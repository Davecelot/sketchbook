# Getting started

This walkthrough is for an initialized design-system project. Follow the [quickstart](https://sketchbook-docs.vercel.app/start/quickstart/) to pack the engine and create a project. Init writes `docs/harness.md` with the initial installation inventory.

Coding agents can use `AGENTS.md` and `AGENT-WORKFLOWS.md`. The Claude Code layer is optional, and hook coverage varies by client. Run `npx sketchbook doctor` to inspect the local setup.

In JetBrains AI Assistant chat, verify that the Sketchbook rule is set to **Always** under Settings → Tools → AI Assistant → Rules; check response attachments to confirm it is included. Existing project rules are preserved during init and upgrade.

For Codex, verify hook trust and activation. New projects include a subdirectory launcher that runs only the shipped adapter (allowing line-ending differences); existing or customized hook settings are preserved and may need a deliberate update. `npx sketchbook doctor` reports the recognized launcher and warns when the adapter will be skipped. The guard does not cover shell edits or settled decisions.

For a design system inside an existing Git repository, Copilot hook discovery varies by workspace and client; cloud and repository-root sessions need a root hook configuration. If your team wants to enable the nested project's edit guard, see the **Copilot repository hooks for an adopted app** section in the engine package's `docs/agent-compatibility.md` for a root configuration example. Review existing hooks before adding a separate file; initialization never changes them.

## 1. What you are editing
| You edit | It controls | Never edit (generated) |
| --- | --- | --- |
| `brand.config.json` | every foundation (color, type, spacing, radius, density, motion …), as a preset or your own values | `spec/tokens/foundation/*` |
| `spec/tokens/semantic/*.tokens.json` | what each color or size means, per light/dark mode | `generated/**` |
| `spec/components/<name>/contract.json` + `contract.md` | a component's API, tokens, accessibility, docs | `src/components/*/*.styles.ts`, `src/index.ts` |
| `spec/decisions/DECISIONS.md` | why things are the way they are | |

## 2. Pick a starting point
Sketchbook is a first draft: start from wherever you are, and edit or redo the default. Choose a starter when you create the project. In Claude Code, `/start` can help you choose.

| Starter | For |
| --- | --- |
| `library` (default) | A working component library now, rebranded later |
| `library+kits` | The library plus page templates (sign-in, settings, data table, dashboard …) |
| `pick` | Only some components (and what they depend on) |
| `foundations` | Foundations first, components later |
| `blank` | Everything from zero, one component at a time |
| `import` | Your existing tokens (DTCG / Tokens Studio, CSS variables) |
| `from-codebase` | An existing product's CSS |

To see what your current project contains, run `npx sketchbook status`.

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
npx sketchbook explain --sb-button-default-bg
npx sketchbook explain sb-input
npx sketchbook explain SB-0009
```

## 6. Add or change a component
`npx sketchbook add <name>` installs a reference component from the catalog; `npx sketchbook kits` manages page templates. To design a new one, follow `AGENT-WORKFLOWS.md` or use `/add <Name>` in Claude Code; the flow for a new component is always: contract → `npm run check` → plan → tests written first and seen failing → code → green → review → `beta`.

## 7. Keep the design file in step

Download the [example Figma file](https://sketchbook-docs.vercel.app/assets/Sketchbook.fig) to explore a reference snapshot. To sync, open your own file in Figma, connect the Figma MCP, and set the target with `npx sketchbook swap design figma --file <your file key>` or the `SKETCHBOOK_FIGMA_FILE` environment variable. Run `npx sketchbook help sync` for the workflow. Check D1 reports drift for a configured target. [Figma setup](https://sketchbook-docs.vercel.app/concepts/design-file/).

## 8. Swap a piece
`npx sketchbook swap tokens plain` (no Style Dictionary), `npx sketchbook swap design none` (no design file). The spec doesn't change.
