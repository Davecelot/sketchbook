---
name: forge-me-a-skill
description: >
  Create a skill, or bring an existing one in line with this repo's single
  skill standard: one folder per skill, the same frontmatter, the same body
  skeleton, and any delegated roles as briefs in the skill's own agents/
  folder. Trigger: creating a new skill or agent role, porting one from
  another repo, or auditing .claude/skills/ for consistency.
disable-model-invocation: true
metadata:
  author: sketchbook
  version: '1.2.0'
  changelog: >
    Checklist step to read the always-on usage in sketchbook doctor and
    measure tokens with fixed-context.mjs after any Claude-layer change; the
    byte budget is a proxy and H1 warns at 90% (SB-0114); affects every
    skill, brief, rule and hook change.
  auto-invoke: Creating, porting or auditing a skill or an agent role
  allowed-tools: [Read, Edit, Write, Glob, Grep, Bash]
---

# Forge Me a Skill

## When to use

Use this skill when:

- A pattern recurs and an agent needs guidance to do it the same way every
  time (authoring a contract, auditing a component, roasting foundations).
- This repo's convention differs from generic practice for a technology
  (how _we_ write a Lit component, not Lit in general).
- A workflow has enough steps or decisions that improvising gives
  different results across sessions.
- A skill is ported from another repo, or an existing one drifted from
  this standard.

Do not use this skill for:

- Something a doc or contract already covers: link it from `references/`
  or the skill's Resources, don't copy it.
- A one-off or self-explanatory task.
- A persistent rule with no workflow: that belongs in `.claude/rules/`.

---

## Critical patterns

### 1. Skills own their agents

There is no `.claude/agents/` folder. A role another agent runs (a
fresh-context critic, an auditor, a phase of a pipeline) is a brief in the
`agents/` folder of the one skill that launches it. The skill launches it
with the `Agent` tool: a general-purpose agent whose prompt is the brief
plus the inputs it names.

```text
.claude/skills/foundations/agents/foundations-critic.md   # roast mode launches it
.claude/skills/contract-author/agents/drafter.md          # phase 2 of 3
```

A brief has frontmatter `name` (its file name), `description`, `tools` and
`model` (`haiku`, `sonnet` or `opus`; the launching skill passes it to the
`Agent` tool, so pick the cheapest that does the job: `haiku` for fetch and
extract, `sonnet` for judgment).
Briefs launched this way don't get a tool allowlist from the platform, so
`tools` is a declared contract: the brief says what it must never edit, and
the launching skill tells the agent to stay inside `tools`.

```markdown
---
name: token-mapper
description: Maps imported token names onto the semantic interface; writes a proposal only.
tools: Read, Grep, Glob, Write
model: sonnet
---

You map ... Never edit spec/ or brand.config.json.
```

### 2. One folder, one source of truth

```text
.claude/skills/{skill-name}/
├── SKILL.md       # required: frontmatter + body, the only metadata file
├── agents/        # role briefs this skill launches (see pattern 1)
├── assets/        # templates, schemas, example configs
├── hooks/         # hook scripts this skill registers in .claude/settings.json
├── references/    # local docs the skill reads on demand, never web URLs
└── scripts/       # executable helpers
```

No other folders, and no `manifest.json` beside `SKILL.md`: two files
claiming the same metadata drift the moment nothing keeps them identical.

### 3. Frontmatter

| Field                    | Required | Format              | Content                                                                                       |
| ------------------------ | -------- | ------------------- | --------------------------------------------------------------------------------------------- |
| `name`                   | yes      | `lowercase-hyphens` | The folder name.                                                                              |
| `description`            | yes      | string, ≤ 400 chars | What the skill does, then `Trigger: …`, specific enough not to fire on unrelated work. It is in context in every session (SB-0114). |
| `disable-model-invocation` | no     | `true`              | Slash-command only: the description leaves the context. For skills a person starts on purpose. |
| `metadata.author`        | yes      | string              | `sketchbook` for harness-owned skills (they ship to every team); otherwise the contributor's git `user.name`. |
| `metadata.version`       | yes      | semver              | `'X.Y.Z'`; bump on every change.                                                              |
| `metadata.changelog`     | yes      | structured text     | `<what changed>; <why it matters>; <what it affects>` for the latest version.                 |
| `metadata.auto-invoke`   | yes      | string              | The condition that should make an agent load it.                                              |
| `metadata.allowed-tools` | yes      | list                | The tools the body actually asks for.                                                         |

Provenance of a ported skill goes in its `changelog`, never as a live link.
Shipped skills are white-label: no company or product names (check W1).

### 4. Body skeleton

Every `SKILL.md` body has these sections, in this order:

1. `# {Title}`
2. `## When to use`: use when / do not use for.
3. `## Critical patterns`: the rules that matter most, first.
4. `## Decision tree`: how to pick a path or mode.
5. Optional extra sections the skill needs (modes, protocols, formats).
6. `## Commands`: copy-paste commands, or a line saying there are none.
7. `## Resources`: the files in the skill's folders and the docs it reads.

Start from [`assets/SKILL-TEMPLATE.md`](assets/SKILL-TEMPLATE.md).

---

## Decision tree

```text
Template, schema or example config?                -> assets/
Executable helper?                                 -> scripts/
A hook the skill installs?                         -> hooks/ (+ .claude/settings.json)
Long local reference read on demand?               -> references/
A role another agent runs (fresh context, phase)?  -> agents/<role>.md
Persistent rule with no workflow?                  -> .claude/rules/, not a skill
Already covered by a doc or contract?              -> link it, don't copy it
```

Naming:

| Kind           | Pattern             | Examples                            |
| -------------- | ------------------- | ----------------------------------- |
| Technology     | `{technology}`      | `web-components-best-practices`     |
| Workflow       | `{action}-{target}` | `forge-me-a-skill`, `contract-author` |
| Tester/auditor | `{target}-{role}`   | `a11y-checker`, `playwright-worker` |
| Studio/area    | `{area}`            | `foundations`, `kits`               |

### Checklist before you finish

- [ ] No skill under `.claude/skills/` already covers it.
- [ ] Folder name follows the naming table; `name` matches it.
- [ ] `description` ends with a `Trigger:` clause and is at most 400 characters.
- [ ] All `metadata` fields are set; `changelog` follows the format.
- [ ] Body sections are present and in order.
- [ ] Every brief in `agents/` has `name`, `description`, `tools`, `model`.
- [ ] A new rule in `.claude/rules/` has `paths:` unless it applies to every file; a hook injects a short fact once (session start, compact, subagent), never on every prompt.
- [ ] After any change to the Claude layer, `sketchbook doctor` shows the always-on usage within budget, and `node docs/research/value-benchmark/scripts/fixed-context.mjs . --runs 3 --only bare,full` measures the tokens it costs (bytes are a proxy).
- [ ] Any `sketchbook` command it names exists in `harness/cli/known-commands.json`.
- [ ] `CLAUDE.md` lists the skill (one line under Claude layer).

---

## Commands

```bash
cp .claude/skills/forge-me-a-skill/assets/SKILL-TEMPLATE.md .claude/skills/<name>/SKILL.md
npm run test:harness   # claude-layer guard: frontmatter, sections, folders, briefs, command names
npm run check          # W1: no brand names in shipped skills
```

---

## Resources

- [`assets/SKILL-TEMPLATE.md`](assets/SKILL-TEMPLATE.md): the starting file.
- `harness/test/claude-layer.test.mts`: the test that enforces this standard.
- `.claude/skills/contract-author/agents/`: a multi-phase pipeline as briefs.
- `.claude/skills/foundations/agents/`: fresh-context roles launched by one mode.
