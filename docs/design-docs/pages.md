# Pages: how a design file is organised

One design file per brand. Page names are stable so a re-sync updates in place and never duplicates.

```text
File
|-- Guide              cover, how this file works, how to switch themes
|-- ---                separator (empty page, name is three dashes)
|-- Foundations        Color, Typography, Spacing, Radius, Elevation (one Doc each, side by side)
|-- Icons              one component set per icon (spec/icons.json), in a wrapping grid
|-- ---                separator
|-- Components . <batch>  one page per batch (spec/design-docs.json batches), one Doc per component, side by side
|-- ---                separator
|-- Library            the library components themselves (variants as properties), side by side; the Docs show instances
|-- Theme matrix       every library set under the corner combinations of Mode, Shape, Density, plus a Live column
|-- ---                separator
`-- Patterns           one Doc per pattern (src/patterns/<kit>/pattern.json): its states as screens composed of library instances, then the components, landmarks and accessibility
```

Separators keep the three kinds of page apart in the page list: the docs of components, the Library with its Theme matrix, and the Patterns.

A page that is flagged `perBatch` in `spec/design-docs.json` (Components) is split into one page per batch, named `Components . <batch title>` and ordered like the batches. Reason: every operation in a design tool gets slower with the number of shapes already on the page so a page holds a handful of docs, not all of them, and a reader finds a batch by its page name.

**Docs sit side by side, left to right, never one over another or stacked** (every page has `flow: row` in `spec/design-docs.json`; `doc.gap` is the space between two docs). A reader scans a page like a line of text. A tool that cannot lay out pages renders them by placing each Doc to the right of the previous one, keeping a Doc's position when it is re-rendered, and re-packs the row whenever a Doc grows.

## Guide

```text
+-- Page: Guide ----------------------------------------------------------+
|  Doc "{package name}"   Header: definition: brand {name}, edit the source  |
|  Body                                                                    |
|    Section "How this file works"                                         |
|      InstructionCard "Pages"        one line per page of the file        |
|      InstructionCard "Token sets"   set and token counts, set families   |
|    Section "Switch the theme"                                            |
|      InstructionCard "Theme groups" one line per group with its values   |
|      InstructionCard "How"          steps + the number of combinations   |
+--------------------------------------------------------------------------+
```

The Guide is static orientation: it carries no sync date or hash, so it never reads as stale. It is drawn by `sync guide` only, outside the token stamp and check D1; redraw it when pages or theme axes change.

## Foundations

One Doc per foundation, laid out left to right with a fixed gap (`space.inset.spacious`) so they read as a strip. Layouts are in `foundations.md`.

## Icons

The icon library (SB-0077). One grid frame, `Icon library`, wraps one component set per icon of `spec/icons.json`. Each set is named `category / name` (the slash groups icons by category in the assets panel, on purpose) and has one variant per `size.icon.*` token: `Size=sm|default|lg|xl`. A variant is a frame whose width and height are bound to that token, holding one stroke-only `Vector` bound to `color.foreground`. Components take an icon through an instance-swap property and recolor the nested `Vector`. `sketchbook sync icons` writes the scripts (the first one draws a single icon, to check by eye); an icon already on the page is kept.

## Components

One Doc per component, stacked in a column in registry order (`spec/registry.json`). Layout in `components.md`. Components themselves live in the file's library; the Doc shows instances.

## Theme matrix

Layout in `themes.md`. Contains no new components, only instances, so switching a theme re-renders everything.

## Naming

| Thing | Name | Example |
| --- | --- | --- |
| Page | Title case, no prefix | `Components` |
| Separator page | `---` | |
| Doc root | The documented thing | `Button`, `Color` |
| Region | Region name from `anatomy.md` | `Header`, `SpecimenCard` |
| Library component | `<Component>` (variant set), variants named by property values | `Button` / `variant=tertiary, size=small` |
| Token set / collection | `foundation/*`, `semantic/*`, `component/*`, `theme/*` | `theme/shape/round` |

- Never put a tool prefix in a name (`[ds]`, `[sb]`). Ownership is tracked by the sync stamp, not by names.
- Do not name both the shape and the component with a slash path (tools turn slashes into groups and produce `A / A / B`).

## Idempotency

A renderer finds a Doc by page and root name, empties it and rebuilds it. It never edits in place, and it never touches shapes it did not create (anything outside the named Docs).
