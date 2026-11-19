---
title: "Contracts"
description: "Write down what a component promises, then build and check it against that agreement."
order: 30
---

Use the contract to agree on the API, token roles, and accessibility behavior before you build. Find the contract and its implementation plan under `spec/components/<name>/`.

| File | Holds |
| --- | --- |
| `contract.json` | Machine-readable spec: props, events, states, accessibility, and the component tokens in `tokens` |
| `contract.md` | The same spec for people |
| `plan.md` | Scope, files, tokens, accessibility approach, test plan, risks, open questions |

No implementation is added without a `contract.json` that passes `sketchbook check`. The component tokens it declares are the only token variables the component's CSS may use. The full field list is in [Contract format](/reference/contract-format/).

When the code and written behavior disagree, start by checking the contract.

<!-- illustration: contract | One contract defines the component and gives the checks a baseline. -->

## Lifecycle

`spec/registry.json` gives every component a status: `planned`, `draft`, `wip`, `beta`, `stable`, `deprecated` or `code-only`.

The evidence each status needs is in [Lifecycle statuses](/reference/contract-format/#lifecycle-statuses). `stable` needs an accessibility audit with an `Approved-by:` line.

> **Note** Editing the registry alone cannot raise a status. Check R1 fails when the evidence is missing.

## Workflow

1. Scaffold the contract. The name must already be in `spec/registry.json`.

   ```terminal
   sketchbook add "<Name>" --blank
   ```

2. Fill `contract.json` and `contract.md` with the `contract-author` skill. Anything the sources do not confirm is marked `"proposal": true`.
3. Run the checks until they pass.

   ```terminal
   sketchbook check
   ```

4. Write `plan.md`, then stop at the planning gate. Write no tests or code until the plan is approved. Record the answers in the contract's `openQuestions` and in the plan.
5. Build test-first with the `component-builder` skill: write the story and behavior spec, see the tests fail, then write the smallest code that passes.

In Claude Code, `/add <Name>` runs this flow and stops at the planning gate. The gates are described in [Checks](/concepts/checks/).

## Next steps

- [Add a component](/guides/add-component/)
- [Checks](/concepts/checks/)
- [Contract format](/reference/contract-format/)
- [API vocabulary](/concepts/api-vocabulary/): the names a contract may use

Source of truth: `CLAUDE.md`, `harness.config.json`, `spec/schemas/contract.schema.json`, `spec/schemas/registry.schema.json`, `harness/checks/r1-registry.mts`, `.claude/rules/contract-first.md`, `.claude/rules/planning-gate.md`, `.claude/rules/test-first.md`, `.claude/skills/contract-author/SKILL.md`, `.claude/skills/component-builder/SKILL.md`
