---
name: contract-author
description: Draft, resync, or validate a Sketchbook component contract. Use when a component has no contract or when its reference, anatomy, variant matrix, accessibility, or API has changed.
---

# Author a Sketchbook component contract

Produce `spec/components/<name>/contract.json` and `contract.md`. This skill drafts or updates a contract; it does not implement the component.

1. **Find the scope.** Read `harness.config.json`, the component registry entry, the contract schema in `spec/schemas/contract.schema.json`, and relevant decisions in `spec/decisions/DECISIONS.md`. Use an installed contract as a format example. For a new component, register it as `planned` if needed, preview `npx sketchbook add "<name>" --blank --dry-run`, then scaffold it. For a prose-only correction, edit the existing contract and validate it without rerunning research.
2. **Extract evidence.** Use the project's configured design reference, existing code or supplied requirements as appropriate. For the default shadcn/ui reference, consult its docs and registry for anatomy, visual behavior and variants; do not import its implementation. Use the WAI-ARIA Authoring Practices Guide for applicable keyboard and ARIA patterns. A synced design file is an output, not the contract source. Distinguish observed behavior from assumptions.
3. **Draft both files.** Specify the API, anatomy, variants, content, states, events, interaction, accessibility, usage and realizations at the level the component needs. Use `spec/api.json` to choose canonical names; register a justified alias or extension if needed. Component tokens alias existing semantic tokens, not foundation tokens or literal values. Mark unsupported claims as proposals in prose and with `proposal: true` where the schema supports it. Record missing evidence, tokens or decisions as open questions rather than inventing values.
4. **Validate.** Check that the JSON and Markdown agree and run `npm run check`. Review the result against the sources. Where the client supports authorized delegation, use the [extractor](agents/extractor.md), [drafter](agents/drafter.md), and [validator](agents/validator.md) briefs in order, passing evidence between phases. Otherwise do the phases in order and describe validation as a self-check.
5. **Respect the gate.** For a new or redesigned component, if `features.planningGate` is enabled, complete `plan.md` with scope, file order, test plan, accessibility deviations and open questions with recommendations. Ask for explicit approval before any tests or implementation. Do not mark a plan approved without evidence.

Report the changed contract files, sources, unresolved proposals and check results. If an approval is needed, end with that request.
