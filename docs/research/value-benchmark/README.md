# Value benchmark, pilot (2026-11-12)

Does the harness (Claude layer) and the CLI pay for themselves? A first, small simulation on one component (Switch) with real headless Claude Code sessions.
Pilot only: 2 runs per cell, no confidence intervals. Read the direction, not the decimals.
Round 2 (library starter, 5 runs per cell, QA task, cost of checking and run-to-run consistency): [ROUND2.md](ROUND2.md).
Round 3 (files vs CLI vs harness, separated): [ROUND3.md](ROUND3.md).
Round 4 (naming the CLI in the prompt; what `sb-card-title` renders): [ROUND4.md](ROUND4.md).
Round 5 (the lighter Claude layer, SB-0114: every task within +50% of files plus CLI, quality held): [ROUND5.md](ROUND5.md).
All rounds compared, with the measured tests explained and where Sketchbook sits against outside benchmarks: [SUMMARY.md](SUMMARY.md).

- Claude Code 2.1.322, `claude-sonnet-5-5` and `claude-opus-5-5`, `--effort medium`, engine built from the working tree of the time (the work is merged into `main`; the round 5 report is commit `2d5cac2`).
- 32 task runs, API cost $21.33 (from `total_cost_usd`), plus about $0.40 of probes.
- Raw per-run table: [`results.tsv`](results.tsv). Generated pages and authored specs: [`outputs/`](outputs/). Scripts: [`scripts/`](scripts/). Prompts: [`prompts/`](prompts/).

## Arms

| Arm | What the agent has |
|---|---|
| A0 nothing | an empty folder with a `package.json` |
| A1 harness only | the installed Claude layer (CLAUDE.md, rules, skills, hooks) with the CLI commands denied |
| A2 CLI only | the project `sketchbook init --start blank` makes, no Claude layer and no CLAUDE.md; one line in the prompt says `npx sketchbook help` exists |
| A3 harness + CLI | A2 plus the Claude layer installed |

Isolation: `--setting-sources project,local --strict-mcp-config --no-session-persistence`, so the person's own user settings, plugins and MCP servers do not load. Built-in skills load in every arm.
A1 is not a clean "no CLI": the deny list is prefix based and the agent still tried the CLI in authoring (3 to 14 attempts per run).

## 1. Token consumption: fixed context before any work

One trivial prompt ("Reply with the single word OK"), tokens = input + cache write + cache read.

| Arm | Sonnet tokens | Sonnet cost | Opus tokens | Opus cost |
|---|---|---|---|---|
| A0 / A2 (no Claude layer) | 18.4k | $0.026 / $0.027 | 18.2k / 18.4k | $0.053 / $0.055 |
| A3 (Claude layer) | 35.1k | $0.094 | 35.1k | $0.189 |

The Claude layer adds about 16.7k tokens to every session, roughly doubling the starting context. Round 5 (SB-0114) measures +3.75k with the lighter layer: [ROUND5.md](ROUND5.md). A trivial prompt costs 3.6x more on both models (cache write is priced above cache read, so later turns cost less than this first one).
The CLI alone adds nothing.

## 2. Documenting a design system: author the Switch spec

Task: write the Switch specification (hold-out: `switch` is removed from the engine's catalog, so `sketchbook add switch` is not available). Scored against the real Switch contract.

| model | arm | n | $ / run | turns | tokens in (M) | wall s | quality |
|---|---|---|---|---|---|---|---|
| sonnet | A0 | 2 | 0.11 | 5 | 0.10 | 41 | expert 14.5/16, contract 0/2, check 0/2 |
| sonnet | A1 | 2 | 0.79 | 46 | 2.00 | 195 | expert 14.0/16, contract 2/2, check 2/2 |
| sonnet | A2 | 2 | 0.67 | 48 | 1.97 | 174 | expert 16.0/16, contract 2/2, check 2/2 |
| sonnet | A3 | 2 | 0.68 | 36 | 1.80 | 157 | expert 15.0/16, contract 2/2, check 2/2 |
| opus | A0 | 2 | 0.63 | 11 | 0.27 | 181 | expert 14.5/16, contract 0/2, check 0/2 |
| opus | A1 | 2 | 1.65 | 32 | 1.82 | 282 | expert 16.0/16, contract 2/2, check 2/2 |
| opus | A2 | 2 | 1.45 | 27 | 1.19 | 270 | expert 15.5/16, contract 2/2, check 2/2 |
| opus | A3 | 2 | 1.49 | 31 | 1.80 | 234 | expert 15.0/16, contract 2/2, check 2/2 |

"expert" = items out of 16 that the brief did not name (role=switch, Space key, focus-visible, target size, contrast, reduced motion, ...), matched by text. The real contract scores 15 of 16 on the same rubric.
"check" = `sketchbook check` C1, C2, A1, T7, H1 pass.

- **The content is the same.** A bare model writes a Switch spec as good as the contract on the text rubric (14.5 of 16 vs 14 to 16). The text rubric cannot tell the arms apart.
- **What differs is form.** Every run with the project (A1, A2, A3: 12 of 12) produced a schema-valid `contract.json` plus `contract.md` that passes the checks and is close to the gold structure (19 to 20 of 20 top-level fields, 10 to 11 props against 10, 12 of 12 accessibility fields, 16 to 34 component tokens against 32, 1 to 2 events against 2). The bare runs wrote one Markdown file with no schema, no validation and no tokens.
- **The price is 2 to 7 times.** Sonnet $0.11 vs $0.67 to $0.79 (6 to 7x), Opus $0.63 vs $1.45 to $1.65 (2.3 to 2.6x); 4 to 5x the time on Sonnet, 1.3 to 1.6x on Opus.
- **Harness vs CLI.** A3 is no cheaper than A2. It does use fewer CLI calls (6 vs 14 to 26: A2 discovers the CLI by trial and error) and fewer turns on Sonnet (36 vs 48). With 2 runs per cell that is inside the noise.

## 3. Generating UI: a Notification settings card

Task: one `out/settings.html`, no build step, three switches, a Save button, light and dark, keyboard. "If the project has a design system, use it."

| model | arm | n | $ / run | turns | tokens in (M) | wall s | quality |
|---|---|---|---|---|---|---|---|
| sonnet | A0 | 2 | 0.07 | 4 | 0.08 | 19 | kbd 2/2, axe 0.0, theme 2/2, tokens-only 0/2, sb-components 0/2 |
| sonnet | A1 | 2 | 0.36 | 18 | 0.71 | 75 | kbd 2/2, axe 0.0, theme 2/2, tokens-only 1/2, sb-components 0/2 |
| sonnet | A2 | 2 | 0.27 | 27 | 0.65 | 72 | kbd 2/2, axe 0.0, theme 2/2, tokens-only 1/2, sb-components 2/2 |
| sonnet | A3 | 2 | 0.31 | 18 | 0.65 | 61 | kbd 2/2, axe 0.0, theme 2/2, tokens-only 2/2, sb-components 0/2 |
| opus | A0 | 2 | 0.20 | 7 | 0.13 | 40 | kbd 2/2, axe 0.0, theme 2/2, tokens-only 0/2, sb-components 0/2 |
| opus | A1 | 2 | 0.70 | 21 | 0.75 | 96 | kbd 2/2, axe 0.0, theme 2/2, tokens-only 2/2, sb-components 0/2 |
| opus | A2 | 2 | 0.66 | 24 | 0.73 | 110 | kbd 2/2, axe 0.0, theme 2/2, tokens-only 1/2, sb-components 1/2 |
| opus | A3 | 2 | 0.62 | 17 | 0.63 | 80 | kbd 2/2, axe 0.0, theme 2/2, tokens-only 2/2, sb-components 0/2 |

Scored in Chromium by a script that does not belong to any arm: renders without errors, 3 `role=switch`, Space toggles one, the form submits one field, axe-core (light and dark), theme response to `data-theme="dark"` and to `prefers-color-scheme`.

- **Function and accessibility are saturated.** All 16 pages render, toggle by keyboard, submit, and have 0 axe findings. For a page this simple, the bare model is just as accessible.
- **Token use is the difference.** A0 hard-codes its own palette in all 4 runs (19 to 29 literal colours, 0 design tokens). The project arms use the project's semantic tokens: 12 of 12 runs reference `var(--sb-*)`, and 9 of 12 use tokens only. The other 3 carry literal colours: a pasted copy of the token values instead of a link to them.
- **Theme axis.** All 16 pages follow the OS dark mode. Only the project arms (12 of 12) respond to the design system's own `data-theme` switch; A0's 4 pages do not, so a theme switch in the product would skip them.
- **Components were barely used.** In a blank project (`--start blank`) the components are not installed, and `sketchbook add` has to be run. Only A2 did (3 of 4 runs used `sb-*` elements). A1 and A3 built native `<input role="switch">` styled with tokens: A3 said Card and Switch were "planned" and chose not to run the contract flow. That is a harness behaviour worth looking at (see next steps).
- **The price is 3 to 5 times** ($0.07 vs $0.27 to $0.36 on Sonnet, $0.20 vs $0.62 to $0.70 on Opus).

## What this supports, and what it does not

- Supported: the harness and CLI give **conformance**: a spec in the project's own format that validates, UI built on the project's tokens, and the theme axis. They do not give a cheaper or faster result, and on these two tasks they did not change accessibility or function.
- Supported: the fixed cost of the Claude layer is real and measurable (+16.7k tokens per session), and shows in every run.
- Not supported (not measured): that the harness beats the CLI alone. A1, A2 and A3 are within noise of each other on cost and quality.
- This is consistent with outside evidence that repository context files raise cost (about 20% in the ETH Zurich AGENTbench study, read here only through secondary write-ups) and lift success little on average. The value here is in conformance, not in raw task success. No benchmark we found scores design-system adherence (Design2Code, WebGen-Bench and UI-Bench measure fidelity, function and taste), so these scorers are ours.

## Caveats

- n = 2 per cell, one component, one UI. No significance claims.
- The authoring rubric is text-matched and saturated; structure against the gold contract is the more telling signal, and it is only available for runs that wrote a `contract.json`.
- The scorers were calibrated on the real Switch contract and on a hand-built page, but they are ours. Token use is counted by regex over the page's own CSS.
- The real Switch contract is in this repo and may be in the model's training data through shadcn/ui; the hold-out only removes it from the catalog.
- A1's CLI denial is incomplete (see Arms).
- Cost is API list price from the CLI's own report; cache effects make the first turn look more expensive than later ones.
- The first pilot attempt was invalid: the sandbox sat under `~/.claude/`, where Claude Code refuses writes ("sensitive file"). It was discarded and rebuilt in `/tmp`. Keep sandboxes out of `~/.claude/`.

## Next steps (not done)

1. Look at why A1 and A3 did not run `sketchbook add` for Card, Button and Switch in the UI task, and whether CLAUDE.md or `/add` should say so.
2. More reps (5+) and the `--start library` starter, where components are already installed, to measure component adherence rather than token adherence.
3. Defect catch rate: inject known defects and compare the checks with an agent reviewing alone.
4. A figma output (code to design) and a second brand and prefix, to test generalisation.

## Reproduce

```
npm run build && npm pack --pack-destination <dir>
bash scripts/setup-arms.sh <engine.tgz> <root>/tpl author   # engine without switch in the catalog
bash scripts/setup-arms.sh <engine.tgz> <root>/tpl ui
BENCH=<root> REPO=$PWD bash scripts/run.sh <author|ui|probe> <a0|a1|a2|a3> <sonnet|opus> <rep>
node scripts/collect.mjs <root> results.tsv && node scripts/aggregate.mjs results.tsv
```
