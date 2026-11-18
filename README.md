<div align="center">

<img src="brand/sketchbook-icon.svg" alt="Sketchbook" width="96" height="96" />

# Sketchbook

**The harness for building a design system, with Claude.**<br />
Sources of truth, generators, deterministic checks, gates and a Claude layer that make design-system work repeatable. A component library is one of its outputs.

<br />

[![official web](https://img.shields.io/badge/official%20web-sketchbook--docs.vercel.app-111111?style=flat-square&labelColor=555)](https://sketchbook-docs.vercel.app)
![license](https://img.shields.io/badge/license-MIT-6aa84f?style=flat-square&labelColor=555)
![process](https://img.shields.io/badge/process-contract--first%20%C2%B7%20test--first-e69138?style=flat-square&labelColor=555)
![checks](https://img.shields.io/badge/checks-26%20deterministic-3d85c6?style=flat-square&labelColor=555)
![claude layer](https://img.shields.io/badge/claude%20layer-13%20skills%20%C2%B7%208%20rules-c27ba0?style=flat-square&labelColor=555)
![accessibility](https://img.shields.io/badge/accessibility-WCAG%202.2%20AA-8e7cc3?style=flat-square&labelColor=555)
![default output](https://img.shields.io/badge/default%20output-Web%20Components-d9683f?style=flat-square&labelColor=555)

[Quick start](#quick-start) · [How it works](#how-it-works) · [Evidence](#evidence) · [Use cases](#what-you-can-do-with-it) · [Docs](#docs)

</div>

<br />

## What is Sketchbook

Sketchbook is the layer around your design system, not the design system's UI. It holds the way of working: what the source of truth is, how outputs are rebuilt from it, what is checked, which steps need approval, and how Claude is told to behave while it works.

| Part | What it is |
| --- | --- |
| **Sources of truth** | Brand config, semantic tokens, one contract per component, a decision log. You edit these. |
| **Generators** | Rebuild foundation tokens, CSS, component styles, Storybook and the Figma file from the sources. |
| **Checks** | 26 deterministic checks (including one maintainer-only check): tokens, contrast, contracts, drift, white-label, decisions and more. |
| **Gates** | A new component stops at a planning gate, is built test-first, and is reviewed before it leaves beta. |
| **Claude layer** | Rules, skills, slash commands and hooks that keep an agent inside the process, so it follows your system instead of guessing. |
| **Outputs** | Tokens, a Web Components library, 8 page templates, Storybook, a Figma file and docs. The default library follows [shadcn/ui](https://ui.shadcn.com) and is a starting point you can edit or replace. |

Bring nothing, your brand, your tokens or an existing product. The process is the same.

## How it works

Everything starts from a few files you own. The harness rebuilds every output from them, and checks stop anything that drifts.

```mermaid
flowchart LR
  S["Edit a source<br/>brand · tokens · contract · decision"] --> G["Rebuild<br/>generators"]
  G --> K{"26 checks<br/>+ guard hooks"}
  K -- fail --> S
  K -- pass --> O["Outputs<br/>CSS · components · Storybook · Figma · docs"]
```

**A component goes through the same path every time.**

1. **Contract.** `contract.json` and `contract.md` describe the API, tokens and accessibility. `npm run check` must pass.
2. **Plan.** `plan.md` states scope, files, tokens, accessibility approach, test plan and open questions.
3. **Approval.** Work stops here. Code starts only after a person approves the plan.
4. **Tests first.** Stories and a behavior spec (Playwright and axe) are written from the contract and seen failing.
5. **Implement** the smallest code that passes, using only the component's own tokens.
6. **Gates.** Checks, typecheck and tests pass, then a multi-lens review before the component moves to `beta`.

**The rules are enforced, not suggested.** Hooks block hand edits to generated files and to accepted decisions, and a commit gate blocks any commit while a check fails. The Claude layer keeps the always-on rules in every session and loads task-specific ones by `paths:` when matching files are read (SB-0114), so the agent knows the contract comes first and names the supported route when you ask for something the process forbids.

| You edit | The harness generates | Never edit |
| --- | --- | --- |
| `brand.config.json` | Foundation tokens (color, type, spacing, radius, elevation, motion, density, grid, icons, layers) | `spec/tokens/foundation/*` |
| `spec/tokens/semantic/*` | Light and dark theme variables | `generated/**` |
| `spec/components/<name>/contract.json` | Component styles, docs, stories, Figma components | `src/components/*/*.styles.ts` |

## Quick start

Needs Node 22.18+ or 24+.

```sh
npm install
npm run test:install                    # Chromium for behavior tests (once)
npx sketchbook init --start library     # or blank | foundations | library+kits | pick | import | from-codebase
npx sketchbook tokens preset spacing grid-8 --dry-run   # preview a change before making it
npm run storybook                       # every foundation and component, light and dark
npm run check                           # deterministic checks, no AI involved
```

Pick the path that matches where you are:

| Where you are | Command |
| --- | --- |
| Starting fresh | `npx sketchbook init --start library` |
| Adding the harness to an existing app | `npx sketchbook init --adopt --start from-codebase` |
| Bringing existing tokens (DTCG, Tokens Studio, CSS) | `npx sketchbook init --start import --from <tokens file>` |

`init` stages the Claude layer in `move-to-.claude/` and asks Claude to install it, so you approve every change to `.claude/`. Your own hooks, commands and permissions are kept.

<details>
<summary><b>With Claude Code</b>: slash commands</summary>

| Command | What it does |
| --- | --- |
| `/start` | Picks a starting point with you |
| `/foundations` | Edits foundations: guided, preset, expert, import, scratch or roast |
| `/import-tokens` | Brings in existing tokens as a reviewed proposal |
| `/kits` | Adds page templates |
| `/add <Component>` | Installs a component or designs a new one, contract first, up to the planning gate |
| `/check` | Runs the checks and explains any failure |
| `/explain <thing>` | Traces any value back to its source |
| `/sync` | Updates the Figma file |
| `/swap` | Swaps the token builder or design tool without touching the spec |
| `/tour` | Explains what each command is for |

Every command, with options: [docs/cli.md](./docs/cli.md).

</details>

<details>
<summary><b>Use the default components</b> in plain HTML</summary>

The `sketchbook` package is the engine (CLI, checks, generators and the tools they run) plus this reference library, so it installs those tools too. An app should depend on the team's own package instead: `sketchbook init` creates it with `lit` as its only runtime dependency.

Without a bundler, load the self-contained bundle (Lit included):

```html
<link rel="stylesheet" href="node_modules/sketchbook/generated/css/tokens.css" />
<script src="node_modules/sketchbook/dist/sketchbook.js"></script>

<sb-input label="Email" type="email" name="email" required></sb-input>
<sb-button type="submit">Save</sb-button>
```

With a bundler, `import 'sketchbook'` and `import 'sketchbook/tokens.css'`; `lit` and `@lit/context` are peer dependencies, so the app shares one copy.

Dark mode follows `prefers-color-scheme`, or set `data-theme="dark"` on `<html>`. Rename the `sb` prefix with `npx sketchbook prefix <name>`.

</details>

## Benefits

| | |
| --- | --- |
| **A process, not a pile of files** | Contract, plan, approval, tests, checks, review. Every component follows it, and the agent follows it too. |
| **Claude stays inside your system** | Rules, skills and hooks give the agent your sources of truth and block the shortcuts. |
| **Checked without AI** | 26 deterministic checks cost no model spend and can each fail. |
| **One source, every output** | Code, Storybook, CSS variables and Figma stay in step because they come from the same files. |
| **Every foundation is yours** | 19 foundation families with 63 cited presets, or your own values, in one config. |
| **Start where you are** | Seven starters, from blank to an existing codebase. |
| **Accessible by default** | WCAG 2.2 AA, axe in every component test, screen-reader views of the accessibility tree. |
| **Safe to upgrade** | Team-owned files are never overwritten. `sketchbook upgrade` only touches what the engine owns. |

## Evidence

Sketchbook was tested the way it is used: with a real AI agent, real projects and real installs.

**Does the harness make an agent follow your design system?** 252 headless Claude Code runs (Sonnet 5.5 and Opus 5.5) across five rounds, about $141 of API spend. The agent got the same tasks with and without the project's files, the CLI and the harness.

Round 3, before the lighter Claude layer (out of 10 runs):

| Task | Empty folder | Project files | + CLI + harness |
| --- | --- | --- | --- |
| Writes a valid component spec | 0 | 9 | 10 |
| Uses design-system components | 0 | 9 | 10 |
| Uses tokens only, no literal colors | 0 | 10 | 10 |
| Finds a real extra defect in a QA review | 0 | 9 | 10 |

- The CLI makes authoring **21–32% cheaper** than files alone, and writes the same 8 files every run (round 3).
- Round 5 (SB-0114) cut the harness's always-on context and reran the full setup. Evidence-backed findings per QA report rose from **4.0 to 5.6** (Sonnet) and **5.2 to 6.2** (Opus) over the CLI-only setup, with QA cost **−7% / +13%** against it. Every task now sits within +19% of that setup. Before the cut, the same harness added +66–68% to QA cost. Round 5 also recalibrated the scorer, so its numbers are not directly comparable with round 3's 3.8 → 5.0.
- A bare model matched it on whether the page works, keyboard use and the planted defects, so the harness's value is conformance and evidence, not raw capability.
- **What this does not show:** no comparison with other design systems, one component and one page, 10 runs per setup, and scorers written by the project. Read gaps as direction. Full report: [docs/research/value-benchmark/SUMMARY.md](./docs/research/value-benchmark/SUMMARY.md).

**Does it install and upgrade safely?** From a packed tarball in an empty folder, `init`, `status`, `doctor`, `check`, `add`, `remove`, `upgrade` and repair all pass, with 100 of 100 behavior tests and 168 harness tests passing. Adopting into an existing app changes one line of its `package.json`. A team's own `.claude/` settings survive the install. In a hand-run Claude Code session, the installed rules made Claude decline an edit to a generated file and a rewrite of an accepted decision, and name the supported route instead. [Retest report](./docs/research/cli-distribution-retest-2/README.md).

**Does the output match its reference?** Each of the 38 components (35 core and 3 more) has a parity audit: a read-only comparison of its code and behavior spec against its own contract, which was drafted from shadcn/ui. [docs/parity-audits/](./docs/parity-audits/).

## What you can do with it

- Run design-system work as a repeatable process: contract, plan, approval, tests, checks, review.
- Keep Claude on your rules: it reads your sources, follows the gates and is blocked from editing generated output.
- Define color, type, spacing and radius from presets or your own values, and see the impact before you apply it.
- Import tokens from Figma, Tokens Studio, DTCG or CSS variables, and review them as a proposal first.
- Add the harness to an existing app, in its own folder, with one script in your `package.json`.
- Propose tokens from an existing codebase's CSS (`sketchbook audit-css`).
- Design a new component with Claude, contract first, with tests written before the code.
- Roast your foundations against standards and accessibility, with evidence.
- Keep Figma in step with code: variables, styles and components generated and read back.
- Start from the shadcn/ui look and edit it until it is yours, or replace the library and keep the harness.
- Build pages from templates: sign-in, settings, dashboard, data table, onboarding, profile, docs article, form states.
- Rename the element prefix, or swap the token builder or design tool, without touching the spec.

<details>
<summary><b>Default components and templates</b></summary>

**Components (38):** Accordion, Alert, Aspect Ratio, Avatar, Badge, Breadcrumb, Button, Button Group, Card, Checkbox, Collapsible, Command, Dialog, Direction, Empty, Field, Input, Input Group, Item, Kbd, Label, Native Select, Pagination, Progress, Radio Group, Scroll Area, Separator, Sidebar, Skeleton, Slider, Spinner, Switch, Table, Tabs, Textarea, Toggle, Toggle Group, Typography.

**Templates (8):** Dashboard, Data Table, Docs Article, Form States, Onboarding, Profile, Settings, Sign In.

</details>

## Docs

- [Getting started](./docs/getting-started.md): a walkthrough from install to your first check.
- [CLI reference](./docs/cli.md): every command and option.
- [Decisions](./spec/decisions/DECISIONS.md): why the system is the way it is.
- [Research](./docs/research/): standards and starting-point research behind the presets.
- [CLAUDE.md](./CLAUDE.md): the full map of the repository.

## Credits

Component list, names and visual reference from shadcn/ui (MIT); icons from Lucide (ISC); CLI conventions adapted from CLI-Anything (Apache-2.0); process patterns generalized from a production design system. See [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
