# Figma plans: what the design-file sync can do on each

Checked 2026-11-09. Sources are linked per row; anything marked *unverified* could not be confirmed on an official page. Re-check before relying on a limit: Figma changed several of these in 2024–2025.

## What the sync needs

The full model (`docs/design-docs/tool-mapping.md`) has six variable collections; three are theme axes with modes: `Mode` 2, `Shape` 4, `Density` 3 (24 combinations), about 935 variables, text and effect styles, and docs pages. Every write and the read-back go through the **Plugin API** (the official MCP `use_figma`, or any tool that runs plugin code). Nothing uses the REST Variables API.

## Matrix (Full seat unless noted)

| | Starter (free) | Professional | Organization | Enterprise |
| --- | --- | --- | --- | --- |
| Modes per collection | 1 (*unverified*: blank in the official table; "paid plans can add modes") | 10 (older sources: 4) | 20 (older: 4) | unlimited with extended collections (older: 40) |
| Variables per collection | 5,000 | 5,000 | 5,000 | 5,000 |
| Extended collections (multi-brand) | no | no | no | yes |
| Publish variables and styles as a library | no | yes | yes | yes |
| Plugin API variables (read/write) | yes, within the mode limit | yes | yes | yes |
| REST Variables API | no | no | no | yes (read: any member; write: Full seat) |
| Official MCP server | no access | 200 calls/day, 10/min | 200/day, 15/min | 600/day, 20/min |
| `use_figma` (remote MCP, write to canvas) | no | yes (Full seat + edit access; Dev seat: drafts only) | yes | yes |
| Code Connect | no | yes (one framework at a time) | yes | yes |

View and Collab seats get 20 MCP calls a month on every plan. `use_figma` is free during its beta and will become usage-based.

Sources: plans table (help.figma.com/hc/en-us/articles/360040328273), variables and collections (help.figma.com/hc/en-us/articles/15145852043927), REST variables (developers.figma.com/docs/rest-api/variables/), MCP access and limits (developers.figma.com/docs/figma-mcp-server/rate-limits-access/, help.figma.com/hc/en-us/articles/39252411778583), mode counts (forum.figma.com, pinned reply "all plans should offer more than 4 variable modes").

## Ways to write the file

| Path | Plan | How | Limits |
| --- | --- | --- | --- |
| Official MCP `use_figma` (what Sketchbook uses) | Professional and up | Remote server runs Plugin API code in the file | 50,000 characters of code and 48,000 bytes of result per call; read calls count against the daily limit |
| figma-console-mcp (open source, github.com/southleft/figma-console-mcp) | any, including Starter | A Desktop Bridge plugin in Figma Desktop talks to a local MCP server over WebSocket; it can run arbitrary plugin code (`figma_execute`) and has variable tools | Figma Desktop must be open with the plugin running; same Plugin API, so the same mode limits apply (*inferred*, the README does not say) |
| Tokens Studio plugin | any | Imports token JSON; themes become modes | Themes (modes) need its paid tier; same Figma mode limits |
| Native variable JSON import/export | announced 2025 (DTCG-aligned export) | | import reported unreliable in 2026 forum threads; *unverified* |

The generated scripts are plain Plugin API code, so they run unchanged through `use_figma` or through figma-console-mcp's execute tool.

## Recommendation per plan

- **Professional, Organization, Enterprise:** the full model as built (6 collections, Mode × Shape × Density modes, library publishing). Use `use_figma`; mind the daily call limit (a full sync is about 10 write calls plus 1 verify). Enterprise adds extended collections, useful for several brands (SB-0047), and the REST Variables API, which Sketchbook does not need.
- **Starter:** no MCP access and one mode per collection. Two choices, both through figma-console-mcp (Figma Desktop):
  1. **Default combination only** (recommended): each axis collection gets one mode, the brand's own preset; switching a look means changing `brand.config.json` and syncing again. Verify then covers one combination. Needs an adapter option (not built; logged in `docs/simplicity-debt.md` when picked up).
  2. **One collection per axis value** (`Shape · Soft`, `Shape · Round` …) with component variables aliasing one of them: switching means re-aliasing, which is a re-sync anyway, so it adds collections without adding live switching. Not recommended.
- **Education:** treat as Professional after checking the mode count on the real account (*unverified*).

## How to tell which plan a file is on

The sync's first write is the `Shape` collection (4 modes). If `addMode` fails, the file is on a one-mode plan: stop and choose a path above. On this repo's file (2026-11-09) it passed.
