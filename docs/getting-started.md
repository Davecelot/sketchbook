# Getting started

Start in your design-system folder. Run `npx sketchbook status` to see your brand and components, then follow the steps below to make and preview your first change. To create a project, follow the [Quickstart](https://sketchbook-docs.vercel.app/start/quickstart/).

Open `docs/harness.md` to see what init installed. If you selected an agent profile, run `npx sketchbook doctor` to inspect the files on disk, then confirm what your client loaded. [Agent compatibility](https://sketchbook-docs.vercel.app/concepts/agent-compatibility/)

## 1. What you are editing
| You edit | It controls | Sketchbook generates |
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

## 3. Change your first foundation

Preview a primary color change and apply it when you’re ready.

```sh
npx sketchbook tokens set color.primary "#0F766E" --dry-run
npx sketchbook tokens set color.primary "#0F766E"
npx sketchbook check
```

If a color pair fails contrast, the check names the pair and suggests a passing step. Run `npx sketchbook tokens impact color.primary` to see what uses the color. See the [foundations guide](https://sketchbook-docs.vercel.app/guides/foundations/) for presets and other values you can change.

## 4. See what changed

Run `npm run storybook` and open **Foundations → Color**. Switch **Mode** in the toolbar and compare how the new color is used in light and dark.

## 5. Trace any value
```sh
npx sketchbook explain --sb-button-default-bg
npx sketchbook explain sb-input
npx sketchbook explain SB-0009
```

## 6. Add or change a component
`npx sketchbook add <name>` installs a reference component from the catalog; `npx sketchbook kits` manages page templates. To design a new one, follow `AGENT-WORKFLOWS.md` or use `/add <Name>` in Claude Code; start with the contract and follow the project’s enabled planning and test-first gates.

## 7. Keep the design file in step

Download the [example Figma file](https://sketchbook-docs.vercel.app/assets/Sketchbook.fig) to explore a reference snapshot. To sync, open your own file in Figma, connect the Figma MCP, and set the target with `npx sketchbook swap design figma --file <your file key>` or the `SKETCHBOOK_FIGMA_FILE` environment variable. Run `npx sketchbook help sync` for the workflow. Check D1 reports drift for a configured target. [Figma setup](https://sketchbook-docs.vercel.app/concepts/design-file/).

## 8. Change an adapter
`npx sketchbook swap tokens plain` (no Style Dictionary), `npx sketchbook swap design none` (no design file). Both commands use your existing spec.
