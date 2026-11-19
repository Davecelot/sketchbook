// Resolve the engine from this project, including a workspace's hoisted dependencies.
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import process from 'node:process';

let guard;
try {
  guard = createRequire(import.meta.url).resolve('sketchbook/harness/agent/gemini-guard.mjs');
} catch {
  process.stderr.write('Sketchbook guard unavailable: install the project dependencies.\n');
  process.exit(2);
}
const result = spawnSync(process.execPath, [guard], { stdio: 'inherit', env: process.env });
if (result.error) process.stderr.write(`Sketchbook guard could not start: ${result.error.message}\n`);
process.exit(result.status ?? 2);
