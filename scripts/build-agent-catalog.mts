import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { catalogProjections } from '../harness/lib/agent-render.mjs';
import { ENGINE } from '../harness/lib/files.mjs';

for (const { path, bytes } of catalogProjections()) {
  const target = join(ENGINE, path);
  let current: Buffer | undefined;
  try { current = readFileSync(target); } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  if (current?.equals(bytes)) continue;
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, bytes);
}
