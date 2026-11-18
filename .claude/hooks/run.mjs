#!/usr/bin/env node
// Runs a Claude Code hook named by its path under .claude/ without the extension (settings.json: run.mjs hooks/guard-decisions).
// The hooks are TypeScript compiled in place (SB-0119), so this file stays plain JS: in a fresh clone nothing is compiled
// yet, and the first hook builds them once. The hook is imported, not spawned, so it still reads its own stdin.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const claude = join(dirname(fileURLToPath(import.meta.url)), '..');
const name = process.argv[2] ?? '';
const hook = join(claude, `${name}.mjs`);
const valid = /^(hooks|skills\/[\w-]+\/hooks)\/[\w-]+$/.test(name);

// A source newer than its output (a pull, a checkout) means the compiled hook or a module beside it it imports is stale.
// A project has no .mts here, so this never builds there.
const stale = (dir) => {
  try {
    return readdirSync(dir).some((f) => f.endsWith('.mts') && !f.endsWith('.d.mts') && (!existsSync(join(dir, f.replace(/\.mts$/, '.mjs'))) || statSync(join(dir, f)).mtimeMs > statSync(join(dir, f.replace(/\.mts$/, '.mjs'))).mtimeMs));
  } catch {
    return false;
  }
};

if (valid && (!existsSync(hook) || stale(dirname(hook)))) {
  const build = join(claude, '..', 'scripts', 'build-harness.mjs');
  // The build's output goes to stderr: a hook's stdout is read by Claude Code as its result.
  if (existsSync(build)) spawnSync(process.execPath, [build], { cwd: join(claude, '..'), stdio: ['ignore', 2, 2] });
}
if (!valid || !existsSync(hook)) {
  process.stderr.write(`Sketchbook hook ${name || '(none named)'} is missing: no ${hook}. In a Sketchbook checkout run npm ci, then npm run build:harness; in a project, sketchbook init restores it.\n`);
  // A guard that cannot run blocks the edit it would have checked (exit 2); any other hook fails like a crash (exit 1),
  // which Claude Code reports without blocking the session.
  process.exit(/^hooks\/guard-/.test(name) ? 2 : 1);
}
await import(pathToFileURL(hook).href);
