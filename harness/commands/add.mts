// sketchbook add <Component Name>: scaffold spec/components/<name>/{contract.json,contract.md,plan.md} for a
// registry entry, set its status to draft and open a proposed decision record (decision first).
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join } from 'node:path';
import type { ComponentContract } from '../../generated/types/contract.js';
import type { HarnessConfigJson } from '../../generated/types/harness-config.js';
import type { ComponentRegistry } from '../../generated/types/registry.js';
import { proposeDecision } from '../lib/decisions.mjs';
import { parseJson } from '../lib/files.mjs';

export interface AddResult { name: string; component: string; tag: string; decision: string | null; files: string[]; dryRun?: true }

const kebab = (s: string): string => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const pascal = (s: string): string => kebab(s).split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
const exists = async (p: string): Promise<boolean> => { try { await access(p); return true; } catch { return false; } };
const today = () => new Date().toISOString().slice(0, 10);

// Decision first: adding a component opens a proposed decision record next to the contract draft.
const proposeComponentDecision = (root: string, component: string, name: string): Promise<string> => proposeDecision(root, {
  section: 'Components',
  title: `Add ${component}`,
  context: `PROPOSAL: why the system needs ${component} now.`,
  decision: `PROPOSAL: add ${component} (spec/components/${name}/) with the API and look described in its contract.`,
  why: 'PROPOSAL: the need it meets and the alternatives considered.',
  watchOut: 'PROPOSAL: risks, accessibility concerns, deviations from the visual reference.',
});

export async function add(root: string, displayName: string, { dryRun = false }: { dryRun?: boolean } = {}): Promise<AddResult> {
  const config = parseJson<HarnessConfigJson>(await readFile(join(root, 'harness.config.json'), 'utf8'));
  const registryPath = join(root, 'spec/registry.json');
  const registry = parseJson<ComponentRegistry>(await readFile(registryPath, 'utf8'));
  const entry = registry.components.find((c) => kebab(c.name) === kebab(displayName));
  if (!entry) throw new Error(`"${displayName}" is not in spec/registry.json. Add it there first (name, tier, status: planned).`);
  const name = kebab(entry.name);
  const dir = join(root, 'spec/components', name);
  if (await exists(join(dir, 'contract.json'))) throw new Error(`spec/components/${name}/contract.json already exists.`);
  const component = pascal(entry.name);
  const tag = `${config.prefix}-${name}`;
  const files = ['contract.json', 'contract.md', 'plan.md'].map((f) => `spec/components/${name}/${f}`);
  if (dryRun) return { name, component, tag, decision: null, files: [...files, 'spec/registry.json', 'spec/decisions/DECISIONS.md'], dryRun: true };
  const contract: ComponentContract = {
    $schema: '../../schemas/contract.schema.json',
    component, tag, status: 'draft', version: '0.1.0', platforms: ['web', 'design'],
    summary: `PROPOSAL: ${entry.name} as a Web Component. Describe what it is for, in your own words.`,
    dependsOn: [],
    props: {},
    anatomy: [{ name: 'root', role: 'container', parent: null, part: 'root', notes: 'PROPOSAL' }],
    content: {},
    events: {},
    states: {},
    accessibility: { role: 'PROPOSAL', accessibleNameSource: 'PROPOSAL', keyboard: {}, aria: [], contrast: [] },
    tokens: {},
    realizations: { web: { status: 'not-started', files: [], spec: `playwright/tests/${name}/${name}.behavior.spec.ts`, coverage: [], drift: [] }, design: { status: 'not-started', coverage: [], drift: [] } },
    openQuestions: [{ id: 'Q0', question: 'Is the contract grounded in the design reference and applicable WAI-ARIA guidance?', status: 'open' }],
    decisions: [],
  };
  const md = `---\ncomponent: ${component}\nstatus: draft\nversion: 0.1.0\nplatforms: [web, design]\ndependsOn: []\nlast_updated: ${today()}\nsource: shadcn/ui ${entry.name} (UI and API), harness process\n---\n\n# ${component}\n\n> PROPOSAL. Typed spec: [contract.json](./contract.json).\n\n## 1. Purpose\n\n## 2. Anatomy\n\n## 3. Props / API\n\n## 4. Variant matrix\n\n## 5. Roles and color\n\n## 6. States\n\n## 7. Dimensions and layout\n\n## 8. Typography\n\n## 9. Accessibility\n\n## 10. Usage\n### Behavior\n### Composition\n### Choosing the props\n### Do / Don't\n\n## Realizations\n### Figma\nNot started.\n### Web\nNot started.\n### Coverage\nNone yet.\n### Known drift\nNone.\n\n## Open questions\n\n## Spec for agents\nBuild from contract.json only. CSS uses only --${config.prefix}-${name}-* variables (check T4). Tests first (rule test-first).\n`;
  const plan = `# Plan: ${component} (planning gate)\n\nStatus: **draft**. Tests and code start only after approval (planning gate, then test-first).\n\n## Scope\n\n## Files (in build order)\n| Step | File |\n| --- | --- |\n| 1 | \`src/components/${name}/${component}.stories.ts\` |\n| 2 | \`playwright/tests/${name}/${name}.behavior.spec.ts\` (written first, must fail) |\n| 3 | \`src/components/${name}/${component}.scss\` -> \`${component}.styles.ts\` (generated) |\n| 4 | \`src/components/${name}/${component}.ts\`, \`index.ts\` |\n\n## Test plan (test-first)\n\n## Accessibility deviations from the references\n\n## Open questions (recommendation first)\n`;
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'contract.json'), JSON.stringify(contract, null, 2) + '\n');
  await writeFile(join(dir, 'contract.md'), md);
  await writeFile(join(dir, 'plan.md'), plan);
  entry.status = 'draft';
  entry.path = `spec/components/${name}`;
  await writeFile(registryPath, JSON.stringify(registry, null, 2) + '\n');
  const decision = await proposeComponentDecision(root, component, name);
  contract.decisions = [decision];
  await writeFile(join(dir, 'contract.json'), JSON.stringify(contract, null, 2) + '\n');
  return { name, component, tag, decision, files: [...files, 'spec/registry.json', 'spec/decisions/DECISIONS.md'] };
}
