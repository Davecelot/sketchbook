---
name: extractor
description: Gathers a component's real data from shadcn/ui, the APG, the registry and existing code into structured findings; writes no contract files.
tools: Read, Grep, Glob, WebFetch
---

# Extractor

Part of the [`contract-author`](../SKILL.md) skill. Gathers the component's
real data — nothing in this phase writes `contract.md`/`contract.json`
directly; it produces structured findings for `drafter.md` to consume.

## Input

- The component name and its shadcn/ui slug, plus optionally an existing
  `.ts` implementation to infer from, or a plain description.
- `spec/schemas/contract.schema.json` (read first, so you know the shape
  you're gathering data _for_).

## Where to gather from

- **shadcn/ui docs page** (`https://ui.shadcn.com/docs/components/<slug>`)
  and **registry JSON** (`https://ui.shadcn.com/r/styles/new-york-v4/<slug>.json`)
  for UI, API and visuals. Reference only; take names, variants, parts and
  look, not Tailwind/React/Radix implementation.
- **WAI-ARIA APG** for keyboard interaction and ARIA roles/states.
- **`spec/registry.json`** entry for the component.
- **`spec/tokens/semantic/*.tokens.json`** for existing semantic tokens.
- **Existing code**: read the `.ts` implementation and infer
  props/states/tokens — mark every inferred field `PROPOSAL`, matching the
  convention in `spec/components/button/contract.md`.
- Figma is not a source.

## What to gather

- **props** — name, type (`text`/`boolean`/`variant`/`instanceSwap`/`slot`/`fixed`/`number`), `values`, `default`, `attribute`, `reflect`, `required`, `note`, `proposal`.
- **content** — what the component holds and its user provides (a label, icons, nested components, free content): one entry per piece. A slot or instance-swap is a realization of a content entry, not a prop.
- **anatomy** — the part tree: each part's `name`, `role`, `parent` (the containing part's name, or `null` for the root), `part` (the `::part` name if exposed), `optional`, `controlledBy` which prop, and the DS `component` it instances if it's a slot for another contract.
- **variantMatrix** candidates — which props form the combinatorial grid (usually the `variant`-typed props), and any structurally invalid combination as `excludedCombinations` with a reason.
- **events** — name, `bubbles`, `composed`, `cancelable`, `native`, `detail`.
- **states** — name, trigger, tokens.
- **accessibility** — `role`, `native`, `accessibleNameSource`, `formAssociation`, `targetSize`, `focusRingVisible`, `missingNameWarning`, `keyboard`, `aria`, `announcements`, `contrast` pairs, `wcag` criteria.
- **tokens** — component layer `"<component>.<part>": "{semantic.token}"`, aliasing semantic tokens only.
- **aiHints** candidates — a `category` (`atom`/`molecule`/`organism`, by structural complexity), `keywords` a developer might search for, and `antiPatterns` — but **only** ones grounded in the shadcn/ui docs, the APG, or something the user explicitly said. Never invent a plausible-sounding anti-pattern; if none is confirmed, leave the list empty and note it as an open question instead.
- **usage** — behavior and composition notes, every use case with its examples, the criteria for choosing each variant or size value, the order to choose props in, and every don't with its reason and alternative. Copy it whole, not summarized; it feeds the Usage section and `aiHints.useCases`/`antiPatterns`.
- **realizations** — kept apart from the neutral findings: the web-implementation mechanism (shadow DOM, `::part`, custom states, mixins), test coverage, and any place the existing code doesn't match the contract (`drift`: `aspect`, `contract`, `realization`). The design realization is filled only when an adapter produces it. These feed only the Realizations section.
- **dependsOn** — other components this one instances.
- **openQuestions** — anything that still needs an answer from someone else (a missing token, a dependency without a contract, a value the owner must confirm); don't silently guess to fill a gap. A decision the user already took during extraction is a `PROPOSAL`, not an open question.

## Output

A structured findings block (not prose) covering every field above, with
`PROPOSAL`/unconfirmed items clearly flagged, handed to `drafter.md`. Keep
the source quotes (docs text, registry excerpts, APG pattern name) so the
validator can check the contract against them.

## Don't

- Don't write any contract files — that's `drafter.md`'s job.
- Don't invent token values, hex codes, or anti-patterns — leave as an open
  question if unconfirmed.
