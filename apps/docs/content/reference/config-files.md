---
title: "Config files"
description: "The source and config files a team edits, who owns each, and the command to change it."
order: 10
---

"Team" means you edit it. "Generated" means a command rebuilds it and hand edits are flagged. "Harness" means the engine owns it and `sketchbook upgrade` replaces it.

## Project configuration

| File | Controls | Owner | Change with |
| --- | --- | --- | --- |
| `brand.config.json` | Foundations: color, typography, spacing, radius, density, contrast, breakpoints and more. Each is a `preset` or `custom`. | Team | `sketchbook tokens set\|preset`, or the `foundations` skill |
| `harness.config.json` | Prefix, the `language` of AI and human output, adapters, feature switches, the `ui` and `process` references, white-label terms, catalog source, and `contextBudget` (the always-on context limit that check H1 enforces). | Team | Edit it; `sketchbook prefix <new>` renames the prefix |
| `brand/` | The brand mark (icon SVG and PNG), shipped in the package. The `size.brand.mark` semantic token sizes it. | Team | Replace the files |
| `spec/registry.json` | Components, tier, status, tag and path. | Team | `sketchbook add`, `sketchbook remove` |

```json
{
  "prefix": "sb",
  "features": { "planningGate": true, "testFirst": true },
  "ui": { "reference": "shadcn/ui" },
  "process": { "reference": "contract-first standard" }
}
```

> **Note** `ui` names the visual and API reference your components follow. `process` names the standard for contract pairs, file layout and decision logs. Replace either to follow your own way of working.

## Tokens

| File | Controls | Owner | Change with |
| --- | --- | --- | --- |
| `spec/tokens/semantic/*.tokens.json` | Semantic tokens: `light`, `dark` and `base`. | Team | Edit values; `sketchbook tokens add\|remove`; renames only with `sketchbook tokens rename` |
| `spec/tokens/brand-links.json` | Which semantic tokens follow the brand. | Team | Remove a link to own that token |
| `spec/tokens/interface.json` | The semantic tokens components, stories and specs depend on. | Generated | `npm run generate` |
| `spec/tokens/overrides.json` | Hand edits to foundation tokens, kept and flagged. | Generated | `sketchbook tokens overrides list` |
| `spec/tokens/foundation/*` | The foundation layer. | Generated | `npm run tokens:generate` |

> **Warning** Do not rename a semantic token by hand. A manual rename breaks contracts and stories without an error.

## Docs and vocabulary

| File | Controls | Owner | Change with |
| --- | --- | --- | --- |
| `spec/design-docs.json` | The doc shell the design adapters render. | Team | Edit it; checks D3 and T7 verify it |
| `spec/api.json` | Prop, content, state and event names every component speaks. | Team | Edit it; check A1 verifies contracts |
| `spec/decisions/DECISIONS.md` | One entry per design-system decision. | Team | Add an entry; supersede, never edit |
| `docs/simplicity-debt.md` | Shortcuts taken on purpose. | Team | `hammock` skill, `debt` mode |

## Ownership for upgrades

`harness/manifest.json` splits files into groups. `sketchbook upgrade` replaces the harness group and only reports on the others.

| Group | Paths (abridged) |
| --- | --- |
| `harness` | `harness/**`, `.claude/skills/**`, `.claude/rules/**`, `.claude/commands/**`, `scripts/**`, `docs/cli.md` |
| `team` | `spec/**`, `src/**`, `brands/**`, `brand.config.json`, `harness.config.json`, `playwright/tests/**`, `docs/**` |
| `shared` | `package.json`, `tsconfig.json`, `.storybook/**`, `CLAUDE.md`, `README.md` |

## Next steps

- [Foundations and tokens](/concepts/foundations-and-tokens/): the layers these files feed.
- [Rules](/reference/rules/): the rules that protect them.

Source of truth: `brand.config.json`, `harness.config.json`, `harness/manifest.json`, `spec/registry.json`, `spec/tokens/`, `spec/design-docs.json`, `spec/api.json`, `CLAUDE.md`
