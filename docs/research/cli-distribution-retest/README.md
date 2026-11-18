# CLI distribution retest (2026-11-11)

The same three cases as the baseline ([`../cli-distribution-baseline/`](../cli-distribution-baseline/README.md)), run the same way after the work in SB-0097 and SB-0098 (proposed): an empty folder through the packed npm tarball, an existing product repository, and a clone as the control.

- Branch `worktree-cli-distribution-baseline`, commits `7f68dae` to `4af97e7`. Node 26.5.0.
- Every command is in [`results.tsv`](results.tsv) and its full output in [`logs/<id>.log`](logs/). Paths are anonymized (`$REPO`, `$SANDBOX`). [`scripts/`](scripts/) holds the runner and scenario scripts.
- Cases A and B ran the CLI from the tarball (`npm exec --package=<tgz> -- sketchbook …`), as a published package would; inside a created project, its own copy (`npm run sketchbook -- …`). Case C ran a clone's CLI.

## Result

`sketchbook init` now creates a working design-system project from the package alone. In an empty folder it installs the engine, the Claude layer (19 skills and briefs, 11 slash commands, 9 rules, 8 hooks), the git hook, the quality setup and the starter content; runs all 22 checks; installs dependencies and Chromium; and explains what it installed (terminal, `docs/harness.md`, `--json`). Inside that project the everyday commands, the pre-commit gate, typecheck, a real-browser behavior test and the harness suite work. In an existing repository it writes nothing at the root and builds the design system in a subfolder. The clone path works again.

| Case | Baseline | Retest |
|---|---|---|
| A, empty folder | The package crashed on every command; `init` needed 12 hand-copied paths and an npm script | `init` from the tarball: project created, 0 warnings, checks pass; typecheck, 30/30 button behavior tests and the harness suite (162 pass, 0 fail, 34 about the source repo skipped) pass in the project (A28–A33) |
| B, existing product | `init` overwrote the app's `src/index.ts`; P1 failed on the app's CSS | Refused at the root, app untouched; `init --dir design-system` builds it beside the app, checks pass, the app's hooks untouched (B1–B9) |
| C, clone | `init --start blank` failed D3 (33 errors) | Passes all checks; `add button` works (C5–C8) |

## Baseline findings, one by one

| # | Baseline | Now | Evidence |
|---|---|---|---|
| F1 | Package ships 6 files, crashes | Fixed: 815 files (engine, catalog, templates with the lockfile, Claude layer, git hook); every command runs from the tarball | 00-pack, A28, A1, A2 |
| F2 | Engine run-time imports are devDependencies | Fixed: they are dependencies | A1 (runs from the tarball), package.test.mjs |
| F3 | No command creates a project | Fixed: `init` in an empty folder | A3, A29 |
| F4 | Raw ENOENT / crashes outside a project | Fixed: "Not a Sketchbook project" with the init fix | A1 |
| F5 | Dry run promises what the real run cannot do | Fixed: the dry run is the same staged build and checks; nothing written | A2 |
| F6 | `init` not atomic | Fixed for new projects (stage, moved in only when checks pass); `init --start` in an existing project unchanged (simplicity debt, 2026-11-08) | A17 |
| F7 | `upgrade` as installer half-writes | Off the install path (`init` installs); `upgrade` itself unchanged | — |
| F8 | Foundations only from an npm script | Fixed: `init` generates them | A3 |
| F9 | Shared component source only in a clone | Fixed: in the project template | A3, A14 |
| F10 | Schemas live in team-owned `spec/` | Open (shipped through the template; SB-0098 follow-up) | — |
| F11 | Catalog contracts cite this repo's decisions | Worked around: the template carries the pinned decision log (simplicity debt, 2026-11-11) | A6 (X1 passes) |
| F12 | Copied config points at this repo's Figma file | Fixed: neutral config (design off, `catalog.source` false, `harnessVersion`) | A12, B9 |
| F13 | Claude hooks never installed | Fixed: `.claude/settings.json` in every project | A12 |
| F14 | Pre-commit gate inactive | Fixed at a repository root (allowed a good commit, blocked a broken contract); inside another repository deliberately not set, with a warning | A13, B3, B7 |
| F15 | No Storybook / Playwright / TS setup | Fixed: typecheck, behavior tests and the harness suite run in the project | A14–A16, A31–A33 |
| F16 | Claude-layer guard only in this repo's tests | Now check H1 in every project's `npm run check` and pre-commit | A6 |
| F17 | App's `src/index.ts` overwritten | Fixed by design: refuse at the root, `--dir` subfolder | B1, B2, B4 |
| F18–F20 | P1 on app CSS, `.claude/commands` ownership, folder collisions | Avoided by the subfolder; adopt mode is a follow-up | B4, B5 |
| F21, F22 | Upgrade left app files alone; audit-css and tokens import work | Still true | B4, B8 |
| F23, F24 | audit-css body size; `--from` not inferred | Open | — |
| F25 | D3 after `init --start blank` | Fixed (second attempt, see below) | C6, C7 |
| F26 | Clone works otherwise | Still true | C8 |

## Found and fixed during the retest

1. **D3 still failed in the clone (C2, C3).** The first fix matched a removed component by its registry `path`, but `removeComponents` drops the path and keeps only the name. Fixed with the catalog's `kebab()`; the test now removes the component the way `blank` does. (commit `24e9e0d`)
2. **The harness suite failed 7 tests inside a created project (A16).** The project `package.json` had no `sideEffects` or library exports (a bundler would drop every element registration), the template lacked `figma-practices.schema.json` and `THIRD_PARTY_NOTICES.md`, and FG32–FG36 read pattern data from the project instead of the reference project. (commit `37babf5`)
3. **A second fresh `init` could not install dependencies (A19–A21).** `npm install` failed with ETARGET (a transitive range asked for an `@babel/types` version the registry does not have), so the project had no `node_modules` and `check` crashed. A project without a lockfile resolves everything again; a clone installs pinned versions. The template now carries this repo's `package-lock.json` (R1 keeps it equal), with the root entry rewritten for the project; the next fresh `init` installed cleanly (A23). `init` reported the failed install as a warning with its exact fix, as designed. (commit `4af97e7`)
4. **Two source-repo tests ran inside a project (A27):** the A1 practices case and the package-contents test are about this repo and now skip elsewhere. (commit `4af97e7`)
5. `init` printed "Next: cd ." without `--dir`. (commit `37babf5`)

## Still open

- Not verified here: whether Claude Code started at an app's root loads `design-system/.claude/`. `init` tells the person to open Claude Code in the design-system folder.
- The follow-ups in SB-0098: the engine from node_modules, adopt mode, repair on rerun, the schemas out of `spec/`, trimming the inherited decision log, a publishable package name.
- F23 and F24 (small CLI polish).

## F23 and F24 fixed (2026-11-15)

- F23 (`audit-css` body size) and the `tokens import` half of F24 (format inferred from `.css`/`.scss`, `.json` or a folder) were already fixed in `299bcc7` (tests S20b, K25); the table above predates it.
- The `doctor` half of F24 is fixed in this PR: `doctor` exits with the check report code (0 pass, 1 a check fails, 2 pass with overrides). Test S19b.
