# Sketchbook Workspace verification

On November 26, 2026, the Sketchbook CLI candidate passed all 14 Workspace tests, 15 terminal test scenarios, and 12 stress scenarios. The full harness suite recorded 378 passes, 8 skips, and no failures.

## What was tested

The installed tests ran on Apple silicon macOS with Node 26.5.0 and npm 11.17.0. The candidate was packed from a working copy based on `b2f810df`, with the Workspace changes applied. It used the `@usesketchbook/cli@0.8.0` version string and was installed from a local tarball. The Workspace suite also passed on Node 22.18.0.

| Run | Coverage and result |
| --- | --- |
| 15 terminal scenarios | The installed command ran in fresh, upgraded, and adopted projects. Report counts matched `sketchbook check --json` for a clean pass, a warnings-only pass, a failure with mixed findings, and a pass with a recorded override. The run also checked resize boundaries, the shared header, matching dividers in the single-finding view, editor handoff, terminal restoration, and cancellation without a surviving check process. File digests matched before and after the read-only runs. |
| 12 stress scenarios | Injected reports exercised 117 viewport combinations, navigation and handoff in a 12,000-finding report, search and filtering through resize, late results after cancellation, and unusual text. |
| 14 Workspace tests | The [regression suite](../../harness/test/workspace.test.mts) passed on both Node versions. |
| 386 harness tests | 378 passed, 8 opt-in tests were skipped, and none failed. Packing was exercised separately with `npm pack`. |

## Found and fixed

All four cases failed on the pre-fix build and passed in the regression suite and installed stress tests after the changes:

- Repeated full-width CJK punctuation could make a finding row wider than a 40-column terminal.
- Rerunning checks could move the selection to an otherwise identical finding in a different mode. Selection now distinguishes mode and brand.
- Backspace could leave part of a joined emoji in the search query.
- An emoji at the 160-character search limit could be split, causing a different emoji to match.

## Reproduce and interpret

Run `npm run build:harness`, then `node --test harness/test/workspace.test.mjs` for the Workspace suite. Run `npm run test:harness` for the full suite. To try the installed path, run `npm pack` from the checkout, install the resulting tarball in a disposable Sketchbook project, and run `sketchbook workspace` in an interactive terminal. Open **Checks**, run the checks, and compare the outcome and counts with `sketchbook check --json` from the same project root.

The terminal and stress runs used tarball SHA-256 `f2b71dea7bc1dc5d43f43a02d7480f2c9efdf5b023d2fc3459e76830fd8243a7`. The final candidate, SHA-256 `c22bc9773e56418362b90b796fdce893c4d9202cc59784e4faff224c7d9c9b76`, differed only in the synced reference project lockfile across 1,546 packed files. The full harness passed after that sync.

These runs establish the behavior in the tested macOS setup, including with color disabled. The stress report was injected to test the Workspace interface; it does not measure how long the check engine needs to produce a 12,000-finding report. Linux, Windows, and screen-reader behavior were outside this run.
