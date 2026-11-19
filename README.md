<div align="center">

<img src="brand/sketchbook-icon.svg" alt="Sketchbook" width="96" height="96" />

# Sketchbook

**The harness for building a design system with coding agents.**<br />
Sources of truth, generators, deterministic checks, gates and agent guidance make design-system work repeatable. A component library is one of its outputs.

<br />

[![official web](https://img.shields.io/badge/official%20web-sketchbook--docs.vercel.app-111111?style=flat-square&labelColor=555)](https://sketchbook-docs.vercel.app)
[![npm version](https://img.shields.io/npm/v/@usesketchbook/cli?style=flat-square&labelColor=555)](https://www.npmjs.com/package/@usesketchbook/cli?activeTab=readme)
![license](https://img.shields.io/badge/license-MIT-6aa84f?style=flat-square&labelColor=555)
![process](https://img.shields.io/badge/process-contract--first%20%C2%B7%20test--first-e69138?style=flat-square&labelColor=555)
![checks](https://img.shields.io/badge/checks-26%20deterministic-3d85c6?style=flat-square&labelColor=555)
![claude layer](https://img.shields.io/badge/claude%20layer-13%20skills%20%C2%B7%208%20rules-c27ba0?style=flat-square&labelColor=555)
![accessibility](https://img.shields.io/badge/accessibility-WCAG%202.2%20AA-8e7cc3?style=flat-square&labelColor=555)
![default output](https://img.shields.io/badge/default%20output-Web%20Components-d9683f?style=flat-square&labelColor=555)

[Quick start](#quick-start) · [Contributing](./CONTRIBUTING.md) · [How it works](#how-it-works) · [Evidence](#evidence) · [Use cases](#what-you-can-do-with-it) · [Public docs](https://sketchbook-docs.vercel.app/)

</div>

<br />

## What is Sketchbook

Sketchbook gives your team a workflow for building and maintaining a design system. It ships a CLI, a reference Web Components library, and starters you can adapt to your brand. The harness connects your design-system spec to generated outputs, checks, and instructions that coding agents can follow.

| Part | What it is |
| --- | --- |
| **Sources of truth** | Brand config, semantic tokens, one contract per component, a decision log. You edit these. |
| **Generators** | Rebuild foundation tokens, CSS, component styles, Storybook and the Figma file from the sources. |
| **Checks** | 26 deterministic checks (including one maintainer-only check): tokens, contrast, contracts, drift, white-label, decisions and more. |
| **Gates** | A new component stops at a planning gate, is built test-first, and is reviewed before it leaves beta. |
| **Agent guidance** | Portable project instructions and task workflows, plus the existing Claude Code rules, skills, commands and hooks. |
| **Outputs** | Tokens, a Web Components library, 8 page templates, Storybook, a Figma file and docs. The default library follows [shadcn/ui](https://ui.shadcn.com) and is a starting point you can edit or replace. |

Bring nothing, your brand, your tokens or an existing product. The process is the same.

## Quick start

Use Node.js 26.13.1 LTS and npm 12.2.3. See the [contributor setup instructions](./CONTRIBUTING.md) for patched versions on older LTS lines. Create a design system with [`@usesketchbook/cli` on npm](https://www.npmjs.com/package/@usesketchbook/cli).

```sh
mkdir my-design-system
cd my-design-system
npm exec --yes --package=@usesketchbook/cli -- sketchbook init --start library --dry-run
npm exec --yes --package=@usesketchbook/cli -- sketchbook init --start library
npx sketchbook check
```

`init` adds the CLI as a dev dependency of the design-system project. For an existing app, add `--adopt` to `init` and run it from the app directory. To bring your own tokens, use `--start import --from <tokens file>`. See the [Quickstart](https://sketchbook-docs.vercel.app/start/quickstart/) for all seven starters and the [upgrade guide](https://sketchbook-docs.vercel.app/guides/adopt-in-app/#upgrade) for updating the CLI and harness.

Plain `init` creates a core-only project and writes its initial inventory to `docs/harness.md`. Add `--agent claude` to stage Claude Code, or `--agent codex,trae` to install both selected integrations. The same flag adds profiles to an existing project. Run `npx sketchbook doctor` to inspect your setup. [Agent compatibility guide](./docs/agent-compatibility.md)

## Work on this repository

From the checkout root, run `npm ci` and then `npm run storybook` for the reference library or `npm run docs:build` for the public docs. The [contributor guide](./CONTRIBUTING.md) maps the engine, reference library, and docs app and lists the verification commands.

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

**Checks and hooks have different scopes.** The configured Git commit gate runs deterministic checks. Claude Code hooks can block edits to generated files and accepted decisions; Gemini CLI and Copilot have adapters for specific native edit tools. Hook activation, trust and tool coverage vary by client. The Claude layer also loads task-specific rules by `paths:` (SB-0114). See the [compatibility map](./docs/agent-compatibility.md) for current coverage and limitations.

| You edit | The harness generates | Never edit |
| --- | --- | --- |
| `brand.config.json` | Foundation tokens (color, type, spacing, radius, elevation, motion, density, grid, icons, layers) | `spec/tokens/foundation/*` |
| `spec/tokens/semantic/*` | Light and dark theme variables | `generated/**` |
| `spec/components/<name>/contract.json` | Component styles, docs, stories, Figma components | `src/components/*/*.styles.ts` |

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

The `@usesketchbook/cli` package is the engine (CLI, checks, generators and the tools they run) plus this reference library, so it installs those tools too. An app should depend on the team's own package instead: `sketchbook init` creates it with `lit` as its only runtime dependency.

Without a bundler, load the self-contained bundle (Lit included):

```html
<link rel="stylesheet" href="node_modules/@usesketchbook/cli/generated/css/tokens.css" />
<script src="node_modules/@usesketchbook/cli/dist/sketchbook.js"></script>

<sb-input label="Email" type="email" name="email" required></sb-input>
<sb-button type="submit">Save</sb-button>
```

With a bundler, `import '@usesketchbook/cli'` and `import '@usesketchbook/cli/tokens.css'`; `lit` and `@lit/context` are peer dependencies, so the app shares one copy.

Dark mode follows `prefers-color-scheme`, or set `data-theme="dark"` on `<html>`. Rename the `sb` prefix with `npx sketchbook prefix <name>`.

</details>

## Benefits

| | |
| --- | --- |
| **A process, not a pile of files** | Contract, plan, approval, tests, checks and review, documented for contributors and agents. |
| **Agent guidance** | Shared instructions describe the process; client-specific hooks and deterministic checks provide additional safeguards. |
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
- Give coding agents your sources, workflow gates and the safeguards supported by their client.
- Define color, type, spacing and radius from presets or your own values, and see the impact before you apply it.
- Import tokens from Figma, Tokens Studio, DTCG or CSS variables, and review them as a proposal first.
- Add the harness to an existing app, in its own folder, with one script in your `package.json`.
- Propose tokens from an existing codebase's CSS (`sketchbook audit-css`).
- Design a new component with an agent, contract first, with tests written before the code.
- Roast your foundations against standards and accessibility, with evidence.
- Keep Figma in step with code. Explore the downloadable example and configure your own sync target. [Figma setup](https://sketchbook-docs.vercel.app/concepts/design-file/).
- Start from the shadcn/ui look and edit it until it is yours, or replace the library and keep the harness.
- Build pages from templates: sign-in, settings, dashboard, data table, onboarding, profile, docs article, form states.
- Rename the element prefix, or swap the token builder or design tool, without touching the spec.

<details>
<summary><b>Default components and templates</b></summary>

**Components (38):** Accordion, Alert, Aspect Ratio, Avatar, Badge, Breadcrumb, Button, Button Group, Card, Checkbox, Collapsible, Command, Dialog, Direction, Empty, Field, Input, Input Group, Item, Kbd, Label, Native Select, Pagination, Progress, Radio Group, Scroll Area, Separator, Sidebar, Skeleton, Slider, Spinner, Switch, Table, Tabs, Textarea, Toggle, Toggle Group, Typography.

**Templates (8):** Dashboard, Data Table, Docs Article, Form States, Onboarding, Profile, Settings, Sign In.

</details>

## Docs

- [Public documentation](https://sketchbook-docs.vercel.app/) for setup guides, the CLI reference, and interactive component demos.
- [Repository documentation index](./docs/README.md) for guides, audits, and research.
- [Security policy](./SECURITY.md) for private vulnerability reporting and supported code.
- [Getting started](./docs/getting-started.md) for your first changes in an initialized project.
- [CLI reference](./docs/cli.md): every command and option.
- [Agent compatibility](./docs/agent-compatibility.md): supported instruction entry points, hook coverage and model-family test targets.
- [Decisions](./spec/decisions/DECISIONS.md): why the system is the way it is.
- [Research](./docs/research/): standards and starting-point research behind the presets.

## Credits

Component list, names and visual reference from shadcn/ui (MIT); icons from Lucide (ISC); CLI conventions adapted from CLI-Anything (Apache-2.0); process patterns generalized from a production design system. See [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
