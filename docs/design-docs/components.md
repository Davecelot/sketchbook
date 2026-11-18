# Component docs

One Doc (see `anatomy.md`) per component in `spec/registry.json`, on the Components page of its batch (`spec/design-docs.json` `batches`, `pages.md`). Content is read by the harness from the component's library set (variants), its contract (`spec/components/<name>/contract.json`) and its source (accessibility code); a doc never contains a sentence none of them has. Docs sit side by side, left to right. SB-0089.

```text
+-- Doc "<Component>" ------------------------------------------------------------------------+
| Header   Name {component} . Link header.link.label . Definition {summary}                    |
| Body                                                                                         |
|  Section "Variants"   the look axes at rest (see anatomy.md, Matrix)                         |
|      +------------------+-----------+-----------+-----------+-----------+                     |
|      | Variant          | Medium    | Tiny      | Small     | Icon      |   <- last look axis |
|      +------------------+-----------+-----------+-----------+-----------+                     |
|      | Primary          | [inst]    | [inst]    | [inst]    | [inst]    |                     |
|      | Link             | [inst]    | [inst]    | [inst]    | n/a       |   <- excluded       |
|      +------------------+-----------+-----------+-----------+-----------+                     |
|  Section "States"     one column per state value, only that axis changed from Rest          |
|      | Variant          | Rest      | Hover     | Focus     | Disabled  |                     |
|      | Primary          | [inst]    | [inst]    | [inst]    | [inst]    |                     |
|  Section "Elements"   one PreviewFrame per element set of the component (all its variants)  |
|  Section "Anatomy"                                                                           |
|    Tree: each part one framed box, children inside; role / optional / prop tags              |
|  Section "Accessibility"                                                                     |
|    Table Rule | Contract: role, name-from, keyboard.*, aria.*                                 |
|    CodeBlock per source file: the class members that set role, aria-*, tabindex, verbatim    |
|  Section "Tokens"                                                                            |
|    TagGroup per category, two per row: Color . Typography . Spacing . Size . Radius ...      |
|      (o default.bg  color.primary)  ( default.fg  color.primary-foreground ) ...             |
+----------------------------------------------------------------------------------------------+
```

## Field map

| Doc part | Source |
| --- | --- |
| Name, Definition | contract `component`, `summary` |
| Look axes, state axes, cell names | the library set's axes (`libraryModel` in `harness/lib/design/library.mts`, names from `spec/api.json`). State axes: State, Disabled, Validation, Selected, Indeterminate, Open; every other axis is a look axis |
| Variants grid | first look axis as rows, last as columns, middle ones joined in the row; states at their first value |
| States grid | first look axis as rows (others at their first value); columns Rest, each other `State` value, the non-default value of each other state axis (a False/True axis is headed by its name) |
| Excluded cells | combinations the library set skips (contract `variantMatrix.excludedCombinations`) |
| Elements | `spec/api.json` `sets` of the component |
| Tree | contract `anatomy[]` (`name`, `role`, `parent`, `optional`, `controlledBy`, `notes`) |
| Accessibility table | contract `accessibility` (`role`, `accessibleNameSource`, `keyboard`, `aria`) |
| Accessibility code | `src/components/<name>/*.ts` (not stories, styles or index): class members with `aria-*`, `aria*`, `role`, `tabindex` |
| TagGroups | contract `tokens`, grouped by `shell.tokenGroups` in `spec/design-docs.json` |

## Rules

- With fewer than two look axes, only the States grid is drawn: its Rest column already is the variants. No look axis and no state axis: one PreviewFrame with the one instance.
- A grid keeps its shape: an excluded combination is a visible "not available" cell, never a missing one.
- A grid whose widest variant does not fit its cell wraps its columns into bands, each with its own head row (anatomy.md, Matrix); the verify reads the cells band by band.
- If a field is empty, omit its section or card; never write placeholder text.
- Accessibility code is copied, never paraphrased; a component that sets none has no CodeBlock.
- Tokens are tags in categories, never a plain list. Color tokens carry a dot bound to the component token, so the dot follows the theme.

## Renderers

The doc is one blueprint (`componentDoc` in `harness/lib/design/docs.mts`, tool-neutral) drawn by any renderer:

| Renderer | Command | Output |
| --- | --- | --- |
| Text (terminal, any tool) | `sketchbook docs <component>` | the doc in the notation above: grids with `[x]` and `n/a`, the tree, the Rule/Contract table, the numbered source with accessibility attributes highlighted, the tags |
| Blueprint (any adapter) | `sketchbook docs <component> --json` | the data every renderer reads: sections, cards, cell variant names, marks |
| Figma | `sketchbook sync components <batch>` | the pastes and the read-back below |

A new design tool reads the `--json` blueprint and this folder; nothing in the blueprint names a tool.

## As built (Figma)

- `sketchbook sync components <batch>` writes `generated/design/figma/docs/components-<batch>-N.js` (docs grouped under the paste limit, checksum-guarded) and `components-<batch>-verify.js`, which reads back every grid cell and preview instance by variant name. Then `sketchbook sync stamp doc <names>`.
- Cells hold instances of the sets in the Library page's `Component library` frame, so a doc re-themes with the file's modes.
- The code family is `font.family.code` mapped to a design font (`designFamily`, `harness.config.json` `adapters.design.fonts`, default Roboto Mono), since a CSS stack is not a Figma font.
