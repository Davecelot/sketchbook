---
name: security-guardian
description: >
  Advisory repository-security checks (secrets, npm audit, lockfile
  integrity, sensitive files) with a GO / REVIEW NEEDED report; never
  blocks. Trigger: before committing or pushing, adding or upgrading a
  dependency, a PR touching package files, `.env*`, CI, git hooks or
  `.claude/`, or "is this safe to commit / merge / publish?".
metadata:
  author: sketchbook
  version: '1.1.0'
  changelog: >
    Shorter description (at most 400 characters); descriptions are in
    context every session (SB-0114); affects context cost only.
  auto-invoke: Before a commit or push, or before adding or upgrading a dependency
  allowed-tools: [Bash, Read, Glob, Grep]
---

# Security Guardian

## When to use

Use this skill when:

- Doing an advisory security dry-run before `git commit` or `git push`.
- Adding, upgrading, or reviewing a dependency in `package.json` or
  `package-lock.json`.
- Reviewing a PR that touches dependency manifests, `.env*` files, CI
  config, git hooks, or anything under `.claude/` (agent/tool permissions).
- Someone asks "is this safe to commit / merge / publish?"

Do NOT use this skill for:

- Fixing the flagged issue yourself without saying so: report first, then
  ask before removing secrets from history, rotating keys, or bumping deps.
- Blocking a commit or push autonomously. `.githooks/pre-commit` and
  `pre-push` run `sketchbook check`, not this skill; it is report-only.
- Code-level review of XSS, injection or unsafe HTML rendering in
  components: that is the Security lens of `review-rangers`.
- Full SCA/SBOM generation, license-compliance auditing, or penetration
  testing: flag the need, don't attempt to build that here.

---

## Critical patterns

### 1. Advisory-only contract

This skill **never** blocks a commit or push and **never** exits non-zero
in a way meant to halt anything. It always finishes with a report so a
human decides. A real blocking gate (a git hook or CI job) is a separate,
explicit decision, not something this skill introduces on its own.

### 2. Dependency audit

```bash
npm audit
```

### 3. Secret scanning: dedicated tool first, grep fallback always

```bash
# Preferred, if installed:
gitleaks detect --no-banner --source . --redact
# or
trufflehog filesystem . --only-verified

# Fallback (always run it too, since dedicated tools aren't installed
# everywhere): a pattern scan over the diff, not the whole tree.
git diff --cached -U0 | grep -nEi \
  '(api[_-]?key|secret|token|password|private[_-]?key|BEGIN (RSA|EC|OPENSSH) PRIVATE KEY)\s*[:=]\s*["\x27]?[A-Za-z0-9/+_=-]{12,}'
```

Never print the matched secret value itself in the report: quote only the
file path, line number, and the variable name or pattern that matched.

### 4. Scope detection

```bash
# Default branch (origin/HEAD, falling back to main)
BASE=$(git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's@^origin/@@'); BASE=${BASE:-main}

# Pre-commit (staged files only)
git diff --cached --name-only --diff-filter=ACMR

# Pre-push / PR review (full branch changes vs. the default branch)
git diff --name-only --diff-filter=AM "$BASE"...HEAD
```

Classify each changed path:

| File pattern                                                                                                                                  | Gate bucket       |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| `package.json`, `package-lock.json`                                                                                                           | js-deps           |
| `.env*`, `.npmrc`, `**/*.pem`, `**/*.key`, `.claude/settings*.json`, `harness/templates/project/.claude/settings.json`                        | secrets-sensitive |
| `.github/workflows/**`, `.gitlab-ci.yml`, `Dockerfile`, `.githooks/**`, `.claude/hooks/**`, `.claude/**` (permissions/tools/hooks/skills)    | ci-config         |
| everything else                                                                                                                               | secret-scan only  |

If bucket `js-deps` is empty, skip the dependency audit gate and report
"no dependency manifest changes: audit skipped."

### 5. Gate ordering

Always run in this order, and never abort early; collect every result
before reporting:

```
secret scan → dependency audit → lockfile integrity → sensitive-file review
```

---

## Decision tree

```text
User invokes security-guardian
    |
Step 0: Detect scope
    |-- pre-commit? --> git diff --cached
    +-- pre-push / PR? --> git diff <default-branch>...HEAD

    |
Classify changed files (table above)

    |
Step 1: Secret scan (always runs, every mode)
    |-- dedicated tool installed? --> run it
    +-- not installed? --> run grep fallback, note the tool is missing

    |
Step 2: js-deps changed? --> npm audit
Step 3: lockfile out of sync with the manifest? --> flag drift
Step 4: secrets-sensitive or ci-config files touched? --> manual-review checklist

    |
Produce the GO / REVIEW NEEDED report (see Report structure)
```

---

## Content guidelines

### Report structure

1. **Header**: scope (staged/branch), mode (pre-commit/pre-push/PR review/dry-run).
2. **Gate summary table**: one row per gate, PASS / FLAGGED / SKIPPED, notes.
3. **Verdict**: one line, `GO` or `REVIEW NEEDED` (never "blocked": this
   is advisory).
4. **Findings**: one block per flagged item (see Finding block format).
5. **Recommended next steps**: ordered, concrete, most urgent first.

### Finding block format

```
## Finding: {short title}

### Location
[path/to/file:line, or "package.json (dependency: <name>@<version>)"]

### Risk
[1–2 sentences, plain language: what could go wrong, not just "this is bad"]

### Suggested Fix
[Exact command, or exact line to remove/change, never just "fix this"]

### Severity
low | medium | high | critical
```

Never reprint the actual secret or token value in a finding: describe it
(e.g. "AWS-style access key pattern") and point at the location instead.

### GO / REVIEW NEEDED criteria

| Gate                                                     | Blocks verdict?                                                  |
| -------------------------------------------------------- | ---------------------------------------------------------------- |
| Secret scan                                              | YES: any match is `REVIEW NEEDED`                                |
| Dependency audit (`npm audit`), critical/high advisories | YES                                                              |
| Dependency audit, moderate/low advisories                | NO (list, don't block)                                           |
| Lockfile drift                                           | YES: an out-of-sync lockfile means installs aren't reproducible  |
| Sensitive/CI-config file touched                         | NO (surfaces a manual-review checklist, doesn't fail the gate)   |

---

## Commands

```bash
# Scope detection
git diff --cached --name-only --diff-filter=ACMR           # staged
git diff --name-only --diff-filter=AM main...HEAD           # branch vs. default branch

# Gate 1: Secret scan
gitleaks detect --no-banner --source . --redact             # if installed
git diff --cached -U0 | grep -nEi '(api[_-]?key|secret|token|password|private[_-]?key)\s*[:=]'

# Gate 2: Dependency audit
npm audit
npm audit --json                                             # precise severity parsing

# Gate 3: Lockfile integrity
npm ci --dry-run                                             # fails if the lockfile is stale
git diff --stat package-lock.json                            # size of any lockfile diff

# Helper script (gates 1-4 end-to-end, advisory, always exits 0)
bash .claude/skills/security-guardian/scripts/security-scan.sh            # staged
bash .claude/skills/security-guardian/scripts/security-scan.sh --branch   # branch vs. default
```

---

## Resources

- [`assets/SECURE-CONTRIBUTING-CHECKLIST.md`](assets/SECURE-CONTRIBUTING-CHECKLIST.md): the short contributor and reviewer checklist this skill enforces (dependencies, secrets, rendering, reviews). Point people at it; a checklist nobody reads protects no one.
- [`scripts/security-scan.sh`](scripts/security-scan.sh): advisory, exit-0 script running gates 1–4.
- `review-rangers`: code-level security review (XSS, unsafe HTML, credential exposure in components).
