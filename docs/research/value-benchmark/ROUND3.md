# Value benchmark, round 3 (2026-11-12): what helps, files, CLI or harness

Round 2 ([ROUND2.md](ROUND2.md)) compared nothing against everything. Round 3 adds the three missing arms so each part can be separated. Same library starter, same three tasks (author the Switch spec, build a settings page, QA a seeded page), same two models (`claude-sonnet-5-5`, `claude-opus-5-5`, `--effort medium`), 5 runs per cell.

| Arm | What the agent has | Source |
|---|---|---|
| A0 nothing | an empty folder | round 2 |
| **F** files only | the library project (components, tokens, specs, docs) with the CLI **removed** and no Claude layer, no CLAUDE.md | round 3, new |
| **C** files + CLI | the project with the CLI working, no Claude layer; the prompt adds one line naming `npx sketchbook help` | round 3, new |
| **H** files + harness | the project with the Claude layer (CLAUDE.md, rules, skills, hooks) and the CLI **removed** | round 3, new |
| A3 files + CLI + harness | everything | round 2 |

90 new runs, API cost $56.71 (authoring $35.30, UI $13.88, QA $7.53); that is above the $45 to $55 I estimated. Per-run table: [`round3/results.tsv`](round3/results.tsv); all 150 runs with A0 and A3 from round 2: [`round3/results-all.tsv`](round3/results-all.tsv); pages, specs and QA reports: [`round3/outputs/`](round3/outputs/).
The CLI is removed physically in F and H (binary and `harness/cli*` deleted, checked to fail), not denied by rule: in round 1 the deny list leaked.

## Headline: what each part adds

Rates are out of 10 runs (both models pooled); cost is the change in mean cost per run, Sonnet and Opus.

| Part (comparison) | What it adds | What it costs |
|---|---|---|
| **Project files** (A0 to F) | Nearly all of the conformance. UI built from components 0/10 to 9/10; tokens only 0/10 to 10/10. Valid spec 0/10 to 9/10. QA finds the real unseeded defect 0/10 to 9/10; evidenced findings per report 0.4 to 3.8 | +38% to +495% (QA +38% / +97%, UI +242% / +205%, authoring +495% / +165%) |
| **CLI** (F to C) | Authoring: same 8-file spec every run, 10/10 valid (F 9/10). Picks the right control: `sb-switch` in 18/20 runs with the CLI vs 12/20 without. Authoring cost down | authoring -21% / -32%; UI -20% / +12%; QA +22% / -8% |
| **Harness** (F to H) | QA depth: evidenced findings 3.8 to 5.0 per report, real defect 9/10 to 10/10. Nothing measurable in authoring or UI | authoring +5% / -10%; UI +12% / +21%; QA +68% / +66% |
| **Harness on top of the CLI** (C to A3) | QA depth again (3.1 to 5.0 evidenced). Nothing else | authoring +17% / +4%; UI +33% / +18%; QA +43% / +88% |

In one sentence: the project's own files do most of the work, the CLI makes authoring cheaper and more regular, and the harness buys deeper QA and costs more everywhere else.

## 1. Authoring the Switch spec

| metric | A0 | F files | C files+CLI | H files+harness | A3 all |
|---|---|---|---|---|---|
| valid spec + checks pass | 0/10 | 9/10 | 10/10 | 10/10 | 10/10 |
| expert items /16 | 14.6 | 15.5 | 15.6 | 15.6 | 15.5 |
| runs with a working CLI call | 0/10 | 0/10 | 10/10 | 0/10 | 9/10 |
| runs that tried the CLI (incl. failed) | 0/10 | 10/10 | 10/10 | 10/10 | 9/10 |
| runs invoking a skill | 0/10 | 0/10 | 0/10 | 3/10 | 3/10 |
| $ / run, sonnet | 0.12 | 0.69 | 0.55 | 0.72 | 0.64 |
| $ / run, opus | 0.75 | 1.98 | 1.34 | 1.78 | 1.39 |
| wall s | 132 | 242 | 203 | 218 | 211 |
| verify tokens % | 0 | 14 | 34 | 11 | 36 |

- **The spec content is the same everywhere** (expert items 14.6 to 15.6 of 16). Files, CLI and harness change the form and the cost, not the knowledge.
- **The CLI is where the authoring savings are.** C is 21% (Sonnet) and 32% (Opus) cheaper than F, and every CLI run writes the same 8 files (`add --blank` scaffolds them), where F writes 3 to 8 and H 4 to 5. The CLI also makes checking possible: C and A3 spend 34% to 36% of their tokens on verification (C ran `check` 3 to 5 times per run); F and H cannot run it and spend 11% to 14%.
- **The harness without the CLI does not help.** H costs the same as F (+5% / -10%) and is not more valid (10/10 vs F 9/10). Skills were used in 6 of 20 harness runs (H and A3), all of them Sonnet authoring runs invoking `contract-author`; Opus never invoked a skill in any task.
- **Agents reach for the CLI.** With it removed, F and H still tried it in 10 of 10 runs each (`npx sketchbook add Switch --blank`, `npm run sketchbook -- help add`, `npm run check`), found in `package.json`, and every call failed with `sh: sketchbook: command not found`. Those failed calls are wasted turns.

## 2. Generating a UI page

| metric | A0 | F | C | H | A3 |
|---|---|---|---|---|---|
| uses sb components | 0/10 | 9/10 | 10/10 | 10/10 | 10/10 |
| tokens only (no literal colours) | 0/10 | 10/10 | 9/10 | 10/10 | 10/10 |
| used `sb-switch` (the right control) | 10/10 | 6/10 | 9/10 | 6/10 | 9/10 |
| runs with axe findings | 0/10 | 1/10 | 5/10 | 6/10 | 4/10 |
| runs with a working CLI call | 0/10 | 0/10 | 10/10 | 0/10 | 5/10 |
| $ / run, sonnet | 0.07 | 0.25 | 0.20 | 0.28 | 0.27 |
| $ / run, opus | 0.20 | 0.61 | 0.68 | 0.74 | 0.81 |
| wall s | 30 | 80 | 78 | 77 | 74 |

(The A0 "switch used" 10/10 is plain `<input role=switch>`, not a design-system component.)

- **Files alone get the page onto the design system** (components 9/10, tokens-only 10/10 in F). The CLI and the harness add little here.
- **The CLI helps pick the right component.** Without a working CLI (F and H) 8 of 20 runs used `sb-checkbox` for the three on/off settings; with it (C and A3) 2 of 20 did. The Switch contract says on/off settings use Switch. 8 vs 2 out of 20 is suggestive, not conclusive.
- **Engaging with the design system raises the accessibility finding rate.** Runs with at least one axe finding: A0 0/10, F 1/10, A3 4/10, C 5/10, H 6/10. Every finding is `page-has-heading-one`, plus `landmark-one-main` and `region` in some H runs. The agents that follow the design system's anatomy use `sb-card-title` and do not add an `<h1>`. Round 4 checked the cause: `sb-card-title` has no heading role by design and the contract says to put a real heading inside it, so this is a guidance gap, not a component bug ([ROUND4.md](ROUND4.md)).
- **The harness adds cost and no measured quality** on this task (+12% to +33% over F or C).

## 3. QA of the seeded page

| metric | A0 | F | C | H | A3 |
|---|---|---|---|---|---|
| seeded defects found (/6) | 6.0 | 6.0 | 6.0 | 6.0 | 6.0 |
| real unseeded defect found | 0/10 | 9/10 | 10/10 | 10/10 | 10/10 |
| evidenced findings / report | 0.4 | 3.8 | 3.1 | 5.0 | 5.0 |
| hedged findings / report | 1.8 | 0.1 | 0.3 | 0.2 | 0.4 |
| runs with a working CLI call | 0/10 | 0/10 | 10/10 | 0/10 | 0/10 |
| $ / run, sonnet | 0.08 | 0.11 | 0.14 | 0.19 | 0.19 |
| $ / run, opus | 0.15 | 0.30 | 0.28 | 0.50 | 0.52 |
| wall s | 26 | 33 | 33 | 41 | 43 |

- **Having the project's files is what makes QA evidence-based.** A0 to F moves evidenced findings from 0.4 to 3.8 and hedged ones from 1.8 to 0.1 for +38% / +97% cost, with no CLI and no harness.
- **The CLI adds nothing to QA, even when the prompt names it.** C used it in 10 of 10 runs (mostly `docs`, 17 calls, plus `help`) and got fewer evidenced findings than F (3.1 vs 3.8, first scorer; on the current scorer both are 4.6, see `ROUND5.md`) at about the same cost. Nobody used `check` or `audit-css` for review.
- **The harness adds depth at a price.** F to H: evidenced 3.8 to 5.0, real defect 9/10 to 10/10, hedging near zero in both, cost +68% / +66%. A3 is the same as H. Recall of the six seeded defects is saturated in every arm.

## 4. Does Claude use the CLI?

| | authoring | UI | QA |
|---|---|---|---|
| C (CLI, prompt names it) working call | 10/10 | 10/10 | 10/10 |
| A3 (CLI + harness, prompt does not name it) working call | 9/10 | 5/10 | 0/10 |
| F and H (CLI removed) tried it | 10/10 and 10/10 | 0/10 and 4/10 | 0/10 and 0/10 |

- In authoring it is used almost always, and its absence is felt (cost +21% to +32%, irregular output, wasted failed calls).
- In UI and QA, without a prompt that names it, it is used in half or none of the runs. C's 10/10 is not comparable with A3's, because only C's prompt mentions the CLI. With the harness's CLAUDE.md in place, none of the 10 A3 QA runs used the CLI.
- Using it did not improve QA. Its measured value is in authoring (cost, regular output) and in choosing the right component.

## 5. Consistency between runs

Cost, turns and tokens vary by CV (standard deviation over mean) of 3% to 20% in most cells; the full table is produced by `scripts/consistency.mjs` over `round3/results-all.tsv`. What stands out:

- Authoring with the CLI is the most regular: C and A3 write the same 8 files in every run. F writes 3 to 8 files, H 4 to 5. Sonnet F has the widest spread (cost CV 17%, tokens CV 38%).
- The seeded-defect set found in QA is identical across runs in every arm (similarity 1.00); what varies is how many extra findings and how well they are backed.
- Two UI cells are noticeably less consistent: C Sonnet (turns CV 35%, 17% on cost) and F Sonnet (turns CV 30%; 0 to 10 `sb-*` elements, one run used none).

## What this changes about the conclusions of round 2

- Round 2 credited "harness plus CLI" for conformance and for evidence-based QA. Round 3 shows most of that comes from **having the project's files**, which also explains why A0 (no files) hedges and guesses.
- The CLI's contribution is real but narrow: authoring cost and regularity, and picking the right component. It does not help QA.
- The harness's contribution is QA depth only; skills were used in 6 of 20 harness runs (Sonnet authoring only). Its fixed overhead of about 17k tokens per session (round 1) shows up as up to +88% cost (QA, C to A3), with no measured gain outside QA.
- The accessibility finding rate rises with each part that engages with the design system's own components; this deserves a design-system fix before the harness is blamed.

## Caveats

- 10 runs per arm per task (5 per model). No significance tests; read 8 vs 2 or 9/10 vs 10/10 as direction.
- A0 and A3 come from round 2, a different batch run earlier; F, C and H are from round 3, rebuilt from the same engine tarball with a fresh `npm install`, so dependency versions could differ slightly. The prompts and templates are the same.
- C's prompt names the CLI and no other arm's does. That is why C uses it in 10/10 everywhere.
- F and H keep `package.json` scripts that call `sketchbook`, so agents tried a CLI that was not there.
- The CLI counter was wrong twice before it was right: it first counted any text containing `sketchbook` (so A0 showed CLI use in QA), then it missed failures hidden by `| head` (so F and H showed working calls). Both were caught by checking arms where the true value is zero. Round 2's A3 rows still use the first counter, and the round 2 logs are gone (the sandbox was cleaned up between sessions), so those rows could not be re-measured: A3 authoring 9/10 is probably right, A3 UI 5/10 and QA 0/10 less certain.
- Round 3 was interrupted once (the `/tmp` sandbox was cleaned up after the session ended) and re-run from the start in `/var/tmp`.
- Verification share is regex over shell commands; QA reading is not counted as verification. The QA ground truth has the post-hoc unseeded defect described in round 2.

## Next steps (not done)

1. Done in round 4: A3 with the CLI named in the prompt (A3N) uses it in 10/10, 3/10 and 0/10 runs, so the gap was the harness, not the missing line ([ROUND4.md](ROUND4.md)).
2. Done in round 4: `sb-card-title` has no heading role by design; the contract says to put a real heading inside it.
3. If QA with the CLI matters, point the review flow at `sketchbook check` and `audit-css`: no run used them.
4. Decide what the harness should cost: about 17k tokens per session buys deeper QA only; the rest could be loaded on demand.

## Reproduce

```
bash scripts/setup-arms.sh <engine.tgz> <root>/tpl author library    # held-out engine, no switch in the catalog
bash scripts/setup-arms.sh <engine.tgz> <root>/tpl ui library
# qa templates: copy qa/settings.html to <root>/tpl/qa-a3/out/ (a copy of ui-a3)
bash scripts/make-round3-arms.sh <root>                               # f, h (CLI removed) and qa-a2
BENCH=<root> REPO=$PWD bash scripts/run.sh <author|ui|qa> <f|a2|h> <sonnet|opus> <rep>
SB_NODE_MODULES=<repo>/node_modules SB_ENGINE=<root>/tpl/author-a3/node_modules/sketchbook/harness/cli.mjs node scripts/collect.mjs <root> results.tsv
node scripts/merge-tsv.mjs results-all.tsv round2/results.tsv results.tsv
node scripts/matrix.mjs results-all.tsv && node scripts/consistency.mjs results-all.tsv
```
