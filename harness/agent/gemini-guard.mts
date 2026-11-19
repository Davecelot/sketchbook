#!/usr/bin/env node
// Gemini BeforeTool adapter: reuse the engine's unchanged Claude guards for native file tools.
import { spawnSync } from 'node:child_process';
import { dirname, join, relative, resolve, isAbsolute, sep } from 'node:path';
import { realpathSync } from 'node:fs';
import { ENGINE } from '../lib/files.mjs';

interface Input { tool_name?: string; cwd?: string; tool_input?: { file_path?: string; content?: string; old_string?: string; new_string?: string } }
try {
  const raw = await new Promise<string>((done) => { let data = ''; process.stdin.on('data', (chunk: Buffer) => { data += String(chunk); }); process.stdin.on('end', () => done(data)); });
  let input: Input;
  try { input = JSON.parse(raw) as Input; } catch { process.stderr.write('Sketchbook guard: invalid hook input.\n'); process.exit(2); }
  if (!['write_file', 'replace'].includes(input.tool_name ?? '')) { process.stdout.write('{}\n'); process.exit(0); }
  const projectDir = process.env.GEMINI_PROJECT_DIR;
  const path = input.tool_input?.file_path;
  if (!projectDir || !path) { process.stderr.write('Sketchbook guard: missing project directory or file path.\n'); process.exit(2); }
  const root = realpathSync(projectDir);
  const cwd = resolve(input.cwd ?? projectDir);
  const requested = resolve(cwd, path);
  const inside = (base: string, file: string): boolean => {
    const rel = relative(base, file);
    return rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
  };
  // A write may target a file that does not exist yet. Resolve its closest
  // existing ancestor, retaining the rest of the path for the guard.
  function resolveExistingAncestor(file: string): string {
    try { return realpathSync(file); } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== 'ENOENT' && code !== 'ENOTDIR') throw error;
      const parent = dirname(file);
      if (parent === file) throw error;
      return join(resolveExistingAncestor(parent), relative(parent, file));
    }
  }
  let resolved: string;
  try { resolved = resolveExistingAncestor(requested); } catch { process.stderr.write('Sketchbook guard: unable to resolve the edit path.\n'); process.exit(2); }
  const candidates = new Set<string>();
  if (inside(root, resolved)) candidates.add(resolved);
  // Also check the project-relative spelling, so a generated directory that is
  // itself a symlink stays protected even when its target is outside the project.
  const lexicalRoot = resolve(projectDir);
  if (inside(lexicalRoot, requested)) candidates.add(resolve(root, relative(lexicalRoot, requested)));
  for (let base = dirname(requested); ; base = dirname(base)) {
    try { if (realpathSync(base) === root && inside(base, requested)) candidates.add(resolve(root, relative(base, requested))); } catch { /* continue to the parent */ }
    if (dirname(base) === base) break;
  }
  for (const file of candidates) {
    const event = { tool_name: input.tool_name === 'write_file' ? 'Write' : 'Edit', tool_input: { ...input.tool_input, file_path: file } };
    for (const hook of ['guard-generated', 'guard-decisions']) {
      const result = spawnSync(process.execPath, [join(ENGINE, '.claude/hooks', `${hook}.mjs`)], { input: JSON.stringify(event), encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: root } });
      if (result.status === 2) {
        process.stdout.write(JSON.stringify({ decision: 'deny', reason: result.stderr.trim() || `Sketchbook guard ${hook} blocked the edit.` }) + '\n');
        process.exit(0);
      }
      if (result.status !== 0) { process.stderr.write(result.stderr || `Sketchbook guard ${hook} could not run.\n`); process.exit(2); }
    }
  }
  process.stdout.write('{}\n');
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Sketchbook guard failed: ${message}\n`);
  process.exitCode = 2;
}
