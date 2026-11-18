# Reference: the Android UI Kit (Community)

Studied on 2026-11-09 in Penpot (file "Android UI Kit (Community)", pages Guide, Styles, Navigation & Settings) and its exports `Styles.pdf` and `Navigation & Settings.pdf`. It is a model of good documentation in Penpot. We copy its structure and proportions, not its content or palette.

## What it does well

```text
Page "Styles"  (a strip of wide Docs, left to right)
+-- Typography ----------------------+  +-- Icons ----+  +-- Color ------------------------...
| Header (radius 48, surface token)   |  | Header      |  | Header (full width)
|   logo, Name (57), Link, Definition |  | ...         |  | Schematic: tonal ramps (rows P S T N NV)
| scale (flex v, pad 70, gap 40)      |  | rows of     |  |            beside role swatches per mode
|   Display  card (r 16, 1px stroke)  |  | icon cards  |  |
|   Headline card ...                 |  +-------------+  +-------------------------------...
|   Title / Label / Body cards        |
+-------------------------------------+

Page "Navigation & Settings"  (one Doc per feature)
+-- Shortcut ------------------------------------------------+
| Header (same shell)                                        |
| Body (row): InstructionCard (r 24)  |  device frame preview |
|   title + numbered steps            |  built from components |
+------------------------------------------------------------+
```

1. **One shell.** Header, then Body, on every Doc. Learning one teaches all.
2. **Layout is flex everywhere.** The text stack in the Header, the card stacks, the rows of previews are all flex layouts with gap and padding. Almost nothing is positioned by hand; only the Header pattern is absolute. (The reference decorates its Headers with colored blobs; we use one fading ring pattern instead, which stays calm on any brand.)
3. **Hierarchy by container.** Cards (stroke or tinted fill, rounded) divide information; the page never shows loose text.
4. **Tokens on everything.** Fills, strokes and text are bound (for example a surface token for the Header, an outline token for card strokes, an on-surface token for text), so the whole kit re-themes (light, dark, three contrast levels, two palettes) by switching a theme.
5. **Real components in previews.** Device frames are made of the library's own components.
6. **Cross-file order.** Guide, separator, Styles, separator, one page per feature area. Separators are empty pages named with dashes.

## Measured values (reference only, not used as literals)

| Element | Measured | Our token |
| --- | --- | --- |
| Header radius | 48 | `radius.large` |
| Instruction card radius | 24 | `radius.surface` |
| Specimen card radius | 16 | `radius.surface` |
| Card padding | 24 | `space.inset.surface` |
| Card gap | 24 | `space.stack.lg` |
| Body padding | 70 | `space.inset.spacious` |
| Body gap | 40 to 80 | `space.inset.spacious` |
| Name text | 57 | `text-style.heading-1` |
| Definition text | 16 | `text-style.body` |
| Header height | about 380 | `hug` |

Where our tokens resolve to different numbers (for example radius 14 vs 48), ours win: the doc then follows the Shape and Density themes instead of staying frozen.
