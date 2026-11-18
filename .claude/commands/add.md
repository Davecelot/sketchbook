---
description: Add a component - install it from the catalog, or design a new one (scaffold, contract-author, check, plan, planning gate)
argument-hint: <Component Name> [--blank]
---

Add the component "$ARGUMENTS" to the design system, following the harness rules.

**From the catalog** (the reference components): if it is in the catalog and the person wants it as shipped, run `sketchbook add "$ARGUMENTS" --dry-run`, show what it installs (contract, code, stories, tests and any components it depends on), then run it without `--dry-run`; it ends with the checks. Report the result and the Storybook page. Run `sketchbook help add` to confirm options.

**New or redesigned** (not in the catalog, or `--blank`):
1. Run `sketchbook add "$ARGUMENTS" --blank` to scaffold `spec/components/<name>/` and set the registry status to draft. If the component is not in `spec/registry.json`, stop and say so.
2. Use the `contract-author` skill to fill `contract.json` and `contract.md` (harness format; UI, names and variants from the visual reference; keyboard and ARIA from the WAI-ARIA APG; component tokens alias semantic tokens only).
3. Run `sketchbook check` until it passes. If a semantic token is missing, propose it with `sketchbook tokens add <path> … --pair fg/bg` (rule `tokens-through-the-harness`); never alias foundation tokens from a component.
4. Fill `plan.md` (scope, files, test plan, accessibility deviations, open questions with a recommendation first).
5. Stop at the planning gate (`.claude/rules/planning-gate.md`): summarize the plan and ask for approval. Do not write tests or code yet.
