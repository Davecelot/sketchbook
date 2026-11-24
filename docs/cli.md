# sketchbook CLI

<!-- GENERATED from harness/cli/commands by npm run build:cli-docs. Do not edit; change the command module. -->

Use the Sketchbook CLI to set up your project, change its sources, and verify the outputs. Run `sketchbook help <command> --details` for the full terminal reference.

## Conventions

- Run `sketchbook` in a terminal to choose a group and command. Commands that change files show a preview where supported. Type `y` and press Enter to confirm, or press Enter to cancel. Without an interactive terminal, bare `sketchbook` prints help.
- Run `sketchbook harness` in a terminal to preview the recommended skills or pick individual items. Without an interactive terminal, it lists the catalog instead.
- `--details` shows full human-readable output where a terminal view is abbreviated.
- `--json` on every command prints one envelope: `{ ok, command, changed[], warnings[], errors[{file, msg, fix}], next, data? }`.
- Exit codes: 0 ok, 1 failed, 2 ok with flags (for example overrides kept in spec/tokens/overrides.json).
- Use `--dry-run` on commands marked as supporting it to review the paths and values that would change.
- Conventions (one registry, introspect before mutate, JSON envelope) are adapted from CLI-Anything (HKUDS, Apache-2.0, https://github.com/HKUDS/CLI-Anything); no code is used.

| Global option | Meaning |
| --- | --- |
| `--json` | Print a structured JSON result |
| `--dry-run` | Preview file changes on supported commands |
| `--help` | Show help for the command |
| `--details` | Show the full terminal output |

## Project

### init

Set up a design system from a starter, or update the setup in an existing project. Choose --agent to add guidance for your coding tools.

```
sketchbook init [--name <value>] [--primary <value>] [--font <value>] [--radius <value>] [--density <value>] [--danger <value>] [--design <value>] [--file <value>] [--prefix <value>] [--start <starter>] [--components <a,b>] [--from <file>] [--yes] [--dir <folder>] [--adopt] [--engine <spec>] [--no-install] [--agent <profiles>] [--with <groups>] [--detach-catalog] [--dry-run] [--json]
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
| `--engine` | For new projects, override the engine dependency with an npm version or tag, a local tarball, or a Git URL. A published CLI uses its version range by default. Relative local paths are resolved from the directory where init starts |
| `--no-install` | New project only: skip npm install and the Chromium download (init lists them as next steps) |
| `--agent` | Install selected agent profiles (comma-separated): claude, codex, gemini, copilot, trae, jetbrains, generic. New projects default to core only |
| `--with` | Select the Claude profile and add optional groups (comma-separated): forge. Forge adds the forge-me-a-skill skill |
| `--detach-catalog` | With --start in the catalog source repo (catalog.source true): stop tracking harness/catalog; the components become the team's own |

Examples:

- `sketchbook init`
- `sketchbook init --agent claude`
- `sketchbook init --agent codex,trae --dry-run`
- `sketchbook init --dir design-system --start library`
- `sketchbook init --start library`
- `sketchbook init --with forge`
- `sketchbook init --start blank --yes`
- `sketchbook init --start pick --components card,button`
- `sketchbook init --start from-codebase --from "../app/**/*.css"`
- `sketchbook init --primary "#2563EB" --font Inter --radius round`
- `sketchbook init --density compact --dry-run`

### harness

Find and install agent skills, rules, and named workflows.

```
sketchbook harness [action] [item...] [--agent <client>] [--dry-run] [--json]
```

Changes files; supports `--dry-run`.

| Argument | Meaning |
| --- | --- |
| `action` (optional) | `list` (default outside the interactive picker), `show`, or `add` |
| `item` (optional) | An ID from `sketchbook harness list`, such as `recommended`, `hammock`, or `rule:contract-first` |

| Option | Meaning |
| --- | --- |
| `--agent` | Show discovery and activation guidance for claude, codex, gemini, copilot, trae, jetbrains, generic, opencode, cursor, windsurf, antigravity, kiro (default: generic) |

| Subcommand | What it does |
| --- | --- |
| `sketchbook harness list [--details]` | Find item IDs. Use `--details` to include integration references. Read-only. |
| `sketchbook harness show <item>` | See the item’s files, dependencies, and setup steps for your client. Read-only. |
| `sketchbook harness add <item...> [--dry-run]` | Install the items you select and their dependencies without activating hooks. Preview new files, updates, and conflicts with `--dry-run`. |

Examples:

- `sketchbook harness list`
- `sketchbook harness show hammock --agent opencode`
- `sketchbook harness add hammock --agent opencode --dry-run`

### status

See your active brand, component counts, token overrides, and design sync status.

```
sketchbook status [--json]
```

Read-only.

Examples:

- `sketchbook status`
- `sketchbook status --json`

### doctor

See what needs attention in your project. Review checks, installed files, agent profiles, and design sync. Uses the same exit codes as sketchbook check.

```
sketchbook doctor [--json]
```

Read-only.

Examples:

- `sketchbook doctor`
- `sketchbook doctor --json`

### upgrade

Update harness-owned files from the installed engine or a newer Sketchbook source. Preview the files with --dry-run. For a folder or Git URL, use --from. Updating from that source requires --yes when files would change.

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

Rebuild outputs after a source change and record the build. Use --maintainer to include Storybook and the Docs site. Run the generated design scripts to carry the change into Figma.

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

Rebuild tokens, styles, and other generated outputs from your project sources. Run npm run generate in an initialized project for the same build.

```
sketchbook generate [--json]
```

Changes files.

Examples:

- `sketchbook generate`
- `sketchbook generate --json`

### prefix

Change the element and CSS prefix across your project, then rebuild and check the outputs.

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

Change the tool that builds tokens or syncs your design file, then rebuild and check.

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

Install a catalog component with its dependencies, or start a new contract with --blank.

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

### approve

Record a person’s approval of a component’s contract and plan, or carry it over a change that leaves the scope as approved. Check C4 verifies it.

```
sketchbook approve [Component Name...] [--by <name>] [--diff] [--carry] [--reason <text>] [--review] [--backfill] [--basis <ref>] [--dry-run] [--json]
```

Changes files; supports `--dry-run`.

| Argument | Meaning |
| --- | --- |
| `Component Name` (optional) | Component with spec/components/<name>/contract.json and plan.md (not with --review or --backfill) |

| Option | Meaning |
| --- | --- |
| `--by` | The person approving (approve, --backfill) or confirming carried approvals (--review) |
| `--diff` | Show what changed since the approval and how the CLI classifies it (none, mechanical, editorial, material). Read-only |
| `--carry` | Carry the approval over a mechanical change, or an editorial one when approval.triage is on. Refuses a material change |
| `--reason` | With --carry: why the approved scope is unchanged (required for an editorial change) |
| `--review` | Show the saved changes for each pending editorial carry. With --by, confirm the batch only if every carry still matches the current scope |
| `--backfill` | Write a record for every plan that has none (needs --by and --basis) |
| `--basis` | With --backfill: what the original approval rests on (for example SB-0011); "Approved under SB-NNNN" or another approved Status line on the plan wins |

Examples:

- `sketchbook approve switch --by "Ana Diaz"`
- `sketchbook approve switch --diff`
- `sketchbook approve switch --carry --reason "Reworded the summary"`
- `sketchbook approve --review`
- `sketchbook approve --review --by Ana`
- `sketchbook approve --backfill --by Ana --basis SB-0011 --dry-run`

### remove

Remove a component you no longer use. Review dependencies and local edits before removing it.

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

Browse installed and available components and see which dependencies they need.

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

Browse template kits, install a kit with its components, or remove one.

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

Look up component property, event, and state names in the shared API vocabulary.

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

Set foundation values, rename semantic tokens, or trace the impact of a change.

```
sketchbook tokens <subcommand> [args...] [--value <v>] [--light <v>] [--dark <v>] [--type <type>] [--pair <fg:bg>] [--kind <text|large-text|ui>] [--against <ref>] [--from <dtcg|css>] [--name <n>] [--only <semantic|foundation|mapped>] [--min-confidence <0.6>] [--map <file>] [--preset <id>] [--out <file>] [--answers <file.json>] [--all] [--yes] [--verbose] [--no-record] [--dry-run] [--json]
```

Changes files; supports `--dry-run`.

| Argument | Meaning |
| --- | --- |
| `subcommand` | rebuild | set | preset | presets | diff | impact | add | remove | rename | rename-plan | import | scratch | overrides |
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
| `--map` | rename: read a JSON list of semantic token renames |
| `--preset` | rename-plan: pick a naming preset from tokens rename-plan |
| `--out` | rename-plan: write the list to this new JSON file |
| `--answers` | scratch: answers (name, primary, neutral, font, scale, spacing, radius, density, motion, elevation, contrast) |
| `--all` | overrides reset: every override |
| `--yes` | overrides reset --all: confirm without asking; any mutating subcommand: let the brand links overwrite hand-edited linked tokens |
| `--verbose` | impact: list every file reference |
| `--no-record` | Do not propose an SB decision record (each mutating call that changes a file proposes one otherwise) |

| Subcommand | What it does |
| --- | --- |
| `sketchbook tokens rebuild` | Rebuild foundations and linked tokens from the current brand, preserving recorded and hand-edited foundation overrides. Review the dry run first. |
| `sketchbook tokens set <key> <value>` | Set one value in brand.config.json by dot path (validated against the schema and the catalog); a .preset key replaces its sibling fine overrides. |
| `sketchbook tokens preset <foundation> <id>` | Switch a foundation to a catalog preset. <foundation> is a family (typeScale), its config key (typography.scale) or an area (typography, color, z-index). |
| `sketchbook tokens presets [foundation]` | List the standards catalog (same as sketchbook presets); an area lists each of its families. Read-only. |
| `sketchbook tokens diff [--against <ref>]` | CSS custom properties added, removed and changed per mode: generated/css/tokens.css now vs a git ref (default HEAD). Read-only. |
| `sketchbook tokens impact <token-path \| --css-var>` | What depends on a token: semantic aliases, brand links, contracts (component tokens, contrast pairs), and stories, specs, .storybook and patterns using its CSS variable. Read-only. |
| `sketchbook tokens add <semantic.path> (--value v \| --light v --dark v) [--type t] [--pair fg:bg --kind text\|large-text\|ui]` | Add a semantic token: one mode-less value (--value) or one per mode (--light, --dark; modes by role); optionally a contrast pair. |
| `sketchbook tokens remove <semantic.path>` | Remove a semantic token from every semantic file; refused (with the impact) while anything depends on it. |
| `sketchbook tokens rename [<old> <new> \| --map <file>] [--dry-run] [--details]` | Rename one semantic token or group, or use --map to rename several tokens together. Updates references and checks the whole change before writing. |
| `sketchbook tokens rename-plan [--preset <id> --out <file>] [--dry-run]` | List naming presets, or write an editable JSON rename list. Does not change tokens or overwrite a file. |
| `sketchbook tokens import <file\|folder> --from dtcg\|css [--name n] \| import apply <proposal> [--only semantic\|foundation\|mapped] [--min-confidence 0.6]` | Parse existing tokens (DTCG / Tokens Studio, one file or a folder of sets, CSS custom properties) into generated/import/<name>.proposal.json with a proposed mapping; "import apply" writes a reviewed proposal into brand.config and the semantic files. |
| `sketchbook tokens scratch [--answers file.json]` | Restart the foundations: a minimal brand.config.json from answers (a JSON file, or questions when interactive; defaults otherwise). The semantic interface is kept. |
| `sketchbook tokens overrides list \| reset <path> \| reset --all [--yes]` | Hand edits kept in spec/tokens/overrides.json: list them, reset one to the generated value (a hand-added token is removed), or reset all (asks unless --yes). |

Examples:

- `sketchbook tokens rename-plan`
- `sketchbook tokens rename-plan --preset on-role-colors --out token-renames.json`
- `sketchbook tokens rename --map token-renames.json --dry-run`
- `sketchbook tokens set typography.family Inter --dry-run`
- `sketchbook tokens impact color.border`
- `sketchbook tokens import theme.css --from css`
- `sketchbook tokens rebuild --dry-run`
- `sketchbook tokens rebuild`
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
- `sketchbook tokens rename --map token-renames.json`
- `sketchbook tokens rename color.muted color.subtle --dry-run`
- `sketchbook tokens import tokens.json --from dtcg`
- `sketchbook tokens import theme.css --from css --name brand`
- `sketchbook tokens import apply generated/import/brand.proposal.json --dry-run`
- `sketchbook tokens scratch --dry-run`
- `sketchbook tokens scratch --answers answers.json`
- `sketchbook tokens overrides list`
- `sketchbook tokens overrides reset radius.md`
- `sketchbook tokens overrides reset --all --yes`

### presets

Browse foundation presets by family, with their values and sources.

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

Add, list, or switch brands that share the same semantic token names.

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

Inspect an existing stylesheet to find recurring values and draft foundation choices.

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

List the icons in your project or add icons from Lucide.

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

Prepare scripts to update or verify your Figma file. Record sync progress after you run the scripts. Use verify to compare a read-back with the spec, stamp to record a push or stage, and realize to write design realizations.

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

Read a component or kit’s variants, tokens, and accessibility guidance. Use --json for the design blueprint.

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

### audit-page

Check a page for a level-one heading and a main landmark. This checks page structure only.

```
sketchbook audit-page <file> [--json]
```

Read-only.

| Argument | Meaning |
| --- | --- |
| `file` | HTML file to check, relative to the current project |

Examples:

- `sketchbook audit-page preview.html`
- `sketchbook audit-page preview.html --json`

### audit-decisions

Compare settled decisions with a trusted earlier copy or Git revision. Run sketchbook check to validate the log.

```
sketchbook audit-decisions [baseline] [--git-ref <ref>] [--json]
```

Read-only.

| Argument | Meaning |
| --- | --- |
| `baseline` (optional) | Path to a trusted earlier copy of spec/decisions/DECISIONS.md |

| Option | Meaning |
| --- | --- |
| `--git-ref` | Compare against the committed log at this Git revision (for example HEAD) |

Examples:

- `sketchbook audit-decisions ../decisions-before.md`
- `sketchbook audit-decisions --git-ref HEAD --json`

### evidence

Record a component’s behavior spec failing (red) and passing (green) with the same test setup. Stub reports which tests pass without the element. Ready requires current green evidence and clean component checks. A test setup failure records nothing.

```
sketchbook evidence <step> <Component Name...> [--dry-run] [--json]
```

Changes files; supports `--dry-run`.

| Argument | Meaning |
| --- | --- |
| `step` | red | green | stub | ready |
| `Component Name` | Component whose contract names realizations.web.spec |

| Subcommand | What it does |
| --- | --- |
| `sketchbook evidence red` | See `sketchbook help evidence`. |
| `sketchbook evidence green` | See `sketchbook help evidence`. |
| `sketchbook evidence stub` | See `sketchbook help evidence`. |
| `sketchbook evidence ready` | See `sketchbook help evidence`. |

Examples:

- `sketchbook evidence red banner`
- `sketchbook evidence green banner --json`
- `sketchbook evidence stub switch`
- `sketchbook evidence ready banner`

### check

Check that your sources and outputs agree. Exit 0 means pass, 1 means a failure, and 2 means pass with flagged overrides.

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

Run the harness test suite to verify the tools that build and check your project.

```
sketchbook selftest [--json]
```

Read-only.

Examples:

- `sketchbook selftest`

### explain

Trace a token to its source, find a component’s files, or look up a decision.

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

Find a command or look up its usage, options, and examples.

```
sketchbook help [command] [subcommand] [--json]
```

Read-only.

| Argument | Meaning |
| --- | --- |
| `command` (optional) | A command name |
| `subcommand` (optional) | A subcommand name |

Examples:

- `sketchbook help`
- `sketchbook help init`
