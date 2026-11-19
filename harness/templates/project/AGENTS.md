# Design system instructions

This project uses the Sketchbook CLI and a contract-first design system. Read `docs/harness.md` for the initial installation inventory and `docs/cli.md` or run `npx sketchbook help` for commands. The inventory may not reflect later changes; inspect the project and run `npx sketchbook doctor` for current status. Consult `harness.config.json` for the project's choices and `AGENT-WORKFLOWS.md` for task-specific guidance.

- Treat `brand.config.json`, `spec/tokens/semantic/`, component contracts and plans in `spec/components/`, and `spec/registry.json` as source of truth. Follow the existing contracts and decisions when changing components.
- Generated files under `generated/`, `src/components/*/*.styles.ts`, `src/index.ts`, and `spec/tokens/interface.json` are rebuilt with `npm run generate`. Use `npx sketchbook tokens rebuild --dry-run --yes` to review a foundation rebuild; hand edits are tracked as overrides.
- Use `npx sketchbook status`, `doctor`, and `check` to inspect the project; use `npx sketchbook help <command>` for supported options. Run appropriate tests and `npm run check` after changes.
- Do not modify settled decisions in `spec/decisions/DECISIONS.md`; add a superseding decision instead. For a complete HTML page using this library, provide a level-one heading and a main landmark.
- Component tokens reference semantic tokens, and semantic tokens reference foundation tokens. Rename interface tokens through `npx sketchbook tokens rename`.
- The optional Claude Code integration is staged in `move-to-.claude/` until installed. Its hooks and slash commands use Claude formats; other clients may import some of them, but do not assume they are active. The CLI and checks work independently of that integration.
