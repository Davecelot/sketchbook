// Writes src/index.ts: one export per component folder (each folder's index.ts registers its elements).
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverComponents } from './discover-components.mjs';
import { isMain } from '../harness/lib/files.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function barrel(root: string): string {
  const dirs = [...new Set(discoverComponents(root).map((c) => c.dir))].sort();
  return `// GENERATED from src/components/ by scripts/build-barrel.mjs. Do not edit.\n${dirs.map((d) => `export * from './components/${d}/index.js';`).join('\n')}${dirs.length ? '\n' : 'export {};\n'}`;
}

if (isMain(import.meta.url)) {
  const out = barrel(ROOT);
  writeFileSync(path.join(ROOT, 'src', 'index.ts'), out);
  console.log(`[build:barrel] ${out.split('\n').filter((l) => l.startsWith('export *')).length} component folder(s) -> src/index.ts`);
}
