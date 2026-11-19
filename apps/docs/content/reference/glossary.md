---
title: "Glossary"
description: "The terms Sketchbook uses, in one sentence each, with the page that explains them."
order: 60
---

| Term | Meaning |
| --- | --- |
| Adapter | The tool behind one output, named in `harness.config.json` (`lit`, `style-dictionary`, `storybook`, `playwright`, `figma`). Swapping one does not change the spec ([how it works](/concepts/how-it-works/)). |
| Alias (API) | A registered difference between a name in code and the canonical name in the vocabulary. Visible debt that A1 warns about ([API vocabulary](/concepts/api-vocabulary/)). |
| Brand | A named set of foundation values (`brands/<name>.brand.json`) over one semantic interface ([brands](/guides/brands-and-white-label/)). |
| Check | A deterministic script that can fail, with an id such as T6. `sketchbook check` runs all of them ([check list](/reference/checks/)). |
| Component token | A token a single component owns (`--sb-<component>-*`); component CSS may use only these and private `--_*` properties ([foundations and tokens](/concepts/foundations-and-tokens/)). |
| Contract | A component's spec: `contract.json` (structured) and `contract.md` (prose). The source of truth for its API, tokens and accessibility ([contracts](/concepts/contracts/)). |
| Design file | The Figma file the design adapter writes variables, styles, docs and library components to ([design file](/concepts/design-file/)). |
| Foundation | A base layer of values, such as color, type, spacing, radius, elevation or motion, set in `brand.config.json` as a preset or custom values. |
| Harness | The generators, checks, gates and CLI that keep the spec and every output in step. The component library is one output of it. |
| Harness-owned | A file `sketchbook upgrade` replaces. Team-owned files are only reported, and shared ones are never touched (`harness/manifest.json`). |
| Kit | A page template (sign-in, settings, data table, dashboard) built only from components and semantic tokens (`sketchbook kits`). |
| Override | A hand edit to a foundation token, kept but flagged: `sketchbook check` exits 2 until it is resolved into `brand.config.json` ([troubleshooting](/guides/troubleshooting/#check-exits-2)). |
| Preset | A named standard value set for one foundation family, such as `grid-4` for spacing (`sketchbook presets`). |
| Propagate | Carry a foundation or harness change to every output: tokens, CSS, Storybook, docs, the design file (`sketchbook propagate`). |
| Realization | A contract's description of how it is built on one platform (web, design file), with the places it deviates from the reference listed as drift ([contract format](/reference/contract-format/)). |
| Semantic token | A token that says what a value means (`color.primary`, `radius.control`), per mode. Team-owned; components depend on it, so renames go through `sketchbook tokens rename`. |
| Stamp | A record that a design-file sync step was applied (`sketchbook sync stamp`), so the next sync writes only what changed. |
| Starter | The content a new project begins with: `library`, `library+kits`, `pick`, `foundations`, `blank`, `import` or `from-codebase` (`sketchbook init --start`). |
| Status | A component's lifecycle step: `draft`, `beta`, `stable` and others, each needing evidence that check R1 reads ([lifecycle](/reference/contract-format/#lifecycle-statuses)). |
