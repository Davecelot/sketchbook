# Install the Claude layer

This folder is the design system's Claude layer (skills, slash commands, rules, hooks and their settings), staged by
`sketchbook init --agent claude`. It is not active until it lives in `.claude/`. Ask Claude Code, opened in this design-system folder:

> Install the Claude layer from move-to-.claude/ (follow move-to-.claude/INSTALL.md).

Claude Code protects `.claude/`: it asks you to approve creating the folder and writing into it. Approve those
prompts; they are the install (a session that cannot ask, such as `claude -p`, stops and lists the commands instead).

## Installation steps

Work in the design-system folder (the one holding `harness.config.json`). Do every step, then report what you did.

1. **Look first.** List what is in `move-to-.claude/` and what is already in `.claude/` (it may not exist). Nothing the
   team already has in `.claude/` is deleted or overwritten without asking.
2. **Copy the files.** Copy `move-to-.claude/skills/`, `commands/`, `rules/` and `hooks/` into `.claude/` keeping their
   paths. When a file with the same path already exists and differs, show the difference and ask which to keep.
3. **Merge the settings.** `move-to-.claude/settings.json` holds hooks. If `.claude/settings.json` does not exist, copy it.
   If it exists, merge: for each event (`SessionStart`, `PreToolUse`, …) add every hook entry whose `command` is not
   already there; keep every existing key, entry and permission as it is. Never remove the team's own hooks. A
   Sketchbook hook from an earlier install that calls its script directly (`node "${CLAUDE_PROJECT_DIR}/.claude/<path>.js"`
   or `.mjs`) is replaced by the staged `.claude/hooks/run.mjs <path>` command for the same path, so it does not run twice.
4. **Check the installed copy.** H1 and doctor prefer the staged folder while it exists, even if `.claude/` is present. First check that `move-to-.claude.install-backup/` does not already exist; if it does, stop and inspect it rather than overwriting it. Rename `move-to-.claude/` to `move-to-.claude.install-backup/` in the same directory. Run `npm run sketchbook -- check --only H1` and `npm run sketchbook -- doctor`. If either check fails or doctor does not report the layer installed, rename the backup back to `move-to-.claude/`, report the problem, and leave it for repair.
5. **Clean up.** Only after H1 passes and doctor reports the layer installed, remove `move-to-.claude.install-backup/`.
6. **Tell the person** to restart the agent in this folder so its configuration can load.

## Where Claude Code has to be started

Claude Code reads `.claude/settings.json` (and so the hooks) only from the folder it was started in, and
`${CLAUDE_PROJECT_DIR}` is that folder. Skills, rules and `CLAUDE.md` of a subfolder load only once Claude touches its
files.

- **The design system is its own repository:** start Claude Code here; everything loads.
- **The design system is a folder inside an app repository** (`sketchbook init --adopt` or `--dir`): start Claude Code
  in the design-system folder for design-system work, so its hooks fire. A session started at the app root can add it
  with `/add-dir <folder>` (skills and commands load; hooks and settings do not).

## Cursor compatibility

Cursor documents importing supported Claude-format hooks from `.claude/settings.json` when **Include Third-Party Plugins, Skills, and Other Configs** is enabled in its agent settings. An agent other than Claude Code can follow the installation steps above, subject to its own permissions. Cursor documents `CLAUDE_PROJECT_DIR` as a compatibility alias and maps `PreToolUse`, `PostToolUse`, `SessionStart` and `UserPromptSubmit`; its documentation does not list Claude's `SubagentStart` as a supported imported event. Do not assume the whole layer is equivalent: confirm hook loading and test the required workflows in the actual Cursor environment. Do not add a duplicate native hook configuration alongside imported hooks without checking which ones are already active.

See [Cursor's third-party hook documentation](https://cursor.com/docs/reference/third-party-hooks) and [hook environment variables](https://cursor.com/docs/hooks).
