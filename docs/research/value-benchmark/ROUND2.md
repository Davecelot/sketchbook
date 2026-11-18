# Value benchmark, round 2 (2026-11-12): library starter, 5 runs per cell, QA and consistency

Round 1 ([README](README.md)) used a blank starter, 2 runs per cell, and four arms. Round 2 changes three things you asked for:

- `sketchbook init --start library`: the 35 components are installed, so a design system exists to use.
- Two arms only: **A0 nothing** (an empty folder) against **A3 harness + CLI** (the installed Claude layer plus the CLI).
- 5 runs per cell, plus a **QA task** and measures of what checking costs and how consistent the runs are.

`claude-sonnet-5-5` and `claude-opus-5-5`, `--effort medium`, Claude Code 2.1.322, same engine and isolation as round 1.
60 runs (3 tasks x 2 models x 2 arms x 5), API cost $25.95 (authoring $14.47, UI $6.75, QA $4.72), plus about $0.36 of probes.
Per-run table: [`round2/results.tsv`](round2/results.tsv). Generated pages, specs and QA reports: [`round2/outputs/`](round2/outputs/).

## Headline

With a design system present, the harness and CLI change what the agent produces and how well it checks it. They do not make it cheaper.

| | A0 nothing | A3 harness + CLI |
|---|---|---|
| UI page built from the design system's components | 0 of 10 | **10 of 10** |
| UI page using only the design system's tokens | 0 of 10 | **10 of 10** |
| Authored spec in the project's format, passing checks | 0 of 10 | **10 of 10** |
| QA: seeded defects found | 6 of 6 | 6 of 6 |
| QA: the real defect nobody seeded (a token that does not exist) | 0 of 10 runs | **10 of 10 runs** |
| QA: findings backed by project evidence / hedged guesses (per report) | 0.4 / 1.8 | **5.0 / 0.4** |
| Cost per run vs A0 | | 1.9x to 5.3x |

## 1. Authoring the Switch spec (switch removed from the catalog)

| model | arm | $ / run | cost CV % | turns | wall s | files | expert (of 16) | contract / check pass |
|---|---|---|---|---|---|---|---|---|
| sonnet | A0 | 0.12 | 9 | 5 | 46 | 1-2 | 14.4 | 0/5, 0/5 |
| sonnet | A3 | 0.64 | 3 | 30 | 172 | 8 | 15.0 | 5/5, 5/5 |
| opus | A0 | 0.75 | 19 | 13 | 217 | 2-6 | 14.8 | 0/5, 0/5 |
| opus | A3 | 1.39 | 9 | 33 | 249 | 8 | 16.0 | 5/5, 5/5 |

The content is the same (text rubric 14.4 to 14.8 vs 15.0 to 16.0 of 16). The form is not: A3 writes the same 8-file set in every run and every one validates; A0 writes 1 to 6 files of its own shape.
A3 used the CLI in 9 of 10 runs (`add --blank` to scaffold, `check`, `api`, `help`, `tokens`, `explain`); Sonnet also invoked the `contract-author` skill in 3 of 5 runs, Opus in none.

## 2. Generating a UI page

| model | arm | $ / run | cost CV % | turns | wall s | sb components | tokens only | axe (mean) | keyboard |
|---|---|---|---|---|---|---|---|---|---|
| sonnet | A0 | 0.07 | 2 | 4 | 20 | 0/5 | 0/5 | 0.0 | 5/5 |
| sonnet | A3 | 0.27 | 5 | 17 | 49 | 5/5 | 5/5 | 1.2 | 4/5 |
| opus | A0 | 0.20 | 5 | 6 | 40 | 0/5 | 0/5 | 0.0 | 5/5 |
| opus | A3 | 0.81 | 4 | 27 | 98 | 5/5 | 5/5 | 0.0 | 5/5 |

Round 1 found that in a blank project the harness arms never used components (only the CLI-only arm did, in 3 of 4 runs). With components installed, A3 uses them every time (10 to 12 `sb-*` elements, 0 raw controls, 0 unknown attributes), and A0 hard-codes everything.

Two things are not good news for A3 and are real:

- **Sonnet with the design system shipped pages with an axe finding in 4 of 5 runs** (mostly `page-has-heading-one`; one run had 3). A0 pages had 0 and Opus A3 pages had 0. The card title is not a heading, and the agent did not add an `<h1>`. Round 4 checked this: `sb-card-title` has no heading role by design and the card contract says to put a real heading inside it, so it is a guidance gap, not a component bug ([ROUND4.md](ROUND4.md)).
- **One Sonnet A3 page used `sb-checkbox` for the three on/off settings** instead of `sb-switch`. It is a valid component but the wrong one: the Switch contract says on/off settings use Switch, and Checkbox is for choosing options. My keyboard test looks for `role=switch`, so "keyboard 4/5" is a scorer artifact for that page, not a broken page.

## 3. QA: review a page seeded with defects

`qa/settings.html` has 6 seeded defects: a hard-coded colour, a switch with no label, an attribute that does not exist (`tone`), a raw `<button>`, a token that does not exist (`--sb-space-17`), and the wrong component (`sb-toggle` for a switch). A0 gets only the page, in an empty folder. A3 gets the page in the library project.

| model | arm | $ / run | cost CV % | wall s | seeded found | findings | hedged | evidenced | unseeded real defect found |
|---|---|---|---|---|---|---|---|---|---|
| sonnet | A0 | 0.08 | 16 | 22 | 6/6 in 5/5 | 8.0 | 2.0 | 0.4 | 0/5 |
| sonnet | A3 | 0.19 | 8 | 33 | 6/6 in 5/5 | 9.8 | 0.8 | 4.4 | 5/5 |
| opus | A0 | 0.15 | 8 | 29 | 6/6 in 5/5 | 7.2 | 1.6 | 0.4 | 0/5 |
| opus | A3 | 0.52 | 14 | 53 | 6/6 in 5/5 | 9.6 | 0.0 | 5.6 | 5/5 |

- **Recall of the seeded defects is saturated.** A0 found all six by reading the page alone, in every run, and the sets are identical between runs (similarity 1.00 in all four cells).
- **What differs is how it knows.** A0 says "it is likely not a real token", "I could not check against the design system". A3 says "the scale stops at `space-16`", "`Switch.ts` and the contract define no `tone`", and names the real props of `sb-toggle`. "Evidenced" counts findings citing project files or facts; "hedged" counts findings with guess wording. Both are regex counts.
- **A3 found a defect I did not plant.** I wrote `--sb-font-size-small` into the seed page by mistake; it is not in `tokens.css`. A3 reported it in 10 of 10 runs, A0 in none (A0 could not know). I verified it and added it to the ground truth afterwards (`qa/defects.json`, `unseeded`), so it is a post-hoc measure.
- **Neither arm used the CLI for QA** (0 of 10 A3 runs), although `check` and `audit-css` exist. The A3 advantage comes from having the project's files on disk, not from CLI commands. A project with files but no harness and no CLI was not run, so files-on-disk vs harness vs CLI cannot be separated here.
- **D6 seed correction.** `sb-toggle` is a real component, so the defect is "wrong component with props it does not support", not "invented component". The pattern is unchanged and both arms matched it.

## 4. What checking costs, in effort and money

Inside the runs (tokens in turns that ran a check, test, lint, typecheck or browser command, as a share of all tokens; money is that share times the run's cost, an approximation):

| task | model | verify turns % | verify tokens % | verify calls / run | verify money / run |
|---|---|---|---|---|---|
| author | sonnet A3 | 35 | 39 | 7.0 | about $0.25 of $0.64 |
| author | opus A3 | 27 | 33 | 6.8 | about $0.46 of $1.39 |
| ui | sonnet A3 | 18 | 19 | 2.4 | about $0.05 of $0.27 |
| ui | opus A3 | 23 | 26 | 4.6 | about $0.21 of $0.81 |
| ui | A0 (both) | 0 to 3 | 0 to 4 | 0 to 0.2 | about $0 |

A0 almost never checks its own work; A3 spends a fifth to two fifths of a run on checks, and that is where its valid-spec result comes from (every authoring run ended with the checks passing).
The QA task is itself the check, so its verification share reads 0.

Outside the runs:

- **The harness's deterministic gates:** the 22 checks of `sketchbook check` at the time (25 now) take 1.6 to 2.4 s in the library project (3 runs: 2.35, 1.64, 1.61 s; a 4-check subset takes 1.1 s) and cost no model spend. An agent re-checking by reading and reasoning costs cents to tens of cents per run (above).
- **Our own measurement:** the scorers (Chromium, axe, rubric, regex) take 1.3 s per run on average, no model calls, $0. The effort was in building and correcting them: this pilot needed fixes to the scorer after seeing real output (the theme test, the literal-colour count, `unknownTags`, the QA ground truth, the hedge and evidence counts). Expect to revise scorers whenever the output shape surprises you.

## 5. Consistency between runs (5 per cell)

| task | arm | cost CV % (sonnet / opus) | tokens CV % (sonnet / opus) | output shape between runs |
|---|---|---|---|---|
| author | A0 | 9 / 19 | 19 / 32 | 1 to 6 files, no schema |
| author | A3 | 3 / 9 | 11 / 21 | the same 8 files in every run, 5/5 and 5/5 pass the checks |
| ui | A0 | 2 / 5 | 0 / 14 | same approach in every run (own palette, native controls) |
| ui | A3 | 5 / 4 | 11 / 10 | 10 to 12 `sb-*` elements; component set similarity 0.91 to 0.92 |
| qa | A0 | 16 / 8 | 20 / 12 | same 6 defects every run |
| qa | A3 | 8 / 14 | 29 / 19 | same 6 defects every run, 5/5 find the unseeded one |

CV is the standard deviation over the mean. Run-to-run cost is steady for both arms (CV mostly under 20%), so cost is not what A3 buys you; what A3 gives is a consistent form of output. A3 authoring is less variable than A0 on cost (3 and 9 vs 9 and 19), but with 5 runs that is a direction, not a result.

## What this supports

- With a design system present, harness plus CLI makes the output conform: components and tokens used every time, a spec that validates every time, and QA that checks claims against the project instead of guessing. None of that happens with nothing.
- It costs 1.9x to 5.3x per run (authoring), about 4x (UI), 2.4x to 3.5x (QA), and 1.1x to 3.7x the time (QA 1.5x to 1.8x). Run-to-run variation is similar in both arms.
- Where the harness earns it is checking: 20 to 40% of an A3 run is verification, and the deterministic gates themselves are 2 seconds and free.

## What it does not support

- That the CLI, specifically, is what helps. In UI and QA it was barely used (Sonnet never; Opus only `kits` in UI); in authoring it was used in 9 of 10 runs. This is a finding for the product: the CLI is not discovered for QA (`check`, `audit-css`, `explain` unused in 10 runs) or for UI.
- That the harness is neutral on accessibility: Sonnet A3 pages had more axe findings than A0 pages (4 of 5 vs 0 of 5).
- Anything about harness vs CLI vs project files separately. Those arms were not run in round 2.

## Caveats

- 5 runs per cell, one component, one page, one seeded page. Coefficients of variation from 5 runs are rough.
- The QA seed page had one unintended defect (found by the runs, added afterwards) and one mislabelled defect (`sb-toggle`). Both are disclosed above. The detection patterns are regexes and generous; saturation at 6 of 6 may hide differences, which is why hedged, evidenced and unseeded counts were added.
- In QA, A3 had the design system's files and A0 did not, so the QA gap mixes tool and knowledge.
- Verification share is regex over shell commands and the money figure is an approximation; reading a file for review is not counted as verification.
- The authoring hold-out removes Switch from the catalog only; Switch may be in the model's training data (shadcn/ui).
- Same isolation as round 1 (`--setting-sources project,local`, no MCP). Cost is the CLI's own list price figure.

## Correction (added after round 3)

The CLI-use counts in this document came from a counter that matched any shell command containing the word `sketchbook`. Round 3 found it overcounts (it showed CLI use for A0, which has no CLI) and rebuilt it ([ROUND3.md](ROUND3.md), caveats). The round 2 logs were lost, so these counts were not re-measured; the authoring figure (9 of 10) is probably right, the UI and QA figures less certain.

## Next steps (not done)

1. Look at why the CLI is not used for QA and UI, and whether the harness should point the agent at `sketchbook check`, `audit-css` and `explain` in those flows.
2. Check what `sb-card-title` renders and whether pages built on the Card need an `<h1>` the design system should provide.
3. Add the missing arms (project files only, then plus CLI, then plus harness) to separate what helps.
4. More seeded pages and a fixed list of defects written before the first run, to avoid the post-hoc additions here.

## Reproduce

```
bash scripts/setup-arms.sh <engine.tgz> <root>/tpl author library    # held-out engine, no switch in the catalog
bash scripts/setup-arms.sh <engine.tgz> <root>/tpl ui library
# qa templates: copy qa/settings.html to <root>/tpl/qa-a0/out/ (empty folder) and <root>/tpl/qa-a3/out/ (a copy of ui-a3)
BENCH=<root> REPO=$PWD bash scripts/run.sh <author|ui|qa> <a0|a3> <sonnet|opus> <rep>
SB_NODE_MODULES=<repo>/node_modules node scripts/collect.mjs <root> results.tsv
node scripts/aggregate.mjs results.tsv && node scripts/consistency.mjs results.tsv
```
