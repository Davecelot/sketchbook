# Install the Claude layer

This folder is the design system's Claude layer (skills, slash commands, rules, hooks and their settings), staged by
`sketchbook init`. It is not active until it lives in `.claude/`. Ask Claude Code, opened in this design-system folder:

> Install the Claude layer from move-to-.claude/ (follow move-to-.claude/INSTALL.md).

Claude Code protects `.claude/`: it asks you to approve creating the folder and writing into it. Approve those
prompts; they are the install (a session that cannot ask, such as `claude -p`, stops and lists the commands instead).

## For Claude: how to install it

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
4. **Check.** Run `npm run sketchbook -- check --only H1` (the Claude layer check) and `npm run sketchbook -- doctor`;
   fix what they report.
5. **Clean up.** When H1 passes and `doctor` says the Claude layer is installed, delete `move-to-.claude/`.
6. **Tell the person** to restart Claude Code in this folder so the hooks and rules load.

## Where Claude Code has to be started

Claude Code reads `.claude/settings.json` (and so the hooks) only from the folder it was started in, and
`${CLAUDE_PROJECT_DIR}` is that folder. Skills, rules and `CLAUDE.md` of a subfolder load only once Claude touches its
files.

- **The design system is its own repository:** start Claude Code here; everything loads.
- **The design system is a folder inside an app repository** (`sketchbook init --adopt` or `--dir`): start Claude Code
  in the design-system folder for design-system work, so its hooks fire. A session started at the app root can add it
  with `/add-dir <folder>` (skills and commands load; hooks and settings do not).
