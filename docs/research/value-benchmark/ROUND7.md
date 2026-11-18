# Value benchmark, round 7 (2026-11-15): does the page-outline hook (SB-0117) close `page-has-heading-one`?

Round 6 showed that written guidance in the card contract did not change Sonnet's pages: 0 of 10 were axe-clean, all for `page-has-heading-one`. No session ran `sketchbook check`, so a check would not have fired either. SB-0117 adds a PostToolUse hook: when Claude writes a full HTML page that uses `sb-*` components without a level-1 heading or a `<main>`, the hook reports it back in the same turn.

Setup is round 6's, with the engine packed from the SB-0117 branch: arm **A3**, library starter, the same UI prompt, `claude-sonnet-5-5` at `--effort medium`, 10 runs, $1.98 in total.

## Result

| | Round 6 (guidance only) | Round 7 (hook) |
| --- | --- | --- |
| No axe findings (light and dark) | 0/10 | 10/10 |
| `page-has-heading-one` | 10/10 | 0/10 |
| `landmark-one-main` and `region` | 3/10 | 0/10 |
| Pages with `<h1>` and `<main>` | 0/10 h1, 7/10 main | 10/10 both |
| Cost per run | $0.21 | $0.20 |

In 7 of the 10 transcripts the session names the hook while fixing the page ("Adding the missing `<h1>` the page-outline hook flagged"). The other 3 pages had both elements without a visible trace of the hook in the transcript.

## Reading

A gate that fires on the write closes the finding where guidance did not, at no measurable cost. It is a static check, not axe: it cannot see headings or landmarks a script adds, and it only runs in Claude Code sessions with the Claude layer installed (SB-0117, Watch out).

## Limits

One task, one model, 10 runs. The comparison is with round 6 (same day, same prompt and starter); the engine differs only by the SB-0117 branch.

## Reproduce

As round 6 (`ROUND6.md`), with the engine packed from a checkout that has `.claude/hooks/page-outline.mjs`; results in `round7/results.tsv`.
