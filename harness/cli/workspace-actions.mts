import { spawn } from 'node:child_process';
import { realpath, stat } from 'node:fs/promises';
import { basename, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseJson } from '../lib/files.mjs';
import type { Report } from '../checks/types.mjs';

const checkRunner = fileURLToPath(new URL('../checks/run.mjs', import.meta.url));

function checkFailure(stderr: string): string {
  const lines = stderr.split(/\r?\n/);
  const start = lines.findIndex((line) => /^\w*Error\b/.test(line));
  if (start < 0) return 'The check process ended without a report.';
  const stack = lines.findIndex((line, index) => index > start && /^\s+at /.test(line));
  return lines.slice(start, stack < 0 ? undefined : stack).map((line) => line.trim()).filter(Boolean).join(' ');
}

export function workspaceChecks(root: string, signal: AbortSignal): Promise<Report> {
  return new Promise((done, fail) => {
    // A failed check and a pass with overrides both produce reports. A process failure does not.
    const child = spawn(process.execPath, [checkRunner, '--json'], { cwd: root, signal, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8').on('data', (chunk: string) => { stdout += chunk; });
    child.stderr.setEncoding('utf8').on('data', (chunk: string) => { stderr += chunk; });
    let spawnError: Error | undefined;
    child.on('error', (error) => { spawnError = error; });
    child.once('close', (code) => {
      if (spawnError) { fail(spawnError); return; }
      try {
        const report = parseJson<Report>(stdout);
        if (report.exitCode !== code || !Array.isArray(report.results) || !Array.isArray(report.overrides)) {
          throw new Error('Invalid check report.');
        }
        done(report);
      } catch {
        fail(new Error(checkFailure(stderr)));
      }
    });
  });
}

export interface EditorLaunch { program: string; args: string[] }

export async function workspaceEditor(root: string, file: string, line?: number, editor = process.env.VISUAL || process.env.EDITOR): Promise<EditorLaunch> {
  const project = await realpath(root);
  const target = await realpath(resolve(project, file)).catch(() => null);
  if (!target) throw new Error('File is unavailable. Open it manually using the reported path.');
  const inside = relative(project, target);
  if (!inside || isAbsolute(inside) || inside === '..' || inside.startsWith(`..${sep}`) || !(await stat(target)).isFile()) {
    throw new Error('The reported path is outside the project or is not a file.');
  }
  if (!editor) throw new Error('Set VISUAL or EDITOR to an editor executable, or open the file manually.');
  const name = basename(editor).toLowerCase().replace(/\.exe$/, '');
  if (name === 'code' || name === 'code-insiders' || name === 'codium') {
    return { program: editor, args: ['--wait', ...(line ? ['--goto', `${target}:${line}`] : [target])] };
  }
  const lineArg = line && ['vi', 'vim', 'nvim', 'nano', 'emacs'].includes(name) ? [`+${line}`] : [];
  return { program: editor, args: [...lineArg, target] };
}

export function openWorkspaceEditor(root: string, { program, args }: EditorLaunch, signal: AbortSignal): Promise<void> {
  return new Promise((done, fail) => {
    const child = spawn(program, args, { cwd: root, signal, stdio: 'inherit' });
    child.once('error', (error) => fail(Object.assign(error, { editorStarted: child.pid !== undefined })));
    child.once('close', (code, signal) => {
      if (code === 0 || signal === 'SIGINT') done();
      else fail(Object.assign(new Error('The editor did not finish successfully.'), { editorStarted: child.pid !== undefined }));
    });
  });
}
