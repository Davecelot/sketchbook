#!/usr/bin/env node
// sketchbook <command>: deterministic half of the harness commands (the AI half lives in .claude/commands/).
// A thin dispatcher over the command registry in harness/cli/commands; `sketchbook help` and docs/cli.md list them.
// Bare `sketchbook` in a terminal opens the interactive menu (harness/cli/interactive.mjs); piped or --json prints help.
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dispatch } from './cli/run.mjs';
import { interactive, wantsInteractive } from './cli/interactive.mjs';
import { errorMessage } from './lib/files.mjs';

export { add } from './commands/add.mjs';

// npm starts the CLI through a .bin symlink, so argv[1] is the link while import.meta.url is the real file.
const main = (() => { try { return realpathSync(process.argv[1] ?? '') === fileURLToPath(import.meta.url); } catch { return false; } })();
if (main) {
  const argv = process.argv.slice(2);
  // exitCode, not exit(): long --json output on a pipe must flush (SB-0049).
  (wantsInteractive(argv) ? interactive({ start: argv[0] === 'harness' ? 'harness' : 'home' }) : dispatch(argv)).then((code) => { process.exitCode = code; }, (e: unknown) => { console.error(errorMessage(e)); process.exitCode = 1; });
}
