---
name: design-figma
description: >
  Sync the design system to the Figma file (variables and modes for Mode,
  Shape and Density, text and effect styles, doc pages, library components)
  and read it back; needs the Figma MCP. Trigger: "sync to Figma", "push
  tokens to the design file", "is Figma up to date", "check the design
  file", or after tokens or contracts change.
metadata:
  author: sketchbook
  version: '1.3.0'
  changelog: >
    Shorter description and a pointer to the figma-fidelity rule, which now
    loads by paths: (SB-0114); affects context cost and Figma pattern work.
  auto-invoke: Syncing tokens, docs or components to Figma, or checking the Figma file against the spec
  allowed-tools: [Read, Write, Bash, mcp__plugin_figma_figma__create_session, mcp__plugin_figma_figma__use_figma, mcp__plugin_figma_figma__get_metadata, mcp__plugin_figma_figma__get_screenshot]
---

# design-figma

The design file is an output: it is generated from `spec/` and never edited by hand. This skill runs the scripts `sketchbook sync` writes into the Figma file named in `harness.config.json` (`adapters.design.file`) and reads the file back to verify. What a doc looks like is specified once in `docs/design-docs/` and `spec/design-docs.json`; how variables, collections and modes are laid out, and the rules that keep bindings intact, are in `docs/design-docs/tool-mapping.md` (read it before the first sync).

---

## When to use

Use this skill when:

- Asked to "sync to Figma", "push tokens or variables to the design file", "check the design file" or "is Figma up to date".
- Tokens, contracts or `spec/design-docs.json` changed and the design file must follow.
- Asked to show or prove that the look switches (Mode, Shape, Density).

Do not use this skill for:

- Editing variables, styles or docs in Figma by hand: change the spec and sync.
- Reading a Figma design into code (that is design-to-code, not this sync).

---

## Critical patterns

### 1. Requirements (check first; explain plainly if one is missing)

- The Figma MCP with `use_figma`. Load the `figma:figma-use` skill (and `figma:figma-generate-library` for library work) before the first `use_figma` call; call `create_session` with the file key once per task.
- A file key: `SKETCHBOOK_FIGMA_FILE`, else `adapters.design.file`. The repository ships none; without one, `sketchbook sync` points to the example file to import first. Never write a key into a tracked file on the person's behalf.
- The file must belong to a paid plan: `Semantic - Shape` has 4 modes and `Semantic - Density` 3. A Starter team allows one mode per collection; if `addMode` fails, say so and stop (`docs/research/figma-plans.md`).
- The calls take at most 50,000 characters of code and return at most 48,000 bytes: scripts are generated to fit, verify returns digests.
- Never write to any file other than `adapters.design.file`.

### 2. One script per call, in order, never in parallel

`sketchbook sync tokens` writes `generated/design/figma/variables/NN-<collection>.js` and `styles.js`, only what changed since the last `sync stamp tokens` (`--full` for everything). Pass each file's content verbatim as the `use_figma` code, in file order (later parts alias earlier ones); `sync stamp tokens` after all ran clean. `sketchbook sync pages` writes `pages.js` (page structure from the spec; creates and renames, never deletes). Each returns a report: `errors` must be empty and `extraModes` should be; stop and report on anything else. Never edit a generated script to make it pass: fix the spec or the adapter and regenerate. Library scripts (`sync library`) carry a checksum of their data and refuse to run if a paste differs by one character: copy each file exactly, build scripts first, then `finish`, then `verify` (read-only); do not hand the pasting to a sub-agent, which cannot copy 15 KB reliably. Axis and property names come from the API vocabulary (`spec/api.json`), never from contract text. How a component is built (state axes, optional parts, helper components, nesting, descriptions) follows `spec/figma-practices.json` (`sketchbook api practices`): every drawn 0 is bound to a zero token (SB-0083), and an underlined label is a second text layer on the `-underline` twin style with its own text property, never a decoration on the shared label (SB-0084), and a nested library instance with properties is exposed under its component's title and index (SB-0085), and a content region registered in `spec/api.json` `regions` is a native slot named after it (SB-0086). A component's Figma description is generated from `contract.md`, `contract.json` and the registry (`harness/lib/design/description.mjs`): `finish` sets it, `sketchbook sync describe [components]` rewrites it on sets already drawn, and `verify` compares it. Never write a description in the file; fix the contract and regenerate.

### 3. Upsert only

The scripts create missing collections, modes and variables and update values in place. They never delete. A variable whose type changed is reported, not recreated (deleting unbinds every node that used it). Removing or renaming something in the file is a separate, confirmed step: ask first, name exactly what goes, then do it. Renames go through `sketchbook tokens rename`.

### 4. Ask before structural changes

Pages, page order and deleting nodes are the person's file: say what will change and why, and wait for a yes. Work in small batches, show a screenshot of each result, and keep `docs/design-docs/progress.md` current (`sketchbook sync stamp`, `sketchbook sync progress`).

### 5. Good output is the method, not our file

The person may bring their own file or start from an empty one, so never treat the reference Figma file as the target. A good output is built from the spec through the adapter and proven by read-back: generate, paste exactly, verify, screenshot, stamp. Every review remark is fixed at its source (spec, recipe or runtime), written in the ASCII spec, guarded by a test, regenerated, then applied, and the whole defect class is checked across the file. The method, the quality bar reviews have set (no cropped examples, concentric corners on containers, no repo paths in a shared file, no sync status in the Guide, pages named by role) and worked examples are in `references/working-method.md`: read it before the first Figma job of a session. Patterns and components also follow `.claude/rules/figma-fidelity.md` (Storybook is the reference; compare before stamping `checked`).

---

## Decision tree

```text
Request
  |-- page structure ---------------> sketchbook sync pages --> run pages.js
  |-- tokens changed / first sync? --> sketchbook sync tokens --> run variables/*.js in order, then styles.js
  |                                    --> sketchbook sync stamp tokens --> verify
  |-- "is it up to date?" ----------> sketchbook status (offline stamp), then verify
  |-- verify -----------------------> sketchbook sync verify --> run verify.js (read-only) --> save its JSON
  |                                    --> sketchbook sync verify --ingest <file> --> sketchbook check (D1)
  |-- library sets -----------------> sketchbook sync library <names> --> build, finish, verify --> sync layout
  |-- docs -------------------------> sketchbook sync foundations|guide|theme-matrix|components <batch>
  |                                    --> run in order --> its verify --> screenshot --> stamp doc
  |-- review remark ----------------> references/working-method.md section 4 (fix at the source, guard, regenerate, apply)
```

---

## Commands

```bash
sketchbook sync pages                        # writes generated/design/figma/pages.js
sketchbook sync tokens [--full]              # writes variables/*.js (changed only, or all) and styles.js; prints coverage
sketchbook sync stamp tokens                 # after every script ran without errors
sketchbook sync verify                       # writes generated/design/figma/verify.js (read-only)
sketchbook sync verify --ingest <file.json>  # compares every mode combination with the spec (D1)
sketchbook sync icons                        # writes generated/design/figma/icons/*.js (a first script with one icon to check by eye, then batches)
sketchbook sync library <components>         # writes <name>.build-N.js, <name>.finish.js, <name>.verify.js (names come from spec/api.json); an element set is <component>/<element> (spec/api.json sets), files <component>--<element>.*
sketchbook sync describe [components]        # descriptions-N.js: sets the generated description on sets already on the Library page
sketchbook sync verify-library [components]  # verify-all.js: read-only; every variant's nodes (bindings, styles, visibility, property wiring) against the contract tokens
sketchbook sync verify-library --ingest <file.json>  # records what verify-all.js returned per set (generated/design/library-verify.json)
sketchbook sync realize [components]         # writes realizations.design: sets, coverage, complete only if read back clean and every styled token is drawn or in drift (D4)
sketchbook sync library <name> --detail "<variant>"   # its verify script also lists the differing nodes and fields of that variant
sketchbook api figma <component>             # axes, properties, tokens drawn and tokens the styles use that are not drawn yet
sketchbook docs <component> [--json]         # the component doc, tool-neutral (text, or the blueprint every renderer reads; docs/design-docs/components.md)
sketchbook sync components <batch>           # components-<batch>-N.js (docs on the batch's Components page, checksum-guarded) + components-<batch>-verify.js (read-only); then sync stamp doc
sketchbook sync stamp library|doc|checked <components>
sketchbook sync progress                     # writes docs/design-docs/progress.md
sketchbook check
```

---

## Resources

- `references/working-method.md`: how to build in Figma from the agnostic framework, the quality bar and worked review rounds.
- `references/screenshots/`: the approved output, one image per page plus close-ups of a doc's sections; its README says what to look for.
- `docs/design-docs/tool-mapping.md`: Figma collections, modes, scopes, code syntax and the rules.
- `docs/research/figma-plans.md`: what works on each Figma plan; `docs/research/figma-variables-import.md`: Figma's own export.
- `docs/design-docs/` (README, anatomy, pages, foundations, components, themes): the doc shell.
- `harness/adapters/design/figma/variables.mts`: the variables model and the scripts.
- `harness/lib/design/`: tool-neutral payload, blueprints, stamp, verify and progress.
- `spec/decisions/DECISIONS.md`: SB-0074 (doc shell), SB-0075 (Figma), SB-0076 (file organization).
