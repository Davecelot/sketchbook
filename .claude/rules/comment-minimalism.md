# Rule: comment-minimalism

Write no comment unless it explains a non-obvious **why**: a hidden constraint, a browser or spec workaround (with its reason), a pointer to the source of a magic number (`// spacing-2: contract.json tokens`), or a tracked `TODO` ([`hammock`](../skills/hammock/SKILL.md) `debt` mode).

Never restate what the code or the contract already says: no doc comment that repeats `contract.md`, no narration of a one-line getter, no file header about layout or build steps. It applies to every file: code, stories, SCSS, docs, skills and rules.

**Why:** the contract is the source of truth; a second copy in a comment drifts silently. **Enforcement:** manual; hammock `review` flags restating comments.
