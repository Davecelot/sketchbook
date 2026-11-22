# Rule: the spec is the source

- Change `brand.config.json`, `spec/tokens/semantic/*`, or a contract; then rebuild. Never edit `generated/**`, `spec/tokens/foundation/*` (hand edits there become flagged overrides), `src/index.ts` or `*.styles.ts` by hand.
- Component CSS may use only its own component token variables (`--sb-<component>-*`) and private `--_*` properties. Need another value? Add a component token to the contract first.
- A literal value in component CSS needs a `/* sketchbook-allow-literal: <reason> */` comment on the line before; check T5 reports it as a warning.
- Never change an accepted decision in `spec/decisions/DECISIONS.md` (hook guard-decisions blocks it). Propose a new one that supersedes it.
