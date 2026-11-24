---
title: "Import tokens"
description: "Review a proposal for your existing tokens or CSS before adding them to your design system."
order: 20
---

Bring DTCG or Tokens Studio JSON, or CSS custom properties. First, `sketchbook tokens import` maps what it finds to your semantic interface and writes a proposal under `generated/import/`. Review the proposal before applying changes to your brand and semantic files.

1. **Create the proposal.** `--from` is `dtcg` or `css`; by default it follows the file type. `--name` names the proposal.

   ```terminal
   sketchbook tokens import tokens.json --from dtcg
   sketchbook tokens import theme.css --from css --name brand
   ```

2. **Map by usage.** The `token-mapper` brief reads the proposal and `spec/tokens/interface.json`, and reports each interface token as `match`, `candidates` or `missing`. It writes only `generated/import/<name>.mapping.json`. Check the original input for descriptions the proposal doesn't carry. For example, an incoming `active` may mean pressed, selected, or current: check where it's used before mapping it.

3. **Review.** Go through unmapped tokens, candidates, new roles and contrast failures, one at a time. Apply reads the original `.proposal.json`, not the mapper's advisory `.mapping.json`. Reflect agreed changes in the proposal and set `"apply": false` on mappings you're not ready to use.

4. **Preview the apply.**

   ```terminal
   sketchbook tokens import apply generated/import/brand.proposal.json --dry-run
   ```

5. **Apply.** `--only` limits it to `semantic`, `foundation` or `mapped` entries. `--min-confidence` skips weaker entries.

   ```terminal
   sketchbook tokens import apply generated/import/brand.proposal.json --min-confidence 0.6
   ```

6. **Close out.**

   ```terminal
   sketchbook tokens diff
   sketchbook check
   ```

> **Note** In Claude Code, `/import-tokens <file>` runs these steps. It infers `--from` from the content and applies only on your yes.

## Start from an existing product

With a product but no token file, `audit-css` clusters its colors, font sizes, spacing, radii and shadows into `generated/import/codebase.proposal.json`. Quote globs.

```terminal
sketchbook audit-css ../product/src --dry-run
sketchbook audit-css "app/**/*.css"
```

Review the proposal with `/foundations import`, or start with `sketchbook init --start from-codebase --from "<path|glob>"`.

## Next steps

- [Change a foundation](/guides/foundations/): refine imported values with presets.
- [Choosing token names](/guides/choosing-token-names/): rename the interface separately if you want to keep your team's vocabulary.
- [Foundations CLI](/cli/foundations/): every option of `tokens` and `audit-css`.

Source of truth: `.claude/commands/import-tokens.md`, `.claude/skills/foundations/agents/token-mapper.md`, `harness/starters/from-codebase.json`, `docs/cli.md`
