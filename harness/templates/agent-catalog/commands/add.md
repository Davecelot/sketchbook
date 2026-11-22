---
description: Add a component - install it from the catalog, or design a new one (scaffold, contract-author, check, plan, planning gate)
---

Add the component "<input>" to the design system, following the harness rules.

**From the catalog** (the reference components): if it is in the catalog and the person wants it as shipped, run `sketchbook add "<input>" --dry-run`, show what it installs (contract, code, stories, tests and any components it depends on), then run it without `--dry-run`; it ends with the checks. Report the result and the Storybook page. Run `sketchbook help add` to confirm options.

**New or redesigned** (not in the catalog, or `--blank`):
Use the `contract-author` skill to preview the scaffold, draft and validate the contract, and request approval when the project's planning gate is enabled. If the component is not in `spec/registry.json`, stop and say so. This command ends at contract planning; it does not write tests or code.
