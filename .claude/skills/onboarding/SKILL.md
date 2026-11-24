---
name: onboarding
description: >
  Welcome someone to Sketchbook and get them to a starting point: who they
  are, where they start, a starter via `sketchbook init --start …`, then a
  handoff to foundations or components. Trigger: the person is new ("where
  do I start", "what is a token"), runs /start or /init the first time, or
  asks what commands exist or what to run next ("I'm lost").
metadata:
  author: sketchbook
  version: "1.0.0"
  changelog: Rendered from the shared workflow
  auto-invoke: See description
  allowed-tools: Governed by the client and user
---

# Onboarding

Sketchbook is the first draft of a design system: every team brings its own brand and way of working, and the default is something to edit or redo, not to obey. Explain as you go, in plain words, one question at a time, each with a recommended answer and why. Assume no design-system background unless the person shows otherwise.

## When to use

Use this skill when:

- The person is new: "how does this work", "where do I start", "set up my design system", "what is a token".
- The person runs `/start` or `/init` for the first time, or runs `/tour`.
- The person asks what a part of the repo is for.
- The person asks what commands exist, what a command does, or what to run next.

Do not use this skill for:

- Changing foundations once a starter exists (use `foundations`).
- Adding or designing a component (use `sketchbook add <name>` or `/add <Name>`).
- Adding pages and blocks (use `kits`).

---

## Critical patterns

### 1. The model in four sentences

1. You describe the system in files: `brand.config.json` (foundations: color, type, spacing …), `spec/tokens/semantic/*` (what each value means, per light/dark mode) and `spec/components/<name>/contract.*` (each component's API, look and accessibility). Everything else is generated from them.
2. Tokens come in three layers: foundation (raw values from brand.config), semantic (meaning, like `color.primary`) and component (each component's own knobs). Components only see the semantic layer, so you can redo every foundation without touching a component.
3. Components are accessible Web Components, built test-first and documented from their contracts; template kits are whole pages built from them.
4. `sketchbook check` proves it all fits together (contrast, layers, contracts vs code, generated files); the design file (Figma) is synced from the same source.

### 2. One question at a time

Ask who they are first, then where they start. Each question carries a recommendation and its reason.

### 3. Explaining things

- `sketchbook explain <thing>` for any token, CSS variable, component, tag or decision; translate the answer into plain words.
- Point to files instead of repeating them: `AGENTS.md` and the project work instructions are the map; `docs/getting-started.md` is the short walkthrough.

### 5. The command tour

Two surfaces: named workflows (`sketchbook harness list`, optionally invoked through a client's slash commands) and the `sketchbook` CLI. Whenever someone asks what commands exist, explain the purpose beside every name in plain words. Use the examples below and `sketchbook help <cmd>` for current options.

| Slash command | What it does |
| --- | --- |
| `/start` | Choose a starting point and set it up |
| `/init` | Set up or rebrand (starting point, brand, font, radius, density, prefix) |
| `/tour` | This tour |
| `/foundations` | Change color, type, spacing, radius, density and the rest (studio) |
| `/add` | Install a component from the catalog, or design a new one (planning gate first) |
| `/kits` | Add, adapt or remove page templates and blocks |
| `/import-tokens` | Bring existing tokens in as a reviewed proposal |
| `/check` | Run the checks and explain any failure |
| `/explain` | Say where a token, component or decision comes from |
| `/roast-foundations` | Critique the foundations against the standards (read-only) |
| `/sync` | Sync variables, styles and docs to the Figma file |
| `/swap` | Swap a token builder or design tool without touching the spec |

| CLI group | What it is for |
| --- | --- |
| `init`, `doctor`, `status`, `upgrade` | Set up, health, what is installed, update harness files |
| `add`, `remove`, `list`, `kits`, `brand`, `presets` | Components, template kits, brands, presets |
| `tokens`, `generate`, `prefix`, `swap` | Foundations, rebuild generated files, rename the prefix, swap an adapter |
| `check`, `selftest` | Deterministic checks; prove the checks can reject |
| `explain`, `docs`, `api`, `audit-css`, `icons` | Explain a value, write docs, API standard, audit CSS, icon set |
| `sync` | Sync to the design file |
| `help` | Options for any command: `sketchbook help <cmd>` |

Commands are read in full from `sketchbook help <cmd>`; `docs/cli.md` is the same text in one file. Do not invent commands: anything not in these tables is not a command.

### 6. Changing things safely

- Foundations: the `foundations` skill (`/foundations`), never by editing `spec/tokens/foundation/*` or `generated/` (rule `tokens-through-the-harness`).
- Components: `sketchbook add <name>` from the catalog, `/add <Name>` for a new one (planning gate, then tests first), `sketchbook remove <name>` to drop one.
- A decision changes: add a new entry to `spec/decisions/DECISIONS.md` that supersedes the old one.
- Health: `sketchbook doctor` (starter, versions, overrides, drift); updates from a newer Sketchbook: `sketchbook upgrade --dry-run` (harness files only; team files are reported, never overwritten).

---

## Decision tree

### 1. Who are you? (one question)

Ask: "What best describes you?" — designer, developer, design-system lead, product person, or new to design systems. Use the answer to set the depth of explanations (designers: show Storybook and Figma early; developers: show the CLI and files; new: explain each term the first time).

### 2. Where do you start? (one question, with a recommendation)

| If they… | Starter | What they get |
| --- | --- | --- |
| want a working library now, to rebrand later | `library` (default) | All reference components, default foundations |
| want pages to start from too | `library+kits` | The library plus template kits (sign-in, settings, data table, dashboard …) |
| only need some components | `pick` | The chosen components and what they depend on |
| want to settle foundations before any component | `foundations` | Foundations, their Storybook pages and Figma variables; no components yet |
| want to design everything from zero | `blank` | A foundations questionnaire; components added one at a time |
| already have tokens (DTCG / Tokens Studio, CSS variables) | `import` | A library and kits, plus a proposal to map their token values when they provide a file |
| already have a product | `from-codebase` | A token proposal clustered from their CSS (colors, sizes, radii, shadows) |

Recommendation logic (say it as a sentence with the reason):

- They have tokens or a product → recommend the matching import starter: their decisions are already made; Sketchbook should learn them, not replace them.
- New to design systems, no assets → `library`: they see a working system at once, and every foundation change shows on real components.
- Design-system lead building their own → `foundations`: decide the system's raw material first, then add components deliberately.
- Product team that needs screens fast → `library+kits`.
- They name a few components → `pick`.
- Only `blank` when they explicitly want to build every component themselves.

### 3. Start

1. Commit or stash first if the repo has changes (git is the undo button).
2. `sketchbook init --start <starter> --dry-run`, explain what it will add, then `sketchbook init --start <starter>`. Other `init` flags (`--name`, `--primary`, `--font`, `--radius`, `--density`, `--design figma|none`, `--prefix`) can go on the same call when they already know them; otherwise leave them to the foundations studio. Run `sketchbook help init` to confirm the options for a starter (for example how `pick` takes component names, or which file `import` reads).
3. Read the check results with them; for a contrast failure, name the pair in plain words and offer the suggested step.
4. `sketchbook status` to show what is installed.

### 4. Offer help with token names (optional)

After setup, before the first Foundations session, offer one choice if they have not already made it: “Keep Sketchbook’s token names, bring your team’s names, or explore alternatives?” Recommend keeping the names if they’re unsure. Let them skip without delaying their next step. If they already chose the `import` starter to bring their tokens, go straight to review instead of asking again.

- **Keep Sketchbook’s names:** give one concrete next step for the starter. Nothing changes, and there’s no need to ask another naming question.
- **Bring your team’s names:** ask for a token file if they have one and take them to Foundations import review. If `init --start import --from <file>` already wrote a proposal, use it rather than running import again. Import maps values; it does not rename tokens. If they want Sketchbook to adopt their vocabulary, review an explicit rename with the Foundations skill. If they have names but no file, compare names using the next option.
- **Explore alternatives:** use [Choosing token names](https://sketchbook-docs.vercel.app/guides/choosing-token-names/) to compare names on one component. For content on the primary button fill, Sketchbook ships `color.primary-foreground`; `color.on-primary` is a possible replacement, not a second token or a built-in alias. Do not ask people to settle a system-wide format or change anything without approval.

### 5. Hand off

| Starter | Next |
| --- | --- |
| `blank`, `foundations` | `foundations` skill, `guided` mode, all areas (color first) |
| `library`, `library+kits` | `foundations` skill, `guided` mode for the brand (color, typography, radius, density), then `npm run storybook` |
| `pick` | `sketchbook add <name>` for anything missing (or `/add <Name>` to design a new one), then `foundations` guided |
| `import` | Foundations import review: open the proposal, or ask for a file to create one |
| `from-codebase` | Review the CSS audit with Foundations, then preview any chosen values with `sketchbook tokens set`; the audit is not an import proposal |

Then, when they want pages: the `kits` skill. Several brands from one system: `sketchbook brand add <name>` (run `sketchbook help brand`).

---

## Commands

```bash
sketchbook init --start <starter> --dry-run   # preview a starter (blank|foundations|library|library+kits|pick|import|from-codebase)
sketchbook init --start <starter>             # set it up
sketchbook help init                          # confirm options (pick, import, flags)
sketchbook status                             # what is installed
sketchbook explain <thing>                    # token, CSS variable, component, tag or decision
sketchbook add <name>                         # install a component from the catalog
sketchbook remove <name>                      # drop a component
sketchbook brand add <name>                   # several brands from one system
sketchbook doctor                             # starter, versions, overrides, drift
sketchbook upgrade --dry-run                  # harness files only; team files never overwritten
sketchbook check                              # prove it all fits together
npm run storybook                             # see the components
```

---

## Resources

- `AGENTS.md` or the project’s instructions: the map of the repo.
- `docs/getting-started.md`: the short walkthrough.
- `foundations` skill: next step for most starters.
- `kits` skill: pages and blocks once components exist.
- `design-figma` skill: syncing the Figma file.
