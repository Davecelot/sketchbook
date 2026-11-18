# sketchbook CLI

<!-- GENERATED from harness/cli/commands by npm run build:cli-docs. Do not edit; change the command module. -->

Deterministic half of the harness. Run `sketchbook <command>` (or `node harness/cli.mjs <command>`).

## Conventions

- Bare `sketchbook` in a terminal opens an interactive menu built from this registry: pick a group and a command, answer prompts (current values shown), see the dry run, then confirm. Piped input or `--json` prints help instead.
- `--json` on every command prints one envelope: `{ ok, command, changed[], warnings[], errors[{file, msg, fix}], next, data? }`.
- Exit codes: 0 ok, 1 failed, 2 ok with flags (for example overrides kept in spec/tokens/overrides.json).
- Read-only commands never write. Mutating commands say what they change; those marked "dry run" accept `--dry-run`.
- Conventions (one registry, introspect before mutate, JSON envelope) are adapted from CLI-Anything (HKUDS, Apache-2.0, https://github.com/HKUDS/CLI-Anything); no code is used.

| Global option | Meaning |
| --- | --- |
| `--json` | Print one JSON envelope instead of human output |
| `--dry-run` | Show what would change without writing (mutating commands that support it) |
| `--help` | Show help for the command |

## Project

### init

In a new or empty folder: install the whole harness (engine, Claude layer, hooks, configs, starter content), check it, then explain what was installed. In a project: pick a starting point (--start) and/or set the brand, regenerate, then check.

```
sketchbook init [--name <value>] [--primary <value>] [--font <value>] [--radius <value>] [--density <value>] [--danger <value>] [--design <value>] [--file <value>] [--prefix <value>] [--start <starter>] [--components <a,b>] [--from <file>] [--yes] [--dir <folder>] [--adopt] [--engine <spec>] [--no-install] [--with <groups>] [--detach-catalog] [--dry-run] [--json]
```

Changes files; supports `--dry-run`.

| Option | Meaning |
| --- | --- |
| `--name` | Brand or system name |
| `--primary` | Primary color as #RRGGBB, or "neutral" for the shadcn default |
| `--font` | Font family name (falls back to the system stack) |
| `--radius` | sharp \| soft \| round \| pill-heavy (sketchbook presets radius) |
| `--density` | compact \| comfortable \| spacious |
| `--danger` | Destructive color as #RRGGBB |
| `--design` | Design-file adapter: figma \| none |
| `--file` | Figma file key (when design is figma) |
| `--prefix` | Element and CSS prefix, e.g. acme (acme-button, --acme-*); rewrites sources (see sketchbook prefix) |
| `--start` | Starting point: blank \| foundations \| library (default) \| library+kits \| pick \| import \| from-codebase (harness/starters) |
| `--components` | With --start: the components to have (pick needs it; all \| none also work); dependencies come along |
| `--from` | With --start import: the tokens file; with --start from-codebase: the CSS path or glob to audit |
| `--yes` | Confirm what would lose work: with --start, removing components or kits the starter does not include; with brand options or a starter that patches foundations, letting the brand links overwrite hand-edited linked tokens. It never detaches the catalog |
| `--dir` | Create the project in this folder (new or empty), e.g. a design-system folder inside an existing repository; default: here |
| `--adopt` | In an existing project: add the design system in its own folder (design-system/, or --dir) without changing your files; your package.json gets one script that runs its checks |
| `--engine` | New project only: the npm spec of the engine package to depend on (default: this version; a tarball or git URL before it is published) |
| `--no-install` | New project only: skip npm install and the Chromium download (init lists them as next steps) |
| `--with` | Optional Claude-layer groups to install (forge; comma-separated): forge (forge-me-a-skill, the skill standard for writing your own skills). In a new project they are staged with it; in a project they are added. Without it none are installed |
| `--detach-catalog` | With --start in the catalog source repo (catalog.source true): stop tracking harness/catalog; the components become the team's own |

Examples:

- `sketchbook init`
- `sketchbook init --dir design-system --start library`
- `sketchbook init --start library`
- `sketchbook init --with forge`
- `sketchbook init --start blank --yes`
- `sketchbook init --start pick --components card,button`
- `sketchbook init --start from-codebase --from "../app/**/*.css"`
- `sketchbook init --primary "#2563EB" --font Inter --radius round`
- `sketchbook init --density compact --dry-run`

### status

Show the prefix, brand summary, components by status, overrides and design sync state (read-only).

```
sketchbook status [--json]
```

Read-only.

Examples:

- `sketchbook status`
- `sketchbook status --json`

### doctor

Health report (read-only): starter, harness version, installed vs catalog components, kits, brands, overrides, design sync, failing checks, the Claude layer (installed or staged) and the commit gate. Exits like check (0 pass, 1 a check fails, 2 pass with overrides).

```
sketchbook doctor [--json]
```

Read-only.

Examples:

- `sketchbook doctor`
- `sketchbook doctor --json`

### upgrade

Update harness-owned files. In a project that runs the engine from node_modules: from the installed engine (after npm update), no --from. Elsewhere: from a newer Sketchbook folder or git URL (harness-owned in both manifests); team-owned, shared, reclassified and protected files (the manifest itself, configs, package files) are listed, never touched; writing anything needs --yes (a dry run first shows what).

```
sketchbook upgrade [--from <path|git-url>] [--yes] [--dry-run] [--json]
```

Changes files; supports `--dry-run`.

| Option | Meaning |
| --- | --- |
| `--from` | A newer Sketchbook: a folder, or a git URL (cloned shallowly; its commit is printed) |
| `--yes` | Confirm writing the upstream harness code (required whenever files would change), then run the checks with it |

Examples:

- `sketchbook upgrade --from ../sketchbook --dry-run`
- `sketchbook upgrade --from ../sketchbook --yes`
- `sketchbook upgrade --from https://example.com/sketchbook.git --dry-run`

### propagate

Carry a Foundations or harness change to every output: rebuild the tokens and components, build the engine, sync the design file scripts (tokens and foundations), and record what the outputs were built from. --maintainer also builds Storybook and the docs site (maintainers only).

```
sketchbook propagate [--maintainer] [--json]
```

Changes files.

| Option | Meaning |
| --- | --- |
| `--maintainer` | Also build Storybook and the docs site, and record them for check --maintainer |

Examples:

- `sketchbook propagate`
- `sketchbook propagate --maintainer`

### generate

Rebuild every generated output from the spec: token CSS, component tokens, component styles, the barrel, brand CSS and the token interface (what npm run generate runs in a project).

```
sketchbook generate [--json]
```

Changes files.

Examples:

- `sketchbook generate`
- `sketchbook generate --json`

### prefix

Rename the element and CSS prefix everywhere (sources, contracts, tests, docs), rebuild, then check.

```
sketchbook prefix <new> [--dry-run] [--json]
```

Changes files; supports `--dry-run`.

| Argument | Meaning |
| --- | --- |
| `new` | Lowercase letters and digits, e.g. acme |

Examples:

- `sketchbook prefix acme`
- `sketchbook prefix acme --dry-run`

### swap

Replace an adapter (token build or design tool) without touching the spec, then rebuild and check.

```
sketchbook swap <output> <adapter> [--file <id>] [--dry-run] [--json]
```

Changes files; supports `--dry-run`.

| Argument | Meaning |
| --- | --- |
| `output` | What to swap: tokens | design |
| `adapter` | tokens: style-dictionary | plain; design: figma | none |

| Option | Meaning |
| --- | --- |
| `--file` | Design file key (design figma) |

Examples:

- `sketchbook swap tokens plain`
- `sketchbook swap design none`

## Components

### add

Install a component from the catalog (contract, code, stories, specs; dependencies first), or --blank to scaffold a new contract (status draft, proposed decision).

```
sketchbook add <Component Name...> [--blank] [--dry-run] [--json]
```

Changes files; supports `--dry-run`.

| Argument | Meaning |
| --- | --- |
| `Component Name` | Catalog name (button, "Button Group") or a registry entry for --blank |

| Option | Meaning |
| --- | --- |
| `--blank` | Scaffold an empty contract instead of installing from the catalog |

Examples:

- `sketchbook add button`
- `sketchbook add Button Group --dry-run`
- `sketchbook add Date Picker --blank`

### remove

Uninstall a component: refuses while another component or a kit needs it, and without --yes when it is team-made or customized; else removes its files, sets the registry to planned and rebuilds.

```
sketchbook remove <Component Name...> [--yes] [--dry-run] [--json]
```

Changes files; supports `--dry-run`.

| Argument | Meaning |
| --- | --- |
| `Component Name` | Installed component (button, "Button Group") |

| Option | Meaning |
| --- | --- |
| `--yes` | Confirm removing a component the catalog cannot bring back as it is (team-made or customized) |

Examples:

- `sketchbook remove badge`
- `sketchbook remove spinner --dry-run`
- `sketchbook remove my-widget --yes`

### list

List catalog components (installed or available) with what each needs, plus template kits (read-only).

```
sketchbook list [--installed] [--available] [--json]
```

Read-only.

| Option | Meaning |
| --- | --- |
| `--installed` | Only installed components (including ones the team made) |
| `--available` | Only catalog components not installed yet |

Examples:

- `sketchbook list`
- `sketchbook list --available`
- `sketchbook list --installed --json`

### kits

Template kits (harness/kits/index.json): list them, add one (its components come from the catalog first) or remove one (--yes when it was edited).

```
sketchbook kits [action] [kit...] [--yes] [--dry-run] [--json]
```

Changes files; supports `--dry-run`.

| Argument | Meaning |
| --- | --- |
| `action` (optional) | list (default) | add | remove |
| `kit` (optional) | Kit id(s), e.g. sign-in settings |

| Option | Meaning |
| --- | --- |
| `--yes` | remove: confirm removing a kit whose files differ from the catalog (your edits are only in git) |

| Subcommand | What it does |
| --- | --- |
| `sketchbook kits list` | See `sketchbook help kits`. |
| `sketchbook kits add` | See `sketchbook help kits`. |
| `sketchbook kits remove` | See `sketchbook help kits`. |

Examples:

- `sketchbook kits list`
- `sketchbook kits add sign-in --dry-run`
- `sketchbook kits remove dashboard`
- `sketchbook kits remove dashboard --yes`

### api

The API vocabulary (spec/api.json): list every component prop, event and state against it (canonical, alias, extension), check that nothing is unregistered, explain one name, show the design-file axes and properties one component gets (figma), or the design-file practices Sketchbook adopted (practices, spec/figma-practices.json).

```
sketchbook api [action] [name] [--json]
```

Read-only.

| Argument | Meaning |
| --- | --- |
| `action` (optional) | list (default) | check | explain |
| `name` (optional) | list: a component; explain: a prop, content or state name; practices: an aspect |

| Subcommand | What it does |
| --- | --- |
| `sketchbook api list` | See `sketchbook help api`. Read-only. |
| `sketchbook api check` | See `sketchbook help api`. Read-only. |
| `sketchbook api explain` | See `sketchbook help api`. Read-only. |
| `sketchbook api figma` | See `sketchbook help api`. Read-only. |
| `sketchbook api practices` | See `sketchbook help api`. Read-only. |

Examples:

- `sketchbook api list`
- `sketchbook api list button`
- `sketchbook api check`
- `sketchbook api explain selected`

## Tokens

### tokens

Change foundations and semantic tokens through the harness: set, preset, presets, diff, impact, add, remove, rename, import, scratch, overrides.

```
sketchbook tokens <subcommand> [args...] [--value <v>] [--light <v>] [--dark <v>] [--type <type>] [--pair <fg:bg>] [--kind <text|large-text|ui>] [--against <ref>] [--from <dtcg|css>] [--name <n>] [--only <semantic|foundation|mapped>] [--min-confidence <0.6>] [--answers <file.json>] [--all] [--yes] [--verbose] [--no-record] [--dry-run] [--json]
```

Changes files; supports `--dry-run`.

| Argument | Meaning |
| --- | --- |
| `subcommand` | set | preset | presets | diff | impact | add | remove | rename | import | scratch | overrides |
| `args` (optional) | The subcommand's arguments (see below) |

| Option | Meaning |
| --- | --- |
| `--value` | add: mode-less value (alias like {space.4}, or a literal) |
| `--light` | add: value for light-role modes |
| `--dark` | add: value for dark-role modes |
| `--type` | add: $type when it cannot be inferred (color, dimension, number, …) |
| `--pair` | add: also declare a contrast pair (fg:bg or fg/bg) in spec/tokens/contrast.json |
| `--kind` | add: kind of the contrast pair (default text) |
| `--against` | diff: git ref to compare with (default HEAD) |
| `--from` | import: source format (default: from the file, .css/.scss is css, .json or a folder is dtcg) |
| `--name` | import: proposal name (default: the file name) |
| `--only` | import apply: only semantic (alias mapped) or only foundation entries |
| `--min-confidence` | import apply: skip entries below this confidence |
| `--answers` | scratch: answers (name, primary, neutral, font, scale, spacing, radius, density, motion, elevation, contrast) |
| `--all` | overrides reset: every override |
| `--yes` | overrides reset --all: confirm without asking; any mutating subcommand: let the brand links overwrite hand-edited linked tokens |
| `--verbose` | impact: list every file reference |
| `--no-record` | Do not propose an SB decision record (each mutating call that changes a file proposes one otherwise) |

| Subcommand | What it does |
| --- | --- |
| `sketchbook tokens set <key> <value>` | Set one value in brand.config.json by dot path (validated against the schema and the catalog); a .preset key replaces its sibling fine overrides. |
| `sketchbook tokens preset <foundation> <id>` | Switch a foundation to a catalog preset. <foundation> is a family (typeScale), its config key (typography.scale) or an area (typography, color, z-index). |
| `sketchbook tokens presets [foundation]` | List the standards catalog (same as sketchbook presets); an area lists each of its families. Read-only. |
| `sketchbook tokens diff [--against <ref>]` | CSS custom properties added, removed and changed per mode: generated/css/tokens.css now vs a git ref (default HEAD). Read-only. |
| `sketchbook tokens impact <token-path \| --css-var>` | What depends on a token: semantic aliases, brand links, contracts (component tokens, contrast pairs), and stories, specs, .storybook and patterns using its CSS variable. Read-only. |
| `sketchbook tokens add <semantic.path> (--value v \| --light v --dark v) [--type t] [--pair fg:bg --kind text\|large-text\|ui]` | Add a semantic token: one mode-less value (--value) or one per mode (--light, --dark; modes by role); optionally a contrast pair. |
| `sketchbook tokens remove <semantic.path>` | Remove a semantic token from every semantic file; refused (with the impact) while anything depends on it. |
| `sketchbook tokens rename <old> <new>` | Rename a semantic token (or group) everywhere: semantic files and aliases, brand links, contracts (tokens, contrast), contrast.json, CSS variables in stories, specs, patterns and .storybook. |
| `sketchbook tokens import <file\|folder> --from dtcg\|css [--name n] \| import apply <proposal> [--only semantic\|foundation\|mapped] [--min-confidence 0.6]` | Parse existing tokens (DTCG / Tokens Studio, one file or a folder of sets, CSS custom properties) into generated/import/<name>.proposal.json with a proposed mapping; "import apply" writes a reviewed proposal into brand.config and the semantic files. |
| `sketchbook tokens scratch [--answers file.json]` | Restart the foundations: a minimal brand.config.json from answers (a JSON file, or questions when interactive; defaults otherwise). The semantic interface is kept. |
| `sketchbook tokens overrides list \| reset <path> \| reset --all [--yes]` | Hand edits kept in spec/tokens/overrides.json: list them, reset one to the generated value (a hand-added token is removed), or reset all (asks unless --yes). |

Examples:

- `sketchbook tokens set typography.family Inter --dry-run`
- `sketchbook tokens impact color.border`
- `sketchbook tokens rename color.muted color.subtle --dry-run`
- `sketchbook tokens import theme.css --from css`
- `sketchbook tokens set typography.family Inter`
- `sketchbook tokens set spacing.preset grid-8 --dry-run`
- `sketchbook tokens set color.primary "#0F766E"`
- `sketchbook tokens preset spacing grid-8 --dry-run`
- `sketchbook tokens preset typography perfect-fourth`
- `sketchbook tokens preset motion material-like`
- `sketchbook tokens presets`
- `sketchbook tokens presets color`
- `sketchbook tokens diff`
- `sketchbook tokens diff --against main`
- `sketchbook tokens impact color.primary`
- `sketchbook tokens impact color.neutral.900`
- `sketchbook tokens add color.highlight --light "{color.neutral.100}" --dark "{color.neutral.800}" --pair color.foreground:color.highlight`
- `sketchbook tokens add space.section --value "{space.16}"`
- `sketchbook tokens remove color.legacy-accent --dry-run`
- `sketchbook tokens rename color.muted color.subtle`
- `sketchbook tokens import tokens.json --from dtcg`
- `sketchbook tokens import theme.css --from css --name brand`
- `sketchbook tokens import apply generated/import/brand.proposal.json --dry-run`
- `sketchbook tokens scratch --dry-run`
- `sketchbook tokens scratch --answers answers.json`
- `sketchbook tokens overrides list`
- `sketchbook tokens overrides reset radius.md`
- `sketchbook tokens overrides reset --all --yes`

### presets

List the standards catalog: families, or one family's presets with sources (read-only).

```
sketchbook presets [family] [--json]
```

Read-only.

| Argument | Meaning |
| --- | --- |
| `family` (optional) | A family id, e.g. spacing, typeScale, motion |

Examples:

- `sketchbook presets`
- `sketchbook presets motion`

### brand

Several brands over one semantic interface: brands/<name>.brand.json; add, list, use (copy into brand.config.json and regenerate) and build (tokens.<brand>.css for each).

```
sketchbook brand [action] [name] [--from <current|brand>] [--yes] [--dry-run] [--json]
```

Changes files; supports `--dry-run`.

| Argument | Meaning |
| --- | --- |
| `action` (optional) | list (default) | add | use | build |
| `name` (optional) | Brand name (lowercase), for add and use |

| Option | Meaning |
| --- | --- |
| `--from` | add: start from brand.config.json (current, default) or another brand |
| `--yes` | use: confirm overwriting brand.config.json edits saved in no brand file, and clearing foundation overrides |

| Subcommand | What it does |
| --- | --- |
| `sketchbook brand add` | See `sketchbook help brand`. |
| `sketchbook brand list` | See `sketchbook help brand`. |
| `sketchbook brand use` | See `sketchbook help brand`. |
| `sketchbook brand build` | See `sketchbook help brand`. |

Examples:

- `sketchbook brand add ocean --from current`
- `sketchbook brand list`
- `sketchbook brand use ocean`
- `sketchbook brand build`

### audit-css

Audit an existing product's CSS: cluster its colors (OKLCH distance), font sizes, spacing, radii and shadows into a foundations proposal (generated/import/codebase.proposal.json).

```
sketchbook audit-css <paths...> [--dry-run] [--json]
```

Changes files; supports `--dry-run`.

| Argument | Meaning |
| --- | --- |
| `paths` | CSS/SCSS files, folders or globs (quote globs), relative to the project |

Examples:

- `sketchbook audit-css ../product/src`
- `sketchbook audit-css "app/**/*.css" --json`

## Design file

### icons

The icons the system uses (spec/icons.json, Lucide): list them, add one or more from Lucide (--category) or remove them. The design adapters draw one component per icon (sketchbook sync icons).

```
sketchbook icons [action] [names...] [--category <category>] [--dry-run] [--json]
```

Changes files; supports `--dry-run`.

| Argument | Meaning |
| --- | --- |
| `action` (optional) | list (default) | add | remove |
| `names` (optional) | Lucide icon names, e.g. chevron-down check |

| Option | Meaning |
| --- | --- |
| `--category` | add: group in the design file (action, navigation, feedback, content, ...) |

| Subcommand | What it does |
| --- | --- |
| `sketchbook icons list` | See `sketchbook help icons`. |
| `sketchbook icons add` | See `sketchbook help icons`. |
| `sketchbook icons remove` | See `sketchbook help icons`. |

Examples:

- `sketchbook icons list`
- `sketchbook icons add chevron-down check --category navigation`
- `sketchbook icons remove star`

### sync

Write the Figma MCP (use_figma) scripts for the design file (tokens: variable collections, modes and styles), read the file back ("sync verify", then "--ingest"), record a push or a component stage with "sync stamp", list the progress of the component docs with "sync progress", or write the design realization of each contract from the library read-back with "sync realize".

```
sketchbook sync [what] [names...] [--verify] [--full] [--detail <combination>] [--url <http://localhost:6006>] [--ingest <file.json>] [--dry-run] [--json]
```

Changes files; supports `--dry-run`.

| Argument | Meaning |
| --- | --- |
| `what` (optional) | tokens (default) | verify | stamp | progress | describe | verify-library | layout | theme-matrix | components | patterns | compare | realize |
| `names` (optional) | After "stamp": tokens|foundations|components, or library|doc|checked|note|clear, then component names (clear takes names only, and removes the note and its fix flag without changing the stage); after "library" or "describe": the components (describe defaults to every drawn one); after "components": one batch id of spec/design-docs.json; after "realize" or "verify-library --ingest": the components (default every drawn one) |

| Option | Meaning |
| --- | --- |
| `--verify` | Same as "sync verify" |
| `--full` | With tokens: write every variable, not only what changed since the last stamp |
| `--detail` | With verify: also return that combination's values (e.g. "Dark \| Round \| Compact") so --ingest names each differing variable. With library: the variant (e.g. "Variant=Primary, Size=Medium, State=Rest, Disabled=False") whose node-by-node bindings its verify script lists when they differ |
| `--url` | With compare: the running Storybook to render the pattern states from (default http://localhost:6006) |
| `--ingest` | With compare: the folder holding what each compare-<id>.js returned (<id>.fg.json); writes docs/design-docs/parity.md. With verify: compare the JSON that verify.js returned with the spec per theme combination and write generated/design/verify.json (read by check D1). With verify-library: record what verify-all.js returned per set in generated/design/library-verify.json (read by sync realize and check D4) |

| Subcommand | What it does |
| --- | --- |
| `sketchbook sync tokens` | See `sketchbook help sync`. |
| `sketchbook sync pages` | See `sketchbook help sync`. |
| `sketchbook sync brand` | See `sketchbook help sync`. |
| `sketchbook sync guide` | See `sketchbook help sync`. |
| `sketchbook sync foundations` | See `sketchbook help sync`. |
| `sketchbook sync icons` | See `sketchbook help sync`. |
| `sketchbook sync library` | See `sketchbook help sync`. |
| `sketchbook sync describe` | See `sketchbook help sync`. |
| `sketchbook sync verify-library` | See `sketchbook help sync`. |
| `sketchbook sync layout` | See `sketchbook help sync`. |
| `sketchbook sync theme-matrix` | See `sketchbook help sync`. |
| `sketchbook sync components` | See `sketchbook help sync`. |
| `sketchbook sync patterns` | See `sketchbook help sync`. |
| `sketchbook sync verify` | See `sketchbook help sync`. |
| `sketchbook sync stamp` | See `sketchbook help sync`. |
| `sketchbook sync progress` | See `sketchbook help sync`. |
| `sketchbook sync realize` | See `sketchbook help sync`. |
| `sketchbook sync compare` | See `sketchbook help sync`. |

Examples:

- `sketchbook sync tokens`
- `sketchbook sync verify`
- `sketchbook sync verify --ingest figma-verify.json`
- `sketchbook sync stamp tokens`
- `sketchbook sync stamp library button`
- `sketchbook sync compare settings --url http://localhost:6006`
- `sketchbook sync compare --ingest generated/design/compare`

### docs

Show a component's or a pattern's documentation, tool-neutral: the same doc a design file draws (variants and states grids, elements, anatomy, accessibility rules and source, tokens) as text, or its blueprint with --json for any design adapter.

```
sketchbook docs <name> [--json]
```

Read-only.

| Argument | Meaning |
| --- | --- |
| `name` | A component folder name (spec/components) or a pattern id (src/patterns) |

Examples:

- `sketchbook docs button`
- `sketchbook docs field --json`
- `sketchbook docs sign-in`

## Quality

### check

Run the deterministic checks (exit 0 pass, 1 fail, 2 pass with flagged overrides).

```
sketchbook check [--only <T1,T6>] [--fix] [--verbose] [--maintainer] [--json]
```

Read-only.

| Option | Meaning |
| --- | --- |
| `--only` | Run a subset of checks by id |
| `--fix` | Rebuild generated outputs first (the only automatic fix) |
| `--verbose` | List every check, not only failures and warnings |
| `--maintainer` | Also require the Storybook and docs site builds to be current (O1) and that every shipped component is documented in every output (M1); maintainers only |

Examples:

- `sketchbook check`
- `sketchbook check --only T6`
- `sketchbook check --maintainer`
- `sketchbook check --json`

### selftest

Run the harness's own tests against the installed engine: they prove every check can still reject and that the CLI, starters and generators work (what npm run test:harness runs in a project).

```
sketchbook selftest [--json]
```

Read-only.

Examples:

- `sketchbook selftest`

### explain

Explain a token, CSS variable, component, tag or decision from the spec.

```
sketchbook explain <thing...> [--json]
```

Read-only.

| Argument | Meaning |
| --- | --- |
| `thing` | Token path, --css-var, component name, tag, SB-NNNN or free text |

Examples:

- `sketchbook explain color.primary`
- `sketchbook explain button`
- `sketchbook explain SB-0024`

## Help

### help

List commands, or show one command's arguments, options and examples.

```
sketchbook help [command] [--json]
```

Read-only.

| Argument | Meaning |
| --- | --- |
| `command` (optional) | A command name |

Examples:

- `sketchbook help`
- `sketchbook help init`
