# CLI distribution retest 2 (2026-11-11)

The sandboxed cases again, after SB-0099 (proposed): the engine runs from `node_modules`, the Claude layer is staged in
`move-to-.claude/` for Claude to install, `init --adopt` adds a design system to an existing app, `init` again repairs,
`upgrade` refreshes from the installed engine, the decision log is trimmed, and the three baseline leftovers are fixed.
Earlier rounds: [baseline](../cli-distribution-baseline/README.md), [retest 1](../cli-distribution-retest/README.md).

- Branch `worktree-cli-distribution-baseline`, commits `30fad01` to `7f17007`. Node 26.5.0, Claude Code 2.1.322.
- Two runs. **Run 1** ([`results-run1.tsv`](results-run1.tsv), [`logs-run1/`](logs-run1/)) found five problems, fixed in
  `7f17007`. **Run 2** ([`results.tsv`](results.tsv), [`logs/`](logs/)) is the same scripts on the fixed code. Paths are
  anonymized. [`scripts/`](scripts/) reruns both (`case-a.sh`, then `case-bc.sh`).
- Cases A and B run the CLI from the packed tarball (`npm exec --package=<tgz> -- sketchbook`, `init --engine file:<tgz>`)
  and, inside a project, the engine `npm install` put in `node_modules` (`npm run sketchbook -- …`). Case C is a clone.

## Result (run 2)

| Case | What ran | Outcome |
|---|---|---|
| A, empty folder | `init` from the tarball with the real install; status, doctor, check, remove/add, kits, tokens, explain, generate; the Claude layer installed from `move-to-.claude/`; the commit gate; typecheck; behavior tests; the harness's own tests from the installed engine; repair; upgrade; a failing init | Every step passes. No `harness/`, `scripts/` or `.claude/` is created; the engine is `node_modules/sketchbook`; the commit hook is executable and blocks a broken contract; 100/100 behavior tests (button and foundations, which import the engine through `#harness`); `selftest` 168 pass, 0 fail, 40 skipped (checkout- or source-repo-only); repair restores three deleted files; a failing init leaves the folder empty |
| B, existing app | `init` at the root, then `init --adopt --start from-codebase` | Refused at the root with the `--adopt` fix, app untouched; adopt builds `design-system/` and changes one line of the app's `package.json` (B04); checks pass inside; `npm run design-system:check` works from the app root; the app's hooks are untouched; `tokens import` needs no `--from`; `audit-css` proposes the 16 px body size |
| C, clone | `init --start blank`, check, `add button`, `init` again | All pass; repair finds nothing missing |

## What run 1 found (fixed in `7f17007`)

1. **The commit hook was not executable** in a new project (`logs-run1/A16`): git ignored it and a broken commit went
   through, while `doctor` said the gate was active. The new copy step wrote file contents and dropped the mode. Copies
   now keep the engine file's mode, hooks are 755, and `doctor` calls the gate active only when the hook can run.
2. **Node refused the `#harness` import** (`logs-run1/A18`): an `"imports"` target may not point inside `node_modules`.
   The project now maps `#harness/*` to the bare `sketchbook/harness/*`, which the engine's `exports` allows.
3. **Adopt reformatted the app's `package.json`** (`logs-run1/B04`): a one-line file was written back pretty-printed.
   The script is now inserted as text and every other byte stays (test B14).
4. **Claude Code protects `.claude/`** (`logs-run1/A14`): a headless Claude session given the exact sentence `init` prints
   read `INSTALL.md`, refused to create `.claude/` without someone to approve it, and listed the install commands. That
   is the intended safety; `INSTALL.md` and `init` now tell the person to approve those prompts.
5. **`selftest` from the installed engine ran checkout-only tests** (`logs-run1/A19`): five tests need `src/`,
   `.claude/settings.json` or the checkout's own `node_modules`; they are now `checkoutOnly`.

## How the Claude step was tested

1. **Run 1** (`logs-run1/A14`): a real headless Claude Code session given the sentence `init` prints followed
   `INSTALL.md` and stopped at Claude Code's approval prompt for `.claude/`, listing the commands instead.
2. **Run 2** (`logs/A14`): skipping the permission prompts altogether was refused by this session's safety policy, so A14
   ran the commands the run-1 session listed (a simulated approved step), then H1 and `doctor`.
3. **The Claude install** ([`results-claude.tsv`](results-claude.tsv), [`logs-claude/`](logs-claude/)): a fresh project
   from the tarball (real install, `blank`), with a team-owned `.claude/` added first (a `PreToolUse` hook of their own,
   a `deploy` command, a `Bash(npm run lint)` permission). A real headless Claude Code session got the sentence `init`
   prints, with the approvals a person would give granted as narrow permission rules instead of prompts: edits inside
   `.claude/` only, and `mkdir`, `cp`, `ls`, `diff`, `find`, `npm run sketchbook` and `rm -rf move-to-.claude`. Claude
   copied the layer, merged `settings.json`, ran H1 and `doctor`, deleted `move-to-.claude/` and told the person to
   restart Claude Code in the folder (K03). Checked independently, not from Claude's summary: skills, rules and hooks are
   byte-identical to the engine's; commands differ only by the team's `deploy.md`; every engine hook entry is in the
   merged settings and the team's hook and permission are still there; H1 passes with no warning; `doctor` says
   installed and the commit gate active (K04).

Two things the session printed, for whoever installs headless: a `Write(...)` allow rule is not matched by Claude Code's
file checks (only `Edit(...)` rules are), and a project's own `permissions.allow` is ignored until the folder is trusted
once interactively. Neither affects the interactive install `init` asks for, where the person approves the prompts.

4. **By hand** (2026-11-11, on the person's desktop): the same setup (`my-ds`: a library project from the tarball at
   commit 881e27e, with a team-owned `.claude/`), the sentence `init` prints typed into an interactive Claude Code
   session, every prompt approved by hand. The merged `settings.json` the person sent back has all 8 Sketchbook hook
   entries plus the team's `echo team-hook`, and keeps `Bash(npm run lint)`. Checked afterwards in the folder: skills,
   rules and hooks byte-identical to the engine's, commands differing only by the team's `deploy.md`, `move-to-.claude/`
   deleted, H1 clean, `doctor` reporting the layer installed and the commit gate active.

   After restarting Claude Code in `my-ds/` (screenshots from the person): `/hooks` lists 9 hooks on 6 events (the team's
   `echo team-hook` and the 8 Sketchbook entries); `/add` runs Sketchbook's command (with no name it does not guess, sees
   the 35 installed catalog components and explains the contract-first flow down to the planning gate); the team's
   `/deploy` loads too; `/hammock help` prints the mode table with "active level: full" (the SessionStart hook ran).

   Asked to edit `generated/css/tokens.css` and to reword SB-0009, Claude declined both by the installed rules
   (`spec-is-source`, `tokens-through-the-harness`) and named the supported route (`sketchbook tokens add`, a superseding
   decision), so the guard hooks never had to fire. Run directly with the tool call Claude Code sends, `guard-generated`
   blocked the output and allowed a source, but `guard-decisions` let text appended inside an accepted entry through: it
   only checked that the old text was still there. Fixed in `9229ef7`, with the first tests for both hooks (H-G1, H-D1).
   The same session also proposed "SB-0012" for a team decision, an id Sketchbook's defaults use: a new log's header now
   names the first team id. The fix reached the desktop project the way a team gets it: the new tarball installed
   (`npm install`, standing in for `npm update`), then `sketchbook upgrade` replaced only
   `.claude/hooks/guard-decisions.mjs`; the team's merged `settings.json` and `deploy.md` stayed, and the guard then
   blocked the append (exit 2).

   Asked to "Add a new component called Banner", Claude read `sketchbook help add`, ran
   `sketchbook add Banner --blank --dry-run` (the CLI refused: Banner is not in `spec/registry.json`), created nothing,
   pointed out that the installed `sb-alert` may already cover a banner (the hammock ladder's "already in the codebase"),
   and asked whether to plan a new component (registry entry, `--blank`, contract, planning gate) or extend Alert's
   contract. Every check of `TEST-GUIDE.md` step 2 has now been run by the person.

## Still open

- The package is not published: `init` needs `--engine <tarball|git URL>` until it is (simplicity debt).
- In an app repository, the design system's hooks fire only in a Claude Code session started in its folder.
- Friction seen in the Banner check, by design today: no CLI command adds a planned entry to `spec/registry.json`, so a
  new design starts with a hand edit (`sketchbook add <Name> --blank` requires the entry).
- The package is not published: `init` needs `--engine <tarball|git URL>` until it is (simplicity debt).
- In an app repository, the design system's hooks fire only in a Claude Code session started in its folder.
