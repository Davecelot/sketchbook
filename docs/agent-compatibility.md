# Agent compatibility map

Use this map to check how your coding tool finds project guidance, which edit hooks it can run, and what has been verified. The CLI, contracts, generators, Git hooks, and checks run without an AI provider. Compatibility depends on the client’s tools and instruction interfaces as well as the model you choose.

## Install a profile

Plain `sketchbook init` creates a core-only project. Pass `--agent claude`, or a comma-separated list such as `--agent codex,trae`, during setup. Use the same flag from an existing Sketchbook project to add an integration. Use `--dry-run` to preview paths and `sketchbook doctor` to see the current setup. `--with forge` selects Claude and includes the optional forge skill.

| `--agent` profile | Project files |
| --- | --- |
| `claude` | Shared component skills, `CLAUDE.md`, and the staged native wrappers, skills, commands, rules, hooks and activation guide under `move-to-.claude/` |
| `codex` | Shared guidance, `.codex/hooks.json`, and `.codex/sketchbook-guard.mjs` |
| `gemini` | Shared guidance, `GEMINI.md`, `.gemini/settings.json`, and `.gemini/sketchbook-guard.mjs` |
| `copilot` | Shared guidance, `.github/copilot-instructions.md`, `.github/hooks/sketchbook.json`, and `.github/hooks/sketchbook-guard.mjs` |
| `trae` | Shared guidance and `.trae/rules/sketchbook.md` |
| `jetbrains` | Shared guidance and `.aiassistant/rules/sketchbook.md` for AI Assistant chat |
| `generic` | Shared guidance for clients that read `AGENTS.md`, such as Cursor, OpenCode, Windsurf, Kiro, and Antigravity |

Every profile installs the same [standard Agent Skills](https://agentskills.io/specification) `contract-author`, `component-builder`, `hammock`, and `review-rangers` under `.agents/skills/`. For Claude Code, Sketchbook also stages native commands, rules, and hooks for you to activate. Other profiles add `AGENTS.md`, `AGENT-WORKFLOWS.md`, and the `sketchbook` skill for finding workflows. If your client doesn’t discover skills automatically, have it read the installed `SKILL.md` directly. Plain `sketchbook init` doesn’t add agent guidance. To install one workflow without adding a profile, [browse the skills](https://sketchbook-docs.vercel.app/harness/skills/) or run `sketchbook harness list` to find its ID and `sketchbook harness add <item> --dry-run` to preview the files.

For an existing setup, update the CLI and run `sketchbook init --dry-run` to preview missing files. Run `sketchbook init` to add them without overwriting shared team files. Use `sketchbook upgrade` to refresh harness-owned Claude wrappers. Where shared files differ, review and merge deliberately. For a legacy upgrade using `--from`, review the reported protected shared files and use the updated installed engine's `init` to add missing skills.

## Client and hook coverage

| Agent / client | Instruction entry point | Current Sketchbook coverage and validation gap |
| --- | --- | --- |
| Antigravity IDE | `AGENTS.md` | Shared instructions and CLI; open the design-system folder as a workspace and verify discovery |
| Claude Code | `CLAUDE.md`, `.claude/` | Native wrappers use the same shared component skills; commands, rules and hooks remain separate |
| OpenCode | `AGENTS.md`, `.agents/skills/` | Shared instructions and native skill activation tested in standalone and adopted scopes; project configuration can be disabled |
| Cursor | `AGENTS.md` | Shared instructions and CLI; selected Claude-format hooks can be imported when enabled; verify version and behavior |
| GitHub Copilot | `.github/copilot-instructions.md`, `.agents/skills/`; `AGENTS.md` in supported features | Create/edit guard tested in CLI; cloud discovery and enforcement not verified |
| Gemini CLI | `GEMINI.md` | Shared instructions and BeforeTool adapter for supported edits; verify hook trust and activation |
| Codex | `AGENTS.md`, `.agents/skills/` | Shared instructions, task-routing skill and native patch guard for generated files; verify skill and hook discovery |
| Windsurf | `AGENTS.md` | Shared instructions and CLI; verify directory scope and discovery |
| TRAE | `.trae/rules/sketchbook.md`; `AGENTS.md` when imported | Native rule points to shared guidance; Chinese-edition documentation requires workspace trust and an import setting for automatic AGENTS loading; verify the edition in use |
| Kiro | `AGENTS.md` | Shared instructions and CLI; verify discovery in the selected Kiro environment |
| JetBrains | `AGENTS.md` for supported coding agents; `.aiassistant/rules/sketchbook.md` for AI Assistant chat | Shared guidance for coding agents and chat; verify the selected agent, workspace and rule activation |

## Reuse checks by integration pattern

The same CLI, contracts, generators and checks run for every client. `sketchbook approve` and `sketchbook evidence` write the records that C4 and C5 check, even without an agent profile. A client may still block an agent from running a command. If that happens, the person can run it directly; no permission change is needed. Test each shared workflow once per relevant platform or release, and test client discovery and permissions separately:

| Pattern | Reusable evidence | Client-specific check |
| --- | --- | --- |
| `AGENTS.md` guidance | Content and workflows are shared by Antigravity, OpenCode, Cursor, Codex, Windsurf, Kiro and supported JetBrains agents. | Confirm discovery and directory scope where they differ; a test in one client does not prove another loaded it. |
| Instruction wrappers | Gemini, Copilot, TRAE and JetBrains chat point to the same guidance. | Check each wrapper's format and activation or trust requirements. |
| Native hooks | The underlying generated-file and decision policies are shared where adapters use them. | Test each adapter's event format, registration, permissions and failure handling; Codex's patch guard covers a smaller scope. |
| Agent and model behavior | CLI results and deterministic checks can be reused across clients and model families. | Test instruction-following and tool use only for representative combinations; record the exact versions and do not infer model compliance from a mock. |

### Shared skill discovery by host

Model providers do not determine project discovery on their own. A model can use a skill when its host loads the instructions or when the model can read the file. Check the specific client, surface, version, workspace scope and policy.

| Host | Documented project convention | Sketchbook evidence for the shared component skills |
| --- | --- | --- |
| Anthropic Claude Code | [`.claude/skills/`](https://code.claude.com/docs/en/skills); remote surfaces have separate rules | CLI advertises the installed native wrappers; packaged tests verify both link to the same shared files. |
| OpenAI Codex | [`.agents/skills/`](https://developers.openai.com/codex/build-skills) for local project discovery | Files installed; prior client tests covered guidance and guards, not activation of the two new skills. |
| GitHub Copilot | [`.agents/skills/` and other project roots](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills) depending on surface | CLI discovery tested separately from hooks; IDE and cloud discovery not verified here. |
| Google Gemini CLI | [`.agents/skills/` or `.gemini/skills/`](https://geminicli.com/docs/cli/skills/) | Files installed; prior client tests covered hooks, not activation of these skills. Check [Google's transition to Antigravity CLI](https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli) separately. |
| OpenCode | [`.agents/skills/` and native or compatibility locations](https://opencode.ai/docs/skills/) | Discovery and loading exercised with a mock model in catalog-only, standalone, and adopted projects. |
| Google Antigravity | [Workspace `.agents/` discovery](https://antigravity.google/docs/customization-discovery/) | Open the design-system workspace. Native loading not verified in the IDE or CLI. |
| Cursor | [`.agents/skills/` or `.cursor/skills/`](https://cursor.com/docs/skills) | Native loading not verified here. |
| Windsurf / Devin Desktop | [`.agents/skills/` and compatibility paths](https://docs.windsurf.com/windsurf/cascade/skills) | Native loading not verified here; check the installed client version. |
| TRAE | [`.trae/skills/` or enabled `.agents/skills/`](https://docs.trae.ai/ide/skills) | Native loading not verified; enable shared skill discovery if your edition requires it. |
| JetBrains AI Assistant | [Project `.agents/skills/` for supported agents](https://www.jetbrains.com/help/ai-assistant/agent-skills.html) | Native loading not verified here; AI Assistant chat rules are separate. |
| AWS Kiro | [Workspace `.kiro/skills/`](https://kiro.dev/docs/skills/) | The `generic` profile does not write native Kiro skill files. Use the shared files directly. |

## Focused checks for the remaining IDEs

Use a disposable initialized project, or the design-system folder of an adopted test app. Record the client version, selected agent or chat mode, workspace folder and trust settings. Start a new session after changing rules. Inspect the client's rule or context display when available; an answer that merely mentions Sketchbook is not proof that instructions were automatically loaded. If the client cannot show that evidence, record discovery as unverified rather than repeating the full CLI suite.

| Client | Distinct check |
| --- | --- |
| Antigravity | Add the nested design-system folder as a workspace and inspect Customizations for its instructions. Verify skill loading separately; use direct file reading if it isn't confirmed. |
| Cursor | Check `AGENTS.md` in the project or nested scope being used; verify any optional Claude-hook import separately. |
| Windsurf | Check whether the workspace-root or directory-scoped `AGENTS.md` applies to the file being edited. |
| Kiro | Check `AGENTS.md` steering for the selected environment and agent; custom agents may have their own resource configuration. |
| TRAE | Check workspace trust and the generated project's always-applied rule; if relying on `AGENTS.md`, check the edition's import setting and combined rules limit. |
| JetBrains | For AI Assistant chat, select **Always** for the project rule and inspect response attachments; for a coding agent, check that agent's own instruction-file support. |

Once discovery is established, use the shared CLI and workflow results already recorded here. Run a new end-to-end workflow only if the client introduces a different execution, permissions or integration path, and record the result separately from model instruction-following.

TRAE's [Chinese-edition rules documentation](https://docs.trae.cn/ide_rules) specifies a 32 KB total limit across its rules, including `AGENTS.md` and `CLAUDE.md`. The shipped entry points are small, but a team's other rules count too; check the combined size and workspace trust if guidance is not applied. This is a client-specific limit rather than a separate Sketchbook workflow.

Antigravity's [customization discovery documentation](https://antigravity.google/docs/customization-discovery/) says it loads `AGENTS.md`, `GEMINI.md` and `.agents/` from each workspace folder and its parents up to the repository root, but does not search below a workspace folder. For an adopted app with a nested design system, add the design-system folder to the Antigravity project as a workspace folder; opening only the app root will not discover the nested instructions or skill. Use the Customizations panel to check what was loaded. This guidance is based on the documented behavior, not a live Antigravity test.

On 2026-11-19, the official Antigravity CLI 1.5.12 archive passed its published SHA-512 check and its temporary binary reported that version. A session could not start in this workspace's sandbox because it attempted to create the user's `.gemini` configuration directory. No instruction discovery, hook behavior or CLI workflow was verified by that version check; the Antigravity IDE remains untested here.

On the same date, a temporary Cursor CLI binary from the official distribution reported version `2026.11.19-f005e9d`. Its help exposed a custom endpoint, but a noninteractive session attempted to create a project directory under the user's `.cursor/` folder even with temporary configuration and cache paths; the sandbox blocked it. This version check does not verify instruction discovery, CLI workflows or the Cursor IDE.

Claude Code 2.1.327 sent the generated `CLAUDE.md` project instructions to a local mock API in an isolated temporary workspace. A separate session loaded the shipped generated-file and decision guard registrations: native writes to a generated path (including a symlink alias) and a settled decision were blocked, while a source write succeeded. Removing the temporary hook configuration allowed a generated write. The session also invoked the checkout's CLI help command through Claude's shell tool and returned its JSON output. This tests the selected guard registrations and CLI invocation, not the entire Claude layer, interactive trust or model adherence. To repeat with Claude Code installed and loopback networking available, run `npm run build:harness`, then `SKETCHBOOK_TEST_CLAUDE_LIVE=1 node --test harness/test/claude-live.test.mjs`. The test uses a dummy API key and isolated configuration; it is skipped in the default suite.

On 2026-11-18, Copilot CLI 1.0.103's read-only `copilot instruction list --json` discovered the repository instructions and `AGENTS.md` in a standalone initialized project; `copilot skill list --json` listed the project Sketchbook skill. In an adopted app, instruction discovery from the app root found neither file, while running it from the `design-system/` working directory found both. Open that folder as the agent workspace when working on the design system. A nested `.github/hooks/` is not a Git repository-root hook. `sketchbook doctor` reports when the project is nested; verify hook discovery for the client and workspace in use. These inspection commands do not prove a model followed instructions or that hooks were loaded or enforced. See the [Copilot hooks reference](https://docs.github.com/en/copilot/reference/hooks-reference).

A separate local integration test drove Copilot CLI 1.0.103 with a loopback mock model and a trusted temporary Git repository containing the root hook example below. Copilot loaded the hook, denied a native `create` targeting the nested project's generated directory and an `edit` changing a settled decision, and allowed a native `create` in its source directory. From the nested design-system working directory, the same CLI sent both project instruction files to the mock model and loaded the nested hook, which blocked a generated-file create. Its shell tool also invoked `sketchbook help --json` from the linked checkout engine and returned the expected JSON. When the nested hook was removed, the root hook was not loaded in that session and the create succeeded. From the app root, removing its root hook likewise allowed the create. These controls confirm the hook caused each denial. This exercises Copilot's real hook loader and tool flow, not a hosted model or cloud agent. To repeat it in a source checkout with Copilot installed and loopback networking available, run `npm run build:harness` followed by `SKETCHBOOK_TEST_COPILOT_LIVE=1 node --test harness/test/copilot-live.test.mjs`. The test uses an isolated temporary configuration and does not require a model account; it is skipped in the default suite.

On the same date, OpenCode 1.19.6's `debug skill --pure` listed the generated `.agents/skills/sketchbook/SKILL.md` as a project skill. OpenCode 2.3.2's local `/api/skill` endpoint also listed that skill and a separate native control skill after the project location finished initializing. A one-shot query initially returned an empty list; OpenCode has a [reported startup race](https://github.com/anomalyco/opencode/issues/63221) for this inspection method. These checks establish skill discovery in the tested versions, not that `AGENTS.md` was loaded or that a model followed either file. See [OpenCode skill discovery](https://opencode.ai/docs/skills/).

An additional OpenCode 2.3.2 session test used a local mock provider and isolated configuration. Starting in a nested design-system workspace sent the parent app instructions, the generated project instructions and the shared skill description to the mock provider; starting at the app root sent the parent instructions without the nested guidance or skill. In a fresh folder set up only with `sketchbook harness add recommended`, OpenCode advertised all four skills and loaded `contract-author` when requested. In a separate session the mock requested OpenCode's shell tool, which invoked `sketchbook help --json` from the linked checkout engine; OpenCode printed the expected JSON. This verifies session input, skill loading and CLI invocation, not model compliance. With OpenCode installed and loopback networking available, repeat it after `npm run build:harness` using `SKETCHBOOK_TEST_OPENCODE_LIVE=1 node --test harness/test/opencode-live.test.mjs`; `SKETCHBOOK_TEST_OPENCODE_BIN` can select a binary. It is skipped by default.

Codex CLI 0.169.0-alpha.11.1's `debug prompt-input` was run with an isolated temporary configuration and a nested design-system project. From the design-system directory, its model-visible input included both the parent app's `AGENTS.md` and the design system's `AGENTS.md`, plus the shared Sketchbook skill. From the app root, it did not include the nested project guidance or skill. This checks prompt construction, not model adherence or hook activation. To repeat the inspection with Codex installed, run `npm run build:harness` and `SKETCHBOOK_TEST_CODEX=1 node --test harness/test/codex-instructions.test.mjs`; it is skipped in the default suite.

A separate opt-in integration test exercised Codex CLI 0.169.0-alpha.11.1's actual `apply_patch` and hook runtime against a loopback mock model in a design-system directory nested inside a temporary Git repository. With the temporary project trusted and the shipped hook explicitly trusted for that invocation, Codex blocked a generated-file patch and allowed an ordinary source patch. An earlier relative command failed from a subdirectory; the new integrity-checked launcher blocked the same generated-file patch from that directory. The test also invoked the checkout's CLI help command through Codex's shell tool and verified its JSON output. Removing the temporary hook at the project root also allowed the generated-file patch. To repeat with Codex installed and loopback networking available, run `npm run build:harness` followed by `SKETCHBOOK_TEST_CODEX_LIVE=1 node --test harness/test/codex-live.test.mjs`. The test uses an isolated configuration and no model account; it explicitly bypasses hook trust only for its vetted temporary fixture. It does not test interactive trust, shell edits, decision protection, or model adherence.

Gemini CLI 0.68.0's `skills list --all` found the shared Sketchbook skill in a trusted temporary project and reported that project hooks were disabled when the same folder was untrusted. Separately, its bundled hook registry, planner and runner loaded the shipped hook configuration with a test configuration supplying trust, selected the expected events, and blocked simulated generated-file and settled-decision edits while allowing a source write. This included a project path containing spaces. The runner test did not use a model session or verify the interactive hook-trust flow; see [Gemini hook configuration](https://geminicli.com/docs/hooks/).

On 2026-11-18, a locally packed engine was installed with npm into a temporary bootstrap project, then used to initialize and install a blank project whose path contained spaces. The installed CLI passed `doctor`, a no-write `add button --dry-run`, `add button`, `docs button`, project checks, typechecking, lint and build. In that installed project, Codex CLI 0.169.0-alpha.11.1 with a loopback mock model blocked a generated-file patch and allowed a source patch from a subdirectory. Packaging and installation used `--ignore-scripts`, so this run did not exercise npm lifecycle scripts; project and hook trust were explicitly enabled for the isolated test.

A separate lifecycle check on Node 26.5.0 and npm 11.17.0 ran normal `npm pack --json` in an isolated checkout with `dist/` removed, verified that `prepack` rebuilt and included the distribution, and parsed npm's JSON output. Its tarball was installed without `--ignore-scripts`, used to initialize a blank project, and that project's normal npm installation, doctor and build passed. npm reported pending install-script approvals for some transitive dependencies; the tested build completed under that policy. To rerun the isolated pack test in a source checkout, use `SKETCHBOOK_TEST_LIFECYCLE=1 node --test harness/test/package-lifecycle.test.mjs` after `npm run build:harness`. Add `SKETCHBOOK_TEST_LIFECYCLE_INSTALL=1` to install that tarball offline in a temporary consumer and run `npx --no-install sketchbook help` and `init`; add `SKETCHBOOK_TEST_LIFECYCLE_PROJECT_INSTALL=1` as well to install the initialized project's dependencies, run doctor and directly exercise the Codex, Gemini and Copilot adapters against a generated file. These installation checks require all dependencies in the configured npm cache; direct adapter tests do not establish client activation or trust.

A further opt-in test drove Gemini CLI 0.68.0 itself with a loopback mock API, a dummy API key and a trusted temporary project whose path contained spaces. Its `BeforeTool` hook blocked a generated-file write and a settled-decision replacement, allowed an ordinary source write, and allowed a generated-file write after the temporary hook was removed. The shell tool invoked `sketchbook help --json` from the linked checkout engine and returned the expected JSON; that isolated shell case used Gemini's automatic approval mode. The guard reports intentional blocks as structured denials, preserving the reason without Gemini's hook-failure warning; operational errors use a blocking error exit. The live test also confirmed that a missing underlying guard blocks the edit. This does not verify interactive trust or model adherence. To repeat with Gemini CLI installed and loopback networking available, run `npm run build:harness` and `SKETCHBOOK_TEST_GEMINI_LIVE=1 node --test harness/test/gemini-live.test.mjs`; `SKETCHBOOK_TEST_GEMINI_BIN` can name a specific binary. The test isolates Gemini configuration and is skipped in the default suite.

## Copilot repository hooks for an adopted app

Copilot cloud discovers repository hooks in `.github/hooks/` at the Git repository root. In the tested Copilot CLI 1.0.103, the hook in the current workspace loaded when starting inside `design-system/`, while the root hook loaded when starting at the app root. Verify your client version and trust settings. For cloud or a session started at the app root, the nested hook alone is insufficient. If the team chooses to enable the guard there, review existing root hooks and add a separate file such as `.github/hooks/sketchbook-design-system.json` at the repository root:

```json
{
  "version": 1,
  "hooks": {
    "preToolUse": [
      {
        "type": "command",
        "command": "node design-system/.github/hooks/sketchbook-guard.mjs",
        "matcher": "create|edit"
      }
    ]
  }
}
```

Change `design-system/` to the actual project path and use shell-compatible quoting if it contains spaces. Run `npm install` in the design-system project so the adapter can resolve its engine, and confirm hook trust and activation in the chosen Copilot client. The adapter is scoped to this design-system project and does not grant permission. It covers recognized native `create` and `edit` payloads, not shell commands or unknown tools. Do not replace existing root hook files; combine configurations only after reviewing the team's settings. A nested hook registration shown by `sketchbook doctor` confirms the local file contents, not that Copilot discovered the root configuration. The instructions in the design-system directory and repository-level hook discovery are separate concerns.

## Model-family test targets

The harness does not call a model API or select a model. These are candidate families for evaluation through compatible clients, not a claim that any particular model or version has passed. Client features, context length, tool support, permissions and model availability vary; record the exact client and model version for each test run.

| Family | Representative provider | Evaluation priority |
| --- | --- | --- |
| Claude | Anthropic | Preserve the existing Claude Code baseline |
| GPT and Codex | OpenAI | Codex and compatible multi-model clients |
| Gemini | Google | Gemini CLI and compatible multi-model clients |
| Llama | Meta | Open-weight and hosted model configurations |
| Qwen | Alibaba / Qwen | Open-weight and hosted model configurations |
| DeepSeek | DeepSeek | Hosted and open-weight configurations |
| Mistral / Codestral | Mistral AI | Hosted and compatible client configurations |
| GLM | Z.ai / Zhipu AI | Hosted and compatible client configurations |
| MiniMax | MiniMax | Hosted and compatible client configurations |

The same deterministic CLI and project files are the contract for all families. Test representative component, token, accessibility and review tasks against that contract; evaluate tool use and instruction adherence separately from model availability. Do not hardcode version aliases or silently substitute one provider's models for another's.

### Repeatable workflow comparison

Use the same disposable blank project, starting state and prompts for each client/model pair. Compare at least two models in the same client where possible. Keep a core-only run as the baseline. For an adopted app, repeat discovery from both the app root and the design-system folder. Keep hook coverage separate: a client that lacks a hook can still reach the same checked result by running the CLI explicitly.

| Task | Pass criteria |
| --- | --- |
| Install a catalog component | Previews with `sketchbook add button --dry-run`, verifies that the preview did not write files, installs the catalog component, and runs `sketchbook check`. |
| Change a foundation | Previews `sketchbook tokens set color.primary "#0F766E" --dry-run`, applies through the CLI without hand-editing generated files, and runs `sketchbook check`. |
| Propose a new component | Previews `sketchbook add badge --blank --dry-run`, drafts the contract from the supplied requirements and applicable accessibility references, runs `sketchbook check`, completes `plan.md`, and asks for approval without writing tests or implementation when the planning gate is enabled. |

Record the client and exact version, provider and model identifier, project scope, trust settings, loaded instructions, tested hooks, and task outcome. Score instruction discovery, hook behavior, and workflow outcome separately as **pass**, **fail**, or **not tested**. Note when success required repeating the prompt or supplying guidance manually. Only a run using the actual model can establish whether it followed the workflow; use a disposable project with no private content for hosted runs.

The core-only bootstrap test covers the CLI operations and scaffold boundary, not contract quality or an agent's decision to stop. On 2026-11-21, Claude Code 2.1.329 advertised both native wrappers, Copilot CLI 1.0.103 listed both shared skills from an adopted project, and OpenCode 2.3.2 loaded the contract-author workflow in a standalone project and component-builder in an adopted one. These checks used local test fixtures and, for session tests, mock model responses. Codex and Gemini adapter tests passed without rerunning their real-client suites. The real-model workflow comparison has not yet been run.

## JetBrains AI Assistant chat

The generated chat rule declares `apply: always`. A static inspection of the official [AI Assistant plugin build 262.10968.63](https://plugins.jetbrains.com/plugin/download?updateId=1171905) found `.aiassistant/rules`, a leading metadata-block pattern, and the `apply` and `always` field values in its packaged classes and resources. This supports the chosen file format but does not verify rule activation. In AI Assistant, open **Settings → Tools → AI Assistant → Rules** and confirm that the Sketchbook rule is set to **Always**; inspect the response attachments to verify that it was included. For a previously initialized project, `init` and `upgrade` preserve the existing rule, so set its rule type in the IDE rather than expecting an automatic update. Project rules apply to AI Assistant chat; coding agents use their own instruction files. This configuration has not been validated in a live JetBrains session here. See [JetBrains project rules](https://www.jetbrains.com/help/ai-assistant/configure-project-rules.html).

## Current limitations

Projects get the files for their selected profiles. Run `sketchbook init` to restore missing files for those profiles. For projects created before profile selection, Sketchbook uses recognizable existing integrations. The first explicit profile install records those integrations and the new selection. Doctor also reports when preserved instruction entry points do not textually reference the shared files, prompting a review. This is only a hint: a team may have equivalent inline instructions, and a reference does not prove the client loaded it. The document gives shared orientation, not the full Claude layer. Claude's lifecycle hooks, tool permissions, slash commands, subagent model aliases and automatic skill activation have no assumed equivalents elsewhere. Cursor documents importing selected Claude-format hooks, but supported events and behavior differ; see the staged `INSTALL.md` for details. In other clients, run the checks explicitly; Git hooks still apply when configured. Codex hook support and trust vary by version and environment. New hook settings include an integrity-checked subdirectory launcher: it executes only the shipped adapter, allowing line-ending differences, and skips otherwise modified adapters. Existing settings are preserved and may lack this launcher; `sketchbook doctor` reports whether it recognizes the current launcher and whether the adapter matches after line-ending normalization. For existing or customized settings, compare and deliberately merge the current template, then review hook trust; until verified, start at the design-system root. The shipped patch guard only covers native `apply_patch` operations and generated-file paths; it does not intercept shell edits or decision changes. Existing `.codex/hooks.json` is never overwritten or merged. The project-owned Codex and Copilot adapter scripts are also preserved on init and upgrade; to pick up changes to those scripts in an existing project, compare them with the templates in the installed engine and merge deliberately. Doctor compares adapter scripts with the current rendered templates and reports differences for review; a difference may be an intentional team customization. Gemini CLI can prompt to trust the generated-file and decision edit hooks; they cover its `write_file` and `replace` tools only, not shell or other tools. Existing `.gemini/settings.json` is never overwritten or merged. Older settings that invoke the guard directly under the project’s `node_modules` continue to be recognized but cannot find a hoisted installation. Earlier launcher settings use shell-specific `${GEMINI_PROJECT_DIR}` expansion. To use the current launcher command, restore missing setup files with `sketchbook init --agent gemini`, then manually change the existing hook command to `node .gemini/sketchbook-guard.mjs` and restart Gemini in the design-system directory; review the hook trust prompt. Existing settings are never changed automatically. Copilot hook discovery depends on the client and workspace; verify the configuration loaded in your session. Cloud and repository-root sessions use root hooks; its adapter covers native `create` and `edit` payloads with known path and edit fields, not shell or unknown tools. It falls back to normal permissions if the engine is not installed; it does not grant approval. Validate behavior for each client version. `sketchbook doctor` reports whether it recognizes the shipped hook registrations and their files; it never executes hooks or proves client activation or trust. H1 validates the Claude layer and its context budget, not other clients' instruction loading.

Use stable capabilities and agent-specific adapters rather than a fixed list of model versions. Validate instruction discovery, workflows, permissions, hooks and actual behavior per client and version before claiming parity. The existing Claude files remain the source for their current integration; avoid copying their tool-specific instructions into a generic agent without translation.

References: [Antigravity rules](https://www.antigravity.google/docs/rules-workflows?tab=ide), [Claude Code memory](https://code.claude.com/docs/en/memory), [OpenCode instructions](https://opencode.ai/docs/instructions/), [Cursor rules](https://cursor.com/docs/rules), [Copilot instructions](https://docs.github.com/en/copilot/reference/custom-instructions-support), [Gemini CLI context](https://geminicli.com/docs/cli/gemini-md/), [Codex instructions](https://developers.openai.com/codex/guides/agents-md/), [Windsurf AGENTS.md](https://docs.windsurf.com/windsurf/cascade/agents-md), [TRAE rules (Chinese edition)](https://docs.trae.cn/ide_rules), [Kiro steering](https://kiro.dev/docs/steering/), [JetBrains agent instructions](https://www.jetbrains.com/help/ai-assistant/configure-agent-behavior.html), [JetBrains chat project rules](https://www.jetbrains.com/help/ai-assistant/configure-project-rules.html).
