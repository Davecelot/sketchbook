# Foundations docs

One Doc (see `anatomy.md`) per foundation. Same Header and Body; only the Body sections differ. Every sample binds to its token, and every caption (`{token} . {value}`) is resolved by the harness for the active mode, never typed.

The foundations a renderer can draw are listed in its adapter (`FOUNDATION_PAGES` in `harness/lib/design/verify.mts`); adding a foundation means adding its layout here first.

## Color

```text
+-- Doc "Color" ---------------------------------------------------------------------------+
| Header   Name "Color"   Definition {brand.config color summary}                          |
| Body                                                                                      |
|  Section  (grid, one SpecimenCard per ramp, row label = ramp name)                        |
|   +-- SpecimenCard "primary" (stack h, gap=0) ----------------------------------------+  |
|   | [50][100][200][300][400][500][600][700][800][900][950]   one swatch per ramp step  |  |
|   |  swatch = rectangle fill=<foundation.color.primary.N>   caption below = token name |  |
|   +-------------------------------------------------------------------------------------+  |
|   (same for neutral, danger and any accent in brand.config)                               |
|  Section  "Semantic roles" (grid; one column per mode, columns = brand.config modes)      |
|   +-- SpecimenCard "light" --+  +-- SpecimenCard "dark" --+                               |
|   | background  card  muted  |  | background card muted   |   swatch + role name, in     |
|   | primary  secondary ...   |  | primary ...             |   the order of interface.json |
|   | each = fill color.<role>, text color.<role>-foreground, caption {role} . {hex}        |
|  Section  "Contrast pairs"  from spec/tokens/contrast.json: sample text on fill + ratio   |
+-------------------------------------------------------------------------------------------+
```
- Ramp steps come from the ramp of the brand (`brand.config.json`, color section).
- Roles and modes come from `interface.json` (`in: "modes"`) and `brand.config.json` > `modes`.
- A swatch shows the role bound to the token for the mode that is active; the caption lists each mode's value (read from the spec per mode, so the page proves light and dark at once).

## Typography

```text
+-- Doc "Typography" ----------------------------------------------------------------------+
| Header   Name "Typography"   Definition {font family, scale preset}                       |
| Body                                                                                      |
|  Section  one SpecimenCard per text group, built from the font.size.* roles               |
|   +-- SpecimenCard "heading" ---------------------+   +-- SpecimenCard "body" ------+     |
|   | heading-1   text=heading-1   "{role} . {size}/{line} . {weight}"                |     |
|   | heading-2 ...                                  |   | lead / body / caption ...   |     |
|   +------------------------------------------------+   +-----------------------------+     |
|  Section  InstructionCard "Scale"   {typography preset summary and base size}             |
+-------------------------------------------------------------------------------------------+
```
- Group = role prefix (`heading-*`, `body`, `lead`, `caption`, `control*`, `prose`, `large`), derived from the token names, not listed by hand.
- Each sample uses `text-style.<role>`; the caption reads size, line height and weight from the resolved tokens.

## Spacing

```text
+-- Doc "Spacing" -------------------------------------------------------------------------+
| Body  Section  SpecimenCard "space.stack.*" and "space.inset.*"                           |
|   one row per token:  [bar  w=<token>  h=space.stack.2xs]  caption {token} . {value}      |
|   bar width = the token itself (bound), so density re-sizes the bars live                 |
+-------------------------------------------------------------------------------------------+
```

## Radius

```text
+-- Doc "Radius" --------------------------------------------------------------------------+
| Body  Section  one SpecimenCard per radius.* token (xsmall .. large, control, pill)       |
|   [square sample  radius=<token>  stroke=color.border]  caption {token} . {value}         |
|   The samples change with the Shape theme (see themes.md).                                |
+-------------------------------------------------------------------------------------------+
```

## Elevation

```text
+-- Doc "Elevation" -----------------------------------------------------------------------+
| Body  Section  one SpecimenCard per elevation.* token (xs, sm, md, lg)                    |
|   [card sample  fill=color.card  shadow=<elevation token>]  caption {token}               |
+-------------------------------------------------------------------------------------------+
```

## Not shown as a doc yet

Motion (`motion.*`: duration and easing have no token type in some tools; see `tool-mapping.md`), z-index, opacity, border width, icons. Add each as a Doc when a tool can bind it; until then the Guide page lists them as "in the repo only".
