# Sketchbook

Sketchbook is an editable first draft of a design system. See `harness.config.json` for UI, process and feature settings, and `spec/api.json` for the component API. Components are contract-first.
See [CONTRIBUTING.md](./CONTRIBUTING.md) for the repository map and [docs/README.md](./docs/README.md) for documentation.

## Source of truth (edit these)
- `brand.config.json`: foundations, each a `preset` from the standards catalog (`harness/standards/`) or `custom`; generates the foundation layer. Change it with the `foundations` skill or `sketchbook tokens`.
- `spec/tokens/semantic/*.tokens.json`: semantic tokens (light, dark, base), team-owned. `spec/tokens/brand-links.json`: which follow the brand.
- `harness/standards/*.json`: the presets catalog brand.config picks from (resolver `harness/standards/resolve.mts`; list with `sketchbook presets`).
- `spec/components/<name>/contract.json` + `contract.md` + `plan.md`: component spec (harness format); component tokens live in `tokens`.
- `spec/registry.json`: components and lifecycle status. `spec/tokens/contrast.json`: system contrast pairs. `src/patterns/<kit>/`: template kits (team-owned once added).
- `spec/design-docs.json` + `docs/design-docs/`: how a design file documents itself (doc shell, pages, theme axes); the markdown is the tool-agnostic view, the JSON is what the design adapters render (check D3, T7).
- `spec/decisions/DECISIONS.md`: design-system decisions. `docs/simplicity-debt.md`: deliberate shortcuts. `docs/research/`: standards and starting-point research.
- `harness/templates/agent-catalog/`: shared AI workflows, rules, role briefs, commands, settings templates and supporting files. `harness/templates/claude-catalog-metadata.json` supplies native adapter metadata. Rebuild client projections with `npm run build:harness` rather than editing the rendered copies.

## Outputs (never edit by hand; rebuild)
- `spec/tokens/interface.json` (what components depend on; `npm run generate`; rename tokens only via `sketchbook tokens rename`).
- `spec/tokens/foundation/*` (`npm run tokens:generate`; hand edits are kept and flagged as overrides, `sketchbook tokens overrides list`).
- `generated/**` (including `generated/import/` proposals), `src/components/*/*.styles.ts` (`npm run generate`).
- A `.mjs` listed in `harness/.gitignore` or `scripts/.gitignore` is the compiled output of the `.mts` beside it: edit the `.mts`, then `npm run build:harness` (SB-0119).

## Commands
- `npm run sketchbook -- help [command]` builds the CLI and lists commands or options. See `docs/cli.md`; use `--json` for structured output and `--dry-run` where supported.
- Use `check` to validate, `generate` to rebuild and `doctor` to inspect setup. `check` exits 0 on pass, 1 on failure and 2 on pass with overrides.
- `npm run verify` is the pre-merge gate. For focused work, use `npm run test:harness`, `npm run typecheck`, `npm run storybook` or `npm run test:component`.

## Claude layer
- Commands, skills and their agent briefs (`.claude/skills/<skill>/agents/`) follow `forge-me-a-skill` (SB-0073). Rules in `.claude/rules/`; task-specific ones load by `paths:`. Always-on context has a budget (check H1, SB-0114).
- Token layers: component -> semantic -> foundation, one step only (check T2). Shipped docs are in English.

## Status
Run `npm run sketchbook -- status` for component status. See `docs/design-docs/progress.md` for Figma sync progress and `docs/README.md` for audit links.
