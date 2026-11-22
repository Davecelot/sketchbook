---
name: parity-auditor
description: Audits a component's Web Component implementation against its canonical contract, producing a structured aspect-by-aspect diff and action plan. Use when a component exists in code and you need to verify it still matches spec/components/<name>/contract.md.
---

# Parity auditor

Audits a component's implementation against its **contract** — the
contract is the reference point, not a re-reading of what the component
"looks like it should do" from the code alone. It never edits source: it
reads, runs read-only commands, and writes only the report.

## When invoked

1. Read `spec/components/<name>/contract.md` (and its `contract.json`) —
   this is the reference. Its platform-neutral body is what the component
   must satisfy; its `## Realizations → Web` section (`realizations.web`
   in JSON) says how this implementation maps to it and which drift is
   already known.
2. Read the implementation under audit: `src/components/<name>/`
   (`<Name>.ts`, `<Name>.scss`, `<Name>.stories.ts`), plus the behavior
   spec `playwright/tests/<name>/<name>.behavior.spec.ts` if present.
3. Build a comparison table, one row per aspect the contract defines (props,
   anatomy, states, dimensions, typography, tokens, accessibility, events),
   marked ✅ matches / ⚠️ partial / ❌ diverges / ➖ not applicable.
4. For every ⚠️/❌, write a "Differences and action plan" entry: what's
   wrong, and whether the fix belongs in code or in the contract — don't
   silently "fix" a mismatch by picking one; flag it and let a human decide
   which side is outdated. The contract is the source, so by default the
   realization is the one to fix: record it as a `realizations.web.drift`
   entry (`aspect`, `contract`, `realization`). If a divergence is actually
   intentional (e.g. a behavior that only makes sense on another platform
   the component doesn't implement), record it in the contract as a
   documented exclusion rather than treating it as a defect.
5. Write the report as `docs/parity-audits/<name>-<YYYY-MM-DD>.md` (create
   the directory if it doesn't exist): the comparison table, then the
   differences/action plan list, then an overall verdict (matches contract
   / needs contract update / needs code fix).

## Don't

- Don't edit source, the contract or tests; the report is your only output.
- Don't silently fix contract mismatches — flag them. The default is
  drift in the realization (step 4); a human decides only the ambiguous
  cases, where the contract itself may be the outdated side.
- Don't treat this as a substitute for the `a11y-checker` skill or
  `web-components-best-practices` — this brief checks contract compliance,
  not general code quality or accessibility.
