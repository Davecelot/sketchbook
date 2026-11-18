# Design system

Index only. Facts live in the files linked here; do not repeat them. Everything `sketchbook init` installed, and what each part is for, is listed in `docs/harness.md` (generated).
This design system started from Sketchbook: the default (UI and theme following shadcn/ui; the component API speaks `spec/api.json`, SB-0122) is a starting point to edit or redo. Component creation follows the contract-first standard. See `harness.config.json` (`ui`, `process`, `features`).

## Source of truth (edit these)
- `brand.config.json`: foundations, each a `preset` from the standards catalog (`harness/standards/`) or `custom`. Change it with the `foundations` skill or `sketchbook tokens`.
- `spec/tokens/semantic/*.tokens.json`: semantic tokens (light, dark, base). `spec/tokens/brand-links.json`: which follow the brand. `spec/tokens/interface.json`: what components depend on (rename only via `sketchbook tokens rename`).
- `spec/components/<name>/contract.json` + `contract.md` + `plan.md`: component spec; component tokens live in `tokens`.
- `spec/registry.json`: components and lifecycle status. `spec/tokens/contrast.json`: contrast pairs. `src/patterns/<kit>/`: template kits.
- `spec/decisions/DECISIONS.md`: design-system decisions (the entries Sketchbook started with stay; add yours on top).

## Outputs (never edit by hand; rebuild)
- `spec/tokens/foundation/*` (`npm run tokens:generate`; hand edits are kept and flagged as overrides).
- `generated/**`, `src/components/*/*.styles.ts`, `src/index.ts` (`npm run generate`).

## Commands
- `sketchbook` is the engine's CLI, installed in `node_modules` (a devDependency): run it as `npm run sketchbook -- <command>` (or `npx sketchbook <command>`). `sketchbook help <cmd>` for options (reference `docs/cli.md`); `--json` and `--dry-run` on commands.
- `sketchbook status`, `doctor`, `check`; `sketchbook add|remove|list`, `sketchbook kits list|add|remove`; `sketchbook tokens …`; `sketchbook explain <thing>`; `sketchbook generate` rebuilds the outputs.
- `sketchbook init` again puts back what is missing and never overwrites. `npm update` brings a newer engine; `sketchbook upgrade` then refreshes the harness-owned files here (the Claude layer, the commit hook, `docs/cli.md`, the schemas); yours are never touched.
- `npm run check`: deterministic checks (exit 0 pass, 1 fail, 2 pass with overrides); it also runs before every commit (`.githooks/pre-commit`).
- `npm run typecheck`, `npm run storybook`, `npm run test:component`, `npm run test:harness` (the engine's own tests against this install).

## Claude layer
- Slash commands in `.claude/commands/`, skills in `.claude/skills/` (agents live inside their skill), rules in `.claude/rules/` (rules with `paths:` load when a matching file is read; the rest always), hooks in `.claude/settings.json`.
- Until it is installed, the layer is staged in `move-to-.claude/`: ask Claude Code, opened in this folder, to install it (`move-to-.claude/INSTALL.md`). `sketchbook doctor` says whether it is installed.
- Start Claude Code in this folder: hooks and settings load only from the folder a session starts in (`move-to-.claude/INSTALL.md` explains the case of a design-system folder inside an app repository).
- Optional layer (`sketchbook init --with forge`, recorded in `claudeExtras`): forge-me-a-skill, the skill standard for writing your own skills (check H1 enforces it either way). Not installed unless asked for.
- Token layers: component -> semantic -> foundation, one step only (check T2).
