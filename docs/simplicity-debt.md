# Simplicity debt

Open verification, deliberate tradeoffs, and work already closed. A tradeoff is not work owed unless its revisit condition is met.

## Open verification

- **Claude hooks in adopted projects (SB-0099).** Starting Claude Code in the design-system folder remains the supported setup. [Claude Code documents](https://code.claude.com/docs/en/permissions) that `/cd` can activate destination hooks while `CLAUDE_PROJECT_DIR` still points at the starting project. Sketchbook's guards use that variable. Before recommending `/cd` from an app root, verify that a generated-file edit and a settled-decision edit are guarded at the intended paths in an adopted project.

## Deliberate tradeoffs

| Date | File | Simplification | Why | Revisit when |
| --- | --- | --- | --- | --- |
| 2026-11-08 | harness/lib/schema.mts | Small JSON Schema subset instead of Ajv | Checks stay plain Node + PostCSS (D-013) | A schema needs a keyword the subset lacks |

| 2026-11-09 | harness/commands/upgrade.mts | The upstream harness/manifest.json is never written; its glob differences are only listed for a hand merge (SB-0070) | Ownership rules must not come from the side being installed | Upstream manifests change often enough that hand merges are a burden |
| 2026-11-08 | harness/commands/brand.mts | `brand use --yes` clears overrides instead of saving them per brand (SB-0062) | Brand files share the brand.config schema, which has no overrides | Teams need overrides on several brands |
| 2026-11-11 | harness/templates/move-to-claude-INSTALL.md | The Claude layer is installed by Claude following a written procedure, not by a CLI command (SB-0099) | Merging into a team's existing .claude/ (their own skills, hooks, permissions) needs judgment and questions a script cannot ask | Installs go wrong in practice, or the merge rules turn out to be mechanical |
| 2026-11-14 | harness/cli/commands | No `sketchbook brief` orientation command (SB-0114) | Agents read the specs directly, and [round 5](research/value-benchmark/ROUND5.md) met the context target without a new command | A benchmark shows orientation calls (help, status, list, docs) taking a large share of UI or QA runs |
| 2026-11-14 | .claude/settings.json | No Sketchbook-specific output limit for test runs (SB-0114) | Claude Code already limits its inline output and documents [`bashOutputMaxChars`](https://code.claude.com/docs/en/settings-reference#bashoutputmaxchars) for local tuning | A measured run shows test output dominating context; preserve failure diagnostics if tuning it |
| 2026-11-16 | eslint.config.js | `eslint.config` stays JavaScript (`// @ts-check`, type-checked by `tsconfig.tools.json`) while the other configs are TypeScript (SB-0119) | ESLint 10 loads a `.ts` config only through jiti or the unstable `unstable_native_nodejs_ts_config` flag, even on a Node that strips types | ESLint loads TypeScript configs natively by default, then convert it to `eslint.config.ts` |

## Closed

- 2026-11-21 · Installed the published `@usesketchbook/cli@0.4.0` from npm, ran `init --start library` without `--engine`, and verified the generated project resolved `0.4.0` and passed `npm run check` (SB-0099).
- 2026-11-21 · Existing-project `init --start` stages removals, installs, brand changes, and checks before publishing. Regression tests cover a failure after removal and a failed staged check without losing existing edits (SB-0060).
- 2026-11-21 · `verify` reruns the Button size and Accordion/Collapsible motion specs with alternate semantic token values. A default-only `0.2s` assertion passed the default project and failed the alternate project with `0.37s`. This is focused coverage, not a ban on valid numeric fixtures (SB-0054, SB-0067).
- 2026-11-21 · Source-repo `kits remove` warns about its retained restore copy without treating it as a failed removal. Remove → add is tested; standalone G1 still requires the source catalog to match, and unrelated drift still fails the command.
- 2026-11-21 · Reinstalling from the local source catalog no longer replays that project's token renames on already-updated files. A regression test reuses a renamed-away token; downstream installs still replay their own rename history.
- 2026-11-21 · Removed the production audit exception after [GitHub withdrew GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) and npm's production audit reported zero vulnerabilities. `verify` still fails on high and critical production advisories.
