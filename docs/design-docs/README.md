# Design docs: how Sketchbook documents itself in a design tool

Use this guide to find where Sketchbook gets the pages, tokens, and copy that appear in a design file. Change the source, then render the design file with your adapter. To set up Figma, follow the [design file guide](https://sketchbook-docs.vercel.app/concepts/design-file/).

## The four rules

1. **One skeleton.** Every doc is `Header + Body` inside one root container (`anatomy.md`).
2. **Layout is declared, never dragged.** Every region is a stack or a row with a gap, padding and a sizing rule. No absolute positions except the pattern inside the Header.
3. **Tokens, never literals.** Every fill, stroke, text color, radius, gap and padding names a semantic token from `spec/tokens/interface.json`. A hex or a px value in a doc is a bug (it will not re-theme).
4. **The repo is the source, built through the harness.** Content comes from `spec/` (contracts, tokens, decisions) and the doc shell itself is data in `spec/design-docs.json` (regions, token roles, spans, header pattern). Renderers (`harness/adapters/design/<tool>/`) read these through the harness libraries (`harness/lib/tokens.mts`, the standards resolver) and never type a value or a sentence. A doc in a design file is an output; edit the spec and re-render. These markdown files are the readable, tool-agnostic view of the same shell; a check keeps their token names real.

## File map

| File | Answers |
| --- | --- |
| `anatomy.md` | What does one doc look like, region by region? |
| `pages.md` | How is a whole design file organised and named? |
| `foundations.md` | How is each foundation (color, type, spacing, radius, elevation) shown? |
| `components.md` | How is a component documented, from which sources, and how is it read without a design tool (`sketchbook docs <component>`)? |
| `patterns.md` | How is a pattern kit drawn from its layout, and how is it checked against Storybook (`sketchbook sync compare`)? |
| `themes.md` | Which axes switch (mode, shape, density) and how to prove they work? |
| `tool-mapping.md` | What is each concept called in Figma and code, and the Figma rules for collections and modes? |
| `reference-android-kit.md` | Where do the proportions come from (the Android UI Kit we studied)? |

## Notation used in the wireframes

```text
+-- Name (layout) ---------------------+   a named region; the line says how it lays out
| child                                |
+--------------------------------------+

layout := stack(v|h)  gap=<token>  pad=<token|token,token>  w=fill|hug|span a/b|docs.width  h=fill|hug
          grid cols=layout.grid.columns  gutter=layout.grid.gutter
fill=<color token>  stroke=<color token> <border-width token>  radius=<radius token>
text=<text-style role> <color token>
```

- `v` = children top to bottom, `h` = left to right.
- `fill` (width/height) = take the remaining space; `hug` = shrink to content; `span a/b` = a fraction of the grid columns; `docs.width` = the one file-level width from `harness.config.json`. There is no "fixed px" form on purpose.
- A region without a `layout` is a leaf (text, shape, instance).
- Wraps: `wrap` after `h` lets a row flow onto new lines.
- `{field}` in text is filled from the spec (for example `{contract.summary}`).

## Using this with a new tool

1. Read `tool-mapping.md` and note any limit listed for your tool.
2. Create the token structure first (`themes.md`): sets/collections, then the Mode, Shape and Density switches.
3. Build the doc shell once (`anatomy.md`), then pages (`pages.md`), then fill each page from its file.
4. Prove it (`themes.md`, "Proof"): cycle every combination and compare resolved values with the spec.
5. Add what you learned to the "known limits" of your tool in `tool-mapping.md`.
