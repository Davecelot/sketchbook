# Tool mapping

One vocabulary in the spec; the design tool (Figma) names it differently. Add a column when you add a tool.

| Spec concept | Figma | Code (Sketchbook) |
| --- | --- | --- |
| Doc, Header, Body, Section, Card | Frame | `spec/design-docs.json` region |
| stack v / stack h | Frame with auto layout, vertical / horizontal | n/a |
| grid | Frame with auto layout wrap, or a layout grid | `layout.grid.*` |
| hug / fill / fixed | Hug contents / Fill container / Fixed | n/a |
| gap, padding | Auto layout spacing, padding (scope `GAP`) | `space.*` |
| header pattern, absolute child | Child with absolute position | n/a |
| clip | Frame clip content | n/a |
| color token | Variable (COLOR) bound to a fill or stroke paint | `color.*` |
| radius, spacing, size token | Variable (FLOAT) bound to the property | `radius.*`, `space.*`, `size.*` |
| text style | Text style `Text/<Role>`, family, size, weight, line height and letter spacing bound to variables | `text-style.<role>` |
| shadow | Effect style `Elevation/<Step>`, color, offsets, blur and spread bound to variables | `elevation.*` |
| token layer | Variable collections `Primitives - *`, `Semantic - *`, `Components` | `spec/tokens/*`, contract `tokens` |
| theme axis | Variable collection with modes (`Semantic - Color`, `Semantic - Shape`, `Semantic - Density`) | `brand.config.json` |
| theme axis value | Mode of that collection | a preset id |
| library component + variants | Component set, variant properties | contract `variantMatrix` |
| instance | Instance | `<sb-...>` element |
| page | Page | n/a |

## Figma: collections and modes

Built by `sketchbook sync tokens` (`harness/adapters/design/figma/variables.mts`) from the same payload the code build resolves (SB-0076). Collections are named `Layer - Domain`; groups are capitalized and leaves keep the token's words (`space.inset.md` -> `Space/Inset/md`). Every spec token reaches the file (`sync tokens` prints the coverage).

| Collection | Modes (default first) | Holds | Scopes |
| --- | --- | --- | --- |
| `Primitives - Color` | `Value` | the color ramps (`Color/Neutral/500`) | none, hidden from publishing |
| `Primitives - Global` | `Value` | space, size, radius ends, type scale, weights, line heights, letter spacing, border, opacity, duration, easing, z, shadow parts | none, hidden from publishing |
| `Semantic - Color` | `Light`, `Dark` | semantic colors grouped by role: `Color/Background/*`, `Color/Text/*`, `Color/Stroke/*` | the role's: fills, text, strokes |
| `Semantic - Shape` | one per radius preset, the brand's first | `Radius/<role>` and the preset's scale `Radius/Scale/*` | corner radius (scale: none) |
| `Semantic - Density` | one per density preset, the brand's first | the 11 density-linked control sizes, paddings and gaps | width/height, gap |
| `Semantic - Global` | `Value` | space roles, sizes, border widths, focus, opacity, motion, layers, layout, `Elevation/<Step>/*` | by kind (motion, layers: none) |
| `Semantic - Typography` | `Value` | font roles (`Font/Size/body`) and one group per text style (`Body/family`, `Body/line-height` in px) | font family, size, weight, line height, letter spacing |
| `Components` | `Value` | the contract tokens (`Button/radius` -> `Semantic - Shape/Radius/control`) | by kind and role |

Rules (they keep bindings from breaking):
1. **A token lives in one collection.** An axis collection wins over Global and Primitives, so there is never a second copy to drift.
2. **Aliases cross collections and resolve with the node's mode for the target collection.** A component bound to `Components/Button/radius` follows the frame's Shape mode through the alias, so one binding serves all 24 combinations. Never copy a value down a layer.
3. **Upsert by name; never delete and recreate.** Deleting a variable unbinds every node that used it (and breaks files that use the library). The scripts update in place; a retyped variable is reported, not replaced; extra variables are reported by `sync verify`, never deleted by the sync. (The one rebuild, 2026-11-09, ran before anything was bound; SB-0076.)
4. **Names come from token paths.** Rename through `sketchbook tokens rename <old> <new>`, then `sync tokens`; renaming in Figma by hand breaks the link to code.
5. **Modes are matched by name, the default first.** A new collection's first mode is renamed to the brand default; a new preset becomes a new mode; an extra mode is reported, not removed.
6. **Set modes on frames, not on variables.** A frame (or page) picks one mode per collection; unset means the default. Docs leave modes unset; the Theme matrix pins them per frame.
7. **Scopes on every variable, never "all".** Primitives, ratios, font stacks, motion and layers have no scope: they exist for code syntax and verify.
8. **Code syntax is the CSS variable** (`var(--<prefix>-<path>)`, the name `generated/css/tokens.css` uses), so Dev Mode shows the real token; derived pixels show the CSS that computes them (`calc(var(--sb-font-size-body) * var(--sb-font-line-height-body))`).
9. **Text and effect styles bind every field.** A text style's family is a real font (the first non-generic family of the stack, else `adapters.design.fonts`); its line height and letter spacing are the role's ratio and em resolved to pixels.
10. **Never edit a value in Figma.** Change the spec, `sync tokens` (only what changed since the last stamp; `--full` for everything), run the scripts, `sync stamp tokens`, `sync verify`. A hand edit shows up as a D1 mismatch.

## Figma: icons and library components

11. **Icons are components, one set per icon** (`sketchbook sync icons`, from `spec/icons.json`): named `category / name`, a `Size` variant per `size.icon.*` token (`sm`, `default`, `lg`, `xl`), width and height bound to that token, one stroke-only `Vector` bound to `color.foreground`.
12. **Library components are generated from the contract** (`sketchbook sync library <names>`), never drawn by hand: `<name>.build-N.js` builds variants into a temporary frame, `<name>.finish.js` combines them into one component set and wires the properties, `<name>.verify.js` reads the result back against what the registry says it should be. Every look is bound to the contract's own component tokens, text to the text styles, shadows to the effect styles; an icon is an instance of the Icons page, sized by the component's icon-size token.
13. **Axis, value and property names come from the API vocabulary** (`spec/api.json`, `docs/api-standard.md`), not from text in a contract. Variant-type props the registry draws become Title-case axes (`Variant = Primary | Secondary | Tertiary | Ghost`). `State` is the interaction axis (`Rest` plus the states that have tokens: `Hover`, `Focus`, `Press`, `Loading`). Every other look-changing state is its own `False | True` axis (`Disabled`, `Read only`, `Selected`) or `Validation = None | Error`; `Disabled` exists only at `Rest`. A state with no tokens is not drawn. `sketchbook api figma <component>` prints what a component gets.
14. **Content becomes properties:** text `Label text`, a switch plus an icon swap per icon (`Left icon`, `Left icon swap`), `Required`, and one switch per optional text (`Description`). One instance-swap default fits every variant, so icons are always the `Size=default` variant resized by binding.
15. **A script is pasted exactly or not at all.** Each library script starts with a checksum of its data and throws, before writing, if a character differs. Long scripts are split (about 40 variants per build) because they are copied by hand.

## Known limits

### Figma
- Checked 2026-11-09: renaming variant children and `editComponentProperty` renames a whole component set in place (node ids, instances and property wiring survive); Figma lists variant options in the order it first met them.
- Checked 2026-11-09: an instance-swap property's default component is applied to every variant, so a per-size icon variant cannot be the default; size the instance with a bound width and height instead.
- Several modes in one collection need a paid plan; the file must live in that plan's team.
- Variables cannot hold shadows or typography composites: those are styles whose every field is bound to a part variable. Figma binds line height and letter spacing in pixels, so the role's ratio and em are resolved to pixels in a variable of their own.
- A CSS font stack is not a Figma font: the bindable family variable holds a real font; the stack variable keeps the CSS value for code syntax.
- `resize()` makes a frame fixed on both axes: set hug sizing again afterwards.
- Checked 2026-11-09: a variable bound to `opacity` is read as a percent (0.5 renders as 0.5%), so opacity variables hold the spec value × 100 and verify divides back.
- Checked 2026-11-09: an auto-layout frame's stroke takes layout space by default (`strokesIncludedInLayout`); doc boxes turn it off so the token widths add up and sample rows don't wrap.
- Run one `use_figma` script at a time, never in parallel; each returns a report, check it has no errors before the next.
- Checked 2026-11-09: a `use_figma` call takes at most 50,000 characters of code and returns at most 48,000 bytes (a larger result is refused and nothing is committed). The variable scripts are chunked (250 variables per call) and verify returns digests, not values.
- Checked 2026-11-09: 4 modes in one collection worked on this file (Organization plan); 935 variables, 13 text styles and 4 effect styles pushed in 9 calls with no errors. The CSS stack resolved to Inter.
- Checked 2026-11-09: a wrapper frame clips by default and hides an outside focus ring; the library frames turn clipping off. A component's root cannot be a bare text node, so a text-only component (Label) wraps it in a frame.
- A drawn slider has one thumb at the middle with the range filled before it (equal growth either side), and the `Range` property shows a second thumb; the vertical length comes from `vertical-length`. A field draws its text parts only; an input group draws one leading icon addon, the shell and the input.
- Checked 2026-11-09: the formatting of a text whose characters are bound to a TEXT property (decoration, offset) is shared by every variant of the set: underlining one Button label underlined all 220.
- Slots (SB-0086): a content region registered in `spec/api.json` `regions` is drawn as a native slot: one SLOT property per set (`addComponentProperty(name, 'SLOT', '', { description, preferredValues })`), and the region's frame in every variant references it (`componentPropertyReferences.slotContentId`). Checked 2026-11-10: linking a frame turns it into a SLOT node and ties its layer name to the property name (renaming one renames the other), so the layer is named after the slot; it keeps its auto layout, bound variables and sample content; an instance takes any dropped layer into it; nothing inside a slot may be bound to a property, and a slot cannot be the top layer or a grid. Preferred values take a component set's key and are only offered first; no min or max is set.
- Checked 2026-11-10: a stretched absolute layer (a focus ring, the Avatar fallback) can end up flipped vertically after its variant is re-laid out (by combining or by turning a sibling into a slot): its relative transform reads `[[1,0,0],[0,-1,0]]` and it is drawn above the variant while `x`/`y` still read 0. Finish resets any flipped absolute layer over its variant, and verify reports one.
- Exposed nested instances (SB-0085): a nested library instance whose component has properties (a variant axis, or a text, boolean or swap property) is exposed (`isExposedInstance`, set after it is appended to the component) and named after its component with an index among its siblings (`Toggle 1`, `Button 2`), so its properties show in the parent's panel under that name. One without properties (Spinner in Button, Kbd in KbdGroup) stays closed and keeps its part name. Verify reads the exposure back.
- Underline (SB-0084): every text role has an underlined twin text style (`Text/<Role>-underline`, `textDecoration` UNDERLINE) and its own variable group in Semantic - Typography. A variant that underlines its label (Button and Badge link on hover) draws a second text layer, `label-underline`, on the twin style with its own TEXT property ("Underlined label text"); the regular label hides in that variant. The decoration offset cannot be bound to a variable, so `link.underline-offset` stays drift with that reason.
- Auto layout padding cannot depend on whether a child is visible, so the Button padding with an icon (`padding-x-icon`) is not drawn: the icon variants keep the plain padding, and the icon-only sizes have none.
- Checked 2026-11-09: a component's `descriptionMarkdown` keeps `**bold**`, lists and backticks as written, but turns a lone `*` into `*&#32;`, so a description that is read back to compare must not contain one; the generator writes a look-alike character and drops angle brackets.
- Checked 2026-11-09: `sync verify-library` reads every variant back node by node (type, visibility, the variables bound to fill, stroke, stroke weight, radius, padding, gap, size and opacity, the effect and text styles, and the property wiring) and compares a hash with the one built from the contract tokens. A nested library component (a Toggle inside a Toggle Group) shows the bindings it inherits from its own component, so only its type, visibility and the properties set on it are compared. Icon colors are not compared: a swapped icon replaces them, and the placeholder `circle` icon is not a vector, so an icon takes the color its own component binds.
- Checked 2026-11-10: an auto layout with space-between spacing drops a gap bound to a variable (`itemSpacing` becomes auto). A row of a label and an end icon is drawn with the label filling the row and the gap bound instead (Accordion). Verify-all also compares each set's description by checksum, so `sync describe` runs only when one differs.
- Zeros (SB-0081, SB-0082): every 0 padding, gap and corner a frame draws, and the unused sides of a one-sided stroke, are bound to the semantic zeros (`Space/none`, `Radius/square`, `Border-width/none` in Semantic - Global): every generated script (library build and finish, docs, icons, layout) binds the zeros it drew by default (`harness/adapters/design/figma/zero.mjs`); no drawn 0 is an unlinked value. Verify ignores those variables in its lines and fails on a zero left unbound.
- Element sets (SB-0080): an element drawn as its own set is `<component>/<element>` in `sketchbook sync`, listed in `spec/api.json` `sets`. A single-variant set is a plain component and still carries its text and boolean properties. `sync verify-library --ingest` records the read-back and `sync realize` writes each contract's `realizations.design`, where what the file does not draw is listed with its reason (check D4).
- Checked 2026-11-09: a nested instance takes its radii from its own component; the library squares an instance's inner corners by setting those corner radii to 0 on that instance (an override that stops following the radius variable for that corner only). Verify does not compare nested bindings, so these overrides are not checked.
- Checked 2026-11-09: a text style fixes size, line height and weight together, so a text whose styles mix them (the accordion content: body size with the control's line height) takes the closest style, and a spelled-out combination the file has no style for is recorded in the component's contract.md. A monospace family (inline code) has no text style either.
- Checked 2026-11-09: a CSS border is part of the box, so a drawn box with a border takes its stroke inside the layout (`strokesIncludedInLayout`); a transparent border is a stroke at zero opacity, and a one-sided border (blockquote, H2) is one stroke weight with the others at 0.
- Neighbours that overlap by one border width in the styles (button group, toggle group with outline) sit side by side in the drawing: auto layout takes no negative gap from a token.
- A sample size (the width of a separator or a progress bar, the height of a skeleton or a vertical separator, the share a progress fill covers) is not in any contract: the renderer sets it (320px wide, 64px high, 50%), and the registry's layer notes and contract.md say so.
- Checked 2026-11-12: instances made before their component got its content (the `Brand mark` vector was added after the headers had instances of it) can show blank in an already open tab until the instance is reset or hidden and shown. After changing a component's content, recreate its instances (`createInstance()` per use, size re-bound) instead of keeping the old ones; a doc rebuild already does this.
- The `Brand mark` component is not tied to a page by its name: look it up by id or on the page `shell.header.logo.page` names (Icon today, where the team moved it). `sketchbook sync pages` never deletes a page the spec does not name but may move it after the spec's pages.
- Plan by plan (modes, MCP access, REST, libraries): `docs/research/figma-plans.md`.

## Adding a renderer

1. Add `harness/adapters/design/<tool>/` next to the Figma one, reading `spec/design-docs.json` and `harness/lib/design/`.
2. Select it with `harness.config.json` > `adapters.design.tool` (`sketchbook swap`).
3. Keep the stamp and verify contract (`sync stamp`, `sync verify`) so check D1 works for the new tool.
