# Harness test plan

Cases listed before the tests are written (rule test-first). Each line names the file that proves it.
Every test works on a temporary copy of the reference project, so it passes on any install (rebranded, renamed,
started blank, with the team's own components or tokens).

## Reference project (`reference.mts`, `helpers.mts`)
Harness tests never read the team's files (`spec/`, `src/`, `docs/`, configs: `harness/manifest.json` "team" and
"shared"). `fixture()` copies a reference project assembled from harness-owned files only, once per test process:
`harness/templates/project/` (a pinned copy of the default project's configs, registry, schemas, decisions and
shared `src/`, `playwright/` and `.storybook` files), `golden/brand.default.json` as brand.config, the semantic and
brand-link templates (through the generator), every catalog component and kit (installed as `add` and `kits add` do),
then a rebuild. Harness parts (`harness`, `.claude`, `scripts`, `.githooks`) come from the install. Tests about the
Sketchbook repo itself (it keeps `catalog.source` true, it is single-brand) run only where `catalog.source` is true and
skip elsewhere. When a catalog contract cites a new decision, add it to the pinned `DECISIONS.md` (X1 fails until then).

**R1** (`starters.test.mts`, source repo only): every skeleton file equals its live counterpart; for `DECISIONS.md`, which
grows with every change, each pinned entry must still appear word for word in the live log. After changing one of
those live files, `npm run test:reference-sync` (`sync-reference.mts`) refreshes the files the skeleton already pins.
`playwright/helpers`, `src/controllers`, `src/mixins` and `src/utils` are pinned whole (installed components and their
specs import any file in them): a live file there that the skeleton lacks fails R1 too, and is copied in by hand.

## Harness build (`build.test.mts`)
The harness is TypeScript compiled in place (`x.mts` -> `x.mjs`, `scripts/build-harness.mjs`, SB-0119).
| # | Case | Expectation |
| --- | --- | --- |
| BH1 | A folder with `lib/a.mts` and a hand-written `lib/b.mjs`; then `a.mts` removed | The generated `.gitignore` lists `/lib/a.mjs` and its declarations `/lib/a.d.mts` only, never `b.mjs`; with no `.mts` left the file is removed |
| BH2 | The source repo's committed `harness/.gitignore`, `scripts/.gitignore` and `.claude/.gitignore` (the Claude hooks) | Each equals the list built from the `.mts` files on disk, and every listed `.mjs` exists (built) |
| BH3 | `npm pack --dry-run` of the source repo | Each `.mts` ships as its compiled `.mjs` (under `harness/` also its `.d.mts`, for projects importing `#harness/*`), and no `.mts` source ships |
| BH4 | A fresh clone: only the build script, the tsconfigs and an `.mts` (no compiled output anywhere) | `node scripts/build-harness.mjs` compiles it, so the script depends on no module it compiles |
| BH6 | An `.mts` importing a hand-written, not yet converted `.mjs` (the migration bridge) | The build compiles and the result runs; the hand-written `.mjs` stays byte for byte; clearing the build cache and rebuilding still emits it |
| BH7 | A fresh clone whose `node_modules` (and its `.tsbuildinfo`) was restored from a previous build, as CI and Vercel caches do | The build still emits every output; it never trusts the build info over the files on disk |
| BH8 | `.mts` files in `.claude/hooks/`, a skill's `hooks/`, a skill's `scripts/` and `.claude/worktrees/` | Only the two hook folders are compiled and listed; another checkout under `worktrees/` never is |
| BH9 | A source checkout builds `lib/a.mts`, then `a.mts` is deleted and `b.mts` added (a rename); a hand-written `keep.mjs` sits beside them | The rebuild removes `a.mjs` and `a.d.mts` (an untracked stale output would be packed and hashed), builds `b.mjs`, and never touches `keep.mjs` |
| BH10 | The build and a compiled entry point run from a folder whose path has a space | The build compiles (it does not silently exit 0), and `isMain` recognises the script node started |
| BH11 | `.githooks/pre-commit` and `pre-push` in a source checkout with nothing compiled yet (a fresh clone, or a pull that removed the tracked `.mjs`) | Both build and run the checks (exit 0 here), never "the engine is not installed" |
| BH5 | `inputsHash` of a folder with `harness/standards/x.mts` beside its compiled `x.mjs` | Equals the hash with the `.mjs` removed, and changes when the `.mts` changes (O1 never depends on `tsc` output) |

## Checks can reject (`checks.test.mts`)
One case per check (T1–T6, C1–C3, A1, R1, M1, G1, W1, X1, P1, H1, H2): break one thing, expect that check to fail. H2: a hand-written `harness/lib/x.mjs` fails; a compiled `.mjs` beside its `.mts`, an allowlisted file and a `.js` under `harness/templates/` pass, and with no `scripts/build-harness.mjs` (a project) the check skips. M1: a beta component with no parity audit, docs site page or example fails only with `maintainer: true`. A1 (`checks.test.mts`): a prop, a variant value, an event and a state key that the pinned `spec/api.json` does not know, and an alias to a canonical name that does not exist. A1 also checks `spec/figma-practices.json`: an aspect that adopts a missing option, or an option that cites a source not listed; and a `spec/api.json` region that prefers something that is not a component.

## Foundations engine (`foundations.test.mts`)
| # | Case | Expectation |
| --- | --- | --- |
| F1 | Golden: the default brand config (`golden/brand.default.json`) with the semantic templates and no components | `tokens.css` equals `golden/tokens.default.css` byte for byte |
| F2 | Every preset of every family in `harness/standards/` resolves | `resolveBrand` with `{ preset }` returns values; the generator turns them into valid tokens (T1) |
| F3 | Unknown preset id, or a ramp method that is only catalogued | Fails loudly, naming the known ids |
| F4 | Legacy (v1) config and the same choices written as presets | Same resolved values |
| F5 | Preset mix: 8 px grid, perfect-fourth scale, material-like motion, compact density, sharp radius, success and warning accents | All checks pass (T6 included); values land in the foundation and the semantic links |
| F6 | `tokens:generate` alone (no `init`) after a brand.config change | Links re-point `color.primary` and the control heights |
| F7 | A link whose semantic token or foundation target is missing | Reported by the generator (and G1 as a warning), never silently skipped |
| F8 | Modes by name: `{ name: "night", role: "dark" }` | The night file is created from the dark template, links use dark steps, checks pass |
| F9 | A hand-added foundation token | Kept after regenerate, recorded in overrides.json (added), check exits 2 |
| F10 | `listOverrides`, `resetOverride(path)`, `resetAll()` | Override listed, then removed and the generated value restored |
| F11 | brand.config edited without regenerating | G1 rejects the stale foundation file with the fix `npm run tokens:generate` |
| F12 | Regenerate reports the overrides it keeps | Result lists kept and added overrides |
| F13 | New roles success, warning, info | Semantic tokens and foregrounds exist in every mode and pass contrast |
| F7b | A color link where no ramp step meets the contrast target (fine target `text: 21`) | Reported as a missing link per token (T7 fails), the preferred step kept, never a silent fallback (SB-0064) |
| F10b | A hand revert of an override to the generated value; a hand-deleted overridden or hand-added token | The override is dropped and reported; a deleted hand-added token does not come back (SB-0063) |
| F14 | Hand edits regenerated with `generated/foundation.snapshot.json` missing | Kept and recorded as overrides (edited and added), the snapshot written again (SB-0063) |

## CLI registry (`cli.test.mts`)
| # | Case | Expectation |
| --- | --- | --- |
| L1 | Every registered command has name, group, summary, args, options, examples, mutates, run | Registry shape |
| L2 | `--json` on every command (`status`, `presets`, `help`, `explain`, `check`, `add --dry-run`, `init --dry-run`, `prefix --dry-run`, `swap --dry-run`, `sync --dry-run`, `sync stamp --dry-run`) | Envelope `{ ok, command, changed[], warnings[], errors[], next }`, exit 0, 1 or 2 |
| L3 | Unknown command or bad option with `--json` | `ok: false`, an error with a fix, exit 1 |
| L4 | `status` | Prefix, brand summary, components by status, overrides count, design sync state |
| L5 | `presets` and `presets motion` | Families, then ids with sources |
| L6 | `--dry-run` writes nothing | Files unchanged after `add`, `init`, `prefix`, `swap` dry runs |
| L7 | `docs/cli.md` | Equals the text generated from the registry (G1 keeps it fresh) |
| L8 | `harness/cli/known-commands.json` (SB-0053) | Equals the text generated from the registry plus `planned-commands.json`; registry commands are not planned; a registry command wins over a planned entry and subcommands are the union |
| L9 | Interactive menu, scripted stdin (SB-0052): group -> read-only command | Runs it at once through dispatch (`status` output shown), `q` quits |
| L10 | Interactive, mutating command | Option prompts show current values from `status`; the dry run runs first; applies only on `y`; required arguments re-asked; bad choices re-asked |
| L11 | Bare `sketchbook` without a TTY, or `--json` | Help (or the help envelope), never the menu |
| L12 | A project command (`status`, `doctor`, `check`, `add`, `explain`, `upgrade`) in a folder without `harness.config.json` | "Not a Sketchbook project" with a `sketchbook init` fix, in the envelope and on stderr; `help`, `presets`, `list`, `audit-css` still run |
| L13 | `generate` after deleting `tokens.css` and staling `src/index.ts` | Both rebuilt from the spec; G1 passes |

## Claude Code guard hooks (`hooks.test.mts`)
| # | Case | Expectation |
| --- | --- | --- |
| H-G1 | `guard-generated` on edits to `generated/**`, foundation tokens, `*.styles.ts`, `src/index.ts`, and on sources | Outputs blocked (exit 2, the source to change named); sources allowed |
| H-D1 | `guard-decisions` on an accepted entry: reword, text appended inside it, removal, a Write that drops it; a new entry before or after it, the index, a proposed entry | Every change to a settled entry blocked; new entries, the index and proposed entries allowed |
| H-O1 | `page-outline` after a write: an `sb-*` page without `<h1>`, without `<main>`, with the `<h1>` only in a comment; `<h1>` inside `sb-card-title`, `role="heading"` + `aria-level="1"` with `role="main"`, a fragment, a page with no `sb-*` element, a non-HTML file | Misses exit 2 naming the axe rule and the fix; the rest exit 0 silently |
| H-L1 | The launcher `.claude/hooks/run.mjs` runs `hooks/guard-generated` (an output edit) and `skills/hammock/hooks/hammock-gate` | The hook reads the tool call from stdin as when called directly: blocked with its message; the gate prints `{}` |
| H-L2 | A source checkout with only the launcher, the build script, the tsconfigs and a hook `.mts` (nothing compiled) | The first call builds once (its report on stderr), runs the hook, and stdout is the hook's own; the second call does not build |
| H-L4 | A compiled hook, then its `.mts` changes and is newer than the `.mjs` (a pull) | The launcher rebuilds before running it, so the new source runs, never the stale output |
| H-L3 | The launcher alone: no compiled hook, no sources | A guard exits 2 (the edit is blocked, never let through) naming the missing hook; any other hook exits 1 like a crash; a name outside the hook folders is refused |

## New project from the CLI (`bootstrap.test.mts`, SB-0097 to SB-0099)
| # | Case | Expectation |
| --- | --- | --- |
| I1 | The installed summary over this repo | Every skill, slash command, rule, hook, check and CLI command, each with an explanation; `docs/harness.md` has one heading per area |
| B1 | `init --start library --no-install` in an empty folder | No `harness/` or `scripts/` (the engine is a devDependency named from its package.json, `#harness/*` maps to it); the Claude layer staged in `move-to-.claude/` with `INSTALL.md`; scripts call `sketchbook`, never engine paths; a publishable library `package.json` and the template lockfile; only the cited default decisions; neutral config; `core.hooksPath` and an executable hook (`doctor` says active); all checks pass |
| B2 | `init` in a folder that already has files | Refused with an `--adopt` fix; nothing written |
| B3 | `init --dir design-system` inside another repository | Only the new folder appears; the app and its `core.hooksPath` are untouched; the warning gives the line for the app's own hook; checks pass |
| B4 | A failing `init` (unknown component) | The folder stays empty; no stage left behind |
| B5 | `init --dry-run` in an empty folder | The same build and checks, reported; nothing written |
| B6 | `init --dir ds --start from-codebase --from styles/app.css` | `--from` is read from the folder init started in |
| B7 | `init --primary …` in an existing project | Today's behavior (no bootstrap) |
| B8 | Human output after `init` | Names the step left for Claude: install the layer from `move-to-.claude/` |
| B9 | H1 and `doctor` while the layer is staged, then installed | Staged: checked in place, a warning, `doctor` says staged; installed: no warning |
| B10 | `init` again after deleting three files and editing one | The three come back, the edited one is reported and kept; `--dry-run` writes nothing |
| B10d | `init` again in a project whose `settings.json` calls each Sketchbook hook directly (from before the launcher, SB-0119), plus a team hook | Each is replaced in place by the launcher command for the same script (reported as replacing it), none is added twice, the team hook stays |
| B10c | `init` again in a project whose `prettier.config` and `.storybook/main`, `preview` are still `.js` | The `.js` files stay; their `.ts` template copies are not added, so only one config exists |
| B11 | `init --adopt` in an app repository | `design-system/` is created; the app gets one `design-system:check` script in its own indentation, nothing else; its hooks stay |
| B12 | `blank`, then `add button` | The log starts empty and names the first team id; the button's cited decisions are copied in; X1 passes |
| B13 | `proposeDecision` in a project | Numbered after every default decision |
| B14 | `init --adopt` with a one-line app `package.json` | Only the script is inserted, as text; every other byte stays |
| B15 | A team `.claude/` next to `move-to-.claude/`; the engine package.json | `doctor`, H1 and the summary follow the staged layer; no `prepare` script (it would change the hooks of a consumer app repository) |
| B16 | `init --start library+kits --no-install`, the engine copied from its `npm pack` file list into `node_modules`, every other dependency linked from this checkout | `npm run lint -- --max-warnings 0` and `npm run typecheck` pass: the staged `move-to-.claude/` is not linted, and the packed `harness/*.d.mts` type the project's `#harness/*` imports |
| U1 | `upgrade` (no `--from`) in a project without `harness/` | Missing harness-owned files added, changed ones replaced from the installed engine; no engine copy |

## Font source (`fonts.test.mts`, SB-0050)
| # | Case | Expectation |
| --- | --- | --- |
| F-none | Default config, or `typography.source.kind: none` | `fonts.css` is comments only |
| F-google | `kind: google` (family from `typography.family`, weights from the scale; custom family, weights, display, mono) | One `@import` of the css2 URL with `display=swap`; a generic family fails |
| F-url | `kind: url` | `@import url(...)`; missing url fails |
| F-local | `kind: local` with `files` or one variable `path` | One `@font-face` per file with format, weight, style, `font-display`; none listed fails |
| F-G1 | Source changed without rebuilding | G1 rejects `generated/css/fonts.css`; after `tokens:build` it passes and `tokens.css` is unchanged |

## Design sync (`design.test.mts`)
| # | Case | Expectation |
| --- | --- | --- |
| FG1 | Variables model | Layer - Domain collections in order, only primitives hidden, unique names, semantic colors grouped by role, every token once, nothing skipped, every spec token covered (variable, text style or effect style), every style field bound |
| FG2 | Round trip | Every part pushed into a mock file; a second push creates nothing; a snapshot yields no parts and one change yields one; the model equals the spec for every combination; the file digests equal the model; a drift is located per combination and, with a detail, per variable |
| FG3 | Value comparison | Colors, numbers (px, ms, em) and cubic-béziers are normalized before comparing |
| FG4 | CLI | `sync verify` writes `verify.js`; `--ingest` writes `verify.json`, which D1 reads |
| FG5 | Generic planner | Every contract gets a plan, and each binding is one of its own tokens |
| FG6 | Verify per combination | A read-back built from the spec is clean; one drifted value is named by its combination |
| FG8 | Docs | Every token the doc shell names is a Figma variable; every text role has a `Text/*` style |
| FG29 | Doc shell | The Doc radius resolves to the Header radius plus the Top inset (concentric corners); the header line is the shell label, not a repo path; the Guide's Sync status reads "Last token sync: <date> UTC" (or "never") |
| FG28 | No cropped examples | The library verify reports a variant whose content is larger than its frame; the Pagination root hugs its links (no fixed 320 width); the ScrollArea Content slot grows and stretches to fill its viewport |
| FG30 | Pattern docs | Each state of a pattern.json layout is one screen in its doc, components resolve to library variants (an unknown axis or value is refused), the draw script is checksum-guarded and under the paste limit, the read-back counts the instances inside a Card slot |
| FG31 | Pattern parity | The Storybook-to-file text diff reports missing and extra texts, judges a box by the edge that matches its alignment, pairs duplicate texts by position, and counts reading order only across rows |
| FG32 | Pattern runtime | Joined groups re-round outer corners, mirror under Direction, percentages, rules, fill height and the align values are in the draw runtime |
| FG27 | Component doc highlight and text view | The Rule column is `accent`, the source carries `marks` on `role` and `aria-*` (not on a variable named `aria` or the word `variant`); `docText` renders the grids (`[x]`, `n/a`), the highlight on rules and source; `sketchbook docs button --json` serves the same blueprint |
| FG26 | Component docs | Button: Variants 6x8 at Rest with 4 excluded Link icon cells, States Rest/Hover/Focus/Loading/Disabled, every cell a Button variant name; Input has only States; Field lists its 4 element sets; Accessibility is a table then the source members that set accessibility (not the variant property or the click handler); Card has no code; batch 0 pastes stay under 50,000 characters, are checksum-guarded, use the design code font, a frameless tree and pill padX |
| FG25 | Theme matrix | A Live column plus every axis at its two ends (8 corners), one row per drawn set with its representative variants (Button: 6 variants at Rest; Input: 1; Checkbox: unselected and selected); the pastes cover every row once, stay under 50,000 characters, pin each axis collection per cell, bind zeros and are checksum-guarded; a read-back checks the pins |
| FG24 | Native slots | Every `spec/api.json` region is drawn as a slot named after it, never the top layer, with nothing inside bound to a property or exposed; finish adds one SLOT property per set with its preferred components (Card Footer prefers Button), verify expects a SLOT layer wired by slotContentId, the description lists the slots, parity explains slot layers |
| FG23 | Exposed nested instances | A nested library instance whose component has properties is exposed and named `<Title> <n>` (ToggleGroup, ButtonGroupSeparator); one without properties (Spinner in Button) keeps its name and stays closed; the packed build data carries the exposure, verify expects it, parity needs no layer entry |
| FG22 | Underlined text | Every text role has an underlined twin style (own variables, UNDERLINE); a variant with its own underline offset (Button and Badge link) draws a second label on the twin style with its own text property, visible on hover; verify expects the decoration |
| FG21 | Zero steps | A semantic zero per kind (space.none, radius.square, border-width.none, opacity.none); every generated script (library build, finish and layout, docs, icons) binds the zero paddings, gaps, corners and unused stroke sides it drew; verify reports a zero left unbound |
| FG20 | Design realization | `sync verify-library --ingest` records each set's read-back with its contract hash; `sync realize` writes realizations.design (sets, coverage, status complete only when read back clean and every styled token is drawn or in drift); check D4 rejects unread, stale, undrawn-without-drift and drift on a drawn token |
| FG19 | Element sets | spec/api.json `sets` adds an element drawn as its own set (`field/field-set`) after its component in every drawn list; it binds only its component's tokens, is named after its element, and the Field family leaves no styled token undrawn; an unknown element is refused (A1 too) |
| FG18 | Focus ring | A focused variant has one ring layer (absolute, outside stroke) built from the ring tokens that replaces the shadow; fields take the ring color as border (contract states.borderColor); an invalid one mixes the error color to 20% |
| FG17 | Disabled look | Disabled dims what the styles dim: only the control of Input, Textarea, NativeSelect and Slider, and the label of a Label (never the description or error) |
| FG16 | RadioGroup and ToggleGroup | A focus state with one ring on the selected radio; items dimmed one by one; the toggle bar has no group gap (spacing 0 joins the items) and square inner corners per position and orientation |
| FG15 | Checkbox and Switch | `control` wraps `input`; disabled dims only the box (and thumb) and the label, as the styles do; every layer is an anatomy part or registered in `spec/api.json` layers |
| FG14 | Script guards | Every generated finish, verify and describe script passes its own checksum guard (a guard that the generator's sum does not match would refuse a correct paste) |
| FG13 | Repeating parts | A part registered under `parts` (Slider thumb, repeats per value) is drawn as a hidden extra that a boolean property shows; the variant count does not change; other components get none |
| FG12 | Figma/code parity | Every token the library model binds is a CSS variable the component's styles use (nothing is drawn that Storybook does not style); `sketchbook api figma <component>` lists the styled tokens that are not drawn yet |
| FG11 | Library verify | Every variant of every component has well-formed expected node lines (type, visibility, bound variables, styles, property wiring); the verify script passes on a matching mock page and names the node and field of a drifted binding |
| FG10 | Descriptions | Every component's Figma description is generated from contract.json and contract.md (sectioned, bounded, deterministic, no angle brackets); a Behavior edit makes the design stamp stale, other prose does not |
| FG9 | Library model | Every catalog contract yields a grid; each binding is a token of its own contract; Button 220, Input 6, Checkbox 18, Switch 24, Toggle 48, ToggleGroup 24, RadioGroup 4, Spinner 1; Button's axes are the registry's names |
| FG7 | Progress register | Stages move one step at a time, unknown names are refused, notes clear on check, the list is deterministic |


## Starting points: catalog, starters, kits, brands, upgrades (`starters.test.mts`)
| # | Case | Expectation |
| --- | --- | --- |
| S1 | `npm run catalog:build` output | One manifest per beta component (35) listing contract, code (no `.styles.ts`), specs and parity audits, with `dependsOn` (contract) and `uses` (other components its stories/specs render); every blob is named by the hash of its content; G1 passes |
| S2 | G1 catalog freshness | Editing a catalogued component's file (catalog source repo) makes G1 fail with the fix `npm run catalog:build`; after `init --start` (team project) the same edit passes |
| S3 | `init --start blank --yes --detach-catalog` | 0 components and 0 kits installed, registry all planned, `src/index.ts` exports nothing, every check passes, `harness.config.json` records the starter |
| S4 | `init --start blank` without `--yes` | Refuses (exit 1) naming what it would remove; nothing written |
| S5 | `init --start library` | 35 components installed, kits removed; `library+kits` installs every kit in `harness/kits/index.json` |
| S6 | `init --start pick --components card,button` | card, button and their dependencies (spinner) installed, nothing else; checks pass |
| S7 | `add button` into a blank project | Contract, code, stories, behavior spec and parity audit back from the catalog with spinner first; registry beta; C1–C3, P1, R1, T2, T4 pass |
| S8 | `add` with project prefix `acme` | Copied files use `acme-button`, `--acme-*`, `AcmeButton`; no `sb-` left; checks pass |
| S9 | `remove spinner` while button is installed; `remove button` while a kit uses it | Refused (exit 1), naming the dependents; nothing removed |
| S10 | `remove badge` | Files gone, registry planned, barrel rebuilt, checks pass; `list --installed` / `--available` reflect it |
| S11 | `add <name> --blank` and `add` of a registry entry outside the catalog | Today's scaffold (contract draft, proposed decision) |
| S12 | `kits list|add|remove` against the index | List shows installed flags; remove drops `src/patterns/<kit>` and its spec; add brings it back with its components; K1 passes in both states |
| S13 | Starter with a foundations patch (fixture starter) | Patch merged into brand.config.json, foundation regenerated |
| S14 | No `brands/` folder | `brand build` writes nothing; tokens.css byte-identical |
| S15 | `brand add ocean --from current`, edit its primary, `brand add forest`, `brand build` | `tokens.ocean.css` and `tokens.forest.css` with the same variable names as tokens.css; `brands.css` scoped under `[data-brand="<name>"]`; G1 passes; T6 reports pairs per brand and rejects a brand with an unreadable primary |
| S16 | `brand use ocean` | brand.config.json takes the brand, foundation regenerated, checks pass |
| S17 | `upgrade --from <copy> --dry-run` where the copy changed a harness file and a team file | Lists only the harness file as an update, lists the team file as a team-owned difference, writes nothing |
| S18 | `upgrade --from <copy>` | Harness file written, team file untouched, `harnessVersion` recorded, checks run |
| S19 | `doctor --json` | Envelope data: starter, harnessVersion, components {installed, available, customized}, kits, brands, overrides, design, checks {failing} |
| S20 | `audit-css <fixture.css>` | `generated/import/codebase.proposal.json` with colors clustered by OKLCH distance (near-duplicates merged, counts summed), font sizes in px, spacing base guessed, radii and shadows listed; same input gives the same bytes |
| S19b | `doctor` with a broken contract | Exits 1 like `check` (0 pass, 2 pass with overrides) |
| S20b | `audit-css` on a sheet with `body { font-size: 16px }`; on one with three single-use sizes | The body rule wins; a tie goes to the size closest to 16px |
| S21 | `init --start import` / `from-codebase --from <css>` | import prints or runs the tokens import; from-codebase writes the proposal |


## Commands that could lose work (`safety.test.mts`, SB-0059 to SB-0062, SB-0070 to SB-0072)

| Case | Input | Expected |
| --- | --- | --- |
| S22 | `remove` a customized and a team-made component | Refused without `--yes`, listed in `--dry-run`; with `--yes` removed and `next` only promises `add` when the catalog can restore it |
| S23 | `kits remove` an edited kit | Refused without `--yes`; with it removed, interface rebuilt, every check (G1 included) passes |
| S24 | `init --start` in the catalog source repo, with `--yes`, then `--detach-catalog` | `catalog.source` stays true (also with `--yes`); only `--detach-catalog` turns it off, with the loud warning, and rewrites `catalog.note` (SB-0071) |
| S25 | `prefix acme` with `catalog.source` true | Catalog rebuilt on the new prefix; a differing catalog prefix fails G1 |
| S26 | `prefix aria` / a word already used as `<word>-` | Refused, nothing renamed |
| S27 | Tampered blob, stray unit, edited index | G1 flags each |
| S28 | Manifest path `../`, path outside the unit, bad hash, tampered blob, kit path `.`, kit id with a path | Refused; nothing written or deleted |
| S29 | A unit whose stylesheet does not compile; a damaged dependency | Rolled back: no files, registry and barrel unchanged |
| S30 | `tokens rename color.primary color.main`, `renames.json`, then `add button` | Contract names `{color.main}`; every check passes; not reported customized |
| S30b | `planRename color.primary color.main` on the reference project; each rewritten contract, story, spec and style | `applyRenames` on the original text gives the same result (one set of text rules: `renameJsonText`, `renameCodeText`) |
| S31 | Upstream manifest claims `brand.config.json` and `.claude/**`; git URL | Not overwritten (listed); settings and the manifest never written (protected); a git URL, or a folder that would write, needs `--yes` and writes nothing without it (SB-0116); dry run prints the commit |
| S32 | `brand use` with an invalid brand, unsaved edits, overrides | Validated before writing; refused without `--yes`; `--yes` clears overrides, checks pass |
| S33 | `catalog:build` after `init --start blank --yes --detach-catalog` | No-op: catalog unchanged, `add button` works |
| S34 | The reference project built in a folder holding only the harness-owned parts (no `spec/`, `src/`, `docs/`, configs) | Built; 35 components and every kit; every check passes |
| S35 | `init --start blank --yes --detach-catalog`, and `--start library --yes --detach-catalog`, on a project copy, then the tests that read the team's files before (golden, catalog snapshot, interface, design sync, prefix, templates, repo-only) | All pass (repo-only ones skip once the catalog is detached) |
| S36 | Upstream manifest claims `brand.config.json`, `package.json` and `spec/**` and changes them; upgrade twice; then both manifests claim `package.json` | Neither file nor `harness/manifest.json` is ever written; the manifest's glob differences are reported (`data.manifest`); pinned files stay protected even when both agree (SB-0070) |
| S37 | `init --start blank --primary #ff0000` (no `--yes`); `--prefix acme --primary red`; a hand-edited linked token, then `init --primary`, `init --start library+kits --font`, a starter with a foundations patch | Each exits 1 with `git status` clean; the dry run lists `staleLinks`; with `--yes` the link wins (SB-0071) |
| S38 | `upgrade()` in a folder with a manifest but no `harness.config.json` | Refused before anything is written (baseline F7) |
| S39 | A malformed `harness.config.json`, then `init --start blank --yes`; a malformed `brand.config.json`, then `brand use <saved>` (no `--yes`); `tokens import <file> --name ../escape` | Each exits 1 naming the problem; nothing is half applied (no component removed), `brand.config.json` stays byte-identical until `--yes` replaces it; the traversal name writes nothing |

## Token CLI (`tokens.test.mts`)
Every mutating subcommand runs: plan → (dry run: stop and report) → write → regenerate → links → build → interface → checks T1–T7, G1, F1; it prints a per-mode CSS diff and the impact, and proposes an SB decision unless `--no-record`.
| # | Case | Expectation |
| --- | --- | --- |
| K1 | `tokens` is one registry command with subcommands; `help tokens` lists each | Registry shape; each subcommand has summary, args, options, examples, mutates |
| K2 | `--json` envelope on every subcommand (`set`, `preset`, `presets`, `diff`, `impact`, `add`, `remove`, `rename`, `import`, `import apply`, `scratch`, `overrides list`) | `{ ok, command: "tokens", changed[], warnings[], errors[], next }`, exit 0 |
| K3 | `--dry-run` on every mutating subcommand | No file under the fixture changes; the envelope lists what would change and the CSS diff |
| K4 | `tokens set typography.family Inter`, `tokens set spacing.preset grid-8` | brand.config updated (a `.preset` replaces its sibling fine keys, reported); CSS diff shows the changed variables; checks pass; a proposed SB record is added (none with `--no-record`) |
| K5 | `tokens set` with a value the schema or catalog rejects (`color.primary blue`, `motion.preset nope`), a partial custom scale (`radius.custom.lg 12`) or a role on a missing step (`z.roles '{"toast":"600"}'`: a brand link could not follow) | Exit 1, nothing written, the error names the fix |
| K6 | `tokens preset spacing grid-8`, `tokens preset typography perfect-fourth` (area alias), `tokens presets color` | Family resolved from the area; config key set to `{ preset }`; presets lists the families of an area |
| K7 | `tokens diff` in a git fixture after a change | Per mode: added, removed, changed CSS custom properties vs HEAD; read-only |
| K8 | `tokens impact color.primary`, `tokens impact --sb-color-border`, `tokens impact color.neutral.900` | Semantic aliases, brand links, contracts (component tokens and contrast pairs), stories/specs/.storybook/patterns files |
| K9 | `tokens add color.highlight --light … --dark … --pair color.foreground:color.highlight --kind ui`, `tokens add space.probe --value {space.4}` | Token in every mode (or base), pair in contrast.json, checks pass |
| K10 | `tokens add` an existing path; `tokens remove color.primary` (used) | Refused with the impact; nothing written |
| K11 | `tokens remove` an unused token | Removed from every semantic file; checks pass |
| K12 | Rename end to end: `tokens rename color.muted color.subtle` | Semantic files, aliases, brand links, contracts (tokens and contrast), contrast.json, stories, specs, patterns and `.storybook` updated; no `--sb-color-muted` left; T7 and every check pass |
| K13 | `tokens import` the fixtures (Tokens Studio DTCG, a shadcn-style CSS theme) | `generated/import/<name>.proposal.json` with tokens, mapping (from, to, confidence, reason) and unmapped; core roles (background, foreground, primary, destructive, border, ring) mapped |
| K14 | `tokens import apply <proposal>` (CSS fixture) | brand.config (primary, font, radius) and semantic values written; interface tokens never deleted; checks run |
| K15 | `tokens scratch --answers a.json` | Minimal brand.config from the answers; semantic interface kept; checks pass |
| K16 | `tokens overrides list`, `reset <path>`, `reset --all --yes` | Lists, then resets the hand edit (the generator's value is back) |
| K17 | `spec/tokens/interface.json` | Equals a fresh computation (`npm run generate`); lists tokens used by contracts, brand links, contrast pairs, stories, specs, `.storybook` and patterns |
| K18 | Every implemented preset of every family (catalog order), each applied on the shipped config with `planPreset` + `runPlan`, including the help example `tokens preset motion material-like` (SB-0058) | None refused; no link warning; T1–T7, G1 and F1 have no errors (F1 warnings allowed); motion and z presets re-point `motion.*` and `layer.*` to their own role steps; `semanticRoles` is the only family without a brand.config key |
| K19 | `parseValue` and `tokens set color.neutral '{"hue":250,"chroma":0.02}'` | A flat JSON object or array is parsed as JSON; only a bare `{dot.path}` stays a token alias string; invalid JSON is refused with a fix |
| K12b | `tokens rename color.muted font.line-height.heading.1`, `tokens add font.line-height.heading.1` (its CSS variable is taken); rename or add onto paths the generator can make under any preset (`color.brand`, `color.green.*`, `color.brand.*`, `space.32`) | Refused naming the variable or the reserved path; nothing written (SB-0065) |
| K12 (log) | `tokens rename color.muted color.subtle` | `spec/tokens/renames.json` gains `{ from, to, date }` (created with its `$description`) (SB-0066) |
| K20 | A change the token checks reject (a contrast pair below target), dry run then real run in a git fixture; `--type size`; an alias to no token; a literal invalid for its type | The dry run is `ok: false` with the check errors; the real run exits 1, `changed` is empty, `git status` is clean and no record is proposed; the rest are refused before staging with the reason (SB-0065) |
| K21 | A brand-linked token edited by hand, then any mutating token command | Refused (nothing written), naming the token and the two ways out; with `--yes` the link wins; `data.links.changed` and `data.overrides` (kept, added, dropped) always reported (SB-0065) |
| K22 | The same `tokens set` twice | First: `changed` lists exact files (snapshot included, no globs, no unchanged files) and one record; second: `changed` empty, no record (SB-0065) |
| K23 | `__proto__`, `prototype`, `constructor` as a key or path segment in set, add, remove, rename | Refused; `Object.prototype` untouched (SB-0065) |
| K24 | `tokens add` while (test seam `stageHooks.beforeCopyBack`) a new `docs/team-notes.md` is saved and `Badge.ts` edited; then `generated/css/tokens.css` edited mid-run; then a target made read-only | The new file and the edit survive and the command applies; a changed target refuses (exit 1, `data.conflict`, only the mid-run edit in `git status`); a failed copy-back restores every file (SB-0070) |
| K25 | `tokens import app.css`, `tokens import tokens.json` without `--from`; `tokens.txt` | The format comes from the file; an unknown one still asks for `--from` |

## Checks T7 and F1 (`checks.test.mts`)
| # | Case | Expectation |
| --- | --- | --- |
| T1b | Two token paths that build one CSS variable (`font.line-height.heading.1` next to `font.line-height.heading-1`) | T1 fails naming both and the variable (SB-0064) |
| G1b | Missing `src/index.ts`, `docs/cli.md`, `known-commands.json` (harness here) or `*.styles.ts`; an orphan `*.styles.ts`; a foundation file the generator does not make; `tokens.<x>.css` or `brands.css` with no brand | G1 fails for each (SB-0063) |
| G1c | `generated/foundation.snapshot.json` missing or not equal to `generate(brand)` | G1 fails (SB-0063) |
| T7d | `spec/tokens/renames.json` with an entry lacking token paths or a date, or invalid JSON | T7 fails (SB-0066) |
| T6b | A brand link's `alsoOn` surface the token does not reach the text target on | T6 fails with the pair sourced from `brand-links.json` (SB-0064) |
| T7a | An interface token deleted from one mode file | T7 fails naming the token and mode |
| T7b | A brand link whose semantic token is gone | T7 fails (G1 only warns) |
| T7c | A story, spec, `.storybook` file or pattern CSS using `var(--sb-nope)` | T7 fails naming the file and line |
| F1a | Default config | F1 passes with no warnings |
| F1b | Perfect-fourth scale (10px xs used by `font.size.control-xs`), body line-height 1.2, a spacing step off the grid, contrast targets below AA, motion without `prefers-reduced-motion` | F1 warns for each with a fix; never an error |
