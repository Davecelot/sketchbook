# Figma's native variable export: what an importer must handle

Checked 2026-11-09 against an existing, mature pipeline that turns a Figma variable export into CSS. Not built in Sketchbook; this is what `sketchbook tokens import --from figma` would need (today `--from dtcg` reads one DTCG file or a folder of sets).

## The export

- Figma's native "export variables" (2025+): DTCG-shaped (`$type`, `$value`, groups from `/` in names), Figma data in `$extensions["com.figma.*"]`.
- One file per collection and mode, in a folder per collection (`<Collection>/<Mode>.tokens.json`). The mode name is only in the root `$extensions["com.figma.modeName"]`; a one-mode collection says `Mode 1`. No file ties modes together (no `$themes`).
- Aliases are already resolved: `$value` holds the value and the link is in `com.figma.aliasData` (`targetVariableName` with `/`, `targetVariableSetName`). `com.figma.resolvedValue` repeats the value.
- Colors are DTCG 2025 objects: `{ colorSpace, components, alpha, hex }`.
- Numbers carry no unit: `com.figma.scopes` says what they are (`GAP`, `CORNER_RADIUS`, `FONT_SIZE`, `LINE_HEIGHT`, `EFFECT_FLOAT`, `STROKE_FLOAT` are px; `OPACITY` is 0–100; `FONT_STYLE`/`FONT_WEIGHT` is weight; `FONT_FAMILY` is a family). A variable with no scope needs a path rule.
- Also present: `com.figma.variableId` (stable, useful to detect renames), `com.figma.hiddenFromPublishing` (primitives), `$description`.
- Not exported: text and effect styles (composites).

## What an importer has to do

1. Treat each collection folder as a set and each file as a mode; strip the root `$extensions` before merging so the mode name is not read as a token.
2. Re-link aliases from `aliasData` (`A/B/C` -> `{a.b.c}`), resolving the target in the same-named mode of the target collection, else its only mode; warn and keep the resolved value when the target is missing (a partial export).
3. Read `hex` (or `components` + `alpha`) for colors and check `colorSpace`.
4. Turn scopes into DTCG types and units (above); `ALL_SCOPES` is ambiguous and needs a name rule.
5. Map modes to theme axes by configuration (Light/Dark to Mode, presets to Shape or Density); without `$themes` this cannot be inferred safely.
6. Keep a per-mode namespace when one variable differs only by mode, instead of last-wins.
7. Never delete existing sets for collections missing from a partial export.

## Pitfalls the pipeline recorded

- An export with aliases flattened to values breaks dark mode: re-link before building.
- Line heights came out unitless until the `LINE_HEIGHT` scope was mapped to px; only one of three line-height presets was being built.
- A taxonomy rename in Figma silently dropped CSS variables a component used.
- Shadows were only partly tokenized (no blur or alpha-color tokens).
