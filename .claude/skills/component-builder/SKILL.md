---
name: component-builder
description: >
  Build a component from its approved contract, test-first: stories and
  behavior spec first (seen failing), then SCSS + Lit code using only
  component tokens, then all gates, review, and beta. Trigger: after the
  planning gate passes for a component (`/add` stops at the gate), or when
  asked to "build", "implement" or "code" a component that has a contract.
metadata:
  author: sketchbook
  version: '1.2.0'
  changelog: >
    The parity-auditor brief declares its model and is launched with it
    (SB-0114); affects the beta review step.
  auto-invoke: Building, implementing or coding a component that has an approved contract
  allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, WebFetch, Agent]
---

# component-builder

Turns `spec/components/<name>/contract.json` into a working Web Component, following the harness loop. Visuals and names come from the visual reference (shadcn/ui); everything else (contract wording, tokens, accessibility, tests) is the harness's own.

---

## When to use

Use this skill when:

- The planning gate has passed for a component (`/add` stops at the gate) and it is time to build it.
- Asked to "build", "implement" or "code" a component that has a contract.

Do not use this skill for:

- A component with no contract yet (use `contract-author`; the `contract-first` rule applies).
- Writing or running Playwright specs on their own (use `playwright-worker`).

---

## Critical patterns

### Product rules (settled — do not reopen)

- The visual reference (shadcn/ui) defines look and names only: look, component and prop names, variants, sizes, theme variable names. No Tailwind, React, Radix, or shadcn CLI. Get exact visuals from the shadcn docs page https://ui.shadcn.com/docs/components/<slug> and the registry JSON https://ui.shadcn.com/r/styles/new-york-v4/<slug>.json (Tailwind classes → our tokens). Keyboard/ARIA from the WAI-ARIA APG.
- Built the contract-first standard: contract pair harness format, one custom element per .ts file, SCSS → generated .styles.ts, colocated stories, Playwright behavior specs, the reference implementation mixins/patterns.
- Accessibility first (WCAG 2.2 AA). Deviations from shadcn or the reference implementation only where WCAG requires; each logged in the contract's realizations.web.drift.
- Three token layers (D-011): component CSS uses ONLY its own `--sb-<component>-*` variables (declared in the contract's `tokens`, each aliasing a SEMANTIC token) plus private `--_*` properties. No literals (check T5) except with a `/* sketchbook-allow-literal: reason */` comment on the line before (warning). Never alias foundation tokens from a component; never edit spec/tokens/foundation.
- If a needed semantic token is missing, add it to spec/tokens/semantic/base.tokens.json (mode-independent) or to BOTH light.tokens.json and dark.tokens.json (colors), aliasing foundation tokens, with contrast pairs in your contract. List every semantic token you add in your final report.
- Native elements first (button, input, select, textarea, input type=range/checkbox/radio inside the shadow root). Compound families: each shadcn part is its own custom element named like shadcn (`sb-card-header`, `sb-tabs-trigger`), declared in the family contract's `elements` array (tag, summary, props, anatomy, content, events) — check C3 verifies each element against it. Share state between parts with `@lit/context` (installed) or parent/child queries. Roving focus: use `src/controllers/roving-focus.ts` (do not modify it; if it lacks something, work around locally and report). Form controls: use `src/mixins/form-associated.ts` + `src/mixins/native-control.ts` (Input is the model).
- Shadow DOM facts learned (SB-0009): implicit submission must be handled by the component (Enter → form.requestSubmit()); a prop that shows an error must set customError validity; only aria-label can be forwarded from host to inner control (IDREFs don't cross shadow roots); set host ARIA before first render (willUpdate).
- All docs and code comments in English. No new dependencies. The design file is synced separately with the `design-figma` skill.

### Boundaries

- Edit only: your components' spec/components/<name>/, src/components/<name>/, playwright/tests/<name>/, their entries in spec/registry.json, and semantic token additions. Do NOT edit other components, src/mixins, src/controllers, src/styles, harness/, scripts/, .storybook/, playwright/helpers, package.json. If you need a shared change, describe it in your report and work around it locally.
- Pass `SKETCHBOOK_PORT=<port>` to Playwright when several Storybooks run at once.
- At the end run the whole suite once: `SKETCHBOOK_PORT=<port> npx playwright test -c playwright/playwright.config.ts` and all gates.

---

## Decision tree

```text
Contract missing or `draft` with blocking open questions?  -> contract-author first; stop
Planning gate not passed (no approved plan.md)?            -> stop and ask for approval
Tests not yet written and seen failing?                    -> loop steps 4, before any component code
Tests failing for a wrong reason (typo, broken story)?     -> fix the test or story, not the component
Contract wrong?                                            -> fix the contract first, say so
Need a shared change (mixins, controllers, helpers)?       -> don't edit; work around locally and report
Missing semantic token?                                    -> add it (base, or light + dark), list it in the report
All gates green and parity audit done?                     -> set status beta (loop step 7)
Heading for stable?                                        -> a11y audit first (a11y-checker's a11y-auditor brief)
```

---

## The loop, per component, in this order (no skipping)

Read first: CLAUDE.md; .claude/rules/*.md (planning-gate, test-first, spec-is-source, contract-first, form-associated-controls, comment-minimalism); .claude/skills/contract-author/SKILL.md (+ agents/*.md as guidance — do the work yourself, don't spawn those agents); .claude/skills/playwright-worker/SKILL.md; .claude/skills/web-components-best-practices/SKILL.md; spec/decisions/DECISIONS.md (SB-0005..SB-0011); the models: spec/components/{spinner,button,input}/{contract.json,contract.md,plan.md}, src/components/{spinner,button,input}/*, playwright/tests/{spinner,button,input}/*, playwright/helpers/*, src/stories/contract.ts, src/styles/_a11y.scss, spec/schemas/contract.schema.json, harness/checks/*.mjs (what is enforced).

1. Contract: fill the scaffolded spec/components/<name>/contract.json and contract.md (the reference implementation headings, like Button's). Family parts go in `elements`. Contract `tag` is the root element; tokens prefix `<name>.` (kebab, e.g. `aspect-ratio.`, `radio-group.`).
2. `npm run check` passes.
3. plan.md: scope, files, test plan, a11y deviations, open questions answered with your recommendation. Status line: "Approved under SB-0011 (owner pre-approval, 2026-11-08)." Record the answers in contract.openQuestions (status answered).
4. Tests first: `src/components/<name>/<Name>.stories.ts` (title `Components/<Name>`, use argTypesFrom/argsFrom/matrixOf from src/stories/contract.ts) and `playwright/tests/<name>/<name>.behavior.spec.ts` (helpers in playwright/helpers; cover props, variants via tokens, keyboard, focus ring, ARIA/accessible name/description, events (bubbles/composed), forms where relevant, axe via axeViolations; a `screen-reader view` test with `expectScreenReaderView` when the contract binds keys beyond Tab and Enter; story views via `npm run test:component -- tests/screen-reader --update-snapshots`, reviewed). Run them and CONFIRM they fail for the right reason before writing the component. Say so in your report.
5. Implement: `<Name>.scss` (+ part SCSS in the same file; all elements of the folder import the one generated `<name>Styles` or each has its own `<Part>.scss`), `<Name>.ts` and one `.ts` per sub-element, `index.ts` exporting all; registration guard `if (!customElements.get(TAG)) customElements.define(TAG, Class)`; `declare global { interface HTMLElementTagNameMap … }`. Then `npm run generate`.
6. Green: `npm run check` (all 12 checks), `npx tsc --noEmit`, `npx eslint .`, `npm run test:harness`, and `SKETCHBOOK_PORT=<port> npx playwright test -c playwright/playwright.config.ts tests/<name>`. Don't weaken a test to pass; if the contract was wrong, fix the contract first and say so.
7. Review before beta, including the parity audit (below). Then update contract realizations.web (status complete, files incl. every element file + stories, parts, slots, spec, coverage list, drift), contract.md Realizations; set status `beta` in contract.json AND spec/registry.json (check R1 must pass).
7a. Document it in every output (check M1, `npm run check:maintainer`, must pass): docs site page (`npm run docs:components`) and a curated `site/_examples/<name>.html`; a batch in `spec/design-docs.json`; the design library (`sketchbook sync library <name>`, verify, `sync realize`) and its doc page stamped `checked` (`sync components <batch>`, compared with Storybook); `npm run catalog:build`; a new SB decision where one was made.
8. Commit on your branch, one commit per component: `git commit -m "feat(<name>): ..."` with the repository's own git identity (never hard-code a person) and any co-author trailer your session requires. Commit generated files too (tokens.css, component.tokens.json, src/index.ts, *.styles.ts) after `npm run generate`.

## Parity audit and a11y audit

The parity audit is part of the review in step 7, after the gates are green and before the status moves to `beta`. It checks the implementation against its contract, not code quality or accessibility. Its brief is [`agents/parity-auditor.md`](agents/parity-auditor.md). Launch it with the `Agent` tool as a general-purpose agent with the brief's `model`: the prompt is the brief's contents plus the component name (`<name>`); the agent stays within the brief's declared `tools` (Read, Bash, Grep, Glob) and never edits source. It writes its report to `docs/parity-audits/<name>-<YYYY-MM-DD>.md` (comparison table, differences and action plan, verdict). By default a mismatch is recorded as a `realizations.web.drift` entry; a human decides only the ambiguous cases where the contract may be the outdated side.

The accessibility audit before a component moves to `stable` is not part of this loop: it is the `a11y-checker` skill's brief, `.claude/skills/a11y-checker/agents/a11y-auditor.md`.

## When done

Per component: tests count (and that they failed first), notable decisions, a11y deviations/drift, semantic tokens added. Then: shared changes you needed, anything unfinished or failing (be explicit), final gate results, last commit hash.

---

## Commands

```bash
npm run check             # all deterministic checks (contract, tokens, registry)
npm run generate          # rebuild *.styles.ts, tokens.css, component.tokens.json, src/index.ts
npx tsc --noEmit          # typecheck
npx eslint .              # lint
npm run test:harness      # proves each check can reject
SKETCHBOOK_PORT=<port> npx playwright test -c playwright/playwright.config.ts tests/<name>   # one component's behavior spec
SKETCHBOOK_PORT=<port> npx playwright test -c playwright/playwright.config.ts                # whole suite at the end
git commit -m "feat(<name>): ..."   # one commit per component
```

---

## Resources

- [`agents/parity-auditor.md`](agents/parity-auditor.md): audits an implementation against its contract; launched in the review before beta; reports in `docs/parity-audits/`.
- `.claude/skills/a11y-checker/agents/a11y-auditor.md`: the a11y audit before stable.
- `.claude/skills/contract-author/SKILL.md`, `.claude/skills/playwright-worker/SKILL.md`, `.claude/skills/web-components-best-practices/SKILL.md`: read first.
- `.claude/rules/`: planning-gate, test-first, spec-is-source, contract-first, form-associated-controls, comment-minimalism.
- `spec/decisions/DECISIONS.md` (SB-0005..SB-0011), `spec/schemas/contract.schema.json`, `harness/checks/*.mts`.
- Models: `spec/components/{spinner,button,input}/`, `src/components/{spinner,button,input}/`, `playwright/tests/{spinner,button,input}/`, `playwright/helpers/`, `src/stories/contract.ts`, `src/styles/_a11y.scss`.
