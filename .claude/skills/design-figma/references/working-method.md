# Working method: what a good Figma output is

A good output is not "the file looks like ours". The file is always just the output. A good output is a file **built from the agnostic framework through the Figma adapter**, so that anyone can regenerate it, read it back and trust it. The person may bring their own file, start from an empty one, or use ours; the method below is the same in every case, only the starting state differs.

The reference run is the component docs on branch `worktree-component-docs` (SB-0089 to SB-0093): 35 docs on 7 pages, 43 library sets, a Theme matrix and a Guide, reviewed in five rounds. The rounds are summarized at the end as worked examples; `screenshots/` shows the approved result, page by page with close-ups (its README says what to look for).

## 1. Where things come from

```text
spec (contracts, tokens, spec/api.json, spec/design-docs.json)
  -> tool-neutral model / blueprint      harness/lib/design/*.mts   (also `sketchbook docs <c> --json`)
  -> Figma adapter                       harness/adapters/design/figma/*.mts
  -> generated scripts                   generated/design/figma/**  (never edited by hand)
  -> pasted with use_figma               one script per call
  -> read back                           *-verify.js, verify-all.js, scans, screenshots
```

- The design is specified once, tool-neutral: `docs/design-docs/` (ASCII wireframes, the readable view) and `spec/design-docs.json` (the shell the adapters read). A rule that only exists in Figma, or only in the adapter, is not done: write it in the ASCII spec too, so the CLI (`sketchbook docs`) and any other adapter render the same thing.
- Every size, color, radius and gap is a token name in the spec, bound to a variable in the file. No literal pixel values except the doc width (`adapters.design.docs.width`).
- What the person sees in Figma is the third copy of a decision (spec, blueprint, file). Change the first one.

## 2. Starting points

| Start | What changes | What stays |
|---|---|---|
| The person's own file | Set `adapters.design.file`; `sync pages` creates and renames the pages it needs and never deletes; the person's own pages stay as `kept`. Ask before touching any page or node that the scripts did not create. | Variables are upserted by name; a variable whose type differs is reported, never recreated. |
| An empty file | `sync pages`, then tokens, styles, foundations, library, docs, theme matrix, in that order (each step reads what the previous one drew). | Same scripts, same verify. |
| Our reference file | Nothing special: it is one more output of the same spec. Never copy node ids, positions or names from it into the spec. | |

Check the plan first (modes per collection) and stop with a plain explanation if the file cannot hold the collections.

## 3. The loop, per batch

1. **Generate**: `sketchbook sync <target> [batch]`. Read the "Next" line it prints.
2. **Paste exactly**: the file's content verbatim as `use_figma` code, one call at a time, in file order. Checksummed scripts refuse an altered paste. Never hand pasting to a sub-agent.
3. **Read back**: run the matching verify script (read-only). `ok: true` with no problems, or stop.
4. **Look**: screenshot the result and check it by eye. A read-back proves structure, not that it looks right (a cropped example passed every structural check).
5. **Record**: `sync stamp <stage> <names>`, `sync progress`, commit.
6. **Review**: pilot one batch, stop for the person's review, apply the feedback (section 4), then run the remaining batches without stopping and review at the end.

Read-only scans and writes to different pages can run in parallel (one call per page); writes to the same page never.

## 4. Feedback goes to the source, never to the canvas

For every remark from a review:

1. Find the cause in the source: the spec (`spec/design-docs.json`, a contract, `spec/api.json`), the recipe (`harness/lib/design/recipes*.mts`) or the adapter runtime. A fix made only in Figma is lost at the next sync.
2. Fix it there, write the rule in the ASCII spec (`docs/design-docs/`), and add a test that fails without the fix (FG tests in `harness/test/design.test.mts`).
3. Add a guard to the read-back when the defect class can come back (the library verify reports content overflowing its variant since SB-0091).
4. Regenerate every affected script (check G1 fails otherwise).
5. Apply to the file, either by re-running the generated scripts, or, when that means repainting dozens of docs for a small change, by an in-place patch that produces **exactly** what the regenerated scripts would. Prove it: diff the old and new script configs (only the intended fields changed), patch, then run the generated verify. Say in the report which one you did.
6. Record a decision (`spec/decisions/DECISIONS.md`; accepted ones are read-only, so add a new one) and update the project memory.
7. Fix the whole class, not the instance: after the Pagination crop, every page, the Theme matrix and the Library were scanned for the same defect.

## 5. Quality bar (what reviews have rejected)

- **No cropped or overflowing examples.** A component root hugs its content unless its content reflows to a fixed width; an empty slot fills its parent; a matrix cell is sized for the widest variant at the widest density; nothing spills into the next cell. Scan instances against their cells and their own frames after every batch.
- **Concentric corners on containers.** A rounded container inside another has the smaller radius; outer = inner + the inset between them when a token pair adds up (Doc `radius.large` = Header `radius.small` + `space.inset.sm`), otherwise one radius step smaller per level (anatomy tree). Containers only: pills, swatches and logos keep their radius. Content never touches the edge of a rounded parent.
- **A shared file leaks nothing.** No repo paths, folder names or internal names in the file; the header line is a fixed label ("Auto-generated from the agnostic framework"). The paths stay in the blueprint for local tools. Never name the in-house design system anywhere in the repo.
- **No sync status in the file.** The Guide is static orientation: no date and no hash, so it never reads as stale. Sync state lives in `sketchbook status` and `docs/design-docs/progress.md`.
- **Pages named by role** ("Actions", "Text controls"), never by build order ("Core"); a component sits on the page of what it does.
- **One doc per component**, element sets inside their component's doc; variants as a Variants grid (look axes at rest) plus a States grid; content top-aligned in grid cells; no double container (the outermost anatomy node is the container).
- **Accessibility shown as real source**, with the attributes highlighted by a token (`code.highlight`) in every renderer, including the CLI.
- **Everything bound**: every value is a variable or style, every drawn 0 is bound to a zero token.

## 6. Safety

- Delete only nodes the scripts created, by exact id, after checking their instances (`getInstancesAsync`). Ask before deleting or reorganizing anything else.
- Never edit a generated script to make it pass; fix the source and regenerate.
- After `finish`, never edit text formatting on a label bound to a text property: Figma shares it across every variant of the set.
- `use_figma` limits: 50,000 characters of code, 48,000 bytes of result. Generators pack and digest to fit; check sizes after any change to the shared runtime (`wc -c generated/design/figma/docs/*.js`).
- A trimmed paste (dropping helpers a script never calls) is acceptable only when the code that runs is the generated code unchanged; say so in the report. Prefer the exact file.

## 7. Worked examples (component docs, five review rounds)

| Remark | Cause found | Source fix | Guard |
|---|---|---|---|
| Anatomy has a double container; accessibility should be real code; pills too tight | Tree drawn inside a card; a11y as key/values; tag padding | Frameless tree, code card with the class members, `tag.padX` | FG26 |
| Highlight accessibility; Inputs spill out of cells; must work from the CLI | No highlight token; fixed-width instances in narrow cells | `code.highlight`, `accent`/`marks` in the blueprint, FILL for wide instances, `sketchbook docs` | FG27, SB-0090 |
| Pagination variant cropped | Fixed 320 root holding 338 of content; matrix cells 360 | Root hugs; ScrollArea slot fills; cells 416 | FG28, overflow in library verify, SB-0091 |
| "Core" page is weird | Batch named by build order | Batch "Actions" (Button, ButtonGroup); Input and Spinner moved by role | SB-0091 |
| Header looks broken; path line leaks; hash unreadable | Header flush with a square doc; source path in the header; stamp hash shown | Top inset, concentric radii, fixed label, last sync date | FG29, SB-0092 |
| Radius rule is for containers only; folder line not needed | Same radius nested in the anatomy tree; Guide listed folders | Radius by depth; line removed | FG29, SB-0093 |

## Patterns: draw from the layout, then prove it against Storybook

A pattern doc is drawn from `src/patterns/<id>/pattern.json` (`docs/design-docs/patterns.md`) and judged against Storybook, not only against its own spec. Order of authority: source data, code (story and CSS), Storybook, the file.

1. Store the draw runtime once in the file (`figma.root.setSharedPluginData('sbk', 'patterns-runtime', ...)`, taken from any `patterns-<id>-<n>.js` after its data line) and run a pattern with only its data line plus a loader that builds an `AsyncFunction` from it. A failed call rolls back, so rerun it whole.
2. `sketchbook sync patterns <id>`, run, then `sketchbook sync compare <id> --url <storybook>` and run the generated `compare-<id>.js` (the same stored-runtime trick works for it).
3. Look at both screenshots at the same width. Fix the layout when the difference is the layout, record a library gap with `sketchbook sync stamp note` when it is not, and fix the library in place only.
4. `sketchbook sync compare --ingest <dir>` writes `docs/design-docs/parity.md`; `sync stamp doc|checked <id>`.

Rule and the failures behind it: `rule:figma-fidelity`.
