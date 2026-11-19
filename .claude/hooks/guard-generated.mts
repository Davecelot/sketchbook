#!/usr/bin/env node
// PreToolUse (Edit|Write|MultiEdit): outputs are never edited by hand (rule spec-is-source).
// Blocks the edit and says which source to change instead.
import { realpathSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, sep } from 'node:path';
interface ToolCall { tool_input?: { file_path?: string } }
const input = JSON.parse(await new Promise<string>((r) => { let d = ''; process.stdin.on('data', (c: Buffer) => (d += String(c))); process.stdin.on('end', () => r(d || '{}')); })) as ToolCall;
const file = String(input.tool_input?.file_path ?? '').replace(/\\/g, '/');
const rootValue = (process.env.CLAUDE_PROJECT_DIR ?? '').replace(/\\/g, '/');
const root = rootValue.replace(/\/+$/, '') || (rootValue.startsWith('/') ? '/' : '');
const prefix = root === '/' ? '/' : `${root}/`;
const caseInsensitive = process.platform === 'win32' || /^[A-Za-z]:\//.test(rootValue);
const inRoot = root && (caseInsensitive ? file.toLowerCase().startsWith(prefix.toLowerCase()) : file.startsWith(prefix));
const rel = inRoot ? file.slice(prefix.length) : file;
const paths = [rel];
// Clients can report an absolute path through a workspace alias (for example,
// macOS /var versus /private/var). Resolve the nearest existing ancestor so
// newly created outputs are checked against the physical project as well.
if (rootValue && isAbsolute(file)) {
  try {
    const existing = (path: string): string => {
      try { return realpathSync(path); } catch (error) {
        if (!['ENOENT', 'ENOTDIR'].includes((error as NodeJS.ErrnoException).code ?? '')) throw error;
        const parent = dirname(path);
        if (parent === path) throw error;
        return join(existing(parent), relative(parent, path));
      }
    };
    const physicalRoot = realpathSync(rootValue);
    const physical = existing(file);
    const relativePath = relative(physicalRoot, physical);
    if (relativePath !== '..' && !relativePath.startsWith(`..${sep}`) && !isAbsolute(relativePath)) paths.push(relativePath.split(sep).join('/'));
    for (let base = dirname(file); ; base = dirname(base)) {
      try {
        if (realpathSync(base) === physicalRoot) paths.push(relative(base, file).split(sep).join('/'));
      } catch { /* Continue to the next ancestor. */ }
      if (dirname(base) === base) break;
    }
  } catch { /* Preserve the original lexical check when a path cannot be resolved. */ }
}
const rules: [RegExp, string][] = [
  [/^generated\//, 'generated/** is rebuilt from spec/ (npm run generate). Change the source: spec/tokens/semantic/*, brand.config.json or the contract.'],
  [/^spec\/tokens\/foundation\//, 'Foundation tokens are generated from brand.config.json. Use sketchbook tokens set|preset, or review a rebuild with sketchbook tokens rebuild --dry-run --yes (foundations skill, rule tokens-through-the-harness).'],
  [/\.styles\.ts$/, 'Edit the .scss next to it; .styles.ts is generated (npm run generate).'],
  [/^src\/index\.ts$/, 'src/index.ts is generated from src/components/ (npm run generate).'],
];
for (const path of paths) {
  for (const [re, why] of rules) {
    if (re.test(caseInsensitive ? path.toLowerCase() : path)) {
      process.stderr.write(`Blocked: ${path} is an output. ${why}\n`);
      process.exit(2);
    }
  }
}
