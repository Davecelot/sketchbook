# Anatomy of one doc

Every doc (a foundation, a component, a guide page) is the same shell. This file is the readable view; the machine-readable source is `spec/design-docs.json`, which renderers read (see `README.md`, rule 4). Nothing here is a literal: sizes are tokens, grid spans, or "hug". When the JSON changes, change this file in the same commit (check D3 keeps the token names real).

```text
+-- Doc (stack v, gap=none, w=docs.width, h=hug, fill=color.background, radius=radius.large) --+
|  +-- Top (w=fill, h=hug, pad=space.inset.sm) -- the Header's inset inside the Doc            |
|  +-- Header (clip, w=fill, h=hug, pad=space.inset.spacious, radius=radius.small, ------------+  |
|  |           fill=color.muted)                                                             |  |
|  |                                          . : ,  ,  ( ( (  ((  (((   ((((   (((((        |  |
|  |  +-- Brand (stack h) ---+                 pattern: rings centered on the right edge,    |  |
|  |  | [logo: brand.mark]   |                 stroke=color.primary, strong at the right,    |  |
|  |  +----------------------+                 fading out to the left (absolute, clipped)    |  |
|  |  +-- Title (stack v, gap=space.stack.lg, w=span 2/3) -----------------------------------+ |  |
|  |  | Name        text=heading-1  color.foreground                                       | |  |
|  |  | Link        text=lead       color.primary      header.link.label (fixed line)      | |  |
|  |  | Definition  text=body       color.muted-foreground   {what it is}                  | |  |
|  |  +------------------------------------------------------------------------------------+ |  |
|  +-----------------------------------------------------------------------------------------+  |
|                                                                                              |
|  +-- Body (stack v, gap=space.inset.spacious, pad=space.inset.spacious, w=fill, h=hug) -----+  |
|  |  +-- Section (stack v, gap=space.stack.lg, w=fill, h=hug) -------------------------------+ |  |
|  |  |  SectionTitle  text=heading-3  color.foreground                                    | |  |
|  |  |  +-- Cards (row wrap, gap=layout.grid.gutter, w=fill) -----------------------------+ | |  |
|  |  |  |  +-- InstructionCard ---+  +-- SpecimenCard ----------+  +-- PreviewFrame ----+ | | |  |
|  |  |  |  | span 1/3             |  | span 1/3                 |  | span 1/3           | | | |  |
|  |  |  |  +----------------------+  +--------------------------+  +--------------------+ | | |  |
|  |  |  +---------------------------------------------------------------------------------+ | |  |
|  |  +------------------------------------------------------------------------------------+ |  |
|  +-----------------------------------------------------------------------------------------+  |
+----------------------------------------------------------------------------------------------+
```

## Where every number comes from

| Value | Source (never typed in a renderer) |
| --- | --- |
| Doc width `docs.width` | `harness.config.json` > `adapters.design.docs.width`, the one rendering parameter of the file |
| Columns, gutter | `layout.grid.columns`, `layout.grid.gutter` (brand.config `layoutGrid` preset). Not bound to a gap: a grid gutter is a dimension token and tools bind gaps to spacing tokens, so the renderer reads the resolved value |
| A span such as `1/3` | `span = layout.grid.columns x fraction`; the renderer converts it to a width from the doc width, the body padding and the gutter |
| Padding, gaps | `space.inset.*` and `space.stack.*`. Not density-linked today (only `space.control.*` and `size.control.*` are), so the doc chrome keeps its rhythm while components change with Density |
| Gap between docs on a page | `doc.gap` (`space.inset.spacious`), used only to place docs next to or below each other, never inside a Doc |
| Radii | `radius.large`, `radius.surface`, ... which follow the Shape theme |
| Colors | `color.*` roles, which follow brand and Mode |
| Text | `text-style.<role>` (one composite per `font.size.<role>`) |
| Header height, card height | `hug`: they follow their content |
| Pattern rings | `header.pattern` in `spec/design-docs.json`: color token, stroke token, opacity token, ring count, first radius and step as fractions of the Header height |

## Regions

### Doc
Root container, one per doc, named after the thing it documents (`Button`, `Color`, never `[ds] Button . docs`). Width comes from `docs.width`; height hugs; radius `radius.large`. No gap of its own: Top and Body touch, and the Body padding makes the space. Top holds the Header inset by `space.inset.sm`.

**Nested radius rule:** a rounded layer inside another has the smaller radius: outer = inner + the inset between them, so both curves stay concentric. Doc `radius.large` (14) = Header `radius.small` (6) + `space.inset.sm` (8). Test FG29 resolves the three tokens and fails when the sum breaks. Where no token pair adds up (the anatomy Tree, inset `space.inset.md`), each inner container takes the next smaller radius token, so an outer corner is always the larger one. The rule is for containers only: pills (`radius.pill`), swatches and the logo keep their own radius.

### Header
Cover that names the doc. Always the first child of Top.
- Fill `color.muted`, radius `radius.small`, content clipped to the radius.
- Pattern: one motif only, concentric rings centered on the right edge of the Header, clipped by it. Stroke color `color.primary`, stroke width `border-width.thick`, and the opacity falls off ring by ring (starting at `opacity.pulse`, ending near 0) so the pattern starts at the right and vanishes toward the left, behind the text. A real gradient is not used because a gradient stop cannot be bound to a token, so it would not re-theme. No raster images, no other decoration.
- Title stack: Name, then Link, then Definition, in that order. Name is the only large text on the page. The Link line is the fixed `header.link.label` ("Auto-generated from the agnostic framework"): a shared design file names no repo paths. The source path stays in the blueprint (`link`), which `sketchbook docs <component>` prints locally.
- Brand row: the icon mark (`brand/sketchbook-icon.svg`) as an instance of the `Brand mark` component on the Icon page (`sketchbook sync brand` creates it), at `size.brand.mark` (56). Without the component the renderer falls back to a `color.primary`, `radius.small` square.

### Body
Holds sections. Padding and gap use `space.inset.spacious`. Sections are separated by gap, never by empty frames.

### Section
A stack: an optional SectionTitle (`text=heading-3`, `color.foreground`), then a `Cards` row that wraps. One idea per section. The gap between title and cards is `space.stack.lg`.

### InstructionCard
Reads as a short how-to or rule list.
```text
+-- InstructionCard (stack v, gap=space.stack.lg, pad=space.inset.surface, span 1/3, h=hug) --+
| fill=color.card  stroke=color.border border-width.default  radius=radius.surface           |
|  Title   text=heading-3  color.foreground                                                  |
|  +-- Lines (stack v, gap=space.stack.sm) ------------------------------------------------+ |
|  |  Line   text=body   color.foreground   one text per line; links to its target if any  | |
|  +----------------------------------------------------------------------------------------+ |
+--------------------------------------------------------------------------------------------+
```

### SpecimenCard
Shows one group of samples (a type group, a color ramp row, a variant row). It can sit on a muted surface when the samples need contrast (elevation).
```text
+-- SpecimenCard (stack v, gap=space.stack.lg, pad=space.inset.surface, span 1/1 or 1/3, h=hug) -+
| fill=none (or color.muted when the doc asks for a surface)                                    |
| stroke=color.border border-width.default  radius=radius.surface                               |
|  Title  text=heading-4  color.foreground                                                      |
|  +-- items (row wrap, gap=space.stack.sm) ---------------------------------------------------+ |
|  | [sample][sample][sample] ...   N samples per row, each cell = (inner width - gaps) / N     | |
|  | caption under each sample: token name, then its resolved value or the spec per mode       | |
|  +---------------------------------------------------------------------------------------------+ |
+-----------------------------------------------------------------------------------------------+
```
Sample kinds, sized by tokens (`sample` in the JSON):
```text
swatch   [########]  fill = the color token       height size.media.lg, stroke color.border
radius   [(      )]  corners = the radius token   height size.media.lg, fill color.card, stroke color.border
shadow   [        ]  shadow = the elevation token height size.media.lg, fill color.card, on the muted surface
bar      [####     ] width  = the spacing token   height size.control.xs, fill color.foreground
text     The quick brown fox ...  takes text-style.<role>
```
- Caption: `text=caption`, `color.muted-foreground`, format `{token name} . {resolved value}`, resolved by the harness (`resolve()` in `harness/lib/tokens.mts`), never typed.

### PreviewFrame
A real instance or screen, never a drawing of one. Fill `color.card`, stroke `color.border`, radius `radius.surface`, padding `space.inset.md`. Components are instances of the library component so they re-theme.

### Matrix
The variants of a component as a table, so anyone can read which combinations exist.
```text
+-- Matrix (stack v, gap=space.stack.2xs, fill=color.border, radius=radius.surface, clip, span 1/1) --+
| +-- Header row (row, gap=space.stack.2xs) -----------------------------------------------------+ |
| | [corner]            [column 1]  [column 2]  ...  [column N]                                   | |
| |  {rows axis} / {columns axis}   one head per value of the LAST dimension, fill=color.muted    | |
| +-- Row (row, gap=space.stack.2xs) -------------------------------------------------------------+ |
| | [row head]  [Cell]       [Cell]       [Excluded]     ...                                      | |
| |  value of    instance of   instance of   "not available"                                     | |
| |  the FIRST   the library   the library   fill=color.muted, text=caption color.muted-foreground | |
| |  dimension   component     component                                                          | |
| +------------------------------------------------------------------------------------------------+ |
+----------------------------------------------------------------------------------------------------+
```
- The thin lines are the gaps (`space.stack.2xs`) showing the Matrix fill (`color.border`), so a cell never needs its own stroke.
- Head: `fill=color.muted`, `pad=space.inset.md`, text `control` in `color.foreground`. Corner: text `caption` in `color.muted-foreground`.
- Cell: `fill=color.card`, `pad=space.inset.md`, content centered. It holds a real instance, no caption: the heads say which variant it is.
- Excluded cell: the contract excludes this combination. It keeps its place so rows and columns line up.
- One dimension only (a component with just states): one row, headed by the component name.
- No dimension (a component with one look): a plain PreviewFrame with the one instance.
- Every row has the same height; cells and heads stretch to the tallest. Content sits at the top of its cell, so the rows of one grid line up even when one state is taller (an error message).
- An instance wider than its cell (a field, a slider) takes the cell's width instead of spilling into the next column; narrower ones keep their own width, centered.
- A variant whose fixed width (its own width tokens, paddings and gaps: a dialog on its backdrop, an open sidebar) does not fit the cell wraps the grid: the columns go in bands of as many as fit, each band with its own Header row, so no example is shrunk or cropped. A band with fewer columns shares the full width among them.

### TagGroup and Tag
A category of tokens (or any short facts) as chips, so a long list reads as a few groups.
```text
+-- TagGroup (SpecimenCard, span 1/2) ------------------------------------------+
|  Title  text=heading-4  color.foreground       e.g. "Color", "Spacing"         |
|  +-- items (row wrap, gap=space.stack.sm) ----------------------------------+ |
|  |  (o default.bg  color.primary)  ( default.fg  color.primary-foreground )  | |
|  |  ( outline.border  color.input )  ...                                     | |
|  +--------------------------------------------------------------------------+ |
+--------------------------------------------------------------------------------+

Tag (row, gap=space.stack.xs, pad=space.stack.xs top/bottom and space.stack.md left/right, fill=color.muted, radius=radius.pill, stroke=color.border)
  [dot]  name                      value
   |      text=control             text=caption
   |      color.foreground         color.muted-foreground
   `-- only for color tokens: a circle of size.icon.sm, filled with that same token
```
- Category = the first `shell.tokenGroups` entry whose prefix the token's value starts with (Color, Typography, Spacing, Size, Radius, Border, Focus, Elevation, Motion, Opacity); anything else goes to "Other". Empty categories are not drawn.
- Name = the token without the component prefix; value = what it points to.

### Tree and Node
Where the parts of a component live, as nested boxes: a box contains the parts that live inside it.
```text
Tree (stack v, gap=space.stack.md, span 1/1, no fill, no stroke, no padding)
+-- Node: button  (control) ----------------------------------------------------------------------+
|   note: Native <button> in the shadow root; receives focus and keyboard input.                  |
|   +-- Node: icon-start (icon)(optional)(prop: leadingIcon) -----------------------------------+ |
|   +-- Node: spinner (icon)(optional)(prop: loading) ------------------------------------------+ |
|   +-- Node: label (text)(prop: label) --------------------------------------------------------+ |
+--------------------------------------------------------------------------------------------------+

Node (stack v, gap=space.stack.md, pad=space.inset.md, stroke=color.border,
      radius by depth: radius.surface, radius.control, radius.small, radius.xsmall (deeper stays xsmall))
  fill: color.card at even depth, color.muted at odd depth, so each level reads apart
  Label (row)  Name text=heading-4 color.foreground, then one Tag per fact: role, "optional", "prop: {controlledBy}"
  Note         text=caption color.muted-foreground (the part's notes)
  Children     stack v, gap=space.stack.md: the Nodes of the parts whose parent is this part
```
- The Tree has no frame of its own: the outermost Node is the container, so a part is never boxed twice.
- A component with several top-level parts (no parent) shows them stacked as roots in one Tree.
- The tree is built from the contract's `anatomy` (`name`, `role`, `parent`, `optional`, `controlledBy`, `notes`).

### CodeBlock
Real source code, copied verbatim, never paraphrased. In a component doc there is one block per source file of `src/components/<name>/`, holding every class member that sets a role, `aria-*`, `tabindex` or element internals, so a reader sees how accessibility is actually implemented (a composite sets most of it in its element files). A component that sets none has no block.
```text
+-- CodeBlock (stack v, gap=space.stack.sm, pad=space.inset.md, fill=color.muted, stroke=color.border, radius=radius.surface) --+
|  Title   src/components/button/Button.ts                                                                                |
|   1  protected override render() {                                                                                        |
|   2    const aria = (name: string) => this.getAttribute(name) ?? nothing;                                                 |
|  ...     aria-busy=${this.isBusy ? 'true' : nothing}                                                                      |
+--------------------------------------------------------------------------------------------------------------------------+
Source (row, gap=space.stack.sm):  [Numbers] [Code]
  Numbers  fixed width size.control.xs, color.muted-foreground
  Code     color.foreground, one line per source line, never wrapped (so numbers stay on their line)
           every accessibility attribute (role, aria-*, aria* properties, tabindex) in color.info (code.highlight)
  both use text=control and the design font of font.family.code (monospace)
```
- The contract's accessibility rules are not code: they sit before the block as a two-column table (Rule, Contract): `role`, `name-from` (`accessibleNameSource`), `keyboard.<key>` and `aria.<key>` (split at the first colon when the text starts with a short key). The Rule column is in `color.info` too, so rule and implementation read as one thread.
```text
+-- Table (InstructionCard, span 1/1) ---------------------------------------------------------+
|  Rule (1/5, color.info)   Contract (4/5, color.foreground)                                    |
|  role                     button                                                               |
|  aria.loading             aria-busy="true" and aria-disabled="true"; stays focusable           |
+------------------------------------------------------------------------------------------------+
```
- The highlight is part of the doc, not of a tool: the blueprint carries it (`accent` on a cell, `marks` [line, start, end] on a code card) and every renderer shows it, a design file with `color.info`, the CLI (`sketchbook docs`) with terminal color.

### Callout (optional)
A small row for a warning, a decision or a limit: `fill=color.muted`, a left bar `color.warning` or `color.info`, text `body`.

## Rules

- Name every region as above (`Header`, `Body`, `Section`, `Cards`, `InstructionCard`, `SpecimenCard`, `PreviewFrame`, `Matrix`, `TagGroup`, `Tag`, `Tree`, `Node`, `CodeBlock`) so a tool or script can find and re-render it.
- Order is fixed: Header, then Body. Inside Body: sections in the order given by the page file.
- Text never uses a literal font size. Use the `text-style.<role>` composite (typography token) when the tool has one; otherwise bind family, size, weight and line height to the matching `font.*` tokens.
- Stroke only on cards and samples, `border-width.default`, color `color.border` (the pattern rings are the one exception: `border-width.thick`).
- Shadows are not used in docs; `elevation.*` appears only where a doc teaches elevation.
- Text content (names, definitions, steps, captions) is read from `spec/` (contracts, tokens, decisions) by the harness. A renderer never types a sentence or a value.
- A tool that resizes a container may switch it to a fixed size; set "hug" again after every resize (Figma `resize()` does this).
