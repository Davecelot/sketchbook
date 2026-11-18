---
description: Choose a starting point (blank, foundations, library, library+kits, pick, import, from-codebase) and set it up
argument-hint: "[starter]"
---

Use the `onboarding` skill. If "$ARGUMENTS" names a starter (`blank`, `foundations`, `library`, `library+kits`, `pick`, `import`, `from-codebase`), confirm it in one sentence with what it installs, then run `sketchbook init --start $ARGUMENTS --dry-run` and, on a yes, without `--dry-run`. Otherwise ask who the person is and where they start (one question at a time, each with a recommendation and why), then run `sketchbook init --start <starter>`. Explain the check results in plain words and hand off as the skill says: the `foundations` skill (guided) or `sketchbook add`. Run `sketchbook help init` to confirm the options for a starter.
