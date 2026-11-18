# Design-file practices

How a component is built in a design file is registered in [`spec/figma-practices.json`](../spec/figma-practices.json): for each aspect, the options found in the libraries studied (Carbon v11, Helsinki 6.0.0 and a third product system, cited only as `reference-c`) and the one Sketchbook adopts, with the reason (decision SB-0079). `sketchbook api practices` lists the aspects; `sketchbook api practices <aspect>` shows the options and why one is adopted. Check A1 fails when an adopted option does not exist or a cited source is not listed.

The studied files were read for their approach only: nothing is copied from them, and the third source is not named anywhere in this repository.

## Rules
- The registry records the approach; the generators implement it. Change an aspect by a new decision, then rebuild the sets it touches.
- Names in the design file come from [`spec/api.json`](../spec/api.json) (the API vocabulary), never from text written per contract.
- A component description in the design file is generated from `contract.md`, `contract.json` and the registry. Nothing is written in the file by hand.
- What the file draws must equal what the contract and its tokens say, which is also what Storybook renders: `sketchbook sync verify` reads the file back and compares.

## Adding or changing an aspect
1. Add the aspect with every option seen (each `seenIn` a key of `sources`) and set `adopted` to one of them with a one-line `reason`.
2. Run `sketchbook api practices <aspect>` and `npm run check`.
3. Record a new decision that supersedes the old adoption when an adopted option changes.
