---
title: "Import tokens"
description: "Bring existing tokens or product CSS in as a reviewed proposal, then apply it."
order: 20
---

An import never changes your files directly. `sketchbook tokens import` writes a proposal to `generated/import/<name>.proposal.json`, mapped onto the semantic interface. You review it, then `import apply` writes it to `brand.config.json` and the semantic files. Sources are DTCG or Tokens Studio JSON (a file or a folder of sets) and CSS custom properties.

1. **Create the proposal.** `--from` is `dtcg` or `css`; by default it follows the file type. `--name` names the proposal.

   ```terminal
   sketchbook tokens import tokens.json --from dtcg
   sketchbook tokens import theme.css --from css --name brand
   ```

2. **Map the names.** The `token-mapper` brief reads the proposal and `spec/tokens/interface.json`, and reports each interface token as `match`, `candidates` or `missing`. It writes only `generated/import/<name>.mapping.json`.

3. **Review.** Go through unmapped tokens, candidates, new roles and contrast failures, one at a time.

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
- [Foundations CLI](/cli/foundations/): every option of `tokens` and `audit-css`.

Source of truth: `.claude/commands/import-tokens.md`, `.claude/skills/foundations/agents/token-mapper.md`, `harness/starters/from-codebase.json`, `docs/cli.md`
