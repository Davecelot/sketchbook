---
title: "Contract format"
description: "Look up the fields, names, and lifecycle statuses a component contract accepts."
order: 20
---

Start with `spec/components/<name>/contract.json` when you want to see what a component declares. Check C1 validates it against `spec/schemas/contract.schema.json`, and C3 compares the code with the contract.

## Top-level fields

The schema allows only these fields.

| Field | Purpose | Required |
| --- | --- | --- |
| `component` | Component name, for example `Badge`. | Yes |
| `tag` | Custom element tag, for example `sb-badge` or `team2-badge`. The prefix starts with a lowercase letter and can include digits after it. | Yes |
| `status` | Lifecycle status (see below). | Yes |
| `platforms` | Where the component exists, for example `web`, `design`. | Yes |
| `summary` | One-sentence description. | Yes |
| `props` | The component API: each prop with type, values, default and note. | Yes |
| `anatomy` | Named parts, their role and parent. | Yes |
| `accessibility` | Role, native element, accessible name, target size, keyboard, ARIA, contrast pairs. | Yes |
| `tokens` | Component tokens, each aliasing a semantic token. | Yes |
| `realizations` | How each platform realizes the contract. | Yes |
| `openQuestions` | Questions with a recommendation, status and answer. | Yes |
| `version` | Contract version. | No |
| `dependsOn` | Other components this one needs. | No |
| `variantMatrix` | Variant combinations. | No |
| `content` | What goes in each slot, whether it is required or repeatable. | No |
| `events` | Events the component dispatches. | No |
| `states` | Interaction states with trigger and the tokens they use. | No |
| `aiHints` | Category, keywords, use cases and anti-patterns for agents. | No |
| `decisions` | Decisions that apply to this component. | No |
| `elements` | Sub-elements of a component family, each checked by C3 against its own API. | No |
| `$extensions` | The one open section: dotted namespaces such as `design.figma`. | No |

> **Note** Prop, event and state names must come from `spec/api.json` (check A1). Token references must exist (checks C2 and T2).

## Example

Abridged from `spec/components/badge/contract.json`.

```json
{
  "component": "Badge",
  "tag": "sb-badge",
  "status": "beta",
  "platforms": ["web", "design"],
  "summary": "A small pill that labels or counts something, optionally a link.",
  "props": {
    "variant": {
      "type": "variant",
      "values": ["default", "secondary", "destructive", "outline", "ghost", "link"],
      "default": "default",
      "reflect": true
    },
    "href": { "type": "text", "default": null }
  },
  "accessibility": {
    "role": "none for a plain badge (text); link for a badge with href",
    "keyboard": { "Tab": "focuses a link badge", "Enter": "follows the link" }
  },
  "tokens": {
    "badge.font-family": "{font.family.body}",
    "badge.font-size": "{font.size.caption}"
  }
}
```

## Lifecycle statuses

The `status` field and the entry in `spec/registry.json` move together. Check R1 requires evidence for each step.

| Status | Meaning | Evidence R1 requires |
| --- | --- | --- |
| `planned` | Registered, no contract content yet. | None. |
| `draft` | Contract written, open questions remain. | The contract exists. |
| `wip` | Implementation in progress. | The contract exists. |
| `beta` | Implemented, not fully audited. | Web files, stories, a behavior spec, and no C3 errors. |
| `stable` | Verified end to end. | Also a parity audit, an a11y audit with a ready verdict, an `Approved-by:` line, and a complete design realization. |
| `deprecated` | Superseded. | The contract exists. |
| `code-only` | Implementation with no design counterpart. | Same as `beta`. |

## Names

Every contract speaks one vocabulary, registered in `spec/api.json`. Check A1 fails on a name that is not registered, and `sketchbook api list` shows each contract against it.

- Prop keys are camelCase; prose spells them dash-case.
- `variant` is emphasis, never `role`. A status tone is `feedback`; a step of size is `size`.
- What a component holds (text, icons, children) is content, not a prop: `label`, `leadingIcon`.
- A boolean that changes the look (`disabled`, `readOnly`, `selected`) is a boolean prop.
- Events are `change`, `input` and `click`; any other event is named with the prefix (`sb-toggle`).

To add a name, register it in `spec/api.json` with its meaning, then use it. `sketchbook api explain <name>` explains one.

## Next steps

- [Contracts](/concepts/contracts/)
- [Add a component](/guides/add-component/)

Source of truth: `spec/schemas/contract.schema.json`, `spec/components/badge/contract.json`, `.claude/skills/contract-author/SKILL.md`, `harness/checks/r1-registry.mts`, `docs/cli.md`
