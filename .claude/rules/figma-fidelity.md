---
paths:
  - "harness/adapters/design/**"
  - "docs/design-docs/**"
  - "spec/design-docs.json"
  - ".claude/skills/design-figma/**"
---

# Rule: figma-fidelity

Storybook is the reference; the design file is an output that must look like it. A pattern or a component is not drawn until
`sketchbook sync compare` and a side-by-side look agree with Storybook. A clean structural read-back (`patterns-verify.js`) is
necessary and never enough.

## Failures already made (do not commit them again)

- **Joined groups lost their outer corners.** ButtonGroup and ToggleGroup square the corners that touch a neighbour. When a
  segment is hidden (a ButtonGroup drawn with two buttons, a ToggleGroup with fewer items), the last visible one kept its inner
  square corners on the outside. Outer corners follow the first visible item and are bound to the same radius variable
  (`Button/radius`, `Toggle/radius`), never a literal and never the zero token, or they stay square when the consumer changes
  the radius mode. The pattern runtime does this after every `hide` (`closeGroup`).
- **CSS layout rules were dropped.** Page columns centered at a max width, footers and badges pushed to the end, sidebars
  top-aligned, tab lists hugging the start. Carry them into the layout (`align`: `center-x`, `end`, `top`, `between`; `width`
  as a span) and judge them with the compare tool, not by eye alone.
- **Empty placeholders change the height.** A component with no content in the file (AspectRatio, Progress value, Table cells,
  Item avatar, Alert icon) leaves a gap or a size that Storybook does not have. Record it as a library gap
  (`sync stamp note`) and fix the library in place; do not accept the gap as the look.
- **Measuring with centers.** Figma text boxes stretch to their container; Storybook boxes hug the text. Compare the edge that
  matches the alignment (left, center or right), as `diffInventories` does.
- **Calling it done from read-back.** Verify passing does not mean the page matches. Run the compare script per pattern, look
  at Storybook and Figma screenshots at the same width, then stamp `checked`.

## Order of work per pattern

source layout, `sync patterns <id>`, paste exactly, `patterns-verify.js`, `sync compare <id>` and `--ingest`, side-by-side
screenshots, `sync stamp doc|checked`, `sync progress`.

**Why:** the person reviews the design file against Storybook and treats any difference as a defect in the output; a token that
is bound to the wrong variable also breaks every theme axis (radius, density) the file exists to show.

**Enforcement (manual for now):** `docs/design-docs/parity.md` must show the state as a match, or as only labeled library gaps,
before a pattern is stamped `checked`.
