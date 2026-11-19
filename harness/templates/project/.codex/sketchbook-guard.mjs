// Codex apply_patch adapter: protect generated outputs without granting tool permissions.
import process from 'node:process';
import { realpathSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
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
  // Find a spelling of the project root through the requested path so a
  // generated directory linked outside the project remains protected.
  for (let base = dirname(requested); ; base = dirname(base)) {
    try { if (realpathSync(base) === root && inside(base, requested)) files.add(resolve(root, relative(base, requested))); } catch { /* continue to the parent */ }
    if (dirname(base) === base) break;
  }
  if (inside(root, requested)) files.add(requested);
  return files;
}
const raw = await new Promise((done) => { let data = ''; process.stdin.on('data', (chunk) => { data += chunk; }); process.stdin.on('end', () => done(data)); });
let input;
try { input = JSON.parse(raw); } catch { process.stdout.write('{}\n'); process.exit(0); }
if (!input || typeof input !== 'object' || !['apply_patch', 'functions.apply_patch'].includes(input.tool_name) || typeof input.tool_input?.command !== 'string') { process.stdout.write('{}\n'); process.exit(0); }
const patch = input.tool_input.command;
if (!patch.startsWith('*** Begin Patch')) { process.stdout.write('{}\n'); process.exit(0); }
for (const line of patch.split('\n')) {
  const match = /^\*\*\* (?:Add File|Update File|Delete File|Move to): (.+?)\r?$/.exec(line);
  if (!match) continue;
  let files;
  try { files = candidates(resolve(resolve(input.cwd || root), match[1])); } catch {
    process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: 'Sketchbook guard could not resolve the patch path.' } }) + '\n');
    process.exit(0);
  }
  for (const file of files) {
    const posix = relative(root, file).split(sep).join('/');
    const matchedPath = process.platform === 'win32' ? posix.toLowerCase() : posix;
    if (/^generated\//.test(matchedPath) || /^spec\/tokens\/foundation\//.test(matchedPath) || /\.styles\.ts$/.test(matchedPath) || matchedPath === 'src/index.ts') {
      const reason = `${posix} is generated. Change its source and rebuild instead.`;
      process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason } }) + '\n');
      process.exit(0);
    }
  }
}
process.stdout.write('{}\n');
