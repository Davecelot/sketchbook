# Value benchmark, round 5 (2026-11-14): the lighter Claude layer (SB-0114)

Round 4 left the harness's cost unresolved. The Claude layer added about 16.7k tokens per session (round 1) and +18% to +88% per task (rounds 3 and 4, across tasks, against C or files only), and bought QA depth only. This round reruns arm **A3** (files, CLI and harness) with the layer from SB-0114. Everything else matches round 3: library starter, Switch held out of the catalog for authoring, the same three prompts, `claude-sonnet-5-5` and `claude-opus-5-5` at `--effort medium`, and 5 runs per cell. C and the old A3 are the round 3 runs. C has no Claude layer, so it did not need a rerun.

## What changed in the layer

- **Hammock hooks.** They inject a 1.1k-character ladder card at session start, resume, clear, compact and subagent start. Before, they injected the whole skill (about 9k characters) at session start, on every prompt and in every subagent.
- **Rules.** Five task-specific rules load by `paths:`; always-on rule text went from 16.6 KB to 2.9 KB.
- **Skills.** Skill descriptions are at most 400 characters. Agent briefs declare a model, and review-rangers sizes its committee by risk.
- **CLI output.** `check` and top-level `help` print less: 2,037 → 584 and 4,866 → 2,554 characters.

## Fixed context

The probe (`scripts/fixed-context.mjs`) sends one trivial prompt and counts input, cache-write and cache-read tokens. Medians are over 3 runs on Sonnet.

| | bare | full layer | overhead |
|---|---|---|---|
| `main` (before) | 38,414 | 53,966 | +15,552 |
| this round | 36,118 | 39,868 | **+3,750** |

The always-on bytes measured by check H1 went from about 58 KB to 15.7 KB in the layer these runs used. A later trim of `CLAUDE.md` brought them to 13.9 KB, against a 16,000-byte budget. H1 warns at 90%, and `sketchbook doctor` shows the usage.

## Cost per task against C ($ per run, Sonnet / Opus)

| task | C | A3 old | vs C | **A3 new** | **vs C** |
|---|---|---|---|---|---|
| authoring | 0.55 / 1.34 | 0.64 / 1.39 | +17% / +4% | **0.63 / 1.12** | **+15% / −17%** |
| UI | 0.20 / 0.68 | 0.27 / 0.81 | +33% / +18% | **0.24 / 0.65** | **+19% / −5%** |
| QA | 0.14 / 0.28 | 0.19 / 0.52 | +43% / +83% | **0.13 / 0.32** | **−7% / +13%** |

Every cell is within the +50% target. QA on Opus has 10 runs per arm (5 extra for C and for the new A3): +13%, down from +83%. With its first 5 runs alone it read +24%. The worst cell is now Sonnet UI at +19%.

## Quality held (within noise)

Two cells drop by one run in ten: tokens only (10/10 to 9/10) and three switches (9/10 to 8/10). At n = 5 per model that is within run-to-run spread.

| task | measure | C | A3 old | A3 new |
|---|---|---|---|---|
| authoring | valid spec, checks pass | 10/10 | 10/10 | 10/10 |
| UI | uses `sb-*` components | 10/10 | 10/10 | 10/10 |
| UI | tokens only (no literal colours) | 9/10 | 10/10 | 9/10 |
| UI | three switches | 9/10 | 9/10 | 8/10 |
| UI | no axe findings (light and dark) | 5/10 | 6/10 | 7/10 |
| QA | finds all 6 seeded defects | 15/15 | 10/10 | 15/15 |
| QA | finds the unseeded token defect | 15/15 | 10/10 | 15/15 |

## QA depth: the first reading was the scorer

The first write-up of this round said evidenced QA findings fell from 5.0 to 4.5. Two things were wrong with that number.

- **The scorer missed evidence phrased in new ways.** `score-qa.mjs` counted a finding as evidenced only for fixed wording ("not a valid token", "no such", "scale stops"). The new layer's reports more often write "does not exist", "the scale skips from `--sb-space-16`" or "props: label, …". Those findings cite project facts but were not counted.
- **The pattern is now calibrated.** `qa/evidence-calibration.json` holds real report lines labelled evidenced or not, and the scorer refuses to run when its pattern disagrees with any of them. That check caught a first draft that counted "likely not a real token" (a guess) as evidence. The old count stays in the results as `evidencedV1`.
- **Opus had only 5 runs.** Five more Opus QA runs each for C and the new A3 bring them to n = 10.

Every arm's stored reports, re-scored by the same scorer (`scripts/qa-depth.mjs`). Evidenced findings per report, mean ± SD:

| model | C | A3 old | A3 new |
|---|---|---|---|
| Sonnet | 4.0 ±1.1 (n=5) | 4.8 ±1.2 (n=5) | **5.6 ±0.5** (n=5) |
| Opus | 5.2 ±1.1 (n=10) | 6.8 ±1.2 (n=5) | **6.2 ±1.2** (n=10) |

QA depth holds:

- On Sonnet it is higher than with the old layer.
- On Opus it is 0.6 lower. That is less than one standard error of the difference (about 0.66), so it is noise at this n.
- No ablation was needed (the plan ran one only if Opus stayed clearly lower).
- Detection is identical in every arm: all 6 seeded defects and the unseeded one, in every run.
- The harness's QA gain over C is kept: +1.6 evidenced findings on Sonnet and +1.0 on Opus.

## Caveats

- n = 5 per cell, with no significance tests. Read the gaps as direction.
- C and the old A3 come from round 3 (2026-11-12). Model behavior may have drifted in two days, and this round's engine also has the compact `check` output that C would get now.
- **The first attempt at this round was discarded.** It ran under `~/.claude/`, where Claude Code blocks file writes as sensitive, so no run could save its output. All 30 runs were rerun outside it. Keep benchmark roots out of `~/.claude`.

## Reproduce

```sh
npm run build && npm pack --pack-destination <root>
# held-out engine: the same tarball with harness/catalog/switch and its index entry removed (repack with COPYFILE_DISABLE=1 on macOS)
bash scripts/setup-arms.sh <root>/sketchbook-heldout.tgz <root>/tpl author library
bash scripts/setup-arms.sh <root>/sketchbook-0.1.0.tgz <root>/tpl ui library
cp -Rc <root>/tpl/ui-a3 <root>/tpl/qa-a3 && mkdir -p <root>/tpl/qa-a3/out && cp qa/settings.html <root>/tpl/qa-a3/out/
BENCH=<root> REPO=<repo> bash scripts/run.sh <author|ui|qa> a3 <model> <rep>
node scripts/collect.mjs <root> round5/results.tsv && node scripts/compare-round5.mjs && node scripts/qa-depth.mjs <root>/runs
node scripts/fixed-context.mjs <project> --runs 3
```
