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

Use the shared `contract-author` and `component-builder` skills when working with an agent. If your client doesn't load skills natively, it can read their `SKILL.md` files under `.agents/skills/`. The workflow below also works without an agent. See [Agent compatibility](/concepts/agent-compatibility/) for installation and discovery.

1. Register a new name in `spec/registry.json` if needed. Preview the scaffold, then run the command without `--dry-run`.

   ```terminal
   sketchbook add "<Name>" --blank --dry-run
   ```

2. Fill `contract.json` and `contract.md` from the project's design and applicable accessibility references. Mark unconfirmed details as proposals, using `"proposal": true` where the schema supports it.
3. Run the checks until they pass.

   ```terminal
   sketchbook check
   ```

4. If the planning gate is enabled, complete `plan.md` and stop for approval before writing tests or implementation. Record answers in the contract's `openQuestions` and in the plan.
5. If test-first is enabled, write the story and behavior spec and confirm the tests fail as intended before implementing. Verify against the contract, then review before promoting the component.

The gates are described in [Checks](/concepts/checks/). Claude Code's `/add <Name>` is a native entry point for scaffolding and contract planning, not a prerequisite.

## Next steps

- [Add a component](/guides/add-component/)
- [Checks](/concepts/checks/)
- [Contract format](/reference/contract-format/)
- [API vocabulary](/concepts/api-vocabulary/): the names a contract may use

Source of truth: `harness.config.json`, `spec/schemas/contract.schema.json`, `spec/schemas/registry.schema.json`, `harness/checks/r1-registry.mts`, `.agents/skills/contract-author/SKILL.md`, `.agents/skills/component-builder/SKILL.md`
