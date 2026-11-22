---
name: review-rangers
description: >
  Multi-perspective review by a committee of independent lenses (security,
  performance, maintainability, testability, Web Components,
  contract/tokens, accessibility, architecture) plus a safety guard with
  veto, sized by risk; HIGH/MEDIUM/LOW/VETO verdict and a human-checked fix
  loop. Trigger: a structured review of code, contracts, architecture
  decisions or pull requests.
---

# Review Rangers

## When to use

Use this skill when:

- A code change, contract change, architecture decision, or artifact carries
  meaningful risk.
- A single reviewer perspective is likely to miss domain-specific edge cases.
- You need a structured verdict, not an opinion.
- Pull requests, contract designs, security decisions, or architecture
  changes require adversarial scrutiny.
- A skill restructure, agent change, or spec needs cross-domain validation
  before committing.

Do not use this skill for:

- Trivial single-file edits with no systemic impact.
- Tasks already covered by a domain-specific automated linter or test suite.
- Reviews where committee overhead exceeds the risk of getting it wrong.

---

## Critical patterns

### 1. Core workflow

1. Identify the target (code, contract, decision, artifact) and its domain.
   Only use independent reviewers if the client supports delegation and the
   user and applicable project policy authorize it. People can also run the
   briefs independently. Otherwise use the lenses yourself and report a
   single-reviewer advisory: **independent verdict not assessed**. Do not
   claim an independent vote, safety guard, or approval.
2. Determine committee size by risk: 2 members for a routine change in one
   component, contract or skill; 3 for a new component or a change across
   components; 5 only for high-risk or cross-domain targets (security, form
   association, the harness itself). Every member is a full agent with its own
   uncached context, so size is the main cost lever.
3. Assign each member a distinct evaluation lens from the lens catalog below.
   Run them independently — no member sees another's output.
4. Determine the expert domain for the safety guard.
5. Spawn 1 safety guard. It evaluates the target from an authoritative
   expert position.
6. Run the committee and safety guard in parallel: each is a general-purpose
   independent reviewer, given a brief filled from
   `assets/committee-member-template.md` or `assets/safety-guard-template.md`.
7. Collect all outputs.
8. Synthesize a structured verdict following the Synthesis Rules.
9. Emit the verdict with confidence tier, top findings, and recommended
   action.
10. **If the tier is below HIGH**, enter the **Remediation Loop (The
    Mender)** — see that section. The committee/safety guard remain
    read-only judges; the Mender executes fixes; the committee re-reviews
    after each round. The loop is bounded and escalates critical findings to
    a human.
11. Emit the **final report** once the committee returns HIGH, or once the
    loop hits a critical stop / bound and control returns to the human.

---

## Decision tree

```text
Is there a safety guard blocker?
  YES -> VETO — hard block regardless of committee output

Does the safety guard pass?
  YES -> evaluate committee output

Do 3+ of 5 committee members (2+ of 3, or both of 2) flag a risk?
  YES -> LOW — block and require remediation
  NO  -> continue

Does any committee member flag a security or accessibility risk?
  YES -> LOW at minimum — escalate to safety guard if not already covered

Does committee majority agree the target is sound?
  YES and safety guard passes -> HIGH or MEDIUM depending on split
                                 (with 2 members, one flag and one pass is a split: MEDIUM)
  NO                          -> LOW
```

---

## Committee Protocol

### Size

| Target Risk               | Committee Size |
| ------------------------- | -------------- |
| Routine (one component, contract or skill) | 2 members |
| New component, or a change across components | 3 members |
| High-risk or cross-domain (security, form association, the harness) | 5 members |

### Lens Catalog

Assign lenses based on what is being reviewed. Never assign the same lens to
two committee members.

| Lens                    | What It Evaluates                                                                                                                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Security**            | XSS vectors, injection risks, token/credential exposure, authentication, unsafe HTML rendering                                                                                                        |
| **Performance**         | Attribute-driven re-render cost, `attributeChangedCallback`/`#render()` batching, bundle size, lazy loading                                                                                           |
| **Maintainability**     | Component cohesion, code clarity, naming conventions, modularity, duplication                                                                                                                         |
| **Testability**         | Behavior-spec coverage of states and edge cases (Playwright against Storybook; there is no coverage tooling), whether a Playwright behavior spec exists for the changed surface                                                                                                         |
| **Platform Patterns**   | Attribute/slot design, composition over configuration-attribute proliferation (see `web-components-best-practices`)                                                                                   |
| **Contract Compliance** | Whether the component's props/tokens/behavior match `spec/components/<name>/contract.md` + `contract.json` and validate against `spec/schemas/contract.schema.json` (`npm run check`) — not hard-coded values that drift from the contract |
| **Accessibility**       | WCAG 2.2 Level AA — keyboard access, focus indicators, ARIA roles/semantics, contrast, target size, Shadow DOM boundary concerns (see `a11y-checker`)                                                 |
| **Motion**              | GPU-safe properties, easing/duration standards, interruptibility, `prefers-reduced-motion`/hover gating, reuse-by-copy consistency across sibling components (see `motion`'s `review` mode, optional, if installed)           |
| **Architecture**        | Contract integrity, repo layout, skill/agent cohesion, naming consistency (`sb-` tag prefix)                                                                                                                             |

### Independence Rules

- Run committee members in parallel.
- Pass only the target artifact and the member's assigned lens as context.
  Name the target by path and line range; never paste file contents into the
  prompt.
- Define the evidence and scope each reviewer needs. Do not select or assume a
  model; use the available, authorized review capabilities.
- Ask each member for at most 8 findings in the template's format (about
  1.5k tokens); synthesis needs ranked findings, not narration.
- Do not share intermediate findings between members before synthesis.

---

## Safety Guard Protocol

### Domain Resolution

```text
Target is under src/components/**?            -> Domain: "Web Components + TypeScript conformance for sketchbook"
Target is under spec/components/<name>/**?   -> Domain: "Component-contract schema conformance (contract-first)"
Target is a skill or agent brief?             -> Domain: "sketchbook skill/agent architecture (forge-me-a-skill conventions)"
Target is an architecture decision?           -> Domain: "sketchbook repo structure and conventions"
Target is unclear?                            -> Ask before spawning
```

### Specialization

The safety guard:

- Operates as an authoritative expert, not a peer reviewer.
- Evaluates the target for correctness, safety, and conformance to domain
  standards.
- Raises blockers, not suggestions. A structural flaw from the safety guard
  is a hard finding.
- Runs in parallel with the committee, not after it.

---

## Synthesis Rules

### Confidence Tiers

| Tier       | Condition                                                      | Recommended Action                          |
| ---------- | -------------------------------------------------------------- | ------------------------------------------- |
| **HIGH**   | Safety guard passes + committee majority agrees                | Approve with noted caveats                  |
| **MEDIUM** | Safety guard passes + committee is split (2 members: one flags, one passes) | Approve after addressing split findings     |
| **LOW**    | Safety guard raises a blocker OR committee majority flags risk | Block — require remediation before approval |
| **VETO**   | Safety guard raises a structural flaw                          | Hard block — do not proceed                 |

### Contradiction Handling

- Safety guard findings override committee findings on correctness and
  safety.
- When committee members contradict each other, count lenses: majority
  rules unless a minority finding is a security or data-integrity concern.
- A single security or accessibility finding from any voice is sufficient
  for LOW or VETO tier.

### Verdict Structure

Emit exactly this structure:

```text
CONFIDENCE: {HIGH | MEDIUM | LOW | VETO}

SUMMARY:
{1–2 sentences on the overall state of the target}

TOP FINDINGS:
1. [{Lens / Safety Guard}] {Finding} — {Severity: Info | Warning | Blocker}
2. [{Lens / Safety Guard}] {Finding} — {Severity: Info | Warning | Blocker}
...

RECOMMENDED ACTION:
{Approve | Approve with caveats | Block — remediate before resubmit | Hard block}
```

---

## Remediation Loop — The Mender

The committee and safety guard **judge**; they never fix. **The Mender** is
the remediation worker that **executes** the fixes for findings below HIGH
confidence, in a controlled loop with the conversation orchestrator. The
Mender never declares confidence — the committee re-judges after every
round. This makes the review _act_ on its own findings (deep autonomous
iteration) while keeping the human in the loop only for what is critical or
unresolvable.

### Roles (do not blur them)

| Role                        | Reads | Writes          | Decides confidence                |
| --------------------------- | ----- | --------------- | --------------------------------- |
| Committee (Rangers)         | ✅    | ❌              | contributes lens findings         |
| Safety Guard (expert)       | ✅    | ❌              | VETO authority                    |
| **The Mender** (worker)     | ✅    | ✅ (Edit/Write) | **never** — only executes         |
| Orchestrator (conversation) | —     | —               | runs the loop, emits final report |

### HITL Checkpoint (before The Mender acts)

After the verdict is emitted and the tier is below HIGH, the orchestrator
MUST pause at a **human-in-the-loop checkpoint**: present the findings and
ask the person to approve firing The Mender. A request for review is not
permission to change files.

### Loop Protocol

```text
1. Committee + Safety Guard emit tier (HIGH | MEDIUM | LOW | VETO).
2. If HIGH → emit final report. Done.
3. If a CRITICAL-STOP condition applies → STOP, escalate to human (no auto-fix). Done.
4. HITL checkpoint: approve firing The Mender?
5. The Mender remediates the open findings, then leaves the tree GREEN (see its contract below).
6. Orchestrator re-invokes the committee + safety guard on the changed target.
7. Tier improved to HIGH? → final report.
   Not yet, and within bounds? → back to step 3 (next round).
   Bound exhausted / stagnation? → STOP, escalate to human.
```

The orchestrator MAY re-invoke individual committee members or the safety
guard mid-round to help The Mender reason about a complex or ambiguous
finding before it acts.

### The Mender's Contract ("done" means)

- Remediates the specific findings handed to it — nothing out of scope.
- **Leaves the working tree green** for whatever validation applies to the
  changed surface:
  - Web Components under `src/components/`: `npm run typecheck` passes.
  - Contract or spec changes under `spec/`: `npm run check` passes.
  - Behavior changes: `npm run test:component` passes.
    It does NOT return code it knows is broken for the committee to discover.
- If it touched **testable code**, the fix carries or updates the
  component's Playwright behavior spec (`playwright/tests/<name>/<name>.behavior.spec.ts`);
  per `features.testFirst`, the spec is written first and must fail before
  the fix. Non-code findings route to their fitting verification instead
  of a behavior spec.
- **Never declares confidence** and never edits the committee's verdict —
  it reports _what it changed_, the committee reports _whether it's now
  HIGH_.
- Returns a structured change summary (files touched, finding→fix mapping,
  validation status).

### Critical Stop — escalate to human (never auto-resolve)

If any of these holds, the loop STOPS and hands control to a human with a
clear report — The Mender does NOT auto-resolve it:

| Condition                                                                                                                  | Why it needs a human                           |
| -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| **VETO persists** after a remediation round                                                                                | A structural flaw the AI could not clear       |
| **Security or accessibility finding at Severity: Blocker**                                                                 | High user/safety impact — needs human sign-off |
| **Breaking change to a published package's public API**                                                                    | Consumer impact — requires human decision      |
| **Contract change with cascade impact** (e.g. a `spec/schemas/contract.schema.json` change affecting every component) | Affects every consumer of the contract         |

### Loop Bounds (termination safeguard)

Independent of the critical-stop table, the loop MUST terminate:

- **Max 3 remediation rounds.** On the 3rd unresolved round → escalate to
  human.
- **Stagnation detection:** if the same finding survives **2 consecutive
  rounds** with no progress → escalate to human (the Mender is stuck; a
  person decides).

### Recursion Cut (do not nest flows)

- The Mender's "green" is satisfied by the validation commands above and
  the targeted behavior specs — it does **not** spawn a nested review or a separate
  verification flow inside the loop.
- Re-review is done by the **committee itself**, not by invoking this skill
  again or delegating to another review flow. This prevents an unbounded
  `review-rangers → Mender → review-rangers → …` recursion.

---

## Flagging Non-Obvious Findings

`spec/decisions/DECISIONS.md` is this repo's standing decision log for
the design system — after emitting the verdict, append an entry (newest
first; Context/Decision/Why/Watch out, following the log's own format)
for any finding that's worth remembering beyond this single review:

- Confidence tier is `LOW` or `VETO`.
- Any finding carries `Severity: Blocker`.
- A committee member or safety guard identified a non-obvious pitfall that
  is likely to recur in future work (e.g. a subtle API misuse, a Web
  Components constraint, a contract-schema violation, a
  design-to-CSS translation gotcha).

Also call these out explicitly in the response to the user rather than
letting them get buried in the verdict table. Not every finding belongs in
the log — a one-off, component-specific fix stays in that component's
`contract.md`/code comments; the log is for patterns likely to recur
_across_ components. If a finding instead belongs in `hammock`'s
`docs/simplicity-debt.md` or a follow-up task, that's the user's call to
make, not this skill's to decide unprompted.

---

## Commands

No commands of its own; the Mender uses `npm run typecheck`, `npm run check` and `npm run test:component` (see The Mender's Contract).

---

## Resources

- Committee member prompt template : [assets/committee-member-template.md](assets/committee-member-template.md)
- Safety guard prompt template: [assets/safety-guard-template.md](assets/safety-guard-template.md)
- The Mender (remediation worker) prompt template: [assets/mender-template.md](assets/mender-template.md)
