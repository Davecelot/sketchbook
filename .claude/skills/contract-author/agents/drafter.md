---
name: drafter
description: Writes contract.md and contract.json from the extractor's findings.
tools: Read, Write, Edit, Grep, Glob
model: sonnet
---

# Drafter

Part of the [`contract-author`](../SKILL.md) skill. Turns `extractor.md`'s
findings into the actual contract files.

## Input

`extractor.md`'s structured findings block, plus one existing contract read
as a template (`spec/components/button/contract.md` and `contract.json`).

## What to write

1. **`spec/components/<name>/contract.md`** (kebab-case `<name>`, e.g.
   `icon-button` not `icon_button`):
   - Frontmatter: `component`, `status`, `version`, `platforms`,
     `dependsOn`, `last_updated`, `source`.
   - Then `# Name` with a blockquote summary, followed by these headings in
     order: `## 1. Purpose`, `## 2. Anatomy`, `## 3. Props / API`,
     `## 4. Variant matrix`, `## 5. Roles and color`, `## 6. States`,
     `## 7. Dimensions and layout`, `## 8. Typography`,
     `## 9. Accessibility`, `## 10. Usage` (with `### Behavior`,
     `### Composition`, `### Choosing the props`, `### Do / Don't`),
     `## Realizations` (with `### Figma`, `### Web`, `### Coverage`,
     `### Known drift`), `## Open questions`, `## Spec for agents`.
     Mark every unconfirmed decision inline with `` `PROPOSAL` ``.
   - Everything before Realizations is platform-neutral: each rule gives
     its own reason, props use the contract's names, states are described
     as behavior. Design-tool properties and layers, and web mechanisms
     (shadow DOM, `::part`, custom states, mixins, CSS, file paths), go only
     into `## Realizations`, mirrored by `contract.json`'s `realizations`.
     The `### Figma` subsection stays a stub ("not realized yet") unless the
     component has been synced to Figma.
   - Usage carries the extractor's usage findings in full: behavior,
     composition, every use case with its examples, how to choose each
     variant or size value, and every don't with its reason and
     alternative. Never compress them into a summary. Write them as the
     contract's own guidance, platform-neutral: no "per shadcn", no CSS or
     file paths.
   - Closing `## Spec for agents` section — a short pointer to
     `contract.json`, never an embedded copy.
2. **`spec/components/<name>/contract.json`** — the sole source of the
   structured spec. Top-level fields: `component`, `tag` (`sb-` prefix),
   `status`, `version`, `platforms`, `summary`, `dependsOn`, `props`,
   `anatomy`, `variantMatrix`, `content`, `events`, `states`,
   `accessibility`, `tokens`, `aiHints`, `realizations`, `openQuestions`,
   `decisions`. Populate `anatomy`, `variantMatrix` and `aiHints` whenever
   the corresponding prose section (Anatomy, Variant matrix, Usage
   Do/Don't) is written, in the same pass. `aiHints.useCases` mirrors the
   Usage section's choices, `aiHints.antiPatterns` its don'ts. `tokens`
   aliases semantic tokens only. Mark unconfirmed sub-trees with
   `"proposal": true`.
3. **Open questions are only what needs an answer from someone else**
   (a missing token, a dependency without a contract, a value the owner
   must confirm). A decision the DS owner
   already took is a `PROPOSAL` in the prose, with the discarded
   alternative in one clause, never an `openQuestions` entry. Don't draft a question asking for a manual
   screen-reader pass: state in the contract what the screen-reader view must
   show (roles, names, states, the active item) instead (SB-0113).

## Output

The written `contract.md` + `contract.json` files, handed to `validator.md`
together with `extractor.md`'s source quotes, passed through verbatim.

## Don't

- Don't duplicate `contract.json`'s data back into `contract.md` — the
  "Spec for agents" section is a pointer, not a copy.
- Don't leave `anatomy`/`variantMatrix`/`aiHints` out of `contract.json`
  when the matching prose section exists.
- Don't record a decision as an open question to keep the alternative
  visible — the `PROPOSAL` clause in the prose is where the alternative
  lives.
