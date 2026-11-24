---
description: Import existing tokens (DTCG / Tokens Studio, CSS custom properties) as a reviewed proposal, then apply
---

Use the `foundations` skill in `import` mode for "<input>".

1. If no file is given, ask for it. Infer `--from` from the content when it is not given (`$value`/`$type` → `dtcg`; `--name:` declarations → `css`) and say what you inferred.
2. `sketchbook tokens import <file> --from <format>` → `generated/import/<name>.proposal.json`. Nothing else changes.
3. Follow `agent:foundations/token-mapper` or hand the brief to an authorized reviewer with the proposal path. Write only `generated/import/<name>.mapping.json`.
4. Review with the person: unmapped interface tokens, candidates to choose between, new roles, foundation candidates (preset or custom scale), contrast failures. One decision at a time, each with a recommendation.
5. Reflect agreed choices in the original `.proposal.json` and skip unresolved entries (`"apply": false`). `import apply` does not consume the advisory `.mapping.json` or rename tokens. Preview with `sketchbook tokens import apply generated/import/<name>.proposal.json --dry-run`; apply only after approval.
6. Close as the skill says (diff, impact, check, Storybook `Foundations/*`, proposed decision record, Figma sync offer).

Run `sketchbook help tokens` to confirm the import options.
