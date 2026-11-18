# Sketchbook benchmark: all tests compared, and where it sits

The tests show that Sketchbook makes Claude's output conform to your design system. They don't show that it makes the work cheaper, faster, or better in any way that function or accessibility checks can see. I also can't rank it against other design systems, because I didn't run any.

## 1. What was measured

I ran five rounds, 252 task runs in total, costing about $141 in API spend. Every run was a real headless Claude Code session, on Sonnet 5.5 and Opus 5.5 at medium effort.

| Round | What it did | Runs | Cost |
|---|---|---|---|
| 1 (pilot) | Blank starter, 4 arms, 2 runs per cell. One invalid attempt was discarded. | 32 | $21 |
| 2 | Library starter, nothing vs everything, 5 runs per cell, added QA and consistency | 60 | $26 |
| 3 | Added three arms to separate files, CLI and harness | 90 | $57 |
| 4 | Named the CLI in the prompt for the full setup | 30 | $18.50 |
| 5 | Reran the full setup with the lighter layer (SB-0114), plus 10 extra Opus QA runs | 40 | about $19 |

**The five setups (arms)**

| Arm | What the agent has |
|---|---|
| A0 | An empty folder |
| F | The project's files only |
| C | Files plus the CLI |
| H | Files plus the harness (CLAUDE.md, rules, skills, hooks) |
| A3 | Files, CLI and harness |

A3N is A3 with the CLI named in the prompt.

**The measurements, in plain terms**

- **Fixed context.** I asked each arm to say "OK" and counted the tokens it started with.
  - A0 starts at about 18.4k tokens and A3 at about 35.1k.
  - So the harness adds about 16.7k tokens per session. A trivial prompt costs about 3.6× more on A3.
- **Authoring.** The agent writes the Switch spec with Switch removed from the catalog, so it can't copy it.
  - I score it three ways: a 24-item text rubric, structure against the real contract, and whether `sketchbook check` passes.
  - The rubric turned out saturated: every arm covers the content equally well.
  - What separates the arms is whether the result is a valid, schema-conformant spec.
- **UI.** The agent builds a settings page, and a Chromium script scores it. The script checks:
  - that it renders;
  - that Space toggles a switch;
  - that the form submits;
  - axe findings;
  - theme response;
  - how many `sb-*` components, tokens and literal colours it uses;
  - invented attributes.
- **QA.** The agent reviews a page with 6 planted defects. I score defects found, findings backed by project evidence vs hedged guesses, and one extra real defect I added by accident.
- **Cost of checking.** I measure the share of tokens spent on verification commands inside each run. Separately, I timed the harness's own checks (22 at the time, 25 now).
- **Consistency.** I measure the coefficient of variation across the 5 runs, and how similar the outputs are.

## 2. Findings compared across all arms

Rates are out of 10 runs, both models pooled. Cost is per run, Sonnet / Opus.

| | A0 | F | C | H | A3 | A3N |
|---|---|---|---|---|---|---|
| Authoring: valid spec | 0 | 9 | 10 | 10 | 10 | 10 |
| Authoring: $ | 0.12 / 0.75 | 0.69 / 1.98 | 0.55 / 1.34 | 0.72 / 1.78 | 0.64 / 1.39 | 0.60 / 1.38 |
| UI: uses components | 0 | 9 | 10 | 10 | 10 | 10 |
| UI: tokens only | 0 | 10 | 9 | 10 | 10 | 9 |
| UI: right control (switch) | 10* | 6 | 9 | 6 | 9 | 8 |
| UI: runs with an axe finding | 0 | 1 | 5 | 6 | 4 | 5 |
| UI: $ | 0.07 / 0.20 | 0.25 / 0.61 | 0.20 / 0.68 | 0.28 / 0.74 | 0.27 / 0.81 | 0.29 / 0.80 |
| QA: real extra defect found | 0 | 9 | 10 | 10 | 10 | 10 |
| QA: evidenced findings per report | 0.4 | 3.8 | 3.1 | 5.0 | 5.0 | 4.2 |
| QA: $ | 0.08 / 0.15 | 0.11 / 0.30 | 0.14 / 0.28 | 0.19 / 0.50 | 0.19 / 0.52 | 0.18 / 0.45 |

\*A0's switches are plain native inputs, not design-system components.

**What each part contributes**

- **The project's own files do most of the work** (A0 to F). That's where the components, tokens, valid specs and evidence-based QA come from. They cost 1.4× to 6× more per run.
- **The CLI makes authoring cheaper and more regular.** Authoring costs 21–32% less than F, and it writes the same 8 files every run. It does nothing for QA.
- **The harness adds QA depth and little else.** Evidenced findings go from 3.8 to 5.0 per report (rounds 2 to 4 use the first scorer, `evidencedV1`; see the scorer caveat below). Before round 5 it cost about 66–68% more in QA and more in UI, with no gain measured outside QA. The lighter layer of round 5 keeps the QA depth at a fraction of that cost (below).
- **Naming the CLI in the prompt changed nothing** once the harness is present (A3N matches A3).
- **What everyone gets equally.** The page works, is keyboard-operable, and the six planted defects were found, in every arm. A bare model is as good as the design system on those, so function benchmarks wouldn't separate the arms.
- **Accessibility is not equal, and not in the design system's favour.** Runs with at least one axe finding: 0 of 10 for A0, against 1 of 10 for F, 5 for C, 6 for H and 4 for A3 (table above). The findings are mostly `page-has-heading-one`: the card title is not a heading and the agent did not add an `<h1>`.

### Round 5: the lighter layer (SB-0114)

The harness was cut to its always-on essentials and A3 was rerun ([ROUND5.md](ROUND5.md)):

- Hooks inject once, not on every prompt.
- Task-specific rules load by `paths:`.
- Skill descriptions are shorter.
- Review committees are sized by risk.
- `check` and `help` output is compact.

| task | A3 before, vs C | A3 after, vs C |
|---|---|---|
| authoring | +17% / +4% | +15% / −17% |
| UI | +33% / +18% | +19% / −5% |
| QA | +43% / +83% | −7% / +13% |

Costs are Sonnet / Opus.

- **Fixed overhead** on a trivial prompt went from +15.6k to +3.75k tokens.
- **Conformance and detection** are unchanged.
- **QA depth holds**, re-scored with a calibrated evidence pattern:

  | model | C | A3 after |
  |---|---|---|
  | Sonnet | 4.0 | 5.6 |
  | Opus | 5.2 | 6.2 |

- **Every task is now within the +50% target** that SB-0114 set.

## 3. How it sits against outside benchmarks

I read these only as secondary summaries, not the papers or studies themselves.

| Reference | What it reported | What we measured | Agreement |
|---|---|---|---|
| ETH Zurich AGENTbench study | Context files cost about 20% more and lift success little on average | Before round 5 the harness cost +12% to +88% depending on task and lifted only QA depth; after it, at most +19% | Same direction; our cost penalty is larger on QA |
| Coinbase with Code Connect (vendor) | About 22.5% fewer tokens, better adherence | CLI cut authoring cost 21–32% | Similar size, but only in authoring. UI and QA showed no consistent saving |
| A practitioner test, n=9 | A queryable server beat rules files and docs | Files on disk gave most of the value; the rules-style harness added a little | Consistent, with the caveat that both are small samples |
| Design2Code, WebGen-Bench, UI-Bench | Measure fidelity, function and visual taste | Those measures were saturated across our arms | None of them score design-system adherence, so we built our own scorers |
| DS practitioner metrics (adoption, token coverage, time saved) | Adoption, token coverage and time-per-task are the standard measures | Component adoption 0 to 9–10 of 10; token use 0 to 10 of 10; cost, time, defects caught, consistency | We cover the measurable ones. ROI and human time saved were not measured |

## 4. What this does not tell you

- **No comparison with other design systems or tools.** I never ran shadcn/ui with its CLI, Code Connect, or another design system. So "how Sketchbook sits" is relative to nothing, or to the harness's own absence, not to competitors.
- **Small and narrow.** It covers one component, one page, one seeded QA page, 2 models, and 10 runs per arm. There are no significance tests, so read gaps like 8 vs 2 as direction only.
- **A0 is unrealistic.** Real teams have some design system, so A0 mostly shows what having files is worth.
- **My own scorers.** I calibrated them against a real contract and a hand-built page, but they are still mine. They needed fixing several times as real output surprised me. The CLI counter was wrong twice, and I caught both by checking arms where the answer must be zero.
- **Weaker claim after round 4.** The "CLI helps pick the right component" link is weaker than I wrote in round 3. The arm that used the CLI least still chose the right control in 8 of 10 runs. I've noted that in the round 4 report.
- **No human baseline.**

## 5. Where it sits

Sketchbook is a high-conformance, higher-cost design-system toolchain. Its value shows in three places:

- **Conformance.** Components, tokens and valid specs, every time.
- **Evidence-backed checking.** Findings cite project facts instead of guesses.
- **Cheap deterministic gates.** The checks (22 when timed) run in about 2 seconds and cost nothing in model spend.

The single biggest lever is simply having the design system's files on disk. The CLI pays for itself in authoring. The harness buys QA depth, and since round 5 (SB-0114) it does so within +19% of files plus CLI on every task.

The tests also surfaced two things to fix:

- **Heading guidance.** Pages built on the design system often lack an `<h1>`, because `sb-card-title` has no heading role by design and the agents ignore the contract's note. That guidance needs to be where the agent reads first.
- **QA flow and the CLI.** No run used `check` or `audit-css` for review.

**To rank it against alternatives**, I'd run this same suite on one or two other design-system setups, such as shadcn/ui with its CLI or another design system. The A0-to-F gap and the per-task costs would then be directly comparable. Tell me if you want that.

All reports are in `docs/research/value-benchmark/` (`README.md`, `ROUND2.md`, `ROUND3.md`, `ROUND4.md`) (`ROUND5.md` too), merged into `main`; the round 5 report is commit `2d5cac2`.

**Scorer caveat.** The QA evidence counts in rounds 2 to 4 come from the first version of `score-qa.mjs`, whose wording list missed some valid evidence. Round 5 broadened it and calibrated it against labelled lines (`qa/evidence-calibration.json`). Re-scoring the stored round 2 and 3 reports with the current scorer gives F 4.6, C 4.6, H 5.9 and the round 2 A3 5.8 per report. So the round 3 reading that the CLI lowers QA evidence (C 3.1 vs F 3.8) does not hold on the current scorer: C and F tie. The harness still scores highest on both. Reproduce with `scripts/qa-depth.mjs`.
