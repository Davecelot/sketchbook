# docmd spike: docs site

Tried https://docmd.io (`@docmd/core` 0.9.9, MIT, Node >= 20) as the generator for the Sketchbook docs site. Branch `worktree-docs-site-docmd`.

## What was built

- `docmd.config.json`: source `site/`, output `site-dist/`, `engine: "js"`, SPA on, search on, AI assistant off.
- `assets/css/docs-theme.css`: maps docmd's CSS variables to semantic tokens (`--sb-color-*`, `--sb-radius-md`, `--sb-font-family-sans`). `scripts/docs-assets.mjs` copies `generated/css/tokens.css` and `dist/sketchbook.js` into `assets/` (git-ignored copies).
- `scripts/docs-components.mjs <name>...`: component pages generated from `spec/components/<name>/contract.json` into `site/components/` at the time of the spike (generated pages now live in `site/demo/`; never edited by hand). Done for Badge, Button, Checkbox.
- Scripts: `npm run docs:build`, `npm run docs:dev`.

## Findings

Worked:
- Real `sb-*` elements render inside pages through raw HTML plus `theme.customJs`; they stay upgraded after SPA navigation.
- Light and dark follow the system through the existing token CSS; no docmd theme needed beyond the variable mapping.
- Build is fast (about 0.3 s for 5 pages). docmd's main script is 60 KB on disk, the component bundle 256 KB (not gzipped).
- axe on 5 pages in light and dark: page content clean.

Problems:
- axe `label-content-name-mismatch` (serious) on docmd's own `.docmd-search-trigger`, every page. Needs a template override or an upstream fix.
- docmd honors `.gitignore`, matched against absolute paths. This repo ignores `.claude/worktrees/`, so building inside a worktree produces "0 pages" with no warning. Build from the main checkout, or from a copy outside that path.
- Generated pages must stay tracked for the same reason (ignored files are skipped).
- `docmd init` enables a cloud AI assistant and "Copy Context" UI by default; the assistant is switched off here (`"ai": false`), "Copy Context" is still visible.
- `docmd doctor` reports no config unless `--config` is given, although `build` finds `docmd.config.json`.
- The `@docmd/engine-rust` postinstall script is pending approval; `engine: "js"` avoids it.
- Only ten documented CSS variables; sidebar highlight and some borders keep docmd's own colors.

## Open

- Whether to override the search trigger (template slot) or accept the finding.
- Navigation is hand-listed in the config; generate it when all 35 pages exist.
- Decision record in `spec/decisions/DECISIONS.md` only if the person keeps docmd.

## Outcome: own UI instead of docmd (branch `docs-site-own-ui`)

docmd was dropped on this branch. `scripts/docs-site.mjs` (markdown-it, about 200 lines) builds the same pages into `site-dist/` with its own shell: sidebar, top bar with search and theme switch, table of contents, prev/next, mobile drawer, search dialog (minisearch, built at build time), `llms.txt`. Sources: `site/**/*.md` (generated component pages included), `docs/cli.md` (at the time of the spike `docs/getting-started.md` was also a source; it is no longer published). Shell CSS and JS live in `site/_assets/`; the CSS uses semantic tokens plus layout widths.

Verified with axe on 7 pages, desktop and mobile, light and dark: no violations, no horizontal overflow. The shell fixed the issues the docmd UI had (search button name) and the ones found on the way (collapsed search button name on mobile, focusable scroll regions).

Not done: code highlighting, the other 32 component pages (`npm run docs:components` takes a list), sidebar and search dialog as real Sketchbook components.
