import type { harnessCatalog } from '../lib/agent-catalog.mjs';

type Entry = ReturnType<typeof harnessCatalog>[number];

const sections = {
  bundle: 'Recommended', skill: 'Skills', command: 'Commands', rule: 'Rules', agent: 'Agent briefs', config: 'Configuration', hook: 'Integration references',
};
const kinds = { bundle: 'Preset', skill: 'Skill', command: 'Command', rule: 'Rule', agent: 'Brief', config: 'Config', hook: 'Hook' };

// The catalog IDs are stable API; these labels explain the task to a person.
const descriptions: Record<string, [string, string]> = {
  recommended: ['Sketchbook essentials', 'Four workflows for drafting, building, and reviewing components.'],
  hammock: ['Hammock', 'Think through changes and spot needless complexity.'],
  'review-rangers': ['Review Rangers', 'Structure a review and involve independent reviewers when available.'],
  foundations: ['Foundations', 'Set up, import, or improve your design tokens.'],
  'contract-author': ['Contract Author', 'Define a component’s API, states, behavior, and accessibility.'],
  'component-builder': ['Component Builder', 'Build and test a component from its approved contract.'],
  'a11y-checker': ['Accessibility Checker', 'Check a component against WCAG 2.2 AA.'],
  'design-figma': ['Figma Sync', 'Sync and verify your Figma file (requires Figma MCP).'],
  'forge-me-a-skill': ['Forge Me a Skill', 'Write or audit a portable skill.'],
  'playwright-worker': ['Playwright Worker', 'Write and run browser behavior tests.'],
  'web-components-best-practices': ['Web Component Practices', 'Choose how to expose an API, compose slots, and manage rendering in a Web Component.'],
  kits: ['Kits', 'Add and adapt page templates.'],
  onboarding: ['Onboarding', 'Choose a starter and learn your next step.'],
  'security-guardian': ['Security Guardian', 'Review dependencies, secrets, and sensitive files before publishing.'],
  sketchbook: ['Sketchbook Workflows', 'Find the right design-system workflow for your task.'],
  'command:add': ['Add Component', 'Install an existing component or scaffold a new one.'],
  'command:foundations': ['Work on Foundations', 'Choose, import, or refine your design foundations.'],
  'command:roast-foundations': ['Critique Foundations', 'Review foundations against standards and accessibility with concrete evidence.'],
  'agent:a11y-checker/a11y-auditor': ['Accessibility Auditor', 'Independently audit a component before it moves to stable.'],
  'agent:component-builder/parity-auditor': ['Parity Auditor', 'Compare the component’s implementation with its approved contract.'],
  'agent:contract-author/extractor': ['Contract Researcher', 'Gather component evidence from references, standards, and the codebase.'],
  'agent:foundations/foundations-critic': ['Foundations Critic', 'Independently review the design foundations and record recommendations.'],
  'agent:foundations/token-mapper': ['Token Mapper', 'Map imported token names to the semantic interface without applying changes.'],
  'rule:comment-minimalism': ['Comment Minimalism', 'Explain why a decision matters, not what the code already says.'],
  'rule:contract-first': ['Contract First', 'Write and validate the contract before building the component.'],
  'rule:figma-fidelity': ['Figma Fidelity', 'Verify the design file against Storybook and the component spec.'],
  'rule:form-associated-controls': ['Form Controls', 'Keep keyboard, validation, submission, and reset behavior correct.'],
  'rule:no-ai-attribution': ['No AI Attribution', 'Keep project output and git history free of AI attribution.'],
  'rule:planning-gate': ['Planning Gate', 'Get approval before writing tests or implementation.'],
  'rule:spec-is-source': ['Spec Is the Source', 'Edit the source, not generated output.'],
  'rule:test-first': ['Test First', 'Write and observe the failing behavior test before implementation.'],
  'rule:tokens-through-the-harness': ['Token Workflow', 'Change tokens through their source and regenerate outputs.'],
  'config:hammock/default-mode': ['Hammock Default Mode', 'Set the project’s default without editing user settings.'],
};

const titleCase = (value: string) => value.replace(/\.md$|\.json$/g, '').replace(/(^|[-/])([a-z])/g, (_, separator: string, char: string) => `${separator ? ' ' : ''}${char.toUpperCase()}`);
const clean = (value: string) => value.replaceAll('`', '').replace(/\s+/g, ' ').trim();
export function clipCatalogLine(text: string, width: number) {
  return text.length > width ? `${text.slice(0, width - 1).trimEnd()}…` : text;
}

export function catalogRows(entries: Entry[]) {
  const order = Object.keys(sections);
  return [...entries].sort((a, b) => Number(Boolean(a.integration)) - Number(Boolean(b.integration))
    || order.indexOf(a.kind) - order.indexOf(b.kind) || a.id.localeCompare(b.id, 'en')).map((entry, index) => {
    const [title, summary] = descriptions[entry.id] ?? [
      titleCase(entry.id.split(':').at(-1) ?? entry.id),
      entry.integration ? 'Copy for reference; does not activate anything.' : clean(entry.summary),
    ];
    return { ...entry, number: index + 1, title, summary, label: kinds[entry.kind], section: entry.integration ? sections.hook : sections[entry.kind] };
  });
}

export type CatalogRow = ReturnType<typeof catalogRows>[number];

export function moduleContents(row: CatalogRow): string {
  if (row.kind !== 'skill') return '';
  const includes = ['workflow'];
  if (row.files.some(({ path }) => path.includes('/agents/') || (row.id === 'review-rangers' && path.endsWith('-template.md')))) includes.push('reviewer briefs');
  if (row.files.some(({ path }) => path.includes('/scripts/'))) includes.push('scripts');
  if (row.files.some(({ path }) => path.includes('/assets/') || path.includes('/references/'))) includes.push('supporting files');
  if (row.files.some(({ projectSetting }) => projectSetting)) includes.push('project settings');
  return `Includes: ${includes.join(', ')}.`;
}

export function catalogList(rows: CatalogRow[], { details, width }: { details: boolean; width: number }) {
  const lines: string[] = [];
  let section: string | undefined;
  for (const row of rows) {
    if (row.partOf) continue;
    if (!details && row.integration) continue;
    if (row.section !== section) {
      section = row.section;
      lines.push('', `${section}:`);
    }
    const id = `  ${row.id}`;
    const summary = clipCatalogLine(row.summary, Math.max(20, width - id.length - 3));
    lines.push(details ? `${id} — ${row.summary}` : `${id}  ${summary}`);
  }
  const references = rows.filter((row) => row.integration).length;
  if (!details && references) lines.push('', `Integration references: ${references} examples (not activated). See sketchbook harness list --details.`);
  lines.push('', 'Browse and select: sketchbook harness', 'Inspect: sketchbook harness show <id>', 'Preview: sketchbook harness add <id...> --dry-run');
  return lines;
}
