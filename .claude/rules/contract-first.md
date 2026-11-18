---
paths:
  - "src/components/**"
  - "spec/components/**"
  - "spec/registry.json"
---

# Rule: contract-first

No Web Component implementation may be added or merged without a
corresponding `spec/components/<name>/contract.json` that passes
`npm run check`.

**Why:** the entire point of the contract-first workflow is that the
contract is the source of truth the implementation is built and verified
against — not something reverse-engineered from whatever the component
happens to look like in code. Skipping the contract for "just this one
component" is how implementation and design silently diverge with no
record of why.

**Enforcement (manual for now):** before implementing a component, check
whether `spec/components/<name>/` already exists. If there is none, invoke
the `contract-author` skill first. If one exists but is `draft` with open
questions blocking implementation, resolve or explicitly accept them
(don't implement against unresolved ambiguity without saying so).
Planning and test-first gates still apply (see `planning-gate.md` and
`test-first.md`).

There is no automated pre-commit hook for this yet.
