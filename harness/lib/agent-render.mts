import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ENGINE, readJson, walk } from './files.mjs';

export const CATALOG_SOURCE = 'harness/templates/agent-catalog';
export const catalogSourceFiles = () => walk(ENGINE, CATALOG_SOURCE).map((file) => file.replaceAll('\\', '/'));
const COMPONENTS = ['contract-author', 'component-builder'];
const split = (text: string) => {
  const match = /^---\n([\s\S]*?)\n---\n\n?/.exec(text);
  return { header: match?.[1], body: match ? text.slice(match[0].length) : text };
};

// Native Claude files are projections of the shared content plus discovery metadata.
export function catalogProjections() {
  const native = readJson<Record<string, string>>(join(ENGINE, 'harness/templates/claude-catalog-metadata.json'));
  return catalogSourceFiles().flatMap((source) => {
    const rel = source.slice(CATALOG_SOURCE.length + 1);
    if (!rel.includes('/') || rel.endsWith('.example.json')) return [];
    const [id = '', ...parts] = rel.split('/');
    const isRule = id === 'rules';
    const isCommand = id === 'commands';
    const dest = isRule || isCommand ? rel : `skills/${rel}`;
    const bytes = readFileSync(join(ENGINE, source));
    const metadata = native[dest];
    const files: { source: string; path: string; bytes: Buffer }[] = [];
    if (COMPONENTS.includes(id) && parts.join('/') === 'SKILL.md') {
      return [{ source, path: `.agents/${dest}`, bytes }]; // existing Claude wrappers only route to the shared skill
    }
    if (dest.endsWith('.md') && (parts.join('/') === 'SKILL.md' || isRule || isCommand || parts[0] === 'agents')) {
      const { header, body } = split(bytes.toString('utf8'));
      let fields = [header, metadata].filter(Boolean).join('\n');
      let content = body;
      if (parts.join('/') === 'SKILL.md') {
        if (id === 'forge-me-a-skill' || id === 'hammock') fields += '\ndisable-model-invocation: true';
        fields += '\nmetadata:\n  author: sketchbook\n  version: "1.0.0"\n  changelog: Rendered from the shared workflow\n  auto-invoke: See description\n  allowed-tools: Governed by the client and user';
      } else if (isCommand) {
        content = body.replaceAll('<input>', '$ARGUMENTS');
      }
      files.push({ source, path: `.claude/${dest}`, bytes: Buffer.from(`${fields ? `---\n${fields}\n---\n\n` : ''}${content}`) });
    } else {
      files.push({ source, path: `.claude/${dest}`, bytes });
    }
    return files;
  });
}
