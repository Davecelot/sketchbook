# Sketchbook

Index only. Facts live in the files linked here; do not repeat them.
Sketchbook is the first draft of a design system: teams bring their own brand and way of working; the default (UI and theme following shadcn/ui; the component API speaks `spec/api.json`, SB-0122) is a starting point to edit or redo. Component creation follows the contract-first standard. See `harness.config.json` (`ui`, `process`, `features`).

## Source of truth (edit these)
- `brand.config.json`: foundations, each a `preset` from the standards catalog (`harness/standards/`) or `custom`; generates the foundation layer. Change it with the `foundations` skill or `sketchbook tokens`.
- `spec/tokens/semantic/*.tokens.json`: semantic tokens (light, dark, base), team-owned. `spec/tokens/brand-links.json`: which follow the brand.
- `harness/standards/*.json`: the presets catalog brand.config picks from (resolver `harness/standards/resolve.mts`; list with `sketchbook presets`).
- `spec/components/<name>/contract.json` + `contract.md` + `plan.md`: component spec (harness format); component tokens live in `tokens`.
- `spec/registry.json`: components and lifecycle status. `spec/tokens/contrast.json`: system contrast pairs. `src/patterns/<kit>/`: template kits (team-owned once added).
- `spec/design-docs.json` + `docs/design-docs/`: how a design file documents itself (doc shell, pages, theme axes); the markdown is the tool-agnostic view, the JSON is what the design adapters render (check D3, T7).
- `spec/decisions/DECISIONS.md`: design-system decisions. `docs/simplicity-debt.md`: deliberate shortcuts. `docs/research/`: standards and starting-point research.

## Outputs (never edit by hand; rebuild)
- `spec/tokens/interface.json` (what components depend on; `npm run generate`; rename tokens only via `sketchbook tokens rename`).
- `spec/tokens/foundation/*` (`npm run tokens:generate`; hand edits are kept and flagged as overrides, `sketchbook tokens overrides list`).
- `generated/**` (including `generated/import/` proposals), `src/components/*/*.styles.ts` (`npm run generate`).
- A `.mjs` listed in `harness/.gitignore` or `scripts/.gitignore` is the compiled output of the `.mts` beside it: edit the `.mts`, then `npm run build:harness` (SB-0119).

## Commands
- `sketchbook <cmd>` (`npm run sketchbook -- <cmd>`, which builds first; `npx sketchbook` or `node harness/cli.mjs` after `npm run build:harness`): `sketchbook help [cmd]` lists commands and options (reference `docs/cli.md`, generated; allowed names `harness/cli/known-commands.json`); `--json` and `--dry-run` everywhere.
- Most used: `check` (exit 0 pass, 1 fail, 2 pass with overrides; `--verbose` lists every check), `generate`, `tokens …`, `add|remove|list`, `kits …`, `docs <component>`, `sync …` (Figma), `init` (new project, SB-0099; template `harness/templates/project/`), `doctor`, `upgrade` (ownership in `harness/manifest.json`), `prefix <new>` (SB-0017).
- `npm run verify` (the full gate before a merge; no GitHub CI, SB-0120), `npm run test:harness` (proves each check can reject), `npm run typecheck`, `npm run storybook`, `npm run test:component`.

## Claude layer
- Commands, skills and their agent briefs (`.claude/skills/<skill>/agents/`) follow `forge-me-a-skill` (SB-0073). Rules in `.claude/rules/`; task-specific ones load by `paths:`. Always-on context has a budget (check H1, SB-0114).
- Token layers: component -> semantic -> foundation, one step only (check T2). Shipped docs are in English.

## Status
38 components (35 Tier 1, 3 Tier 2): all 38 stable (reviews in docs/parity-audits/, docs/a11y-audits/). Figma file synced via `/sync` (variables and styles; docs per `docs/design-docs/progress.md`). White-label guarded by check W1.
