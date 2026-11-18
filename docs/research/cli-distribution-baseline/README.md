# CLI distribution baseline (2026-11-11)

What happens today when someone gets the harness from the CLI instead of forking the repo, in an empty folder and in an existing product repo, with a clone as the control. Evidence for the plan in SB-0097 (one `sketchbook init` installs the whole harness).

- Base: `feat/sketchbook` at `0620d25`, Node 26.5.0. Nothing in the repo was changed to run these tests.
- Every command is in [`results.tsv`](results.tsv) (id, exit code, command) and its full output in [`logs/<id>.log`](logs/). Paths are anonymized: `$REPO` is the checkout, `$SANDBOX` the throwaway folder.
- [`scripts/`](scripts/) holds the runner (`t.sh`) and the scenario scripts. Set `SANDBOX`, `REPO` and `REPO_NODE_MODULES` to rerun.
- The CLI ran first from the packed npm tarball (what a published package gives). Because that crashes, it then ran from this repo's `harness/cli.mjs` against the sandbox (what a fixed package would give). The only non-CLI steps are the ones no command covers; each is named below.

## Cases

| Case | Folder | Path tried | Outcome |
|---|---|---|---|
| A, empty folder | `a-empty-npx`, `a-empty-engine` | tarball, then the full engine, then `upgrade --from` as installer, then the smallest hand-copied skeleton | `init --start library` passes only after the manifest, 12 hand-copied paths and one npm-script step (A18) |
| B, existing product | `b-used`: `package.json`, `src/index.ts`, `src/styles/app.css`, `.claude/settings.json` with a team hook, `.claude/commands/deploy.md`, `CLAUDE.md`, `docs/`, committed | the same path as A, then `init --start from-codebase` | `init` completes, but overwrites the app's `src/index.ts`, and check P1 fails on the app's own CSS (B12–B15) |
| C, clone (control) | `c-clone` | `git clone`, `init --start blank` | Fails D3 with 33 errors (C3, C8); everything else works |

## Findings

Severity: **blocker** (the path cannot work), **high** (loses work, or the harness is silently weaker), **medium**, **low**.

### Packaging

| # | Severity | Finding | Evidence |
|---|---|---|---|
| F1 | blocker | The npm package ships 6 files (`harness/cli.mjs` but none of its imports). Every command crashes with `ERR_MODULE_NOT_FOUND` for `harness/cli/run.mjs`. | 00-pack, A1, A2, B1 |
| F2 | blocker | The engine imports `postcss`, `postcss-scss`, `style-dictionary`, `sass`, `typescript`, `lucide-static` and `playwright` at run time; all are `devDependencies`, so a consumer install does not get them. A copied engine crashes on `postcss`. | A9, A10 |

### Starting a project

| # | Severity | Finding | Evidence |
|---|---|---|---|
| F3 | high | No command creates a project. `init` needs these paths to exist before it can run, found one at a time: `harness.config.json`, `brand.config.json`, `spec/registry.json`, `spec/tokens/semantic/*` and `spec/tokens/brand-links.json` (templates exist in `harness/templates`), `spec/tokens/contrast.json`, `spec/schemas/*` (3 read), `spec/decisions/DECISIONS.md`, and the shared source `src/styles/_a11y.scss`, `src/mixins/*`, `src/controllers/*`, `src/stories/*`. | A11–A18 |
| F4 | high | Outside a project, errors are raw and the fix is generic: `ENOENT … harness.config.json` with "Run sketchbook help status" (status, doctor, explain, init, upgrade). `check --json` fails with "Unexpected end of JSON input"; `add button --dry-run` with a TypeError. An agent gets nothing to act on. | A3-*, A6 |
| F5 | high | `init --start library --dry-run` in an empty folder succeeds and lists 35 components to install; the real run fails. The dry run does not test the preconditions. | A3-init-start-library-dry-run, A4 |
| F6 | high | `init` is not atomic. A failure after the catalog step leaves 35 components (and in B, 8 kits and `docs/parity-audits`) plus `starter` written in `harness.config.json`. The catalog rollback (SB-0060) covers only its own step. | A12, B10, B11 |
| F7 | high | `upgrade --from` used as an installer writes 793 files, then exits 1 because `harness.config.json` is missing (it records `harnessVersion` last). Nothing is rolled back; `doctor` then reports "Harness: unrecorded". | A7, A8, B8, A19 |
| F8 | medium | Foundation tokens come only from `npm run tokens:generate` (no CLI command). In a fresh project `init` builds tokens before they exist: 718, then 881 unresolved references. | A12, A13, A14 |
| F9 | high | The shared component source (`src/styles`, `src/mixins`, `src/controllers`, `src/stories`) is neither a catalog unit nor harness-owned (`src/**` is team-owned), so only a clone has it. Installed components cannot build without it (`@use 'a11y'`). | A15, B10 |
| F10 | medium | Harness-defined schemas live in `spec/schemas/`, which the manifest gives to the team, so `upgrade` never ships a schema change. | A16 |
| F11 | high | Catalog contracts cite this repo's decisions (8 distinct SB ids across 93 catalog files). A new project with its own empty decision log fails X1 ("cites a decision that does not exist"). | A17 |
| F12 | high | The only `harness.config.json` to copy is this repo's: it carries `catalog.source: true` and this repo's Figma file key. A new project then believes it is the catalog source and syncs to our design file. | A19, B17 |

### The Claude layer and enforcement

| # | Severity | Finding | Evidence |
|---|---|---|---|
| F13 | high | `.claude/settings.json` is never written (upgrade protects it), so hammock, `guard-generated` and `guard-decisions` are inactive in any project that is not a clone. | A23 |
| F14 | high | The pre-commit check runs only if `npm install` ran the `prepare` script; a fresh copy, and even a clone before `npm install`, has `core.hooksPath` unset. | A25, B18, C6 |
| F15 | medium | Shared quality setup is not installed: `package.json` scripts, `tsconfig*.json`, `.storybook/`, `playwright/playwright.config.ts` and `playwright/helpers/*`. The behavior specs that came with the catalog import `../../helpers/{a11y,events,forms}`, which do not exist. Typecheck, Storybook and behavior tests cannot run. | A26, A27, A28, B7 |
| F16 | works | The Claude-layer guard (`claude-layer.test.mjs`, command names and skill standard) passes in the assembled project, 6 of 6. | A24 |

### Existing product repo

| # | Severity | Finding | Evidence |
|---|---|---|---|
| F17 | blocker | Data loss: the generated barrel replaced the app's committed `src/index.ts` (`export { App } from './app'` is gone). | B13, B14 |
| F18 | high | Check P1 scans all of `src/`, so the app's own custom properties (`--brand`, `--muted`, `--paper`…) fail it: 5 errors, and the checks can never pass in a shared `src/`. With the pre-commit hook active, every commit would be blocked. | B12, B15 |
| F19 | medium | The manifest claims all of `.claude/commands/**`, so the team's own `deploy.md` is reported as "harness-owned; delete if unused". | B7 |
| F20 | medium | Folder names collide: the app already had `src/styles/`, the harness's shared styles folder. | B10 |
| F21 | works | `upgrade` left the app's `package.json`, `CLAUDE.md`, `tsconfig.json`, `.claude/settings.json` and `deploy.md` untouched (diff shows only `src/index.ts`, written by `init`). | B7, B14 |
| F22 | works | `audit-css` runs with no Sketchbook files at all (primary `#1D4ED8` found). `tokens import --from css` maps 4 of 5 variables confidently and flags `brand-dark → primary-foreground` (0.52) as unsure. | B3, B4, B16 |
| F23 | low | `audit-css` proposes a 12 px body size; the CSS sets `body { font-size: 16px }` (each size is used once, so the tie goes to the smallest). | B4 |
| F24 | low | `tokens import app.css` refuses without `--from css` instead of inferring it from the extension. `doctor` exits 0 while checks fail (it reports; `check` is the gate). | B16, B17 |

### Clone (control)

| # | Severity | Finding | Evidence |
|---|---|---|---|
| F25 | high | `init --start blank --yes --detach-catalog` fails check D3 with 33 errors: `spec/design-docs.json` batches still name the components the starter removed. This is a bug in today's supported path. | C3, C8 |
| F26 | works | Everything else in the clone works: `add button` installs spinner and button and passes its checks; `settings.json` is present, so hooks are active. | C4, C5, C7 |

### Drift noticed along the way

- `.claude/rules/form-associated-controls.md` points to `OptionRow(...)` in `src/mixins/option-row.ts`, which does not exist.
- `CLAUDE.md` lists the `from-design-file` starter; a later decision removed it and `harness/starters/` has no such file.

## What this means for the plan (SB-0097)

| Plan step | What the baseline adds |
|---|---|
| Packaging | Ship `harness/` (engine, catalog, starters, templates, standards) and move the engine's run-time imports to `dependencies` (F1, F2). |
| `init` creates the project | Neutral project templates for every path in F3, never this repo's config (F12); generate foundations inside `init` (F8); the shared component source becomes a catalog unit installed with any component, or a harness-owned path (F9); schemas move out of `spec/` or are served from the package (F10); decide how catalog citations resolve in a new project (F11). |
| One transaction | Stage the whole `init` (and `upgrade`) and roll back as a whole; the dry run runs the same preconditions as the real run (F5, F6, F7). |
| Enforcement | `init` merges hook entries into `.claude/settings.json` by key and sets `core.hooksPath` itself (F13, F14); install the shared quality setup (F15). |
| Error experience | Commands that need a project answer "not a Sketchbook project: run sketchbook init" with that fix, in human output and in the envelope (F4). |
| Adopt mode (existing repos) | The harness owns a sub-tree, never the app's `src/index.ts` (F17); P1 and other source checks scope to that sub-tree (F18); ownership of `.claude/` is recorded per installed file, not by glob (F19, F20). |
| Fix now, independent of the plan | D3 after `init --start blank` (F25); the two drift items above. |
