# Sketchbook repository instructions

Read `CLAUDE.md` for the project index, source-of-truth paths, generated files, and commands. For provider-neutral task workflows, read `harness/templates/project/AGENT-WORKFLOWS.md`; in this checkout, the detailed rules and skills live under `.claude/`. Its project guidance applies across agents; its Claude layer section describes Claude-specific integration. Read `docs/harness.md` when working in an initialized project and use `npm run sketchbook -- help` for the CLI.

Edit `.mts` sources rather than generated `.mjs` files listed in `harness/.gitignore` or `scripts/.gitignore`; run `npm run build:harness` before using them. Preserve existing project-owned files and the Claude integration. Run checks and tests appropriate to the change.
