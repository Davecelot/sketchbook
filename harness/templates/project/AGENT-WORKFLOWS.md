# Sketchbook workflows for coding agents

These instructions apply independently of the agent or model. `harness.config.json` records the team's choices; follow the user's instructions and the agent's own permissions. Use `npx sketchbook help` and `docs/cli.md` for the current CLI. Do not assume that another client's hooks, tools, commands, or subagents are available.

## Component work

For a catalog component wanted as shipped, use `npx sketchbook add <name> --dry-run`, review the result, then install it. The following workflow applies to a new or redesigned component.

1. Read the component's contract and `spec/decisions/DECISIONS.md`. If no contract exists, create the contract before implementation; use the component schema and an existing contract as references, and mark unconfirmed details as proposals. Consult `spec/api.json` for canonical API names.
2. If `features.planningGate` is enabled, write or update `spec/components/<name>/plan.md` after the contract passes `npm run check`; obtain the user's approval before component implementation. Respect any approval already given.
3. If `features.testFirst` is enabled, write behavior tests and stories from the approved contract, run the tests and confirm they fail for the intended reason before implementing. Do not change tests merely to match code. Verify with `npm run check`, `npm run typecheck`, and the relevant component tests.
4. Use component tokens in component CSS; follow semantic → foundation token layering. For form controls, consult the form-associated-controls rule below. Review behavior, accessibility, contract parity and applicable security concerns before reporting completion.

## Tokens, kits and design

- Foundations come from `brand.config.json`; semantic tokens are team-owned. Use `npx sketchbook tokens` for changes, especially `tokens rename` for interface renames. Inspect imports before applying them and run the relevant checks.
- `npx sketchbook audit-css <path>` produces `generated/import/codebase.proposal.json` with observed CSS values and suggested foundations; it does not apply them. Review the observations and choose values with the user, then use the foundations workflow and `npx sketchbook tokens` to make approved changes. This audit output is not a token-import proposal and cannot be passed to `tokens import apply`.
- Use `npx sketchbook kits list` and `kits add` for available templates, and adapt installed kits to the team's requirements.
- For design-file work, use `npx sketchbook help sync` and the configured design adapter. Structural verification alone does not establish visual parity; compare the rendered design with Storybook as described by the design guidance.

## Task routing

Use `contract-author` for contracts, `component-builder` for implementation, `hammock` for complexity, and `review-rangers` for structured review. If your client doesn’t discover skills automatically, read the installed `SKILL.md` files under `.agents/skills/`. To find another skill, run `npx sketchbook harness list`. Run `npx sketchbook harness show <item>` to inspect its files and dependencies, then `npx sketchbook harness add <item> --dry-run` to preview new files, updates, and conflicts. Follow the workflow within your client’s capabilities and permissions.

| Task | Existing skill |
| --- | --- |
| Choose a starter or orient a new user | `onboarding` |
| Draft, resync or validate a component contract | `contract-author` |
| Implement a component after its planning gate | `component-builder` |
| Write or run browser behavior tests | `playwright-worker` |
| Audit keyboard behavior, screen-reader support or accessibility | `a11y-checker` |
| Design, review or refactor Web Components | `web-components-best-practices` |
| Create, import, change or critique foundations and tokens | `foundations` |
| Add or adapt page templates | `kits` |
| Sync or verify a Figma design file | `design-figma` |
| Apply the decision ladder before non-trivial changes, or review complexity and debt | `hammock` |
| Perform a structured multi-perspective review | `review-rangers` |
| Perform the advisory repository-security review | `security-guardian` |
| Create or audit a portable skill | `forge-me-a-skill` |

The catalog contains `command:` workflows for `add`, `check`, `explain`, `foundations`, `import-tokens`, `init`, `kits`, `roast-foundations`, `start`, `swap`, `sync`, and `tour`. Install and read them directly, or invoke the equivalent native command where configured. Use `sketchbook help` to identify CLI operations instead of assuming every slash command is a CLI command.

## Checks that may otherwise be injected by hooks

- Protect generated files and settled decisions as described in `AGENTS.md`. The Codex patch adapter checks generated-file paths for native `apply_patch` calls when hooks are available and trusted; it does not check decision edits. The Gemini BeforeTool adapter uses the same guards for its native `write_file` and `replace` tools when enabled and trusted. The Copilot CLI/cloud adapter covers native `create` and `edit` calls with recognized arguments when its repository hook is loaded and the engine is installed. These adapters do not cover shell commands or every client tool. Compare the decision log with a trusted pre-change baseline using `npx sketchbook audit-decisions --git-ref HEAD` or `npx sketchbook audit-decisions <baseline-file>` and check the diff before reporting completion. Select a Git revision that predates the changes being checked. If no baseline is available, say so rather than claiming a comparison. This audit is explicit and is not a replacement for edit-time guards or `sketchbook check`.
- A complete HTML page using the design system needs an `h1` (or equivalent level-one heading) and a main landmark. Run `npx sketchbook audit-page <file.html>` for the same limited static reminder available to Claude; use a real browser accessibility check as well.
- Apply the `hammock` decision ladder for non-trivial work even when session and edit hooks are unavailable. A review or security advisory should accurately state which checks and independent perspectives actually ran.

## Detailed guidance and existing workflows

Read installed rules under `.agents/sketchbook/rules/`, and look up missing rules in the catalog. For example, `contract-first`, `planning-gate`, `test-first`, `form-associated-controls`, `spec-is-source`, `tokens-through-the-harness`, and `figma-fidelity` are rule files. Claude’s native copies are staged in `move-to-.claude/` or installed under `.claude/`. In a project created by `sketchbook init`, `docs/harness.md` lists the initial installation; later changes may not be reflected. In the Sketchbook source checkout, inspect `harness/templates/agent-catalog/` for the sources; `.claude/skills/` and `.claude/commands/` are client projections. Use `sketchbook doctor` for current project setup.

These files may contain Claude-specific tool names, model aliases, hooks, slash commands, and delegation instructions. Translate the underlying task into capabilities actually available in the current agent; do not claim that a hook or independent review ran when it did not. If delegation is unavailable or unauthorized, perform the applicable steps directly and report any unmet independent-review requirement. Rules and skills are guidance, while the deterministic CLI checks and configured Git hooks provide tool-independent verification.
