---
name: foundations
description: >
  The Foundations studio: create, change, import, restart or roast
  foundations (color, type, spacing, radius, elevation, motion, density,
  grid, icons, z-index, contrast, naming) via brand.config.json and
  `sketchbook tokens`. Trigger: "pick a brand color", "change the type
  scale", "make it denser", "import our tokens", "roast our foundations", a
  T6 or F1 failure, or "why is this value like this".
---

# Foundations

Foundations are the raw decisions every component inherits. Here a team makes them its own: the default (a neutral, 4px-based system) is a starting point to edit or redo, never a requirement.

## When to use

Use this skill when:

- The person wants to create, change, import, restart or roast foundations: color, typography, spacing and baseline grid, radius, elevation, motion, density, layout grid and breakpoints, icons, z-index, opacity, border width, contrast, semantic naming.
- A contrast (T6) or foundations (F1) check fails.
- The person asks why a value is what it is, or wants help choosing or comparing token names.

Do not use this skill for:

- Component behavior or API (use `contract-author` or `component-builder`).
- Pages and blocks built from components (use `kits`).
- Syncing the design file (use `design-figma`).
- Hand-editing `spec/tokens/foundation/*` or `generated/**`.

---

## Critical patterns

### 1. The model (say it in these words to beginners)

- **brand.config.json** holds the decisions. Each foundation is either `{ "preset": "<id>" }` from the standards catalog, `{ "custom": … }`, or a preset plus small overrides. Its shape is `spec/schemas/brand-config.schema.json`.
- **Foundation tokens** (`spec/tokens/foundation/*`) are generated from it. Never edit them by hand: an edit there is kept, but as a flagged *override* (see Overrides), not as a decision.
- **Brand links** (`spec/tokens/brand-links.json`) say which semantic tokens follow which foundation (for example `color.primary` follows the brand ramp). They are applied on every regenerate.
- **Semantic tokens** (`spec/tokens/semantic/*`) are the meaning layer (`color.primary`, `space.control.gap`, `motion.duration.fast`). They belong to the team. Components only ever see this layer, so the set of semantic tokens components depend on is the **interface** (`spec/tokens/interface.json`): change values freely, but rename only with `sketchbook tokens rename`.
- Rule: `rule:tokens-through-the-harness`.

### 2. Before any mode

1. `sketchbook status` and read `brand.config.json`: what is installed and which presets are in use.
2. `git status`: if there are uncommitted changes, suggest a commit first (git is the undo button).
3. `sketchbook tokens overrides list`: if overrides exist, mention them; they will survive the change.
4. `sketchbook tokens presets <area>`: the catalog's current ids, labels and sources. The references' Options tables use these ids written as `family: id` (`spacing: grid-8`); the command takes the foundation and the id separately (`sketchbook tokens preset spacing grid-8`). Ids marked "not implemented" are catalogued but refused, and a reference's "Not in the catalog yet" ideas have no id at all: express them with `custom` or `sketchbook tokens set`. The catalog wins over any reference; a guard test (`harness/test/preset-docs.test.mts`) keeps them aligned.

Commands may still be landing; when unsure of an option, run `sketchbook help <cmd>` to confirm it. Every mutating command accepts `--dry-run`: use it first and show the person what will change. The dry run runs the same token checks as the real run, so a dry run that fails means the real run would be refused (and a refused real run writes nothing).

Each mutating `sketchbook tokens` call that changes a file proposes its own SB decision record in `spec/decisions/DECISIONS.md` unless you pass `--no-record` (a call that changes nothing proposes none). A brand-linked semantic token edited by hand makes every token command stop until you choose: delete its entry in `spec/tokens/brand-links.json` to own the value, or re-run with `--yes` to let the link win.

### 3. Roles run from this skill's agents/ folder

The `foundations-critic` and `token-mapper` briefs live in `agents/`. Use them directly or give them and the specified inputs to a separate reviewer with authorization. Follow the brief’s limits regardless of what tools are available. Disclose when a critique is not independent.

### 4. Overrides (the generator keeps hand edits)

A hand edit to a generated foundation token is not lost: the generator keeps it, records it in `spec/tokens/overrides.json`, and `npm run check` exits 2 ("pass with overrides") until it is resolved. Overrides survive later brand changes, which is exactly why they are dangerous: a value that no longer matches its preset. Resolve each one by moving it into brand.config (a `custom` value or a preset change) and then `sketchbook tokens overrides reset <path>`, or keep it deliberately and say why in a decision record. `sketchbook tokens overrides reset --all` drops them all (it asks first).

### 5. Explaining a value

`sketchbook explain <token | --css-var>` traces any value to its foundation, preset and source; translate the answer into plain words.

### 6. Choosing token names

Read [semantic naming](references/semantic-naming.md) for the workflow and the [token naming glossary](references/token-naming-glossary.md) for vocabulary. Start with one real use and offer the shipped name and one or two alternatives; explain where they would mean different things. Follow the team's established vocabulary when it expresses the same intent. If the person only wants advice, compare names without writing anything or running the change workflow.

---

## Decision tree

Pick the mode. Ask only if it is unclear; otherwise infer and say which mode you are in.

| Mode | For | Signal |
| --- | --- | --- |
| `guided` | Beginners; anyone unsure | "help me", "where do I start", no values given |
| `preset` | Pick standards fast | "use an 8px grid", "perfect-fourth scale", a preset id |
| `expert` | Direct values | hex codes, px lists, cubic-beziers |
| `import` | Tokens that already exist | a DTCG / Tokens Studio / CSS file |
| `scratch` | Start the foundations from zero | "start over", "blank", "redo from scratch" |
| `roast` | Challenge the current setup | "roast", "review", "critique", "is this good?" |

Areas and their references (read the one you need, not all):

| Area | Reference | Storybook page |
| --- | --- | --- |
| color | [references/color.md](references/color.md) | `Foundations/Color` |
| typography | [references/typography.md](references/typography.md) | `Foundations/Typography` |
| spacing and baseline grid | [references/spacing-grid.md](references/spacing-grid.md) | `Foundations/Spacing` |
| radius | [references/radius.md](references/radius.md) | `Foundations/Radius` |
| elevation | [references/elevation.md](references/elevation.md) | `Foundations/Elevation` |
| motion | [references/motion.md](references/motion.md) | `Foundations/Motion` |
| density | [references/density.md](references/density.md) | `Foundations/Density` |
| layout grid and breakpoints | [references/layout-grid.md](references/layout-grid.md) | `Foundations/Layout grid` |
| icons | [references/iconography.md](references/iconography.md) | `Foundations/Icons` |
| z-index | [references/z-index.md](references/z-index.md) | `Foundations/Z-index` |
| opacity | [references/opacity.md](references/opacity.md) | `Foundations/Opacity` |
| border width | [references/border-width.md](references/border-width.md) | `Foundations/Border width` |
| contrast | [references/contrast.md](references/contrast.md) | `Foundations/Color` (pairs and ratios) |
| semantic naming | [semantic naming](references/semantic-naming.md) and [token naming glossary](references/token-naming-glossary.md) | every page (semantic tables) |

---

## Modes

### guided

For beginners. One question at a time; never a form.

1. Each question names the decision, gives a **recommended answer and why** in one or two plain sentences, and two or three alternatives. Take the questions from the area's reference ("Decisions to make"), in its order.
2. Default order for a full pass: color → typography → spacing → radius → density → elevation → motion; then offer the rest (layout grid, icons, z-index, opacity, border width) as optional.
3. After each answer, apply it with `--dry-run`, show what changes (in words: "buttons get 4px taller"), then apply for real with `--no-record` (one record per step would bury the session).
4. If a check fails, explain the pair or rule in one sentence and offer the fix the check suggests. Never move on with a failing T6.
5. Ask "anything else?" after each area; stop when the person is done, then write one summary decision record for the whole session (step 5 of "Every session ends with").

### preset

1. `sketchbook tokens presets <area>`; show a short table (id, what it is, when to pick it, source link).
2. Recommend one for their product and say why (from the reference's "Options").
3. `sketchbook tokens preset <area> <id> --dry-run`, then without `--dry-run`.

### expert

1. Take the values as given; check them against the reference's accessibility limits before applying, and say plainly if one breaks a limit (do not refuse; record the risk).
2. `sketchbook tokens set <key> <value>` for single values (`sketchbook tokens set color.primary "#0F766E"`), or edit `brand.config.json` `{ "custom": … }` for a whole scale, then `npm run tokens`.
3. For semantic-only changes (a token's value in one mode), edit `spec/tokens/semantic/<mode>.tokens.json` (team-owned) or use `sketchbook tokens add|remove`.

### import

Bring tokens that already exist: DTCG JSON (a file or a folder of sets) or Tokens Studio export, or a CSS file with custom properties.

1. Use the existing `generated/import/<name>.proposal.json` if setup already created it. Otherwise run `sketchbook tokens import <file> --from dtcg|css` to write the parsed tokens and a proposed mapping onto the semantic interface. Nothing else changes.
2. When mappings are missing or unclear, follow the [token-mapper brief](agents/token-mapper.md) using the proposal path. It writes only an advisory `.mapping.json` under `generated/import/`. Use the glossary to compare meanings, not to substitute words.
3. Review with the person: missing interface matches (the import would not supply a value), ambiguous candidates (ask about real usage), imported tokens with no home (offer `sketchbook tokens add` or skip), contrast of mapped color pairs, and raw values that may belong on a scale.
4. After they agree, reflect the reviewed choices in the original `.proposal.json`; set `"apply": false` for unresolved entries. The CLI does not read `.mapping.json`. Run `sketchbook tokens import apply generated/import/<name>.proposal.json --dry-run`, show the preview and get approval before applying for real.
5. If they also want their vocabulary in the interface, use the separate [rename workflow](references/semantic-naming.md). Importing a value does not rename a token.

### scratch

Start the foundations from zero while keeping every component working.

1. Say what is kept: the semantic interface (`spec/tokens/interface.json`) — every token components and links depend on. What resets: every foundation decision in `brand.config.json`.
2. `sketchbook tokens scratch --dry-run`, then for real. The config is now a blank questionnaire.
3. Run `guided` (or `expert` if they bring values) over every area; T7 fails until every interface token resolves again, which is the to-do list.
4. Renaming interface tokens is a separate, explicit step: `sketchbook tokens rename <old> <new>` (it updates semantic files, contracts, stories, specs and `.storybook`).

### roast

Challenge the current foundations against the standards, with evidence, risks and a recommendation.

1. Follow the [foundations-critic brief](agents/foundations-critic.md) with the area (or "all") and today's date. For an independent critique, pass only those inputs to the reviewer. Read brand.config, the semantic tokens, the references and the checks, then write `docs/foundations-reviews/<YYYY-MM-DD>.md`.
2. While it runs, do not form your own verdict; when it returns, read the report.
3. Present the top findings to the person: what, evidence (file, value, the standard and its source), risk (who gets hurt and how), recommendation (a command). Separate "breaks accessibility" from "a taste call".
4. Offer to fix the ones they accept through `guided`/`preset`/`expert`. Disagreeing with a finding is fine: record why in the decision record.

The roast questions in each reference are the prompts; ask them as questions, not as accusations.

### Every session ends with

1. `sketchbook tokens diff` — the CSS change per mode, in plain words.
2. `sketchbook tokens impact <token>` for each changed semantic token — which components, contracts, stories and specs use it.
3. `sketchbook check` — tokens (T1–T7), foundations follow their standard (F1), generated files fresh (G1). Exit 2 means passing with overrides: list them.
4. The Storybook page: `npm run storybook`, then `Foundations/<Page>` for each area changed (light and dark).
5. A proposed decision record in `spec/decisions/DECISIONS.md` (next free `SB-NNNN`, X1 format, listed in the index under Theme), for example:
   ```
   ### SB-NNNN · YYYY-MM-DD · Spacing moves to an 8px grid
   **Status:** proposed
   **Context:** what prompted the change (roast finding, brand, product need).
   **Decision:** the preset or values chosen, and the command that applied them.
   **Why:** the trade-off accepted, with the standard's source link.
   **Watch out:** impact (components, specs) and any accessibility limit close to the edge.
   ```
   The person changes the status to accepted.
6. Offer to sync the design file: `/sync tokens` (and `sketchbook sync foundations` for the foundations boards), only if Figma is the configured design tool.

---

## Commands

```bash
sketchbook status                                  # what is installed, presets in use
sketchbook tokens overrides list                   # hand edits the generator kept
sketchbook tokens presets <area>                   # catalog ids, labels, sources
sketchbook tokens preset <area> <id> --dry-run     # apply a preset (drop --dry-run for real)
sketchbook tokens set <key> <value>                # one value, e.g. color.primary "#0F766E"
sketchbook tokens add|remove                       # semantic tokens
sketchbook tokens rename <old> <new>               # the only way to rename an interface token
sketchbook tokens import <file> --from dtcg|css
sketchbook tokens import apply generated/import/<name>.proposal.json --dry-run
sketchbook tokens scratch --dry-run                # reset every foundation decision
sketchbook tokens overrides reset <path>           # or --all (asks first)
sketchbook tokens diff                             # CSS change per mode
sketchbook tokens impact <token>                   # who uses a semantic token
sketchbook check                                   # T1-T7, F1, G1; exit 2 = pass with overrides
sketchbook explain <token | --css-var>             # trace a value to its source
sketchbook sync foundations                        # foundations boards (planned)
sketchbook help <cmd>                              # confirm options
npm run tokens                                     # rebuild after editing brand.config.json
npm run storybook                                  # Foundations/<Page>
```

---

## Resources

- `agents/foundations-critic.md`: fresh-context, read-only roast; launched by roast mode and `/roast-foundations`.
- `agents/token-mapper.md`: maps imported names onto the semantic interface and writes a proposal only; launched by import mode and `/import-tokens`.
- `references/*.md`: one per area (table under Decision tree); read the one you need.
- `rule:tokens-through-the-harness`: the rule behind every mode.
- `spec/schemas/brand-config.schema.json`: shape of `brand.config.json`.
