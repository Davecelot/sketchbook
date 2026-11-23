---
title: "Check list"
description: "Look up a check by ID and see what it verifies."
order: 30
---

Run `sketchbook check` for the project checks or use `--only <ids>` with a comma-separated list to focus on specific IDs. Use `--maintainer` in the Sketchbook source repository to include the checks for shipped component documentation and current site and Storybook builds. [Read the exit codes](/concepts/checks/#run-the-checks).

## Tokens

| Id | Verifies |
| --- | --- |
| T1 | Token files are valid DTCG |
| T2 | Aliases resolve and respect the layers, one step only |
| T3 | Every semantic token exists in every mode |
| T4 | Component CSS uses its own component tokens, and all of them |
| T5 | No hard-coded values where a token exists; an allowed literal is a warning |
| T6 | Declared color pairs meet contrast in every mode and brand |
| T7 | Interface tokens, brand links and CSS variables used outside components resolve |
| F1 | Foundations follow their declared standard (warnings only) |

## Contracts and components

| Id | Verifies |
| --- | --- |
| C1 | Contracts are valid and match the registry |
| C2 | Contract token references point at real tokens |
| C3 | Code matches its contract: props, parts, slots, events |
| C4 | Required plans have a record, and approvals still cover the current contract and plan (`sketchbook approve`) |
| C5 | Red and green evidence use the same behavior spec and test setup; `ready` requires current green evidence for work tracked test-first (`sketchbook evidence`) |
| A1 | Contracts use the API vocabulary in `spec/api.json` |
| R1 | Registry statuses are backed by evidence (see [Contract format](/reference/contract-format/)) |
| P1 | Component sources use the configured prefix |
| K1 | Patterns use only the system's elements and semantic tokens |
| S1 | Every shipped component has stored screen-reader views, none with an unnamed control, and a keyboard view where its keys change what is announced |

## Outputs and design file

| Id | Verifies |
| --- | --- |
| G1 | Generated files match a fresh rebuild; fix with `npm run generate` |
| D1 | The design file is in step with the spec (offline stamp) |
| D3 | The design-doc shell is complete and names only real tokens |
| D4 | A complete design realization reads back clean |
| O1 | Every output was built from the current foundations (`sketchbook propagate`); with `--maintainer`, the Storybook and docs site builds too, and the docs site sources (`apps/docs/`, `docs/cli.md`, `brand.config.json`) must not have changed since the last build |
| M1 | Maintainer only: every shipped component has a parity audit, a docs site page and example, a design-doc batch, a complete design library realization and a checked design doc page; no demo page shows a contract drafting label |

## Governance

| Id | Verifies |
| --- | --- |
| W1 | White-label: no brand names where they are not allowed |
| X1 | Decision records are complete and referenced decisions exist |
| H1 | The Claude layer loads: skills, briefs and commands are valid, descriptions are at most 400 characters, briefs declare a model, and what is in context every session stays within `contextBudget.alwaysOnBytes` (team-owned in `harness.config.json`; warns at 90%, fails above it; `sketchbook doctor` shows the usage) |
| H2 | Only in the Sketchbook source repo (where `scripts/build-harness.mjs` lives; a project skips it): every `.mjs` under `harness/`, `scripts/` and the Claude hooks is compiled from the `.mts` beside it, or is on the allowlist in `harness/checks/h2-typescript-sources.mts` with its reason |

## Next steps

- [Checks](/concepts/checks/)
- [Quality commands](/cli/quality/)

Source of truth: `harness/checks/run.mts`, `harness/checks/*.mts`, `docs/cli.md`
