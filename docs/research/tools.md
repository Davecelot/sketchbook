# Tools for building design systems

**Answer.** Sketchbook should not try to replace these tools; it should sit on the open formats they share. The pattern across all of them: tokens live in a plain-text file (the W3C-style DTCG JSON with `$value` / `$type`), a build step turns that file into CSS and other outputs, and a design tool (Figma, Penpot) reads or writes the same file. If Sketchbook's spec exports and imports DTCG JSON, it can plug into Style Dictionary, Terrazzo, Tokens Studio, Penpot and Leonardo without special work. Copy-in registries and web-component libraries show two ways to hand over components; Sketchbook's generated native Web Components are closest to the "copy into your repo" model.

As of: 2026-11-08. Nothing here was run hands-on; every statement comes from the pages listed under Sources (fetched summaries, not full reads), and gaps are flagged.

## Overview table

| Tool | What it does | Input | Output | How a team edits foundations | Sketchbook takes |
|---|---|---|---|---|---|
| Style Dictionary | Token build pipeline (parsers, transforms, formats, actions) | Token JSON; v4 has first-class DTCG support (full 2025.10 support planned for v5) | Any format via hooks (CSS, JS, native...) | Edit JSON, rebuild | Treat it as the default "compile" target; keep our spec DTCG-shaped |
| Tokens Studio | Figma plugin for tokens, themes, sets | Tokens in file, Git (GitHub/GitLab/Bitbucket/Azure DevOps), cloud, URL | DTCG or legacy JSON; Figma variables/styles; Style Dictionary pipeline | Designers edit in the plugin; sync to Git | Import/export path for designers; Git as sync |
| Terrazzo (was Cobalt) | DTCG-native token CLI with plugins and linting | DTCG JSON (multiple files via resolvers, `tz bundle`) | CSS, Sass, JS/TS, Tailwind, Swift, Vanilla Extract, Storybook integration | Edit JSON, `tz build` / `tz lint` / `tz check` | Validation and lint step; `check` against DTCG is a model for our own validator |
| Specify | Token hub syncing Figma, JSON, Tokens Studio to code and tools | Figma Styles/Variables, Tokens Studio, JSON | CSS vars, Tailwind, Flutter etc. via open parsers; REST/CLI | Edit in source tool, sync | Cautionary tale: its site shows an "End of Specify" banner, so avoid depending on a hosted hub |
| Material Theme Builder | Generates a Material color scheme from a source color | (Page did not load; not verified) | | | See Material 3 notes in foundations file |
| Radix Colors | Fixed 12-step color scales with light and dark twins | Pick a scale by name | CSS vars (`--blue-4`) or JS objects | Choose scales, don't hand-edit steps | Steal the step-purpose table |
| Adobe Leonardo | Generates swatches from target contrast ratios | Colors, contrast targets (or lightness), color space, theme controls | SVG, CSS custom properties, W3C-style design tokens, `@adobe/leonardo-contrast-colors` params | Change targets, regenerate | Contrast-driven ramp method as a preset |
| oklch.com | OKLCH picker/converter | HEX/RGB/HSL or sliders (L, C, H, alpha) | OKLCH value plus P3 and sRGB fallback | Eyeball and copy | Always emit sRGB fallback beside P3 |
| Huetone | Contrast-aware palette editor | Page returned only a title; not verified | | | Unverified |
| Utopia | Fluid type/space method plus calculators | Min and max viewport, base size, ratio at each end (example 360px/18/1.2 and 1240px/20/1.25) | Small and large scales the browser interpolates between | Change the 6-ish inputs | Offer "fluid" as a type/space mode with these inputs |
| Modular Scale | Ratio calculator | Base(s) and ratio(s) | List of sizes | Pick base and ratio | Ship the named ratios list |
| zeroheight | Docs platform; syncs Figma tokens, compares brands/modes, pushes to code; has an MCP | Figma files | Docs site, code delivery | Doc editors + Figma sync | Docs generated from spec; an MCP-readable system |
| Supernova | Docs + token sync + code pipelines opening PRs; filtered MCP servers | Figma, tokens | CSS, Style Dictionary files, PRs | Edit in Figma/platform; pipelines open PRs | "Change spec, open a PR" workflow |
| Knapsack | Feeds design-system context to AI tools and measures conformance | GitHub, Figma, Jira, Supernova, Storybook | Fidelity/quality/cost measures | n/a (ingests, doesn't author) | Conformance check idea: does generated UI use the tokens? |
| Storybook | Isolated component workshop; stories as ES modules (CSF); web components supported | Story files | Dev UI, autodocs | Edit stories | Our Storybook layer; use `upgrade` + automigrations as the upgrade model |
| Penpot tokens | Native tokens: sets, themes, JSON import/export | DTCG-style JSON (`$value`, `$type`) | Applied to layers | Edit in Tokens panel or import JSON | Our design target; see below |
| Figma variables | Collections with modes, aliases, scoping | Color, number, string, boolean | In-file | Edit in Figma | Mapping target for the from-design-file starter |
| Open Props | Ready-made CSS custom properties | n/a | CSS, PostCSS, JS, JSON tokens, Figma token files, Style Dictionary output, web-component versions | Override variables | Good "foundations" starter reference |
| Panda CSS presets | Reusable config merged before yours | Preset object | Tokens, recipes, utilities (no components) | Override in your config; preset uses `extend` | Layered override model |
| Tailwind v4 theme | `@theme` CSS variables that also create utilities | CSS | Utilities + variables | Edit CSS; share as a CSS file/package | Namespace conventions; shared theme as plain CSS |
| shadcn registry/CLI | Distributes components, hooks, pages, config via CLI | Registry items | Files copied into your repo | You own the copy; `--diff`, `--overwrite`, `eject` | Copy-in model with diff |
| Web Awesome | Web-component library, swappable themes | n/a | `<wa-button>` etc. | Switch theme | Competitor/peer for the "library" starter |
| Spectrum Web Components | Adobe's system as Lit-based elements | n/a | Custom elements | Theme and tokens tools | Peer |
| Carbon Web Components | IBM's system as elements | n/a | `<cds-*>` | Custom styling guide | Peer; v3 changes registration (see below) |
| Lion | Unstyled, white-label Lit components | n/a | Base components to extend | Subclass and style | Closest to "white-label base" |

## Short notes

**Style Dictionary.** Hooks (parsers, preprocessors, transforms, transform groups, formats, actions) are its extension model. It ships a converter from old `value/type` keys to `$value/$type`, but it does not translate type names such as `size` to `dimension`. Takes: keep Sketchbook tokens in DTCG so this converter is never needed.

**Tokens Studio.** The most common designer-facing editor. Themes and multi-file sync are Pro features. Its Penpot support could not be confirmed. Takes: be able to read its DTCG export.

**Terrazzo.** `npx tz init` can start from an existing open-source system. Takes: our "pick" starter does the same idea.

**Leonardo, Radix, OKLCH tools.** Three ramp philosophies: contrast-targeted (Leonardo), hand-tuned fixed steps with defined jobs (Radix), and perceptual lightness/chroma/hue math (oklch.com). Tailwind v4 itself now stores its palette in OKLCH.

**Utopia.** Interpolates between two scales instead of jumping at breakpoints. It is a method, not an installable.

**Penpot tokens.** Types: border radius, color, dimension, opacity, rotation, sizing, spacing, stroke width, number, shadow, typography (with font family, size, weight, letter spacing, case, decoration). Values can reference others (`{name}`) and use math. Sets stack (lower overrides upper); themes switch sets, grouped so one is active per group. Import takes one JSON, a ZIP, or a multi-file folder (`$themes.json`, `$metadata.json`); in a single file the top-level keys are set names. Tokens apply to layers, not groups. Takes: emit exactly this shape for the Penpot step. Note the shadow and typography composites; check our exporter against them.

**Copy-in vs package vs web-component library.** shadcn-style copy-in gives ownership and local edits, with `add --diff` to see upstream changes and an irreversible `eject` for the shared stylesheet. Packages (Carbon, Spectrum) give updates but make local edits awkward; Carbon's web components v3 will stop registering elements on import, a breaking change that shows why upgrade notes matter. Lion is deliberately unstyled so each team supplies its own look. Sketchbook generating native Web Components into the user's repo is the copy-in model with a spec as the real source.

**Storybook.** `storybook upgrade` moves one major at a time, runs automigrations (mostly touching `.storybook` and story/MDX files) and a doctor check. The page does not mention codemods.

## What Sketchbook should do about interoperability

1. Source of truth: spec file exported as DTCG JSON (+ themes file).
2. Compile via Style Dictionary or Terrazzo; do not write a third compiler.
3. Validate on every save (Terrazzo-style `check`, `lint`).
4. Export Penpot-shaped JSON and Figma-variable mapping.
5. Offer Leonardo-style contrast targets as one way to generate color ramps.

## Not verified

Material Theme Builder and Huetone pages returned only titles. Web Awesome's theming mechanism and Shoelace lineage were not confirmed. Shadcn `registry.json` schema was not read. Specify's discontinuation is inferred from a banner.

## Sources (pages opened)
- https://styledictionary.com/info/dtcg/
- https://docs.tokens.studio/
- https://terrazzo.app/docs/
- https://www.specifyapp.com/
- https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale
- https://www.radix-ui.com/colors/docs/overview/usage
- https://leonardocolor.io/
- https://oklch.com/
- https://utopia.fyi/
- https://www.modularscale.com/
- https://zeroheight.com/
- https://www.supernova.io/
- https://www.knapsack.cloud/
- https://storybook.js.org/docs/get-started/why-storybook
- https://storybook.js.org/docs/releases/upgrading
- https://help.penpot.app/user-guide/design-systems/design-tokens/
- https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma
- https://open-props.style/
- https://panda-css.com/docs/customization/presets
- https://tailwindcss.com/docs/theme
- https://ui.shadcn.com/docs/registry
- https://ui.shadcn.com/docs/cli
- https://webawesome.com/docs/
- https://opensource.adobe.com/spectrum-web-components/
- https://github.com/carbon-design-system/carbon/tree/main/packages/web-components
- https://lion.js.org/
- Also attempted (title-only, not cited): m3.material.io color page, huetone.ardov.me
