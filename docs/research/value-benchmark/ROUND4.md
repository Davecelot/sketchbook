# Value benchmark, round 4 (2026-11-12): does naming the CLI change anything, and what is `sb-card-title`

Two follow-ups from [ROUND3.md](ROUND3.md).

## Test 1. A3N: the full harness and CLI, with the CLI named in the prompt

Round 3 left a confound: C (files + CLI) used the CLI in 10 of 10 UI and QA runs, A3 (files + CLI + harness) in 5 of 10 and 0 of 10, but only C's prompt named the CLI. A3N is A3 with the same prompt line C gets (`This folder is a Sketchbook design-system project; npx sketchbook help lists its CLI.`). Same templates, tasks, models (`claude-sonnet-5-5`, `claude-opus-5-5`, `--effort medium`) and scorers; 30 runs, 5 per cell, API cost $18.50 (authoring $9.87, UI $5.45, QA $3.18).
Per-run table: [`round4/results.tsv`](round4/results.tsv); all arms together (A0, F, C, H, A3 from rounds 2 and 3, plus A3N): [`round4/results-all.tsv`](round4/results-all.tsv); outputs: [`round4/outputs/`](round4/outputs/).

### Result: the prompt line did not bring the CLI back

| | authoring | UI | QA |
|---|---|---|---|
| C (files + CLI, prompt names it): runs with a working CLI call | 10/10 | 10/10 | 10/10 |
| A3 (all three, prompt silent) | 9/10 | 5/10 | 0/10 |
| **A3N (all three, prompt names it)** | **10/10** | **3/10** | **0/10** |

CLI calls per arm: **not reproduced.** The table first published here (for example authoring 161 calls for C and 104 for A3N) cannot be rebuilt from the stored columns, and the two counters disagree with each other. From `round4/results-all.tsv`: `cliCalls` sums to authoring C 141 and A3N 51, UI C 53 and A3N 38, QA C 28 and A3N 26; the per-command column (`cliCommands`) sums to 130 and 51, 30 and 3, 24 and 1. The CLI-call counter was already corrected twice in round 3, and its `cliCalls` total counts calls the command column does not recognise. What the stored data does support: A3N used `kits` three times in UI (Opus only) and no sketchbook command in QA. The per-command split below is from the `cliCommands` column.

| task | C (`cliCommands`) | A3N (`cliCommands`) |
|---|---|---|
| authoring | 130 recognised: `check` 35, `help` 25, `add` 20, `api` 19, `generate` 13, `docs` 7, `explain` 6, `tokens` 5 | 51: `add` 16, `help` 15, `api` 14, `tokens` 2, `explain` 2, `status` 2 |
| UI | 30: `help` 10, `status` 7, `docs` 6, `kits` 3, `list` 2, `check` 1, `generate` 1 | 3, all `kits` |
| QA | 24: `docs` 12, `help` 10, `status` 1, `list` 1 | none (one `node_modules` path) |

The next bullet's statement that both arms run `check` and `generate` in authoring every run is not supported by this column: A3N shows no `check` or `generate` there.

- **With the harness installed, agents use the CLI when it does work, and skip it when it would only inform.** In authoring both arms use it every run for `add` (scaffold), `check`, `generate`, `api`. In UI and QA, C's calls are mostly orientation (`help`, `status`, `docs`, `list`); with the harness's CLAUDE.md, rules and skills in context, the agent reads the spec files directly and does not make those calls.
- **Skipping the CLI did not cost quality in QA.** A3N finds the real unseeded defect in 10 of 10 runs and 4.2 evidenced findings per report, against C's 10 of 10 and 3.1. In UI, A3N picks `sb-switch` in 8 of 10 runs (A3 9, C 9) and uses components in 10 of 10.
- **A3N is the same as A3 everywhere.** Cost: authoring -6% / -1%, UI +6% / 0%, QA -5% / -13% (Sonnet / Opus). Valid spec 10/10; expert items 15.4 vs 15.5. So the earlier A3-vs-C gap was the harness, not the missing prompt line.
- **Skills:** 5 of 10 A3N authoring runs invoked `contract-author` (all Sonnet), up from 3 of 10 for A3. Opus invoked none again.
- **Cost against C:** A3N is +9% / +3% (authoring), +41% / +18% (UI) and +37% / +63% (QA). In UI and QA that extra cost buys deeper evidence in QA and nothing measured in UI.

Matrix (all six arms, both models pooled, 10 runs per cell) is produced by `scripts/matrix.mjs round4/results-all.tsv`.

| metric | A0 | F | C | H | A3 | A3N |
|---|---|---|---|---|---|---|
| authoring: valid spec + checks | 0/10 | 9/10 | 10/10 | 10/10 | 10/10 | 10/10 |
| authoring: $ sonnet / opus | 0.12 / 0.75 | 0.69 / 1.98 | 0.55 / 1.34 | 0.72 / 1.78 | 0.64 / 1.39 | 0.60 / 1.38 |
| UI: components / tokens only | 0 / 0 | 9 / 10 | 10 / 9 | 10 / 10 | 10 / 10 | 10 / 9 |
| UI: right control (switch) | 10 (plain input) | 6 | 9 | 6 | 9 | 8 |
| UI: $ sonnet / opus | 0.07 / 0.20 | 0.25 / 0.61 | 0.20 / 0.68 | 0.28 / 0.74 | 0.27 / 0.81 | 0.29 / 0.80 |
| QA: real defect found | 0/10 | 9/10 | 10/10 | 10/10 | 10/10 | 10/10 |
| QA: evidenced findings / report | 0.4 | 3.8 | 3.1 | 5.0 | 5.0 | 4.2 |
| QA: $ sonnet / opus | 0.08 / 0.15 | 0.11 / 0.30 | 0.14 / 0.28 | 0.19 / 0.50 | 0.19 / 0.52 | 0.18 / 0.45 |

## Test 2. What `sb-card-title` renders

Checked in the source and contract, no model runs. Round 2 and 3 found that pages built on the design system more often fail axe on `page-has-heading-one` (runs with a finding: A0 0/10, F 1/10, A3 4/10, A3N 5/10, C 5/10, H 6/10; every one is `page-has-heading-one`, plus `landmark-one-main` and `region` in one A3N run) and listed "what `sb-card-title` renders" as a candidate design-system issue.

- `src/components/card/CardTitle.ts` is a plain custom element with a slot. The card contract (`spec/components/card/contract.json`, `accessibility`) says: *"Card has no role... the title is a visual heading. For a heading in the document outline, put a real heading element inside sb-card-title."* `contract.md` repeats it.
- So the missing `<h1>` is **not a design-system bug**. It is documented behavior (no roles on any card part), and the agents did not follow the documented step. The agent that reads the design system's anatomy uses `sb-card-title` as the page title and stops there.
- This corrects the "candidate design-system issue" wording in [ROUND2.md](ROUND2.md) and [ROUND3.md](ROUND3.md). It is a guidance gap: whatever the agent reads first (CLAUDE.md, a skill, the `docs` output, the settings kit) does not carry that sentence to where it is acted on.

## What round 4 changes

1. **The harness, not the prompt, is what lowers CLI use in UI and QA.** Naming the CLI changes nothing once the harness is present. The CLI is used for authoring, where it scaffolds and checks.
2. **That is not a loss for QA.** The harness arms find at least as much, with better-backed findings, without the CLI. The CLI's orientation calls in C are redundant once the harness orients the agent.
3. **The accessibility finding has a cause and a cheap fix**, in guidance, not in the component: say in the harness (or the card contract's `aiHints`, or the `docs` output) that a page needs one `<h1>`, and that `sb-card-title` does not provide it. Untested: whether that fixes it.
4. The nudge question is closed; the harness's cost question is not (about 17k tokens per session, +18% to +63% in UI and QA over C).

## Caveats

- 10 runs per arm per task. No significance tests.
- A0 and A3 come from round 2; F, C, H and A3N from the rebuilt sandbox (same engine tarball, fresh `npm install`). The prompts and templates are the same, but the batches ran at different times.
- The CLI counter is the stricter one introduced in round 3 for F, C, H and A3N; round 2's A3 rows use the earlier, looser counter (logs lost), so A3's 9 / 5 / 0 are less certain than A3N's 10 / 3 / 0.
- A3N's first scoring pass showed 0 of 10 valid specs because the collector had no template mapping for the new arm; fixed and re-scored before any number here. Worth knowing because the symptom (valid-spec 0/10 next to normal cost) looked like a result.
- A3N, C and the others share one seeded QA page and one UI prompt.
- Round 3's "the CLI helps pick the right component" (switch in 18/20 runs with the CLI vs 12/20 without) is weaker after this round: A3N chose `sb-switch` in 8 of 10 runs while using the CLI in only 3 of 10. The link is to the CLI being installed, not demonstrably to using it; the cause is not established.

## Next steps (not done)

1. Put the `<h1>` and `sb-card-title` guidance where the agent reads first, then rerun the UI task (arm A3N, 10 runs) and see whether the axe finding disappears.
2. Decide what the harness costs: its fixed context buys QA depth only. A lighter harness (index plus on-demand skills) is the obvious variant to test.
3. A QA-flow test where the prompt names `check` and `audit-css` explicitly, to see whether they find anything the file reading does not.
4. Other components and pages, to see whether these results hold beyond Switch and a settings card.
