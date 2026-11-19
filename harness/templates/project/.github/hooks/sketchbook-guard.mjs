// Copilot CLI/cloud adapter for native create and edit calls. No implicit approval is granted.
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { realpathSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const inside = (base, file) => {
  const rel = relative(base, file);
  return rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
};
function resolveExistingAncestor(file) {
  try { return realpathSync(file); } catch (error) {
    if (!['ENOENT', 'ENOTDIR'].includes(error.code)) throw error;
    const parent = dirname(file);
    if (parent === file) throw error;
    return join(resolveExistingAncestor(parent), relative(parent, file));
  }
}
function candidates(requested) {
  const files = new Set();
  const physical = resolveExistingAncestor(requested);
  if (inside(root, physical)) files.add(physical);
  for (let base = dirname(requested); ; base = dirname(base)) {
    try { if (realpathSync(base) === root && inside(base, requested)) files.add(resolve(root, relative(base, requested))); } catch { /* continue to the parent */ }
    if (dirname(base) === base) break;
  }
  if (inside(root, requested)) files.add(requested);
  return files;
}
const raw = await new Promise((done) => { let data = ''; process.stdin.on('data', (chunk) => { data += chunk; }); process.stdin.on('end', () => done(data)); });
let event;
try { event = JSON.parse(raw); } catch { process.stdout.write('{}\n'); process.exit(0); }
if (!event || typeof event !== 'object' || !['create', 'edit'].includes(event.toolName)) { process.stdout.write('{}\n'); process.exit(0); }
let args = event.toolArgs;
if (typeof args === 'string') { try { args = JSON.parse(args); } catch { args = null; } }
const path = args?.path ?? args?.filePath;
if (typeof path !== 'string') { process.stdout.write('{}\n'); process.exit(0); }
let engine;
try { engine = resolve(dirname(createRequire(import.meta.url).resolve('sketchbook/harness/cli.mjs')), '..'); }
catch { process.stderr.write('Sketchbook guards unavailable until npm install; run sketchbook check afterward.\n'); process.stdout.write('{}\n'); process.exit(0); }
let files;
try { files = candidates(resolve(resolve(event.cwd || root), path)); } catch {
  process.stdout.write(JSON.stringify({ permissionDecision: 'deny', permissionDecisionReason: 'Sketchbook guard could not resolve the edit path.' }) + '\n');
  process.exit(0);
}
for (const file of files) {
  const translated = {
    tool_name: event.toolName === 'create' ? 'Write' : 'Edit',
    tool_input: {
      file_path: file,
      content: args.file_text ?? args.content,
      old_string: args.old_str ?? args.old_string,
      new_string: args.new_str ?? args.new_string,
    },
  };
  for (const hook of ['guard-generated', 'guard-decisions']) {
    const result = spawnSync(process.execPath, [join(engine, '.claude/hooks', `${hook}.mjs`)], { input: JSON.stringify(translated), encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: root } });
    if (result.status !== 0) {
      const reason = result.stderr?.trim() || `Sketchbook guard ${hook} could not run.`;
      process.stdout.write(JSON.stringify({ permissionDecision: 'deny', permissionDecisionReason: reason }) + '\n');
      process.exit(0);
    }
  }
}
process.stdout.write('{}\n');
