// Writes generated/types/<schema>.d.ts from spec/schemas/*.schema.json, so TypeScript code reads JSON with the shape its schema validates.
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileFromFile } from 'json-schema-to-typescript';
import { isMain } from '../harness/lib/files.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const banner = '// GENERATED from spec/schemas by scripts/build-schema-types.mjs. Do not edit.';

export async function schemaTypes(root: string): Promise<[string, string][]> {
  const dir = path.join(root, 'spec', 'schemas');
  const files = readdirSync(dir).filter((f) => f.endsWith('.schema.json')).sort();
  return Promise.all(
    files.map(async (f): Promise<[string, string]> => [f.replace('.schema.json', '.d.ts'), await compileFromFile(path.join(dir, f), { bannerComment: banner, cwd: dir })]),
  );
}

if (isMain(import.meta.url)) {
  const out = path.join(ROOT, 'generated', 'types');
  mkdirSync(out, { recursive: true });
  const types = await schemaTypes(ROOT);
  for (const [name, source] of types) writeFileSync(path.join(out, name), source);
  console.log(`[build:schema-types] ${types.length} schema(s) -> generated/types/`);
}
