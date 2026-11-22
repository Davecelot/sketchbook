---
name: forge-me-a-skill
description: >
  Create a skill, or bring an existing one in line with this repo's single
  skill standard: one folder per skill, the same frontmatter, the same body
  skeleton, and any delegated roles as briefs in the skill's own agents/
  folder. Trigger: creating a new skill or agent role, porting one from
  another repo, or auditing a shared skill catalog for consistency.
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
- A persistent rule with no workflow: write a separate rule.

---

## Critical patterns

### 1. Skills own their agents

A role (a fresh-context critic, an auditor, a phase of a pipeline) is a
brief in the skill’s `agents/` folder. A person can use the brief directly,
or an authorized client can delegate it with the named inputs.

```text
foundations/agents/foundations-critic.md   # roast mode
contract-author/agents/drafter.md         # phase 2 of 3
```

A brief has `name` and `description`. State its inputs, allowed actions,
evidence and output in its body. Do not choose a model, name a client's
tools, or assume that writing a brief grants any permissions.

```markdown
---
name: token-mapper
description: Maps imported token names onto the semantic interface; writes a proposal only.
---

You map ... Never edit spec/ or brand.config.json.
```

### 2. One folder, one source of truth

```text
{skill-name}/
├── SKILL.md       # required: frontmatter + body, the only metadata file
├── agents/        # role briefs this skill launches (see pattern 1)
├── assets/        # templates, schemas, example configs
├── references/    # local docs the skill reads on demand, never web URLs
└── scripts/       # executable helpers
```

Put client integration code outside the portable skill. Keep discovery
metadata in the skill and installation relationships in the catalog.

### 3. Frontmatter

| Field                    | Required | Format              | Content                                                                                       |
| ------------------------ | -------- | ------------------- | --------------------------------------------------------------------------------------------- |
| `name`                   | yes      | `lowercase-hyphens` | The folder name.                                                                              |
| `description`            | yes      | string, ≤ 400 chars | What the skill does, then `Trigger: …`, specific enough not to fire on unrelated work. It is in context in every session (SB-0114). |

Preserve provenance and notices for ported material.
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
A client-specific hook?                            -> a separate opt-in adapter
Long local reference read on demand?               -> references/
A role another agent runs (fresh context, phase)?  -> agents/<role>.md
Persistent rule with no workflow?                  -> a catalog rule
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

- [ ] No catalog skill already covers it.
- [ ] Folder name follows the naming table; `name` matches it.
- [ ] `description` ends with a `Trigger:` clause and is at most 400 characters.
- [ ] Body sections are present and in order.
- [ ] Briefs define what to read, write, and return. Independent review is never claimed without separate reviewers.
- [ ] Rules have a clear scope. Adapters don’t inject instructions on every prompt or grant permissions.
- [ ] Any Sketchbook CLI command it names exists in `sketchbook help`.

---

## Commands

```bash
npm run test:harness   # in the Sketchbook source checkout
npm run check
```

---

## Resources

- [`assets/SKILL-TEMPLATE.md`](assets/SKILL-TEMPLATE.md): the starting file.
- `agent:contract-author/drafter`: a multi-phase pipeline brief.
- `agent:foundations/foundations-critic`: a fresh-context review brief.
