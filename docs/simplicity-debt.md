# Simplicity debt

Shortcuts taken on purpose, and when to revisit them (harness format).

| Date | File | Simplification | Why | Revisit when |
| --- | --- | --- | --- | --- |
| 2026-11-08 | harness/lib/schema.mts | Small JSON Schema subset instead of Ajv | Checks stay plain Node + PostCSS (D-013) | A schema needs a keyword the subset lacks |

- 2026-11-08 · No check flags a new hard-coded size or time literal in behavior specs (`'NNpx'`, `'N.Ns'`); a spec can silently re-couple to the default brand. Caught today only by the proof matrix with non-default presets (SB-0054, SB-0067).
| 2026-11-08 | harness/lib/renames.mts | Renames are re-applied on every install, without knowing which renames a catalog unit already contains | Shipped catalogs predate the team's renames | A source repo installs into itself after reusing a renamed-away token name |
| 2026-11-09 | harness/commands/upgrade.mts | The upstream harness/manifest.json is never written; its glob differences are only listed for a hand merge (SB-0070) | Ownership rules must not come from the side being installed | Upstream manifests change often enough that hand merges are a burden |
| 2026-11-08 | harness/commands/brand.mts | `brand use --yes` clears overrides instead of saving them per brand (SB-0062) | Brand files share the brand.config schema, which has no overrides | Teams need overrides on several brands |
| 2026-11-09 | harness/cli/commands/kits.mts | In the catalog source repo `kits remove` exits 1 after removing (G1: "catalogued, but the kit is not installed") until `npm run catalog:build`; the command names that as its next step instead of rebuilding | Rebuilding would drop the catalog's copy, the one `kits add` restores from, so a removal the command calls undoable would no longer be | Kits are removed often in the source repo |
| 2026-11-11 | harness/templates/move-to-claude-INSTALL.md | The Claude layer is installed by Claude following a written procedure, not by a CLI command (SB-0099) | Merging into a team's existing .claude/ (their own skills, hooks, permissions) needs judgment and questions a script cannot ask | Installs go wrong in practice, or the merge rules turn out to be mechanical |
| 2026-11-11 | harness/commands/bootstrap.mts | `init --adopt` keeps the design system in its own folder: in an app repository its hooks fire only in a Claude Code session started in that folder (SB-0099) | Claude Code reads settings and hooks only from the folder a session starts in | Claude Code loads a subfolder's settings, or teams need the hooks from the app root |
| 2026-11-14 | harness/cli/commands | No `sketchbook brief` orientation command (SB-0114) | With the Claude layer installed, round 4 showed agents read the spec files directly and rarely call orientation commands; a new command is surface without measured savings | Benchmark round 5 shows orientation calls (help, status, list, docs) still a large share of UI or QA runs |
| 2026-11-14 | .claude/settings.json | Long test and Playwright output is not capped by a setting or a hook (SB-0114) | The output-cap setting name could not be confirmed against the Claude Code docs; an unknown settings key is worse than none | A run shows test output dominating its tokens, or the setting is confirmed |
| 2026-11-16 | eslint.config.js | `eslint.config` stays JavaScript (`// @ts-check`, type-checked by `tsconfig.tools.json`) while the other configs are TypeScript (SB-0119) | ESLint 10 loads a `.ts` config only through jiti or the unstable `unstable_native_nodejs_ts_config` flag, even on a Node that strips types | ESLint loads TypeScript configs natively by default, then convert it to `eslint.config.ts` |

## Closed

- 2026-11-21 · Installed the published `@usesketchbook/cli@0.4.0` from npm, ran `init --start library` without `--engine`, and verified the generated project resolved `0.4.0` and passed `npm run check` (SB-0099).
- 2026-11-21 · Existing-project `init --start` stages removals, installs, brand changes, and checks before publishing. Regression tests cover a failure after removal and a failed staged check without losing existing edits (SB-0060).
- 2026-11-21 · Removed the production audit exception after [GitHub withdrew GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) and npm's production audit reported zero vulnerabilities. `verify` still fails on high and critical production advisories.
