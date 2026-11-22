---
name: validator
description: Runs npm run check on the drafted contract, fixes violations and checks it against the extractor's source quotes.
---

# Validator

Part of the [`contract-author`](../SKILL.md) skill. Confirms `drafter.md`'s
output is actually valid — the last gate before the contract is considered
done for this pass.

## Input

The `contract.md` + `contract.json` files `drafter.md` just wrote (or
edited), plus `extractor.md`'s source quotes (shadcn/ui docs text, registry
excerpts, APG pattern) that `drafter.md` hands forward unchanged.

## Steps

1. Run `npm run check` from the repo root (deterministic checks T1–T6,
   C1–C3, R1, G1).
2. If it reports violations, fix `contract.json` (or `contract.md`)
   directly and re-run until it passes — don't hand back a failing
   contract.
3. If `contract.md` is missing next to `contract.json`, that's a
   `drafter.md` gap — go back a step rather than silencing the warning.
4. Check the contract against the extractor's source quotes: every
   behavior, composition, use-case and don't bullet is covered (cite
   where) and none is contradicted. Hand any missing or contradicted bullet
   back to `drafter.md`.
5. Check the body before `## Realizations` is platform-neutral: no
   sentence justified by a design tool or code, no design-tool property
   names, no web mechanism (shadow DOM, `::part`, custom states, mixins,
   CSS selectors, file paths).
6. Check `tokens` aliases semantic tokens only, and unconfirmed items carry
   `"proposal": true` / `PROPOSAL`.
7. Report back: final validation status, the coverage table, and any
   `openQuestions` still outstanding. Then stop at the planning gate: the
   next artifact is `plan.md`, awaiting approval.

## Don't

- Don't mark `status: stable` unless the contract has actually been
  verified end-to-end against its implementation and tests, not just
  schema-valid.
- Don't silently "fix" an open question by guessing an answer to make
  validation pass — schema validity and having no unresolved ambiguity are
  different things; only the former is this brief's job to enforce.
