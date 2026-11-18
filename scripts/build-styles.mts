// Compiles each src/**/<Name>.scss to a co-located <Name>.styles.ts (a Lit `css` result the
// component injects into its shadow root). The .styles.ts files are generated: edit the .scss.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as sass from 'sass';
import { parseJson, isMain } from '../harness/lib/files.mjs';
import { loadAll, resolve, tokensForMode } from '../harness/lib/tokens.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Media queries cannot read custom properties, so a component token used in one is inlined here
// with its resolved length (SB-0109); everywhere else the variable stays live.
export async function mediaVars(root: string): Promise<Record<string, string>> {
  const { prefix } = parseJson<{ prefix: string }>(readFileSync(path.join(root, 'harness.config.json'), 'utf8'));
  const all = await loadAll(root);
  const map = tokensForMode(all, null);
  const vars: Record<string, string> = {};
  for (const t of all.sets.filter((s) => s.layer === 'component').flatMap((s) => s.tokens)) {
    const r = resolve(map, t.path);
    if (!r.error && /^\d+(\.\d+)?(px|rem|em)$/.test(String(r.value))) vars[`--${prefix}-${t.path.replace(/\./g, '-')}`] = String(r.value);
  }
  return vars;
}

const inlineMedia = (css: string, vars: Record<string, string>, file: string) => css.replace(/@media[^{]+/g, (query) => query.replace(/var\((--[a-z0-9-]+)\)/g, (_, name: string) => {
  const value = vars[name];
  if (value === undefined) throw new Error(`${file}: ${name} in a media query is not a component length token`);
  return value;
}));

export function scssSources(root: string): string[] {
  try {
    return readdirSync(path.join(root, 'src'), { recursive: true, withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith('.scss') && !e.name.startsWith('_'))
      .map((e) => path.join(e.parentPath, e.name));
  } catch { return []; }
}

// Button.scss -> `buttonStyles`.
const exportName = (base: string) => `${base.slice(0, 1).toLowerCase()}${base.slice(1)}Styles`;
const escapeForTemplate = (css: string) => css.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');

export function compileStyles(file: string, vars: Record<string, string> = {}): { out: string; contents: string } {
  const base = path.basename(file, '.scss');
  const css = inlineMedia(sass.compile(file, { style: 'expanded', loadPaths: [path.join(path.dirname(file), '..', '..', 'styles')] }).css.trim(), vars, file);
  return {
    out: path.join(path.dirname(file), `${base}.styles.ts`),
    contents: `// GENERATED from ${base}.scss by scripts/build-styles.mjs. Do not edit.\nimport { css } from 'lit';\n\nexport const ${exportName(base)} = css\`\n${escapeForTemplate(css)}\n\`;\n`,
  };
}

if (isMain(import.meta.url)) {
  const files = scssSources(ROOT);
  if (!files.length) console.log('[build:styles] no .scss files under src/');
  const vars = await mediaVars(ROOT);
  for (const file of files) {
    const { out, contents } = compileStyles(file, vars);
    writeFileSync(out, contents);
    console.log(`[build:styles] ${path.relative(ROOT, file)} -> ${path.basename(out)}`);
  }
}
