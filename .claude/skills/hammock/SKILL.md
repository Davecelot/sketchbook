---
name: hammock
description: >
  Decision ladder before writing code, diff review for unrequested
  abstractions, repo audit for over-engineering, and a log of deferred
  simplifications. Trigger: before a non-trivial component or contract
  change, when asked to review a diff or audit for over-engineering, or
  `/hammock [lite|full|ultra|off|review|audit|debt|gain|help]`.
metadata:
  author: sketchbook
  version: '1.4.1'
  changelog: >
    1.4.1: hooks/ are TypeScript (.mts) compiled in place to .mjs, run
    through .claude/hooks/run.mjs (SB-0119); behavior unchanged. 1.4.0: hooks inject the 1.1k-character ladder card once (session start, resume,
    clear, compact, subagent) instead of this whole file on every prompt;
    per-prompt copies stayed in the transcript and cost about 2.3k tokens
    each turn (SB-0114); affects hooks/, settings.json and the template
    settings. Review/audit findings are ranked most severe first.
  auto-invoke: Before implementing a non-trivial component or contract change
  allowed-tools: [Read, Grep, Glob, Bash, Edit, Write]
---

# Hammock

Provenance: this skill adapts the decision ladder and review/audit/debt
workflow from the `ponytail` agent skill
(MIT). Ponytail is a multi-platform agent plugin (hooks, statuslines,
mode-tracking JS for Claude/Cursor/Copilot/Codex/Qoder/Windsurf). This repo
is Claude Code only, so the plugin/hook machinery was **not** ported
wholesale — only the discipline, re-expressed as a `SKILL.md` per
`forge-me-a-skill`'s conventions, plus a
Claude-Code-native hook layer.

The name is a nod to Rich Hickey's "Hammock Driven Development" talk: get
in the hammock, think the problem through before typing, and you'll write
far less code than if you'd started typing immediately. That's the whole
skill in one sentence.

This skill reinforces, and makes checkable, the minimalism rules already in
[`CLAUDE.md`](../../../CLAUDE.md).

---

## When to use

Use this skill when:

- About to implement a non-trivial component, contract change, or utility
  and want a quick gut-check before writing code.
- Asked to review the **current diff** for unrequested abstractions or
  scope creep (`review` mode).
- Asked to sweep the whole repo for over-engineering smells (`audit` mode).
- A deliberate simplification was just made and is worth remembering later
  (`debt` mode).
- Wrapping up a session and want a one-line "what we avoided building"
  recap (`gain` mode).

Do not use this skill for:

- Skipping validation, accessibility, security, or anything a component's
  `contract.md` requires — see Non-negotiables in Critical patterns; this skill never
  trades those away for brevity.
- Auto-fixing findings from `review`/`audit` without asking first — report,
  then let the user decide (an advisory-only contract).
- Blocking a commit or push — there's no git hook wiring this in; it's a
  thinking aid and a reporter, not a gate on individual findings (see
  Enforcement below for what _is_ automatic).

---

## Critical patterns

### 1. The decision ladder

The single most important pattern in this skill. Before writing new code,
walk this in order and stop at the first `yes`:

```text
1. Does this need to exist at all?            -> if not requested, skip it (YAGNI)
2. Already in this codebase?                  -> reuse it
3. Already defined in the component contract? -> follow contract.md, don't invent
4. Built into the framework/stdlib?           -> use it
5. Already a dependency?                      -> use it, don't add a new one
6. Can it be one line?                        -> stop there
7. Only then                                  -> minimum viable code, nothing speculative
```

Concretely, before adding a helper:

```bash
# Don't reach for a new utility file first — grep the codebase and the
# framework before writing one line:
grep -rn "formatLabel" src/components
# Intl.* / native platform APIs often already cover it — step 4 of the ladder stops here.
```

### 2. Non-negotiables — never simplify away

Regardless of intensity level, these are never cut:

- Input validation and error handling that prevents data loss.
- Accessibility (this is a design system — an a11y regression ships to
  every consumer).
- Anything a component's `contract.md` explicitly requires.
- A feature the user explicitly asked for, even if it looks avoidable.

### 3. Advisory-only contract for `review`/`audit`

Like an advisory security reviewer, this skill reports findings — it does not
autonomously delete code, revert abstractions, or refactor without asking.
Mark a deliberate exception inline instead of silently "fixing" it:

```ts
// Simplified: single size variant only, revisit if more are requested
```

Then log it via `debt` mode if it's worth tracking across sessions.

---

## Decision tree

```text
User invokes /hammock [mode]
    |
mode = (none) or "lite"?
    |-- yes --> state the ladder result for the task about to be done,
    |           suggest a simpler alternative, then implement either way
    |
mode = "full"?
    |-- yes --> enforce the ladder strictly before writing new code this session
    |
mode = "ultra"?
    |-- yes --> also push back to the user if the requirement itself looks speculative
    |
mode = "off"?
    |-- yes --> skip the ladder for this session; non-negotiables still apply
    |
mode = "review"?
    |-- yes --> git diff scope --> scan for smells (see below) --> report, don't auto-fix
    |
mode = "audit"?
    |-- yes --> run scripts/audit-simplicity.sh across src/components --> report
    |
mode = "debt"?
    |-- yes --> docs/simplicity-debt.md exists? --> append entry
    |           not exists? --> create from assets/DEBT-LOG-TEMPLATE.md first
    |
mode = "gain"?
    |-- yes --> summarize this session's avoided lines/files/deps from the
    |           conversation (not a stored metric — nothing to compute)
    |
mode = "help"?
    +-- yes --> print the mode table below
```

### What `review`/`audit` scan for

- Abstractions (wrapper components, generic helpers) used by exactly one caller.
- New files where the change fit in an existing one.
- New dependencies where an existing one (or the stdlib/framework) already covers it.
- Dead exports / unused props added "for flexibility."
- Deep prop-drilling or config objects speculative beyond the current contract.

---

## Enforcement

Claude Code hooks in `.claude/settings.json` (scripts under
[`hooks/`](hooks/), TypeScript `.mts` compiled in place to `.mjs` and run
through `.claude/hooks/run.mjs`, SB-0119) make the parts of this skill that are mechanically
checkable automatic, rather than depending on an agent remembering to run
`/hammock`:

- `SessionStart` (matcher `startup|resume|clear|compact`) injects the ladder
  card, [`assets/DECISION-LADDER.md`](assets/DECISION-LADDER.md) (about 300
  tokens), never this whole file. It comes back after compaction, so it is
  in context for the whole session without the agent invoking the skill.
- `UserPromptSubmit` only tracks the level: it injects the card again when
  `/hammock <level>` changes it, and nothing on ordinary prompts. Hook
  context stays in the transcript, so a per-prompt copy would be paid on
  every later turn (ponytail and caveman inject once for the same reason).
- `SubagentStart` injects the same card into every Task-spawned subagent
  (session context doesn't otherwise reach them).
- This file loads only when `/hammock <mode>` runs.
- `PreToolUse` + `PostToolUse` on `Edit`/`Write`/`MultiEdit` automatically
  run `scripts/audit-simplicity.sh --diff` right after any edit under
  `src/components/**`, and inject its findings back into context — no need
  to remember to invoke `review`.
- `Stop` is a safety net only: if that post-edit audit somehow never ran,
  it blocks ending the turn until it does.

What this does **not** do: verify that the ladder was actually _applied_,
or that a specific finding was addressed — that remains a judgment call for
the agent and the user, same as before.

---

## Content guidelines

### Report format for `review`/`audit`

List findings most severe first (high, then medium, then low); end with
"no findings" when the scan is clean rather than padding the report.

```
## Finding: {short title}

### Location
{path/to/file:line}

### Ladder step skipped
{which of the 7 ladder steps this violates, e.g. "step 2 — already in codebase"}

### Suggested fix
{exact change — never just "simplify this"}

### Severity
low | medium | high
```

Never auto-apply a fix from a `review`/`audit` finding — ask first, per
"Do not use this skill for" above.

---

## Commands

```bash
# review mode — scan the current diff vs. the default branch
bash .claude/skills/hammock/scripts/audit-simplicity.sh --diff

# audit mode — full sweep of src/components
bash .claude/skills/hammock/scripts/audit-simplicity.sh

# debt mode — first time: seed the log
cp .claude/skills/hammock/assets/DEBT-LOG-TEMPLATE.md docs/simplicity-debt.md
# then append a row per deliberate simplification
```

| Mode (`args`)           | Does                                                                        |
| ----------------------- | --------------------------------------------------------------------------- |
| _(none)_ / `lite`       | State the ladder result, suggest simpler alternative, implement either way. |
| `full` (default weight) | Enforce the ladder strictly before writing new code this session.           |
| `ultra`                 | Also question whether the requirement itself is needed.                     |
| `off`                   | Skip the ladder for this session; non-negotiables still apply.              |
| `review`                | Audit the current diff for ladder violations.                               |
| `audit`                 | Full-repo sweep via `scripts/audit-simplicity.sh`.                          |
| `debt`                  | Read/append `docs/simplicity-debt.md`.                                      |
| `gain`                  | Recap this session's avoided lines/files/dependencies.                      |
| `help`                  | Print the mode table.                                                       |

---

## Resources

- [`assets/DECISION-LADDER.md`](assets/DECISION-LADDER.md) — printable quick-reference card.
- [`assets/DEBT-LOG-TEMPLATE.md`](assets/DEBT-LOG-TEMPLATE.md) — template for `docs/simplicity-debt.md`.
- [`scripts/audit-simplicity.sh`](scripts/audit-simplicity.sh) — heuristic smell scan backing `review`/`audit` modes.
- [`hooks/`](hooks/) — Claude Code hooks that make context-injection and the
  post-edit audit automatic; see Enforcement above.
