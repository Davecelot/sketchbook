# Sketchbook repository instructions

Read `CLAUDE.md` for the project index, source-of-truth paths, generated files, and commands. For provider-neutral task workflows, read `harness/templates/project/AGENT-WORKFLOWS.md`; in this checkout, the detailed rules and skills live under `.claude/`. Its project guidance applies across agents; its Claude layer section describes Claude-specific integration. See `docs/README.md` for checkout documentation and use `npm run sketchbook -- help` for the CLI. In a project created by `sketchbook init`, `docs/harness.md` is an initial installation inventory, not a current status report.

Edit `.mts` sources rather than generated `.mjs` files listed in `harness/.gitignore` or `scripts/.gitignore`; run `npm run build:harness` before using them. Preserve existing project-owned files and the Claude integration. Run checks and tests appropriate to the change.

Before changing public docs, agent guidance, or user-facing CLI copy, read [the content guidelines](docs/content-guidelines.md). They cover terminology, examples, terminal output, and how to verify the result.
