---
name: contract-author
description: >
  Drafts or updates a component contract (contract.md + contract.json) from
  the shadcn/ui docs and registry, the WAI-ARIA APG, existing code or a
  description, through its extractor, drafter and validator briefs. Trigger:
  a component has no contract, or one needs a re-sync with its source or a
  structured field (anatomy, variantMatrix, aiHints) backfilled.
metadata:
  author: sketchbook
  version: '1.2.0'
  changelog: >
    Shorter description; briefs declare a model and are launched with it
    (extractor on haiku) (SB-0114); affects the three-brief pipeline cost.
  auto-invoke: A component has no contract yet, or an existing one needs a re-sync with its source
  allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, WebFetch, Agent]
---

# Contract Author

Produces a `spec/components/<name>/contract.md` (+ `contract.json`) that
satisfies `spec/schemas/contract.schema.json`, by running three role briefs
in sequence. Each is a file under [`agents/`](agents/), launched with the
`Agent` tool as a general-purpose agent, with the brief's `model`, whose prompt is that brief's
contents plus its inputs; the agent stays within the brief's declared
`tools`.

---

## When to use

Use this skill when:

- A component has no `spec/components/<name>/` directory yet and one is
  needed before implementing it (see the `contract-first` rule).
- An existing contract needs a re-sync with its source, a status change, or
  a structured field (`anatomy`, `variantMatrix`, `aiHints`) backfilled
  because the prose already covers it but `contract.json` doesn't yet.

Do not use this skill for:

- Partial edits that don't touch the contract's structured spec — a
  one-line prose typo fix doesn't need the full extractor → drafter →
  validator pipeline; just edit the file and re-run `npm run check`.
- Auditing an _implementation_ against its contract — that's the
  `parity-auditor` brief at
  `.claude/skills/component-builder/agents/parity-auditor.md`, launched from
  the `component-builder` skill.

---

## Critical patterns

### 1. Source of truth for a new contract

- **UI, API, visuals:** the shadcn/ui docs page for the component
  (`https://ui.shadcn.com/docs/components/<slug>`) and its registry JSON
  (`https://ui.shadcn.com/r/styles/new-york-v4/<slug>.json`). shadcn/ui is a
  reference only: nothing from Tailwind, React, Radix or the shadcn CLI is
  used in this repo.
- **Keyboard and ARIA:** the WAI-ARIA Authoring Practices Guide (APG).
- **Registry entry:** `spec/registry.json`.
- **Tokens:** existing semantic tokens in `spec/tokens/semantic/*.tokens.json`.
- Figma is **not** a source: design files are outputs of the contract.
- Anything not confirmed by those sources is marked `"proposal": true` in
  JSON and `PROPOSAL` in prose.

### 2. Don't invent

- Don't invent token values or hex codes — alias existing semantic tokens
  from `spec/tokens/semantic/*.tokens.json`. The component token layer
  (`tokens`) must alias SEMANTIC tokens only. If genuinely unknown, leave it
  as an open question rather than guessing.
- Don't invent `aiHints.antiPatterns` either — ground each one in the
  shadcn/ui docs, the APG, or something the user explicitly said. If
  unconfirmed, leave it as an open question instead of guessing at a
  plausible-sounding anti-pattern.

### 2b. Names come from the API vocabulary

Before naming a prop, a variant value, a state or an event, look in `spec/api.json` (`sketchbook api list`, `sketchbook api explain <name>`): use the canonical name. If the code has to spell it differently, register an alias; if it is truly specific to this component, register an extension with its reason. Check A1 fails on a name that is not registered (`docs/api-standard.md`).

### 3. One source of truth

Don't duplicate the contract's content elsewhere — `contract.md` and
`contract.json` are the only sources of truth; nothing else should hold a
copy.

### 4. Narrow phases

Each brief is scoped narrowly on purpose — extraction, drafting, and
validation are different failure modes (a bad source read, a schema
mismatch, a leftover validation error), and running them as separate
delegated steps makes it obvious which phase produced a given problem.

---

## Decision tree

```text
No spec/components/<name>/ yet?                      -> full pipeline (workflow below)
Existing contract out of sync with its source?       -> full pipeline
Structured field (anatomy/variantMatrix/aiHints)
  missing but the prose covers it?                   -> full pipeline (backfill)
One-line prose typo or similar partial edit?         -> edit the file, run npm run check
Implementation vs contract audit?                    -> component-builder's parity-auditor brief
```

---

## Workflow

```text
1. Read spec/schemas/contract.schema.json — the contract.json produced
   must validate against it.
2. Read one existing contract as a template — spec/components/button/
   contract.md and contract.json are the reference example (frontmatter,
   props, anatomy, variant matrix, states, accessibility, usage,
   Realizations, open questions).
3. Launch agents/extractor.md
   -> gathers the component's real data from the sources above, marks every
      inferred/unconfirmed field PROPOSAL.
4. Launch agents/drafter.md
   -> writes contract.md (prose) + contract.json (structured spec) from the
      extractor's findings.
5. Launch agents/validator.md
   -> runs `npm run check` and fixes violations.
6. Planning gate: once `npm run check` passes, write
   spec/components/<name>/plan.md and STOP for approval (see the
   planning-gate rule). Tests come first (see the test-first rule).
```

## Status conventions

`planned` (registered, no contract content yet), `draft` (contract written,
open questions remain), `wip` (implementation in progress), `beta`
(implemented, not fully audited), `stable` (verified end-to-end),
`deprecated` (superseded), `code-only` (implementation with no design
counterpart).

---

## Commands

```bash
npm run check   # validate contract.json against the schema and the other deterministic checks
```

---

## Resources

- [`spec/schemas/contract.schema.json`](../../../spec/schemas/contract.schema.json) — what `contract.json` must validate against.
- `spec/components/button/contract.md` and `contract.json` — template contract.
- [`agents/extractor.md`](agents/extractor.md), [`agents/drafter.md`](agents/drafter.md), [`agents/validator.md`](agents/validator.md) — the three role briefs launched in sequence.
- `.claude/skills/component-builder/agents/parity-auditor.md` — the brief that audits an implementation against its contract.
