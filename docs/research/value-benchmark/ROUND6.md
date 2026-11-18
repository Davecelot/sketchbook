# Value benchmark, round 6 (2026-11-15): does the card heading guidance close `page-has-heading-one`?

Rounds 3 and 5 traced most axe findings on DS-built pages to `page-has-heading-one`: the page title sits in `sb-card-title`, which is not a heading. The card contract now says to put a real heading inside `sb-card-title` (`contract.md` "No roles or ARIA", `contract.json` `accessibleNameSource`). This round reruns the UI task to see whether that guidance changes the output.

Setup matches round 5: arm **A3** (files, CLI and harness), library starter, the same UI prompt, `claude-sonnet-5-5` at `--effort medium`, engine packed from main on 2026-11-15. 10 runs, $2.07 in total ($0.21 per run).

## Result

| | Round 5 Sonnet (n = 5) | Round 6 Sonnet (n = 10) |
| --- | --- | --- |
| No axe findings (light and dark) | 2/5 | 0/10 |
| `page-has-heading-one` | 3/5 | 10/10 |
| Also `landmark-one-main` and `region` | 1/5 | 3/10 |
| Page built from `sb-*` components, tokens only | 5/5 | 10/10 |

Round 5's published "7/10" combined Opus (5/5 clean) and Sonnet (2/5); the Sonnet-only figure is the fair baseline here.

**The guidance did not close the finding.** 7 of the 10 sessions read `spec/components/card/contract.*`, the guidance was present in every installed project, and no run put a heading inside `sb-card-title`. Every page used `<sb-card-title>Notification settings</sb-card-title>` (or similar) as its only title.

## Reading

Written guidance in a contract the agent may or may not open is not enough for a rule the agent has no reason to look for. A gate that fails while the agent works would be: for example a page-level check (axe `page-has-heading-one`, `landmark-one-main`) the agent runs before it finishes, or an `aiHints` entry surfaced by `sketchbook docs card`. Not built; proposed on the Evidence page.

## Limits

One task, one model, 10 runs; round 5 Sonnet had 5. The engine also differs from round 5 by every change merged since 2026-11-14.

## Reproduce

```
npm run build && npm pack --pack-destination <root>
bash scripts/setup-arms.sh <root>/sketchbook-0.1.0.tgz <root>/tpl ui library
BENCH=<root> REPO=<repo> bash scripts/run.sh ui a3 sonnet <rep>     # rep 1..10
node scripts/collect.mjs <root> round6/results.tsv && node scripts/aggregate.mjs round6/results.tsv
```
