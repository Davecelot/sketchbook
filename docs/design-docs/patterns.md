# Patterns in the design file

A pattern kit (`src/patterns/<id>/`) is drawn as one doc with a screen per state. The doc, the layout and the parity report are all derived from files in the repo; the design file is an output.

## Order of authority

Source data (`pattern.json`, contracts), then the code (the story and the kit CSS), then Storybook, then the design file. When they differ the design file changes. A layout that contradicts the story or the CSS is a bug in the layout.

## The layout (`pattern.json` `layout`)

```
screen: fill, pad (optional), align
parts:  named trees reused with { use }
states: one tree per state in `states`

node:   stack | row | component | text | use
        stack/row:  gap, pad, fill, radius, wrap, surface, rule, align, width, height
        component:  props (API names), text, show, hide, slots, width, height
        text:       text, style, color, width
align:  start | center | center-x | end | between | top     (row: main axis; stack: cross axis)
width:  hug | fill | { span: [a, b] } of the 12-column grid
height: hug | fill
rule:   a stack with rule: true is a hairline in the border color (a CSS border)
text:   a value such as "66.67%" for a named non-text layer sets its share of the parent's width;
        "layer@end": true right-aligns a text layer and its cell
axes:   extra library axes a component has that the API registry does not name yet, such as {"Active": "2"}
slots:  a slot is shown only when the layout fills it
```

Component names, props and slots must be ones the stories use (check K1); tokens must be semantic.

## Parity

`sketchbook sync compare <id> --url <storybook>` renders every state at 1344 px and records the visible texts with their boxes. The generated `compare-<id>.js` carries that inventory, reads the drawn screens, and returns the differences: texts missing or extra, order, position (the edge that matches the text alignment) and content edges, tolerance 48 px. `--ingest` writes `docs/design-docs/parity.md`.

A difference no layout can express (a library part that lacks a slot, a variant or a count) is a library gap: `sketchbook sync stamp note <pattern> "..."`. Fix it in the library in place, never by rebuilding the set.

## Order of work per pattern

source layout, `sync patterns <id>`, paste, `patterns-verify.js`, `sync compare`, a side-by-side look, `sync stamp doc|checked <id>`, `sync progress`.

## How the scripts are pasted

The runtime that draws a pattern is the same for every doc and is about 28 KB, so it is pasted once and not with every doc. `sync patterns` writes, in this order:

1. `patterns-runtime.js`: stores the runtime in the file as hidden text layers named `Pattern runtime NN` (off canvas on the Patterns page, in chunks of 8,000 characters) and reads them back against a checksum.
2. `patterns-<id>-<n>.js`: one or more parts per pattern, each only its own data (under 24,000 characters). A part reads the stored runtime, checks it against the checksum it carries, and runs it. Parts of one pattern go in order: the first draws the doc, the next ones append sections.
3. `patterns-verify.js`: the read-only read-back.
4. `patterns-runtime-remove.js`: deletes the hidden text, so the design file keeps no code.

Run each with the Figma MCP `use_figma` tool, one call at a time. A part refuses to run when the runtime is missing or was generated from other code, so a stale runtime cannot draw a doc.
